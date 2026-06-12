// src/lib/audio-sfx.ts
// Fire-and-forget SFX helper for 180, high-finish, and record events (AUD-02).
// Paths are compile-time constants — never built from input (T-05-04).
// Follows the try/catch no-throw pattern from src/lib/storage.ts.

/** Compile-time map of SFX event names to their static asset paths. */
const SFX_PATHS = {
	/** Sound for a 180 visit (maximum score). */
	'180': '/sfx/180.mp3',
	/** Sound for a high finish (checkout ≥ 100). */
	highfinish: '/sfx/highfinish.mp3',
	/** Sound for a new personal record (any record type). */
	record: '/sfx/record.mp3',
} as const;

/** Union of valid SFX event identifiers. */
export type SfxEvent = keyof typeof SFX_PATHS;

/**
 * Play an SFX file. Fire-and-forget — never throws.
 * Silently skips if sfxEnabled is false (D-06).
 * Ignores autoplay-policy rejections via .catch(() => {}) (T-05-04).
 * Volume is 0.8 per UI-SPEC.
 */
export function playSfx(event: SfxEvent, sfxEnabled: boolean): void {
	if (!sfxEnabled) return;
	try {
		const audio = new Audio(SFX_PATHS[event]);
		audio.volume = 0.8;
		audio.play().catch(() => {}); // Ignore NotAllowedError (Chrome autoplay policy)
	} catch {
		// Audio constructor may throw in SSR or when Audio is unavailable — ignore
	}
}
