// src/ui/input/dart-notation.test.ts
// Unit tests for the shared formatDart notation helper (SCOR-03).
import { expect, test } from 'vitest';
import { formatDart } from './dart-notation.js';

test('single segment renders plain number', () => {
	expect(formatDart({ multiplier: 1, segment: 20 })).toBe('20');
});

test('triple renders T prefix', () => {
	expect(formatDart({ multiplier: 3, segment: 20 })).toBe('T20');
});

test('double renders D prefix', () => {
	expect(formatDart({ multiplier: 2, segment: 16 })).toBe('D16');
});

test('inner bull renders Bull (50)', () => {
	expect(formatDart({ multiplier: 2, segment: 25 })).toBe('Bull (50)');
});

test('outer bull renders Bull (25)', () => {
	expect(formatDart({ multiplier: 1, segment: 25 })).toBe('Bull (25)');
});

test('miss renders ✕', () => {
	expect(formatDart({ multiplier: 1, segment: 0 })).toBe('✕');
});
