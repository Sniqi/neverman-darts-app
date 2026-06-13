// src/ui/pwa/ReloadPrompt.test.ts
// Browser-mode component tests for ReloadPrompt (PLAT-03 / PLAT-04).
//
// The test.alias in vite.config.ts redirects `virtual:pwa-register/svelte` to
// src/test-mocks/pwa-register-mock.ts. Because the mock exports module-level
// stores, the test and the component share the SAME needRefresh / offlineReady
// instances — set them before render to drive component state.
//
// Verifies:
//   1. With needRefresh=true, the toast renders with German "Neue Version verfügbar"
//   2. With needRefresh=true, "Aktualisieren" button is present and calls updateServiceWorker(true)
//   3. "Schließen" button hides the toast (sets stores to false)
//   4. With both stores false, the toast is NOT in the DOM
//   5. PLAT-04: rendered strings are German; toast has position:fixed + accent border

import { render } from 'vitest-browser-svelte';
import { expect, test, beforeEach } from 'vitest';
import { needRefresh, offlineReady, updateSWCalls } from '../../test-mocks/pwa-register-mock';
import ReloadPrompt from './ReloadPrompt.svelte';

// Reset stores and call-tracker before each test so tests are independent.
// vi.spyOn cannot redefine ESM exports in browser mode (namespace not configurable),
// so updateSWCalls is a module-level array the mock writes to — reset it here.
beforeEach(() => {
	needRefresh.set(false);
	offlineReady.set(false);
	updateSWCalls.splice(0);
});

test('with needRefresh=true the toast renders and contains German "Neue Version verfügbar"', async () => {
	needRefresh.set(true);
	const screen = render(ReloadPrompt, {});
	const toast = screen.container.querySelector('.pwa-toast');
	expect(toast).toBeTruthy();
	expect(screen.container.textContent).toContain('Neue Version verfügbar');
});

test('with needRefresh=true an "Aktualisieren" button is present', async () => {
	needRefresh.set(true);
	const screen = render(ReloadPrompt, {});
	const buttons = screen.container.querySelectorAll('button');
	const labels = Array.from(buttons).map((b) => b.textContent?.trim());
	expect(labels).toContain('Aktualisieren');
});

test('clicking "Aktualisieren" calls updateServiceWorker with true', async () => {
	// ESM modules are not configurable in browser mode — vi.spyOn cannot redefine
	// exports. Instead the mock tracks calls in the exported updateSWCalls array.
	needRefresh.set(true);
	const screen = render(ReloadPrompt, {});

	const buttons = screen.container.querySelectorAll('button');
	const aktualisierenBtn = Array.from(buttons).find(
		(b) => b.textContent?.trim() === 'Aktualisieren'
	) as HTMLButtonElement;
	expect(aktualisierenBtn).toBeTruthy();
	aktualisierenBtn.click();

	expect(updateSWCalls.length).toBe(1);
	expect(updateSWCalls[0]).toBe(true);
});

test('clicking "Schließen" hides the toast (stores set to false)', async () => {
	needRefresh.set(true);
	const screen = render(ReloadPrompt, {});
	expect(screen.container.querySelector('.pwa-toast')).toBeTruthy();

	const buttons = screen.container.querySelectorAll('button');
	const schliessenBtn = Array.from(buttons).find(
		(b) => b.textContent?.trim() === 'Schließen'
	) as HTMLButtonElement;
	expect(schliessenBtn).toBeTruthy();
	schliessenBtn.click();

	// After close(), both stores are false → toast should be removed from DOM
	await new Promise((r) => requestAnimationFrame(r));
	expect(screen.container.querySelector('.pwa-toast')).toBeFalsy();
});

test('with both stores false, the toast is NOT in the DOM', async () => {
	// stores already false from beforeEach
	const screen = render(ReloadPrompt, {});
	expect(screen.container.querySelector('.pwa-toast')).toBeFalsy();
});

test('PLAT-04: toast has position:fixed and accent (#e8a020) border color', async () => {
	needRefresh.set(true);
	const screen = render(ReloadPrompt, {});
	const toast = screen.container.querySelector('.pwa-toast') as HTMLElement;
	expect(toast).toBeTruthy();
	const style = window.getComputedStyle(toast);
	expect(style.position).toBe('fixed');
	// Border color rendered as rgb(232, 160, 32) == #e8a020
	expect(style.borderColor).toMatch(/rgb\(232,\s*160,\s*32\)/);
});
