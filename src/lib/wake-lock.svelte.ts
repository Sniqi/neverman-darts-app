// src/lib/wake-lock.svelte.ts
// Screen Wake Lock API wrapper (INP-05, RESEARCH Pattern 7).
// Silently no-ops when wakeLock is unsupported or rejected (e.g. power-saver mode).
// T-03-03: try/catch ensures wake-lock failure never crashes the match view.

let sentinel: WakeLockSentinel | null = null;

/**
 * Acquire a screen wake lock.
 * No-ops silently if the API is unavailable or the request is denied.
 */
export async function acquireWakeLock(): Promise<void> {
	if (!('wakeLock' in navigator)) return;
	try {
		sentinel = await navigator.wakeLock.request('screen');
	} catch {
		// Power-saver mode, permission denied, or other rejection — acceptable.
		// Match remains fully playable without the wake lock.
	}
}

/**
 * Release the current wake lock if one is held.
 */
export async function releaseWakeLock(): Promise<void> {
	if (sentinel) {
		try {
			await sentinel.release();
		} catch {
			// Ignore release errors (sentinel may already be released by system)
		} finally {
			sentinel = null;
		}
	}
}
