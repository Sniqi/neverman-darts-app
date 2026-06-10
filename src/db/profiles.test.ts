// PROF-01 — full CRUD unit tests for profiles.ts helpers.
// Runs in the node unit project; fake-indexeddb provides the IndexedDB backend.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createProfile, updateProfile, deleteProfile, listProfiles } from './profiles';

describe('profiles CRUD (PROF-01)', () => {
	beforeEach(async () => {
		await db.profiles.clear();
	});

	it('createProfile stores name, derived initial, and default color', async () => {
		const id = await createProfile('alex');
		const all = await db.profiles.toArray();
		expect(all).toHaveLength(1);
		expect(all[0].id).toBe(id);
		expect(all[0].name).toBe('alex');
		expect(all[0].initial).toBe('A');
		expect(all[0].color).toBe('#e8a020');
		expect(all[0].createdAt).toBeTypeOf('number');
	});

	it('createProfile trims whitespace and derives uppercase initial', async () => {
		await createProfile('  betty  ');
		const all = await db.profiles.toArray();
		expect(all[0].name).toBe('betty');
		expect(all[0].initial).toBe('B');
	});

	it('updateProfile changes name and re-derives initial', async () => {
		const id = await createProfile('carlos');
		await updateProfile(id, { name: 'diana' });
		const updated = await db.profiles.get(id);
		expect(updated?.name).toBe('diana');
		expect(updated?.initial).toBe('D');
	});

	it('updateProfile can change color without affecting name or initial', async () => {
		const id = await createProfile('Emil');
		await updateProfile(id, { color: '#ff0000' });
		const updated = await db.profiles.get(id);
		expect(updated?.color).toBe('#ff0000');
		expect(updated?.name).toBe('Emil');
		expect(updated?.initial).toBe('E');
	});

	it('deleteProfile removes the record', async () => {
		const id = await createProfile('Franz');
		await deleteProfile(id);
		const all = await db.profiles.toArray();
		expect(all).toHaveLength(0);
	});

	it('listProfiles returns all profiles sorted alphabetically', async () => {
		await createProfile('Zara');
		await createProfile('Anton');
		await createProfile('Mia');
		const list = await listProfiles();
		expect(list.map((p) => p.name)).toEqual(['Anton', 'Mia', 'Zara']);
	});

	it('listProfiles returns empty array when table is empty', async () => {
		const list = await listProfiles();
		expect(list).toEqual([]);
	});
});
