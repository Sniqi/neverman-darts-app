// src/engine/rotation.test.ts
// RED phase: tests written before implementation.

import { describe, it, expect } from 'vitest';
import { nextPlayerIndex, legStarterIndex } from './rotation.js';

describe('nextPlayerIndex', () => {
	it('2 players: 0 → 1 → 0', () => {
		expect(nextPlayerIndex(0, 2)).toBe(1);
		expect(nextPlayerIndex(1, 2)).toBe(0);
	});

	it('3 players: cycles 0 → 1 → 2 → 0', () => {
		expect(nextPlayerIndex(0, 3)).toBe(1);
		expect(nextPlayerIndex(1, 3)).toBe(2);
		expect(nextPlayerIndex(2, 3)).toBe(0);
	});

	it('4 players: cycles 0 → 1 → 2 → 3 → 0', () => {
		expect(nextPlayerIndex(0, 4)).toBe(1);
		expect(nextPlayerIndex(1, 4)).toBe(2);
		expect(nextPlayerIndex(2, 4)).toBe(3);
		expect(nextPlayerIndex(3, 4)).toBe(0);
	});

	it('1 player: always returns 0', () => {
		expect(nextPlayerIndex(0, 1)).toBe(0);
	});
});

describe('legStarterIndex', () => {
	it('leg 0 (first leg) → player 0 starts', () => {
		expect(legStarterIndex(0, 2)).toBe(0);
		expect(legStarterIndex(0, 3)).toBe(0);
		expect(legStarterIndex(0, 4)).toBe(0);
	});

	it('leg 1 → player 1 starts (for 2+ players)', () => {
		expect(legStarterIndex(1, 2)).toBe(1);
		expect(legStarterIndex(1, 3)).toBe(1);
		expect(legStarterIndex(1, 4)).toBe(1);
	});

	it('leg 2 → player 2 starts (for 3+ players)', () => {
		expect(legStarterIndex(2, 3)).toBe(2);
		expect(legStarterIndex(2, 4)).toBe(2);
	});

	it('leg 2 with 2 players → cycles back to player 0', () => {
		expect(legStarterIndex(2, 2)).toBe(0);
	});

	it('leg 3 with 2 players → player 1', () => {
		expect(legStarterIndex(3, 2)).toBe(1);
	});

	it('leg 4 with 4 players → player 0 (cycle complete)', () => {
		expect(legStarterIndex(4, 4)).toBe(0);
	});

	it('leg n with 1 player → always 0', () => {
		expect(legStarterIndex(0, 1)).toBe(0);
		expect(legStarterIndex(5, 1)).toBe(0);
	});
});
