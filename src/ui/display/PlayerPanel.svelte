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

	<div class="top-zone">
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
				<span class="ls-chip">Sets: {player.setsWon}</span>
				<span class="ls-chip">Legs: {player.legsWon}</span>
			{:else}
				<span class="ls-chip">Legs: {player.legsWon}</span>
			{/if}
		</div>
	</div>

	<!-- History of last 4 completed visits (≈ last 12 darts) -->
	<div class="history-box">
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
		<span class="stat"><span class="stat-label">Ø Leg</span> <span class="stat-val">{legAvg}</span></span>
		<span class="stat-div" aria-hidden="true"></span>
		<span class="stat"><span class="stat-label">Ø Match</span> <span class="stat-val">{matchAvg}</span></span>
	</div>
</div>

<style>
	.player-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: var(--space-lg, 24px) var(--space-md, 16px);
		background: linear-gradient(165deg, #1f222b 0%, #16181f 100%);
		border-top: 4px solid transparent;
		opacity: 0.5;
		transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease,
			box-shadow 200ms ease;
		height: 100%;
		overflow: hidden;
		gap: var(--space-sm, 8px);
		font-variant-numeric: tabular-nums;
	}

	.player-panel.active {
		background: linear-gradient(165deg, #2b2f3b 0%, #1c1f29 100%);
		border-top-color: var(--accent, #e8a020);
		box-shadow: inset 0 0 60px rgba(232, 160, 32, 0.08),
			inset 0 4px 0 rgba(232, 160, 32, 0.22);
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

	/* Top zone: name + score + leg/set chips, closed by a hairline rule */
	.top-zone {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		padding-bottom: var(--space-md, 16px);
		border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
	}

	.name-score-row {
		position: relative;
	}

	.player-name {
		font-size: clamp(3rem, 6vw, 8.4rem);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.01em;
		color: var(--text, #f0f0f0);
	}

	.legs-sets {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm, 8px);
	}

	.ls-chip {
		display: inline-flex;
		align-items: baseline;
		font-size: clamp(1.75rem, 3.2vw, 4.6rem);
		font-weight: 600;
		line-height: 1.15;
		color: var(--text, #f0f0f0);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-sm, 8px);
		padding: 0.08em 0.45em;
	}

	.player-panel.active .ls-chip {
		background: var(--accent-soft, rgba(232, 160, 32, 0.12));
		border-color: var(--accent-line, rgba(232, 160, 32, 0.45));
	}

	.remaining-score {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		font-size: clamp(5rem, 10vw, 14rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--text, #f0f0f0);
		text-align: center;
		pointer-events: none;
	}

	.player-panel.active .remaining-score {
		color: #ffffff;
		text-shadow: 0 0 55px rgba(232, 160, 32, 0.4), 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	/* History of last ~12 darts, framed as a recessed panel */
	.history-box {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		border-radius: var(--radius-md, 12px);
		padding: var(--space-sm, 8px) var(--space-md, 16px);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.player-panel.active .history-box {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--line-strong, rgba(255, 255, 255, 0.14));
	}

	.history-section {
		flex: 1 1 auto;
		display: grid;
		grid-template-columns: auto auto auto auto auto auto auto auto;
		column-gap: 0.8em;
		row-gap: 0.1em;
		align-content: end;
		justify-content: start;
		overflow: hidden;
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
		opacity: 1;
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

	/* Checkout route (D-06): amber callout pill */
	.checkout-route {
		align-self: flex-start;
		font-size: clamp(1.2rem, 2.2vw, 2.8rem);
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--accent, #e8a020);
		background: var(--accent-soft, rgba(232, 160, 32, 0.12));
		border: 1px solid var(--accent-line, rgba(232, 160, 32, 0.45));
		border-radius: 999px;
		padding: 0.12em 0.7em;
		box-shadow: 0 0 24px rgba(232, 160, 32, 0.12);
	}

	/* Averages: structured footer stat-bar with a dividing rule */
	.stats-line {
		display: flex;
		align-items: center;
		gap: var(--space-md, 16px);
		padding-top: var(--space-sm, 8px);
		border-top: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		font-size: clamp(2rem, 4vw, 5.6rem);
		font-weight: 400;
		line-height: 1.2;
		color: var(--text, #f0f0f0);
	}

	.stat {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3em;
		min-width: 0;
	}

	.stat-label {
		color: rgba(240, 240, 240, 0.6);
		font-weight: 500;
	}

	.stat-val {
		font-weight: 700;
	}

	.stat-div {
		align-self: stretch;
		width: 1px;
		margin: 0.15em 0;
		background: var(--line-strong, rgba(255, 255, 255, 0.14));
	}
</style>
