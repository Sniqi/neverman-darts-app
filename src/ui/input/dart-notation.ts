// src/ui/input/dart-notation.ts
// Shared home for the app's dart notation formats (SCOR-03, DISP-01). Two formatters
// coexist by design:
// - formatDart: long form ('Bull (50)' / 'Bull (25)' / '✕'), consumed by
//   src/routes/match/+page.svelte and src/ui/input/VisitStrip.svelte. Unchanged.
// - formatDartShort: short/pill form ('Bull' / 'Outer' / '✕'), transcribed verbatim
//   from design/components/scoring/DartPill.jsx, consumed by
//   src/ui/display/VisitLine.svelte and src/ui/display/PlayerPanel.svelte (Plan 11-03).
//   Per Phase 11 DISP-01 and CONTEXT.md's Q1 resolution, DartPill.jsx is the
//   authoritative value source for the short form's outer-bull string ('Outer').
import type { DartScore } from '../../engine/types.js';

export function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '✕';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull (50)';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Bull (25)';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}

export function formatDartShort(dart: DartScore): string {
	if (dart.segment === 0) return '✕';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Outer';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
