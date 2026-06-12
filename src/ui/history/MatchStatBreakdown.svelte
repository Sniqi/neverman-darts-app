<script lang="ts">
	// src/ui/history/MatchStatBreakdown.svelte
	// Per-player per-match statistics breakdown filling the .phase4-region in history/[id]/+page.svelte.
	// Props: players, config, winnerId, legStartVisitIndex.
	// Security T-04-09: all player names rendered via {interpolation} — never {@html}.

	import type { PlayerState, MatchConfig } from '../../engine/types.js';
	import StatCard from '../stats/StatCard.svelte';
	import {
		computeScoreBands,
		visitScoresFromState,
		checkoutPercent,
		highestVisit,
		bestLeg,
	} from '../../engine/averages.js';

	/**
	 * Highest checkout (finish) value across a player's visits (WR-02).
	 * Board checkouts sum dart values; numpad checkouts (darts: []) carry no darts, so the
	 * finish value is reconstructed from the leg's running remaining before the closing
	 * visit (= the cleared amount). Walk visits per leg, resetting at each leg boundary.
	 * Returns null when the player never checked out.
	 */
	function highestCheckout(player: PlayerState, startScore: number): number | null {
		let best: number | null = null;
		let running = startScore;
		for (const v of player.visits) {
			if (v.bust) continue;
			const boardScore =
				v.darts.length > 0
					? v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
					: null;
			if (v.wasCheckout === true) {
				const score = boardScore ?? running;
				if (best === null || score > best) best = score;
			}
			if (boardScore !== null) running -= boardScore;
			else if (v.wasCheckout === true) running = 0;
			if (running <= 0) running = startScore;
		}
		return best;
	}

	interface Props {
		players: PlayerState[];
		config: MatchConfig;
		winnerId: string;
		legStartVisitIndex: Record<string, number>;
	}

	let { players, config, winnerId, legStartVisitIndex }: Props = $props();

	/** Format a nullable number to one decimal, or "—" when null. */
	function fmt1(n: number | null): string {
		return n !== null ? n.toFixed(1) : '—';
	}

	/** Format a nullable integer, or "—" when null. */
	function fmtInt(n: number | null): string {
		return n !== null ? String(n) : '—';
	}

	/** Format checkout percent as integer + "%", or "—" when null. */
	function fmtPct(n: number | null): string {
		return n !== null ? `${Math.round(n)}%` : '—';
	}
</script>

<section class="stat-breakdown">
	<h2 class="section-heading">Statistiken</h2>

	{#each players as player (player.id)}
		{@const legStart = legStartVisitIndex[player.id] ?? 0}
		{@const visitScores = visitScoresFromState(player, config.startScore)}
		{@const bands = computeScoreBands(visitScores)}
		{@const checkoutPct = checkoutPercent(player.visits, config.outRule)}
		{@const highestVisitScore = highestVisit(player, config.startScore)}
		{@const highestCheckoutScore = highestCheckout(player, config.startScore)}
		{@const bestLegDarts = bestLeg(player, legStart)}

		<div class="player-stat-block">
			<h3 class="player-name" class:winner={player.id === winnerId}>{player.name}</h3>
			<div class="kpi-grid">
				<StatCard label="180er" value={fmtInt(bands.count180)} />
				<StatCard label="140+" value={fmtInt(bands.count140plus)} />
				<StatCard label="100+" value={fmtInt(bands.count100plus)} />
				<StatCard label="60+" value={fmtInt(bands.count60plus)} />
				<StatCard label="Finish %" value={fmtPct(checkoutPct)} />
				<StatCard label="Höchste Aufnahme" value={fmtInt(highestVisitScore)} />
				<StatCard
					label="Höchstes Finish"
					value={highestCheckoutScore !== null && highestCheckoutScore > 0
						? fmtInt(highestCheckoutScore)
						: '—'}
				/>
				<StatCard label="Bestes Leg (Darts)" value={fmtInt(bestLegDarts)} />
			</div>
		</div>
	{/each}
</section>

<style>
	.stat-breakdown {
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 16px);
	}

	.section-heading {
		font-size: 20px;
		font-weight: 600;
		color: #f0f0f0;
		margin: 0;
	}

	.player-stat-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.player-name {
		font-size: 16px;
		font-weight: 600;
		color: #f0f0f0;
		margin: 0;
	}

	.player-name.winner {
		color: #e8a020;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-sm, 8px);
	}
</style>
