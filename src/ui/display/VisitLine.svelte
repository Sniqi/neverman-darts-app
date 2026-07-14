<script lang="ts">
	// src/ui/display/VisitLine.svelte
	// Display-only live dart slot / completed visit line for the spectator panel.
	// NO undo buttons — pure presentation component.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	import type { DartScore, Visit } from '../../engine/types.js';
	import { formatDartShort } from '../input/dart-notation.js';

	interface Props {
		currentVisit: DartScore[];
		lastCompletedVisit: Visit | null;
		completedTotal: number | null;
	}

	let { currentVisit, lastCompletedVisit, completedTotal }: Props = $props();

	// Live mid-visit: fill 3 slots with darts or en-dash placeholders, middle-dot separators
	let liveSlotText = $derived.by(() => {
		return [0, 1, 2]
			.map(i => currentVisit[i] ? formatDartShort(currentVisit[i]) : '–') // U+2013 en-dash
			.join(' · '); // U+00B7 middle-dot separator
	});

	// Completed visit total (sum of individual darts for dart-by-dart visits)
	let completedVisitTotal = $derived.by(() => {
		if (!lastCompletedVisit) return null;
		if (lastCompletedVisit.darts.length === 0) return completedTotal; // numpad: use passed total
		return lastCompletedVisit.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
	});

	// Completed dart breakdown text: "T20 · 20 · 20"
	let completedBreakdown = $derived.by(() => {
		if (!lastCompletedVisit || lastCompletedVisit.darts.length === 0) return null;
		return lastCompletedVisit.darts.map(formatDartShort).join(' · '); // middle-dot U+00B7
	});

	// Which mode to show:
	// - 'live': currentVisit has darts being thrown
	// - 'completed-darts': last completed visit has individual darts
	// - 'completed-numpad': last completed visit was numpad (darts.length === 0)
	// - 'empty': nothing to show
	let mode = $derived.by(() => {
		if (currentVisit.length > 0) return 'live';
		if (lastCompletedVisit) {
			return lastCompletedVisit.darts.length > 0 ? 'completed-darts' : 'completed-numpad';
		}
		return 'empty';
	});
</script>

{#if mode === 'live'}
	<div class="visit-line visit-line--live">
		{liveSlotText}
	</div>
{:else if mode === 'completed-darts'}
	<div class="visit-line visit-line--completed">
		<span class="visit-total">{completedVisitTotal}</span>
		<span class="visit-sep">&nbsp;—&nbsp;</span><span class="visit-breakdown">{completedBreakdown}</span>
	</div>
{:else if mode === 'completed-numpad'}
	<div class="visit-line visit-line--numpad">
		<span class="visit-total">{completedVisitTotal}</span>
	</div>
{/if}

<style>
	.visit-line {
		font-size: clamp(1rem, 5cqw, 3.2rem);
		font-weight: 400;
		line-height: 1.3;
		color: var(--text);
		margin-top: var(--space-xs);
	}

	.visit-sep {
		color: var(--text);
		opacity: 0.5;
	}

	.visit-total {
		font-weight: 600;
		font-family: var(--font-score);
		font-variant-numeric: tabular-nums;
	}

	.visit-breakdown {
		opacity: 0.8;
	}
</style>
