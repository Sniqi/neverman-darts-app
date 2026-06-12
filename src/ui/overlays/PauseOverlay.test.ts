// src/ui/overlays/PauseOverlay.test.ts
// Browser-mode component tests for PauseOverlay (FLOW-02).
// Tests written BEFORE implementation (TDD RED phase).
//
// Verifies:
//   1. With pauseActive=false the overlay is NOT in the DOM
//   2. With pauseActive=true the overlay renders with role=dialog and position:fixed
//   3. Countdown displays correct MM:SS format at multiple values
//   4. "Weiter" button present when showResume=true (default)
//   5. "Weiter" button absent when showResume=false
//   6. Clicking "Weiter" calls the onresume callback

import { render } from 'vitest-browser-svelte';
import { expect, test, vi } from 'vitest';
import PauseOverlay from './PauseOverlay.svelte';

test('with pauseActive=false the overlay is NOT rendered in the DOM', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: false,
		remainingSeconds: 480,
	});
	const overlay = screen.container.querySelector('.pause-overlay');
	expect(overlay).toBeFalsy();
});

test('with pauseActive=true the overlay IS rendered with role=dialog', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 480,
	});
	const overlay = screen.container.querySelector('[role="dialog"]');
	expect(overlay).toBeTruthy();
});

test('overlay has position:fixed when pauseActive=true', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 480,
	});
	const overlay = screen.container.querySelector('.pause-overlay') as HTMLElement;
	expect(overlay).toBeTruthy();
	const style = window.getComputedStyle(overlay);
	expect(style.position).toBe('fixed');
});

test('remainingSeconds=480 displays "08:00"', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 480,
	});
	expect(screen.container.textContent).toContain('08:00');
});

test('remainingSeconds=5 displays "00:05"', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 5,
	});
	expect(screen.container.textContent).toContain('00:05');
});

test('remainingSeconds=272 displays "04:32"', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 272,
	});
	expect(screen.container.textContent).toContain('04:32');
});

test('"Weiter" button is present when showResume is omitted (defaults true)', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 100,
	});
	const btn = screen.container.querySelector('button');
	expect(btn).toBeTruthy();
	expect(btn!.textContent).toContain('Weiter');
});

test('"Weiter" button is present when showResume=true', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 100,
		showResume: true,
	});
	const btn = screen.container.querySelector('button');
	expect(btn).toBeTruthy();
	expect(btn!.textContent).toContain('Weiter');
});

test('"Weiter" button is NOT rendered when showResume=false', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 100,
		showResume: false,
	});
	const btn = screen.container.querySelector('button');
	expect(btn).toBeFalsy();
});

test('clicking "Weiter" calls the onresume callback', async () => {
	const onresume = vi.fn();
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 100,
		showResume: true,
		onresume,
	});
	const btn = screen.container.querySelector('button') as HTMLButtonElement;
	expect(btn).toBeTruthy();
	btn.click();
	expect(onresume).toHaveBeenCalledTimes(1);
});

test('German heading "Pause" and subtitle "Nächste Leg in Kürze" are rendered', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 60,
	});
	expect(screen.container.textContent).toContain('Pause');
	expect(screen.container.textContent).toContain('Nächste Leg in Kürze');
});
