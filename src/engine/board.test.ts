// src/engine/board.test.ts
// RED phase: tests written before implementation.
// Tests polar-math hit classification for all ring/segment zones.

import { describe, it, expect } from 'vitest';
import { classifyHit, angleToSegment, SEGMENT_ORDER } from './board.js';

describe('classifyHit - ring zones', () => {
	it('r < 14.4 → inner bull (multiplier 2, segment 25 = double bull = 50pts)', () => {
		expect(classifyHit(0, 0)).toEqual({ multiplier: 2, segment: 25 });
		expect(classifyHit(10, 0)).toEqual({ multiplier: 2, segment: 25 });
		expect(classifyHit(14.3, 0)).toEqual({ multiplier: 2, segment: 25 });
	});

	it('14.4 ≤ r < 36.5 → outer bull (multiplier 1, segment 25)', () => {
		expect(classifyHit(14.4, 0)).toEqual({ multiplier: 1, segment: 25 });
		expect(classifyHit(25, 0)).toEqual({ multiplier: 1, segment: 25 });
		expect(classifyHit(36.4, 0)).toEqual({ multiplier: 1, segment: 25 });
	});

	it('36.5 ≤ r < 186 → inner single (multiplier 1)', () => {
		const result = classifyHit(100, 270); // pointing up at top = segment 20
		expect(result.multiplier).toBe(1);
		expect(result.segment).toBe(20);
	});

	it('186 ≤ r < 209 → triple (multiplier 3)', () => {
		const result = classifyHit(197, 270); // top = segment 20
		expect(result.multiplier).toBe(3);
		expect(result.segment).toBe(20);
	});

	it('209 ≤ r < 303 → outer single (multiplier 1)', () => {
		const result = classifyHit(256, 270); // top = segment 20
		expect(result.multiplier).toBe(1);
		expect(result.segment).toBe(20);
	});

	it('303 ≤ r < 325 → double (multiplier 2)', () => {
		const result = classifyHit(314, 270); // top = segment 20
		expect(result.multiplier).toBe(2);
		expect(result.segment).toBe(20);
	});

	it('r ≥ 325 → miss (multiplier 1, segment 0)', () => {
		expect(classifyHit(325, 0)).toEqual({ multiplier: 1, segment: 0 });
		expect(classifyHit(330, 0)).toEqual({ multiplier: 1, segment: 0 });
		expect(classifyHit(400, 45)).toEqual({ multiplier: 1, segment: 0 });
	});

	// Acceptance criteria checks
	it('classifyHit(10, 0) returns inner bull (multiplier 2, segment 25 = 50 pts)', () => {
		expect(classifyHit(10, 0)).toEqual({ multiplier: 2, segment: 25 });
	});

	it('classifyHit(25, 0) returns outer bull', () => {
		expect(classifyHit(25, 0)).toEqual({ multiplier: 1, segment: 25 });
	});

	it('classifyHit(330, 0) returns miss', () => {
		expect(classifyHit(330, 0)).toEqual({ multiplier: 1, segment: 0 });
	});
});

describe('angleToSegment - segment order', () => {
	// SEGMENT_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5]
	// Top (270°) = segment 20
	// Each segment spans 18°; segment 20 centered at 270°

	it('top (270°) → segment 20', () => {
		expect(angleToSegment(270)).toBe(20);
	});

	it('clockwise from 20: next segment at ~288° → segment 1', () => {
		expect(angleToSegment(288)).toBe(1);
	});

	it('segment 18 at ~306°', () => {
		expect(angleToSegment(306)).toBe(18);
	});

	it('segment 5 at ~252° (just before top going counter-clockwise)', () => {
		// Segment 5 is last in the clockwise order, so it's just before 20 going clockwise
		// Position: 270 - 18 = 252° center
		expect(angleToSegment(252)).toBe(5);
	});

	it('0 degrees (right / 3 oclock) → segment 6', () => {
		// 0° is 270° away from top (clockwise): index = floor((0 - 270 + 9 + 360) % 360 / 18) = floor(99/18) = 5 → SEGMENT_ORDER[5] = 6
		expect(angleToSegment(0)).toBe(6);
	});

	it('SEGMENT_ORDER has 20 entries', () => {
		expect(SEGMENT_ORDER).toHaveLength(20);
		expect(SEGMENT_ORDER[0]).toBe(20);
	});
});
