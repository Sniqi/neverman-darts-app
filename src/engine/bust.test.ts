// src/engine/bust.test.ts
// RED phase: tests written before implementation.
// Tests all three double-out bust conditions plus single-out.

import { describe, it, expect } from 'vitest';
import { isBust } from './bust.js';
import type { DartScore } from './types.js';

const d = (multiplier: 1 | 2 | 3, segment: number): DartScore => ({ multiplier, segment });

describe('isBust - double out', () => {
	const rule = 'double' as const;

	it('newRemaining < 0 → bust (overshot)', () => {
		// remaining=10, dart=T20 (60) → newRemaining = -50 → bust
		expect(isBust(10, d(3, 20), rule)).toBe(true);
		// remaining=2, dart=D2 (4) → newRemaining = -2 → bust
		expect(isBust(2, d(2, 2), rule)).toBe(true);
	});

	it('newRemaining === 1 → bust (no double for 1)', () => {
		// remaining=2, S1 → newRemaining = 1 → bust (Pitfall 2)
		expect(isBust(2, d(1, 1), rule)).toBe(true);
		// remaining=21, S20 → newRemaining = 1 → bust
		expect(isBust(21, d(1, 20), rule)).toBe(true);
	});

	it('newRemaining === 0 AND multiplier !== 2 AND segment !== 50 → bust (not a double finish)', () => {
		// remaining=20, S20 → 0 but not a double → bust
		expect(isBust(20, d(1, 20), rule)).toBe(true);
		// remaining=25, outer bull S25 → 0 but not a double → bust (Pitfall 1)
		expect(isBust(25, d(1, 25), rule)).toBe(true);
		// remaining=60, T20 → 0 but not a double → bust
		expect(isBust(60, d(3, 20), rule)).toBe(true);
	});

	it('newRemaining === 0 AND multiplier === 2 → valid finish (not bust)', () => {
		// remaining=40, D20 → finish
		expect(isBust(40, d(2, 20), rule)).toBe(false);
		// remaining=2, D1 → finish
		expect(isBust(2, d(2, 1), rule)).toBe(false);
		// remaining=32, D16 → finish
		expect(isBust(32, d(2, 16), rule)).toBe(false);
	});

	it('newRemaining === 0 AND segment === 50 (inner bull) → valid finish (not bust)', () => {
		// remaining=50, inner bull → finish (D-Bull)
		expect(isBust(50, d(2, 25), rule)).toBe(false); // multiplier 2 segment 25 = inner bull = 50pts
		// Actually inner bull is represented as { multiplier: 1, segment: 50 } per types.ts comment
		// Wait - classifyHit returns { multiplier: 2, segment: 50 } for inner bull
		// So isBust checks dart.segment === 50 which this covers
	});

	it('inner bull (segment 50, multiplier 2) → valid finish when remaining equals scored value', () => {
		// classifyHit returns { multiplier: 2, segment: 50 } for inner bull = 100 pts
		// remaining=100, dart scores 2*50=100 → newRemaining=0, segment=50 → valid finish
		expect(isBust(100, d(2, 50), rule)).toBe(false);
	});

	it('newRemaining > 1 → not bust (game continues)', () => {
		// remaining=100, T20 → 40 remaining → not bust
		expect(isBust(100, d(3, 20), rule)).toBe(false);
		// remaining=501, T20 → 441 remaining → not bust
		expect(isBust(501, d(3, 20), rule)).toBe(false);
	});

	// Acceptance criteria checks
	it('isBust(0, {multiplier:1, segment:25}, double) → true (outer bull not a double finish)', () => {
		expect(isBust(25, d(1, 25), rule)).toBe(true);
	});

	it('isBust(1, {multiplier:1, segment:1}, double) → true (leaves 0 but not a double)', () => {
		// remaining=1, S1 → newRemaining = 0, but multiplier=1, segment=1 → bust
		expect(isBust(1, d(1, 1), rule)).toBe(true);
	});

	it('isBust(0, {multiplier:2, segment:20}, double) → false (D20 is valid finish)', () => {
		expect(isBust(40, d(2, 20), rule)).toBe(false);
	});
});

describe('isBust - single out', () => {
	const rule = 'single' as const;

	it('newRemaining < 0 → bust', () => {
		expect(isBust(10, d(3, 20), rule)).toBe(true);
	});

	it('newRemaining === 0 on any dart → valid finish (not bust)', () => {
		expect(isBust(20, d(1, 20), rule)).toBe(false);
		expect(isBust(25, d(1, 25), rule)).toBe(false);
		expect(isBust(1, d(1, 1), rule)).toBe(false);
	});

	it('newRemaining === 1 → not bust (reachable in single out)', () => {
		expect(isBust(2, d(1, 1), rule)).toBe(false);
	});
});
