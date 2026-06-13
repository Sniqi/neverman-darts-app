<script lang="ts">
	// src/ui/display/PlayerPanel.svelte
	// One player column for the spectator display.
	// Prop-driven — does NOT read any store directly.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	// Props: player, isActive, config, legStartIndex, currentVisit (active player only)
	import { legAverage, matchAverage } from '../../engine/averages.js';
	import { getSuggestion } from '../../engine/checkout.js';
	import type { PlayerState, MatchConfig, DartScore, Visit } from '../../engine/types.js';
	import VisitLine from './VisitLine.svelte';

	interface Props {
		player: PlayerState;
		isActive: boolean;
		config: MatchConfig;
		legStartIndex: number;
		currentVisit?: DartScore[];
	}

	let { player, isActive, config, legStartIndex, currentVisit = [] }: Props = $props();

	function formatDart(dart: DartScore): string {
		if (dart.segment === 0) return '0';
		if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
		if (dart.multiplier === 1 && dart.segment === 25) return 'Outer';
		const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
		return `${prefix}${dart.segment}`;
	}

	// Live remaining: for the active player subtract the current-visit running total
	// so the score display counts down dart-by-dart (D-05).
	let liveRemaining = $derived.by(() => {
		if (!isActive || currentVisit.length === 0) return player.remaining;
		const visitTotal = currentVisit.reduce((s, d) => s + d.multiplier * d.segment, 0);
		return player.remaining - visitTotal;
	});

	let legAvg = $derived.by(() => {
		const legVisits = player.visits.slice(legStartIndex);
		const val = legAverage(legVisits, config.startScore, player.remaining);
		return val !== null ? val.toFixed(1) : '—';
	});

	let matchAvg = $derived.by(() => {
		const val = matchAverage(player.visits, config.startScore, player.remaining);
		return val !== null ? val.toFixed(1) : '—';
	});

	// Checkout route (D-06): shown only for the active player on a finishing score.
	let checkoutRoute = $derived.by(() => {
		if (!isActive) return null;
		const suggestion = getSuggestion(liveRemaining, config.outRule);
		return suggestion ? suggestion.join(' ') : null;
	});

	// Last 4 completed visits with running score context
	let recentVisitsWithScores = $derived.by(() => {
		const visits = player.visits;
		if (visits.length === 0) return [];
		let after = player.remaining;
		const result: Array<{ visit: Visit; scoreBefore: number; scoreAfter: number }> = [];
		for (let i = visits.length - 1; i >= Math.max(0, visits.length - 4); i--) {
			const v = visits[i];
			const total = v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
			const before = v.bust ? after : after + total;
			result.unshift({ visit: v, scoreBefore: before, scoreAfter: after });
			after = before;
		}
		return result;
	});

	// Last completed visit — needed for bust flash detection only
	let lastCompletedVisit: Visit | null = $derived(
		player.visits.length > 0 ? player.visits[player.visits.length - 1] : null
	);

	// BUST flash (D-08): show for ~2s when the last visit is a bust.
	let showBust = $state(false);
	let bustTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const isBust = isActive && lastCompletedVisit?.bust === true;
		if (isBust && !showBust) {
			showBust = true;
			bustTimer = setTimeout(() => {
				showBust = false;
				bustTimer = null;
			}, 2000);
		} else if (!isBust) {
			if (bustTimer !== null) {
				clearTimeout(bustTimer);
				bustTimer = null;
			}
			showBust = false;
		}
		return () => {
			if (bustTimer !== null) {
				clearTimeout(bustTimer);
				bustTimer = null;
			}
		};
	});
</script>

<div class="player-panel" class:active={isActive}>
	{#if showBust}
		<div class="bust-overlay">
			<span class="bust-label">BUST</span>
		</div>
	{/if}

	<div class="name-score-row">
		<div class="player-name">{player.name}</div>
		<div
			class="remaining-score"
			role="status"
			aria-live="polite"
		>{liveRemaining}</div>
	</div>

	<div class="legs-sets">
		{#if config.setsEnabled}
			<span>Sets: {player.setsWon}</span>
			<span> Legs: {player.legsWon}</span>
		{:else}
			<span>Legs: {player.legsWon}</span>
		{/if}
	</div>

	<!-- History of last 4 completed visits (≈ last 12 darts) -->
	<div class="history-section">
		{#each recentVisitsWithScores as { visit: v, scoreBefore, scoreAfter: scoreAfterVisit }, idx (idx)}
			{@const isLast = idx === recentVisitsWithScores.length - 1}
			{@const total = v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)}
			<div class="history-row" class:bust-row={v.bust} class:last-row={isLast}>
				<span class="h-score-before">{scoreBefore}</span>
				<span class="h-sep">-</span>
				<span class="h-total">{v.bust ? 'BUST' : total}</span>
				<span class="h-dart">{v.darts[0] ? formatDart(v.darts[0]) : ''}</span>
				<span class="h-dart">{v.darts[1] ? formatDart(v.darts[1]) : ''}</span>
				<span class="h-dart">{v.darts[2] ? formatDart(v.darts[2]) : ''}</span>
				<span class="h-sep">{v.bust ? '' : '='}</span>
				<span class="h-score-after">{v.bust ? '' : scoreAfterVisit}</span>
			</div>
		{/each}
	</div>

	{#if checkoutRoute}
		<div class="checkout-route">{checkoutRoute}</div>
	{/if}

	<VisitLine
		{currentVisit}
		lastCompletedVisit={null}
		completedTotal={null}
	/>

	<div class="stats-line">
		Ø Leg {legAvg} · Ø Match {matchAvg}
	</div>
</div>

<style>
	.player-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: var(--space-lg, 24px) var(--space-md, 16px);
		background: var(--surface, #1e2027);
		border-top: 3px solid transparent;
		opacity: 0.55;
		transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease;
		height: 100%;
		overflow: hidden;
		gap: var(--space-xs, 4px);
	}

	.player-panel.active {
		background: #22242d;
		border-top-color: #e8a020;
		box-shadow: inset 0 0 40px rgba(232, 160, 32, 0.08);
		opacity: 1;
	}

	/* BUST flash overlay (D-08) */
	.bust-overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(192, 57, 43, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 5;
		animation: bustFadeIn 150ms ease-out;
		pointer-events: none;
	}

	.bust-label {
		font-size: clamp(2rem, 5vw, 6rem);
		font-weight: 600;
		color: #c0392b;
		letter-spacing: 0.05em;
		animation: bustLabelIn 200ms ease-out;
	}

	@keyframes bustFadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	@keyframes bustLabelIn {
		from { opacity: 0; transform: scale(0.8); }
		to   { opacity: 1; transform: scale(1); }
	}

	.name-score-row {
		position: relative;
	}

	.player-name {
		font-size: clamp(3rem, 6vw, 8.4rem);
		font-weight: 600;
		line-height: 1.1;
		color: var(--text, #f0f0f0);
	}

	.legs-sets {
		font-size: clamp(2rem, 4vw, 5.6rem);
		font-weight: 600;
		color: var(--text, #f0f0f0);
	}

	.remaining-score {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		font-size: clamp(5rem, 10vw, 14rem);
		font-weight: 600;
		line-height: 1.0;
		letter-spacing: -0.02em;
		color: var(--text, #f0f0f0);
		text-align: center;
		pointer-events: none;
	}

	/* History of last ~12 darts */
	.history-section {
		flex: 1 1 auto;
		display: grid;
		grid-template-columns: auto auto auto auto auto auto auto auto;
		column-gap: 0.8em;
		align-content: end;
		justify-content: start;
		overflow: hidden;
		padding-bottom: var(--space-xs, 4px);
	}

	.history-row {
		display: contents;
	}

	.history-row > span {
		font-size: clamp(2.2rem, 3.75vw, 4.375rem);
		font-weight: 400;
		line-height: 1.4;
		color: var(--text, #f0f0f0);
		opacity: 0.55;
	}

	.history-row.last-row > span {
		opacity: 0.9;
	}

	.history-row.bust-row > span {
		color: #c0392b;
	}

	.h-score-before,
	.h-total,
	.h-score-after {
		font-weight: 600;
		text-align: right;
	}

	.h-sep {
		text-align: center;
	}

	.h-dart {
		text-align: right;
		opacity: 0.8;
	}

	/* Checkout route (D-06): accent color */
	.checkout-route {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 600;
		color: #e8a020;
	}

	.stats-line {
		font-size: clamp(2rem, 4vw, 5.6rem);
		font-weight: 400;
		line-height: 1.3;
		color: var(--text, #f0f0f0);
	}
</style>
