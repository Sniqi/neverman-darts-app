<script lang="ts">
	// src/ui/stats/StatCard.svelte
	// Reusable KPI tile: value (20px/600/#f0f0f0) above label (14px/400/#888).
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
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs, 4px);
	}

	.stat-value {
		font-size: 28px;
		font-weight: 600;
		color: #f0f0f0;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 18px;
		font-weight: 400;
		color: #888888;
		line-height: 1.4;
	}
</style>
