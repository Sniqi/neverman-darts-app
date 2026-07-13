<script lang="ts">
	// src/ui/stats/StatCard.svelte
	// Reusable KPI tile: value (40px/700/var(--text), -0.02em tracking) above label (17px/500/var(--text-muted)).
	// Caller pre-formats value (e.g. "42.3", "67%", "—").
	// Security T-04-03: all strings via {interpolation} — never {@html}.

	interface Props {
		label: string;
		value: string;
	}

	let { label, value }: Props = $props();
</script>

<div class="stat-card">
	<span class="stat-value">{value}</span>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat-card {
		background: var(--surface);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
		border: 1px solid var(--line);
		box-shadow: var(--edge-highlight);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-value {
		font-size: var(--text-3xl);
		font-weight: 700;
		letter-spacing: var(--tracking-tight);
		color: var(--text);
		line-height: 1.1;
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
