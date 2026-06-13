// src/lib/storage.ts
// localStorage utilities for crash-resume detection and storage health.
// Plan 03-01, Task 1 (FLOW-03).
//
// LS_SNAPSHOT is the single source of truth in sync-constants.ts.
// Re-exported here so existing imports of LS_SNAPSHOT from storage.ts
// continue to work without changes (DATA/SYNC — eliminate duplicate literal).

import type { MatchState } from '../engine/types.js';
import { LS_SNAPSHOT } from './sync-constants.js';
export { LS_SNAPSHOT };

/**
 * Returns the persisted MatchState if an unfinished match exists (phase
 * 'playing' or 'leg-complete'), otherwise null.
 *
 * A 'match-complete' snapshot is written after the winning dart and must NOT
 * trigger a resume prompt (RESEARCH Pitfall 2).
 *
 * Never throws — corrupt JSON or a missing key returns null.
 */
export function loadUnfinishedMatch(): MatchState | null {
	// Mirror display.svelte.ts lines 33-40: parse inside try/catch
	try {
		const raw = localStorage.getItem(LS_SNAPSHOT);
		if (!raw) return null;
		const state = JSON.parse(raw) as MatchState;
		if (state.phase === 'playing' || state.phase === 'leg-complete') {
			return state;
		}
		return null;
	} catch {
		// Corrupt or invalid JSON — treat as no saved match
		return null;
	}
}

/**
 * Removes the unfinished-match snapshot from localStorage.
 * Non-fatal — never throws.
 */
export function clearUnfinishedMatch(): void {
	try {
		localStorage.removeItem(LS_SNAPSHOT);
	} catch {
		// localStorage unavailable — acceptable
	}
}

/**
 * Requests persistent (non-evictable) storage from the browser.
 * Fire-and-forget — never throws, non-fatal.
 * Guard matches wake-lock.svelte.ts capability-check pattern.
 */
export async function requestPersistentStorage(): Promise<void> {
	if (!navigator.storage?.persist) return;
	try {
		await navigator.storage.persist();
	} catch {
		// Permission denied or API unavailable — acceptable
	}
}

/**
 * Returns a German warning string when storage usage exceeds 80%, else null.
 * Consumed by the Daten / Backup screen (Plan 03).
 * Never throws.
 */
export async function getStorageWarning(): Promise<string | null> {
	if (!navigator.storage?.estimate) return null;
	try {
		const { usage = 0, quota = 0 } = await navigator.storage.estimate();
		if (quota === 0) return null;
		const pct = Math.round((usage / quota) * 100);
		if (pct > 80) {
			return `Speicher fast voll (${pct}% belegt). Bitte Daten exportieren und alte Matches löschen.`;
		}
		return null;
	} catch {
		return null;
	}
}
