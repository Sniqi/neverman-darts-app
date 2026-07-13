// FLOW-01 happy path: setup → bull-off → match → leg win.
// Turned GREEN by Plan 04 (MatchSetup + BullOffOrder + START_MATCH wiring).
import { test, expect } from 'playwright/test';

test('full X01 match happy path: setup → bull-off → match → leg win', async ({ page }) => {
	// Set viewport to tablet landscape for reliable layout
	await page.setViewportSize({ width: 1024, height: 768 });

	// 1. Setup: add one guest player and start the game
	await page.goto('/setup');

	// Add a guest player via the picker
	await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
	await page.getByRole('button', { name: 'Gast hinzufügen' }).click();
	await expect(page.getByText('Gast 1')).toBeVisible();

	// Setup defaults changed since June quick tasks (commit b9e4ef4): default mode is
	// now 301/Single Out. This test exercises the 501 Double-Out checkout flow, so
	// select it explicitly instead of relying on defaults.
	await page.getByRole('button', { name: '501', exact: true }).click();
	await page.getByRole('button', { name: 'Double Out' }).click();

	// Same commit also flipped "Sets" on by default (setsEnabled=true, setsToWin=2),
	// which would make legsToWin apply per-set (so a single leg win would only
	// close the first set, not the match). Turn it off so legs apply to the whole
	// match again, matching this test's original single-leg-match intent.
	await page.getByRole('switch', { name: 'Sets' }).click();

	// Default legs is now 2 (since quick task 260614-q02) with a minimum of 1 —
	// reduce legs to 1 (one click) so one leg win = match win.
	await page.getByRole('button', { name: 'Legs verringern' }).click();

	// "Spiel starten" should now be enabled
	await page.getByRole('button', { name: 'Spiel starten' }).click();

	// 2. Bull-off: confirm throwing order (single player → trivial)
	await expect(page).toHaveURL(/\/bulloff/);
	await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();

	// 3. Match: we should be on /match now
	await expect(page).toHaveURL(/\/match/);

	// Switch to numpad mode for reliable input (avoids SVG hit-detection in E2E)
	await page.getByRole('button', { name: /Numpad/ }).click();

	// Throw 501 Double Out via numpad:
	// Visit 1: 180 (T20 T20 T20) → remaining 321
	// Visit 2: 180                → remaining 141
	// Visit 3: 125                → remaining 16
	// Visit 4: 16 (D8)            → remaining 0, leg won

	// Visits commit immediately on "Bestätigen" — the correction-window overlay
	// was replaced by the dart-pill undo strip (commit 5be44aa, June quick tasks).
	async function enterNumpadVisit(total: number) {
		// Clear any existing input first (exact match to avoid matching undo button aria-label)
		const clearBtn = page.getByRole('button', { name: 'C', exact: true });
		await clearBtn.click();

		// Type digits
		for (const digit of String(total)) {
			if (digit === '1') await page.getByRole('button', { name: '1', exact: true }).click();
			else if (digit === '2') await page.getByRole('button', { name: '2', exact: true }).click();
			else if (digit === '3') await page.getByRole('button', { name: '3', exact: true }).click();
			else if (digit === '4') await page.getByRole('button', { name: '4', exact: true }).click();
			else if (digit === '5') await page.getByRole('button', { name: '5', exact: true }).click();
			else if (digit === '6') await page.getByRole('button', { name: '6', exact: true }).click();
			else if (digit === '7') await page.getByRole('button', { name: '7', exact: true }).click();
			else if (digit === '8') await page.getByRole('button', { name: '8', exact: true }).click();
			else if (digit === '9') await page.getByRole('button', { name: '9', exact: true }).click();
			else if (digit === '0') await page.getByRole('button', { name: '0', exact: true }).click();
		}
		// Confirm
		await page.getByRole('button', { name: 'Bestätigen' }).click();
	}

	// First visit: assert the remaining score updates immediately (regression guard
	// for the visit-commit flow, replacing the old correction-window lifecycle guard).
	await enterNumpadVisit(180);
	await expect(page.getByText('321')).toBeVisible();
	await enterNumpadVisit(180);
	await expect(page.getByText('141')).toBeVisible();
	await enterNumpadVisit(125);
	await expect(page.getByText('16', { exact: true })).toBeVisible();

	// Final visit: 16 (D8 finish, double-out)
	const clearBtn = page.getByRole('button', { name: 'C', exact: true });
	await clearBtn.click();
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: '6', exact: true }).click();
	await page.getByRole('button', { name: 'Bestätigen' }).click();

	// The darts-at-double dialog is suppressed for match-winning visits (win overlay takes over).
	// In a multi-leg scenario (more legs remaining) it would appear — covered by unit tests (INP-03).

	// 4. Leg/match won: win overlay appears with player name and Neues Spiel button
	await expect(page.getByRole('heading', { name: /gewinnt!/ })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Neues Spiel' })).toBeVisible();
});
