// src/engine/bust.ts
// Bust detection for X01 scoring.
// ENG-04: three double-out bust conditions checked in order.

import type { DartScore, OutRule } from './types.js';

/**
 * Returns true if throwing `dart` from `remaining` is a bust under `outRule`.
 *
 * Double-out bust conditions (ENG-04):
 *   1. newRemaining < 0  — overshot
 *   2. newRemaining === 1 — no double exists for 1
 *   3. newRemaining === 0 AND finish dart is not a double/bull
 *      (outer bull segment=25 multiplier=1 is NOT a valid double finish — Pitfall 1)
 *
 * Single-out bust condition:
 *   1. newRemaining < 0  — overshot only
 */
export function isBust(remaining: number, dart: DartScore, outRule: OutRule): boolean {
	const scored = dart.multiplier * dart.segment;
	const newRemaining = remaining - scored;

	if (outRule === 'single') {
		return newRemaining < 0;
	}

	// Double-out rules
	if (newRemaining < 0) return true;
	if (newRemaining === 1) return true;
	if (newRemaining === 0) {
		// Valid finish: multiplier=2 (any double, including inner bull which encodes as { multiplier: 2, segment: 25 })
		const isDouble = dart.multiplier === 2;
		return !isDouble;
	}
	return false;
}
