// src/ui/input/CorrectionWindow.test.ts
// Browser-mode component test for CorrectionWindow (INP-04).
// Verifies:
//   1. Visit darts render in the window
//   2. Progress bar element exists
//   3. After ~2.5s, CONFIRM_VISIT is dispatched (turn passes)

import { render } from 'vitest-browser-svelte';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import CorrectionWindow from './CorrectionWindow.svelte';
import { matchStore } from '../../stores/match.svelte.js';
import type { DartScore } from '../../engine/types.js';

let dispatchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	dispatchSpy = vi.spyOn(matchStore, 'dispatch');
	vi.useFakeTimers();
});

afterEach(() => {
	dispatchSpy.mockRestore();
	vi.useRealTimers();
});

const sampleDarts: DartScore[] = [
	{ multiplier: 3, segment: 20 }, // T20
	{ multiplier: 3, segment: 20 }, // T20
	{ multiplier: 3, segment: 20 }, // T20
];

test('renders visit darts and progress bar when visible', async () => {
	const screen = render(CorrectionWindow, {
		visible: true,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	// Visit darts should render as formatted text
	const container = screen.container;
	expect(container.textContent).toContain('T20');

	// Progress bar should be present
	const progressBar = container.querySelector('.progress-bar');
	expect(progressBar).toBeTruthy();
});

test('dispatches CONFIRM_VISIT after 2.5s timeout', async () => {
	render(CorrectionWindow, {
		visible: true,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	// Timer has not fired yet
	expect(dispatchSpy).not.toHaveBeenCalled();

	// Advance fake timers past 2500ms
	vi.advanceTimersByTime(2600);

	// CONFIRM_VISIT should have fired
	expect(dispatchSpy).toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });
});

test('shows Überworfen! label for bust visits', async () => {
	const screen = render(CorrectionWindow, {
		visible: true,
		visitDarts: [{ multiplier: 3, segment: 20 }, { multiplier: 3, segment: 20 }, { multiplier: 1, segment: 20 }],
		isBust: true,
		visitTotal: 0
	});

	expect(screen.container.textContent).toContain('Überworfen!');
});

test('does not dispatch CONFIRM_VISIT when not visible', async () => {
	render(CorrectionWindow, {
		visible: false,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	vi.advanceTimersByTime(3000);
	expect(dispatchSpy).not.toHaveBeenCalled();
});
