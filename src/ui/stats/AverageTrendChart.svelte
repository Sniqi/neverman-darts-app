<script lang="ts">
	// src/ui/stats/AverageTrendChart.svelte
	// Line chart for per-match 3-dart average trend (STAT-08).
	// Hand-rolled SVG — no chart library (CLAUDE.md smallest-runtime; UI-SPEC Chart Contract).
	// Security T-04-05: all strings via {interpolation} — never {@html}.

	interface Props {
		points: number[]; // per-match average, oldest → newest
	}

	let { points }: Props = $props();

	// Chart geometry
	const VIEW_W = 300;
	const VIEW_H = 120;
	const PAD_LEFT = 40;
	const PAD_RIGHT = 10;
	const PAD_TOP = 8;
	const PAD_BOTTOM = 20;
	const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
	const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

	// Coordinate math — Pattern 9 from RESEARCH
	const minY: number = $derived(points.length >= 2 ? Math.min(...points) : 0);
	const maxY: number = $derived(points.length >= 2 ? Math.max(...points) : 100);
	const rangeY: number = $derived(maxY === minY ? 1 : maxY - minY); // avoid division by zero

	function xCoord(idx: number, total: number): number {
		if (total <= 1) return PAD_LEFT + PLOT_W / 2;
		return PAD_LEFT + (idx / (total - 1)) * PLOT_W;
	}

	function yCoord(val: number): number {
		// When maxY === minY, render flat line at midpoint
		const ratio = maxY === minY ? 0.5 : (val - minY) / rangeY;
		return PAD_TOP + PLOT_H - ratio * PLOT_H;
	}

	const svgPoints: string = $derived(
		points.map((v, i) => `${xCoord(i, points.length).toFixed(1)},${yCoord(v).toFixed(1)}`).join(' ')
	);

	// Y-axis tick labels: min, mid, max (3 ticks)
	const yTicks: Array<{ val: number; y: number }> = $derived(
		points.length >= 2
			? [
				{ val: Math.round(minY), y: yCoord(minY) },
				{ val: Math.round((minY + maxY) / 2), y: yCoord((minY + maxY) / 2) },
				{ val: Math.round(maxY), y: yCoord(maxY) }
			]
			: []
	);

	const ariaLabel: string = $derived(
		points.length >= 2
			? `Ø-Entwicklung: ${points.length} Matches, Ø ${(points.reduce((s, v) => s + v, 0) / points.length).toFixed(1)}`
			: 'Ø-Entwicklung: Nicht genug Daten.'
	);
</script>

<div class="chart-card">
	<h3 class="chart-title">Ø-Entwicklung</h3>
	<svg
		role="img"
		aria-label={ariaLabel}
		viewBox="0 0 {VIEW_W} {VIEW_H}"
		width="100%"
	>
		<!-- Axes -->
		<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + PLOT_H} stroke="#444" stroke-width="1" />
		<line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={PAD_LEFT + PLOT_W} y2={PAD_TOP + PLOT_H} stroke="#444" stroke-width="1" />

		{#if points.length >= 2}
			<!-- Y-axis tick labels -->
			{#each yTicks as tick}
				<text
					x={PAD_LEFT - 4}
					y={tick.y + 4}
					text-anchor="end"
					font-size="11"
					fill="#888"
				>{tick.val}</text>
			{/each}
			<!-- Data polyline -->
			<polyline
				points={svgPoints}
				fill="none"
				stroke="#e8a020"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<!-- Data dots -->
			{#each points as v, i}
				<circle
					cx={xCoord(i, points.length)}
					cy={yCoord(v)}
					r="3"
					fill="#e8a020"
				/>
			{/each}
		{:else}
			<text
				x={VIEW_W / 2}
				y={VIEW_H / 2}
				text-anchor="middle"
				font-size="14"
				fill="#888"
			>Nicht genug Daten.</text>
		{/if}
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
