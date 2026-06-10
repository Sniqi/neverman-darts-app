// src/engine/impossible-scores.test.ts
// RED phase: tests written before implementation.

import { describe, it, expect } from 'vitest';
import { isValidVisitTotal, IMPOSSIBLE_3DART } from './impossible-scores.js';

describe('isValidVisitTotal', () => {
	it('0 → valid (three misses)', () => {
		expect(isValidVisitTotal(0)).toBe(true);
	});

	it('180 → valid (T20 T20 T20)', () => {
		expect(isValidVisitTotal(180)).toBe(true);
	});

	it('181 → invalid (> 180)', () => {
		expect(isValidVisitTotal(181)).toBe(false);
	});

	it('-1 → invalid (negative)', () => {
		expect(isValidVisitTotal(-1)).toBe(false);
	});

	it('179 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(179)).toBe(false);
	});

	it('178 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(178)).toBe(false);
	});

	it('176 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(176)).toBe(false);
	});

	it('175 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(175)).toBe(false);
	});

	it('173 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(173)).toBe(false);
	});

	it('172 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(172)).toBe(false);
	});

	it('169 → invalid (impossible 3-dart total)', () => {
		expect(isValidVisitTotal(169)).toBe(false);
	});

	it('common valid totals are accepted', () => {
		expect(isValidVisitTotal(60)).toBe(true);   // T20
		expect(isValidVisitTotal(100)).toBe(true);  // T20 T20 D10 etc
		expect(isValidVisitTotal(140)).toBe(true);  // T20 T20 D10
		expect(isValidVisitTotal(1)).toBe(true);    // S1
		expect(isValidVisitTotal(60)).toBe(true);
	});

	// Acceptance criteria
	it('isValidVisitTotal(179) is false', () => {
		expect(isValidVisitTotal(179)).toBe(false);
	});

	it('isValidVisitTotal(180) is true', () => {
		expect(isValidVisitTotal(180)).toBe(true);
	});

	it('isValidVisitTotal(0) is true', () => {
		expect(isValidVisitTotal(0)).toBe(true);
	});
});

describe('IMPOSSIBLE_3DART set', () => {
	it('contains all 7 impossible values', () => {
		const expected = [179, 178, 176, 175, 173, 172, 169];
		for (const v of expected) {
			expect(IMPOSSIBLE_3DART.has(v)).toBe(true);
		}
	});

	it('does not contain 180', () => {
		expect(IMPOSSIBLE_3DART.has(180)).toBe(false);
	});

	it('does not contain 0', () => {
		expect(IMPOSSIBLE_3DART.has(0)).toBe(false);
	});
});
