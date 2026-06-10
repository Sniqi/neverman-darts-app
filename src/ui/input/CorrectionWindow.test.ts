// src/ui/input/CorrectionWindow.test.ts
// Browser-mode component test for CorrectionWindow (INP-04).
// Verifies:
//   1. Visit darts render in the window
//   2. Progress bar element exists
//   3. After ~2.5s (real timer), CONFIRM_VISIT is dispatched exactly once (not a loop)
//   4. Paused-escape path: 'Fertig' button and outside-click both dismiss while paused

import { render } from 'vitest-browser-svelte';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import CorrectionWindow from './CorrectionWindow.svelte';
import { matchStore } from '../../stores/match.svelte.js';
import type { DartScore } from '../../engine/types.js';

let dispatchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	dispatchSpy = vi.spyOn(matchStore, 'dispatch');
});

afterEach(() => {
	dispatchSpy.mockRestore();
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

test('dispatches CONFIRM_VISIT exactly once after ~2.5s (real timer — proves no restart loop)', async () => {
	render(CorrectionWindow, {
		visible: true,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	// Timer has not fired yet immediately after mount
	expect(dispatchSpy).not.toHaveBeenCalled();

	// Wait for the real 2500ms setTimeout to fire (poll up to 3s)
	await vi.waitFor(
		() => {
			expect(dispatchSpy).toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });
		},
		{ timeout: 3000 }
	);

	// Must have fired exactly once — if the effect restarted every rAF frame it would fire many times
	expect(dispatchSpy).toHaveBeenCalledTimes(1);
}, 5000);

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
	vi.useFakeTimers();
	try {
		render(CorrectionWindow, {
			visible: false,
			visitDarts: sampleDarts,
			isBust: false,
			visitTotal: 180
		});

		vi.advanceTimersByTime(3000);
		expect(dispatchSpy).not.toHaveBeenCalled();
	} finally {
		vi.useRealTimers();
	}
});

test('clicking Fertig while paused dispatches CONFIRM_VISIT (CR-03 escape path)', async () => {
	const screen = render(CorrectionWindow, {
		visible: true,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	// Click Korrigieren to pause; use await + waitFor so Svelte's reactive DOM update settles
	const korrigierenBtn = screen.container.querySelector('.korrigieren-btn') as HTMLButtonElement;
	expect(korrigierenBtn).toBeTruthy();
	korrigierenBtn.click();

	// Paused: CONFIRM_VISIT should not have been dispatched yet
	expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });

	// Wait for Svelte to re-render the paused branch (Fertig button appears)
	let fertigBtn!: HTMLButtonElement;
	await vi.waitFor(() => {
		fertigBtn = screen.container.querySelector('.fertig-btn') as HTMLButtonElement;
		expect(fertigBtn).toBeTruthy();
	}, { timeout: 500 });

	expect(fertigBtn.textContent?.trim()).toBe('Fertig');

	// Click Fertig — should dispatch CONFIRM_VISIT
	fertigBtn.click();
	expect(dispatchSpy).toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });
});

test('clicking overlay backdrop while paused dispatches CONFIRM_VISIT (CR-03 outside-click escape)', async () => {
	const screen = render(CorrectionWindow, {
		visible: true,
		visitDarts: sampleDarts,
		isBust: false,
		visitTotal: 180
	});

	// Click Korrigieren to pause; wait for paused state to settle
	const korrigierenBtn = screen.container.querySelector('.korrigieren-btn') as HTMLButtonElement;
	expect(korrigierenBtn).toBeTruthy();
	korrigierenBtn.click();

	// Wait for Svelte to re-render the paused branch
	await vi.waitFor(() => {
		const fertigBtn = screen.container.querySelector('.fertig-btn');
		expect(fertigBtn).toBeTruthy();
	}, { timeout: 500 });

	// Paused: CONFIRM_VISIT should not have been dispatched yet
	expect(dispatchSpy).not.toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });

	// Click the overlay backdrop (the .overlay div itself, not the inner .window)
	const overlay = screen.container.querySelector('.overlay') as HTMLDivElement;
	expect(overlay).toBeTruthy();
	overlay.click();

	// Outside-click should dispatch CONFIRM_VISIT regardless of paused state
	expect(dispatchSpy).toHaveBeenCalledWith({ type: 'CONFIRM_VISIT' });
});
