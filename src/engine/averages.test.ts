// src/engine/averages.test.ts
// RED phase: tests written before implementation.
// Covers computeAverage, legAverage, matchAverage from averages.ts.

import { describe, it, expect } from 'vitest';
import { computeAverage, legAverage, matchAverage } from './averages.js';
import type { Visit } from './types.js';

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
