// src/engine/reducer.test.ts
// RED phase: tests written before implementation.
// Tests the pure X01 reducer covering ENG-01..06, INP-03, PROF-02.

import { describe, it, expect } from 'vitest';
import { reduce, initialState } from './reducer.js';
import type { MatchConfig, MatchAction, PlayerState } from './types.js';

// Helper to build a test MatchConfig overriding the locked startScore type.
// Tests use small start scores (32, 40) for brevity — the `as unknown` chain
// bypasses the literal-type constraint on startScore for test-only convenience.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cfg(overrides: Record<string, any>): MatchConfig {
	return {
		startScore: 501,
		outRule: 'double',
		legsToWin: 3,
		setsEnabled: false,
		setsToWin: 1,
		...overrides,
	} as MatchConfig;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const config501Double: MatchConfig = {
	startScore: 501,
	outRule: 'double',
	legsToWin: 3,
	setsEnabled: false,
	setsToWin: 1,
};

const config301Single: MatchConfig = {
	startScore: 301,
	outRule: 'single',
	legsToWin: 2,
	setsEnabled: false,
	setsToWin: 1,
};

const playerA = { id: 'a', name: 'Alice', isGuest: false };
const playerB = { id: 'b', name: 'Bob', isGuest: false };
const playerC = { id: 'c', name: 'Carol', isGuest: false };
const guestPlayer = { id: 'g', name: 'Gast', isGuest: true };

function startMatch(config = config501Double, players = [playerA, playerB], order = ['a', 'b']) {
	const action: MatchAction = { type: 'START_MATCH', config, players, order };
	return reduce(initialState(), action);
}

function throwDart(state: ReturnType<typeof startMatch>, multiplier: 1 | 2 | 3, segment: number) {
	return reduce(state, { type: 'DART_THROWN', dart: { multiplier, segment } });
}

function numpadVisit(state: ReturnType<typeof startMatch>, total: number, dartsUsed?: 1 | 2 | 3, dartsAtDouble?: number) {
	return reduce(state, { type: 'NUMPAD_VISIT', total, dartsUsed, dartsAtDouble });
}

// ── initialState ───────────────────────────────────────────────────────────

describe('initialState', () => {
	it('returns phase=setup with empty players and eventLog', () => {
		const s = initialState();
		expect(s.phase).toBe('setup');
		expect(s.players).toHaveLength(0);
		expect(s.eventLog).toHaveLength(0);
	});
});

// ── START_MATCH ────────────────────────────────────────────────────────────

describe('START_MATCH', () => {
	it('sets phase to playing', () => {
		const s = startMatch();
		expect(s.phase).toBe('playing');
	});

	it('initializes players with startScore as remaining', () => {
		const s = startMatch();
		expect(s.players).toHaveLength(2);
		expect(s.players[0].remaining).toBe(501);
		expect(s.players[1].remaining).toBe(501);
	});

	it('sets activePlayerIndex to 0 (first in order)', () => {
		const s = startMatch();
		expect(s.activePlayerIndex).toBe(0);
	});

	it('sets legStarterIndex to 0 (first in order)', () => {
		const s = startMatch();
		expect(s.legStarterIndex).toBe(0);
	});

	it('appends START_MATCH to eventLog', () => {
		const s = startMatch();
		expect(s.eventLog).toHaveLength(1);
		expect(s.eventLog[0].type).toBe('START_MATCH');
	});

	it('respects order array: second player in order becomes activePlayer', () => {
		const s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, playerB],
			order: ['b', 'a'],  // Bob throws first
		});
		expect(s.players[0].id).toBe('b');
		expect(s.activePlayerIndex).toBe(0);
	});

	it('initializes legsWon and setsWon to 0', () => {
		const s = startMatch();
		for (const p of s.players) {
			expect(p.legsWon).toBe(0);
			expect(p.setsWon).toBe(0);
			expect(p.visits).toHaveLength(0);
		}
	});

	it('empty players/order returns phase=setup with no players (CR-05)', () => {
		const s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [],
			order: [],
		});
		expect(s.phase).toBe('setup');
		expect(s.players).toHaveLength(0);
	});

	it('order with unmatched id drops that id; all unmatched returns phase=setup (CR-05)', () => {
		// All ids in order are absent from players → empty result → setup phase
		const s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA],
			order: ['nonexistent-id'],
		});
		expect(s.phase).toBe('setup');
		expect(s.players).toHaveLength(0);
	});

	it('order with one matched and one unmatched id drops the unmatched id only (CR-05)', () => {
		const s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, playerB],
			order: ['a', 'nonexistent-id'],
		});
		expect(s.phase).toBe('playing');
		expect(s.players).toHaveLength(1);
		expect(s.players[0].id).toBe('a');
	});
});

// ── DART_THROWN — basic scoring ────────────────────────────────────────────

describe('DART_THROWN - basic scoring', () => {
	it('T20 T20 T20 visit → remaining decrements from 501 to 321', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20); // 60
		s = throwDart(s, 3, 20); // 60
		s = throwDart(s, 3, 20); // 60 → total 180
		expect(s.players[0].remaining).toBe(321);
	});

	it('turn passes to next player after 3 darts', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20);
		s = throwDart(s, 3, 20);
		expect(s.activePlayerIndex).toBe(0); // still player 0 after 2 darts
		s = throwDart(s, 3, 20); // 3rd dart
		expect(s.activePlayerIndex).toBe(1); // now player 1
	});

	it('currentVisit tracks darts within a visit', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20);
		expect(s.currentVisit).toHaveLength(1);
		s = throwDart(s, 1, 5);
		expect(s.currentVisit).toHaveLength(2);
	});

	it('currentVisit resets after visit ends', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20);
		s = throwDart(s, 3, 20);
		s = throwDart(s, 3, 20);
		expect(s.currentVisit).toHaveLength(0);
	});
});

// ── DART_THROWN — bust ─────────────────────────────────────────────────────

describe('DART_THROWN - bust', () => {
	it('bust visit leaves remaining at start-of-visit value', () => {
		let s = startMatch();
		// Throw 2 scoring darts first
		s = throwDart(s, 3, 20); // 60
		s = throwDart(s, 3, 20); // 60 → 381 remaining
		const remainingBeforeVisit = s.players[0].remaining; // still 501
		// Now overshoot
		s = throwDart(s, 3, 20); // 60 → total 180, now at 321
		// That was a valid visit. Start new visit.
		// Player 1 now. Go back to player 0.
		s = throwDart(s, 1, 1); // player 1 darts
		s = throwDart(s, 1, 1);
		s = throwDart(s, 1, 1); // player 1 done

		// Now player 0 again at 321. Try to overshoot
		const remBefore = s.players[0].remaining; // 321
		s = throwDart(s, 3, 20); // 60
		s = throwDart(s, 3, 20); // 60
		s = throwDart(s, 3, 20); // 60 → total 321, checkable - wait 321-180=141 valid
		// Let's force a proper bust. Player 0 is at 321, throw T20(60)+T20(60)+T20(60)=180, leaving 141 — not a bust.
		// Need to test bust properly: get to low score then overshoot
		// Use a fresh start with low score
		const s2 = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 301 }),
			players: [playerA],
			order: ['a'],
		});
		// 301 - 180 = 121
		let sx = throwDart(s2, 3, 20);
		sx = throwDart(sx, 3, 20);
		sx = throwDart(sx, 3, 20); // remaining = 121
		// 121 - 60 = 61, 61 - 60 = 1 → bust (==1)
		const remBeforeBust = sx.players[0].remaining; // 121
		sx = throwDart(sx, 3, 20); // 60, remaining = 61
		sx = throwDart(sx, 3, 20); // 60, remaining = 1 → BUST
		expect(sx.players[0].remaining).toBe(remBeforeBust);
	});

	it('bust visit is flagged bust: true on the stored visit', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 301 }),
			players: [playerA],
			order: ['a'],
		});
		s = throwDart(s, 3, 20); s = throwDart(s, 3, 20); s = throwDart(s, 3, 20); // 121
		const remBefore = s.players[0].remaining;
		s = throwDart(s, 3, 20); // 60 → 61
		s = throwDart(s, 3, 20); // 60 → 1 → BUST mid-visit (still processing)
		// After bust the visit should be bust and turn passed
		expect(s.players[0].remaining).toBe(remBefore);
		// Check the last visit recorded was a bust
		const lastVisit = s.players[0].visits[s.players[0].visits.length - 1];
		expect(lastVisit.bust).toBe(true);
	});

	it('bust passes the turn', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 301 }),
			players: [playerA, playerB],
			order: ['a', 'b'],
		});
		s = throwDart(s, 3, 20); s = throwDart(s, 3, 20); s = throwDart(s, 3, 20); // 121, player 1
		// Force bust on player A's 2nd turn: player B needs to finish their turn first
		s = throwDart(s, 1, 1); s = throwDart(s, 1, 1); s = throwDart(s, 1, 1); // player B
		// Now player A at 121 → overshoot: T20(60)+T20(60) = 1 remaining → bust
		s = throwDart(s, 3, 20); // 61 remaining
		s = throwDart(s, 3, 20); // 1 remaining → BUST
		expect(s.activePlayerIndex).toBe(1); // turn passed to player B
	});
});

// ── DART_THROWN — leg win ──────────────────────────────────────────────────

describe('DART_THROWN - leg win (double out)', () => {
	it('valid double finish increments legsWon', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 32 }),
			players: [playerA],
			order: ['a'],
		});
		// D16 = 32 → leg win
		s = throwDart(s, 2, 16);
		expect(s.players[0].legsWon).toBe(1);
	});

	it('single finish on single-out increments legsWon', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 20, outRule: 'single', legsToWin: 2 }),
			players: [playerA],
			order: ['a'],
		});
		s = throwDart(s, 1, 20);
		expect(s.players[0].legsWon).toBe(1);
	});

	it('reaching legsToWin sets phase to match-complete', () => {
		// legsToWin=1 for quick test
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 40, legsToWin: 1 }),
			players: [playerA],
			order: ['a'],
		});
		s = throwDart(s, 2, 20); // D20 = 40 → leg win → match win
		expect(s.phase).toBe('match-complete');
	});
});

// ── UNDO ───────────────────────────────────────────────────────────────────

describe('UNDO', () => {
	it('removes exactly one dart from currentVisit', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20);
		s = throwDart(s, 1, 5);
		expect(s.currentVisit).toHaveLength(2);
		s = reduce(s, { type: 'UNDO' });
		expect(s.currentVisit).toHaveLength(1);
		expect(s.currentVisit[0]).toEqual({ multiplier: 3, segment: 20 });
	});

	it('restores remaining after undoing a dart', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20); // 501 - 60 = 441 remaining
		const before = s.players[0].remaining; // 441
		s = throwDart(s, 3, 20); // 441 - 60 = 381
		s = reduce(s, { type: 'UNDO' });
		expect(s.players[0].remaining).toBe(before); // back to 441
	});

	it('undo through leg win reverts legsWon (D-06, Pitfall 3)', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 40 }),
			players: [playerA],
			order: ['a'],
		});
		expect(s.players[0].legsWon).toBe(0);
		s = throwDart(s, 2, 20); // D20 → leg win, legsWon = 1
		expect(s.players[0].legsWon).toBe(1);
		s = reduce(s, { type: 'UNDO' }); // undo the winning dart
		expect(s.players[0].legsWon).toBe(0); // reverted
		expect(s.players[0].remaining).toBe(40); // score reverted too
	});

	it('undo on empty log does not crash', () => {
		const s = initialState();
		expect(() => reduce(s, { type: 'UNDO' })).not.toThrow();
	});

	it('unlimited undo: can undo back to before match start', () => {
		let s = startMatch();
		s = throwDart(s, 3, 20);
		s = reduce(s, { type: 'UNDO' });
		s = reduce(s, { type: 'UNDO' }); // undo START_MATCH
		expect(s.phase).toBe('setup');
	});
});

// ── NUMPAD_VISIT ───────────────────────────────────────────────────────────

describe('NUMPAD_VISIT', () => {
	it('subtracts valid total from remaining', () => {
		let s = startMatch();
		s = numpadVisit(s, 140);
		expect(s.players[0].remaining).toBe(361);
	});

	it('rejects impossible total (179) — state unchanged', () => {
		let s = startMatch();
		const before = s.players[0].remaining;
		s = numpadVisit(s, 179);
		expect(s.players[0].remaining).toBe(before);
	});

	it('rejects total > 180 — state unchanged', () => {
		let s = startMatch();
		const before = s.players[0].remaining;
		s = numpadVisit(s, 181);
		expect(s.players[0].remaining).toBe(before);
	});

	it('passes turn after a non-finishing visit', () => {
		let s = startMatch();
		s = numpadVisit(s, 140);
		expect(s.activePlayerIndex).toBe(1);
	});

	it('finishing numpad visit carries dartsAtDouble (D-08, INP-03)', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 40 }),
			players: [playerA],
			order: ['a'],
		});
		s = numpadVisit(s, 40, 2, 2); // finish with 2 darts, 2 darts at double
		const lastVisit = s.players[0].visits[s.players[0].visits.length - 1];
		expect(lastVisit.dartsAtDouble).toBe(2);
	});

	it('non-finishing numpad visit records dartsAtDouble=0', () => {
		let s = startMatch();
		s = numpadVisit(s, 140);
		const lastVisit = s.players[0].visits[s.players[0].visits.length - 1];
		expect(lastVisit.dartsAtDouble).toBe(0);
	});
});

// ── Turn rotation ──────────────────────────────────────────────────────────

describe('Turn rotation', () => {
	it('3 players rotate correctly through turns', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, playerB, playerC],
			order: ['a', 'b', 'c'],
		});
		expect(s.activePlayerIndex).toBe(0);
		s = numpadVisit(s, 60); // player A
		expect(s.activePlayerIndex).toBe(1);
		s = numpadVisit(s, 60); // player B
		expect(s.activePlayerIndex).toBe(2);
		s = numpadVisit(s, 60); // player C
		expect(s.activePlayerIndex).toBe(0); // back to A
	});
});

// ── Guest players ──────────────────────────────────────────────────────────

describe('Guest players (PROF-02)', () => {
	it('guest player is flagged isGuest=true', () => {
		const s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, guestPlayer],
			order: ['a', 'g'],
		});
		const guest = s.players.find(p => p.id === 'g');
		expect(guest).toBeDefined();
		expect(guest!.isGuest).toBe(true);
	});

	it('guest player participates in the game identically to a named player', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: config501Double,
			players: [guestPlayer],
			order: ['g'],
		});
		s = numpadVisit(s, 180);
		expect(s.players[0].remaining).toBe(321);
	});
});

// ── Immutability ───────────────────────────────────────────────────────────

describe('Immutability', () => {
	it('reduce never mutates its input state', () => {
		const s = startMatch();
		const playersBefore = s.players;
		const remainingBefore = s.players[0].remaining;
		const next = throwDart(s, 3, 20);
		// Original state should be unchanged
		expect(Object.is(s, next)).toBe(false);
		expect(s.players[0].remaining).toBe(remainingBefore);
	});
});

// ── Leg starter alternation ────────────────────────────────────────────────

describe('Leg starter alternation', () => {
	it('second leg starts with player 1 (2-player game)', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 40, legsToWin: 3 }),
			players: [playerA, playerB],
			order: ['a', 'b'],
		});
		expect(s.legStarterIndex).toBe(0); // leg 0 starts with player 0
		// Win leg 0: player A hits D20
		s = throwDart(s, 2, 20);
		// leg 1 should start with player 1
		expect(s.legStarterIndex).toBe(1);
		expect(s.activePlayerIndex).toBe(1);
	});
});

// ── Sets support ───────────────────────────────────────────────────────────

describe('Sets (ENG-02)', () => {
	it('winning all required legs wins the set when setsEnabled', () => {
		let s = reduce(initialState(), {
			type: 'START_MATCH',
			config: cfg({ startScore: 40, legsToWin: 1, setsEnabled: true, setsToWin: 2 }),
			players: [playerA],
			order: ['a'],
		});
		s = throwDart(s, 2, 20); // win leg 0 → win set 0 (legsToWin=1)
		expect(s.players[0].setsWon).toBe(1);
	});
});

// ── ENG-05 / CR-07 / WR-01: Event-log reset and CONFIRM_VISIT no-op ────────

describe('ENG-05: Event-log per-match semantics (CR-07, WR-01)', () => {
	it('START_MATCH on a non-empty eventLog produces eventLog with length exactly 1', () => {
		// Simulate a prior match by building a state with a non-empty event log
		let s = startMatch();
		s = numpadVisit(s, 60); // eventLog now has 2 entries: START_MATCH, NUMPAD_VISIT
		expect(s.eventLog.length).toBeGreaterThan(1);

		// Start a new match on top of that state
		const action: MatchAction = {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, playerB],
			order: ['a', 'b'],
		};
		const s2 = reduce(s, action);
		expect(s2.eventLog).toHaveLength(1);
		expect(s2.eventLog[0].type).toBe('START_MATCH');
	});

	it('CONFIRM_VISIT is NOT appended to the eventLog', () => {
		let s = startMatch();
		s = numpadVisit(s, 60);
		const logLenAfterVisit = s.eventLog.length; // START_MATCH + NUMPAD_VISIT = 2
		s = reduce(s, { type: 'CONFIRM_VISIT' });
		expect(s.eventLog).toHaveLength(logLenAfterVisit); // no change
	});

	it('single UNDO after CONFIRM_VISIT reverts the NUMPAD_VISIT (not a no-op)', () => {
		let s = startMatch(cfg({ startScore: 501 }), [playerA, playerB], ['a', 'b']);
		const remainingBefore = s.players[0].remaining; // 501
		s = numpadVisit(s, 60);
		// After NUMPAD_VISIT(60): player A remaining=441, turn passes to player B
		expect(s.players[0].remaining).toBe(441);
		// CONFIRM_VISIT is dispatched (simulates UI correction window)
		s = reduce(s, { type: 'CONFIRM_VISIT' });
		// UNDO — must revert the NUMPAD_VISIT, not be consumed by CONFIRM_VISIT
		s = reduce(s, { type: 'UNDO' });
		// After UNDO, we should be back to the state after START_MATCH:
		// player A has remaining=501, activePlayerIndex=0
		expect(s.players[0].remaining).toBe(remainingBefore);
		expect(s.activePlayerIndex).toBe(0);
	});

	it('cross-match regression: UNDO at start of match B does not replay match A', () => {
		// Match A: legsToWin=1, finish it
		const matchAConfig = cfg({ startScore: 40, legsToWin: 1, outRule: 'double' });
		let sA = reduce(initialState(), {
			type: 'START_MATCH',
			config: matchAConfig,
			players: [playerA],
			order: ['a'],
		});
		sA = throwDart(sA, 2, 20); // D20=40 → leg win → match-complete
		expect(sA.phase).toBe('match-complete');

		// Start match B on top of the completed match A state
		const matchBAction: MatchAction = {
			type: 'START_MATCH',
			config: config501Double,
			players: [playerA, playerB],
			order: ['a', 'b'],
		};
		let sB = reduce(sA, matchBAction);
		expect(sB.phase).toBe('playing');

		// UNDO once at the start of match B
		sB = reduce(sB, { type: 'UNDO' });
		// Should revert to setup (undid the START_MATCH of match B), NOT replay match A
		expect(sB.phase).toBe('setup');
		// Specifically, must NOT return to 'match-complete'
		expect(sB.phase).not.toBe('match-complete');
	});
});
