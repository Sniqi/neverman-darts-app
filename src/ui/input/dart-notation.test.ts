// src/ui/input/dart-notation.test.ts
// Unit tests for the shared formatDart notation helpers (SCOR-03, DISP-01).
import { expect, test } from 'vitest';
import { formatDart, formatDartShort } from './dart-notation.js';

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

test('formatDartShort: single segment renders plain number', () => {
	expect(formatDartShort({ multiplier: 1, segment: 20 })).toBe('20');
});

test('formatDartShort: triple renders T prefix', () => {
	expect(formatDartShort({ multiplier: 3, segment: 20 })).toBe('T20');
});

test('formatDartShort: double renders D prefix', () => {
	expect(formatDartShort({ multiplier: 2, segment: 16 })).toBe('D16');
});

test('formatDartShort: inner bull renders Bull', () => {
	expect(formatDartShort({ multiplier: 2, segment: 25 })).toBe('Bull');
});

test('formatDartShort: outer bull renders Outer', () => {
	expect(formatDartShort({ multiplier: 1, segment: 25 })).toBe('Outer');
});

test('formatDartShort: miss renders ✕', () => {
	expect(formatDartShort({ multiplier: 1, segment: 0 })).toBe('✕');
});
