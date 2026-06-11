// src/ui/display/VisitLine.test.ts
// Browser-mode component tests for VisitLine (DISP-03, D-05, D-07).
// Tests written BEFORE implementation (TDD RED phase).
//
// Verifies:
//   1. Mid-visit live slots: renders "T20 · – · –" for currentVisit = [T20]
//   2. Mid-visit two darts: currentVisit = [T20, 20] renders "T20 · 20 · –"
//   3. Completed dart visit: lastCompletedVisit with darts [T20,20,20] → total + breakdown
//   4. Numpad completed visit: darts:[] + completedTotal → total ONLY (no breakdown)
//   5. formatDart special cases: inner bull, miss (Daneben), outer bull, D/T prefixes

import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import VisitLine from './VisitLine.svelte';
import type { DartScore, Visit } from '../../engine/types.js';

// Helper to build a DartScore
const dart = (multiplier: 1 | 2 | 3, segment: number): DartScore => ({ multiplier, segment });

test('mid-visit single dart: renders "T20 · – · –"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(3, 20)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('T20');
	// en-dash placeholders
	expect(screen.container.textContent).toContain('–');
	// middle-dot separators
	expect(screen.container.textContent).toContain('·');
	// should not show em-dash (that's completed-visit format)
	expect(screen.container.textContent).not.toContain('—');
});

test('mid-visit two darts: renders slots for T20, 20, –', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(3, 20), dart(1, 20)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	const text = screen.container.textContent ?? '';
	expect(text).toContain('T20');
	expect(text).toContain('20');
	expect(text).toContain('–'); // third slot still en-dash
});

test('completed dart visit: shows total and dart breakdown with em-dash', async () => {
	const visit: Visit = {
		darts: [dart(3, 20), dart(1, 20), dart(1, 20)], // T20+20+20=100
		dartsAtDouble: 0,
		bust: false,
	};
	const screen = render(VisitLine, {
		currentVisit: [],
		lastCompletedVisit: visit,
		completedTotal: null,
	});
	const text = screen.container.textContent ?? '';
	expect(text).toContain('100');
	expect(text).toContain('T20');
	expect(text).toContain('—'); // em-dash separator
});

test('numpad completed visit: shows total ONLY (no dart breakdown, no em-dash)', async () => {
	const visit: Visit = {
		darts: [],
		dartsAtDouble: 0,
		bust: false,
	};
	const screen = render(VisitLine, {
		currentVisit: [],
		lastCompletedVisit: visit,
		completedTotal: 140,
	});
	const text = screen.container.textContent ?? '';
	expect(text).toContain('140');
	expect(text).not.toContain('—');
	// No individual dart text (no T20 etc)
	expect(text).not.toMatch(/T\d+/);
	expect(text).not.toMatch(/D\d+/);
});

test('formatDart: inner bull {multiplier:2, segment:25} → "Bull"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(2, 25)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('Bull');
	// Should not contain "Outer Bull" prefix
	expect(screen.container.textContent).not.toContain('Outer Bull');
});

test('formatDart: miss {segment:0} → "0 (Daneben)"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(1, 0)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('0 (Daneben)');
});

test('formatDart: outer bull {multiplier:1, segment:25} → "Outer Bull"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(1, 25)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('Outer Bull');
});

test('formatDart: double {multiplier:2, segment:16} → "D16"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(2, 16)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('D16');
});

test('formatDart: triple {multiplier:3, segment:20} → "T20"', async () => {
	const screen = render(VisitLine, {
		currentVisit: [dart(3, 20)],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	expect(screen.container.textContent).toContain('T20');
});

test('no currentVisit and no lastCompletedVisit: renders nothing or empty state', async () => {
	const screen = render(VisitLine, {
		currentVisit: [],
		lastCompletedVisit: null,
		completedTotal: null,
	});
	// Should render without throwing; content may be empty or minimal
	expect(screen.container).toBeTruthy();
});
