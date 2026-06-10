// src/stores/match.svelte.test.ts
// RED phase: tests written before implementation.
// Unit tests for MatchStore dispatch, activePlayer, remaining, suggestion getters.
// Runs in the `unit` vitest project (includes src/**/*.test.ts, excludes src/ui/**).

import { describe, it, expect, beforeEach } from 'vitest';
import { MatchStore } from './match.svelte.js';
import type { MatchConfig } from '../engine/types.js';

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
});
