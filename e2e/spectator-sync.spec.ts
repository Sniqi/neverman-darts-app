// e2e/spectator-sync.spec.ts
// FAILING BASELINE — intentionally red until Plan 02 ships /display route
// and the BroadcastChannel publisher in MatchStore.
//
// This spec describes the DISP-05 live-sync + re-hydrate happy path.
// It will go green once:
//   - src/routes/display/+page.svelte exists
//   - src/stores/match.svelte.ts publishes on 'neverman-match' channel
//   - src/stores/display.svelte.ts is mounted on /display
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

// ── Test 1: Live sync — dart entered on /match appears on /display ─────────

test('DISP-05: display window shows updated remaining after dart entered on match page', async ({ browser }) => {
	// Open the main scoring context
	const scoringContext = await browser.newContext();
	const scoringPage = await scoringContext.newPage();
	await setupAndStartMatch(scoringPage);

	// Open the spectator display in a second page (same browser context for shared localStorage)
	const displayContext = await browser.newContext();
	const displayPage = await displayContext.newPage();
	await displayPage.setViewportSize({ width: 1280, height: 800 });
	await displayPage.goto('/display');

	// The /display route must render — currently fails because the route doesn't exist
	// After Plan 02: expect the idle screen or live state
	await expect(displayPage.locator('body')).toBeVisible();

	// Enter a visit on the scoring page: 180 → remaining becomes 321
	await enterNumpadVisit(scoringPage, 180);

	// The display should show the updated remaining score (321)
	// This assertion drives Plan 02 implementation of DISP-05
	await expect(
		displayPage.getByText('321')
	).toBeVisible({ timeout: 5000 });

	await scoringContext.close();
	await displayContext.close();
});

// ── Test 2: Re-hydration — /display reload shows current match state ───────

test('DISP-05: display re-hydrates current score after reload mid-match', async ({ browser }) => {
	// Single context for shared localStorage
	const ctx = await browser.newContext();
	const scoringPage = await ctx.newPage();
	await setupAndStartMatch(scoringPage);

	// Enter a visit so the match has progressed: 180 → remaining 321
	await enterNumpadVisit(scoringPage, 180);

	// Open and then reload /display — it should hydrate from localStorage snapshot
	const displayPage = await ctx.newPage();
	await displayPage.setViewportSize({ width: 1280, height: 800 });
	await displayPage.goto('/display');

	// After reload, the display must show the current remaining (321) hydrated
	// from the localStorage snapshot written by MatchStore.dispatch()
	// This assertion drives the hydration path in DisplayStore.connect()
	await expect(
		displayPage.getByText('321')
	).toBeVisible({ timeout: 5000 });

	await ctx.close();
});
