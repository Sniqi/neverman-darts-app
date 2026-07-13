// src/ui/stats/StatCard.test.ts
// Browser-mode component tests for StatCard (COMP-04).
//
// Verifies:
//   1. Renders label + value text
//   2. .stat-value computed font-size/font-weight match the DS spec (40px/700)
//   3. .stat-label computed font-size/font-weight match the DS spec (17px/500)
//   4. .stat-card computed border-radius matches the DS spec (16px)

import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import StatCard from './StatCard.svelte';
// This component renders in isolation (no root +layout.svelte), so the DS
// :root tokens are not otherwise present in the document — import the global
// token stylesheet so var(--text-3xl)/var(--radius-md)/etc. resolve to the
// real DS values (08-03 pattern, see ReloadPrompt.test.ts Pitfall 4).
import '../../app.css';

test('renders label and value text', async () => {
	const screen = render(StatCard, {
		label: 'Ø 3-Dart',
		value: '42.3',
	});
	expect(screen.container.textContent).toContain('Ø 3-Dart');
	expect(screen.container.textContent).toContain('42.3');
});

test('.stat-value computed font-size is 40px and font-weight is 700', async () => {
	const screen = render(StatCard, {
		label: 'Ø 3-Dart',
		value: '42.3',
	});
	const valueEl = screen.container.querySelector('.stat-value') as HTMLElement;
	expect(valueEl).toBeTruthy();
	const style = window.getComputedStyle(valueEl);
	expect(style.fontSize).toBe('40px');
	expect(style.fontWeight).toBe('700');
});

test('.stat-label computed font-size is 17px and font-weight is 500', async () => {
	const screen = render(StatCard, {
		label: 'Ø 3-Dart',
		value: '42.3',
	});
	const labelEl = screen.container.querySelector('.stat-label') as HTMLElement;
	expect(labelEl).toBeTruthy();
	const style = window.getComputedStyle(labelEl);
	expect(style.fontSize).toBe('17px');
	expect(style.fontWeight).toBe('500');
});

test('.stat-card computed border-radius is 16px', async () => {
	const screen = render(StatCard, {
		label: 'Ø 3-Dart',
		value: '42.3',
	});
	const cardEl = screen.container.querySelector('.stat-card') as HTMLElement;
	expect(cardEl).toBeTruthy();
	const style = window.getComputedStyle(cardEl);
	expect(style.borderRadius).toBe('16px');
});
