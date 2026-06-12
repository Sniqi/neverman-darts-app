<script lang="ts">
	// src/ui/stats/DartsPerLegChart.svelte
	// Bar chart for darts-per-leg distribution (STAT-08).
	// Hand-rolled SVG — no chart library (CLAUDE.md smallest-runtime; UI-SPEC Chart Contract).
	// Security T-04-05: all strings via {interpolation} — never {@html}.

	interface Props {
		values: number[]; // darts per leg, oldest → newest
	}

	let { values }: Props = $props();

	// Bar geometry: vertical bars, one per leg entry
	const VIEW_H = 100;
	const PAD_LEFT = 10;
	const PAD_RIGHT = 10;
	const PAD_TOP = 8;
	const PAD_BOTTOM = 20; // space for x-axis labels

	// Dynamic view width based on bar count (min 300)
	const BAR_W = 24;
	const BAR_GAP = 6;
	const minViewW = 300;
	const viewW: number = $derived(
		Math.max(minViewW, PAD_LEFT + PAD_RIGHT + values.length * (BAR_W + BAR_GAP))
	);

	const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;

	const maxVal: number = $derived(values.length > 0 ? Math.max(...values, 1) : 1);

	// Find the best (minimum) leg for accent colouring
	const bestIdx: number = $derived(
		values.length > 0 ? values.indexOf(Math.min(...values)) : -1
	);

	function barHeight(val: number): number {
		return (val / maxVal) * PLOT_H;
	}

	function barX(i: number): number {
		return PAD_LEFT + i * (BAR_W + BAR_GAP);
	}

	function barY(val: number): number {
		return PAD_TOP + PLOT_H - barHeight(val);
	}

	const ariaLabel: string = $derived(
		values.length > 0
			? `Darts pro Leg: ${values.length} Legs, Bestes Leg ${Math.min(...values)} Darts`
			: 'Darts pro Leg: Keine Daten.'
	);
</script>

<div class="chart-card">
	<h3 class="chart-title">Darts pro Leg</h3>
	{#if values.length === 0}
		<p class="empty-text">Nicht genug Daten.</p>
	{:else}
		<div class="chart-scroll">
			<svg
				role="img"
				aria-label={ariaLabel}
				viewBox="0 0 {viewW} {VIEW_H}"
				width="100%"
			>
				<!-- X-axis baseline -->
				<line
					x1={PAD_LEFT}
					y1={PAD_TOP + PLOT_H}
					x2={viewW - PAD_RIGHT}
					y2={PAD_TOP + PLOT_H}
					stroke="#444"
					stroke-width="1"
				/>
				{#each values as val, i}
					{@const bh = barHeight(val)}
					{@const bx = barX(i)}
					{@const by = barY(val)}
					{@const fill = i === bestIdx ? '#e8a020' : '#444'}
					<!-- Bar -->
					<rect
						x={bx}
						y={by}
						width={BAR_W}
						height={bh}
						{fill}
						rx="2"
					/>
					<!-- Value label above bar -->
					<text
						x={bx + BAR_W / 2}
						y={by - 3}
						text-anchor="middle"
						font-size="11"
						fill="#f0f0f0"
					>{val}</text>
					<!-- Leg index below axis -->
					<text
						x={bx + BAR_W / 2}
						y={PAD_TOP + PLOT_H + 14}
						text-anchor="middle"
						font-size="11"
						fill="#888"
					>{i + 1}</text>
				{/each}
			</svg>
		</div>
	{/if}
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

	.chart-scroll {
		overflow-x: auto;
	}

	.empty-text {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0;
		text-align: center;
		padding: var(--space-md, 16px) 0;
	}
</style>
