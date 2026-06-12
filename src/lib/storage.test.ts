// src/lib/storage.test.ts
// Unit tests for loadUnfinishedMatch() and clearUnfinishedMatch().
// Runs in the `unit` vitest project (node environment).
// localStorage is mocked via vi.stubGlobal — mirrors display.svelte.test.ts pattern.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MatchState } from '../engine/types.js';
import { loadUnfinishedMatch, clearUnfinishedMatch } from './storage.js';

const LS_KEY = 'neverman-match-snapshot';

// ── localStorage mock (same pattern as display.svelte.test.ts lines 85-93) ──

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
	};
})();

beforeEach(() => {
	localStorageMock.clear();
	vi.stubGlobal('localStorage', localStorageMock);
});

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeState(phase: MatchState['phase']): MatchState {
	return {
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
				legsWon: 0,
				setsWon: 0,
				visits: [],
			},
		],
		activePlayerIndex: 0,
		legStarterIndex: 0,
		currentVisit: [],
		phase,
		eventLog: [],
		legStartVisitIndex: { p1: 0 },
	};
}

// ── loadUnfinishedMatch ───────────────────────────────────────────────────────

describe('loadUnfinishedMatch', () => {
	it('returns the parsed MatchState when phase is "playing"', () => {
		const state = makeState('playing');
		localStorage.setItem(LS_KEY, JSON.stringify(state));
		const result = loadUnfinishedMatch();
		expect(result).not.toBeNull();
		expect(result?.phase).toBe('playing');
		expect(result?.players[0].name).toBe('Alice');
	});

	it('returns the parsed state when phase is "leg-complete"', () => {
		const state = makeState('leg-complete');
		localStorage.setItem(LS_KEY, JSON.stringify(state));
		const result = loadUnfinishedMatch();
		expect(result).not.toBeNull();
		expect(result?.phase).toBe('leg-complete');
	});

	it('returns null when phase is "match-complete"', () => {
		const state = makeState('match-complete');
		localStorage.setItem(LS_KEY, JSON.stringify(state));
		expect(loadUnfinishedMatch()).toBeNull();
	});

	it('returns null when phase is "setup"', () => {
		const state = makeState('setup');
		localStorage.setItem(LS_KEY, JSON.stringify(state));
		expect(loadUnfinishedMatch()).toBeNull();
	});

	it('returns null when the key is missing', () => {
		expect(loadUnfinishedMatch()).toBeNull();
	});

	it('returns null when the stored value is corrupt JSON (no throw)', () => {
		localStorage.setItem(LS_KEY, 'not-valid-json{{{{');
		expect(() => loadUnfinishedMatch()).not.toThrow();
		expect(loadUnfinishedMatch()).toBeNull();
	});
});

// ── clearUnfinishedMatch ──────────────────────────────────────────────────────

describe('clearUnfinishedMatch', () => {
	it('removes the snapshot key from localStorage', () => {
		const state = makeState('playing');
		localStorage.setItem(LS_KEY, JSON.stringify(state));
		clearUnfinishedMatch();
		expect(localStorage.getItem(LS_KEY)).toBeNull();
	});

	it('does not throw when the key does not exist', () => {
		expect(() => clearUnfinishedMatch()).not.toThrow();
	});
});
