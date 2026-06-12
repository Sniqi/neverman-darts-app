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
//
// Phase 4 Plan 05 additions:
//   - preloadedRecords: Map<string, LifetimeStats> — profile records at match start
//   - pendingRecords: RecordItem[] — records detected in the last dispatch
//   - loadRecords(state): populates preloadedRecords from db.matches
//   - #detectRecords(prev, next): returns record items for a dispatch transition
//   - #broadcastRecordEvent(items): posts on BC_RECORD_CHANNEL (separate channel, Pitfall 5)
//
// Security T-04-14: #detectRecords never calls dispatch/reduce — only mutates
// pendingRecords and posts to BroadcastChannel (no infinite loop).

import { reduce, initialState } from '../engine/reducer.js';
import { getSuggestion } from '../engine/checkout.js';
import type { MatchAction, MatchState, PlayerState } from '../engine/types.js';
import { db } from '../db/db.js';
import { BC_CHANNEL, BC_RECORD_CHANNEL, LS_SNAPSHOT } from '../lib/sync-constants.js';
import { computeLifetimeStats, type LifetimeStats } from '../db/stats.js';
import { matchAverageCrossLeg } from '../engine/averages.js';

/**
 * A single record item detected during a dispatch.
 * text is the pre-formatted German string shown in RecordOverlay / record badge.
 */
export interface RecordItem {
	playerId: string;
	type: '180' | 'highest-visit' | 'highest-checkout' | 'best-leg' | 'match-avg';
	value?: number;
	text: string;
}

export class MatchStore {
	state = $state<MatchState>(initialState());

	/**
	 * Preloaded lifetime stats for each profile player at match start (D-09).
	 * Keyed by player.id. Populated by loadRecords(). Guest players are absent.
	 * Used as the comparison baseline for record detection in #detectRecords.
	 */
	preloadedRecords = $state<Map<string, LifetimeStats>>(new Map());

	/**
	 * Records detected in the most recent dispatch.
	 * Consumed by RecordOverlay on /match; cleared by the overlay's ondismiss.
	 * On a coincident win the route folds these into the win banner instead.
	 */
	pendingRecords = $state<RecordItem[]>([]);

	dispatch(action: MatchAction): void {
		const prevState = this.state;
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

		// Phase 4: detect records after publish, before match-complete persist.
		// Uses preloaded baselines (unaffected by UNDO — always history-only).
		// Never dispatches further actions (T-04-14 anti-infinite-loop).
		const recordItems = this.#detectRecords(prevState, this.state);
		if (recordItems.length > 0) {
			this.pendingRecords = recordItems;
			this.#broadcastRecordEvent(recordItems);
		}

		// D-08: on match-complete, persist to history and clear the resume slot (fire-and-forget)
		if (this.state.phase === 'match-complete') {
			this.#persistCompletedMatch(this.state);
		}
	}

	/**
	 * Preload each profile player's lifetime stats from db.matches at match start (D-09).
	 * Called once from the match route's onMount after state.players is populated.
	 * Wrapped in try/catch: if DB is unavailable, preloadedRecords stays empty and
	 * record detection is silently skipped (Pitfall 4 — play continues uninterrupted).
	 * Guest players (isGuest: true) are excluded (D-11).
	 */
	async loadRecords(state: MatchState): Promise<void> {
		const newMap = new Map<string, LifetimeStats>();
		for (const player of state.players) {
			if (player.isGuest) continue;
			try {
				const matches = await db.matches
					.filter(m => m.state.players.some(p => p.id === player.id))
					.toArray();
				newMap.set(player.id, computeLifetimeStats(matches, player.id));
			} catch {
				// DB unavailable for this player — skip; detection degrades to no records
			}
		}
		this.preloadedRecords = newMap;
	}

	/**
	 * Detect record items for the prev → next state transition.
	 * Returns combined list of all records across all players (D-07).
	 * Never calls dispatch or reduce — only reads state (T-04-14).
	 *
	 * Detection triggers:
	 *   - Visit count increased: check 180 (D-04 always) and new highest visit
	 *   - legCompleted length increased: check best leg and highest checkout
	 *   - phase === 'match-complete': check highest match average
	 *
	 * Null baselines (brand-new player, D-05):
	 *   bestLeg === null → any first leg celebrates
	 *   matchAverage === null → any first match average celebrates
	 *   highestVisit and highestCheckout default to 0, so score > 0 already celebrates first
	 */
	#detectRecords(prev: MatchState, next: MatchState): RecordItem[] {
		const items: RecordItem[] = [];

		for (const nextPlayer of next.players) {
			// Skip guests (D-11) and players without preloaded records
			if (nextPlayer.isGuest) continue;
			const baseline = this.preloadedRecords.get(nextPlayer.id);
			if (!baseline) continue;

			const prevPlayer = prev.players.find(p => p.id === nextPlayer.id);
			const prevVisitCount = prevPlayer?.visits.length ?? 0;
			const prevLegCount = prevPlayer?.legCompleted?.length ?? 0;
			const nextLegCount = nextPlayer.legCompleted?.length ?? 0;

			// ── Visit closed ─────────────────────────────────────────────────
			if (nextPlayer.visits.length > prevVisitCount) {
				const lastVisit = nextPlayer.visits[nextPlayer.visits.length - 1];

				// Only non-bust visits count for score-based records
				if (!lastVisit.bust) {
					// Compute the visit score from dart values (board visits only)
					// For numpad visits (darts: []), score cannot be determined without
					// intermediate remaining — skip visit-based records for numpad
					let visitScore: number | null = null;
					if (lastVisit.darts.length > 0) {
						visitScore = lastVisit.darts.reduce(
							(s, d) => s + d.multiplier * d.segment,
							0,
						);
					}

					if (visitScore !== null) {
						// 180 always celebrates (D-04) — even when not a new personal record
						if (visitScore === 180) {
							items.push({
								playerId: nextPlayer.id,
								type: '180',
								value: 180,
								text: '180!',
							});
						}

						// New highest visit — only when visit > baseline AND not 180
						// (180 already pushed above; if 180 AND new record, the combined text
						// is handled in the UI joining all items with ' · ')
						if (visitScore !== 180 && visitScore > baseline.highestVisit) {
							items.push({
								playerId: nextPlayer.id,
								type: 'highest-visit',
								value: visitScore,
								text: 'Neuer Rekord: Höchste Aufnahme',
							});
						}
					}
				}
			}

			// ── Leg closed ───────────────────────────────────────────────────
			if (nextLegCount > prevLegCount) {
				const closedLeg = nextPlayer.legCompleted![nextLegCount - 1];
				const newLegDarts = closedLeg.dartsThrown;

				// Best leg: null baseline (D-05) OR genuinely fewer darts
				if (baseline.bestLeg === null || newLegDarts < baseline.bestLeg) {
					items.push({
						playerId: nextPlayer.id,
						type: 'best-leg',
						value: newLegDarts,
						text: `Neuer Rekord: Bestes Leg (${newLegDarts} Darts)`,
					});
				}

				// Highest checkout: the leg-closing visit
				// Find the wasCheckout visit in the new visits since prev
				const newVisits = nextPlayer.visits.slice(prevVisitCount);
				for (const v of newVisits) {
					if (v.wasCheckout === true && v.darts.length > 0) {
						const checkoutScore = v.darts.reduce(
							(s, d) => s + d.multiplier * d.segment,
							0,
						);
						if (checkoutScore > baseline.highestCheckout) {
							items.push({
								playerId: nextPlayer.id,
								type: 'highest-checkout',
								value: checkoutScore,
								text: `Neuer Rekord: Höchstes Finish ${checkoutScore}`,
							});
						}
					}
				}
			}

			// ── Match complete ───────────────────────────────────────────────
			if (next.phase === 'match-complete' && prev.phase !== 'match-complete') {
				const legStartIdx = next.legStartVisitIndex[nextPlayer.id] ?? 0;
				const liveAvg = matchAverageCrossLeg(
					nextPlayer,
					legStartIdx,
					next.config.startScore,
				);

				if (liveAvg !== null) {
					// Null baseline (D-05) OR genuinely better average
					if (baseline.matchAverage === null || liveAvg > baseline.matchAverage) {
						items.push({
							playerId: nextPlayer.id,
							type: 'match-avg',
							value: liveAvg,
							text: 'Neuer Rekord: Bester Match-Schnitt',
						});
					}
				}
			}
		}

		return items;
	}

	/**
	 * Broadcast record items to the spectator display via a separate channel.
	 * Uses the same one-shot pattern as the match-state broadcast (open, post, close).
	 * Separate channel avoids DisplayStore casting this payload as MatchState (Pitfall 5, T-04-12).
	 */
	#broadcastRecordEvent(items: RecordItem[]): void {
		try {
			const ch = new BroadcastChannel(BC_RECORD_CHANNEL);
			ch.postMessage({ type: 'record-event', records: items.map(i => i.text) });
			ch.close();
		} catch {
			// Silently ignore — celebration is best-effort; play continues
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
