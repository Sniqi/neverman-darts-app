<script lang="ts">
	// src/ui/input/StatDrawer.svelte
	// Live in-match stats drawer (D-01). Tappable toggle below ScorePanel.
	// Shows stats for the current player and the previous player (2+ players).
	// Security T-04-03: all strings via {interpolation} — never {@html}.
	// Does NOT dispatch any match action.

	import { matchStore } from '../../stores/match.svelte.js';
	import {
		matchAverageCrossLeg,
		legAverage,
		first9Average,
		checkoutPercent,
		computeScoreBands,
		visitScoresFromState,
		bestLeg,
		highestVisit,
	} from '../../engine/averages.js';
	import StatCard from '../stats/StatCard.svelte';
	import type { PlayerState, MatchState } from '../../engine/types.js';

	let open = $state(true);

	function computePlayerStats(player: PlayerState, state: MatchState) {
		const startScore = state.config.startScore;
		const outRule = state.config.outRule;
		const legStart = state.legStartVisitIndex[player.id] ?? 0;
		const legVisits = player.visits.slice(legStart);

		const legAvg = legAverage(legVisits, startScore, player.remaining);

		const legScored = (() => {
			const first3 = legVisits.slice(0, 3);
			let running = startScore;
			let scored = 0;
			for (const v of first3) {
				if (v.bust) continue;
				if (v.darts.length > 0) {
					const s = v.darts.reduce((sum, d) => sum + d.multiplier * d.segment, 0);
					scored += s;
					running -= s;
				} else {
					if (v.wasCheckout) scored += running;
				}
			}
			return scored;
		})();
		const first9Avg = first9Average(legVisits, legScored);

		const matchAvg = matchAverageCrossLeg(player, legStart, startScore);
		const checkoutPct = checkoutPercent(player.visits, outRule);
		const visitScores = visitScoresFromState(player, startScore);
		const bands = computeScoreBands(visitScores);
		const highestVisitScore = highestVisit(player, startScore);
		const bestLegDarts = bestLeg(player, legStart);

		function fmtAvg(v: number | null): string {
			return v !== null ? v.toFixed(1) : '—';
		}
		function fmtPct(v: number | null): string {
			return v !== null ? `${Math.round(v)}%` : '—';
		}
		function fmtNum(v: number | null): string {
			return v !== null ? String(v) : '—';
		}

		return {
			legAvg: fmtAvg(legAvg),
			first9Avg: fmtAvg(first9Avg),
			matchAvg: fmtAvg(matchAvg),
			checkoutPct: fmtPct(checkoutPct),
			count180: String(bands.count180),
			count140plus: String(bands.count140plus),
			count100plus: String(bands.count100plus),
			highestVisitScore: fmtNum(highestVisitScore),
			bestLegDarts: fmtNum(bestLegDarts),
		};
	}

	const playerStats = $derived.by(() => {
		const state = matchStore.state;
		const players = state.players;
		if (players.length === 0) return null;

		const currentIdx = state.activePlayerIndex;
		const hasPrev = players.length > 1;
		const prevIdx = hasPrev ? (currentIdx - 1 + players.length) % players.length : null;

		return {
			current: {
				name: players[currentIdx].name,
				stats: computePlayerStats(players[currentIdx], state),
			},
			prev: prevIdx !== null
				? {
					name: players[prevIdx].name,
					stats: computePlayerStats(players[prevIdx], state),
				}
				: null,
		};
	});
</script>

<div class="stat-drawer-wrapper" class:open={open}>
	<button
		class="drawer-toggle"
		class:open={open}
		aria-expanded={open}
		aria-controls="stat-drawer"
		onclick={() => (open = !open)}
	>
		Statistik {open ? '▴' : '▾'}
	</button>

	<div id="stat-drawer" class="drawer-panel" class:open={open} role="region">
		{#if playerStats}
			<div class="drawer-content" class:two-player={!!playerStats.prev}>
				<!-- Current player column -->
				<div class="player-col current-col">
					<div class="player-name-row">
						<span class="active-indicator">▶</span>
						<span class="player-name current-name">{playerStats.current.name}</span>
					</div>
					<div class="stat-section">
						<p class="column-heading">Dieses Leg</p>
						<StatCard label="3-Dart Ø" value={playerStats.current.stats.legAvg} />
						<StatCard label="Erste 9 Ø" value={playerStats.current.stats.first9Avg} />
					</div>
					<div class="stat-section">
						<p class="column-heading">Dieses Match</p>
						<StatCard label="3-Dart Ø" value={playerStats.current.stats.matchAvg} />
						<StatCard label="Finish %" value={playerStats.current.stats.checkoutPct} />
						<StatCard label="180er" value={playerStats.current.stats.count180} />
						<StatCard label="140+" value={playerStats.current.stats.count140plus} />
						<StatCard label="100+" value={playerStats.current.stats.count100plus} />
						<StatCard label="Höchste Aufnahme" value={playerStats.current.stats.highestVisitScore} />
						<StatCard label="Bestes Leg (Darts)" value={playerStats.current.stats.bestLegDarts} />
					</div>
				</div>

				<!-- Previous player column (only when 2+ players) -->
				{#if playerStats.prev}
					<div class="player-col prev-col">
						<div class="player-name-row">
							<span class="player-name prev-name">{playerStats.prev.name}</span>
						</div>
						<div class="stat-section">
							<p class="column-heading">Dieses Leg</p>
							<StatCard label="3-Dart Ø" value={playerStats.prev.stats.legAvg} />
							<StatCard label="Erste 9 Ø" value={playerStats.prev.stats.first9Avg} />
						</div>
						<div class="stat-section">
							<p class="column-heading">Dieses Match</p>
							<StatCard label="3-Dart Ø" value={playerStats.prev.stats.matchAvg} />
							<StatCard label="Finish %" value={playerStats.prev.stats.checkoutPct} />
							<StatCard label="180er" value={playerStats.prev.stats.count180} />
							<StatCard label="140+" value={playerStats.prev.stats.count140plus} />
							<StatCard label="100+" value={playerStats.prev.stats.count100plus} />
							<StatCard label="Höchste Aufnahme" value={playerStats.prev.stats.highestVisitScore} />
							<StatCard label="Bestes Leg (Darts)" value={playerStats.prev.stats.bestLegDarts} />
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.stat-drawer-wrapper {
		background: var(--surface, #1e2027);
		border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-md, 12px);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.drawer-toggle {
		width: 100%;
		min-height: 44px;
		flex-shrink: 0;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #f0f0f0;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		text-align: left;
		padding: 0 var(--space-md, 16px);
		transition: border-color 150ms ease;
	}

	.drawer-toggle.open {
		border-bottom-color: #e8a020;
	}

	.drawer-toggle:focus-visible {
		outline: 2px solid #e8a020;
		outline-offset: 2px;
	}

	.drawer-panel {
		max-height: 0;
		overflow: hidden;
		transition: max-height 200ms ease;
	}

	.drawer-panel.open {
		max-height: 55dvh;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #444 #1e2027;
	}

	.drawer-panel.open::-webkit-scrollbar {
		width: 6px;
	}

	.drawer-panel.open::-webkit-scrollbar-track {
		background: #1e2027;
	}

	.drawer-panel.open::-webkit-scrollbar-thumb {
		background-color: #444;
		border-radius: 3px;
	}

	.drawer-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md, 16px);
		padding: var(--space-md, 16px);
		background: var(--bg, #111318);
	}

	.drawer-content.two-player {
		grid-template-columns: 1fr 1fr;
	}

	.player-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		border-top: 3px solid transparent;
		padding-top: var(--space-sm, 8px);
	}

	.current-col {
		border-top-color: var(--accent, #e8a020);
	}

	.prev-col {
		border-top-color: var(--line-strong, rgba(255, 255, 255, 0.14));
		opacity: 0.65;
	}

	.player-name-row {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 24px;
	}

	.active-indicator {
		font-size: 11px;
		color: #e8a020;
		flex-shrink: 0;
	}

	.player-name {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.current-name {
		color: #e8a020;
	}

	.prev-name {
		color: #f0f0f0;
	}

	.stat-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.column-heading {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0;
	}

	/* Landscape: when open the drawer fills the leftover height of the panel
	   column and scrolls internally; when collapsed it stays at header height
	   so the control deck can pin to the bottom (see .control-deck margin). */
	@media (orientation: landscape) {
		.stat-drawer-wrapper {
			flex: 0 0 auto;
		}

		.stat-drawer-wrapper.open {
			flex: 1 1 auto;
		}

		.drawer-panel.open {
			flex: 1 1 auto;
			max-height: none;
			min-height: 0;
		}
	}
</style>
