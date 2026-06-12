<script lang="ts">
	// src/ui/overlays/MatchWinOverlay.svelte
	// Full-screen win overlay shown when matchStore.isMatchComplete.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { matchStore } from '../../stores/match.svelte.js';

	interface Props {
		/** D-08: record text folded into the overlay when a record coincides with match win. */
		recordBadge?: string | null;
	}

	let { recordBadge = null }: Props = $props();

	// Winner is the last active player when match completed
	let winnerName = $derived(
		matchStore.isMatchComplete ? matchStore.activePlayer?.name ?? '' : ''
	);

	// WR-04: snapshot the record badge locally and clear matchStore.pendingRecords once
	// the match-complete overlay has rendered. The store is the source of recordBadge
	// (via the route), so we copy the text into local state first, then clear — otherwise
	// stale pendingRecords would leak past "Neues Spiel" navigation into the next match.
	let displayBadge = $state<string | null>(null);
	$effect(() => {
		if (matchStore.isMatchComplete) {
			if (recordBadge && displayBadge === null) {
				displayBadge = recordBadge;
			}
			if (matchStore.pendingRecords.length > 0) {
				matchStore.pendingRecords = [];
			}
		} else {
			// Reset for the next match once the overlay is no longer showing.
			displayBadge = null;
		}
	});

	function newGame() {
		goto(`${base}/setup`);
	}
</script>

{#if matchStore.isMatchComplete}
	<div class="win-overlay" role="dialog" aria-modal="true" aria-label="{winnerName} gewinnt">
		<div class="win-content">
			<h1 class="win-heading">{winnerName} gewinnt!</h1>
			<p class="win-body">Das Spiel ist beendet.</p>
			{#if displayBadge}
				<p class="record-badge">{displayBadge}</p>
			{/if}
			<button class="new-game-btn" onclick={newGame}>
				Neues Spiel
			</button>
		</div>
	</div>
{/if}

<style>
	.win-overlay {
		position: fixed;
		inset: 0;
		background: rgba(17, 19, 24, 0.96);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 300ms ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.win-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl, 32px);
		padding: var(--space-xl, 32px);
		text-align: center;
	}

	.win-heading {
		font-size: 48px;
		font-weight: 600;
		color: #e8a020;
		line-height: 1;
		margin: 0;
	}

	.win-body {
		font-size: 16px;
		color: #f0f0f0;
		margin: 0;
	}

	.record-badge {
		margin: var(--space-sm, 8px) 0 0;
		font-size: 16px;
		font-weight: 400;
		color: #e8a020;
	}

	.new-game-btn {
		height: 56px;
		padding: 0 var(--space-xl, 32px);
		background: #e8a020;
		border: none;
		border-radius: 6px;
		color: #111318;
		font-size: 18px;
		font-weight: 600;
		cursor: pointer;
		min-width: 200px;
		transition: opacity 150ms ease;
	}

	.new-game-btn:active {
		opacity: 0.85;
	}
</style>
