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
			<button class="btn btn--cta" onclick={newGame}>
				Neues Spiel
			</button>
		</div>
	</div>
{/if}

<style>
	.win-overlay {
		position: fixed;
		inset: 0;
		background: var(--backdrop);
		backdrop-filter: blur(var(--blur-backdrop));
		-webkit-backdrop-filter: blur(var(--blur-backdrop));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn var(--dur-slow) var(--ease);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.win-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl);
		padding: var(--space-xl);
		text-align: center;
		background: var(--surface-2);
		border-radius: var(--radius-lg);
		border: 1px solid var(--line-strong);
		box-shadow: var(--shadow-panel), var(--edge-highlight);
		animation: winContentIn var(--dur-med) var(--ease-spring);
	}

	@keyframes winContentIn {
		from { opacity: 0; transform: scale(0.94) translateY(8px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	.win-heading {
		font-size: 48px;
		font-weight: 600;
		color: var(--accent);
		line-height: 1;
		margin: 0;
	}

	.win-body {
		font-size: var(--text-base);
		color: var(--text);
		margin: 0;
	}

	.record-badge {
		margin: var(--space-sm) 0 0;
		font-size: var(--text-base);
		font-weight: 400;
		color: var(--accent);
	}
</style>
