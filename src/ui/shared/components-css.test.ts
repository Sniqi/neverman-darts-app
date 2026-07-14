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

// WR-03 (09-REVIEW.md): the canonical two/three-class assertion above doesn't guard
// against a future components.css change silently losing coverage for the real
// usage-site class combos, which add a local component class on top of
// .btn.btn--ghost.btn--icon (PlayerPicker's remove-btn, ProfileManager's
// icon-btn/icon-btn.destructive). Assert the composed combos still hit the 48px
// hit-target minimum so a selector-specificity regression in .btn--icon would be
// caught here rather than silently shrinking real hit targets below --hit-min.
test('components-css: real call-site class combos still meet the 48px hit-target minimum', () => {
	const combos = [
		'btn btn--ghost btn--icon remove-btn', // PlayerPicker.svelte:65
		'btn btn--ghost btn--icon icon-btn', // ProfileManager.svelte:100
		'btn btn--ghost btn--icon icon-btn destructive', // ProfileManager.svelte:101
	];
	for (const className of combos) {
		const el = makeEl('button', className);
		const style = getComputedStyle(el);
		expect(parseFloat(style.width)).toBeGreaterThanOrEqual(48);
		expect(parseFloat(style.height)).toBeGreaterThanOrEqual(48);
		el.remove();
	}
});
