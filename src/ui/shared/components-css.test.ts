// src/ui/shared/components-css.test.ts
// Browser-mode computed-style proof for the shared .btn/.switch classes
// (src/styles/components.css, Phase 9 COMP-01/COMP-02).
//
// This is plain CSS, not a Svelte component, but this location is the only
// one matching the `browser` Vitest project's `include: ['src/ui/**/*.test.ts']`
// glob in vite.config.ts.
//
// Per the established Phase 8 pattern (ReloadPrompt.test.ts), no root
// +layout.svelte is rendered here, so :root tokens are otherwise absent from
// the isolated test document — import app.css so var(--token) resolves.
import '../../app.css';

import { expect, test } from 'vitest';

function makeEl(tag: string, className: string): HTMLElement {
	const el = document.createElement(tag);
	el.className = className;
	document.body.appendChild(el);
	return el;
}

test('components-css: .btn.btn--menu computed height is 64px', () => {
	const el = makeEl('button', 'btn btn--menu');
	const style = getComputedStyle(el);
	expect(style.height).toBe('64px');
	el.remove();
});

test('components-css: .btn.btn--accent computed height is 64px and background is a gradient', () => {
	const el = makeEl('button', 'btn btn--accent');
	const style = getComputedStyle(el);
	expect(style.height).toBe('64px');
	expect(style.backgroundImage).toContain('linear-gradient');
	el.remove();
});

test('components-css: .btn.btn--cta computed minHeight/fontSize/fontWeight match DS spec', () => {
	const el = makeEl('button', 'btn btn--cta');
	const style = getComputedStyle(el);
	expect(style.minHeight).toBe('64px');
	expect(style.fontSize).toBe('22px');
	expect(style.fontWeight).toBe('700');
	el.remove();
});

test('components-css: .switch computed width/height/borderRadius match DS spec', () => {
	const el = makeEl('button', 'switch');
	const style = getComputedStyle(el);
	expect(style.width).toBe('56px');
	expect(style.height).toBe('34px');
	expect(style.borderRadius).toBe('999px');
	el.remove();
});

test('components-css: .btn.btn--ghost.btn--icon computed width/height are 48px', () => {
	const el = makeEl('button', 'btn btn--ghost btn--icon');
	const style = getComputedStyle(el);
	expect(style.width).toBe('48px');
	expect(style.height).toBe('48px');
	el.remove();
});
