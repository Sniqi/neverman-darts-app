// PROF-01 (partial: create + read) — first real unit test against the Dexie DB.
// Runs in the node unit project; fake-indexeddb provides the IndexedDB backend.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';

describe('profiles table (PROF-01 create + read)', () => {
	beforeEach(async () => {
		await db.profiles.clear();
	});

	it('returns an added profile via toArray with correct name and initial', async () => {
		await db.profiles.add({
			name: 'Anna',
			color: '#e8a020',
			initial: 'A',
			createdAt: Date.now()
		});

		const all = await db.profiles.toArray();

		expect(all).toHaveLength(1);
		expect(all[0].name).toBe('Anna');
		expect(all[0].initial).toBe('A');
		expect(all[0].initial).toHaveLength(1);
		expect(all[0].initial).toBe(all[0].initial.toUpperCase());
		expect(all[0].id).toBeTypeOf('number');
	});
});
