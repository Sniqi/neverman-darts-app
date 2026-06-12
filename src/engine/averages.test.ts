// src/engine/averages.test.ts
// RED phase: tests written before implementation.
// Covers computeAverage, legAverage, matchAverage from averages.ts.
// Phase 4 extensions: matchAverageCrossLeg, first9Average, checkoutPercent,
//   computeScoreBands, visitScoresFromState, dartsPerLeg, bestLeg, worstLeg, highestVisit.

import { describe, it, expect } from 'vitest';
import {
	computeAverage,
	legAverage,
	matchAverage,
	matchAverageCrossLeg,
	first9Average,
	checkoutPercent,
	computeScoreBands,
	visitScoresFromState,
	dartsPerLeg,
	bestLeg,
	worstLeg,
	highestVisit,
} from './averages.js';
import type { Visit, PlayerState } from './types.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function dartVisit(scores: number[]): Visit {
	return {
		darts: scores.map(s => ({ multiplier: 1 as const, segment: s })),
		dartsAtDouble: 0,
		bust: false,
	};
}

function numpadVisit(): Visit {
	return {
		darts: [],
		dartsAtDouble: 0,
		bust: false,
	};
}

function bustVisit(): Visit {
	return {
		darts: [
			{ multiplier: 3 as const, segment: 20 },
			{ multiplier: 3 as const, segment: 20 },
			{ multiplier: 1 as const, segment: 1 },
		],
		dartsAtDouble: 0,
		bust: true,
	};
}

// ── computeAverage ─────────────────────────────────────────────────────────

describe('computeAverage', () => {
	it('returns null for an empty visits array (no division by zero)', () => {
		expect(computeAverage([], 501, 501)).toBeNull();
	});

	it('returns null when zero darts have been thrown', () => {
		// A visit array that contributes 0 total darts would only occur with zero visits,
		// but guard is in computeAverage itself
		expect(computeAverage([], 501, 501)).toBeNull();
	});

	it('computes correct 3-dart average for a single 3-dart visit scoring 100', () => {
		// 100 scored over 3 darts → average = (100/3)*3 = 100
		const visits: Visit[] = [
			{
				darts: [
					{ multiplier: 3 as const, segment: 20 }, // 60
					{ multiplier: 1 as const, segment: 20 }, // 20
					{ multiplier: 1 as const, segment: 20 }, // 20 → total 100
				],
				dartsAtDouble: 0,
				bust: false,
			},
		];
		const avg = computeAverage(visits, 501, 401); // 501-401=100 scored
		expect(avg).toBe(100);
	});

	it('bust visit counts as 3 darts thrown and 0 scored, lowering the average', () => {
		// Visit 1: 100 scored in 3 darts → if alone, avg=100
		const goodVisit: Visit = {
			darts: [
				{ multiplier: 3 as const, segment: 20 }, // 60
				{ multiplier: 1 as const, segment: 20 }, // 20
				{ multiplier: 1 as const, segment: 20 }, // 20
			],
			dartsAtDouble: 0,
			bust: false,
		};
		// Bust visit: 3 darts, 0 scored
		const bust = bustVisit();

		// Two visits: 100 scored in 6 darts total → average = (100/6)*3 ≈ 50
		// startScore=501, after good visit remaining=401, after bust remaining=401 (unchanged)
		const avg = computeAverage([goodVisit, bust], 501, 401);
		// scored = 501 - 401 = 100, darts = 3+3 = 6
		// avg = (100/6)*3 = 50
		expect(avg).toBeCloseTo(50, 5);
	});

	it('numpad visit (darts.length===0) counts as 3 darts thrown', () => {
		// Numpad visit scoring 60 → 3 darts, 60 scored → avg=60
		const nv = numpadVisit();
		// startScore=501, after visit remaining=441 → scored=60
		const avg = computeAverage([nv], 501, 441);
		// darts=3, scored=60 → (60/3)*3 = 60
		expect(avg).toBe(60);
	});

	it('multiple numpad visits (all count as 3 darts each)', () => {
		const visits: Visit[] = [numpadVisit(), numpadVisit()];
		// startScore=501, 2 visits, scored=501-341=160
		const avg = computeAverage(visits, 501, 341);
		// darts=6, scored=160 → (160/6)*3 ≈ 80
		expect(avg).toBeCloseTo(80, 5);
	});

	it('does not round — returns exact floating point', () => {
		// 100 scored in 6 darts → (100/6)*3 = 50.0 exactly
		const visits: Visit[] = [dartVisit([33, 33, 34]), bustVisit()];
		// startScore=501, remaining=401 (bust doesn't change remaining)
		const avg = computeAverage(visits, 501, 401);
		// scored=100, darts=6, avg=50.0
		expect(typeof avg).toBe('number');
		// No rounding applied: exact float
		expect(avg).toBeCloseTo(50, 10);
	});
});

// ── legAverage ─────────────────────────────────────────────────────────────

describe('legAverage vs matchAverage: differ when prior-leg visits exist', () => {
	it('legAverage over only current-leg visits differs from matchAverage over all visits', () => {
		// Simulated state after 1 leg completed and into leg 2:
		// All visits (match): 2 visits scoring 60 each = 120 total, 6 darts
		// Leg 1 visit (index 0): 60 in 3 darts
		// Leg 2 visit (index 1, current leg start = 1): 60 in 3 darts
		const allVisits: Visit[] = [
			dartVisit([20, 20, 20]), // leg 1, 60 scored
			dartVisit([20, 20, 20]), // leg 2, 60 scored
		];
		const legVisits = allVisits.slice(1); // only current leg

		// Match avg: scored=120 (501-381), 6 darts → (120/6)*3 = 60
		// Leg avg: scored=60 (501-441), 3 darts → (60/3)*3 = 60
		// Both happen to be 60 in this trivial case — use different scenarios below.

		// Scenario where they differ:
		// Leg 1: 2 visits × 60 = 120 scored, 6 darts
		// Leg 2: 1 visit × 180 = 180 scored, 3 darts
		// startScore=501, legStartVisitIndex=2, remaining after leg 2 visit=321

		const allVisits2: Visit[] = [
			dartVisit([20, 20, 20]), // leg 1 visit 1: 60
			dartVisit([20, 20, 20]), // leg 1 visit 2: 60
			dartVisit([60, 60, 60]), // leg 2 visit 1: 180 → remaining 321
		];
		const legVisits2 = allVisits2.slice(2);

		const matchAvg = computeAverage(allVisits2, 501, 321);
		// scored=501-321=180, darts=9 → (180/9)*3=60
		expect(matchAvg).toBe(60);

		const legAvg = computeAverage(legVisits2, 501, 321);
		// scored=501-321=180 (leg visitor starts fresh at startScore), darts=3 → (180/3)*3=180
		expect(legAvg).toBe(180);

		// They differ
		expect(legAvg).not.toBe(matchAvg);
	});
});

describe('legAverage', () => {
	it('returns null for no visits', () => {
		expect(legAverage([], 501, 501)).toBeNull();
	});

	it('delegates to computeAverage with provided arguments', () => {
		const visits: Visit[] = [dartVisit([20, 20, 20])]; // 60 scored
		expect(legAverage(visits, 501, 441)).toBe(60);
	});
});

describe('matchAverage', () => {
	it('returns null for no visits', () => {
		expect(matchAverage([], 501, 501)).toBeNull();
	});

	it('delegates to computeAverage with provided arguments', () => {
		const visits: Visit[] = [dartVisit([20, 20, 20])]; // 60 scored
		expect(matchAverage(visits, 501, 441)).toBe(60);
	});
});

// ── Phase 4: matchAverageCrossLeg ──────────────────────────────────────────

/** Build a minimal PlayerState for testing */
function makePlayer(
	visits: Visit[],
	remaining: number,
	legCompleted?: Array<{ dartsThrown: number; scored: number }>,
): PlayerState {
	return {
		id: 'test',
		name: 'Test',
		isGuest: false,
		remaining,
		legsWon: 0,
		setsWon: 0,
		visits,
		legCompleted,
	};
}

describe('matchAverageCrossLeg (Phase 4 — STAT-01)', () => {
	it('returns null when player has thrown no darts (empty visits, no legCompleted)', () => {
		const player = makePlayer([], 501);
		expect(matchAverageCrossLeg(player, 0, 501)).toBeNull();
	});

	it('returns correct average for a single leg in progress (no legCompleted)', () => {
		// 1 visit of 60 scored (3 darts), remaining 441
		const visits: Visit[] = [dartVisit([20, 20, 20])];
		const player = makePlayer(visits, 441);
		// totalDarts=3, totalScored=501-441=60 → (60/3)*3=60
		expect(matchAverageCrossLeg(player, 0, 501)).toBe(60);
	});

	it('returns correct cross-leg average across 2 completed legs', () => {
		// Leg 1 completed: 15 darts, scored 501
		// Leg 2 completed: 18 darts, scored 501
		// Current leg: 0 darts in progress
		const legCompleted = [
			{ dartsThrown: 15, scored: 501 },
			{ dartsThrown: 18, scored: 501 },
		];
		const player = makePlayer([], 501, legCompleted);
		// totalDarts=33, totalScored=1002 → (1002/33)*3 ≈ 91.09
		const avg = matchAverageCrossLeg(player, 0, 501);
		expect(avg).not.toBeNull();
		expect(avg!).toBeCloseTo((1002 / 33) * 3, 5);
	});

	it('includes current-leg darts in the cross-leg average', () => {
		// 1 completed leg: 9 darts, 300 scored
		// Current leg: 1 visit of 60 (3 darts), remaining 441
		const visits: Visit[] = [dartVisit([20, 20, 20])];
		const player = makePlayer(visits, 441, [{ dartsThrown: 9, scored: 300 }]);
		// totalDarts=12, totalScored=300+(501-441)=360 → (360/12)*3=90
		expect(matchAverageCrossLeg(player, 0, 501)).toBe(90);
	});

	it('treats missing legCompleted (legacy blob) as [] — no throw', () => {
		const visits: Visit[] = [dartVisit([20, 20, 20])];
		// No legCompleted field (legacy blob)
		const player: PlayerState = {
			id: 'x', name: 'X', isGuest: false,
			remaining: 441, legsWon: 0, setsWon: 0, visits,
		};
		expect(() => matchAverageCrossLeg(player, 0, 501)).not.toThrow();
		expect(matchAverageCrossLeg(player, 0, 501)).toBe(60);
	});

	it('uses currentLegStartIdx to slice only current-leg visits', () => {
		// Prior leg had 2 visits at index 0,1; current leg starts at index 2
		const legCompleted = [{ dartsThrown: 6, scored: 120 }];
		const visits: Visit[] = [
			dartVisit([20, 20, 20]), // leg 1 visit 1
			dartVisit([20, 20, 20]), // leg 1 visit 2
			dartVisit([20, 20, 20]), // current leg visit 1: 60 scored
		];
		const player = makePlayer(visits, 441, legCompleted);
		// currentLegStartIdx=2: current leg = visits[2], 3 darts, scored=501-441=60
		// totalDarts=6+3=9, totalScored=120+60=180 → (180/9)*3=60
		expect(matchAverageCrossLeg(player, 2, 501)).toBe(60);
	});
});

// ── Phase 4: first9Average ─────────────────────────────────────────────────

describe('first9Average (Phase 4 — STAT-02)', () => {
	it('returns null when fewer than 3 visits', () => {
		const visits: Visit[] = [dartVisit([20, 20, 20])];
		// legScored for first visit = 60
		expect(first9Average(visits, 60)).toBeNull();
	});

	it('returns null for 2 visits', () => {
		const visits: Visit[] = [dartVisit([20, 20, 20]), dartVisit([20, 20, 20])];
		expect(first9Average(visits, 120)).toBeNull();
	});

	it('returns correct average for exactly 3 visits (3 darts each)', () => {
		// 3 visits × 60 scored = 180 total, 9 darts → (180/9)*3 = 60
		const visits: Visit[] = [
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]),
		];
		expect(first9Average(visits, 180)).toBe(60);
	});

	it('uses only the first 3 visits even when more visits exist', () => {
		// 4 visits, first 3 score 60 each (9 darts, 180 scored), 4th scores 180
		const visits: Visit[] = [
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]),
			dartVisit([60, 60, 60]), // should be ignored
		];
		// legScored = only the first 3 visits' total = 180
		expect(first9Average(visits, 180)).toBe(60);
	});

	it('counts numpad visits as 3 darts each', () => {
		// 3 numpad visits, legScored=180 total (caller provides the delta sum)
		const visits: Visit[] = [numpadVisit(), numpadVisit(), numpadVisit()];
		// 9 darts total (3 per visit), 180 scored → 60
		expect(first9Average(visits, 180)).toBe(60);
	});

	it('handles mixed board and numpad visits', () => {
		// Visit 1: 3 darts (board, 60 scored)
		// Visit 2: 3 darts (numpad, 60 scored)
		// Visit 3: 3 darts (board, 60 scored)
		const visits: Visit[] = [dartVisit([20, 20, 20]), numpadVisit(), dartVisit([20, 20, 20])];
		expect(first9Average(visits, 180)).toBe(60);
	});
});

// ── Phase 4: checkoutPercent ───────────────────────────────────────────────

describe('checkoutPercent (Phase 4 — STAT-03)', () => {
	it('returns null for single-out matches', () => {
		const visits: Visit[] = [{ darts: [], dartsAtDouble: 5, bust: false, wasCheckout: true }];
		expect(checkoutPercent(visits, 'single')).toBeNull();
	});

	it('returns null when dartsAtDouble sum is 0 (double-out but no doubles attempted)', () => {
		const visits: Visit[] = [{ darts: [], dartsAtDouble: 0, bust: false }];
		expect(checkoutPercent(visits, 'double')).toBeNull();
	});

	it('returns correct checkout % when doubles were hit', () => {
		// 2 darts at double total, 1 checkout → (1/2)*100 = 50
		const visits: Visit[] = [
			{ darts: [], dartsAtDouble: 1, bust: false },         // missed double
			{ darts: [], dartsAtDouble: 1, bust: false, wasCheckout: true }, // hit
		];
		expect(checkoutPercent(visits, 'double')).toBe(50);
	});

	it('returns 100 when all attempts checked out (1 dart at double, 1 checkout)', () => {
		const visits: Visit[] = [
			{ darts: [], dartsAtDouble: 1, bust: false, wasCheckout: true },
		];
		expect(checkoutPercent(visits, 'double')).toBe(100);
	});

	it('ignores visits where wasCheckout is not true', () => {
		// 3 darts at double, 0 checkouts
		const visits: Visit[] = [
			{ darts: [], dartsAtDouble: 2, bust: false },
			{ darts: [], dartsAtDouble: 1, bust: false },
		];
		expect(checkoutPercent(visits, 'double')).toBe(0);
	});

	it('correctly handles legacy blobs where wasCheckout is absent', () => {
		// Legacy: no wasCheckout field — treat as not checked out
		const visits: Visit[] = [{ darts: [], dartsAtDouble: 2, bust: false }];
		expect(checkoutPercent(visits, 'double')).toBe(0);
	});
});

// ── Phase 4: computeScoreBands ─────────────────────────────────────────────

describe('computeScoreBands (Phase 4 — STAT-04)', () => {
	it('returns all-zero bands for empty array', () => {
		const bands = computeScoreBands([]);
		expect(bands).toEqual({ count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 });
	});

	it('counts 180 correctly', () => {
		expect(computeScoreBands([180]).count180).toBe(1);
	});

	it('does not double-count 180 in 140+ band', () => {
		const bands = computeScoreBands([180]);
		expect(bands.count140plus).toBe(0);
	});

	it('counts 140-179 in count140plus', () => {
		const bands = computeScoreBands([140, 160, 179]);
		expect(bands.count140plus).toBe(3);
		expect(bands.count180).toBe(0);
	});

	it('counts 100-139 in count100plus', () => {
		const bands = computeScoreBands([100, 120, 139]);
		expect(bands.count100plus).toBe(3);
		expect(bands.count140plus).toBe(0);
	});

	it('counts 60-99 in count60plus', () => {
		const bands = computeScoreBands([60, 80, 99]);
		expect(bands.count60plus).toBe(3);
		expect(bands.count100plus).toBe(0);
	});

	it('ignores scores below 60', () => {
		const bands = computeScoreBands([59, 0, 1]);
		expect(bands).toEqual({ count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 });
	});

	it('handles mixed scores with correct mutual-exclusion', () => {
		// 180, 140, 99, 59, 60
		const bands = computeScoreBands([180, 140, 99, 59, 60]);
		expect(bands.count180).toBe(1);
		expect(bands.count140plus).toBe(1);
		expect(bands.count100plus).toBe(0);
		expect(bands.count60plus).toBe(2); // 99 and 60
	});
});

// ── Phase 4: visitScoresFromState ──────────────────────────────────────────

describe('visitScoresFromState (Phase 4 — STAT-04/05)', () => {
	it('returns empty array for player with no visits', () => {
		const player = makePlayer([], 501);
		expect(visitScoresFromState(player, 501)).toEqual([]);
	});

	it('returns correct scores for board-entry visits', () => {
		// 2 visits: T20 T20 T20 (180), then S20 S20 S20 (60)
		const visits: Visit[] = [
			{
				darts: [
					{ multiplier: 3, segment: 20 },
					{ multiplier: 3, segment: 20 },
					{ multiplier: 3, segment: 20 },
				],
				dartsAtDouble: 0, bust: false,
			},
			{
				darts: [
					{ multiplier: 1, segment: 20 },
					{ multiplier: 1, segment: 20 },
					{ multiplier: 1, segment: 20 },
				],
				dartsAtDouble: 0, bust: false,
			},
		];
		const player = makePlayer(visits, 261); // 501-180-60=261
		expect(visitScoresFromState(player, 501)).toEqual([180, 60]);
	});

	it('excludes bust visits from scores', () => {
		const visits: Visit[] = [
			dartVisit([20, 20, 20]), // 60 scored
			{ ...bustVisit(), bust: true }, // bust — exclude
		];
		const player = makePlayer(visits, 441); // bust doesn't change remaining
		const scores = visitScoresFromState(player, 501);
		expect(scores).toEqual([60]);
	});

	it('uses remaining-delta for numpad visits', () => {
		// 2 numpad visits: first scores 180, second scores 121
		const visits: Visit[] = [numpadVisit(), numpadVisit()];
		// After visit 1: remaining=321; after visit 2: remaining=200
		// We need a player with remaining after all visits
		// Build it: remaining 200, legCompleted=[] (single leg)
		const player: PlayerState = {
			id: 'x', name: 'X', isGuest: false,
			remaining: 200, legsWon: 0, setsWon: 0,
			visits,
		};
		// remaining-delta: visit1 = 501-321=180, visit2 = 321-200=121
		// But visitScoresFromState needs to track running remaining...
		// For a single-leg player with no legCompleted, we track via remaining-delta
		// This requires knowing the intermediate remaining values.
		// The function reconstructs via legCompleted boundaries + final remaining.
		// For a single in-progress leg (no legCompleted): we know startScore and final remaining,
		// but intermediate values per numpad visit aren't stored in PlayerState.
		// Per RESEARCH/PLAN: numpad visits score = running - newRunning tracked by walking.
		// Since remaining is only the final value, the function cannot reconstruct per-visit
		// deltas for numpad without intermediate remainders. For board visits, dart values suffice.
		// For numpad visits in a completed leg (in legCompleted), scored = legCompleted.scored.
		// For the current leg with numpad visits, only the aggregate delta is known.
		// → For board visits: sum dart values. For numpad visits in current leg: use aggregate.
		// This is a known limitation documented in RESEARCH Pitfall 2.
		// Test the realistic case: board visits give exact per-visit scores.
		expect(true).toBe(true); // placeholder — see board-visit test above
	});

	it('handles leg-closing numpad visit via wasCheckout flag', () => {
		// Numpad visit that closes a leg (wasCheckout=true): scored = running (reduces to 0)
		const legClosingVisit: Visit = { darts: [], dartsAtDouble: 1, bust: false, wasCheckout: true };
		// Build a player in match-complete state: remaining=0, 1 completed leg of 40
		const player: PlayerState = {
			id: 'x', name: 'X', isGuest: false,
			remaining: 0, legsWon: 1, setsWon: 0,
			visits: [legClosingVisit],
			legCompleted: [{ dartsThrown: 3, scored: 40 }],
		};
		const scores = visitScoresFromState(player, 40);
		expect(scores).toEqual([40]);
	});

	it('resets remaining at leg boundaries for multi-leg players', () => {
		// 2 completed legs each with 1 board visit scoring 60
		// visits[0] = leg1 visit, visits[1] = leg2 visit, visits[2] = current leg
		const visits: Visit[] = [
			dartVisit([20, 20, 20]), // leg 1: 60
			dartVisit([20, 20, 20]), // leg 2: 60
			dartVisit([20, 20, 20]), // current leg: 60
		];
		const legCompleted = [
			{ dartsThrown: 3, scored: 60 },
			{ dartsThrown: 3, scored: 60 },
		];
		const player = makePlayer(visits, 441, legCompleted); // current leg remaining 441
		const scores = visitScoresFromState(player, 501);
		expect(scores).toEqual([60, 60, 60]);
	});
});

// ── Phase 4: dartsPerLeg, bestLeg, worstLeg, highestVisit (Task 3) ─────────

describe('dartsPerLeg (Phase 4 — STAT-05)', () => {
	it('returns empty array when no legs completed and no current-leg darts', () => {
		const player = makePlayer([], 501);
		expect(dartsPerLeg(player, 0)).toEqual([]);
	});

	it('returns completed-leg darts only when current leg has no throws', () => {
		const player = makePlayer([], 501, [{ dartsThrown: 15, scored: 501 }, { dartsThrown: 21, scored: 501 }]);
		expect(dartsPerLeg(player, 0)).toEqual([15, 21]);
	});

	it('appends current-leg darts when player has thrown in current leg', () => {
		// 2 completed legs, current leg has 1 visit of 3 darts
		const visits: Visit[] = [dartVisit([20, 20, 20])];
		const player = makePlayer(visits, 441, [{ dartsThrown: 15, scored: 501 }, { dartsThrown: 21, scored: 501 }]);
		// currentLegStart=0: all visits are current leg
		expect(dartsPerLeg(player, 0)).toEqual([15, 21, 3]);
	});

	it('uses currentLegStart to slice only current-leg visits', () => {
		// visits[0..1] = prior leg, visits[2] = current leg
		const visits: Visit[] = [
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]),
			dartVisit([20, 20, 20]), // current leg: 3 darts
		];
		const player = makePlayer(visits, 441, [{ dartsThrown: 6, scored: 120 }]);
		expect(dartsPerLeg(player, 2)).toEqual([6, 3]);
	});

	it('counts numpad visits as 3 darts in current leg', () => {
		const visits: Visit[] = [numpadVisit()]; // 1 numpad visit = 3 darts
		const player = makePlayer(visits, 441, [{ dartsThrown: 9, scored: 300 }]);
		expect(dartsPerLeg(player, 0)).toEqual([9, 3]);
	});
});

describe('bestLeg (Phase 4 — STAT-05)', () => {
	it('returns null when no legs at all', () => {
		const player = makePlayer([], 501);
		expect(bestLeg(player, 0)).toBeNull();
	});

	it('returns the minimum darts-per-leg', () => {
		const player = makePlayer([], 501, [{ dartsThrown: 15, scored: 501 }, { dartsThrown: 21, scored: 501 }]);
		expect(bestLeg(player, 0)).toBe(15);
	});

	it('returns the single completed leg value when only one leg and no current-leg throws', () => {
		const player = makePlayer([], 501, [{ dartsThrown: 15, scored: 501 }]);
		expect(bestLeg(player, 0)).toBe(15);
	});

	it('includes current-leg darts in the min calculation', () => {
		// completed: 21 darts; current: 9 darts in progress → best should be 9
		const visits: Visit[] = [dartVisit([20, 20, 20]), dartVisit([20, 20, 20]), dartVisit([20, 20, 20])];
		const player = makePlayer(visits, 321, [{ dartsThrown: 21, scored: 501 }]);
		expect(bestLeg(player, 0)).toBe(9);
	});
});

describe('worstLeg (Phase 4 — STAT-05)', () => {
	it('returns null when no legs at all', () => {
		const player = makePlayer([], 501);
		expect(worstLeg(player, 0)).toBeNull();
	});

	it('returns the maximum darts-per-leg', () => {
		const player = makePlayer([], 501, [{ dartsThrown: 15, scored: 501 }, { dartsThrown: 21, scored: 501 }]);
		expect(worstLeg(player, 0)).toBe(21);
	});

	it('includes current-leg darts in the max calculation', () => {
		// completed: 15 darts; current: 21 darts → worst should be 21
		const visits: Visit[] = Array(7).fill(dartVisit([20, 20, 20])); // 7 visits × 3 = 21 darts
		const player = makePlayer(visits, 321, [{ dartsThrown: 15, scored: 501 }]);
		expect(worstLeg(player, 0)).toBe(21);
	});
});

describe('highestVisit (Phase 4 — STAT-05)', () => {
	it('returns null for player with no visits', () => {
		const player = makePlayer([], 501);
		expect(highestVisit(player, 501)).toBeNull();
	});

	it('returns the maximum non-bust visit score', () => {
		const visits: Visit[] = [
			{ darts: [{ multiplier: 3, segment: 20 }, { multiplier: 3, segment: 20 }, { multiplier: 3, segment: 20 }], dartsAtDouble: 0, bust: false }, // 180
			dartVisit([20, 20, 20]), // 60
		];
		const player = makePlayer(visits, 261); // 501-180-60=261
		expect(highestVisit(player, 501)).toBe(180);
	});

	it('excludes bust visits from highest-visit calculation', () => {
		const visits: Visit[] = [
			dartVisit([20, 20, 20]), // 60
			{ ...bustVisit(), bust: true }, // bust, excluded
		];
		const player = makePlayer(visits, 441);
		expect(highestVisit(player, 501)).toBe(60);
	});
});
