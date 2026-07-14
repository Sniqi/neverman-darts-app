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
		gap: clamp(0.5rem, 1.2vw, 1.6rem);
		padding: clamp(8px, 1vw, 20px) clamp(16px, 2.5vw, 48px);
		background: linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%);
		font-family: var(--font-score);
		font-size: clamp(1.75rem, 3.4vw, 6.5rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		border-bottom: 3px solid var(--accent);
		box-shadow: var(--shadow-panel);
		font-variant-numeric: tabular-nums;
	}

	/* Soft amber bloom riding just under the accent rule. Background is a
	   precomputed static rgba for MatchHeader.jsx's literal translucent-accent
	   mix at 28% intensity — Chrome 90 (Cast receiver) has no color-mixing support. */
	.match-header::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -3px;
		height: 16px;
		background: linear-gradient(180deg, rgba(240, 164, 36, 0.28), transparent);
		pointer-events: none;
	}

	.mh-seg {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mh-mode {
		font-weight: 700;
		flex-shrink: 0;
	}

	.mh-format {
		color: var(--text-soft);
	}

	.mh-leg {
		color: var(--accent);
		font-weight: 800;
		flex-shrink: 0;
	}

	.mh-dot {
		color: var(--accent);
		font-size: 0.4em;
		line-height: 1;
		opacity: 0.85;
		flex-shrink: 0;
		transform: translateY(-0.15em);
	}
</style>
