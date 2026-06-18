// src/lib/cast-types.test.ts
// RED phase: failing tests for CastDisplayState projection (Plan 07-02).
//
// Four behavior groups:
//   1. Field completeness — toDisplayState produces all fields /display components read
//   2. isValidCastState guard — mirrors isValidMatchState discipline
//   3. Pause passthrough (SYNC-03) — pauseActive/pauseRemainingSeconds carried verbatim
//   4. Size bound (D-07) — worst-case projection stays under 32 KB

import { describe, it, expect } from 'vitest';
import {
	toDisplayState,
	isValidCastState,
} from './cast-types.js';
import type { CastDisplayState, CastSnapshotMessage } from './cast-types.js';
import type { MatchState, PlayerState, Visit, DartScore } from '../engine/types.js';
import { legAverage } from '../engine/averages.js';

// ── Factories ──────────────────────────────────────────────────────────────

function makeDart(segment: number, multiplier: 1 | 2 | 3 = 1): DartScore {
	return { multiplier, segment };
}

function makeBoardVisit(segments: number[]): Visit {
	return {
		darts: segments.map(s => makeDart(s)),
		dartsAtDouble: 0,
		bust: false,
	};
}

function makeBustVisit(): Visit {
	return {
		darts: [makeDart(20, 3), makeDart(20, 3), makeDart(1)],
		dartsAtDouble: 0,
		bust: true,
	};
}

function makeCheckoutVisit(segment: number): Visit {
	return {
		darts: [makeDart(segment, 2)],
		dartsAtDouble: 1,
		bust: false,
		wasCheckout: true,
	};
}

function makePlayer(id: string, name: string, remaining: number, visits: Visit[]): PlayerState {
	return {
		id,
		name,
		isGuest: false,
		remaining,
		legsWon: 0,
		setsWon: 0,
		visits,
	};
}

/**
 * 2-player mid-leg match state factory.
 * Player 0 is active, has one bust visit and is mid-leg.
 * Player 1 has one checkout visit from a previous leg, and is in the current leg with 2 visits.
 */
function makeTwoPlayerState(): MatchState {
	const p0Visits: Visit[] = [
		// "previous leg" visits (before legStartVisitIndex)
		makeBoardVisit([60, 60, 57]),
		makeCheckoutVisit(32),
		// current leg visits (from legStartVisitIndex=2)
		makeBoardVisit([60, 60, 60]),
		makeBustVisit(),
	];

	const p1Visits: Visit[] = [
		// previous leg visit
		makeBoardVisit([60, 60, 60]),
		makeCheckoutVisit(40),
		// current leg (from legStartVisitIndex=2)
		makeBoardVisit([60, 60, 60]),
		makeBoardVisit([60, 60, 41]),
	];

	return {
		config: {
			startScore: 501,
			outRule: 'double',
			legsToWin: 3,
			setsEnabled: false,
			setsToWin: 3,
		},
		players: [makePlayer('p0', 'Alice', 381, p0Visits), makePlayer('p1', 'Bob', 280, p1Visits)],
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [makeDart(60, 3)],
		phase: 'playing',
		eventLog: [],
		legStartVisitIndex: { p0: 2, p1: 2 },
	};
}

/**
 * Worst-case factory: 4 players, sets enabled, ~40 visits each.
 * Used for the size-bound test (D-07).
 */
function makeWorstCaseState(): MatchState {
	const playerIds = ['p0', 'p1', 'p2', 'p3'];
	const players: PlayerState[] = playerIds.map((id, idx) => {
		// 40 visits per player, mostly board visits with a few busts
		const visits: Visit[] = [];
		for (let i = 0; i < 40; i++) {
			if (i % 8 === 7) {
				visits.push(makeBustVisit());
			} else {
				visits.push(makeBoardVisit([20, 20, 20]));
			}
		}
		// Last 10 visits are "current leg" (legStartVisitIndex = 30)
		return {
			id,
			name: `Player${idx + 1}`,
			isGuest: false,
			remaining: 120,
			legsWon: 2,
			setsWon: 1,
			visits,
		};
	});

	const legStartVisitIndex: Record<string, number> = {};
	playerIds.forEach(id => { legStartVisitIndex[id] = 30; });

	return {
		config: {
			startScore: 501,
			outRule: 'double',
			legsToWin: 3,
			setsEnabled: true,
			setsToWin: 3,
		},
		players,
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [makeDart(20)],
		phase: 'playing',
		eventLog: [],
		legStartVisitIndex,
	};
}

// ── Group 1: Field completeness ────────────────────────────────────────────

describe('toDisplayState — field completeness', () => {
	it('returns top-level fields matching /display read surface', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		// Top-level fields that /display +page.svelte and MatchHeader read
		expect(result).toHaveProperty('config');
		expect(result.config).toMatchObject({
			startScore: 501,
			outRule: 'double',
			legsToWin: 3,
			setsEnabled: false,
			setsToWin: 3,
		});
		expect(result).toHaveProperty('players');
		expect(result).toHaveProperty('activePlayerIndex', 0);
		expect(result).toHaveProperty('currentVisit');
		expect(result).toHaveProperty('phase', 'playing');
		expect(result).toHaveProperty('legStartVisitIndex');
	});

	it('returns per-player fields that PlayerPanel reads', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		expect(result.players).toHaveLength(2);
		const p0 = result.players[0];
		expect(p0).toHaveProperty('id', 'p0');
		expect(p0).toHaveProperty('name', 'Alice');
		expect(p0).toHaveProperty('remaining', 381);
		expect(p0).toHaveProperty('legsWon', 0);
		expect(p0).toHaveProperty('setsWon', 0);
		expect(p0).toHaveProperty('visits');
		expect(Array.isArray(p0.visits)).toBe(true);
	});

	it('trims player visits to current-leg only and rebases legStartVisitIndex to 0', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		// Original state: legStartVisitIndex.p0 = 2, visits.length = 4
		// Projection should trim visits to [2..] = 2 visits, rebase to 0
		const p0 = result.players[0];
		expect(p0.visits).toHaveLength(2); // only current-leg visits (index 2 and 3)
		expect(result.legStartVisitIndex['p0']).toBe(0);

		const p1 = result.players[1];
		expect(p1.visits).toHaveLength(2); // only current-leg visits
		expect(result.legStartVisitIndex['p1']).toBe(0);
	});

	it('legAverage computed from projected state matches legAverage from original state', () => {
		// This verifies the trim+rebase does not change numerical results
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		const p0Original = state.players[0];
		const origLegVisits = p0Original.visits.slice(state.legStartVisitIndex['p0']);
		const origAvg = legAverage(origLegVisits, state.config.startScore, p0Original.remaining);

		const p0Proj = result.players[0];
		const projLegVisits = p0Proj.visits.slice(result.legStartVisitIndex['p0']);
		const projAvg = legAverage(projLegVisits, result.config.startScore, p0Proj.remaining);

		expect(projAvg).toBe(origAvg);
	});

	it('last 4 visits for recentVisitsWithScores work correctly from projected state', () => {
		// recentVisitsWithScores uses player.visits directly (no legStart slice)
		// After trim, player.visits = current leg visits only, which is correct
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		// p0 has 2 current-leg visits; recentVisitsWithScores will show both
		const p0 = result.players[0];
		expect(p0.visits.length).toBeLessThanOrEqual(4);
	});

	it('preserves bust and wasCheckout flags on visits', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		// p0 current-leg visits: [boardVisit(60+60+60), bustVisit]
		const p0 = result.players[0];
		const bustV = p0.visits.find(v => v.bust);
		expect(bustV).toBeDefined();
		expect(bustV!.bust).toBe(true);
	});

	it('includes currentVisit array at top level', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		expect(Array.isArray(result.currentVisit)).toBe(true);
		expect(result.currentVisit).toHaveLength(1);
		expect(result.currentVisit[0]).toMatchObject({ segment: 60, multiplier: 3 });
	});
});

// ── Group 2: isValidCastState guard ───────────────────────────────────────

describe('isValidCastState', () => {
	it('returns true for a valid CastDisplayState from toDisplayState', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);
		expect(isValidCastState(result)).toBe(true);
	});

	it('returns false for null', () => {
		expect(isValidCastState(null)).toBe(false);
	});

	it('returns false for undefined', () => {
		expect(isValidCastState(undefined)).toBe(false);
	});

	it('returns false for empty players array', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);
		const bad = { ...result, players: [] };
		expect(isValidCastState(bad)).toBe(false);
	});

	it('returns false when activePlayerIndex is out of range (too high)', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);
		const bad = { ...result, activePlayerIndex: 99 };
		expect(isValidCastState(bad)).toBe(false);
	});

	it('returns false when activePlayerIndex is negative', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);
		const bad = { ...result, activePlayerIndex: -1 };
		expect(isValidCastState(bad)).toBe(false);
	});

	it('returns false when players is not an array', () => {
		expect(isValidCastState({ players: 'bad', activePlayerIndex: 0 })).toBe(false);
	});

	it('returns false for a plain object with no players field', () => {
		expect(isValidCastState({ activePlayerIndex: 0 })).toBe(false);
	});

	it('CastSnapshotMessage with type="snapshot" plus valid state passes guard', () => {
		const state = makeTwoPlayerState();
		const snapshot: CastSnapshotMessage = { type: 'snapshot', ...toDisplayState(state, false, 0) };
		// The guard checks the CastDisplayState shape — type discriminant is extra, should not break it
		expect(isValidCastState(snapshot)).toBe(true);
	});
});

// ── Group 3: Pause passthrough (SYNC-03) ──────────────────────────────────

describe('toDisplayState — pause passthrough', () => {
	it('carries pauseActive=true and pauseRemainingSeconds verbatim', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, true, 47);

		expect(result.pauseActive).toBe(true);
		expect(result.pauseRemainingSeconds).toBe(47);
	});

	it('carries pauseActive=false and pauseRemainingSeconds=0 when not paused', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);

		expect(result.pauseActive).toBe(false);
		expect(result.pauseRemainingSeconds).toBe(0);
	});

	it('passes arbitrary pause countdown values through unchanged', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, true, 300);

		expect(result.pauseRemainingSeconds).toBe(300);
	});
});

// ── Group 4: Size bound (D-07) ────────────────────────────────────────────

describe('toDisplayState — size bound D-07', () => {
	it('worst-case 4-player sets match projects to under 32768 bytes', () => {
		const state = makeWorstCaseState();
		const result = toDisplayState(state, false, 0);
		const bytes = new TextEncoder().encode(JSON.stringify(result)).length;

		// D-07: must stay well under Cast's 64 KB hard cap; 32 KB is the safety margin
		expect(bytes).toBeLessThan(32768);
	});

	it('2-player state projection is well under 32 KB', () => {
		const state = makeTwoPlayerState();
		const result = toDisplayState(state, false, 0);
		const bytes = new TextEncoder().encode(JSON.stringify(result)).length;
		expect(bytes).toBeLessThan(32768);
	});
});
