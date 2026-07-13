<script lang="ts">
	// src/ui/history/PlayerStatRow.svelte
	// One player card in the match detail scoreboard (D-05, Surface 4).
	// Shows: player name, legs/sets won, match average.
	// Security T-03-05: all values via {interpolation} — no {@html}.

	import { matchAverageCrossLeg } from '../../engine/averages.js';
	import type { PlayerState, MatchConfig } from '../../engine/types.js';

	interface Props {
		player: PlayerState;
		isWinner: boolean;
		config: MatchConfig;
		totalLegsPlayed: number;
		legStartVisitIndex: number;
	}

	let { player, isWinner, config, totalLegsPlayed, legStartVisitIndex }: Props = $props();

	/** Legs or sets won label with correct singular/plural. */
	const winsLabel = $derived.by(() => {
		if (config.setsEnabled) {
			const n = player.setsWon;
			return n === 1 ? '1 Set' : `${n} Sets`;
		} else {
			const n = player.legsWon;
			return n === 1 ? '1 Leg' : `${n} Legs`;
		}
	});

	/**
	 * Match average formatted to one decimal, or "—" when no darts thrown.
	 * Uses matchAverageCrossLeg for correct cross-leg accumulation (Phase 4).
	 */
	const avgDisplay = $derived.by(() => {
		// WR-06: history rows render persisted (completed) matches where every leg —
		// including the final one — is already in legCompleted. Pass visits.length so
		// the current-leg slice is empty and the final leg is not double-counted.
		const avg = matchAverageCrossLeg(player, player.visits.length, config.startScore);
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
		border-radius: var(--radius-md);
		padding: var(--space-md);
	}

	.winner {
		background: var(--surface-2);
	}

	.non-winner {
		background: var(--surface);
	}

	.player-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xs);
	}

	.player-name {
		font-size: 16px;
		font-weight: 400;
		color: var(--text);
	}

	.winner-name {
		font-weight: 600;
		color: var(--accent);
	}

	.wins-label {
		font-size: 16px;
		font-weight: 400;
		color: var(--text);
	}

	.avg-line {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	.avg-label {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-muted);
	}

	.avg-value {
		font-size: 14px;
		font-weight: 400;
		color: var(--text);
	}
</style>
