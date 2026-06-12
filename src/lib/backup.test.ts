// PROF-03 — unit tests for backup.ts export/validate/import helpers.
// Runs in the node unit project; fake-indexeddb provides the IndexedDB backend.
// Mirrors src/db/profiles.test.ts structure (PATTERNS.md: backup.ts section).
//
// Security T-03-07: validateImportFile rejects foreign/corrupt files before any DB write.
// Security T-03-08: dexie-export-import writes into typed Dexie tables only (no prototype pollution).
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { exportDB } from 'dexie-export-import';
import { db } from '../db/db';
import { validateImportFile, importAllData } from './backup';

describe('backup export/validate/import (PROF-03)', () => {
	beforeEach(async () => {
		await db.profiles.clear();
		await db.matches.clear();
	});

	describe('validateImportFile', () => {
		it('returns valid: true for a Blob exported from the NevermanDarts db', async () => {
			// Seed then export to get a valid NevermanDarts blob
			await db.profiles.add({
				name: 'TestPlayer',
				color: '#e8a020',
				initial: 'T',
				createdAt: Date.now()
			});
			const blob = await exportDB(db);
			const result = await validateImportFile(blob);
			expect(result.valid).toBe(true);
			expect(result.errorDe).toBeNull();
		});

		it('returns valid: false with foreign-db error for a blob from a different database', async () => {
			// Create a throwaway Dexie db with a different name and export it
			const foreignDb = new Dexie('NotNeverman');
			foreignDb.version(1).stores({ items: '++id, name' });
			await (foreignDb as Dexie & { items: Dexie.Table }).items.add({ name: 'foreign' });
			const foreignBlob = await exportDB(foreignDb);
			await foreignDb.close();

			const result = await validateImportFile(foreignBlob);
			expect(result.valid).toBe(false);
			expect(result.errorDe).toBe('Diese Datei gehört nicht zu Neverman Darts.');
		});

		it('returns valid: false with corrupt-file error for a non-JSON Blob', async () => {
			const corruptBlob = new Blob(['not valid json at all !!##'], { type: 'application/json' });
			const result = await validateImportFile(corruptBlob);
			expect(result.valid).toBe(false);
			expect(result.errorDe).toBe('Die Datei konnte nicht gelesen werden oder ist beschädigt.');
		});
	});

	describe('importAllData', () => {
		it('replaces existing data with the imported blob (replace-all D-11)', async () => {
			// Seed row A into the DB
			await db.profiles.add({
				name: 'PlayerA',
				color: '#e8a020',
				initial: 'A',
				createdAt: Date.now()
			});

			// Export a snapshot containing only row B (new DB state after clearing and adding B)
			await db.profiles.clear();
			await db.profiles.add({
				name: 'PlayerB',
				color: '#3498db',
				initial: 'B',
				createdAt: Date.now()
			});
			const blobWithB = await exportDB(db);

			// Restore row A to simulate the "before import" state
			await db.profiles.clear();
			await db.profiles.add({
				name: 'PlayerA',
				color: '#e8a020',
				initial: 'A',
				createdAt: Date.now()
			});

			// Verify only A is present before import
			const before = await db.profiles.toArray();
			expect(before.map((p) => p.name)).toEqual(['PlayerA']);

			// Import blob containing B (replace-all)
			await importAllData(blobWithB);

			// After import, only B should remain (A is gone)
			const after = await db.profiles.toArray();
			expect(after.map((p) => p.name)).toEqual(['PlayerB']);
		});
	});
});
