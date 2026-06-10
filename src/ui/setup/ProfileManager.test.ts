// ProfileManager.test.ts — browser project
// Tests: render, create a profile, assert list; open delete sheet, assert confirm/cancel.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { db } from '../../db/db';
import ProfileManager from './ProfileManager.svelte';

describe('ProfileManager component (browser)', () => {
	beforeEach(async () => {
		await db.profiles.clear();
	});

	it('renders the create input and add button', async () => {
		render(ProfileManager);
		await expect.element(page.getByPlaceholder('Neues Profil')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '+' })).toBeInTheDocument();
	});

	it('creates a profile and shows it in the list', async () => {
		render(ProfileManager);
		const input = page.getByPlaceholder('Neues Profil');
		await input.fill('Greta');
		await page.getByRole('button', { name: '+' }).click();
		await expect.element(page.getByText('Greta')).toBeVisible();
	});

	it('opens the delete bottom sheet with correct German strings', async () => {
		render(ProfileManager);
		// Create a profile first
		const input = page.getByPlaceholder('Neues Profil');
		await input.fill('Hans');
		await page.getByRole('button', { name: '+' }).click();
		await expect.element(page.getByText('Hans')).toBeVisible();

		// Tap the delete icon button (aria-label "Profil löschen")
		await page.getByRole('button', { name: 'Profil löschen' }).click();

		// Delete sheet should appear with required strings (T-04-01 acceptance criteria)
		await expect.element(page.getByText('Profil löschen?')).toBeVisible();
		await expect.element(
			page.getByText('Alle gespeicherten Daten für diesen Spieler gehen verloren.')
		).toBeVisible();
		// Sheet has a red Löschen CTA (data-testid="confirm-delete") and an Abbrechen cancel
		await expect.element(page.getByTestId('confirm-delete')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
	});

	it('Abbrechen closes the delete sheet without deleting', async () => {
		render(ProfileManager);
		const input = page.getByPlaceholder('Neues Profil');
		await input.fill('Ilse');
		await page.getByRole('button', { name: '+' }).click();
		await expect.element(page.getByText('Ilse')).toBeVisible();

		await page.getByRole('button', { name: 'Profil löschen' }).click();
		await expect.element(page.getByText('Profil löschen?')).toBeVisible();

		await page.getByRole('button', { name: 'Abbrechen' }).click();

		// Sheet dismissed, profile still present
		await expect.element(page.getByText('Profil löschen?')).not.toBeInTheDocument();
		await expect.element(page.getByText('Ilse')).toBeVisible();
	});
});
