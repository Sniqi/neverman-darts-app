// src/ui/dialogs/ConfirmDialog.test.ts
// Browser-mode component test for ConfirmDialog (COMP-03, Plan 09-03 Task 3).
//
// Proves the DS ConfirmDialog spec's computed styles after the 09-03 restyle:
//   - .backdrop's computed backdrop-filter contains blur(12px)
//   - .dialog's computed border-radius is 20px and max-width is 420px
//   - the "Abbrechen" cancel button is present and accessible by role

import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import ConfirmDialog from './ConfirmDialog.svelte';
// Isolated component render has no root +layout.svelte, so :root DS tokens are
// otherwise absent from the document — import the global token stylesheet so
// var(--blur-backdrop)/var(--radius-lg)/etc. resolve to their real DS values
// (same pattern as ReloadPrompt.test.ts, Pitfall 4).
import '../../app.css';

test('ConfirmDialog backdrop has 12px blur and dialog panel has 20px radius / 420px max-width', async () => {
	const screen = render(ConfirmDialog, {
		heading: 'Titel',
		body: 'Text',
		ctaLabel: 'Löschen',
		ctaStyle: 'destructive',
		onconfirm: () => {},
		oncancel: () => {}
	});

	const backdrop = screen.container.querySelector('.backdrop') as HTMLElement;
	expect(backdrop).toBeTruthy();
	const backdropStyle = window.getComputedStyle(backdrop);
	expect(backdropStyle.backdropFilter).toContain('blur(12px)');

	const dialog = screen.container.querySelector('.dialog') as HTMLElement;
	expect(dialog).toBeTruthy();
	const dialogStyle = window.getComputedStyle(dialog);
	expect(dialogStyle.borderRadius).toBe('20px');
	expect(dialogStyle.maxWidth).toBe('420px');

	await expect.element(page.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
});
