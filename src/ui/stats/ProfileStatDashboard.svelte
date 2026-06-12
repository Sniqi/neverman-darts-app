<script lang="ts">
	// src/ui/stats/ProfileStatDashboard.svelte
	// Lifetime statistics dashboard for a single profile: KPI tiles + 3 SVG charts.
	// Prop-driven (no DB access) — data supplied by the /stats route via profileStatsLive.
	// Security T-04-05: all strings via {interpolation} — never {@html}.

	import type { LifetimeStats } from '../../db/stats.js';
	import StatCard from './StatCard.svelte';
	import ScoreDistributionChart from './ScoreDistributionChart.svelte';
	import AverageTrendChart from './AverageTrendChart.svelte';
	import DartsPerLegChart from './DartsPerLegChart.svelte';

	interface Props {
		stats: LifetimeStats;
		profileName: string;
	}

	let { stats, profileName }: Props = $props();

	// Format helpers — one decimal for averages, integer for percentages, null → "—"
	function fmtAvg(v: number | null): string {
		if (v === null) return '—';
		return v.toFixed(1);
	}

	function fmtPct(v: number | null): string {
		if (v === null) return '—';
		return `${Math.round(v)}%`;
	}

	function fmtInt(v: number | null): string {
		if (v === null) return '—';
		return String(v);
	}
</script>

{#if stats.matchesPlayed === 0}
	<!-- Per-profile empty state -->
	<div class="empty-state" role="status">
		<p class="empty-heading">Noch keine Spiele.</p>
		<p class="empty-body">Spiele ein Match mit diesem Profil, um Statistiken zu sehen.</p>
	</div>
{:else}
	<div class="dashboard">
		<!-- KPI section: Übersicht -->
		<section class="section">
			<h2 class="section-heading">Übersicht</h2>
			<div class="kpi-grid">
				<StatCard label="Matches gespielt" value={String(stats.matchesPlayed)} />
				<StatCard label="Gewinnrate" value={fmtPct(stats.winRate)} />
				<StatCard label="3-Dart Ø (Lifetime)" value={fmtAvg(stats.matchAverage)} />
				<StatCard label="Finish %" value={fmtPct(stats.checkoutPercent)} />
			</div>
		</section>

		<hr class="divider" />

		<!-- Records section -->
		<section class="section">
			<h2 class="section-heading">Rekorde</h2>
			<div class="kpi-grid">
				<StatCard label="Höchste Aufnahme" value={stats.highestVisit > 0 ? String(stats.highestVisit) : '—'} />
				<StatCard label="Höchstes Finish" value={stats.highestCheckout > 0 ? String(stats.highestCheckout) : '—'} />
				<StatCard label="Bestes Leg (Darts)" value={fmtInt(stats.bestLeg)} />
			</div>
		</section>

		<hr class="divider" />

		<!-- Charts section -->
		<section class="section">
			<h2 class="section-heading">Score-Verteilung</h2>
			<ScoreDistributionChart scoreBands={stats.scoreBands} />
		</section>

		<hr class="divider" />

		<section class="section">
			<h2 class="section-heading">Ø-Entwicklung</h2>
			<AverageTrendChart points={stats.averageTrend} />
		</section>

		<hr class="divider" />

		<section class="section">
			<h2 class="section-heading">Darts pro Leg</h2>
			<DartsPerLegChart values={stats.dartsPerLegBuckets} />
		</section>
	</div>
{/if}

<style>
	.empty-state {
		padding: var(--space-xl, 32px) var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm, 8px);
		text-align: center;
	}

	.empty-heading {
		font-size: 16px;
		font-weight: 400;
		margin: 0;
		color: #f0f0f0;
	}

	.empty-body {
		font-size: 14px;
		font-weight: 400;
		margin: 0;
		color: #888888;
	}

	.dashboard {
		display: flex;
		flex-direction: column;
	}

	.section {
		padding: var(--space-md, 16px);
	}

	.section-heading {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 var(--space-md, 16px) 0;
		color: #f0f0f0;
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm, 8px);
	}

	.divider {
		border: none;
		border-top: 1px solid #2d2d2d;
		margin: 0;
	}
</style>
