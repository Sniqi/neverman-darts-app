// e2e/resume.spec.ts
// FLOW-03 end-to-end: crash-resume vertical slice.
// Verifies that a mid-match reload surfaces the resume prompt, Fortsetzen
// restores the exact remaining score at /match, and Verwerfen permanently
// clears the unfinished match.
//
// Match is driven via numpad (not SVG segments) — headless hit-detection
// caveat per STATE.md decision [Phase 01-04].
// Overlay dismissed via page.evaluate DOM click — Playwright pointer click
// intercepted by .panel-area in headless mode.

import { test, expect } from 'playwright/test';

const SNAPSHOT_KEY = 'neverman-match-snapshot';

// Helper: enter a numpad visit total and dismiss the correction overlay
async function enterNumpadVisit(page: import('playwright').Page, total: number) {
	const clearBtn = page.getByRole('button', { name: 'C', exact: true });
	await clearBtn.click();

	for (const digit of String(total)) {
		await page.getByRole('button', { name: digit, exact: true }).click();
	}
	await page.getByRole('button', { name: 'Bestätigen' }).click();

	// Dismiss correction overlay via DOM click (Playwright pointer intercepted by panel-area)
	const overlay = page.locator('.overlay');
	await expect(overlay).toBeVisible();
	await page.evaluate(() => {
		(document.querySelector('.overlay') as HTMLElement)?.click();
	});
	await expect(overlay).not.toBeVisible();
}

test.describe('FLOW-03: crash-resume', () => {
	test('Fortsetzen restores exact remaining score at /match', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });

		// ── Step 1: Set up and start a match ────────────────────────────────────
		await page.goto('/setup');

		await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
		await page.getByRole('button', { name: 'Gast hinzufügen' }).click();
		await expect(page.getByText('Gast 1')).toBeVisible();

		// Reduce legs to 1 so the match doesn't end after one leg win
		// (but we won't finish — just enter a visit)
		await page.getByRole('button', { name: 'Spiel starten' }).click();

		await expect(page).toHaveURL(/\/bulloff/);
		await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();

		await expect(page).toHaveURL(/\/match/);

		// ── Step 2: Switch to numpad and enter one visit ─────────────────────────
		await page.getByRole('button', { name: /Numpad/ }).click();

		// Enter 180 (T20 T20 T20) → remaining should be 321
		await enterNumpadVisit(page, 180);

		// Read the remaining score from the score panel before reload
		// The player panel shows remaining score — locate it
		// The match page shows remaining prominently; we look for "321"
		await expect(page.getByText('321')).toBeVisible();

		// ── Step 3: Reload to start screen ──────────────────────────────────────
		await page.goto('/');

		// Resume prompt should appear
		await expect(page.getByText('Laufendes Spiel fortsetzen?')).toBeVisible();

		// ── Step 4: Click Fortsetzen and verify restoration ──────────────────────
		await page.getByRole('button', { name: 'Fortsetzen' }).click();

		await expect(page).toHaveURL(/\/match/);

		// Remaining score should still be 321
		await expect(page.getByText('321')).toBeVisible();
	});

	test('Verwerfen permanently clears the unfinished match', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });

		// ── Step 1: Create an unfinished match ──────────────────────────────────
		await page.goto('/setup');

		await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
		await page.getByRole('button', { name: 'Gast hinzufügen' }).click();

		await page.getByRole('button', { name: 'Spiel starten' }).click();
		await expect(page).toHaveURL(/\/bulloff/);
		await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();
		await expect(page).toHaveURL(/\/match/);

		// Switch to numpad, enter one visit to get a playing snapshot
		await page.getByRole('button', { name: /Numpad/ }).click();
		await enterNumpadVisit(page, 180);

		// ── Step 2: Reload to start screen — resume prompt visible ──────────────
		await page.goto('/');
		await expect(page.getByText('Laufendes Spiel fortsetzen?')).toBeVisible();

		// ── Step 3: Click Verwerfen — prompt disappears ──────────────────────────
		await page.getByRole('button', { name: 'Verwerfen' }).click();
		await expect(page.getByText('Laufendes Spiel fortsetzen?')).not.toBeVisible();

		// ── Step 4: Reload again — no resume prompt ──────────────────────────────
		await page.goto('/');
		await expect(page.getByText('Laufendes Spiel fortsetzen?')).not.toBeVisible();

		// Verify localStorage key was cleared
		const snapshot = await page.evaluate((key) => localStorage.getItem(key), SNAPSHOT_KEY);
		expect(snapshot).toBeNull();
	});
});
