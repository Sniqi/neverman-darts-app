// src/ui/display/SpectatorChooser.test.ts
// Browser-mode component tests for SpectatorChooser (D-12, D-13, DISP-01, DISP-02).
// TDD RED: these tests must fail before SpectatorChooser.svelte is created.
// Covers:
//   1. Component is closed initially (menu not in DOM)
//   2. Clicking monitor icon opens menu with heading "Anzeigemodus"
//   3. Open menu shows both action buttons
//   4. "Zweites Fenster öffnen" calls window.open with /display and 'noopener,noreferrer'
//   5. When window.open returns null, popup-blocked message appears
//   6. Escape key closes the menu
//   7. Monitor icon has correct aria-label

import { render } from 'vitest-browser-svelte';
import { expect, test, vi, beforeEach, afterEach } from 'vitest';
import SpectatorChooser from './SpectatorChooser.svelte';

beforeEach(() => {
	vi.stubGlobal('open', vi.fn().mockReturnValue({ focus: vi.fn() }));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

test('component is closed initially — menu heading not in DOM', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	// Menu should not be in the DOM on initial render
	const heading = container.querySelector('h2, [role="heading"]');
	const headingText = container.textContent ?? '';
	expect(headingText).not.toContain('Anzeigemodus');
});

test('clicking monitor icon opens menu with heading "Anzeigemodus"', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	// Find and click the monitor icon button
	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]') as HTMLButtonElement;
	expect(iconBtn).toBeTruthy();
	iconBtn.click();

	// Menu heading should now be visible
	await vi.waitFor(() => {
		expect(container.textContent).toContain('Anzeigemodus');
	}, { timeout: 500 });
});

test('open menu shows two action buttons: "Zweites Fenster öffnen" and "Anzeige hier im Vollbild"', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]') as HTMLButtonElement;
	iconBtn.click();

	await vi.waitFor(() => {
		expect(container.textContent).toContain('Zweites Fenster öffnen');
		expect(container.textContent).toContain('Anzeige hier im Vollbild');
	}, { timeout: 500 });
});

test('"Zweites Fenster öffnen" calls window.open with /display URL and noopener,noreferrer', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]') as HTMLButtonElement;
	iconBtn.click();

	await vi.waitFor(() => {
		expect(container.textContent).toContain('Zweites Fenster öffnen');
	}, { timeout: 500 });

	// Find and click the second-window button
	const buttons = Array.from(container.querySelectorAll('button'));
	const secondWindowBtn = buttons.find(b => b.textContent?.includes('Zweites Fenster öffnen'));
	expect(secondWindowBtn).toBeTruthy();
	secondWindowBtn!.click();

	expect(window.open).toHaveBeenCalledWith(
		expect.stringContaining('display'),
		'_blank',
		'noopener,noreferrer'
	);
});

test('popup-blocked message appears when window.open returns null', async () => {
	// Stub window.open to return null (simulating popup block)
	vi.stubGlobal('open', vi.fn().mockReturnValue(null));

	const screen = render(SpectatorChooser);
	const container = screen.container;

	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]') as HTMLButtonElement;
	iconBtn.click();

	await vi.waitFor(() => {
		expect(container.textContent).toContain('Zweites Fenster öffnen');
	}, { timeout: 500 });

	const buttons = Array.from(container.querySelectorAll('button'));
	const secondWindowBtn = buttons.find(b => b.textContent?.includes('Zweites Fenster öffnen'));
	secondWindowBtn!.click();

	await vi.waitFor(() => {
		expect(container.textContent).toContain('Bitte Popups für diese Seite erlauben');
	}, { timeout: 500 });
});

test('pressing Escape closes the open menu', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]') as HTMLButtonElement;
	iconBtn.click();

	await vi.waitFor(() => {
		expect(container.textContent).toContain('Anzeigemodus');
	}, { timeout: 500 });

	// Press Escape
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

	await vi.waitFor(() => {
		// After Escape, the heading text should be gone
		const textAfter = container.textContent ?? '';
		expect(textAfter).not.toContain('Zweites Fenster öffnen');
	}, { timeout: 500 });
});

test('monitor icon button has aria-label "Anzeigemodus öffnen"', async () => {
	const screen = render(SpectatorChooser);
	const container = screen.container;

	const iconBtn = container.querySelector('[aria-label="Anzeigemodus öffnen"]');
	expect(iconBtn).toBeTruthy();
});
