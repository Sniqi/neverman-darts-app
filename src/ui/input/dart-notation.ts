// src/ui/input/dart-notation.ts
// Shared home for the app's dart notation format (SCOR-03). Consolidates the two
// in-scope duplicate copies (match/+page.svelte, VisitStrip.svelte) into one module.
// Does NOT replace src/ui/display/VisitLine.svelte's own copy (Phase 11 scope, has its
// own locked-old-string test) — never import from there.
import type { DartScore } from '../../engine/types.js';

export function formatDart(dart: DartScore): string {
	if (dart.segment === 0) return '✕';
	if (dart.multiplier === 2 && dart.segment === 25) return 'Bull (50)';
	if (dart.multiplier === 1 && dart.segment === 25) return 'Bull (25)';
	const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
	return `${prefix}${dart.segment}`;
}
