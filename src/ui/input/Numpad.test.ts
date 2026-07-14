// src/ui/input/Numpad.test.ts
// Browser-mode component tests for Numpad (SCOR-01).
//
// Verifies:
//   1. .input-display computed height/font-size/font-weight/background match DS spec
//   2. .digit-key computed height/font-size/font-weight match DS spec
//   3. .clear-key computed font-size/font-weight match DS spec
//   4. .backspace-key has the aria-label deferred from Phase 8
//   5. .confirm-key computed height/font-size/font-weight + gradient background match DS spec
//   6. Invalid total (179) shows .error-msg at DS font-size and does not call onconfirm

import { render } from 'vitest-browser-svelte';
import { expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import Numpad from './Numpad.svelte';
// No root +layout.svelte renders in isolation here, so the DS :root tokens
// are otherwise absent from the document — import the global token
// stylesheet so var(--key-h)/var(--text-3xl)/etc. resolve to real values
// (08-03 pattern, see ReloadPrompt.test.ts / StatCard.test.ts).
import '../../app.css';

test('.input-display computed height/font-size/font-weight/background match DS spec', async () => {
	const screen = render(Numpad, { onconfirm: vi.fn() });
	const el = screen.container.querySelector('.input-display') as HTMLElement;
	expect(el).toBeTruthy();
	const style = getComputedStyle(el);
	expect(style.height).toBe('76px');
	expect(style.fontSize).toBe('40px');
	expect(style.fontWeight).toBe('700');
	expect(style.backgroundColor).toBe('rgb(7, 8, 12)');
});

test('.digit-key computed height/font-size/font-weight match DS spec', async () => {
	const screen = render(Numpad, { onconfirm: vi.fn() });
	const el = screen.container.querySelector('.digit-key') as HTMLElement;
	expect(el).toBeTruthy();
	const style = getComputedStyle(el);
	expect(style.height).toBe('76px');
	expect(style.fontSize).toBe('32px');
	expect(style.fontWeight).toBe('500');
});

test('.clear-key computed font-size/font-weight match DS spec', async () => {
	const screen = render(Numpad, { onconfirm: vi.fn() });
	const el = screen.container.querySelector('.clear-key') as HTMLElement;
	expect(el).toBeTruthy();
	const style = getComputedStyle(el);
	expect(style.fontSize).toBe('26px');
	expect(style.fontWeight).toBe('600');
});

test('.backspace-key has aria-label "Letzte Ziffer löschen"', async () => {
	const screen = render(Numpad, { onconfirm: vi.fn() });
	const el = screen.container.querySelector('.backspace-key') as HTMLElement;
	expect(el).toBeTruthy();
	expect(el.getAttribute('aria-label')).toBe('Letzte Ziffer löschen');
});

test('.confirm-key computed height/font-size/font-weight/backgroundImage match DS spec', async () => {
	const screen = render(Numpad, { onconfirm: vi.fn() });
	const el = screen.container.querySelector('.confirm-key') as HTMLElement;
	expect(el).toBeTruthy();
	const style = getComputedStyle(el);
	expect(style.height).toBe('76px');
	expect(style.fontSize).toBe('22px');
	expect(style.fontWeight).toBe('700');
	expect(style.backgroundImage).toContain('linear-gradient');
});

test('entering the impossible total 179 shows .error-msg at 15px and does not call onconfirm', async () => {
	const onconfirm = vi.fn();
	render(Numpad, { onconfirm });

	await page.getByRole('button', { name: '1', exact: true }).click();
	await page.getByRole('button', { name: '7', exact: true }).click();
	await page.getByRole('button', { name: '9', exact: true }).click();
	await page.getByRole('button', { name: 'Bestätigen', exact: true }).click();

	const errorEl = document.body.querySelector('.error-msg') as HTMLElement;
	expect(errorEl).toBeTruthy();
	const style = getComputedStyle(errorEl);
	expect(style.fontSize).toBe('15px');
	expect(onconfirm).not.toHaveBeenCalled();
});
