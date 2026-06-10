<script lang="ts">
	// src/routes/match/+page.svelte
	// Real scoring view: portrait/landscape responsive layout (D-02).
	// Wires ScorePanel, VisitStrip, CheckoutSuggestion, Dartboard, Numpad,
	// CorrectionWindow, DartsAtDoubleDialog, MatchWinOverlay, wake lock.
	// Task 1 delivers the core play loop; Task 2 adds the remaining components.
	import { matchStore } from '../../stores/match.svelte.js';
	import ScorePanel from '../../ui/input/ScorePanel.svelte';
	import VisitStrip from '../../ui/input/VisitStrip.svelte';
	import Dartboard from '../../ui/input/Dartboard.svelte';

	// Task 2 components (imported after creation)
	// Numpad, CorrectionWindow, DartsAtDoubleDialog, MatchWinOverlay, wake lock
	// are added in Task 2 below.

	// Undo dispatcher for the dedicated undo button
	function undo() {
		matchStore.dispatch({ type: 'UNDO' });
	}
</script>

<div class="match-view">
	<!-- Score panel: all players with active highlight -->
	<div class="panel-area">
		<ScorePanel />
		<VisitStrip />
		<div class="undo-bar">
			<button class="undo-btn" onclick={undo} aria-label="Letzten Dart rückgängig machen">
				Rückgängig
			</button>
		</div>
	</div>

	<!-- Dartboard area -->
	<div class="board-area">
		<Dartboard />
	</div>
</div>

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
		justify-content: flex-end;
		padding: 4px var(--space-md, 16px);
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
