<script lang="ts">
	// src/ui/stats/StatCard.svelte
	// Reusable KPI tile: value (20px/600/var(--text)) above label (14px/400/var(--text-muted)).
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
		border-radius: 8px;
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-value {
		font-size: 28px;
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 18px;
		font-weight: 400;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
