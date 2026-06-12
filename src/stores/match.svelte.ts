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
//   - BroadcastChannel + localStorage publisher added in Phase 2.
//     Fires after every dispatch(); both wrapped in try/catch (non-fatal).
//   - Export both class (for test instantiation) and singleton (for UI components)

import { reduce, initialState } from '../engine/reducer.js';
import { getSuggestion } from '../engine/checkout.js';
import type { MatchAction, MatchState, PlayerState } from '../engine/types.js';
import { db } from '../db/db.js';
import { BC_CHANNEL, LS_SNAPSHOT } from '../lib/sync-constants.js';

export class MatchStore {
	state = $state<MatchState>(initialState());

	dispatch(action: MatchAction): void {
		this.state = reduce(this.state, action);

		// Publish to spectator display — non-fatal; BroadcastChannel unavailable in SSR/private mode
		try {
			const ch = new BroadcastChannel(BC_CHANNEL);
			ch.postMessage($state.snapshot(this.state));
			ch.close();
		} catch {
			// Silently ignore — match play must continue uninterrupted
		}

		// Persist snapshot for cold-start hydration of spectator display
		try {
			localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
		} catch {
			// Silently ignore — localStorage may be unavailable in private mode or quota exceeded
		}

		// D-08: on match-complete, persist to history and clear the resume slot (fire-and-forget)
		if (this.state.phase === 'match-complete') {
			this.#persistCompletedMatch(this.state);
		}
	}

	/**
	 * Persist a completed match to IndexedDB and clear the resume slot.
	 * Fire-and-forget — called without await inside dispatch().
	 * Wrapped in try/catch: if DB is unavailable (private mode / quota) the match
	 * was still played; history is best-effort (T-03-06).
	 */
	async #persistCompletedMatch(state: MatchState): Promise<void> {
		try {
			// On match-complete the reducer leaves activePlayerIndex pointing at the winner.
			const winner = state.players[state.activePlayerIndex];
			await db.matches.add({
				completedAt: Date.now(),
				winnerId: winner.id,
				state: $state.snapshot(state)
			});
		} catch {
			// DB unavailable — match was played; history persistence is best-effort
		}
		// Clear resume slot unconditionally — must run even if DB write fails (Pitfall 2)
		try {
			localStorage.removeItem(LS_SNAPSHOT);
		} catch {
			// localStorage unavailable — acceptable
		}
	}

	get activePlayer(): PlayerState {
		return this.state.players[this.state.activePlayerIndex];
	}

	/** Remaining score for the active player.
	 * Subtracts the running total of the current board visit so the value
	 * updates live after every dart (ENG-07 / D-10 / CR-06).
	 * When currentVisit is empty (numpad path, or start of visit) the
	 * subtraction is 0, so the value equals the committed remaining.
	 */
	get remaining(): number {
		const committed = this.activePlayer?.remaining ?? 0;
		const visitScored = this.state.currentVisit.reduce(
			(sum, d) => sum + d.multiplier * d.segment,
			0
		);
		return committed - visitScored;
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

	/**
	 * Restore a previously persisted MatchState (crash-resume, D-01).
	 * Direct assignment to the $state field — same mechanism as dispatch().
	 */
	restore(state: MatchState): void {
		this.state = state;
	}

	get isMatchComplete(): boolean {
		return this.state.phase === 'match-complete';
	}
}

export const matchStore = new MatchStore();
