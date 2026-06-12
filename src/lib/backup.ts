// src/lib/backup.ts
// Export/import backup utilities for the Daten/Backup screen (PROF-03).
// Uses the official dexie-export-import addon (same Dexie org, version 4.4.x).
//
// Security T-03-07: validateImportFile() runs peakImportFile() + databaseName check
//   BEFORE any DB write. Foreign/corrupt files are rejected with a German error
//   and change nothing.
// Security T-03-08: importInto() writes only into typed Dexie tables — no eval,
//   no Function(), no {@html}, no assignment to app prototypes.

import { exportDB, importInto, peakImportFile } from 'dexie-export-import';
import { db } from '../db/db.js';

/**
 * Exports all profiles and match history to a timestamped JSON file.
 * Triggers a browser download via a temporary Blob URL (D-10).
 * Throws on failure so the caller (Daten screen) can show inline feedback.
 */
export async function exportAllData(): Promise<void> {
	const blob = await exportDB(db);
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const date = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
	a.href = url;
	a.download = `neverman-backup-${date}.json`;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	// Defer revocation so the browser has time to start the download
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Validates that a Blob is a Neverman Darts backup before showing the D-12 confirm dialog.
 * Returns { valid: true, errorDe: null } for a valid Neverman file.
 * Returns { valid: false, errorDe: <German message> } for foreign or corrupt files.
 * Never throws — all errors are caught and returned as the German error string.
 */
export async function validateImportFile(
	blob: Blob
): Promise<{ valid: boolean; errorDe: string | null }> {
	try {
		// peakImportFile only validates the header/metadata.
		// Full schema and data validation happens inside importInto, which runs atomically.
		// clearTablesBeforeImport is safe because importInto wraps everything in one IDB transaction.
		const metadata = await peakImportFile(blob);
		if (metadata.data.databaseName !== 'NevermanDarts') {
			return { valid: false, errorDe: 'Diese Datei gehört nicht zu Neverman Darts.' };
		}
		return { valid: true, errorDe: null };
	} catch {
		return {
			valid: false,
			errorDe: 'Die Datei konnte nicht gelesen werden oder ist beschädigt.'
		};
	}
}

/**
 * Imports a backup blob into the database with replace-all semantics (D-11).
 * Clears all tables before importing so old data is completely replaced.
 * acceptVersionDiff: true is required so backups can be restored onto a
 * freshly re-installed DB at schema v1 (RESEARCH Pitfall 4).
 * Throws on failure so the caller can show inline feedback.
 */
export async function importAllData(blob: Blob): Promise<void> {
	await importInto(db, blob, {
		clearTablesBeforeImport: true,
		acceptVersionDiff: true
	});
}
