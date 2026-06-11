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

import type { Visit } from './types.js';

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
