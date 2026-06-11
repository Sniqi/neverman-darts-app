<script lang="ts">
	// src/routes/match/+page.svelte
	// Complete scoring view: portrait/landscape responsive layout (D-02).
	// Wires all input components to matchStore. Wake lock acquired on mount.
	import { matchStore } from '../../stores/match.svelte.js';
	import { reduce } from '../../engine/reducer.js';
	import { acquireWakeLock, releaseWakeLock } from '../../lib/wake-lock.svelte.js';
	import ScorePanel from '../../ui/input/ScorePanel.svelte';
	import VisitStrip from '../../ui/input/VisitStrip.svelte';
	import Dartboard from '../../ui/input/Dartboard.svelte';
	import Numpad from '../../ui/input/Numpad.svelte';
	import CorrectionWindow from '../../ui/input/CorrectionWindow.svelte';
	import DartsAtDoubleDialog from '../../ui/input/DartsAtDoubleDialog.svelte';
	import MatchWinOverlay from '../../ui/overlays/MatchWinOverlay.svelte';
	import type { DartScore } from '../../engine/types.js';

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

	// ── Correction window state ────────────────────────────────────────────
	// We track completed visits per-player (CR-04) so the window fires for every
	// visit, not just the first of the match.

	interface PendingCorrection {
		darts: DartScore[];
		isBust: boolean;
		total: number;
	}

	let pendingCorrection = $state<PendingCorrection | null>(null);
	// Per-player visit counts keyed by player.id (CR-04 fix: was a single cross-player number)
	let lastVisitCounts = $state<Record<string, number>>({});

	// Watch for completed visits: compare each player's visit count against the per-player record
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

<MatchWinOverlay />

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

	/* Landscape layout (D-02): score panel left 38%, board right 62% */
	@media (orientation: landscape) {
		.match-view {
			flex-direction: row;
		}

		.panel-area {
			flex: 0 0 38%;
			display: flex;
			flex-direction: column;
			overflow-y: auto;
		}

		.board-area {
			flex: 0 0 62%;
		}
	}
</style>
