<script lang="ts">
	// src/ui/history/PlayerStatRow.svelte
	// One player card in the match detail scoreboard (D-05, Surface 4).
	// Shows: player name, legs/sets won, match average.
	// Security T-03-05: all values via {interpolation} — no {@html}.

	import { computeAverage } from '../../engine/averages.js';
	import type { PlayerState, MatchConfig } from '../../engine/types.js';

	interface Props {
		player: PlayerState;
		isWinner: boolean;
		config: MatchConfig;
	}

	let { player, isWinner, config }: Props = $props();

	/** Legs or sets won label with correct German singular/plural. */
	const winsLabel = $derived.by(() => {
		if (config.setsEnabled) {
			const n = player.setsWon;
			return n === 1 ? '1 Satz' : `${n} Sätze`;
		} else {
			const n = player.legsWon;
			return n === 1 ? '1 Leg' : `${n} Legs`;
		}
	});

	/** Match average formatted to one decimal, or "—" when null. */
	const avgDisplay = $derived.by(() => {
		const avg = computeAverage(player.visits, config.startScore, player.remaining);
		return avg !== null ? avg.toFixed(1) : '—';
	});
</script>

<div class="player-row" class:winner={isWinner} class:non-winner={!isWinner}>
	<div class="player-info">
		<span class="player-name" class:winner-name={isWinner}>{player.name}</span>
		<span class="wins-label">{winsLabel}</span>
	</div>
	<div class="avg-line">
		<span class="avg-label">Ø Match:</span>
		<span class="avg-value">{avgDisplay}</span>
	</div>
</div>

<style>
	.player-row {
		border-radius: 8px;
		padding: var(--space-md, 16px);
	}

	.winner {
		background: #22242d;
	}

	.non-winner {
		background: #1e2027;
	}

	.player-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs, 4px);
	}

	.player-name {
		font-size: 16px;
		font-weight: 400;
		color: #f0f0f0;
	}

	.winner-name {
		font-weight: 600;
		color: #e8a020;
	}

	.wins-label {
		font-size: 16px;
		font-weight: 400;
		color: #f0f0f0;
	}

	.avg-line {
		display: flex;
		gap: var(--space-xs, 4px);
		align-items: center;
	}

	.avg-label {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
	}

	.avg-value {
		font-size: 14px;
		font-weight: 400;
		color: #f0f0f0;
	}
</style>
