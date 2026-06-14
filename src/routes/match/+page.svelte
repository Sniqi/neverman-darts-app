<script lang="ts">
	// src/routes/match/+page.svelte
	// Complete scoring view: portrait/landscape responsive layout (D-02).
	// Wires all input components to matchStore. Wake lock acquired on mount.
	import { onMount } from 'svelte';
	import { matchStore } from '../../stores/match.svelte.js';
	import { reduce } from '../../engine/reducer.js';
	import { acquireWakeLock, releaseWakeLock } from '../../lib/wake-lock.svelte.js';
	import { loadAudioPrefs, saveAudioPref } from '../../lib/audio-prefs.js';
	import { initVoices, announceVisit, announceGameStart, announceNoScore } from '../../lib/audio-caller.js';
	import { playSfx } from '../../lib/audio-sfx.js';
	import { base } from '$app/paths';
	import { getSuggestion } from '../../engine/checkout.js';
	import ScorePanel from '../../ui/input/ScorePanel.svelte';
	import Dartboard from '../../ui/input/Dartboard.svelte';
	import Numpad from '../../ui/input/Numpad.svelte';
	import StatDrawer from '../../ui/input/StatDrawer.svelte';
	import DartsAtDoubleDialog from '../../ui/input/DartsAtDoubleDialog.svelte';
	import MatchWinOverlay from '../../ui/overlays/MatchWinOverlay.svelte';
	import RecordOverlay from '../../ui/overlays/RecordOverlay.svelte';
	import PauseOverlay from '../../ui/overlays/PauseOverlay.svelte';
	import SpectatorChooser from '../../ui/display/SpectatorChooser.svelte';
	import type { DartScore } from '../../engine/types.js';

	// ── Audio prefs — enabled flags + volumes are $state so the in-match audio bar updates live ──
	const prefs = loadAudioPrefs();
	const callerLang = prefs.callerLang;
	let callerEnabled = $state(prefs.callerEnabled);
	let sfxEnabled = $state(prefs.sfxEnabled);
	let callerVolume = $state(prefs.callerVolume);
	let musicVolume = $state(prefs.musicVolume);

	// ── Record detection preload (ACHV-01 / D-09) ─────────────────────────────
	// Load lifetime stats for profile players once at match start so #detectRecords
	// has a comparison baseline. Guard: only load when players are present.
	onMount(() => {
		if (matchStore.state.players.length > 0) {
			matchStore.loadRecords(matchStore.state);
		}
		// AUD-01: warm the voice list so the first announcement has a voice ready.
		initVoices();

		// AUD-03: announce game start once when no visits have been thrown yet.
		const state = matchStore.state;
		const isFreshMatch = state.phase === 'playing' &&
			state.players.every(p => p.visits.length === 0);
		if (isFreshMatch && callerEnabled) {
			const firstPlayer = state.players[state.activePlayerIndex];
			if (firstPlayer) {
				announceGameStart(firstPlayer.name, base, callerVolume);
			}
		}
	});

	// ── Music: game win / set win / pause (AUD-03) ───────────────────────────
	// Plain (non-reactive) vars track previous state — no $state needed because
	// these are write-only inside the effects and never read by the template.
	let _prevPhase = matchStore.state.phase;
	let _prevPauseActive = matchStore.pauseActive;
	let _prevSetsWon: Record<string, number> = {};

	$effect(() => {
		const phase = matchStore.state.phase;
		if (phase === 'match-complete' && _prevPhase !== 'match-complete') {
			playSfx('game_win', sfxEnabled, musicVolume, base);
		}
		_prevPhase = phase;
	});

	$effect(() => {
		const active = matchStore.pauseActive;
		if (active && !_prevPauseActive) {
			playSfx('pause', sfxEnabled, musicVolume, base);
		}
		_prevPauseActive = active;
	});

	$effect(() => {
		const state = matchStore.state;
		if (!state.config.setsEnabled) return;
		for (const player of state.players) {
			const prev = _prevSetsWon[player.id] ?? 0;
			const curr = player.setsWon ?? 0;
			if (curr > prev) {
				_prevSetsWon[player.id] = curr;
				playSfx('set_win', sfxEnabled, musicVolume, base);
				return;
			}
			_prevSetsWon[player.id] = curr;
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

	let activePl = $derived(matchStore.activePlayer);
	let lastVisit = $derived(activePl?.visits.at(-1));
	let isBust = $derived(!!(lastVisit?.bust && matchStore.currentVisit.length === 0));
	let displayDarts = $derived(isBust ? (lastVisit?.darts ?? []) : matchStore.currentVisit);

	function setInputMode(mode: 'board' | 'numpad') {
		inputModeByPlayer = {
			...inputModeByPlayer,
			[matchStore.state.activePlayerIndex]: mode
		};
	}

	// ── Caller announcement (AUD-01) ─────────────────────────────────────────
	// Fires for every completed visit. Per-player visit counts keyed by player.id.
	let lastVisitCounts = $state<Record<string, number>>({});

	$effect(() => {
		const state = matchStore.state;
		if (state.phase !== 'playing') return;

		for (const player of state.players) {
			const prevCount = lastVisitCounts[player.id] ?? 0;
			if (player.visits.length > prevCount) {
				const lastVisit = player.visits[player.visits.length - 1];
				const total = lastVisit.darts.reduce(
					(s, d) => s + d.multiplier * d.segment,
					0
				);
				lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };

				if (lastVisit.bust || total === 0) {
					announceNoScore(callerEnabled, callerLang, base, callerVolume);
				} else {
					const nextPlayer = state.players[state.activePlayerIndex];
					const suggestion = getSuggestion(nextPlayer.remaining, state.config.outRule);
					const checkoutNumber = suggestion !== null ? nextPlayer.remaining : null;
					announceVisit(total, checkoutNumber, callerLang, callerEnabled, callerVolume, base, nextPlayer.name);
				}
				return;
			}
		}
	});

	function formatDart(dart: DartScore): string {
		if (dart.segment === 0) return '0';
		if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
		if (dart.multiplier === 1 && dart.segment === 25) return 'Bull 25';
		const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
		return `${prefix}${dart.segment}`;
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

		<div class="control-deck">
			<div class="undo-bar">
				<button
					class="toggle-btn"
					onclick={() => setInputMode(inputMode === 'board' ? 'numpad' : 'board')}
				>
					{inputMode === 'board' ? '🔢 Numpad' : '🎯 Board'}
				</button>
				<button class="undo-btn" onclick={undo} aria-label="Letzten Dart rückgängig machen">
					Rückgängig
				</button>
			</div>

			<div class="audio-bar">
				<div class="audio-row">
					<label class="audio-label" for="match-caller-toggle">Caller</label>
					<input
						id="match-caller-toggle"
						type="checkbox"
						role="switch"
						checked={callerEnabled}
						onchange={(e) => { callerEnabled = e.currentTarget.checked; saveAudioPref('callerEnabled', callerEnabled); }}
						class="audio-check"
					/>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						bind:value={callerVolume}
						oninput={() => saveAudioPref('callerVolume', callerVolume)}
						aria-label="Caller Lautstärke"
						class="audio-slider"
						disabled={!callerEnabled}
					/>
					<span class="audio-pct">{Math.round(callerVolume * 100)}%</span>
				</div>
				<div class="audio-row">
					<label class="audio-label" for="match-sfx-toggle">Musik</label>
					<input
						id="match-sfx-toggle"
						type="checkbox"
						role="switch"
						checked={sfxEnabled}
						onchange={(e) => { sfxEnabled = e.currentTarget.checked; saveAudioPref('sfxEnabled', sfxEnabled); }}
						class="audio-check"
					/>
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						bind:value={musicVolume}
						oninput={() => saveAudioPref('musicVolume', musicVolume)}
						aria-label="Musik Lautstärke"
						class="audio-slider"
						disabled={!sfxEnabled}
					/>
					<span class="audio-pct">{Math.round(musicVolume * 100)}%</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Board or numpad area -->
	<div class="board-area">
		<div class="dart-column" class:bust={isBust}>
			{#each [0, 1, 2] as slotIdx}
				{@const dart = displayDarts[slotIdx]}
				<button
					class="dart-pill"
					class:filled={!!dart}
					onclick={undo}
					disabled={matchStore.currentVisit.length === 0}
					aria-label={dart ? `Rückgängig: ${formatDart(dart)}` : 'Leerer Slot'}
				>
					{dart ? formatDart(dart) : '—'}
				</button>
			{/each}
		</div>
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

<a href="{base}/" class="back-btn" aria-label="Zurück zur Startseite">✕</a>

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
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		padding: var(--space-sm, 8px);
	}

	.board-area {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: var(--space-sm, 8px);
	}

	.dart-column {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
	}

	.dart-column.bust .dart-pill {
		border-color: rgba(192, 57, 43, 0.5);
		color: #c0392b;
	}

	.dart-pill {
		width: 76px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1e2027;
		border: 1px solid #444444;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 400;
		color: #555;
		cursor: pointer;
		transition: background 120ms ease, border-color 120ms ease;
	}

	.dart-pill.filled {
		border-color: #e8a020;
		color: #f0f0f0;
		font-weight: 600;
	}

	.dart-pill:not(:disabled):active {
		background: #2d2d2d;
	}

	.dart-pill:disabled {
		cursor: default;
	}

	/* Control deck — groups input toggle, undo, and audio into one bordered card */
	.control-deck {
		flex: 0 0 auto;
		background: var(--surface, #1e2027);
		border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-md, 12px);
		overflow: hidden;
	}

	.undo-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px var(--space-md, 16px);
		gap: var(--space-sm, 8px);
		border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
	}

	.toggle-btn {
		height: 40px;
		padding: 0 var(--space-md, 16px);
		background: var(--surface-2, #262932);
		border: 1px solid var(--line-strong, rgba(255, 255, 255, 0.14));
		border-radius: var(--radius-sm, 8px);
		color: var(--text, #f0f0f0);
		font-size: 14px;
		cursor: pointer;
	}

	.toggle-btn:active {
		background: #2d2d2d;
	}

	.undo-btn {
		height: 44px;
		padding: 0 var(--space-lg, 24px);
		background: transparent;
		border: 1px solid var(--accent, #e8a020);
		border-radius: var(--radius-sm, 8px);
		color: var(--accent, #e8a020);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		min-width: 120px;
	}

	.undo-btn:active {
		background: rgba(232, 160, 32, 0.1);
	}

	/* Audio controls — lower section of the control deck */
	.audio-bar {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px var(--space-md, 16px);
		background: var(--surface, #1e2027);
	}

	.audio-row {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 36px;
	}

	.audio-label {
		font-size: 13px;
		color: #888;
		width: 42px;
		flex-shrink: 0;
	}

	.audio-check {
		width: 36px;
		height: 20px;
		flex-shrink: 0;
		cursor: pointer;
		accent-color: #e8a020;
	}

	.audio-slider {
		flex: 1;
		min-width: 0;
		height: 36px;
		accent-color: #e8a020;
		cursor: pointer;
	}

	.audio-slider:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.audio-pct {
		font-size: 12px;
		color: #666;
		width: 30px;
		text-align: right;
		flex-shrink: 0;
	}

	.back-btn {
		position: fixed;
		top: 10px;
		right: 10px;
		z-index: 30;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(28, 31, 39, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		color: #888;
		font-size: 14px;
		text-decoration: none;
		backdrop-filter: blur(6px);
		transition: color 150ms ease, border-color 150ms ease;
	}

	.back-btn:hover {
		color: #f0f0f0;
		border-color: rgba(255, 255, 255, 0.3);
	}

	/* Landscape layout (D-02): score panel left ~34%, board right.
	   The left column is a fixed vertical stack: scores (never shrink) on top,
	   stat drawer flexes + scrolls in the middle, control deck pinned at bottom. */
	@media (orientation: landscape) {
		.match-view {
			flex-direction: row;
		}

		.panel-area {
			flex: 0 0 34%;
			display: flex;
			flex-direction: column;
			gap: 10px;
			padding: 12px;
			overflow: hidden;
		}

		.board-area {
			flex: 1 1 0;
			min-width: 0;
		}

		/* Pin the control deck to the bottom of the column. When the stat drawer
		   is open it consumes the free space (no effect); when collapsed the auto
		   margin pushes the deck down so it stays anchored. */
		.control-deck {
			margin-top: auto;
		}
	}
</style>
