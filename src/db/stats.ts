// src/db/stats.ts
// Lifetime statistics aggregation over db.matches blobs (STAT-07, D-09).
// Mirrors matches.ts pattern exactly — liveQuery → readable.
// Security T-04-05: all strings are plain data — no HTML injection possible;
// callers must render via Svelte {interpolation}.

import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type MatchRecord } from './db.js';
import {
	matchAverageCrossLeg,
	checkoutPercent,
	computeScoreBands,
	visitScoresFromState,
	dartsPerLeg,
	highestVisit as highestVisitFn,
} from '../engine/averages.js';
import type { ScoreBands } from '../engine/averages.js';

export type { ScoreBands };

/**
 * Lifetime statistics for a single profile.
 * LOCKED field names + types — consumed cross-plan by 04-04/04-05 record preload.
 * Do NOT rename: matchAverage, highestVisit, highestCheckout, bestLeg.
 */
export interface LifetimeStats {
	matchesPlayed: number;
	wins: number;
	winRate: number; // wins / matchesPlayed * 100; 0 when matchesPlayed === 0
	matchAverage: number | null; // lifetime 3-dart average; null when no darts thrown
	checkoutPercent: number | null; // doubles hit / darts at double * 100; null for single-out or no attempts
	scoreBands: ScoreBands; // cumulative score bands across all matches
	highestVisit: number; // highest non-bust visit score; 0 when no scorable visits
	highestCheckout: number; // highest checkout (wasCheckout=true) visit score; 0 when none
	bestLeg: number | null; // fewest darts in any leg; null when no legs
	averageTrend: number[]; // per-match 3-dart average, oldest → newest (null-match entries omitted)
	dartsPerLegBuckets: number[]; // darts per leg across all matches, oldest → newest
}

/**
 * Empty/zero LifetimeStats for when a profile has no completed matches.
 */
function emptyStats(): LifetimeStats {
	return {
		matchesPlayed: 0,
		wins: 0,
		winRate: 0,
		matchAverage: null,
		checkoutPercent: null,
		scoreBands: { count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 },
		highestVisit: 0,
		highestCheckout: 0,
		bestLeg: null,
		averageTrend: [],
		dartsPerLegBuckets: []
	};
}

/**
 * Compute lifetime statistics for a profile by aggregating all their MatchRecord blobs.
 *
 * Pure function — no DB access. Accepts the output of a db.matches .filter().toArray() call.
 * Guests are naturally excluded: they are never persisted in db.profiles so callers never
 * pass a guest profileId. If called with a guest id, no matches will match, returning empty.
 *
 * Records (D-09/ACHV-03): highestVisit, highestCheckout, bestLeg are the max/min over
 * all lifetime matches — records emerge from aggregation, no separate records table.
 *
 * @param matches - All MatchRecord blobs containing the profile player.
 * @param profileId - The profile's id string (String(profile.id) from db.profiles).
 */
export function computeLifetimeStats(
	matches: MatchRecord[],
	profileId: string
): LifetimeStats {
	// Filter to matches containing this profile player
	const relevant = matches.filter(m =>
		m.state.players.some(p => p.id === profileId)
	);

	if (relevant.length === 0) return emptyStats();

	// Sort oldest → newest for trend arrays
	const sorted = [...relevant].sort((a, b) => a.completedAt - b.completedAt);

	let matchesPlayed = 0;
	let wins = 0;

	// Accumulators for lifetime average (total darts ratio, not mean-of-means)
	let totalDartsAllMatches = 0;
	let totalScoredAllMatches = 0;

	// Accumulators for checkout %
	let totalDartsAtDouble = 0;
	let totalDoublesHit = 0;

	// Cumulative score bands
	const bands: ScoreBands = { count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 };

	// Record tracking
	let highestVisitVal = 0;
	let highestCheckoutVal = 0;
	let bestLegVal: number | null = null;

	// Trend arrays
	const averageTrend: number[] = [];
	const dartsPerLegBuckets: number[] = [];

	for (const record of sorted) {
		const player = record.state.players.find(p => p.id === profileId);
		if (!player) continue;

		matchesPlayed++;
		if (record.winnerId === profileId) wins++;

		const startScore = record.state.config.startScore;

		// Per-match average using legCompleted accumulator
		// For a completed match: legStartVisitIndex reflects the final leg.
		// Since the match is complete, current leg contribution is captured in legCompleted.
		// We treat currentLegStartIdx as player.visits.length to get zero current-leg
		// contribution (all legs are in legCompleted for completed matches).
		const completed = player.legCompleted ?? [];
		const matchDarts = completed.reduce((s, l) => s + l.dartsThrown, 0);
		const matchScored = completed.reduce((s, l) => s + l.scored, 0);

		if (matchDarts > 0) {
			totalDartsAllMatches += matchDarts;
			totalScoredAllMatches += matchScored;
			const matchAvg = (matchScored / matchDarts) * 3;
			averageTrend.push(matchAvg);
		}

		// Checkout %
		const visitDartsAtDouble = player.visits.reduce((s, v) => s + v.dartsAtDouble, 0);
		const checkoutsHit = player.visits.filter(v => v.wasCheckout === true).length;
		if (record.state.config.outRule === 'double') {
			totalDartsAtDouble += visitDartsAtDouble;
			totalDoublesHit += checkoutsHit;
		}

		// Score bands from reconstructed visit scores
		const visitScores = visitScoresFromState(player, startScore);
		const matchBands = computeScoreBands(visitScores);
		bands.count180 += matchBands.count180;
		bands.count140plus += matchBands.count140plus;
		bands.count100plus += matchBands.count100plus;
		bands.count60plus += matchBands.count60plus;

		// Highest visit
		const hv = highestVisitFn(player, startScore);
		if (hv !== null && hv > highestVisitVal) highestVisitVal = hv;

		// Highest checkout: max wasCheckout=true visit score (WR-01).
		// Board checkouts sum dart values. Numpad checkouts (darts: []) store no darts,
		// so the finish value must be reconstructed from the leg's running remaining
		// before the closing visit — which equals the cleared amount (remaining → 0).
		// Walk visits per leg, resetting running to startScore at each leg boundary.
		{
			let running: number = startScore;
			for (const v of player.visits) {
				if (v.bust) continue; // bust leaves remaining unchanged
				const boardScore = v.darts.length > 0
					? v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
					: null;
				if (v.wasCheckout === true) {
					// Numpad checkout score = running (reduces to 0); board = dart sum.
					const score = boardScore ?? running;
					if (score > highestCheckoutVal) highestCheckoutVal = score;
				}
				if (boardScore !== null) running -= boardScore;
				else if (v.wasCheckout === true) running = 0;
				if (running <= 0) running = startScore;
			}
		}

		// Best leg: min darts in any leg across all matches
		// For a completed match: legCompleted holds all legs.
		const legDarts = completed.map(l => l.dartsThrown);
		for (const d of legDarts) {
			dartsPerLegBuckets.push(d);
			if (bestLegVal === null || d < bestLegVal) bestLegVal = d;
		}
	}

	// Lifetime average: total ratio (not mean-of-means)
	const matchAverage = totalDartsAllMatches > 0
		? (totalScoredAllMatches / totalDartsAllMatches) * 3
		: null;

	// Checkout %
	const checkoutPct = (totalDartsAtDouble > 0)
		? (totalDoublesHit / totalDartsAtDouble) * 100
		: null;

	// Derive checkoutPercent correctly: if any match was single-out and others double-out,
	// we only count double-out matches (totalDartsAtDouble stays 0 for single-out matches).
	// If all matches are single-out, checkoutPct remains null.

	return {
		matchesPlayed,
		wins,
		winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
		matchAverage,
		checkoutPercent: checkoutPct,
		scoreBands: bands,
		highestVisit: highestVisitVal,
		highestCheckout: highestCheckoutVal,
		bestLeg: bestLegVal,
		averageTrend,
		dartsPerLegBuckets
	};
}

/**
 * Reactive liveQuery wrapper for a profile's lifetime stats.
 * Emits a fresh LifetimeStats whenever db.matches changes.
 * Emits null on DB failure (graceful degradation for private mode / restricted storage).
 * Mirrors matchesLive() pattern from matches.ts exactly.
 *
 * @param profileId - String(profile.id) from db.profiles. Never a guest id.
 */
export function profileStatsLive(profileId: string): Readable<LifetimeStats | null> {
	return readable<LifetimeStats | null>(null, (set) => {
		const subscription = liveQuery(async () => {
			try {
				const matches = await db.matches
					.filter(m => m.state.players.some(p => p.id === profileId))
					.toArray();
				return computeLifetimeStats(matches, profileId);
			} catch {
				return null;
			}
		}).subscribe({ next: set, error: () => set(null) });
		return () => subscription.unsubscribe();
	});
}
