// RED until Plan 03 + 04 complete — full match flow not yet wired.
// FLOW-01 happy path: setup → bull-off → match → leg win.
// This spec is the walking-skeleton RED baseline. It MUST run (no .skip)
// and MUST fail at assertion level because the real setup/bull-off/match
// UI does not exist yet. German copy per 01-UI-SPEC Copywriting Contract.
import { test, expect } from 'playwright/test';

test('full X01 match happy path: setup → bull-off → match → leg win', async ({ page }) => {
	// 1. Setup: add one player and start the game
	await page.goto('/setup');
	await page.getByRole('textbox').fill('Anna');
	await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
	await expect(page.getByText('Anna')).toBeVisible();
	await page.getByRole('button', { name: 'Spiel starten' }).click();

	// 2. Bull-off: confirm throwing order (single player → order is trivial)
	await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();

	// 3. Match: enter darts until the leg is won.
	// 501 Double Out: 8x T20 = 480, leaving 21 → S5 (16) → D8 (16... ) — for the
	// skeleton spec we just assert the target end state; the real dartboard
	// interaction selectors are defined by Plan 03.
	await expect(page).toHaveURL(/\/match/);

	// Throw 25 perfect T20 visits' worth of darts via the board (Plan 03 wires
	// the real segments; this locator will exist once the SVG board is built).
	const t20 = page.locator('[data-segment="T20"]');
	for (let i = 0; i < 8; i++) {
		await t20.click();
	}
	// Finish: S5 then D8 to take remaining 21 to 0 on a double
	await page.locator('[data-segment="S5"]').click();
	await page.locator('[data-segment="D8"]').click();

	// 4. Leg/match won: remaining shows 0 and the win overlay appears
	await expect(page.getByText('0', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: /gewinnt!/ })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Neues Spiel' })).toBeVisible();
});
