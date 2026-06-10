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

	// Reduce legs to 1 so one leg win = match win
	await page.getByRole('button', { name: 'Legs verringern' }).click();
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

		// Wait for the correction window to either dismiss itself or dismiss it manually
		// by clicking outside (the correction window overlay dismisses on outside click)
		const overlay = page.locator('.overlay');
		if (await overlay.isVisible().catch(() => false)) {
			await overlay.click({ position: { x: 5, y: 5 } });
		}
		// Allow a small tick for state updates
		await page.waitForTimeout(100);
	}

	await enterNumpadVisit(180);
	await enterNumpadVisit(180);
	await enterNumpadVisit(125);

	// Final visit: 16 (D8 finish, double-out)
	const clearBtn = page.getByRole('button', { name: 'C', exact: true });
	await clearBtn.click();
	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: '6', exact: true }).click();
	await page.getByRole('button', { name: 'Bestätigen' }).click();

	// Dismiss the darts-at-double dialog (appears for numpad leg-winning visits)
	const dartsDialog = page.getByText('Wie viele Darts auf die Doppel?');
	if (await dartsDialog.isVisible().catch(() => false)) {
		await page.getByRole('button', { name: '1 Dart' }).click();
	}

	// 4. Leg/match won: win overlay appears with player name and Neues Spiel button
	await expect(page.getByRole('heading', { name: /gewinnt!/ })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Neues Spiel' })).toBeVisible();
});
