// SCOR-03 coverage gap: the live /match dart-pill strip's board-tap-driven notation had
// zero E2E coverage (per RESEARCH.md Wave 0 Gaps). This spec is isolated from
// full-match-flow.spec.ts on purpose -- it must not touch that spec's helpers or assertions.
import { test, expect } from 'playwright/test';

test('dartboard taps render correct notation in the live dart-pill strip', async ({ page }) => {
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

	// 3. Match: we should be on /match now, default inputMode is 'board' so the
	// Dartboard SVG is already visible -- numpad-entered visits never populate
	// individual per-dart notation (numpad visits store darts: []), so this spec
	// must use the dartboard.
	await expect(page).toHaveURL(/\/match/);

	const svg = page.locator('svg.dartboard');
	await expect(svg).toBeVisible();
	const box = await svg.boundingBox();
	if (!box) throw new Error('dartboard bounding box not found');
	const centerX = box.x + box.width / 2;
	const centerY = box.y + box.height / 2;
	const scale = box.width / 800; // viewBox is 800 units wide

	// Tap 1: dead center -> inner bull {multiplier:2, segment:25} -> "Bull (50)"
	await page.mouse.click(centerX, centerY);
	await expect(page.getByRole('button', { name: 'Rückgängig: Bull (50)' })).toBeVisible();

	// Tap 2 (same visit): straight up at r=175 (triple-ring midpoint, per Dartboard.test.ts's
	// own proven math) -> triple-20 {multiplier:3, segment:20} -> "T20"
	await page.mouse.click(centerX, centerY - 175 * scale);
	await expect(page.getByRole('button', { name: 'Rückgängig: T20' })).toBeVisible();
});
