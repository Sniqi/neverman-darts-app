// src/stores/match.svelte.ts
// Real Svelte 5 class-based runes store wrapping the pure reducer.
// RESEARCH Pattern 2. Consumed by Plans 03 and 04.
//
// Design:
//   - Class with $state field — idiomatic Svelte 5 runes store
//   - dispatch() delegates all state transitions to the pure reducer
//   - Convenience getters computed on each read (no $derived needed at module
//     level — getters in class properties are re-evaluated on every access,
//     which is sufficient for the live-suggestion requirement D-10)
//   - No BroadcastChannel (Phase 2). State is fully serializable.
//   - Export both class (for test instantiation) and singleton (for UI components)

import { reduce, initialState } from '../engine/reducer.js';
import { getSuggestion } from '../engine/checkout.js';
import type { MatchAction, MatchState, PlayerState } from '../engine/types.js';

export class MatchStore {
	state = $state<MatchState>(initialState());

	dispatch(action: MatchAction): void {
		this.state = reduce(this.state, action);
	}

	get activePlayer(): PlayerState {
		return this.state.players[this.state.activePlayerIndex];
	}

	/** Remaining score for the active player. */
	get remaining(): number {
		return this.activePlayer?.remaining ?? 0;
	}

	/** Darts thrown in the current visit (may be 0–2 mid-visit). */
	get currentVisit() {
		return this.state.currentVisit;
	}

	/**
	 * Live checkout suggestion for the active player's remaining score (D-10).
	 * Recomputed on every read — updates after every dart dispatch.
	 * Returns null when out of finish range or a bogey number (D-12).
	 */
	get suggestion(): string[] | null {
		if (!this.activePlayer) return null;
		return getSuggestion(this.remaining, this.state.config.outRule);
	}

	get isMatchComplete(): boolean {
		return this.state.phase === 'match-complete';
	}
}

export const matchStore = new MatchStore();
