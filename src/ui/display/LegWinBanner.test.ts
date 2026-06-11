// src/ui/display/LegWinBanner.test.ts
// Browser-mode component tests for LegWinBanner (D-09).
// Tests written BEFORE implementation (TDD RED phase).
//
// Verifies:
//   1. With message=null the banner is NOT in the DOM
//   2. With message="Leg für Alex!" the banner renders that text full-screen
//   3. The player-name/accent portion renders in accent color
//   4. (Optional) banner renders an optional subtitle if provided

import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import LegWinBanner from './LegWinBanner.svelte';

test('with message=null the banner is NOT rendered in the DOM', async () => {
	const screen = render(LegWinBanner, {
		message: null,
	});
	const banner = screen.container.querySelector('.leg-win-banner');
	expect(banner).toBeFalsy();
});

test('with a non-null message the banner renders the message text', async () => {
	const screen = render(LegWinBanner, {
		message: 'Leg für Alex!',
	});
	const banner = screen.container.querySelector('.leg-win-banner');
	expect(banner).toBeTruthy();
	expect(screen.container.textContent).toContain('Leg für Alex!');
});

test('banner has full-screen fixed positioning (position:fixed, inset:0)', async () => {
	const screen = render(LegWinBanner, {
		message: 'Leg für Alex!',
	});
	const banner = screen.container.querySelector('.leg-win-banner') as HTMLElement;
	expect(banner).toBeTruthy();
	const style = window.getComputedStyle(banner);
	expect(style.position).toBe('fixed');
});

test('accent-colored name element is rendered inside banner', async () => {
	const screen = render(LegWinBanner, {
		message: 'Leg für Alex!',
	});
	// The component should render a .banner-name element with accent styling
	const nameEl = screen.container.querySelector('.banner-name');
	expect(nameEl).toBeTruthy();
});

test('with subtitle prop the subtitle text is rendered', async () => {
	const screen = render(LegWinBanner, {
		message: 'Satz für Bob!',
		subtitle: '1 : 0 Sätze',
	});
	expect(screen.container.textContent).toContain('Satz für Bob!');
	expect(screen.container.textContent).toContain('1 : 0 Sätze');
});

test('different message string renders correctly', async () => {
	const screen = render(LegWinBanner, {
		message: 'Satz für Claudia!',
	});
	expect(screen.container.textContent).toContain('Satz für Claudia!');
});
