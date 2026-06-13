<script lang="ts">
	// src/routes/match/+page.svelte
	// Complete scoring view: portrait/landscape responsive layout (D-02).
	// Wires all input components to matchStore. Wake lock acquired on mount.
	import { onMount } from 'svelte';
	import { matchStore } from '../../stores/match.svelte.js';
	import { reduce } from '../../engine/reducer.js';
	import { acquireWakeLock, releaseWakeLock } from '../../lib/wake-lock.svelte.js';
	import { loadAudioPrefs, saveAudioPref } from '../../lib/audio-prefs.js';
	import { initVoices, announceVisit } from '../../lib/audio-caller.js';
	import { playSfx } from '../../lib/audio-sfx.js';
	import { base } from '$app/paths';
	import { getSuggestion } from '../../engine/checkout.js';
	import ScorePanel from '../../ui/input/ScorePanel.svelte';
	import VisitStrip from '../../ui/input/VisitStrip.svelte';
	import Dartboard from '../../ui/input/Dartboard.svelte';
	import Numpad from '../../ui/input/Numpad.svelte';
	import CorrectionWindow from '../../ui/input/CorrectionWindow.svelte';
	import StatDrawer from '../../ui/input/StatDrawer.svelte';
	import DartsAtDoubleDialog from '../../ui/input/DartsAtDoubleDialog.svelte';
	import MatchWinOverlay from '../../ui/overlays/MatchWinOverlay.svelte';
	import RecordOverlay from '../../ui/overlays/RecordOverlay.svelte';
	import PauseOverlay from '../../ui/overlays/PauseOverlay.svelte';
	import SpectatorChooser from '../../ui/display/SpectatorChooser.svelte';
	import type { DartScore } from '../../engine/types.js';

	// ── Audio prefs — read once for stable booleans; volume is $state for live slider ──
	const { callerEnabled, callerLang, sfxEnabled } = loadAudioPrefs();
	let audioVolume = $state(loadAudioPrefs().audioVolume);

	// ── Record detection preload (ACHV-01 / D-09) ─────────────────────────────
	// Load lifetime stats for profile players once at match start so #detectRecords
	// has a comparison baseline. Guard: only load when players are present.
	onMount(() => {
		if (matchStore.state.players.length > 0) {
			matchStore.loadRecords(matchStore.state);
		}
		// AUD-01: warm the voice list so the first announcement has a voice ready.
		initVoices();
	});

	// ── SFX: pendingRecords trigger (AUD-02) ──────────────────────────────────
	// 180 SFX takes priority; any other record type fires 'record' sound.
	// High-finish SFX for highest-checkout record with value ≥ 100 also fired here.
	$effect(() => {
		const records = matchStore.pendingRecords;
		if (records.length === 0) return;

		const has180 = records.some(r => r.type === '180');
		if (has180) {
			playSfx('180', sfxEnabled, audioVolume, base);
		} else {
			playSfx('record', sfxEnabled, audioVolume, base);
		}

		const hasHighFinish = records.some(r => r.type === 'highest-checkout' && (r.value ?? 0) >= 100);
		if (hasHighFinish) {
			playSfx('highfinish', sfxEnabled, audioVolume, base);
		}
	});

	// ── High-finish SFX for checkouts ≥ 100 that are NOT new personal records ─
	// pendingRecords only contains highest-checkout when it is a new personal best;
	// non-record checkouts ≥ 100 are caught here by watching legCompleted length (A4).
	let lastLegCounts = $state<Record<string, number>>({});
	// Tracks visit count per player at the time their last leg ended (CR-01 fix).
	let lastLegEndVisitCounts = $state<Record<string, number>>({});

	$effect(() => {
		const state = matchStore.state;
		if (state.phase !== 'playing') return;

		for (const player of state.players) {
			const prevLegCount = lastLegCounts[player.id] ?? 0;
			const nextLegCount = player.legCompleted?.length ?? 0;
			if (nextLegCount > prevLegCount) {
				const legStartVisitIdx = lastLegEndVisitCounts[player.id] ?? 0;
				lastLegCounts = { ...lastLegCounts, [player.id]: nextLegCount };
				lastLegEndVisitCounts = { ...lastLegEndVisitCounts, [player.id]: player.visits.length };

				// Only fire if the record SFX handler above won't already cover it.
				const alreadyCovered = matchStore.pendingRecords.some(
					r => r.type === 'highest-checkout' && r.playerId === player.id && (r.value ?? 0) >= 100
				);
				if (alreadyCovered) continue;

				// Inspect only visits from the just-completed leg (CR-01).
				const legVisits = player.visits.slice(legStartVisitIdx);
				for (const v of legVisits) {
					if (v.wasCheckout === true) {
						const score = v.darts.length > 0
							? v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
							: null;
						if (score !== null && score >= 100) {
							playSfx('highfinish', sfxEnabled, audioVolume, base);
						}
					}
				}
				return;
			}
		}
	});

	// ── Wake lock (INP-05) ─────────────────────────────────────────────────
	$effect(() => {
		acquireWakeLock();

		function handleVisibility() {
			if (document.visibilityState === 'visible') {
				acquireWakeLock();
			}
		}

		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			releaseWakeLock();
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});

	// ── Auto-pause countdown (FLOW-02 / D-08) ────────────────────────────────
	// Runs only in the scoring window — /display is a pure subscriber (no drift).
	// Modeled on the wake-lock $effect: cleanup return clears the interval on
	// unmount and whenever pauseActive flips false (Pitfall 7 leak prevention).
	$effect(() => {
		if (!matchStore.pauseActive) return;
		const id = setInterval(() => {
			matchStore.decrementPause();
		}, 1000);
		return () => clearInterval(id);
	});

	// ── Numpad toggle: remembers last-used mode per player (D-07) ──────────
	// keyed by activePlayerIndex, default to 'board'
	let inputModeByPlayer = $state<Record<number, 'board' | 'numpad'>>({});

	let inputMode = $derived(
		inputModeByPlayer[matchStore.state.activePlayerIndex] ?? 'board'
	);

	function setInputMode(mode: 'board' | 'numpad') {
		inputModeByPlayer = {
			...inputModeByPlayer,
			[matchStore.state.activePlayerIndex]: mode
		};
	}

	// ── Correction window + caller announcement (CR-04 / AUD-01) ────────────
	// Tracks completed visits per-player so both the correction window and the
	// caller announcement fire for every visit, not just the first of the match.

	interface PendingCorrection {
		darts: DartScore[];
		isBust: boolean;
		total: number;
	}

	let pendingCorrection = $state<PendingCorrection | null>(null);
	// Per-player visit counts keyed by player.id (CR-04 fix: was a single cross-player counter)
	let lastVisitCounts = $state<Record<string, number>>({});

	// Watch for completed visits: open correction window and announce via caller.
	$effect(() => {
		const state = matchStore.state;
		if (state.phase !== 'playing') return;

		for (const player of state.players) {
			const prevCount = lastVisitCounts[player.id] ?? 0;
			if (player.visits.length > prevCount && pendingCorrection === null) {
				const lastVisit = player.visits[player.visits.length - 1];
				const total = lastVisit.darts.reduce(
					(s, d) => s + d.multiplier * d.segment,
					0
				);
				// Update immutably so Svelte reactivity fires
				lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
				pendingCorrection = {
					darts: lastVisit.darts,
					isBust: lastVisit.bust,
					total
				};

				// AUD-01: announce non-bust visits. Caller fires here (same detection point)
				// so visit count and caller stay in sync without a second $effect.
				if (!lastVisit.bust) {
					const preVisitRemaining = player.remaining + total;
					const suggestion = getSuggestion(preVisitRemaining, state.config.outRule);
					const checkoutNumber = suggestion !== null ? preVisitRemaining : null;
					announceVisit(total, checkoutNumber, callerLang, callerEnabled, audioVolume);
				}
				return;
			}
		}
	});

	// CorrectionWindow is the sole CONFIRM_VISIT dispatcher (it owns the 2.5s timer).
	// dismissCorrection only clears pendingCorrection so the overlay unmounts.
	function dismissCorrection() {
		pendingCorrection = null;
	}

	// ── Darts-at-double dialog (D-08, INP-03) ─────────────────────────────
	// Show after a numpad visit that wins a leg.
	// We detect this by watching for phase 'leg-complete' after a NUMPAD_VISIT.
	let pendingNumpadTotal = $state<number | null>(null);
	let showDartsAtDouble = $state(false);

	// For a finishing visit (prevRemaining === total), use a side-effect-free trial reduce
	// to detect whether this finish ends the match (phase === 'match-complete').
	// Match-winning finish: dispatch immediately with dartsAtDouble:0 — MatchWinOverlay owns
	// the screen and the dialog (z-index 20) would be unclickable behind it (z-index 100).
	// Locked 01-07 decision; D-08 scopes the darts-at-double prompt to continuing legs only.
	// Leg-winning but not match-ending finish: defer until dialog confirms (INP-03 / D-08).
	// Non-finishing visits: dispatch immediately, no dialog (dartsAtDouble=0 per D-08).
	function handleNumpadVisit(total: number) {
		const prevPhase = matchStore.state.phase;
		const prevRemaining = matchStore.activePlayer?.remaining ?? 0;

		const isFinish = prevRemaining === total && prevPhase === 'playing';

		if (isFinish) {
			// Trial reduce: read-only, never mutates matchStore.state (reducer is pure)
			const prospective = reduce(matchStore.state, { type: 'NUMPAD_VISIT', total });
			if (prospective.phase === 'match-complete') {
				// Match-winning visit: dispatch immediately, skip dialog
				matchStore.dispatch({ type: 'NUMPAD_VISIT', total, dartsAtDouble: 0 });
			} else {
				// Leg win that continues the match: defer dispatch until dialog confirms
				pendingNumpadTotal = total;
				showDartsAtDouble = true;
			}
		} else {
			// Non-finishing visit: dispatch immediately, no dialog (dartsAtDouble=0 per D-08)
			matchStore.dispatch({ type: 'NUMPAD_VISIT', total });
		}
	}

	function handleDartsAtDoubleConfirm(dartsAtDouble: number, dartsUsed: 1 | 2 | 3) {
		// Dispatch the deferred finishing NUMPAD_VISIT with the chosen darts-at-double value.
		// The reducer's finishing path records dartsAtDouble in the visit and event log (INP-03).
		matchStore.dispatch({
			type: 'NUMPAD_VISIT',
			total: pendingNumpadTotal!,
			dartsUsed,
			dartsAtDouble
		});
		showDartsAtDouble = false;
		pendingNumpadTotal = null;
	}

	// Undo button
	function undo() {
		matchStore.dispatch({ type: 'UNDO' });
	}
</script>

<div class="match-view">
	<!-- Score panel + visit strip + undo -->
	<div class="panel-area">
		<ScorePanel />
		<StatDrawer />

		<!-- Correction window overlays the panel area (not the board) -->
		<div class="panel-relative">
			<VisitStrip />
			<div class="undo-bar">
				<button
					class="toggle-btn"
					onclick={() => setInputMode(inputMode === 'board' ? 'numpad' : 'board')}
				>
					{inputMode === 'board' ? '🔢 Numpad' : '🎯 Board'}
				</button>
				<div class="volume-row" aria-label="Lautstärke">
					<label class="volume-label" for="match-volume-slider">🔊</label>
					<input
						id="match-volume-slider"
						type="range"
						min="0"
						max="1"
						step="0.05"
						bind:value={audioVolume}
						oninput={() => saveAudioPref('audioVolume', audioVolume)}
						aria-label="Lautstärke"
						class="volume-slider"
					/>
				</div>
				<button class="undo-btn" onclick={undo} aria-label="Letzten Dart rückgängig machen">
					Rückgängig
				</button>
			</div>

			{#if pendingCorrection !== null}
				<CorrectionWindow
					visible={true}
					visitDarts={pendingCorrection.darts}
					isBust={pendingCorrection.isBust}
					visitTotal={pendingCorrection.total}
					ondismiss={dismissCorrection}
				/>
			{/if}
		</div>
	</div>

	<!-- Board or numpad area -->
	<div class="board-area">
		{#if inputMode === 'board'}
			<Dartboard />
		{:else}
			<Numpad onconfirm={handleNumpadVisit} />
		{/if}
	</div>
</div>

<!-- Overlays (rendered outside the layout flow) -->
<DartsAtDoubleDialog
	visible={showDartsAtDouble}
	pendingTotal={pendingNumpadTotal ?? 0}
	onconfirm={handleDartsAtDoubleConfirm}
/>

<!-- D-08: when records coincide with a win, fold into the win overlay as a badge.
     Otherwise mount a standalone RecordOverlay that auto-dismisses after 2.5s. -->
{#if matchStore.isMatchComplete}
	<MatchWinOverlay
		recordBadge={matchStore.pendingRecords.length > 0
			? matchStore.pendingRecords.map(r => r.text).join(' · ')
			: null}
	/>
{:else}
	<MatchWinOverlay />
{/if}

{#if matchStore.pendingRecords.length > 0 && matchStore.state.phase === 'playing'}
	<RecordOverlay
		records={matchStore.pendingRecords.map(r => r.text)}
		ondismiss={() => { matchStore.pendingRecords = []; }}
	/>
{/if}

<!-- FLOW-02: Auto-pause overlay (z-60) — above RecordOverlay (z-50), below MatchWinOverlay (z-100).
     Countdown runs via the $effect above; "Weiter" calls resumePause() to dismiss early. -->
<PauseOverlay
	pauseActive={matchStore.pauseActive}
	remainingSeconds={matchStore.pauseRemainingSeconds}
	showResume={true}
	onresume={() => matchStore.resumePause()}
/>

<SpectatorChooser />

<style>
	.match-view {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100%;
		overflow: hidden;
		background: #111318;
		color: #f0f0f0;
	}

	.panel-area {
		flex: 0 0 auto;
		position: relative;
	}

	.panel-relative {
		position: relative;
	}

	.board-area {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm, 8px);
	}

	.undo-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px var(--space-md, 16px);
		gap: var(--space-sm, 8px);
	}

	.toggle-btn {
		height: 40px;
		padding: 0 var(--space-md, 16px);
		background: #1e2027;
		border: 1px solid #444444;
		border-radius: 6px;
		color: #f0f0f0;
		font-size: 14px;
		cursor: pointer;
	}

	.toggle-btn:active {
		background: #2d2d2d;
	}

	.undo-btn {
		height: 48px;
		padding: 0 var(--space-lg, 24px);
		background: transparent;
		border: 1px solid #e8a020;
		border-radius: 6px;
		color: #e8a020;
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		min-width: 120px;
	}

	.undo-btn:active {
		background: rgba(232, 160, 32, 0.1);
	}

	/* Volume row — compact slider between toggle and undo buttons */
	.volume-row {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: 1;
		min-width: 0;
		padding: 0 var(--space-sm, 8px);
	}

	.volume-label {
		font-size: 14px;
		flex-shrink: 0;
	}

	.volume-slider {
		flex: 1;
		min-width: 0;
		height: 44px;
		accent-color: #e8a020;
		cursor: pointer;
	}

	/* Landscape layout (D-02): score panel left 33%, board right 67% */
	@media (orientation: landscape) {
		.match-view {
			flex-direction: row;
		}

		.panel-area {
			flex: 0 0 33%;
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.board-area {
			flex: 0 0 67%;
		}
	}
</style>
