<script lang="ts">
	// src/routes/match/+page.svelte
	// Complete scoring view: portrait/landscape responsive layout (D-02).
	// Wires all input components to matchStore. Wake lock acquired on mount.
	import { matchStore } from '../../stores/match.svelte.js';
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

	// Track when a numpad finish happens via a flag set in dispatchNumpad
	function handleNumpadVisit(total: number) {
		const prevPhase = matchStore.state.phase;
		const prevRemaining = matchStore.activePlayer?.remaining ?? 0;

		matchStore.dispatch({ type: 'NUMPAD_VISIT', total });

		// Show darts-at-double dialog only for a leg win that does NOT end the match.
		// If the match is now complete, the win overlay owns the screen — skip the dialog.
		if (prevRemaining === total && prevPhase === 'playing' && matchStore.state.phase !== 'match-complete') {
			pendingNumpadTotal = total;
			showDartsAtDouble = true;
		}
	}

	function handleDartsAtDoubleConfirm(dartsAtDouble: number, dartsUsed: 1 | 2 | 3) {
		// The NUMPAD_VISIT was already dispatched; just record darts-at-double
		// For now we just close the dialog — Phase 3 persistence will use this value
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
