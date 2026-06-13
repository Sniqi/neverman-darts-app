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
	<span class="mh-seg mh-mode">{config.startScore} {outRuleLabel}</span>
	<span class="mh-dot" aria-hidden="true">●</span>
	<span class="mh-seg mh-format">{formatLabel}</span>
	<span class="mh-dot" aria-hidden="true">●</span>
	<span class="mh-seg mh-leg">Leg {currentLeg}</span>
</div>

<style>
	.match-header {
		position: relative;
		display: flex;
		align-items: center;
		gap: clamp(0.4rem, 1vw, 1.2rem);
		padding: var(--space-sm, 8px) var(--space-lg, 24px);
		background: linear-gradient(180deg, #24272f 0%, #181a21 100%);
		font-size: clamp(2rem, 4vw, 5.6rem);
		font-weight: 500;
		line-height: 1.15;
		color: var(--text, #f0f0f0);
		white-space: nowrap;
		overflow: hidden;
		border-bottom: 3px solid var(--accent, #e8a020);
		box-shadow: var(--shadow-panel, 0 6px 20px rgba(0, 0, 0, 0.45));
		font-variant-numeric: tabular-nums;
	}

	/* Soft amber bloom riding just under the accent rule */
	.match-header::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -3px;
		height: 14px;
		background: linear-gradient(180deg, rgba(232, 160, 32, 0.28), transparent);
		pointer-events: none;
	}

	.mh-seg {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mh-mode {
		font-weight: 600;
		flex-shrink: 0;
	}

	.mh-format {
		color: rgba(240, 240, 240, 0.74);
	}

	.mh-leg {
		color: var(--accent, #e8a020);
		font-weight: 700;
		flex-shrink: 0;
	}

	.mh-dot {
		color: var(--accent, #e8a020);
		font-size: 0.45em;
		line-height: 1;
		opacity: 0.85;
		flex-shrink: 0;
		transform: translateY(-0.1em);
	}
</style>
