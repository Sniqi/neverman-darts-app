// src/engine/board.ts
// Polar-math hit classification for the SVG dartboard.
// Ring radii match the D-01 enlarged triple/double widths from UI-SPEC.md.
//
// Board center: (200, 200) in viewBox="0 0 400 400"
// Ring boundaries (from UI-SPEC.md Dartboard Visual Spec):
//   inner bull:   0   – 14.4px  → { multiplier: 2, segment: 50 }
//   outer bull:   14.4 – 36.5px → { multiplier: 1, segment: 25 }
//   inner single: 36.5 – 186px  → { multiplier: 1, segment: N }
//   triple:       186  – 209px  → { multiplier: 3, segment: N }
//   outer single: 209  – 303px  → { multiplier: 1, segment: N }
//   double:       303  – 325px  → { multiplier: 2, segment: N }
//   miss:         325+ px       → { multiplier: 1, segment: 0 }

import type { DartScore } from './types.js';

// Standard dartboard segment order, clockwise from top (12 o'clock = segment 20).
export const SEGMENT_ORDER: number[] = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/**
 * Convert an angle (in degrees, 0° = right / 3 o'clock, increasing clockwise)
 * to the dartboard segment number at that angle.
 *
 * Segment 20 is centered at 270° (top / 12 o'clock).
 * Each segment spans exactly 18°.
 * The segment 20 slice runs from 261° to 279° (270 ± 9).
 */
export function angleToSegment(angleDeg: number): number {
	// Normalise angle to [0, 360)
	const normalised = ((angleDeg % 360) + 360) % 360;
	// Rotate so that segment 20 (centred at 270°) maps to index 0.
	// Subtract 270 (top) then add 9 (half-segment offset) so 261° → 0°.
	const adjusted = ((normalised - 270 + 9 + 360) % 360);
	const index = Math.floor(adjusted / 18) % 20;
	return SEGMENT_ORDER[index];
}

/**
 * Classify a hit at polar coordinates (r, angleDeg) relative to board centre.
 * r is the radius in SVG user-space units.
 * angleDeg is the angle in degrees, 0° = right (3 o'clock), clockwise positive.
 */
export function classifyHit(r: number, angleDeg: number): DartScore {
	if (r < 14.4) return { multiplier: 2, segment: 50 };   // inner bull
	if (r < 36.5) return { multiplier: 1, segment: 25 };   // outer bull
	if (r >= 325)  return { multiplier: 1, segment: 0 };   // miss

	const segment = angleToSegment(angleDeg);

	if (r < 186) return { multiplier: 1, segment };  // inner single
	if (r < 209) return { multiplier: 3, segment };  // triple
	if (r < 303) return { multiplier: 1, segment };  // outer single
	// 303 ≤ r < 325
	return { multiplier: 2, segment };               // double
}

/**
 * Convert a pointer event coordinate to SVG board space, then return polar
 * coordinates (r, angleDeg) relative to the board centre (200, 200).
 *
 * This function is used in Plan 03's Dartboard.svelte component.
 * It is exported here so browser tests in Plan 03 can exercise it directly.
 * Unit tests in this plan test classifyHit and angleToSegment directly.
 */
export function screenToBoard(e: PointerEvent, svg: SVGSVGElement): { r: number; angleDeg: number } {
	const pt = svg.createSVGPoint();
	pt.x = e.clientX;
	pt.y = e.clientY;
	const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

	const dx = svgP.x - 200;
	const dy = svgP.y - 200;
	const r = Math.sqrt(dx * dx + dy * dy);
	let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
	if (angleDeg < 0) angleDeg += 360;

	return { r, angleDeg };
}
