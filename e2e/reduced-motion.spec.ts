// e2e/reduced-motion.spec.ts
// FOUND-04: proves the global prefers-reduced-motion collapse in
// src/styles/elevation.css actually overrides a component's own transition
// declaration end-to-end (Wave 0 gap — no prior automated coverage).
//
// Target: .toggle-arrow (profiles-menu chevron on the start hub,
// src/routes/+page.svelte) which declares `transition: transform 0.2s`.
// With reducedMotion emulated, the `*, *::before, *::after` !important
// collapse must force its computed transitionDuration to ~0.01ms.

import { test, expect } from 'playwright/test';

test.describe('FOUND-04: prefers-reduced-motion', () => {
	test('collapses .toggle-arrow transition duration to near-zero', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		const toggleArrow = page.locator('.toggle-arrow');
		await expect(toggleArrow).toBeVisible();

		const transitionDuration = await toggleArrow.evaluate(
			(el) => window.getComputedStyle(el).transitionDuration
		);

		// Duration may be formatted as e.g. "0.00001s" or "1e-5s" — parse
		// numerically rather than asserting an exact string match.
		const parsed = parseFloat(transitionDuration);
		expect(parsed).toBeLessThan(0.001);
	});
});
