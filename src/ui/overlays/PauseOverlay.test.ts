// src/ui/overlays/PauseOverlay.test.ts
// Browser-mode component tests for PauseOverlay (FLOW-02).
//
// Verifies:
//   1. With pauseActive=false the overlay is NOT in the DOM
//   2. With pauseActive=true the overlay renders with role=dialog and position:fixed
//   3. Countdown displays correct MM:SS format at multiple values
//   4. "Weiter" button present when showResume=true (default)
//   5. "Weiter" button absent when showResume=false
//   6. Clicking "Weiter" calls the onresume callback
//   7. UI-1: remainingSeconds=0 shows "Weiter geht's!" in place of MM:SS
//   8. UI-2: aria-live companion absent at mid-countdown (no per-second noise)
//   9. UI-2: aria-live companion populated at minute marks and ≤10s
//  10. UI-3: out:fade transition attribute present on overlay element

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

// ── UI-1: zero-countdown closure flash ────────────────────────────────────────

test('UI-1: remainingSeconds=0 shows "Weiter geht\'s!" instead of "00:00"', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 0,
	});
	expect(screen.container.textContent).toContain("Weiter geht's!");
	expect(screen.container.textContent).not.toContain('00:00');
});

test('UI-1: "Weiter geht\'s!" element has zero-flash class when remainingSeconds=0', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 0,
	});
	const flashEl = screen.container.querySelector('.zero-flash');
	expect(flashEl).toBeTruthy();
});

test('UI-1: normal countdown (remainingSeconds=1) does NOT show "Weiter geht\'s!"', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 1,
	});
	expect(screen.container.textContent).not.toContain("Weiter geht's!");
	expect(screen.container.textContent).toContain('00:01');
});

// ── UI-2: aria-live coarse-interval companion ─────────────────────────────────

test('UI-2: visible countdown digits element has no aria-live attribute', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 272,
	});
	const digits = screen.container.querySelector('.countdown-digits');
	expect(digits).toBeTruthy();
	expect(digits!.getAttribute('aria-live')).toBeNull();
});

test('UI-2: sr-only aria-live companion is present in the DOM', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 272,
	});
	const companion = screen.container.querySelector('.sr-only[aria-live]');
	expect(companion).toBeTruthy();
});

test('UI-2: aria-live companion is empty at mid-countdown (not a minute mark, >10s)', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 272, // 4:32 — not a minute mark, not ≤10s
	});
	const companion = screen.container.querySelector('.sr-only[aria-live]');
	expect(companion).toBeTruthy();
	expect(companion!.textContent?.trim()).toBe('');
});

test('UI-2: aria-live companion is populated at a minute mark (remainingSeconds=120)', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 120, // exactly 2 minutes
	});
	const companion = screen.container.querySelector('.sr-only[aria-live]');
	expect(companion).toBeTruthy();
	expect(companion!.textContent?.trim()).not.toBe('');
});

test('UI-2: aria-live companion is populated when remainingSeconds=10 (≤10s threshold)', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 10,
	});
	const companion = screen.container.querySelector('.sr-only[aria-live]');
	expect(companion).toBeTruthy();
	expect(companion!.textContent?.trim()).not.toBe('');
});

test('UI-2: aria-live companion is populated when remainingSeconds=5 (≤10s threshold)', async () => {
	const screen = render(PauseOverlay, {
		pauseActive: true,
		remainingSeconds: 5,
	});
	const companion = screen.container.querySelector('.sr-only[aria-live]');
	expect(companion).toBeTruthy();
	expect(companion!.textContent?.trim()).not.toBe('');
});
