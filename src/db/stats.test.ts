// src/db/stats.test.ts
// STAT-07 — unit tests for computeLifetimeStats (lifetime aggregation) and profileStatsLive.
// Runs in the node unit project; fake-indexeddb provides the IndexedDB backend.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { computeLifetimeStats, profileStatsLive } from './stats';
import type { MatchRecord } from './db';
import type { MatchState, PlayerState, Visit } from '../engine/types';

// ── Fixture helpers ────────────────────────────────────────────────────────

function makeVisit(score: number, wasCheckout = false): Visit {
	// Board visit: 3 darts totaling `score`. Simplest: 1 dart × score (use T20 = 60, etc.)
	// For testing we just need the darts array non-empty.
	return {
		darts: [{ multiplier: 1, segment: score }],
		dartsAtDouble: wasCheckout ? 1 : 0,
		bust: false,
		wasCheckout
	};
}

function makeNumpadVisit(wasCheckout: boolean): Visit {
	return {
		darts: [],
		dartsAtDouble: wasCheckout ? 1 : 0,
		bust: false,
		wasCheckout
	};
}

/**
 * Build a minimal completed MatchState blob.
 * p1Id wins 1 leg; all legCompleted + visits pre-filled.
 */
function makeMatchState(
	p1Id: string,
	p2Id: string,
	{
		p1Visits = [] as Visit[],
		p2Visits = [] as Visit[],
		p1LegCompleted = [] as Array<{ dartsThrown: number; scored: number }>,
		p2LegCompleted = [] as Array<{ dartsThrown: number; scored: number }>,
		p1Remaining = 0,
		p2Remaining = 501,
		winnerId = p1Id,
		outRule = 'double' as 'double' | 'single'
	} = {}
): MatchState {
	return {
		config: { startScore: 501, outRule, legsToWin: 1, setsEnabled: false, setsToWin: 1 },
		players: [
			{
				id: p1Id,
				name: p1Id,
				isGuest: false,
				remaining: p1Remaining,
				legsWon: 1,
				setsWon: 0,
				visits: p1Visits,
				legCompleted: p1LegCompleted
			},
			{
				id: p2Id,
				name: p2Id,
				isGuest: false,
				remaining: p2Remaining,
				legsWon: 0,
				setsWon: 0,
				visits: p2Visits,
				legCompleted: p2LegCompleted
			}
		],
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [],
		phase: 'match-complete',
		eventLog: [],
		legStartVisitIndex: { [p1Id]: 0, [p2Id]: 0 }
	};
}

function makeRecord(
	state: MatchState,
	winnerId: string,
	completedAt = Date.now()
): Omit<MatchRecord, 'id'> {
	return { completedAt, winnerId, state };
}

// ── computeLifetimeStats ───────────────────────────────────────────────────

describe('computeLifetimeStats', () => {
	it('returns matchesPlayed=0 and null/zero fields when no matches', () => {
		const stats = computeLifetimeStats([], 'player-1');
		expect(stats.matchesPlayed).toBe(0);
		expect(stats.wins).toBe(0);
		expect(stats.winRate).toBe(0);
		expect(stats.matchAverage).toBeNull();
		expect(stats.bestLeg).toBeNull();
	});

	it('filters by player.id — other players are excluded', () => {
		const state = makeMatchState('alice', 'bob');
		const record = makeRecord(state, 'alice') as MatchRecord;
		record.id = 1;

		const stats = computeLifetimeStats([record], 'charlie');
		expect(stats.matchesPlayed).toBe(0);
	});

	it('counts matches where the profile player appears (even as loser)', () => {
		const state = makeMatchState('alice', 'bob');
		const record = makeRecord(state, 'alice') as MatchRecord;
		record.id = 1;

		const statsAlice = computeLifetimeStats([record], 'alice');
		expect(statsAlice.matchesPlayed).toBe(1);

		const statsBob = computeLifetimeStats([record], 'bob');
		expect(statsBob.matchesPlayed).toBe(1);
	});

	it('counts wins correctly (wins only when winnerId === profileId)', () => {
		const state = makeMatchState('alice', 'bob');
		const record = makeRecord(state, 'alice') as MatchRecord;
		record.id = 1;

		const statsAlice = computeLifetimeStats([record], 'alice');
		expect(statsAlice.wins).toBe(1);

		const statsBob = computeLifetimeStats([record], 'bob');
		expect(statsBob.wins).toBe(0);
	});

	it('calculates win rate correctly: wins/matchesPlayed*100', () => {
		const state1 = makeMatchState('alice', 'bob');
		const r1 = makeRecord(state1, 'alice', 1000) as MatchRecord;
		r1.id = 1;

		const state2 = makeMatchState('bob', 'alice');
		const r2 = makeRecord(state2, 'bob', 2000) as MatchRecord;
		r2.id = 2;

		const stats = computeLifetimeStats([r1, r2], 'alice');
		expect(stats.matchesPlayed).toBe(2);
		expect(stats.wins).toBe(1);
		expect(stats.winRate).toBeCloseTo(50, 1);
	});

	it('returns winRate=0 when no wins', () => {
		const state = makeMatchState('alice', 'bob');
		const r1 = makeRecord(state, 'alice') as MatchRecord;
		r1.id = 1;
		const stats = computeLifetimeStats([r1], 'bob');
		expect(stats.wins).toBe(0);
		expect(stats.winRate).toBe(0);
	});

	it('guest id produces matchesPlayed=0 (guests are never persisted)', () => {
		// Guests use IDs like "guest-1"; they cannot be in db.profiles so are
		// never passed to computeLifetimeStats in production. But even if called
		// with a guest id, no matches contain that id.
		const state = makeMatchState('alice', 'bob');
		const r1 = makeRecord(state, 'alice') as MatchRecord;
		r1.id = 1;
		const stats = computeLifetimeStats([r1], 'guest-1');
		expect(stats.matchesPlayed).toBe(0);
	});

	it('highestVisit is the max non-bust visit score across all matches', () => {
		// Visit scoring 60
		const visits1: Visit[] = [makeVisit(60)];
		const legCompleted1 = [{ dartsThrown: 1, scored: 441 }];

		const visits2: Visit[] = [makeVisit(100)];
		const legCompleted2 = [{ dartsThrown: 1, scored: 401 }];

		const state1 = makeMatchState('alice', 'bob', {
			p1Visits: visits1,
			p1LegCompleted: legCompleted1
		});
		const state2 = makeMatchState('alice', 'bob', {
			p1Visits: visits2,
			p1LegCompleted: legCompleted2
		});

		const r1 = makeRecord(state1, 'alice', 1000) as MatchRecord;
		r1.id = 1;
		const r2 = makeRecord(state2, 'alice', 2000) as MatchRecord;
		r2.id = 2;

		const stats = computeLifetimeStats([r1, r2], 'alice');
		expect(stats.highestVisit).toBe(100);
	});

	it('bestLeg is the minimum darts-per-leg across all matches', () => {
		// Match 1: alice closes in 9 darts (3 visits of 3)
		const state1 = makeMatchState('alice', 'bob', {
			p1LegCompleted: [{ dartsThrown: 9, scored: 501 }]
		});
		// Match 2: alice closes in 6 darts (more efficient)
		const state2 = makeMatchState('alice', 'bob', {
			p1LegCompleted: [{ dartsThrown: 6, scored: 501 }]
		});

		const r1 = makeRecord(state1, 'alice', 1000) as MatchRecord;
		r1.id = 1;
		const r2 = makeRecord(state2, 'alice', 2000) as MatchRecord;
		r2.id = 2;

		const stats = computeLifetimeStats([r1, r2], 'alice');
		expect(stats.bestLeg).toBe(6);
	});

	it('highestCheckout comes from the highest wasCheckout visit score', () => {
		// Visit: board visit closing the leg (wasCheckout=true) with score 81
		const checkoutVisit: Visit = {
			darts: [{ multiplier: 3, segment: 17 }, { multiplier: 1, segment: 20 }, { multiplier: 2, segment: 10 }],
			dartsAtDouble: 1,
			bust: false,
			wasCheckout: true
		};
		const state = makeMatchState('alice', 'bob', {
			p1Visits: [checkoutVisit],
			p1LegCompleted: [{ dartsThrown: 3, scored: 501 }]
		});
		const r = makeRecord(state, 'alice') as MatchRecord;
		r.id = 1;

		const stats = computeLifetimeStats([r], 'alice');
		// 3×17 + 1×20 + 2×10 = 51 + 20 + 20 = 91
		expect(stats.highestCheckout).toBe(91);
	});

	it('averageTrend has one entry per match (oldest→newest)', () => {
		const state1 = makeMatchState('alice', 'bob', {
			p1LegCompleted: [{ dartsThrown: 9, scored: 501 }]
		});
		const state2 = makeMatchState('alice', 'bob', {
			p1LegCompleted: [{ dartsThrown: 6, scored: 501 }]
		});
		const r1 = makeRecord(state1, 'alice', 1000) as MatchRecord;
		r1.id = 1;
		const r2 = makeRecord(state2, 'alice', 2000) as MatchRecord;
		r2.id = 2;

		const stats = computeLifetimeStats([r1, r2], 'alice');
		expect(stats.averageTrend).toHaveLength(2);
		// Oldest match (r1): 501/9*3 = 167
		expect(stats.averageTrend[0]).toBeCloseTo((501 / 9) * 3, 1);
		// Newest match (r2): 501/6*3 = 250.5
		expect(stats.averageTrend[1]).toBeCloseTo((501 / 6) * 3, 1);
	});

	it('a losing profile contributes its darts to averageTrend and matchAverage (CR-01)', () => {
		// Since the reducer now records legCompleted for losers too, a losing profile's
		// legs must show up in averageTrend / matchAverage rather than being dropped.
		// Loser (bob) lost the leg with 18 darts scoring 360.
		const state = makeMatchState('alice', 'bob', {
			p1LegCompleted: [{ dartsThrown: 9, scored: 501 }],
			p2LegCompleted: [{ dartsThrown: 18, scored: 360 }],
			p2Remaining: 141,
		});
		const r = makeRecord(state, 'alice') as MatchRecord;
		r.id = 1;

		const statsBob = computeLifetimeStats([r], 'bob');
		expect(statsBob.matchesPlayed).toBe(1);
		expect(statsBob.wins).toBe(0);
		// Loser's leg must contribute: averageTrend has one entry, matchAverage non-null.
		expect(statsBob.averageTrend).toHaveLength(1);
		expect(statsBob.averageTrend[0]).toBeCloseTo((360 / 18) * 3, 1);
		expect(statsBob.matchAverage).toBeCloseTo((360 / 18) * 3, 1);
		// And the lost leg shows up in best-leg / darts-per-leg buckets.
		expect(statsBob.bestLeg).toBe(18);
		expect(statsBob.dartsPerLegBuckets).toEqual([18]);
	});

	it('legacy blob without legCompleted does not throw', () => {
		const state = makeMatchState('alice', 'bob');
		// Manually remove legCompleted to simulate legacy blob
		const p = state.players[0] as PlayerState;
		delete (p as unknown as Record<string, unknown>)['legCompleted'];
		const r = makeRecord(state, 'alice') as MatchRecord;
		r.id = 1;

		expect(() => computeLifetimeStats([r], 'alice')).not.toThrow();
	});
});

// ── profileStatsLive ───────────────────────────────────────────────────────

describe('profileStatsLive', () => {
	beforeEach(async () => {
		await db.matches.clear();
	});

	it('emits null initially then LifetimeStats after insert', async () => {
		const state = makeMatchState('alice', 'bob');
		await db.matches.add(makeRecord(state, 'alice') as MatchRecord);

		const store = profileStatsLive('alice');
		const result = await new Promise<unknown>((resolve) => {
			const unsub = store.subscribe((val) => {
				if (val !== null) {
					unsub();
					resolve(val);
				}
			});
		});

		expect(result).toBeTruthy();
		const stats = result as { matchesPlayed: number };
		expect(stats.matchesPlayed).toBe(1);
	});
});
