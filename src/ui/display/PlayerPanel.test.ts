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
//   7. Checkout route shown for active player on a finishing remaining (D-06)
//   8. Checkout route NOT shown for active player on non-finishing remaining (>170 or bogey)
//   9. BUST label shown when active player's last visit is a bust (D-08)

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

// --- D-06: Checkout route ---

test('active player on 40 (double-out) shows checkout route "D20"', async () => {
	const playerOn40: PlayerState = {
		id: 'p3',
		name: 'Charlie',
		isGuest: false,
		remaining: 40,
		legsWon: 0,
		setsWon: 0,
		visits: [],
	};
	const screen = render(PlayerPanel, {
		player: playerOn40,
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
		currentVisit: [],
	});
	// getSuggestion(40, 'double') = ['D20']
	expect(screen.container.textContent).toContain('D20');
});

test('active player on 501 shows no checkout route', async () => {
	const screen = render(PlayerPanel, {
		player: playerNoVisits, // remaining: 501
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
		currentVisit: [],
	});
	// 501 > 170 → no route
	const text = screen.container.textContent ?? '';
	// Should not contain a checkout route string like D20, T20, Bull
	expect(text).not.toMatch(/^D\d+$/m);
	// The checkout route section should not exist or be empty
	const routeEl = screen.container.querySelector('.checkout-route');
	expect(routeEl).toBeFalsy();
});

test('active player on 169 (bogey) shows no checkout route', async () => {
	const playerOn169: PlayerState = {
		id: 'p4',
		name: 'Dave',
		isGuest: false,
		remaining: 169,
		legsWon: 0,
		setsWon: 0,
		visits: [],
	};
	const screen = render(PlayerPanel, {
		player: playerOn169,
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
		currentVisit: [],
	});
	const routeEl = screen.container.querySelector('.checkout-route');
	expect(routeEl).toBeFalsy();
});

test('inactive player on a finishing remaining shows no checkout route', async () => {
	const playerOn40: PlayerState = {
		id: 'p5',
		name: 'Eve',
		isGuest: false,
		remaining: 40,
		legsWon: 0,
		setsWon: 0,
		visits: [],
	};
	const screen = render(PlayerPanel, {
		player: playerOn40,
		isActive: false, // NOT active
		config: config501Double,
		legStartIndex: 0,
		currentVisit: [],
	});
	const routeEl = screen.container.querySelector('.checkout-route');
	expect(routeEl).toBeFalsy();
});

// --- D-08: BUST flash ---

test('active player with last visit bust=true shows BUST label', async () => {
	const playerBust: PlayerState = {
		id: 'p6',
		name: 'Frank',
		isGuest: false,
		remaining: 180,
		legsWon: 0,
		setsWon: 0,
		visits: [{ darts: [{ multiplier: 3, segment: 20 }, { multiplier: 3, segment: 20 }, { multiplier: 3, segment: 20 }], dartsAtDouble: 0, bust: true }],
	};
	const screen = render(PlayerPanel, {
		player: playerBust,
		isActive: true,
		config: config501Double,
		legStartIndex: 0,
		currentVisit: [],
	});
	expect(screen.container.textContent).toContain('BUST');
});
