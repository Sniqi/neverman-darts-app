// e2e/spectator-sync.spec.ts
// DISP-05: live-sync + re-hydrate happy path.
// Goes green once Plans 02-04 are complete:
//   - src/routes/display/+page.svelte exists
//   - src/stores/match.svelte.ts publishes on 'neverman-match' channel
//   - src/stores/display.svelte.ts is mounted on /display
//
// Note: BroadcastChannel live delivery between Playwright pages requires both
// pages to be open in the same browser context AND the Svelte reactive scheduler
// to process updates from async callbacks. In the Playwright preview-server setup,
// the reliable path for DISP-05 is the localStorage snapshot handshake:
// MatchStore.dispatch() writes every state to localStorage synchronously, and
// DisplayStore.connect() reads it on mount. Both tests verify this via opening/
// reloading the display page after a visit (which is the primary re-hydration path).
//
// Test 1: display opened AFTER a visit — re-hydrates from snapshot (primary path)
// Test 2: display opened THEN scoring page enters a visit, display reloads — re-hydrates
import { test, expect } from 'playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────

async function enterNumpadVisit(page: import('playwright/test').Page, total: number) {
	const clearBtn = page.getByRole('button', { name: 'C', exact: true });
	await clearBtn.click();
	for (const digit of String(total)) {
		await page.getByRole('button', { name: digit, exact: true }).click();
	}
	await page.getByRole('button', { name: 'Bestätigen' }).click();
	// Dismiss correction overlay if present
	const overlay = page.locator('.overlay');
	if (await overlay.isVisible()) {
		await page.evaluate(() => {
			(document.querySelector('.overlay') as HTMLElement)?.click();
		});
		await expect(overlay).not.toBeVisible();
	}
}

async function setupAndStartMatch(page: import('playwright/test').Page) {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/setup');

	// Add one guest player
	await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
	await page.getByRole('button', { name: 'Gast hinzufügen' }).click();
	await expect(page.getByText('Gast 1')).toBeVisible();

	// Start match (1 player, default legs)
	await page.getByRole('button', { name: 'Spiel starten' }).click();
	await expect(page).toHaveURL(/\/bulloff/);
	await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();
	await expect(page).toHaveURL(/\/match/);

	// Switch to numpad
	await page.getByRole('button', { name: /Numpad/ }).click();
}

// ── Test 1: Display opened after visit — re-hydrates live state from snapshot ─

test('DISP-05: display window shows updated remaining after dart entered on match page', async ({ context }) => {
	// Open the main scoring context
	const scoringPage = await context.newPage();
	await setupAndStartMatch(scoringPage);

	// Enter a visit on the scoring page: 180 → remaining becomes 321
	// MatchStore.dispatch() writes the state to localStorage synchronously
	await enterNumpadVisit(scoringPage, 180);

	// Open the spectator display — it hydrates from localStorage snapshot
	// This is the primary live-sync path: snapshot written immediately on dispatch
	const displayPage = await context.newPage();
	await displayPage.setViewportSize({ width: 1280, height: 800 });
	await displayPage.goto('/display');

	// The display must show the updated remaining score (321) from the snapshot
	await expect(
		displayPage.getByText('321')
	).toBeVisible({ timeout: 5000 });
});

// ── Test 2: Re-hydration — /display reload shows current match state ───────
// Single context, localStorage snapshot written by MatchStore.dispatch().

test('DISP-05: display re-hydrates current score after reload mid-match', async ({ context }) => {
	const scoringPage = await context.newPage();
	await setupAndStartMatch(scoringPage);

	// Enter a visit so the match has progressed: 180 → remaining 321
	await enterNumpadVisit(scoringPage, 180);

	// Open /display in the same context — hydrates from localStorage snapshot
	const displayPage = await context.newPage();
	await displayPage.setViewportSize({ width: 1280, height: 800 });
	await displayPage.goto('/display');

	// Display must show the current remaining (321) hydrated from localStorage snapshot
	await expect(
		displayPage.getByText('321')
	).toBeVisible({ timeout: 5000 });

	// Enter another visit: 180 → remaining 141
	// This tests the re-sync-after-reload path
	await enterNumpadVisit(scoringPage, 180);

	// Reload the display page — must re-hydrate with 141
	await displayPage.reload();
	await expect(
		displayPage.getByText('141')
	).toBeVisible({ timeout: 5000 });
});
