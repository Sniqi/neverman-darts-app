// src/engine/impossible-scores.ts
// Impossible 3-dart visit totals for numpad validation (INP-02).
// These scores cannot be achieved with exactly three darts on a standard board.
// Source: RESEARCH.md Pattern 8 / UI-SPEC.md numpad section.

/**
 * Set of visit totals that are impossible to score in three darts.
 * (Scores between 163–180 that cannot be reached with any combination of
 * three darts on a standard board.)
 */
export const IMPOSSIBLE_3DART = new Set<number>([
	169, 172, 173, 175, 176, 178, 179
]);

/**
 * Returns true if `total` is a valid 3-dart visit total:
 *   - In range [0, 180]
 *   - Not in IMPOSSIBLE_3DART
 *
 * 0 is valid (three misses). 180 is valid (T20 T20 T20).
 */
export function isValidVisitTotal(total: number): boolean {
	if (total < 0 || total > 180) return false;
	return !IMPOSSIBLE_3DART.has(total);
}
