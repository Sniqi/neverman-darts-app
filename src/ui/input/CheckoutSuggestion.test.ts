// src/ui/input/CheckoutSuggestion.test.ts
// Browser-mode component test for CheckoutSuggestion (SCOR-04 DS restyle).
//
// Verifies:
//   1. Given remaining=40 with outRule 'double' (a valid checkout route),
//      .suggestion computed font-size is 17px, font-weight 700, border-radius 999px

import { render } from 'vitest-browser-svelte';
import { beforeEach, expect, test } from 'vitest';
import CheckoutSuggestion from './CheckoutSuggestion.svelte';
import { matchStore } from '../../stores/match.svelte.js';
import { initialState } from '../../engine/reducer.js';
// This component renders in isolation — import the global token stylesheet
// so var(--text-base)/var(--accent)/etc. resolve to the real DS values
// (08-03 pattern, see ReloadPrompt.test.ts Pitfall 4).
import '../../app.css';

beforeEach(() => {
	const base = initialState();
	matchStore.restore({
		...base,
		phase: 'playing',
		activePlayerIndex: 0,
		config: { ...base.config, outRule: 'double' },
		players: [
			{ id: 'p1', name: 'Alice', isGuest: false, remaining: 40, legsWon: 0, setsWon: 0, visits: [] },
		],
	});
});

test('.suggestion computed font-size is 17px, font-weight is 700, border-radius is 999px', async () => {
	const screen = render(CheckoutSuggestion);
	const el = screen.container.querySelector('.suggestion') as HTMLElement;
	expect(el).toBeTruthy();
	const style = window.getComputedStyle(el);
	expect(style.fontSize).toBe('17px');
	expect(style.fontWeight).toBe('700');
	expect(style.borderRadius).toBe('999px');
});
