// src/engine/averages.ts
// Pure stateless average computation for X01 darts matches.
// Mirrors checkout.ts: named exports, no class, no side effects.
//
// Standard 3-dart average formula: (totalScored / dartsThrown) * 3
// Bust visits: count as 3 darts thrown, 0 scored.
// Numpad visits (darts.length === 0): count as 3 darts thrown; scored derived
// from the caller-supplied startScore and remaining parameters.
//
// Formatting (one decimal) is the display layer's responsibility — do NOT round here.

import type { Visit, PlayerState, OutRule } from './types.js';

/**
 * Total darts thrown across all visits.
 * Bust visits and numpad visits (darts.length === 0) each count as 3 darts.
 */
function totalDartsThrown(visits: Visit[]): number {
	return visits.reduce((sum, v) => sum + (v.darts.length > 0 ? v.darts.length : 3), 0);
}

/**
 * Standard 3-dart average over an array of visits.
 *
 * @param visits - The visits to average over (may be a slice for leg average).
 * @param startScore - The player's score at the start of the period covered by visits.
 *   For leg average: the game start score (e.g. 501) — legs always start fresh at startScore.
 *   For match average: also startScore, since scored = startScore - remaining over all legs.
 * @param remaining - The player's current remaining score after all provided visits.
 *
 * Returns null when no darts have been thrown yet (avoids division by zero).
 *
 * Leg callers: pass visits.slice(legStartVisitIndex[id]) and the game startScore with
 * the player's current remaining so scored reflects only the current leg.
 * Match callers: pass the full visits array with the same startScore and remaining.
 */
export function computeAverage(visits: Visit[], startScore: number, remaining: number): number | null {
	const darts = totalDartsThrown(visits);
	if (darts === 0) return null;
	const scored = startScore - remaining;
	return (scored / darts) * 3;
}

/**
 * Leg average: 3-dart average for the current leg only.
 *
 * The caller is responsible for passing only the current-leg visits:
 *   visits.slice(legStartVisitIndex[player.id])
 *
 * startScore and remaining should be the game startScore and the player's current
 * remaining — because every new leg starts at startScore, scored = startScore - remaining
 * correctly captures only the current-leg scoring.
 */
export function legAverage(visits: Visit[], startScore: number, remaining: number): number | null {
	return computeAverage(visits, startScore, remaining);
}

/**
 * Match average: 3-dart average across all legs of the match.
 *
 * Pass the full player.visits array (which spans all legs — the reducer does NOT
 * reset visits at leg start, only remaining is reset).
 *
 * startScore and remaining are used to compute total scored across all legs.
 * Note: for cross-leg match average the scored = startScore - remaining only captures
 * the current leg's scoring. To include all legs, the caller should pass the cumulative
 * startScore equivalent and remaining, or use a dedicated cross-leg score accumulation.
 * For Phase 2 display, pass all visits with the current startScore and remaining; this
 * correctly reflects the full match when the player has not yet won a leg. Cross-leg
 * accumulation for full match stats is handled in Phase 4.
 */
export function matchAverage(visits: Visit[], startScore: number, remaining: number): number | null {
	return computeAverage(visits, startScore, remaining);
}

// ── Phase 4: cross-leg average ─────────────────────────────────────────────

/**
 * Match average using the legCompleted accumulator for correct cross-leg computation.
 *
 * Sums stats from all completed legs (player.legCompleted) plus the current leg in
 * progress. Correctly handles multi-leg matches where player.remaining resets at each
 * leg boundary — which makes matchAverage() produce wrong results for multi-leg matches.
 *
 * Treats missing legCompleted (historical blobs without Phase 4 data) as [] and falls
 * back to computing only the current leg.
 *
 * @param player - The player state (including legCompleted and visits).
 * @param currentLegStartIdx - Index into player.visits where the current leg begins
 *   (from state.legStartVisitIndex[player.id]).
 * @param startScore - The game start score (e.g. 501).
 */
export function matchAverageCrossLeg(
	player: PlayerState,
	currentLegStartIdx: number,
	startScore: number,
): number | null {
	const completed = player.legCompleted ?? [];
	const prevDarts = completed.reduce((s, l) => s + l.dartsThrown, 0);
	const prevScored = completed.reduce((s, l) => s + l.scored, 0);

	// CR-01 (iter 2): the current leg has already been pushed into legCompleted once it
	// is closed — for EVERY player, winner AND loser (the CR-01 fix records the loser's
	// final leg too). The callers pass currentLegStartIdx = player.visits.length on a
	// completed match, so the current-leg slice is empty for everyone. Drive the guard
	// off the slice (curDarts === 0) rather than `remaining === 0`: gating on remaining
	// only caught the winner and let the loser's final-leg score (curScored =
	// startScore - remaining > 0) be added a second time on top of legCompleted, doubling
	// the loser's match average. Mid-leg (live StatDrawer) the current leg is NOT yet in
	// legCompleted and has uncommitted visits (curDarts > 0), so it is still counted.
	const curVisits = player.visits.slice(currentLegStartIdx);
	const curDarts = curVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);

	if (curDarts === 0) {
		if (prevDarts === 0) return null;
		return (prevScored / prevDarts) * 3;
	}

	const curScored = startScore - player.remaining;
	const totalDarts = prevDarts + curDarts;
	const totalScored = prevScored + curScored;
	if (totalDarts === 0) return null;
	return (totalScored / totalDarts) * 3;
}

// ── Phase 4: first-9 average ───────────────────────────────────────────────

/**
 * First-9 average: 3-dart average over the first 3 visits of a leg (= first 9 darts
 * by standard tournament convention — assumes 3 darts per visit).
 *
 * Returns null when fewer than 3 visits are available.
 *
 * @param legVisits - The visits for the current leg only (already sliced by caller).
 * @param legScored - The total score across the first 3 visits (caller computes this
 *   as the sum of visit scores for visits 0-2; for numpad visits the caller should
 *   supply the remaining-delta sum for those 3 visits).
 */
export function first9Average(legVisits: Visit[], legScored: number): number | null {
	const first3 = legVisits.slice(0, 3);
	if (first3.length < 3) return null;
	const darts = first3.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
	if (darts === 0) return null;
	return (legScored / darts) * 3;
}

// ── Phase 4: checkout percentage ───────────────────────────────────────────

/**
 * Checkout percentage: (legs won via double / total darts at double) * 100.
 *
 * Returns null for single-out matches (no double required) or when no darts at double
 * have been attempted. Treats absent wasCheckout (historical blobs) as false.
 *
 * @param visits - All player visits (or current-leg/match-level slice).
 * @param outRule - The match out rule.
 */
export function checkoutPercent(visits: Visit[], outRule: OutRule): number | null {
	if (outRule === 'single') return null;
	const dartsAtDouble = visits.reduce((s, v) => s + v.dartsAtDouble, 0);
	if (dartsAtDouble === 0) return null;
	const doublesHit = visits.filter(v => v.wasCheckout === true).length;
	return (doublesHit / dartsAtDouble) * 100;
}

// ── Phase 4: score bands ───────────────────────────────────────────────────

/** Score band counts for visit-score classification. Bands are mutually exclusive (descending). */
export interface ScoreBands {
	count180: number;
	count140plus: number;
	count100plus: number;
	count60plus: number;
}

/**
 * Counts visit scores into mutually-exclusive descending score bands.
 *
 * Bands: exactly 180 | 140-179 | 100-139 | 60-99. Scores below 60 are ignored.
 * Input should be non-bust visit scores from visitScoresFromState().
 */
export function computeScoreBands(visitScores: number[]): ScoreBands {
	const bands: ScoreBands = { count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 };
	for (const score of visitScores) {
		if (score === 180) bands.count180++;
		else if (score >= 140) bands.count140plus++;
		else if (score >= 100) bands.count100plus++;
		else if (score >= 60) bands.count60plus++;
	}
	return bands;
}

// ── Phase 4: visit score reconstruction ───────────────────────────────────

/**
 * Reconstructs non-bust visit scores for a player by walking their visits in order,
 * resetting the running remaining at each leg boundary (derived from legCompleted).
 *
 * Board visits: score = sum of dart values.
 * Numpad visits: score = delta of running remaining (prev - new remaining).
 * Bust visits: excluded (push nothing).
 *
 * Handles legacy blobs where legCompleted is absent (treats as single current leg).
 *
 * @param player - The player state.
 * @param startScore - The game start score (e.g. 501).
 */
export function visitScoresFromState(player: PlayerState, startScore: number): number[] {
	const scores: number[] = [];
	const completed = player.legCompleted ?? [];

	// WR-03: drive leg boundaries from structural data (the per-leg scored totals in
	// legCompleted) rather than inferring them from `running` reaching 0. The old
	// approach skipped non-checkout numpad visits without decrementing `running`, so a
	// leg containing such a visit and closed by a board visit never reset — corrupting
	// every subsequent leg's running remaining. By advancing to the next leg once the
	// current leg's accumulated score reaches completed[legIdx].scored, board-closed and
	// mixed numpad/board legs reset at the correct boundary.
	//
	// Residual limitation: a NON-closing numpad visit's score still cannot be
	// reconstructed (no per-visit remaining is persisted), so its points are omitted from
	// the returned band scores. Such a leg may therefore not reach its expected scored
	// total from board visits alone; the boundary then falls back to the leg-closing
	// `wasCheckout` flag or the running<=0 zero-crossing. This is the same documented
	// numpad-delta limitation (RESEARCH Pitfall 2) and is unchanged by this fix.

	let running = startScore;
	let legIdx = 0;
	let legScoredSoFar = 0;

	const advanceLeg = () => {
		running = startScore;
		legScoredSoFar = 0;
		legIdx += 1;
	};

	for (const v of player.visits) {
		if (v.bust) {
			// Bust: remaining unchanged, contributes no score
			continue;
		}

		let score: number | null;
		if (v.darts.length > 0) {
			// Board entry: sum dart values
			score = v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
		} else if (v.wasCheckout) {
			// Leg-closing numpad visit: score = running remaining (reduces to 0)
			score = running;
		} else {
			// Non-closing numpad visit: score not reconstructable. Omit from scores but
			// still allow the boundary logic below to close the leg when appropriate.
			score = null;
		}

		if (score !== null) {
			scores.push(score);
			running -= score;
			legScoredSoFar += score;
		}

		// Structural leg-boundary detection: prefer the known per-leg scored total.
		const expectedLegScored = legIdx < completed.length ? completed[legIdx].scored : null;
		if (v.wasCheckout) {
			// An explicit leg-closing visit always advances the leg.
			advanceLeg();
		} else if (expectedLegScored !== null && legScoredSoFar >= expectedLegScored) {
			// Reached this leg's recorded total → leg closed (covers board-closed legs).
			advanceLeg();
		} else if (expectedLegScored === null && running <= 0) {
			// No structural data (legacy blob / current in-progress leg): fall back to
			// the running zero-crossing.
			advanceLeg();
		}
	}

	return scores;
}

// ── Phase 4: per-leg darts, best/worst leg, highest visit ─────────────────

/**
 * Returns an array of darts thrown per leg (completed legs + current leg in progress).
 * Completed legs come from player.legCompleted[].dartsThrown.
 * Current leg darts are counted from visits.slice(currentLegStart).
 * The current leg is only appended if it has at least 1 dart.
 */
export function dartsPerLeg(player: PlayerState, currentLegStart: number): number[] {
	const completed = (player.legCompleted ?? []).map(l => l.dartsThrown);
	const currentLegVisits = player.visits.slice(currentLegStart);
	const currentDarts = currentLegVisits.reduce(
		(s, v) => s + (v.darts.length > 0 ? v.darts.length : 3),
		0,
	);
	if (currentDarts > 0) {
		return [...completed, currentDarts];
	}
	return completed;
}

/**
 * Best leg (fewest darts). Returns null when no legs exist.
 */
export function bestLeg(player: PlayerState, currentLegStart: number): number | null {
	const legs = dartsPerLeg(player, currentLegStart);
	return legs.length > 0 ? Math.min(...legs) : null;
}

/**
 * Worst leg (most darts). Returns null when no legs exist.
 */
export function worstLeg(player: PlayerState, currentLegStart: number): number | null {
	const legs = dartsPerLeg(player, currentLegStart);
	return legs.length > 0 ? Math.max(...legs) : null;
}

/**
 * Highest non-bust visit score. Returns null when no scorable visits exist.
 * Uses visitScoresFromState() to handle both board and numpad visits.
 */
export function highestVisit(player: PlayerState, startScore: number): number | null {
	const scores = visitScoresFromState(player, startScore);
	return scores.length > 0 ? Math.max(...scores) : null;
}
