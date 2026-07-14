<script lang="ts">
	// src/ui/display/PlayerPanel.svelte
	// One player column for the spectator display.
	// Prop-driven — does NOT read any store directly.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	// Props: player, isActive, config, legStartIndex, currentVisit (active player only)
	import { onDestroy } from 'svelte';
	import { legAverage, matchAverage } from '../../engine/averages.js';
	import { getSuggestion } from '../../engine/checkout.js';
	import { formatDartShort } from '../input/dart-notation.js';
	import type { PlayerState, MatchConfig, DartScore, Visit } from '../../engine/types.js';

	interface Props {
		player: PlayerState;
		isActive: boolean;
		config: MatchConfig;
		legStartIndex: number;
		currentVisit?: DartScore[];
	}

	let { player, isActive, config, legStartIndex, currentVisit = [] }: Props = $props();

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
				>{formatDartShort(d)}</span>
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
		background: linear-gradient(165deg, #1a1e29 0%, #12151d 100%);
		border-top: 5px solid transparent;
		opacity: 0.5;
		transition: background var(--dur-med) var(--ease), border-color var(--dur-med) var(--ease),
			opacity var(--dur-med) var(--ease), box-shadow var(--dur-med) var(--ease);
		height: 100%;
		overflow: hidden;
		gap: clamp(4px, 1.2cqw, 12px);
		font-variant-numeric: tabular-nums;
		/* Each panel sizes its own text to its column width (cqw) — so 2/3/4-player
		   layouts and any viewport scale proportionally instead of bleeding over. */
		container-type: inline-size;
	}

	.player-panel.active {
		background: linear-gradient(165deg, #272d3c 0%, #191d28 100%);
		border-top-color: var(--accent);
		/* Precomputed translucent-accent mixes (7% ambient glow, 22% top-edge glow) —
		   static rgba() for Chrome-90 safety, not a live color-mix expression. */
		box-shadow: inset 0 0 80px rgba(240, 164, 36, 0.07),
			inset 0 5px 0 rgba(240, 164, 36, 0.22);
		opacity: 1;
	}

	/* BUST flash overlay (D-08) */
	.bust-overlay {
		position: absolute;
		inset: 0;
		background-color: rgba(229, 72, 77, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 5;
		animation: bustFadeIn var(--dur-base) var(--ease);
		pointer-events: none;
	}

	.bust-label {
		font-family: var(--font-score);
		font-size: clamp(3rem, 14cqw, 12rem);
		font-weight: 800;
		color: var(--destructive);
		letter-spacing: var(--tracking-caps);
		text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
		animation: bustLabelIn var(--dur-med) var(--ease);
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
		gap: var(--space-sm);
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--line);
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
		font-size: var(--display-name);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.01em;
		color: var(--text);
	}

	.legs-sets {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.ls-chip {
		display: inline-flex;
		align-items: baseline;
		font-size: var(--display-body);
		font-weight: 600;
		line-height: 1.15;
		white-space: nowrap;
		color: var(--text);
		background: var(--line);
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0.08em 0.45em;
	}

	.player-panel.active .ls-chip {
		background: var(--accent-soft);
		border-color: var(--accent-line);
	}

	.remaining-score {
		flex: 0 0 auto;
		font-size: var(--display-score);
		font-weight: 800;
		line-height: 0.95;
		letter-spacing: var(--tracking-tight);
		color: var(--text);
		text-align: right;
		pointer-events: none;
		transition: color var(--dur-slow) var(--ease);
		font-family: var(--font-score);
	}

	/* RECV-05: momentary white flash when score updates — draws the eye across the room */
	.remaining-score.updating {
		color: var(--text);
	}

	.player-panel.active .remaining-score {
		color: var(--text);
		/* Precomputed translucent-accent mix (40%) — Chrome-90 safe static rgba(). */
		text-shadow: 0 0 55px rgba(240, 164, 36, 0.40), 0 2px 10px var(--backdrop);
	}

	/* History of last ~12 darts, framed as a recessed panel */
	.history-box {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		background: rgba(0, 0, 0, 0.22);
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: clamp(5px, 1cqw, 12px);
		box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	/* Full-width visit rows. A single 3-column grid aligns darts | total | rest
	   across every row; each row re-exposes those tracks via subgrid so it can
	   carry its own rounded background while staying column-aligned. */
	.history-section {
		flex: 1 1 auto;
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-content: end;
		row-gap: clamp(4px, 0.8cqw, 10px);
		overflow: hidden;
	}

	.history-row {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: center;
		column-gap: clamp(0.4em, 1.5cqw, 1em);
		padding: clamp(4px, 0.9cqw, 10px) clamp(8px, 1.6cqw, 16px);
		border-radius: var(--radius-sm);
		background: rgba(255, 255, 255, 0.03);
		opacity: 0.62;
		transition: opacity var(--dur-med) var(--ease), background var(--dur-med) var(--ease);
	}

	/* Newest visit reads first: brighter, accent-tinted, amber edge */
	.history-row.last-row {
		opacity: 1;
		background: var(--accent-soft);
		box-shadow: inset 4px 0 0 var(--accent);
	}

	/* Live in-progress visit: stronger tint + gentle pulse on the amber edge.
	   liveRowPulse is a LOCKED exception (CONTEXT.md): continuous ambient live
	   indicator, not a one-shot transition — duration/easing keyword stay literal. */
	.history-row.live-row {
		/* Precomputed translucent-accent mix (17%) — Chrome-90 safe static rgba(),
		   reading more saturated than the last-completed row's 13% token. */
		background: rgba(240, 164, 36, 0.17);
		animation: liveRowPulse 1.6s ease-in-out infinite;
	}

	@keyframes liveRowPulse {
		0%, 100% { box-shadow: inset 3px 0 0 var(--accent); }
		50%      { box-shadow: inset 5px 0 0 var(--accent); }
	}

	/* Darts: pills, left-aligned, wrap only as a last resort */
	.h-darts {
		display: flex;
		flex-wrap: wrap;
		gap: clamp(0.2em, 0.8cqw, 0.5em);
		min-width: 0;
		font-size: var(--display-body);
	}

	.dart-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.82em;
		font-weight: 600;
		line-height: 1.1;
		letter-spacing: 0.01em;
		padding: 0.12em 0.5em;
		border-radius: var(--radius-pill);
		white-space: nowrap;
		color: var(--text-soft);
		background: var(--line);
		border: 1px solid var(--line);
	}

	/* High-value darts glow amber so big visits pop from across the room */
	.dart-pill.triple,
	.dart-pill.bull {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: var(--accent-line);
	}

	.dart-pill.double {
		color: var(--accent-double);
		background: var(--accent-soft);
		border-color: var(--accent-line);
	}

	.dart-pill.miss {
		color: var(--text-faint);
		border-style: dashed;
	}

	/* Visit total — the headline number for the row */
	.h-total {
		font-size: var(--display-emph);
		font-weight: 700;
		line-height: 1;
		text-align: right;
		color: var(--text);
		white-space: nowrap;
		font-family: var(--font-score);
	}

	/* Remaining after the visit — quieter, with a direction cue */
	.h-remaining {
		display: inline-flex;
		align-items: baseline;
		gap: 0.25em;
		font-size: var(--display-body);
		font-weight: 600;
		text-align: right;
		color: var(--text-muted);
		white-space: nowrap;
		font-family: var(--font-score);
	}

	.history-row.last-row .h-remaining {
		color: var(--text-soft);
	}

	.h-arrow {
		opacity: 0.45;
		font-weight: 400;
	}

	/* Bust: red total, struck-through dart pills, score unchanged */
	.history-row.bust-row .h-total {
		color: var(--destructive);
		font-size: var(--display-body);
	}

	.history-row.bust-row .dart-pill {
		color: var(--destructive);
		background: var(--destructive-soft);
		border-color: var(--destructive-line);
		text-decoration: line-through;
	}

	/* Checkout route (D-06): amber callout pill */
	.checkout-route {
		align-self: flex-start;
		font-size: var(--display-emph);
		font-family: var(--font-score);
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1.2;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent-line);
		border-radius: var(--radius-pill);
		padding: 0.08em 0.7em;
		box-shadow: var(--glow-accent);
	}

	/* Averages: structured footer stat-bar with a dividing rule */
	.stats-line {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-xs) var(--space-md);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--line);
		font-size: var(--display-caption);
		font-weight: 400;
		line-height: 1.2;
		color: var(--text);
	}

	.stat {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3em;
		white-space: nowrap;
	}

	.stat-label {
		color: var(--text-muted);
		font-weight: 500;
	}

	.stat-val {
		font-weight: 700;
		font-family: var(--font-score);
	}

	.stat-div {
		align-self: stretch;
		width: 1px;
		margin: 0.15em 0;
		background: var(--line-strong);
	}

	/* Fallback for engines WITHOUT container-query support — notably the Chromecast
	   receiver's older Chromium (no `cqw`/`container-type`; also no `dvh`). There, every
	   `clamp(min, Ncqw, max)` above is invalid and the font collapses to ~16px, so the
	   players are unreadable on the TV (UAT 07, 3rd pass). Re-derive each size from the
	   column width, which (with the overscan padding removed) is ~100vw / player-count —
	   so `Ncqw` ≈ `calc(Nvw / player-count)`. Modern browsers (CQ-capable) skip this block
	   entirely and keep the cqw rules untouched. */
	@supports not (container-type: inline-size) {
		.player-panel {
			padding: clamp(8px, calc(2vw / var(--player-count, 2)), 24px)
				clamp(8px, calc(2vw / var(--player-count, 2)), 18px);
			gap: clamp(4px, calc(1.2vw / var(--player-count, 2)), 12px);
		}
		.player-name    { font-size: clamp(3rem,   calc(10vw  / var(--player-count, 2)), 12rem); }
		.remaining-score { font-size: clamp(6rem,  calc(27vw  / var(--player-count, 2)), 26rem); }
		.ls-chip        { font-size: clamp(2rem,   calc(5vw   / var(--player-count, 2)), 6.5rem); }
		.bust-label     { font-size: clamp(3rem,   calc(14vw  / var(--player-count, 2)), 12rem); }
		.h-darts        { font-size: clamp(2rem,   calc(5vw   / var(--player-count, 2)), 6.5rem); }
		.h-total        { font-size: clamp(2.5rem, calc(6.5vw / var(--player-count, 2)), 8rem); }
		.h-remaining    { font-size: clamp(2rem,   calc(5vw   / var(--player-count, 2)), 6.5rem); }
		.checkout-route { font-size: clamp(2.5rem, calc(6.5vw / var(--player-count, 2)), 8rem); }
		.stats-line     { font-size: clamp(1.75rem, calc(4vw  / var(--player-count, 2)), 5rem); }
		.history-row.bust-row .h-total { font-size: clamp(2rem, calc(5vw / var(--player-count, 2)), 6.5rem); }
		.history-box    { padding: clamp(5px, calc(1vw / var(--player-count, 2)), 12px); }
		.history-section { row-gap: clamp(4px, calc(0.8vw / var(--player-count, 2)), 10px); }
		.history-row {
			column-gap: clamp(0.4em, calc(1.5vw / var(--player-count, 2)), 1em);
			padding: clamp(4px, calc(0.9vw / var(--player-count, 2)), 10px)
				clamp(8px, calc(1.6vw / var(--player-count, 2)), 16px);
		}
		.h-darts        { gap: clamp(0.2em, calc(0.8vw / var(--player-count, 2)), 0.5em); }
	}

	/* The Chromecast's Chrome 90 also lacks `subgrid` (Chrome 117+). The history rows normally
	   inherit the section's `1fr auto auto` tracks via `grid-template-columns: subgrid`; without
	   it that declaration is invalid and the row loses its columns (darts | total | remaining
	   collapse). Re-declare the tracks explicitly on the fallback — columns align within each row
	   (cross-row track-sharing is lost, which is acceptable on old engines). (UAT 07, 3rd pass) */
	@supports not (grid-template-columns: subgrid) {
		.history-row {
			grid-template-columns: 1fr auto auto;
		}
	}
</style>
