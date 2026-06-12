// src/lib/audio-prefs.ts
// localStorage helpers for audio and auto-pause preferences (AUD-03).
// Keys use the nvm_ prefix per project convention.
// Follows the try/catch no-throw pattern from src/lib/storage.ts.

export interface AudioPrefs {
	callerEnabled: boolean;
	callerLang: 'de' | 'en';
	sfxEnabled: boolean;
	pauseEnabled: boolean;
	pauseLegs: number;
	pauseMinutes: number;
	/** Master volume for both caller voice and SFX. Range 0..1, default 0.5. */
	audioVolume: number;
}

const DEFAULTS: AudioPrefs = {
	callerEnabled: false,   // D-06: caller OFF by default
	callerLang: 'de',
	sfxEnabled: false,      // D-06: SFX OFF by default
	pauseEnabled: true,     // D-08: auto-pause ON by default
	pauseLegs: 5,           // D-08: every 5 legs
	pauseMinutes: 8,        // D-08: 8-minute countdown
	audioVolume: 0.5,       // UAT: 50% default volume
};

const KEY_MAP: Record<keyof AudioPrefs, string> = {
	callerEnabled: 'nvm_caller_enabled',
	callerLang: 'nvm_caller_lang',
	sfxEnabled: 'nvm_sfx_enabled',
	pauseEnabled: 'nvm_pause_enabled',
	pauseLegs: 'nvm_pause_legs',
	pauseMinutes: 'nvm_pause_minutes',
	audioVolume: 'nvm_audio_volume',
};

/**
 * Reads all audio/pause preferences from localStorage.
 * Returns defaults on any failure — never throws.
 * T-05-02: all values are coerced to typed defaults before use.
 */
export function loadAudioPrefs(): AudioPrefs {
	try {
		const rawLang = localStorage.getItem(KEY_MAP.callerLang);
		const rawVolume = parseFloat(localStorage.getItem(KEY_MAP.audioVolume) ?? '');
		const audioVolume = isNaN(rawVolume) ? 0.5 : Math.min(1, Math.max(0, rawVolume));
		return {
			callerEnabled: localStorage.getItem(KEY_MAP.callerEnabled) === 'true',
			callerLang: (rawLang === 'de' || rawLang === 'en') ? rawLang : 'de',
			sfxEnabled: localStorage.getItem(KEY_MAP.sfxEnabled) === 'true',
			pauseEnabled: localStorage.getItem(KEY_MAP.pauseEnabled) !== 'false', // default true
			pauseLegs: Number(localStorage.getItem(KEY_MAP.pauseLegs)) || 5,
			pauseMinutes: Number(localStorage.getItem(KEY_MAP.pauseMinutes)) || 8,
			audioVolume,
		};
	} catch {
		return { ...DEFAULTS };
	}
}

/**
 * Persists a single audio preference to localStorage.
 * Never throws — silently ignores storage errors.
 */
export function saveAudioPref<K extends keyof AudioPrefs>(key: K, value: AudioPrefs[K]): void {
	try {
		localStorage.setItem(KEY_MAP[key], String(value));
	} catch {
		// localStorage unavailable — acceptable
	}
}
