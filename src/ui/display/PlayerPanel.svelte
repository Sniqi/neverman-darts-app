<script lang="ts">
	// src/ui/display/PlayerPanel.svelte
	// One player column for the spectator display.
	// Prop-driven — does NOT read any store directly.
	// Props: player, isActive, config, legStartIndex
	import { legAverage, matchAverage } from '../../engine/averages.js';
	import type { PlayerState, MatchConfig } from '../../engine/types.js';

	interface Props {
		player: PlayerState;
		isActive: boolean;
		config: MatchConfig;
		legStartIndex: number;
	}

	let { player, isActive, config, legStartIndex }: Props = $props();

	let legAvg = $derived.by(() => {
		const legVisits = player.visits.slice(legStartIndex);
		const val = legAverage(legVisits, config.startScore, player.remaining);
		return val !== null ? val.toFixed(1) : '—';
	});

	let matchAvg = $derived.by(() => {
		const val = matchAverage(player.visits, config.startScore, player.remaining);
		return val !== null ? val.toFixed(1) : '—';
	});
</script>

<div class="player-panel" class:active={isActive}>
	<div class="player-name">{player.name}</div>

	<div class="legs-sets">
		{#if config.setsEnabled}
			<span>S: {player.setsWon}</span>
			<span> L: {player.legsWon}</span>
		{:else}
			<span>L: {player.legsWon}</span>
		{/if}
	</div>

	<div class="score-block">
		<div
			class="remaining-score"
			role="status"
			aria-live="polite"
		>{player.remaining}</div>
	</div>

	<div class="stats-line">
		Ø Leg {legAvg} · Ø Match {matchAvg}
	</div>
</div>

<style>
	.player-panel {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: var(--space-lg, 24px) var(--space-md, 16px);
		background: var(--surface, #1e2027);
		border-top: 3px solid transparent;
		opacity: 0.55;
		transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease;
		height: 100%;
		overflow: hidden;
	}

	.player-panel.active {
		background: #22242d;
		border-top-color: #e8a020;
		box-shadow: inset 0 0 40px rgba(232, 160, 32, 0.08);
		opacity: 1;
	}

	.player-name {
		font-size: clamp(1.5rem, 3vw, 4rem);
		font-weight: 600;
		line-height: 1.1;
		color: var(--text, #f0f0f0);
	}

	.legs-sets {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 600;
		color: var(--text, #f0f0f0);
		margin-top: var(--space-sm, 8px);
	}

	.score-block {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remaining-score {
		font-size: clamp(4rem, 8vw, 12rem);
		font-weight: 600;
		line-height: 1.0;
		letter-spacing: -0.02em;
		color: var(--text, #f0f0f0);
	}

	.stats-line {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 400;
		line-height: 1.3;
		color: var(--text, #f0f0f0);
		margin-top: var(--space-sm, 8px);
	}
</style>
