// src/ui/display/PlayerPanel.test.ts
// Browser-mode component tests for PlayerPanel (DISP-03, DISP-04).
// Tests written BEFORE implementation (TDD RED phase).
//
// Verifies:
//   1. Renders player name and remaining score from props (2-player config)
//   2. Active player gets active class/marker; inactive player does not (D-02)
//   3. Renders Ø Leg and Ø Match labels + one-decimal average when visits exist (D-04)
//   4. Shows "—" when player has no visits yet (legAverage/matchAverage returns null)
//   5. Remaining score element carries display-scale font class (DISP-04)
//   6. With setsEnabled shows sets and legs; without setsEnabled shows legs only

import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import PlayerPanel from './PlayerPanel.svelte';
import type { PlayerState, MatchConfig } from '../../engine/types.js';

const config501Double: MatchConfig = {
	startScore: 501,
	outRule: 'double',
	legsToWin: 3,
	setsEnabled: false,
	setsToWin: 1,
};

const config501Sets: MatchConfig = {
	startScore: 501,
	outRule: 'double',
	legsToWin: 3,
	setsEnabled: true,
	setsToWin: 3,
};

const playerNoVisits: PlayerState = {
	id: 'p1',
	name: 'Alice',
	isGuest: false,
	remaining: 501,
	legsWon: 0,
	setsWon: 0,
	visits: [],
};

const playerWithVisits: PlayerState = {
	id: 'p2',
	name: 'Bob',
	isGuest: false,
	remaining: 321,
	legsWon: 1,
	setsWon: 0,
	// One numpad visit of 180 (darts.length === 0 → counts as 3 darts)
	visits: [{ darts: [], dartsAtDouble: 0, bust: false }],
};

test('renders player name and remaining score from props (2-player config)', async () => {
	const screen = render(PlayerPanel, {
		player: playerNoVisits,
		isActive: false,
		config: config501Double,
		legStartIndex: 0,
	});

	const container = screen.container;
	expect(container.textContent).toContain('Alice');
	expect(container.textContent).toContain('501');
});

test('active player has active class; inactive player does not', async () => {
	const activeScreen = render(PlayerPanel, {
		player: playerNoVisits,
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
	});
	const inactiveScreen = render(PlayerPanel, {
		player: playerWithVisits,
		isActive: false,
		config: config501Double,
		legStartIndex: 0,
	});

	const activePanel = activeScreen.container.querySelector('.player-panel');
	const inactivePanel = inactiveScreen.container.querySelector('.player-panel');

	expect(activePanel?.classList.contains('active')).toBe(true);
	expect(inactivePanel?.classList.contains('active')).toBe(false);
});

test('renders Ø Leg and Ø Match labels + one-decimal average when visits exist', async () => {
	const screen = render(PlayerPanel, {
		player: playerWithVisits,
		isActive: false,
		config: config501Double,
		legStartIndex: 0,
	});

	const container = screen.container;
	expect(container.textContent).toContain('Ø Leg');
	expect(container.textContent).toContain('Ø Match');
	// playerWithVisits: 1 numpad visit (3 darts), scored 501-321=180
	// average = (180/3)*3 = 180.0
	expect(container.textContent).toContain('180.0');
});

test('shows "—" for averages when player has no visits yet', async () => {
	const screen = render(PlayerPanel, {
		player: playerNoVisits,
		isActive: false,
		config: config501Double,
		legStartIndex: 0,
	});

	const container = screen.container;
	// Should show the dash placeholder, not a numeric value
	expect(container.textContent).toContain('—');
	// Should NOT contain a decimal number for averages
	expect(container.textContent).not.toMatch(/\d+\.\d/);
});

test('remaining score element carries remaining-score class (display-scale font — DISP-04)', async () => {
	const screen = render(PlayerPanel, {
		player: playerNoVisits,
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
	});

	const container = screen.container;
	const scoreEl = container.querySelector('.remaining-score');
	expect(scoreEl).toBeTruthy();
});

test('with setsEnabled shows sets and legs; without setsEnabled shows legs only', async () => {
	const noSetsScreen = render(PlayerPanel, {
		player: { ...playerWithVisits, setsWon: 1 },
		isActive: false,
		config: config501Double,
		legStartIndex: 0,
	});

	const setsScreen = render(PlayerPanel, {
		player: { ...playerWithVisits, setsWon: 1 },
		isActive: false,
		config: config501Sets,
		legStartIndex: 0,
	});

	// No sets: legs only
	expect(noSetsScreen.container.textContent).toContain('L:');
	expect(noSetsScreen.container.textContent).not.toContain('S:');

	// With sets: both shown
	expect(setsScreen.container.textContent).toContain('S:');
	expect(setsScreen.container.textContent).toContain('L:');
});
