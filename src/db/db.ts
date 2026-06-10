import { Dexie, type EntityTable } from 'dexie';

// Profile shape is an interface contract for Phases 3-4 — DO NOT rename fields.
export interface Profile {
	id?: number; // auto-increment primary key
	name: string;
	color: string; // hex color for avatar, e.g. "#e8a020"
	initial: string; // first letter of name, uppercase
	createdAt: number; // Date.now() at creation — used by Phase 4 stats
}

class AppDB extends Dexie {
	profiles!: EntityTable<Profile, 'id'>;

	constructor() {
		super('NevermanDarts');
		// Version 1: profiles only.
		// version(2)+ reserved for Phase 3 (matches, events tables) — do not add tables here.
		this.version(1).stores({
			profiles: '++id, name, createdAt'
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
