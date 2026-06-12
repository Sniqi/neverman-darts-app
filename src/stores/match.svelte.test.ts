// src/stores/match.svelte.test.ts
// RED phase: tests written before implementation.
// Unit tests for MatchStore dispatch, activePlayer, remaining, suggestion getters,
// and record detection (ACHV-01/ACHV-02 — Phase 4 Plan 05).
// Runs in the `unit` vitest project (includes src/**/*.test.ts, excludes src/ui/**).

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchStore } from './match.svelte.js';
import { db } from '../db/db.js';
import type { MatchConfig, MatchState } from '../engine/types.js';
import type { LifetimeStats } from '../db/stats.js';

const config501Double: MatchConfig = {
	startScore: 501,
	outRule: 'double',
	legsToWin: 3,
	setsEnabled: false,
	setsToWin: 1,
};

const player1 = { id: 'p1', name: 'Alice', isGuest: false };

describe('MatchStore', () => {
	let store: MatchStore;

	beforeEach(() => {
		// Fresh instance per test — do NOT share the singleton
		store = new MatchStore();
	});

	it('initial state is in setup phase', () => {
		expect(store.state.phase).toBe('setup');
	});

	describe('after START_MATCH', () => {
		beforeEach(() => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
		});

		it('state.phase === "playing"', () => {
			expect(store.state.phase).toBe('playing');
		});

		it('activePlayer.name equals the started player', () => {
			expect(store.activePlayer.name).toBe('Alice');
		});

		it('remaining === 501', () => {
			expect(store.remaining).toBe(501);
		});

		it('suggestion === null (501 is out of finish range for double-out)', () => {
			expect(store.suggestion).toBeNull();
		});
	});

	describe('after two 180 NUMPAD_VISIT dispatches', () => {
		beforeEach(() => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
			// 501 - 180 = 321
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
			// 321 - 180 = 141
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
		});

		it('remaining === 141', () => {
			expect(store.remaining).toBe(141);
		});

		it('suggestion is a non-empty array (141 is a valid double-out finish)', () => {
			const s = store.suggestion;
			expect(s).not.toBeNull();
			expect(Array.isArray(s)).toBe(true);
			expect(s!.length).toBeGreaterThan(0);
		});

		it('suggestion recomputes live after each dispatch (D-10)', () => {
			// Before: remaining=141, suggestion non-null
			expect(store.suggestion).not.toBeNull();
		});
	});

	describe('after UNDO', () => {
		beforeEach(() => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 }); // 321
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 }); // 141
			store.dispatch({ type: 'UNDO' });                      // back to 321
		});

		it('remaining === 321 after UNDO', () => {
			expect(store.remaining).toBe(321);
		});
	});

	describe('convenience getters', () => {
		beforeEach(() => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
		});

		it('currentVisit is an array', () => {
			expect(Array.isArray(store.currentVisit)).toBe(true);
		});

		it('isMatchComplete is false during play', () => {
			expect(store.isMatchComplete).toBe(false);
		});
	});

	describe('restore()', () => {
		it('after restore(savedState), store.state deep-equals the saved state', () => {
			const savedState: import('../engine/types.js').MatchState = {
				config: {
					startScore: 501,
					outRule: 'double',
					legsToWin: 3,
					setsEnabled: false,
					setsToWin: 1,
				},
				players: [
					{
						id: 'p1',
						name: 'Alice',
						isGuest: false,
						remaining: 321,
						legsWon: 1,
						setsWon: 0,
						visits: [],
					},
				],
				activePlayerIndex: 0,
				legStarterIndex: 0,
				currentVisit: [],
				phase: 'playing',
				eventLog: [
					{
						type: 'START_MATCH',
						config: {
							startScore: 501,
							outRule: 'double',
							legsToWin: 3,
							setsEnabled: false,
							setsToWin: 1,
						},
						players: [{ id: 'p1', name: 'Alice', isGuest: false }],
						order: ['p1'],
					},
				],
				legStartVisitIndex: { p1: 0 },
			};
			store.restore(savedState);
			expect(store.state.phase).toBe('playing');
			expect(store.state.players[0].remaining).toBe(321);
			expect(store.state.players[0].legsWon).toBe(1);
			expect(store.state.activePlayerIndex).toBe(0);
			expect(store.state.eventLog).toHaveLength(1);
		});

		it('after restore(), store remains usable — UNDO dispatch replays correctly', () => {
			// Build state with a visit already dispatched
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 }); // remaining 321

			// Capture state and restore it into a fresh store
			const snapshot = JSON.parse(JSON.stringify(store.state));
			const freshStore = new MatchStore();
			freshStore.restore(snapshot);
			expect(freshStore.state.players[0].remaining).toBe(321);

			// A subsequent UNDO should replay correctly (back to 501)
			freshStore.dispatch({ type: 'UNDO' });
			expect(freshStore.state.players[0].remaining).toBe(501);
		});
	});

	describe('persist-on-complete (D-08 / STAT-06)', () => {
		const config1Leg: MatchConfig = {
			startScore: 501,
			outRule: 'double',
			legsToWin: 1,
			setsEnabled: false,
			setsToWin: 1,
		};

		beforeEach(async () => {
			await db.matches.clear();
			const store: Record<string, string> = {};
			vi.stubGlobal('localStorage', {
				getItem: (key: string) => store[key] ?? null,
				setItem: (key: string, val: string) => { store[key] = val; },
				removeItem: (key: string) => { delete store[key]; },
			});
		});

		/**
		 * Drive a single-leg 501 double-out match to completion.
		 * Route: 180 + 180 + 100 + 32 → remaining 0 (checkout).
		 * 501 - 180 = 321; 321 - 180 = 141; 141 - 100 = 41; 41 - 32 = 9... doesn't work.
		 * Use: 501 - 180 - 180 - 101 = 40; then 40 checkout double-20.
		 * 101 is a valid total (not in IMPOSSIBLE_3DART); 40 is valid.
		 */
		function driveToMatchComplete(s: MatchStore): void {
			s.dispatch({
				type: 'START_MATCH',
				config: config1Leg,
				players: [player1],
				order: ['p1'],
			});
			// 501 - 180 = 321
			s.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
			// 321 - 180 = 141
			s.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
			// 141 - 101 = 40
			s.dispatch({ type: 'NUMPAD_VISIT', total: 101 });
			// 40 → double-20 checkout (total: 40, dartsAtDouble: 1)
			s.dispatch({ type: 'NUMPAD_VISIT', total: 40, dartsUsed: 1, dartsAtDouble: 1 });
		}

		it('completing a match writes a record to db.matches with the correct winnerId', async () => {
			driveToMatchComplete(store);

			expect(store.state.phase).toBe('match-complete');

			// Fire-and-forget — wait a tick for the async persist
			await new Promise((r) => setTimeout(r, 50));

			const all = await db.matches.toArray();
			expect(all).toHaveLength(1);
			expect(all[0].winnerId).toBe('p1');
		});

		it('after match-complete, localStorage resume slot is removed (D-08)', async () => {
			driveToMatchComplete(store);

			expect(store.state.phase).toBe('match-complete');

			await new Promise((r) => setTimeout(r, 50));

			expect(localStorage.getItem('neverman-match-snapshot')).toBeNull();
		});
	});

	// ── Record detection (ACHV-01 / ACHV-02 — Phase 4 Plan 05) ───────────────
	//
	// BroadcastChannel is mocked globally so record broadcasts do not throw.
	// The mock is a simple stub that records calls.

	describe('record detection', () => {
		// Minimal LifetimeStats fixture: a player with some prior history
		const priorStats: LifetimeStats = {
			matchesPlayed: 5,
			wins: 3,
			winRate: 60,
			matchAverage: 40.0,       // prior match avg = 40
			checkoutPercent: 50,
			scoreBands: { count180: 0, count140plus: 2, count100plus: 5, count60plus: 8 },
			highestVisit: 140,        // prior best visit = 140
			highestCheckout: 40,
			bestLeg: 15,              // prior best leg = 15 darts
			averageTrend: [38, 40],
			dartsPerLegBuckets: [18, 15],
		};

		// Fixture: brand-new player with null baselines (D-05 first-occurrence)
		const newPlayerStats: LifetimeStats = {
			matchesPlayed: 0,
			wins: 0,
			winRate: 0,
			matchAverage: null,       // null — no prior matches
			checkoutPercent: null,
			scoreBands: { count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 },
			highestVisit: 0,
			highestCheckout: 0,
			bestLeg: null,            // null — no prior legs
			averageTrend: [],
			dartsPerLegBuckets: [],
		};

		type PostedMessage = { type: string; records: string[] };

		let postedMessages: PostedMessage[] = [];

		beforeEach(() => {
			postedMessages = [];
			// Stub BroadcastChannel globally — capture postMessage calls on 'neverman-record'
			const MockBC = class {
				name: string;
				constructor(name: string) { this.name = name; }
				postMessage(data: unknown) {
					if (this.name === 'neverman-record') {
						postedMessages.push(data as PostedMessage);
					}
				}
				close() {}
			};
			vi.stubGlobal('BroadcastChannel', MockBC);
			vi.stubGlobal('localStorage', {
				getItem: () => null,
				setItem: () => {},
				removeItem: () => {},
			});
		});

		it('detects a new highest-visit record when visit score exceeds preloaded baseline', () => {
			// Player's prior best visit is 140; scoring 180 via DART_THROWN should detect
			// both "180!" (D-04) and "Neuer Rekord: Höchste Aufnahme".
			// Use a simpler case: a non-180 visit that beats 140.
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'p1', name: 'Alice', isGuest: false }],
				order: ['p1'],
			});
			// Preload records for p1 — prior best = 140
			store.preloadedRecords = new Map([['p1', priorStats]]);

			// Score 141 via board (T17 T18 T20 = 51+54+60=165... use T19+T20+T18 = 57+60+54=171)
			// Simplest: use NUMPAD_VISIT with a board-style visit — but NUMPAD stores darts:[].
			// Use DART_THROWN to get exact darts: T20 (60) + T20 (60) + T21 doesn't exist.
			// Use T20 (60) + T19 (57) + T18 (54) = 171. That beats 140 and is not 180.
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } }); // 60
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 19 } }); // 57
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 18 } }); // 54 → total 171

			const records = store.pendingRecords;
			expect(records.length).toBeGreaterThan(0);
			const types = records.map(r => r.type);
			expect(types).toContain('highest-visit');
		});

		it('celebrates 180 always (D-04), even when not a new personal record', () => {
			// Player's prior best visit is already 180 (highestVisit = 180 in stats)
			const statsWithMaxVisit: LifetimeStats = { ...priorStats, highestVisit: 180 };
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'p1', name: 'Alice', isGuest: false }],
				order: ['p1'],
			});
			store.preloadedRecords = new Map([['p1', statsWithMaxVisit]]);

			// Score exactly 180: T20 + T20 + T20
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });

			const records = store.pendingRecords;
			expect(records.length).toBeGreaterThan(0);
			const types = records.map(r => r.type);
			expect(types).toContain('180');
			// Should NOT also fire highest-visit (already at 180)
			expect(types).not.toContain('highest-visit');
		});

		it('posts record event on BC_RECORD_CHANNEL after a record visit', () => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'p1', name: 'Alice', isGuest: false }],
				order: ['p1'],
			});
			store.preloadedRecords = new Map([['p1', priorStats]]);

			// Score 180: always posts a record event
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });

			expect(postedMessages.length).toBeGreaterThan(0);
			const msg = postedMessages[0];
			expect(msg.type).toBe('record-event');
			expect(Array.isArray(msg.records)).toBe(true);
			expect(msg.records.length).toBeGreaterThan(0);
		});

		it('does NOT detect records for guest players (D-11)', () => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'guest-1', name: 'Gast 1', isGuest: true }],
				order: ['guest-1'],
			});
			// Even with preloaded records, guest should not fire
			store.preloadedRecords = new Map([['guest-1', priorStats]]);

			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });

			expect(store.pendingRecords).toHaveLength(0);
			expect(postedMessages).toHaveLength(0);
		});

		it('does NOT detect records when player has no preloaded baseline (no loadRecords called)', () => {
			// No preloadedRecords set — detection should skip silently
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'p1', name: 'Alice', isGuest: false }],
				order: ['p1'],
			});
			// Do NOT set preloadedRecords

			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });

			expect(store.pendingRecords).toHaveLength(0);
		});

		describe('D-05: null-baseline first-occurrence (brand-new player)', () => {
			// Config with legsToWin:1 so we can complete a match in one leg
			const config1Leg: MatchConfig = {
				startScore: 501,
				outRule: 'double',
				legsToWin: 1,
				setsEnabled: false,
				setsToWin: 1,
			};

			it('celebrates first best leg when preloaded bestLeg is null', () => {
				// Brand-new player has bestLeg: null — any first leg should celebrate
				store.dispatch({
					type: 'START_MATCH',
					config: config1Leg,
					players: [{ id: 'p1', name: 'Alice', isGuest: false }],
					order: ['p1'],
				});
				store.preloadedRecords = new Map([['p1', newPlayerStats]]);

				// Drive to leg win: 501 - 180 - 180 - 101 = 40, then 40 checkout (double 20)
				store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
				store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
				store.dispatch({ type: 'NUMPAD_VISIT', total: 101 });
				// Checkout — winning visit (dartsAtDouble:1)
				store.dispatch({ type: 'NUMPAD_VISIT', total: 40, dartsUsed: 1, dartsAtDouble: 1 });

				// After leg/match win, pendingRecords should include best-leg
				const types = store.pendingRecords.map(r => r.type);
				expect(types).toContain('best-leg');
			});

			it('celebrates first match average when preloaded matchAverage is null', () => {
				// Brand-new player has matchAverage: null — first completed match should celebrate
				store.dispatch({
					type: 'START_MATCH',
					config: config1Leg,
					players: [{ id: 'p1', name: 'Alice', isGuest: false }],
					order: ['p1'],
				});
				store.preloadedRecords = new Map([['p1', newPlayerStats]]);

				// Drive to match completion
				store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
				store.dispatch({ type: 'NUMPAD_VISIT', total: 180 });
				store.dispatch({ type: 'NUMPAD_VISIT', total: 101 });
				store.dispatch({ type: 'NUMPAD_VISIT', total: 40, dartsUsed: 1, dartsAtDouble: 1 });

				expect(store.state.phase).toBe('match-complete');
				const types = store.pendingRecords.map(r => r.type);
				expect(types).toContain('match-avg');
			});
		});

		it('detection never calls dispatch from within dispatch (no infinite loop)', () => {
			// This is verified structurally: #detectRecords only mutates pendingRecords
			// and posts to BroadcastChannel. We verify the store remains stable after
			// a record-triggering dispatch (state is not duplicated or corrupted).
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [{ id: 'p1', name: 'Alice', isGuest: false }],
				order: ['p1'],
			});
			store.preloadedRecords = new Map([['p1', priorStats]]);

			// Score 180 — triggers record detection
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });

			// State should be intact: one visit completed, remaining = 501 - 180 = 321
			expect(store.state.players[0].remaining).toBe(321);
			expect(store.state.phase).toBe('playing');
		});
	});

	describe('mid-visit remaining (CR-06 / ENG-07)', () => {
		beforeEach(() => {
			store.dispatch({
				type: 'START_MATCH',
				config: config501Double,
				players: [player1],
				order: ['p1'],
			});
		});

		it('at visit start (no darts thrown), remaining equals committed remaining', () => {
			expect(store.remaining).toBe(501);
		});

		it('after one T20 dart (60), remaining is 441 mid-visit', () => {
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			expect(store.remaining).toBe(441);
		});

		it('after two T20 darts (120), remaining is 381 mid-visit', () => {
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			expect(store.remaining).toBe(381);
		});

		it('on 100 after T20 mid-visit: remaining is 40 and suggestion includes D20', () => {
			// Get the player to 100 via numpad visits: 501 - 180 - 180 - 41 = 100
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 }); // 321
			store.dispatch({ type: 'NUMPAD_VISIT', total: 180 }); // 141
			store.dispatch({ type: 'NUMPAD_VISIT', total: 41 });  // 100
			// Now player is on 100; throw T20 (60)
			store.dispatch({ type: 'DART_THROWN', dart: { multiplier: 3, segment: 20 } });
			expect(store.remaining).toBe(40);
			const s = store.suggestion;
			expect(s).not.toBeNull();
			expect(s!.some(hint => hint.includes('D20'))).toBe(true);
		});
	});
});
