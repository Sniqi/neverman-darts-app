<script lang="ts">
	// src/ui/input/ScorePanel.svelte
	// Per-player score cards. Active player gets accent left border.
	// CheckoutSuggestion is rendered beside active player's remaining score.
	import { matchStore } from '../../stores/match.svelte.js';
	import CheckoutSuggestion from './CheckoutSuggestion.svelte';
</script>

<div class="score-panel">
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
					<span>Sets: {player.setsWon}</span>
					<span> Leg: {player.legsWon}</span>
				{:else}
					<span>Leg: {player.legsWon}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.score-panel {
		display: flex;
		flex-direction: row;
		gap: var(--space-sm, 8px);
		flex-wrap: wrap;
	}

	.player-card {
		flex: 1;
		min-width: 120px;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--line);
		border-left: 3px solid transparent;
		border-radius: var(--radius-md);
		padding: var(--space-md, 16px);
	}

	.player-card.active {
		border-color: var(--accent-line);
		border-left-color: var(--accent);
		background:
			linear-gradient(var(--accent-soft), var(--accent-soft)),
			var(--surface);
	}

	.player-name {
		font-size: 26px;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 4px;
	}

	.score-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm, 8px);
	}

	.remaining {
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		line-height: 1;
		color: var(--text);
	}

	.remaining-active {
		font-size: 64px;
	}

	.remaining-inactive {
		font-size: 32px;
	}

	.legs-info {
		font-size: 18px;
		color: var(--text);
		margin-top: 4px;
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

		.player-name {
			font-size: 32px;
		}

		.remaining-active {
			font-size: 80px;
		}

		.remaining-inactive {
			font-size: 52px;
		}

		.legs-info {
			font-size: 22px;
		}
	}
</style>
