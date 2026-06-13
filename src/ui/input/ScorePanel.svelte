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
		padding: var(--space-md, 16px);
		background: #111318;
		flex-wrap: wrap;
	}

	.player-card {
		flex: 1;
		min-width: 120px;
		background: #1e2027;
		border-radius: 6px;
		padding: var(--space-md, 16px);
		border-left: 2px solid transparent;
	}

	.player-card.active {
		border-left-color: #e8a020;
	}

	.player-name {
		font-size: 26px;
		font-weight: 600;
		color: #f0f0f0;
		margin-bottom: 4px;
	}

	.score-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm, 8px);
	}

	.remaining {
		font-weight: 600;
		line-height: 1;
		color: #f0f0f0;
	}

	.remaining-active {
		font-size: 64px;
	}

	.remaining-inactive {
		font-size: 32px;
	}

	.legs-info {
		font-size: 18px;
		color: #f0f0f0;
		margin-top: 4px;
	}
</style>
