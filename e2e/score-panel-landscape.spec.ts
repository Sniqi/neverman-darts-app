// SCOR-04 gap closure (10-VERIFICATION.md): removing ScorePanel.svelte's landscape-only
// font overrides (10-04, per RESEARCH.md Pitfall 4) caused the active player's 96px
// remaining score to be clipped by its own card with 3-4 players in landscape at
// 1024x768 (.score-panel scrollWidth 338px > clientWidth 324px in the 4-player case).
// This spec is isolated from full-match-flow.spec.ts / dart-notation.spec.ts on purpose,
// per the project's per-concern E2E convention.
import { test, expect } from 'playwright/test';
import type { Page } from 'playwright/test';

async function startMatchWithGuests(page: Page, guestCount: number) {
	await page.setViewportSize({ width: 1024, height: 768 });
	await page.goto('/setup');

	for (let i = 1; i <= guestCount; i++) {
		await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
		await page.getByRole('button', { name: 'Gast hinzufügen' }).click();
		await expect(page.getByText(`Gast ${i}`)).toBeVisible();
	}

	await page.getByRole('button', { name: '501', exact: true }).click();
	await page.getByRole('button', { name: 'Spiel starten' }).click();

	await expect(page).toHaveURL(/\/bulloff/);
	await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();
	await expect(page).toHaveURL(/\/match/);
}

for (const guestCount of [3, 4]) {
	test(`${guestCount}-player landscape score panel has no clipping/overflow`, async ({ page }) => {
		await startMatchWithGuests(page, guestCount);

		await expect(page.locator('.score-panel')).toBeVisible();
		await expect(page.locator('.remaining-active')).toHaveText('501');

		const overflow = await page.evaluate(() => {
			const panel = document.querySelector('.score-panel') as HTMLElement;
			const cards = Array.from(document.querySelectorAll('.player-card')) as HTMLElement[];
			return {
				panel: { scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth },
				cards: cards.map((c) => ({ scrollWidth: c.scrollWidth, clientWidth: c.clientWidth }))
			};
		});

		expect(overflow.panel.scrollWidth).toBeLessThanOrEqual(overflow.panel.clientWidth);
		for (const card of overflow.cards) {
			expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
		}

		const rects = await page.evaluate(() => {
			const score = document.querySelector('.remaining-active') as HTMLElement;
			const card = document.querySelector('.player-card.active') as HTMLElement;
			return {
				scoreRight: score.getBoundingClientRect().right,
				cardRight: card.getBoundingClientRect().right
			};
		});

		expect(rects.scoreRight).toBeLessThanOrEqual(rects.cardRight + 1);
	});
}
