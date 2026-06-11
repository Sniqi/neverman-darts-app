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
	// getSuggestion handles >170 and bogey suppression.
	let checkoutRoute = $derived.by(() => {
		if (!isActive) return null;
		const suggestion = getSuggestion(liveRemaining, config.outRule);
		return suggestion ? suggestion.join(' ') : null;
	});

	// Last completed visit for the visit line display
	let lastCompletedVisit: Visit | null = $derived(
		player.visits.length > 0 ? player.visits[player.visits.length - 1] : null
	);

	// For numpad visits the total must be computed from the score delta.
	// We use config.startScore - player.remaining as the match-level scored total,
	// but we need the visit-level total. For the last numpad visit we approximate:
	// if darts is empty, the visit total = startScore - player.remaining for 1-visit scenarios,
	// but for multi-visit: we can't easily reconstruct without the previous remaining.
	// Resolution per RESEARCH Open Question 1: pass completedTotal from the parent perspective
	// using the score delta for the *last* visit based on full visits array traversal.
	let completedTotal: number | null = $derived.by(() => {
		if (!lastCompletedVisit || lastCompletedVisit.darts.length > 0) return null;
		// Numpad visit: compute this visit's total from score delta.
		// We sum all dart visits before it to get remaining before this visit,
		// then delta = (remaining before visit) - player.remaining.
		// For simplicity, since we cannot recover previous remaining from Visit alone,
		// we rely on the approach: total = config.startScore - player.remaining
		// minus all prior visits' dart scores. But for display purposes, we use
		// the full match average approach: sum all darts, subtract from startScore.
		// Simpler: walk visits before the last one:
		const priorVisits = player.visits.slice(0, player.visits.length - 1);
		const priorScored = priorVisits.reduce((sum, v) => {
			if (v.bust) return sum; // bust visits scored 0
			if (v.darts.length > 0) return sum + v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
			// Another numpad visit before this one — we can't know its total from darts alone.
			// Fall back to 0 for this degenerate case (consecutive numpad visits).
			return sum;
		}, 0);
		const totalScored = config.startScore - player.remaining;
		return Math.max(0, totalScored - priorScored);
	});

	// BUST flash (D-08): show for ~2s when the last visit is a bust.
	// Uses $state + $effect + setTimeout so it auto-clears.
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

	<div class="player-name">{player.name}</div>

	<div class="legs-sets">
		{#if config.setsEnabled}
			<span>S: {player.setsWon}</span>
			<span> L: {player.legsWon}</span>
		{:else}
			<span>L: {player.legsWon}</span>
		{/if}
	</div>

	<div class="score-block">
		<div
			class="remaining-score"
			role="status"
			aria-live="polite"
		>{liveRemaining}</div>
	</div>

	{#if checkoutRoute}
		<div class="checkout-route">{checkoutRoute}</div>
	{/if}

	<VisitLine
		{currentVisit}
		{lastCompletedVisit}
		{completedTotal}
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
		justify-content: space-between;
		padding: var(--space-lg, 24px) var(--space-md, 16px);
		background: var(--surface, #1e2027);
		border-top: 3px solid transparent;
		opacity: 0.55;
		transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease;
		height: 100%;
		overflow: hidden;
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

	.player-name {
		font-size: clamp(1.5rem, 3vw, 4rem);
		font-weight: 600;
		line-height: 1.1;
		color: var(--text, #f0f0f0);
	}

	.legs-sets {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 600;
		color: var(--text, #f0f0f0);
		margin-top: var(--space-sm, 8px);
	}

	.score-block {
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remaining-score {
		font-size: clamp(4rem, 8vw, 12rem);
		font-weight: 600;
		line-height: 1.0;
		letter-spacing: -0.02em;
		color: var(--text, #f0f0f0);
	}

	/* Checkout route (D-06): accent color, shown above visit line */
	.checkout-route {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 600;
		color: #e8a020;
		margin-top: var(--space-sm, 8px);
	}

	.stats-line {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 400;
		line-height: 1.3;
		color: var(--text, #f0f0f0);
		margin-top: var(--space-sm, 8px);
	}
</style>
