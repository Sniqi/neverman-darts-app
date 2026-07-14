// COMP-02 coverage gap: /match's Caller and Musik switches had zero E2E coverage
// (per RESEARCH.md Wave 0 Gaps). This spec is isolated from full-match-flow.spec.ts
// on purpose -- it must not touch that spec's setup helper or assertions.
import { test, expect } from 'playwright/test';

test('match audio toggles: Caller and Musik switches flip aria-checked on click', async ({
	page
}) => {
	// Set viewport to tablet landscape for reliable layout
	await page.setViewportSize({ width: 1024, height: 768 });

	// 1. Setup: add one guest player and start the game
	await page.goto('/setup');

	// Add a guest player via the picker
	await page.getByRole('button', { name: 'Spieler hinzufügen' }).click();
	await page.getByRole('button', { name: 'Gast hinzufügen' }).click();
	await expect(page.getByText('Gast 1')).toBeVisible();

	// Pick a start score explicitly
	await page.getByRole('button', { name: '501', exact: true }).click();

	// "Spiel starten" should now be enabled
	await page.getByRole('button', { name: 'Spiel starten' }).click();

	// 2. Bull-off: confirm throwing order (single player -> trivial)
	await expect(page).toHaveURL(/\/bulloff/);
	await page.getByRole('button', { name: 'Spielreihenfolge bestätigen' }).click();

	// 3. Match: we should be on /match now
	await expect(page).toHaveURL(/\/match/);

	// Caller switch: assert visible, note initial state, click, assert flip
	const callerSwitch = page.getByRole('switch', { name: 'Caller' });
	await expect(callerSwitch).toBeVisible();
	const callerInitial = await callerSwitch.getAttribute('aria-checked');
	await callerSwitch.click();
	await expect(callerSwitch).toHaveAttribute(
		'aria-checked',
		callerInitial === 'true' ? 'false' : 'true'
	);

	// Musik switch: assert visible, note initial state, click, assert flip
	const musikSwitch = page.getByRole('switch', { name: 'Musik' });
	await expect(musikSwitch).toBeVisible();
	const musikInitial = await musikSwitch.getAttribute('aria-checked');
	await musikSwitch.click();
	await expect(musikSwitch).toHaveAttribute(
		'aria-checked',
		musikInitial === 'true' ? 'false' : 'true'
	);
});
