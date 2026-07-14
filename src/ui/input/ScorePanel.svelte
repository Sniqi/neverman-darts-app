<script lang="ts">
	// src/ui/input/ScorePanel.svelte
	// Per-player score cards. Active player gets accent left border.
	// CheckoutSuggestion is rendered beside active player's remaining score.
	import { matchStore } from '../../stores/match.svelte.js';
	import CheckoutSuggestion from './CheckoutSuggestion.svelte';

	let playerCount = $derived(matchStore.state.players.length);
</script>

<div class="score-panel" class:compact={playerCount >= 3}>
	{#each matchStore.state.players as player, i (player.id)}
		{@const isActive = i === matchStore.state.activePlayerIndex}
		<div class="player-card" class:active={isActive}>
			<div class="player-name">{player.name}</div>
			<div class="score-row">
				<span class="remaining" class:remaining-active={isActive} class:remaining-inactive={!isActive}>
					{isActive ? matchStore.remaining : player.remaining}
				</span>
				{#if isActive}
					<CheckoutSuggestion />
				{/if}
			</div>
			<div class="legs-info">
				{#if matchStore.state.config.setsEnabled}
					<span>Sets: <span class="legs-value">{player.setsWon}</span></span>
					<span> Leg: <span class="legs-value">{player.legsWon}</span></span>
				{:else}
					<span>Leg: <span class="legs-value">{player.legsWon}</span></span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.score-panel {
		display: flex;
		flex-direction: row;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.player-card {
		flex: 1;
		min-width: 120px;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
		box-shadow: var(--edge-highlight);
	}

	.player-card.active {
		border: 1px solid var(--accent-line);
		box-shadow: inset 4px 0 0 var(--accent), var(--glow-accent), var(--edge-highlight);
		background:
			linear-gradient(var(--accent-soft), var(--accent-soft)),
			var(--surface-2);
		transition:
			background var(--dur-slow) var(--ease),
			box-shadow var(--dur-slow) var(--ease),
			border-color var(--dur-slow) var(--ease);
	}

	.player-name {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text);
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.player-card:not(.active) .player-name {
		color: var(--text-soft);
	}

	.score-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
	}

	.remaining {
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: var(--text);
		letter-spacing: var(--tracking-tight);
		transition: font-size var(--dur-med) var(--ease);
	}

	.remaining-active {
		font-size: var(--text-score-active);
		font-weight: var(--weight-heavy);
		text-shadow: 0 0 40px rgba(240, 164, 36, 0.35);
	}

	.remaining-inactive {
		font-size: var(--text-score-inactive);
		font-weight: 700;
	}

	.legs-info {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.legs-value {
		color: var(--text);
		font-weight: 700;
	}

	/* Landscape: natural height at the top of the panel column so the big score
	   numbers are never clipped when the stat drawer is open. */
	@media (orientation: landscape) {
		.score-panel {
			flex: 0 0 auto;
			align-items: stretch;
			gap: 10px;
		}

		.player-card {
			justify-content: center;
			padding: 20px;
			min-width: 0;
		}

		.score-panel.compact .player-card {
			padding: 10px 4px;
		}

		.score-panel.compact .remaining-active {
			font-size: clamp(22px, 4vw, var(--text-score-active));
		}
	}
</style>
