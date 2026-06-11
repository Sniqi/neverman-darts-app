<script lang="ts">
	// src/ui/display/MatchHeader.svelte
	// Slim 40px header bar for the spectator display (D-03).
	// Shows: startScore, out rule, format, current leg.
	import type { MatchConfig } from '../../engine/types.js';

	interface Props {
		config: MatchConfig;
		currentLeg: number;
	}

	let { config, currentLeg }: Props = $props();

	let outRuleLabel = $derived(config.outRule === 'double' ? 'Double Out' : 'Single Out');

	let formatLabel = $derived.by(() => {
		if (config.setsEnabled) {
			return `First to ${config.setsToWin} Sets`;
		}
		return `First to ${config.legsToWin} Legs`;
	});
</script>

<div class="match-header">
	{config.startScore} {outRuleLabel} · {formatLabel} · Leg {currentLeg}
</div>

<style>
	.match-header {
		height: 40px;
		display: flex;
		align-items: center;
		padding: 0 var(--space-lg, 24px);
		background: var(--surface, #1e2027);
		font-size: clamp(0.75rem, 1.2vw, 1.5rem);
		font-weight: 400;
		line-height: 1.2;
		color: var(--text, #f0f0f0);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
