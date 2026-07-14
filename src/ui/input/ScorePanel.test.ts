// src/ui/input/ScorePanel.test.ts
// Browser-mode component tests for ScorePanel (SCOR-04 DS restyle).
//
// Verifies:
//   1. Active player's .remaining-active computed font-size is 96px, font-weight 800
//   2. Inactive player's .remaining-inactive computed font-size is 44px, font-weight 700
//   3. .player-card.active computed box-shadow contains the accent color
//   4. .player-name computed text-overflow is ellipsis, white-space is nowrap

import { render } from 'vitest-browser-svelte';
import { beforeEach, expect, test } from 'vitest';
import ScorePanel from './ScorePanel.svelte';
import { matchStore } from '../../stores/match.svelte.js';
import { initialState } from '../../engine/reducer.js';
// This component renders in isolation (no root +layout.svelte), so the DS
// :root tokens are not otherwise present in the document — import the global
// token stylesheet so var(--text-score-active)/var(--accent)/etc. resolve to
// the real DS values (08-03 pattern, see ReloadPrompt.test.ts Pitfall 4).
import '../../app.css';

beforeEach(() => {
	matchStore.restore({
		...initialState(),
		phase: 'playing',
		activePlayerIndex: 0,
		players: [
			{ id: 'p1', name: 'Alice', isGuest: false, remaining: 301, legsWon: 0, setsWon: 0, visits: [] },
			{ id: 'p2', name: 'Bob', isGuest: false, remaining: 501, legsWon: 1, setsWon: 0, visits: [] },
		],
	});
});

test('.player-card.active .remaining-active computed font-size is 96px and font-weight is 800', async () => {
	const screen = render(ScorePanel);
	const el = screen.container.querySelector('.player-card.active .remaining-active') as HTMLElement;
	expect(el).toBeTruthy();
	const style = window.getComputedStyle(el);
	expect(style.fontSize).toBe('96px');
	expect(style.fontWeight).toBe('800');
});

test('inactive player .remaining-inactive computed font-size is 44px and font-weight is 700', async () => {
	const screen = render(ScorePanel);
	const el = screen.container.querySelector('.remaining-inactive') as HTMLElement;
	expect(el).toBeTruthy();
	const style = window.getComputedStyle(el);
	expect(style.fontSize).toBe('44px');
	expect(style.fontWeight).toBe('700');
});

test('.player-card.active computed box-shadow contains the accent color', async () => {
	const screen = render(ScorePanel);
	const el = screen.container.querySelector('.player-card.active') as HTMLElement;
	expect(el).toBeTruthy();
	const style = window.getComputedStyle(el);
	expect(style.boxShadow).toContain('rgb(240, 164, 36)');
});

test('.player-name computed text-overflow is ellipsis and white-space is nowrap', async () => {
	const screen = render(ScorePanel);
	const el = screen.container.querySelector('.player-name') as HTMLElement;
	expect(el).toBeTruthy();
	const style = window.getComputedStyle(el);
	expect(style.textOverflow).toBe('ellipsis');
	expect(style.whiteSpace).toBe('nowrap');
});

// SCOR-04 gap closure (10-05, 10-VERIFICATION.md): compact-mode clamp for 3-4 player
// landscape to avoid clipping the active score (see e2e/score-panel-landscape.spec.ts
// for the visual/overflow proof at the actual 1024x768 landscape viewport).
test('.score-panel has class compact when playerCount is 4', async () => {
	matchStore.restore({
		...initialState(),
		phase: 'playing',
		activePlayerIndex: 0,
		players: [
			{ id: 'p1', name: 'Alice', isGuest: false, remaining: 501, legsWon: 0, setsWon: 0, visits: [] },
			{ id: 'p2', name: 'Bob', isGuest: false, remaining: 501, legsWon: 0, setsWon: 0, visits: [] },
			{ id: 'p3', name: 'Carol', isGuest: false, remaining: 501, legsWon: 0, setsWon: 0, visits: [] },
			{ id: 'p4', name: 'Dave', isGuest: false, remaining: 501, legsWon: 0, setsWon: 0, visits: [] }
		]
	});
	const screen = render(ScorePanel);
	const panel = screen.container.querySelector('.score-panel') as HTMLElement;
	expect(panel).toBeTruthy();
	expect(panel.classList.contains('compact')).toBe(true);
});

test('.score-panel does not have class compact for the default 2-player fixture, and .remaining-active stays at 96px', async () => {
	const screen = render(ScorePanel);
	const panel = screen.container.querySelector('.score-panel') as HTMLElement;
	expect(panel).toBeTruthy();
	expect(panel.classList.contains('compact')).toBe(false);
	const el = screen.container.querySelector('.remaining-active') as HTMLElement;
	const style = window.getComputedStyle(el);
	expect(style.fontSize).toBe('96px');
});
