// src/db/profiles.ts
// Typed CRUD helpers over db.profiles (Dexie AppDB v1).
// PROF-01: create / update / delete / list persistent profiles.
// Wraps all DB access so a Dexie open failure does not crash callers (T-04-02).

import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type Profile } from './db.js';

/**
 * Create a new profile from a display name.
 * Derives `initial` (first char, uppercased) and assigns the default accent color.
 * Returns the auto-increment id.
 */
export async function createProfile(name: string): Promise<number> {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Profile name cannot be empty');
	const profile: Omit<Profile, 'id'> = {
		name: trimmed,
		color: '#e8a020',
		initial: trimmed[0].toUpperCase(),
		createdAt: Date.now()
	};
	return db.profiles.add(profile as Profile);
}

/**
 * Update a profile by id.
 * If `name` is changed, re-derives `initial` accordingly.
 */
export async function updateProfile(
	id: number,
	patch: Partial<Pick<Profile, 'name' | 'color'>>
): Promise<void> {
	const update: Partial<Profile> = { ...patch };
	if (patch.name !== undefined) {
		const trimmed = patch.name.trim();
		update.name = trimmed;
		update.initial = trimmed[0]?.toUpperCase() ?? '';
	}
	await db.profiles.update(id, update);
}

/** Delete a profile by id. */
export async function deleteProfile(id: number): Promise<void> {
	await db.profiles.delete(id);
}

/**
 * List all profiles sorted alphabetically by name.
 * Returns an empty array on Dexie failure (T-04-02).
 */
export async function listProfiles(): Promise<Profile[]> {
	try {
		const all = await db.profiles.toArray();
		return all.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

/**
 * Reactive liveQuery wrapper returning a Svelte readable store.
 * Emits the full sorted profile list whenever the Dexie table changes.
 * On DB failure emits an empty array (T-04-02).
 */
export function profilesLive(): Readable<Profile[]> {
	return readable<Profile[]>([], (set) => {
		const subscription = liveQuery(async () => {
			try {
				const all = await db.profiles.toArray();
				return all.sort((a, b) => a.name.localeCompare(b.name));
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
