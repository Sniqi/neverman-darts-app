<script lang="ts">
	// src/ui/input/StatDrawer.svelte
	// Live in-match stats drawer (D-01). Tappable toggle below ScorePanel.
	// Reads matchStore live state and the 04-01 stat functions from averages.ts.
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

	let open = $state(false);

	const stats = $derived.by(() => {
		const state = matchStore.state;
		const player = state.players[state.activePlayerIndex];
		if (!player) {
			return null;
		}

		const startScore = state.config.startScore;
		const outRule = state.config.outRule;
		const legStart = state.legStartVisitIndex[player.id] ?? 0;
		const legVisits = player.visits.slice(legStart);

		// ── Leg stats ──────────────────────────────────────────────────────────
		const legAvg = legAverage(legVisits, startScore, player.remaining);

		// first9Average needs legScored = sum of first 3 visit scores.
		// For board visits: sum dart values. For numpad visits: use remaining-delta
		// (we reconstruct by walking the first 3 visits using running remaining).
		const legScored = (() => {
			const first3 = legVisits.slice(0, 3);
			let running = startScore;
			let scored = 0;
			for (const v of first3) {
				if (v.bust) {
					// bust: no score, remaining unchanged
					continue;
				}
				if (v.darts.length > 0) {
					const s = v.darts.reduce((sum, d) => sum + d.multiplier * d.segment, 0);
					scored += s;
					running -= s;
				} else {
					// numpad: we don't have per-visit remaining for non-checkout visits.
					// Use wasCheckout to handle leg-closing numpad (rare in first 3 visits).
					if (v.wasCheckout) {
						scored += running;
					}
					// non-closing numpad in first 3: cannot reconstruct — skip contribution
				}
			}
			return scored;
		})();
		const first9Avg = first9Average(legVisits, legScored);

		// ── Match stats ────────────────────────────────────────────────────────
		const matchAvg = matchAverageCrossLeg(player, legStart, startScore);
		const checkoutPct = checkoutPercent(player.visits, outRule);
		const visitScores = visitScoresFromState(player, startScore);
		const bands = computeScoreBands(visitScores);
		const highestVisitScore = highestVisit(player, startScore);
		const bestLegDarts = bestLeg(player, legStart);

		// ── Formatting helpers ─────────────────────────────────────────────────
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
	});
</script>

<div class="stat-drawer-wrapper">
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
		{#if stats}
			<div class="drawer-content">
				<div class="drawer-column">
					<p class="column-heading">Dieses Leg</p>
					<StatCard label="3-Dart Ø" value={stats.legAvg} />
					<StatCard label="Erste 9 Ø" value={stats.first9Avg} />
				</div>
				<div class="drawer-column">
					<p class="column-heading">Dieses Match</p>
					<StatCard label="3-Dart Ø" value={stats.matchAvg} />
					<StatCard label="Finish %" value={stats.checkoutPct} />
					<StatCard label="180er" value={stats.count180} />
					<StatCard label="140+" value={stats.count140plus} />
					<StatCard label="100+" value={stats.count100plus} />
					<StatCard label="Höchste Aufnahme" value={stats.highestVisitScore} />
					<StatCard label="Bestes Leg (Darts)" value={stats.bestLegDarts} />
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.stat-drawer-wrapper {
		background: #1e2027;
		border-top: 1px solid #2d2d2d;
	}

	.drawer-toggle {
		width: 100%;
		min-height: 44px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #f0f0f0;
		font-size: 16px;
		font-weight: 400;
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
		max-height: 60dvh;
		overflow-y: auto;
	}

	.drawer-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm, 8px);
		padding: var(--space-md, 16px);
	}

	.drawer-column {
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
</style>
