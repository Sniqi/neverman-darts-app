// src/engine/checkout.test.ts
// RED phase: tests written before implementation.
// Tests checkout suggestion lookup for double-out and single-out modes.

import { describe, it, expect } from 'vitest';
import { getSuggestion, CHECKOUT_TABLE } from './checkout.js';

describe('getSuggestion - double out', () => {
	const rule = 'double' as const;

	it('170 → valid route ending on Bull', () => {
		const result = getSuggestion(170, rule);
		expect(result).not.toBeNull();
		expect(Array.isArray(result)).toBe(true);
		expect(result!.length).toBeGreaterThan(0);
		// Must end on a double or Bull
		const last = result![result!.length - 1];
		expect(last === 'Bull' || last.startsWith('D')).toBe(true);
	});

	it('169 → null (bogey number)', () => {
		expect(getSuggestion(169, rule)).toBeNull();
	});

	it('168 → null (bogey number)', () => {
		expect(getSuggestion(168, rule)).toBeNull();
	});

	it('166 → null (bogey number)', () => {
		expect(getSuggestion(166, rule)).toBeNull();
	});

	it('165 → null (bogey number)', () => {
		expect(getSuggestion(165, rule)).toBeNull();
	});

	it('163 → null (bogey number)', () => {
		expect(getSuggestion(163, rule)).toBeNull();
	});

	it('162 → null (bogey number)', () => {
		expect(getSuggestion(162, rule)).toBeNull();
	});

	it('159 → null (bogey number)', () => {
		expect(getSuggestion(159, rule)).toBeNull();
	});

	it('171 → null (> 170 in double-out)', () => {
		expect(getSuggestion(171, rule)).toBeNull();
	});

	it('501 → null (way above 170)', () => {
		expect(getSuggestion(501, rule)).toBeNull();
	});

	it('100 → valid non-null route', () => {
		const result = getSuggestion(100, rule);
		expect(result).not.toBeNull();
		expect(Array.isArray(result)).toBe(true);
		expect(result!.length).toBeGreaterThan(0);
	});

	it('40 → ["D20"] (clean double)', () => {
		const result = getSuggestion(40, rule);
		expect(result).toEqual(['D20']);
	});

	it('50 → ["Bull"] (inner bull finish)', () => {
		const result = getSuggestion(50, rule);
		expect(result).not.toBeNull();
		const last = result![result!.length - 1];
		expect(last === 'Bull' || last === 'D-Bull').toBe(true);
	});

	it('2 → ["D1"] (lowest double finish)', () => {
		const result = getSuggestion(2, rule);
		expect(result).toEqual(['D1']);
	});

	it('returns exactly one route per score (D-10)', () => {
		const result = getSuggestion(100, rule);
		// Should be a single array (one route), not an array of arrays
		expect(Array.isArray(result)).toBe(true);
		if (result) {
			expect(typeof result[0]).toBe('string');
		}
	});

	it('finish-range score returns route ending on a double', () => {
		// 32 → D16
		const result = getSuggestion(32, rule);
		expect(result).not.toBeNull();
		const last = result![result!.length - 1];
		expect(last === 'Bull' || last.startsWith('D')).toBe(true);
	});
});

describe('getSuggestion - single out', () => {
	const rule = 'single' as const;

	it('scores ≤ 180 with a 3-dart finish → returns a route', () => {
		// 180 → T20 T20 T20 in single out
		const result = getSuggestion(180, rule);
		expect(result).not.toBeNull();
	});

	it('single out does not return null for scores ≤ 60 with obvious single finish', () => {
		const result = getSuggestion(20, rule);
		expect(result).not.toBeNull();
	});
});

describe('CHECKOUT_TABLE', () => {
	it('is an object with numeric keys', () => {
		expect(typeof CHECKOUT_TABLE).toBe('object');
	});

	it('contains entry for 170', () => {
		expect(CHECKOUT_TABLE[170]).toBeDefined();
		expect(CHECKOUT_TABLE[170]).not.toBeNull();
	});

	it('contains null for all bogey numbers', () => {
		const bogeys = [159, 162, 163, 165, 166, 168, 169];
		for (const b of bogeys) {
			expect(CHECKOUT_TABLE[b]).toBeNull();
		}
	});
});
