// src/db/matches.test.ts
// STAT-06 — full CRUD unit tests for matches.ts helpers.
// Runs in the node unit project; fake-indexeddb provides the IndexedDB backend.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { matchesLive, getMatch, deleteMatch, toHistoryRow } from './matches';
import type { MatchRecord } from './db';
import type { MatchState } from '../engine/types';

/** Minimal MatchState for a completed 2-player 501 Double Out match. */
function makeState(overrides?: Partial<MatchState>): MatchState {
	return {
		config: {
			startScore: 501,
			outRule: 'double',
			legsToWin: 3,
			setsEnabled: false,
			setsToWin: 1
		},
		players: [
			{
				id: 'p1',
				name: 'Alex',
				isGuest: false,
				remaining: 0,
				legsWon: 3,
				setsWon: 0,
				visits: []
			},
			{
				id: 'p2',
				name: 'Ben',
				isGuest: false,
				remaining: 501,
				legsWon: 1,
				setsWon: 0,
				visits: []
			}
		],
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [],
		phase: 'match-complete',
		eventLog: [],
		legStartVisitIndex: { p1: 0, p2: 0 },
		...overrides
	};
}

function makeRecord(overrides?: Partial<MatchRecord>): Omit<MatchRecord, 'id'> {
	return {
		completedAt: Date.now(),
		winnerId: 'p1',
		state: makeState(),
		...overrides
	};
}

describe('matches CRUD (STAT-06)', () => {
	beforeEach(async () => {
		await db.matches.clear();
	});

	it('db.matches.add() persists a record and it is readable', async () => {
		const id = await db.matches.add(makeRecord() as MatchRecord);
		const all = await db.matches.toArray();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe(id);
		expect(all[0].winnerId).toBe('p1');
	});

	it('matchesLive() emits the inserted record', async () => {
		await db.matches.add(makeRecord() as MatchRecord);

		// Collect first emission from the readable
		const store = matchesLive();
		const records = await new Promise<MatchRecord[]>((resolve) => {
			const unsub = store.subscribe((val) => {
				if (val.length > 0) {
					unsub();
					resolve(val);
				}
			});
		});

		expect(records).toHaveLength(1);
		expect(records[0].winnerId).toBe('p1');
	});

	it('matchesLive() orders records newest-first by completedAt', async () => {
		const older = makeRecord({ completedAt: 1000 });
		const newer = makeRecord({ completedAt: 2000 });
		await db.matches.add(older as MatchRecord);
		await db.matches.add(newer as MatchRecord);

		const records = await new Promise<MatchRecord[]>((resolve) => {
			const store = matchesLive();
			const unsub = store.subscribe((val) => {
				if (val.length >= 2) {
					unsub();
					resolve(val);
				}
			});
		});

		expect(records[0].completedAt).toBe(2000);
		expect(records[1].completedAt).toBe(1000);
	});

	it('deleteMatch(id) removes a record', async () => {
		const id = await db.matches.add(makeRecord() as MatchRecord);
		await deleteMatch(id as number);
		const all = await db.matches.toArray();
		expect(all).toHaveLength(0);
	});

	it('getMatch(id) returns the record', async () => {
		const id = await db.matches.add(makeRecord() as MatchRecord);
		const found = await getMatch(id as number);
		expect(found).toBeDefined();
		expect(found!.winnerId).toBe('p1');
	});

	it('getMatch() returns undefined for unknown id', async () => {
		const found = await getMatch(99999);
		expect(found).toBeUndefined();
	});

	describe('toHistoryRow()', () => {
		it('derives German short date from completedAt', () => {
			// 2026-06-12T00:00:00.000Z → "12.06." in de-DE
			const record: MatchRecord = {
				id: 1,
				completedAt: new Date('2026-06-12T12:00:00Z').getTime(),
				winnerId: 'p1',
				state: makeState()
			};
			const row = toHistoryRow(record);
			expect(row.date).toMatch(/12\.06\./);
		});

		it('derives "n:m" result from legsWon for a 2-player match', () => {
			const record: MatchRecord = {
				id: 1,
				completedAt: Date.now(),
				winnerId: 'p1',
				state: makeState()
			};
			const row = toHistoryRow(record);
			expect(row.result).toBe('3:1');
		});

		it('derives result from setsWon for a setsEnabled match', () => {
			const state = makeState({
				config: {
					startScore: 501,
					outRule: 'double',
					legsToWin: 3,
					setsEnabled: true,
					setsToWin: 2
				},
				players: [
					{
						id: 'p1',
						name: 'Alex',
						isGuest: false,
						remaining: 0,
						legsWon: 3,
						setsWon: 2,
						visits: []
					},
					{
						id: 'p2',
						name: 'Ben',
						isGuest: false,
						remaining: 501,
						legsWon: 0,
						setsWon: 1,
						visits: []
					}
				]
			});
			const record: MatchRecord = { id: 1, completedAt: Date.now(), winnerId: 'p1', state };
			const row = toHistoryRow(record);
			expect(row.result).toBe('2:1');
		});

		it('derives winner name from winnerId', () => {
			const record: MatchRecord = {
				id: 1,
				completedAt: Date.now(),
				winnerId: 'p1',
				state: makeState()
			};
			const row = toHistoryRow(record);
			expect(row.winnerName).toBe('Alex');
		});

		it('derives format string "501 Double Out"', () => {
			const record: MatchRecord = {
				id: 1,
				completedAt: Date.now(),
				winnerId: 'p1',
				state: makeState()
			};
			const row = toHistoryRow(record);
			expect(row.format).toBe('501 Double Out');
		});

		it('handles a 3-player match: result shows legsWon without a:b', () => {
			const state = makeState({
				players: [
					{
						id: 'p1',
						name: 'Alex',
						isGuest: false,
						remaining: 0,
						legsWon: 3,
						setsWon: 0,
						visits: []
					},
					{
						id: 'p2',
						name: 'Ben',
						isGuest: false,
						remaining: 501,
						legsWon: 1,
						setsWon: 0,
						visits: []
					},
					{
						id: 'p3',
						name: 'Cara',
						isGuest: false,
						remaining: 501,
						legsWon: 0,
						setsWon: 0,
						visits: []
					}
				]
			});
			const record: MatchRecord = { id: 1, completedAt: Date.now(), winnerId: 'p1', state };
			const row = toHistoryRow(record);
			// 3-player: no "a:b", just legs
			expect(row.result).toBe('3 Legs');
			expect(row.winnerName).toBe('Alex');
		});

		it('handles singular "1 Leg" for 3-player with 1 leg won', () => {
			const state = makeState({
				players: [
					{
						id: 'p1',
						name: 'Alex',
						isGuest: false,
						remaining: 0,
						legsWon: 1,
						setsWon: 0,
						visits: []
					},
					{
						id: 'p2',
						name: 'Ben',
						isGuest: false,
						remaining: 501,
						legsWon: 0,
						setsWon: 0,
						visits: []
					},
					{
						id: 'p3',
						name: 'Cara',
						isGuest: false,
						remaining: 501,
						legsWon: 0,
						setsWon: 0,
						visits: []
					}
				]
			});
			const record: MatchRecord = { id: 1, completedAt: Date.now(), winnerId: 'p1', state };
			const row = toHistoryRow(record);
			expect(row.result).toBe('1 Leg');
		});
	});
});
