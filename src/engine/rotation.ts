// src/engine/rotation.ts
// Turn rotation and leg-starter helpers for X01 matches (ENG-03).

/**
 * Returns the index of the next player after `currentIndex` in a game with
 * `numPlayers` players. Cycles 0 → 1 → … → n-1 → 0.
 */
export function nextPlayerIndex(currentIndex: number, numPlayers: number): number {
	return (currentIndex + 1) % numPlayers;
}

/**
 * Returns the player index who should throw first in leg `legNumber` (0-based)
 * given `numPlayers` total players.
 *
 * The bull-off order is the rotation cycle (RESEARCH Open Question 2 resolved):
 *   legStarterIndex(L, n) = L % n
 *
 * Examples:
 *   leg 0 → player 0 (bull-off winner throws first)
 *   leg 1 → player 1 (for 2-player: alternates; for 3+: rotates)
 *   leg n → player n % numPlayers
 */
export function legStarterIndex(legNumber: number, numPlayers: number): number {
	return legNumber % numPlayers;
}
