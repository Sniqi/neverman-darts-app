// src/db/matches.ts
// Typed CRUD helpers over db.matches (Dexie AppDB v2).
// STAT-06: liveQuery readable, getMatch, deleteMatch, toHistoryRow.
// Mirrors profiles.ts pattern exactly — wrap all DB access in try/catch (T-03-06).

import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type MatchRecord } from './db.js';

export type { MatchRecord };

/** Display-ready row derived from a MatchRecord (D-04). */
export interface HistoryRow {
	id: number;
	date: string; // e.g. "12.06." (German short date)
	result: string; // e.g. "3:1" for 2-player, "3 Legs" for 3-4 player
	winnerName: string; // name of the winning player
	otherNames: string[]; // names of non-winning players (2-player: one entry)
	format: string; // e.g. "501 Double Out"
	completedAt: number;
}

/**
 * Reactive liveQuery wrapper — newest-first match list.
 * Emits the full list whenever db.matches changes.
 * On DB failure emits an empty array (T-03-06).
 */
export function matchesLive(): Readable<MatchRecord[]> {
	return readable<MatchRecord[]>([], (set) => {
		const subscription = liveQuery(async () => {
			try {
				return await db.matches.orderBy('completedAt').reverse().toArray();
			} catch {
				return [];
			}
		}).subscribe({
			next: set,
			error: () => set([])
		});
		return () => subscription.unsubscribe();
	});
}

/**
 * Get a single match record by id.
 * Returns undefined on missing id or DB failure.
 */
export async function getMatch(id: number): Promise<MatchRecord | undefined> {
	try {
		return await db.matches.get(id);
	} catch {
		return undefined;
	}
}

/**
 * Delete a match record by id.
 * No try/catch — consistent with profiles.deleteProfile; callers handle errors.
 */
export async function deleteMatch(id: number): Promise<void> {
	await db.matches.delete(id);
}

/**
 * Derive display-ready HistoryRow data from a MatchRecord (D-04 / Code Example).
 * - date: German short date "12.06."
 * - result: "n:m" for 2-player (legs or sets); "[winner] Legs" count for 3-4 players
 * - winner/other names from winnerId lookup
 * - format: "[startScore] Double Out" or "[startScore] Single Out"
 * Security T-03-05: all strings are plain data — no HTML injection possible;
 * callers must render via Svelte {interpolation}.
 */
export function toHistoryRow(record: MatchRecord): HistoryRow {
	const { state } = record;
	const winner = state.players.find((p) => p.id === record.winnerId) ?? state.players[0];
	const others = state.players.filter((p) => p.id !== winner.id);

	const d = new Date(record.completedAt);
	const date = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

	const outRule = state.config.outRule === 'double' ? 'Double Out' : 'Single Out';
	const format = `${state.config.startScore} ${outRule}`;

	let result: string;
	if (state.players.length === 2) {
		// 2-player: "n:m" — use setsWon when sets are enabled (D-04)
		const scoreA = state.config.setsEnabled ? state.players[0].setsWon : state.players[0].legsWon;
		const scoreB = state.config.setsEnabled ? state.players[1].setsWon : state.players[1].legsWon;
		result = `${scoreA}:${scoreB}`;
	} else {
		// 3-4 players: winner + legs won (no a:b format per RESEARCH Q3 resolution)
		result = `${winner.legsWon} ${winner.legsWon === 1 ? 'Leg' : 'Legs'}`;
	}

	return {
		id: record.id!,
		date,
		result,
		winnerName: winner.name,
		otherNames: others.map((p) => p.name),
		format,
		completedAt: record.completedAt
	};
}
