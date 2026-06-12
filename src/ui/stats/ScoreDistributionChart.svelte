<script lang="ts">
	// src/ui/stats/ScoreDistributionChart.svelte
	// Horizontal bar chart for score distribution bands (STAT-08).
	// Hand-rolled SVG — no chart library (CLAUDE.md smallest-runtime; UI-SPEC Chart Contract).
	// Security T-04-05: all strings via {interpolation} — never {@html}.

	import type { ScoreBands } from '../../db/stats.js';

	interface Props {
		scoreBands: ScoreBands;
	}

	let { scoreBands }: Props = $props();

	interface Band {
		label: string;
		count: number;
	}

	// Build band rows ordered highest → lowest (descending priority display)
	const bands: Band[] = $derived([
		{ label: '180', count: scoreBands.count180 },
		{ label: '140+', count: scoreBands.count140plus },
		{ label: '100+', count: scoreBands.count100plus },
		{ label: '60+', count: scoreBands.count60plus }
	]);

	const maxCount: number = $derived(Math.max(...bands.map(b => b.count), 1));

	// Index of the highest band with any count (for accent colouring)
	const highlightIdx: number = $derived(bands.findIndex(b => b.count > 0));

	// Bar geometry: x origin = 60 (label area), available width = 220
	const BAR_X = 60;
	const BAR_WIDTH = 220;
	const ROW_HEIGHT = 30;
	const BAR_HEIGHT = 18;
	const viewBoxHeight: number = $derived(bands.length * ROW_HEIGHT + 10);

	// Plain-text aria description
	const ariaLabel: string = $derived(
		'Score-Verteilung: ' +
		bands.map(b => `${b.label}: ${b.count}`).join(', ')
	);
</script>

<div class="chart-card">
	<h3 class="chart-title">Score-Verteilung</h3>
	<svg
		role="img"
		aria-label={ariaLabel}
		viewBox="0 0 300 {viewBoxHeight}"
		width="100%"
	>
		<!-- Y-axis line -->
		<line
			x1={BAR_X}
			y1="0"
			x2={BAR_X}
			y2={viewBoxHeight}
			stroke="#444"
			stroke-width="1"
		/>
		{#each bands as band, i}
			{@const barW = maxCount > 0 ? (band.count / maxCount) * BAR_WIDTH : 0}
			{@const y = i * ROW_HEIGHT + 5}
			{@const fill = i === highlightIdx ? '#e8a020' : '#444'}
			<!-- Bar -->
			<rect
				x={BAR_X + 2}
				{y}
				width={barW}
				height={BAR_HEIGHT}
				{fill}
				rx="2"
			/>
			<!-- Band label (left of axis) -->
			<text
				x={BAR_X - 4}
				y={y + BAR_HEIGHT - 3}
				text-anchor="end"
				font-size="12"
				fill="#888"
			>{band.label}</text>
			<!-- Count label (right of bar) -->
			<text
				x={BAR_X + barW + 8}
				y={y + BAR_HEIGHT - 3}
				font-size="12"
				fill="#f0f0f0"
			>{band.count}</text>
		{/each}
	</svg>
</div>

<style>
	.chart-card {
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-md, 16px);
	}

	.chart-title {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0 0 var(--space-sm, 8px) 0;
	}
</style>
