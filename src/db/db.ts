import { Dexie, type EntityTable } from 'dexie';
import type { MatchState } from '../engine/types.js';

// Profile shape is an interface contract for Phases 3-4 — DO NOT rename fields.
export interface Profile {
	// Required for EntityTable<Profile, 'id'> key typing (so .add() returns number,
	// not number | undefined). Inserts use Omit<Profile, 'id'> / Dexie's InsertType,
	// which keeps the id optional at insert time (++id auto-increment).
	id: number; // auto-increment primary key
	name: string;
	color: string; // hex color for avatar, e.g. "#e8a020"
	initial: string; // first letter of name, uppercase
	createdAt: number; // Date.now() at creation — used by Phase 4 stats
}

// MatchRecord shape for Phase 3 match history (STAT-06).
// DO NOT rename fields — Phase 4 queries depend on winnerId and completedAt indexes.
export interface MatchRecord {
	id?: number; // auto-increment primary key
	completedAt: number; // Date.now() — indexed for orderBy newest-first
	winnerId: string; // indexed for per-player history queries (Phase 4)
	state: MatchState; // full serialized MatchState blob — NOT indexed
}

class AppDB extends Dexie {
	profiles!: EntityTable<Profile, 'id'>;
	matches!: EntityTable<MatchRecord, 'id'>;

	constructor() {
		super('NevermanDarts');
		// Version 1: profiles only.
		// version(2)+ reserved for Phase 3 (matches, events tables) — do not add tables here.
		this.version(1).stores({
			profiles: '++id, name, createdAt'
		});
		// Version 2: match history. Phase 3 (STAT-06).
		// Only declare new table — Dexie carries profiles forward automatically.
		this.version(2).stores({
			matches: '++id, completedAt, winnerId'
		});
	}
}

export const db = new AppDB();

/**
 * Opens the DB defensively. In private browsing / storage-restricted contexts
 * Dexie's open() can reject — the app must keep working without persisted
 * profiles (guests still work), never crash (T-01-02).
 *
 * @returns true if IndexedDB is available and open, false otherwise.
 */
export async function ensureDbOpen(): Promise<boolean> {
	try {
		if (!db.isOpen()) {
			await db.open();
		}
		return true;
	} catch {
		return false;
	}
}
