<script lang="ts">
	// src/ui/display/PlayerPanel.svelte
	// One player column for the spectator display.
	// Prop-driven — does NOT read any store directly.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	// Props: player, isActive, config, legStartIndex, currentVisit (active player only)
	import { onDestroy } from 'svelte';
	import { legAverage, matchAverage } from '../../engine/averages.js';
	import { getSuggestion } from '../../engine/checkout.js';
	import type { PlayerState, MatchConfig, DartScore, Visit } from '../../engine/types.js';

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

	let liveVisitTotal = $derived(currentVisit.reduce((s, d) => s + d.multiplier * d.segment, 0));

	// Live remaining: for the active player subtract the current-visit running total
	// so the score display counts down dart-by-dart (D-05).
	let liveRemaining = $derived.by(() => {
		if (!isActive || currentVisit.length === 0) return player.remaining;
		return player.remaining - liveVisitTotal;
	});

	// Live in-progress visit shown as the bottom history row (replaces the separate
	// VisitLine): present only for the active player once at least one dart is thrown.
	let hasLiveRow = $derived(isActive && currentVisit.length > 0);

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
		const result: Array<{ visit: Visit; total: number; scoreAfter: number }> = [];
		for (let i = visits.length - 1; i >= Math.max(0, visits.length - 4); i--) {
			const v = visits[i];
			const total = v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
			const before = v.bust ? after : after + total;
			result.unshift({ visit: v, total, scoreAfter: after });
			after = before;
		}
		return result;
	});

	// Last completed visit — needed for bust flash detection only
	let lastCompletedVisit: Visit | null = $derived(
		player.visits.length > 0 ? player.visits[player.visits.length - 1] : null
	);

	// BUST flash (D-08): flash for ~2s the moment a bust visit is appended.
	// Detected by transition (visit count grows AND the new last visit is a bust),
	// NOT by `isActive`: on a bust the reducer immediately passes the turn to the
	// next player, so this panel is no longer active when the bust lands. Gating on
	// isActive made the flash appear one turn late (when play cycled back).
	let showBust = $state(false);
	let bustTimer: ReturnType<typeof setTimeout> | null = null;
	// null until the first effect run — so a bust already present on mount does not
	// flash (only a genuine new bust does).
	let prevVisitCount: number | null = null;

	$effect(() => {
		const count = player.visits.length;
		if (prevVisitCount !== null && count > prevVisitCount && lastCompletedVisit?.bust === true) {
			showBust = true;
			if (bustTimer !== null) clearTimeout(bustTimer);
			bustTimer = setTimeout(() => {
				showBust = false;
				bustTimer = null;
			}, 2000);
		}
		prevVisitCount = count;
	});

	// RECV-05: remaining-score update flash — draws the eye across the room when the
	// score changes. Color-only (no transform) so layout is unaffected (SYNC-04 safe).
	let showUpdating = $state(false);
	let updatingTimer: ReturnType<typeof setTimeout> | null = null;
	// null until first effect run — no flash on initial render.
	let prevRemaining: number | null = null;

	$effect(() => {
		const r = liveRemaining;
		if (prevRemaining !== null && r !== prevRemaining) {
			showUpdating = true;
			if (updatingTimer !== null) clearTimeout(updatingTimer);
			updatingTimer = setTimeout(() => {
				showUpdating = false;
				updatingTimer = null;
			}, 300);
		}
		prevRemaining = r;
	});

	onDestroy(() => {
		if (bustTimer !== null) clearTimeout(bustTimer);
		if (updatingTimer !== null) clearTimeout(updatingTimer);
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
				class:updating={showUpdating}
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

	{#snippet dartPills(darts: DartScore[])}
		<div class="h-darts">
			{#each darts as d}
				<span
					class="dart-pill"
					class:triple={d.multiplier === 3 && d.segment !== 25}
					class:double={d.multiplier === 2 && d.segment !== 25}
					class:bull={d.segment === 25}
					class:miss={d.segment === 0}
				>{formatDart(d)}</span>
			{/each}
		</div>
	{/snippet}

	<!-- Checkout suggestion (D-06): the darts to throw, shown above the history -->
	{#if checkoutRoute}
		<div class="checkout-route">{checkoutRoute}</div>
	{/if}

	<!-- Recent completed visits + the live in-progress visit as the bottom row -->
	<div class="history-box">
		<div class="history-section">
			{#each recentVisitsWithScores as { visit: v, total, scoreAfter: scoreAfterVisit }, idx (idx)}
				{@const isLast = idx === recentVisitsWithScores.length - 1 && !hasLiveRow}
				<div class="history-row" class:bust-row={v.bust} class:last-row={isLast}>
					{@render dartPills(v.darts)}
					<span class="h-total">{v.bust ? 'BUST' : total}</span>
					<span class="h-remaining"><span class="h-arrow" aria-hidden="true">→</span>{scoreAfterVisit}</span>
				</div>
			{/each}
			{#if hasLiveRow}
				<div class="history-row last-row live-row">
					{@render dartPills(currentVisit)}
					<span class="h-total">{liveVisitTotal}</span>
					<span class="h-remaining"><span class="h-arrow" aria-hidden="true">→</span>{liveRemaining}</span>
				</div>
			{/if}
		</div>
	</div>

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
		padding: clamp(8px, 2cqw, 24px) clamp(8px, 2cqw, 18px);
		background: linear-gradient(165deg, #1f222b 0%, #16181f 100%);
		border-top: 4px solid transparent;
		opacity: 0.5;
		transition: background 200ms ease, border-color 200ms ease, opacity 200ms ease,
			box-shadow 200ms ease;
		height: 100%;
		overflow: hidden;
		gap: clamp(4px, 1.2cqw, 12px);
		font-variant-numeric: tabular-nums;
		/* Each panel sizes its own text to its column width (cqw) — so 2/3/4-player
		   layouts and any viewport scale proportionally instead of bleeding over. */
		container-type: inline-size;
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
		font-size: clamp(1.5rem, 17cqw, 6rem);
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
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.3em;
		min-width: 0;
	}

	.player-name {
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: clamp(1.6rem, 11cqw, 8.5rem);
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
		font-size: clamp(1.1rem, 6.5cqw, 4.4rem);
		font-weight: 600;
		line-height: 1.15;
		white-space: nowrap;
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
		flex: 0 0 auto;
		font-size: clamp(3rem, 23cqw, 16rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--text, #f0f0f0);
		text-align: right;
		pointer-events: none;
		transition: color 300ms ease-out;
	}

	/* RECV-05: momentary white flash when score updates — draws the eye across the room */
	.remaining-score.updating {
		color: #ffffff;
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
		padding: clamp(4px, 1cqw, 10px);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.player-panel.active .history-box {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--line-strong, rgba(255, 255, 255, 0.14));
	}

	/* Full-width visit rows. A single 3-column grid aligns darts | total | rest
	   across every row; each row re-exposes those tracks via subgrid so it can
	   carry its own rounded background while staying column-aligned. */
	.history-section {
		flex: 1 1 auto;
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-content: end;
		row-gap: clamp(3px, 0.8cqw, 9px);
		overflow: hidden;
	}

	.history-row {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: center;
		column-gap: clamp(0.4em, 1.5cqw, 0.9em);
		padding: clamp(3px, 0.9cqw, 9px) clamp(6px, 1.6cqw, 14px);
		border-radius: var(--radius-sm, 8px);
		background: rgba(255, 255, 255, 0.03);
		opacity: 0.62;
		transition: opacity 200ms ease, background 200ms ease;
	}

	/* Newest visit reads first: brighter, accent-tinted, amber edge */
	.history-row.last-row {
		opacity: 1;
		background: var(--accent-soft, rgba(232, 160, 32, 0.12));
		box-shadow: inset 3px 0 0 var(--accent, #e8a020);
	}

	/* Live in-progress visit: stronger tint + gentle pulse on the amber edge */
	.history-row.live-row {
		background: rgba(232, 160, 32, 0.18);
		animation: liveRowPulse 1.6s ease-in-out infinite;
	}

	@keyframes liveRowPulse {
		0%, 100% { box-shadow: inset 3px 0 0 var(--accent, #e8a020); }
		50%      { box-shadow: inset 5px 0 0 var(--accent, #e8a020); }
	}

	/* Darts: pills, left-aligned, wrap only as a last resort */
	.h-darts {
		display: flex;
		flex-wrap: wrap;
		gap: clamp(0.2em, 0.8cqw, 0.5em);
		min-width: 0;
	}

	.dart-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(1rem, 5cqw, 3.2rem);
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: 0.01em;
		padding: 0.12em 0.5em;
		border-radius: 999px;
		white-space: nowrap;
		color: rgba(240, 240, 240, 0.78);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--line, rgba(255, 255, 255, 0.08));
	}

	/* High-value darts glow amber so big visits pop from across the room */
	.dart-pill.triple,
	.dart-pill.bull {
		color: var(--accent, #e8a020);
		background: var(--accent-soft, rgba(232, 160, 32, 0.12));
		border-color: var(--accent-line, rgba(232, 160, 32, 0.45));
	}

	.dart-pill.double {
		color: #f0d8a8;
		background: rgba(232, 160, 32, 0.07);
		border-color: rgba(232, 160, 32, 0.3);
	}

	.dart-pill.miss {
		color: rgba(240, 240, 240, 0.35);
		border-style: dashed;
	}

	/* Visit total — the headline number for the row */
	.h-total {
		font-size: clamp(1.2rem, 6.7cqw, 4.5rem);
		font-weight: 700;
		line-height: 1;
		text-align: right;
		color: var(--text, #f0f0f0);
		white-space: nowrap;
	}

	/* Remaining after the visit — quieter, with a direction cue */
	.h-remaining {
		display: inline-flex;
		align-items: baseline;
		gap: 0.25em;
		font-size: clamp(1rem, 5.4cqw, 3.6rem);
		font-weight: 600;
		text-align: right;
		color: rgba(240, 240, 240, 0.5);
		white-space: nowrap;
	}

	.history-row.last-row .h-remaining {
		color: rgba(240, 240, 240, 0.78);
	}

	.h-arrow {
		opacity: 0.45;
		font-weight: 400;
	}

	/* Bust: red total, struck-through dart pills, score unchanged */
	.history-row.bust-row .h-total {
		color: var(--destructive, #c0392b);
		font-size: clamp(1rem, 4.8cqw, 3.2rem);
	}

	.history-row.bust-row .dart-pill {
		color: rgba(192, 57, 43, 0.7);
		background: rgba(192, 57, 43, 0.08);
		border-color: rgba(192, 57, 43, 0.3);
		text-decoration: line-through;
	}

	/* Checkout route (D-06): amber callout pill */
	.checkout-route {
		align-self: flex-start;
		font-size: clamp(1rem, 5.5cqw, 3rem);
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
		flex-wrap: wrap;
		gap: var(--space-xs, 4px) var(--space-md, 16px);
		padding-top: var(--space-sm, 8px);
		border-top: 1px solid var(--line, rgba(255, 255, 255, 0.08));
		font-size: clamp(1rem, 5.8cqw, 3.8rem);
		font-weight: 400;
		line-height: 1.2;
		color: var(--text, #f0f0f0);
	}

	.stat {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3em;
		white-space: nowrap;
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
