// src/ui/input/Dartboard.test.ts
// Browser-mode component test for Dartboard hit-detection.
// Uses vitest-browser-svelte to mount the component in real Chromium.
// Verifies that polar-math dispatch fires the correct DartScore for
// center (inner bull), triple-20, and miss-zone taps.

import { render } from 'vitest-browser-svelte';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import Dartboard from './Dartboard.svelte';
import { matchStore } from '../../stores/match.svelte.js';

// Spy on matchStore.dispatch to capture dispatched actions
let dispatchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	dispatchSpy = vi.spyOn(matchStore, 'dispatch');
});

afterEach(() => {
	dispatchSpy.mockRestore();
});

test('center tap dispatches inner bull {multiplier:2, segment:50}', async () => {
	const screen = render(Dartboard);

	// The SVG element
	const svg = screen.container.querySelector('svg')!;
	expect(svg).toBeTruthy();

	// Get the SVG bounding rect to calculate center
	const rect = svg.getBoundingClientRect();
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	// Fire a pointerdown at the center
	svg.dispatchEvent(
		new PointerEvent('pointerdown', {
			clientX: centerX,
			clientY: centerY,
			bubbles: true,
			cancelable: true,
			pointerId: 1
		})
	);

	expect(dispatchSpy).toHaveBeenCalledTimes(1);
	const action = dispatchSpy.mock.calls[0][0];
	expect(action.type).toBe('DART_THROWN');
	if (action.type === 'DART_THROWN') {
		expect(action.dart.segment).toBe(50);
		expect(action.dart.multiplier).toBe(2);
	}
});

test('miss-zone tap dispatches segment 0', async () => {
	const screen = render(Dartboard);

	const svg = screen.container.querySelector('svg')!;
	const rect = svg.getBoundingClientRect();

	// Tap near the right edge (well outside double ring when rendered).
	// viewBox="0 0 400 400": center=(200,200), double ring ends at r=325.
	// Miss zone starts at r=325. In the rendered element, the SVG maps
	// the 400×400 viewBox onto rect.width × rect.height pixels.
	// To reach r=340 (safely in miss zone): screen offset = (340/200) * (rect.width/2).
	// This exceeds the half-width, so we clamp to just inside the SVG element edge.
	// Use r=350 offset clamped: target near the SVG boundary but still within element.
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;
	// In SVG space r=350 is miss zone (>325). Map to screen:
	// scale = rect.width / 400  (since viewBox width = 400)
	const scale = rect.width / 400;
	const missX = centerX + 350 * scale;
	const missY = centerY;

	svg.dispatchEvent(
		new PointerEvent('pointerdown', {
			clientX: missX,
			clientY: missY,
			bubbles: true,
			cancelable: true,
			pointerId: 1
		})
	);

	expect(dispatchSpy).toHaveBeenCalledTimes(1);
	const action = dispatchSpy.mock.calls[0][0];
	expect(action.type).toBe('DART_THROWN');
	if (action.type === 'DART_THROWN') {
		expect(action.dart.segment).toBe(0);
	}
});

test('triple-20 tap dispatches {multiplier:3, segment:20}', async () => {
	const screen = render(Dartboard);

	const svg = screen.container.querySelector('svg')!;
	const rect = svg.getBoundingClientRect();

	// Segment 20 is centered at top (270° in SVG coords = 12 o'clock).
	// Triple ring: r=186–209 in viewBox space. Use r=197 (midpoint), angle=270° (straight up).
	// In screen space: directly above center, at ~(197/400)*renderedWidth from center.
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;
	const tripleRadius = (rect.width / 400) * 197.5; // midpoint of triple ring (186-209)
	// 270° in standard math = straight up (negative Y direction in screen)
	const tripleX = centerX;
	const tripleY = centerY - tripleRadius;

	svg.dispatchEvent(
		new PointerEvent('pointerdown', {
			clientX: tripleX,
			clientY: tripleY,
			bubbles: true,
			cancelable: true,
			pointerId: 1
		})
	);

	expect(dispatchSpy).toHaveBeenCalledTimes(1);
	const action = dispatchSpy.mock.calls[0][0];
	expect(action.type).toBe('DART_THROWN');
	if (action.type === 'DART_THROWN') {
		expect(action.dart.multiplier).toBe(3);
		expect(action.dart.segment).toBe(20);
	}
});
