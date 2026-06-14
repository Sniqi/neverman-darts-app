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
	/** Volume for the caller voice. Range 0..1, default 0.5. */
	callerVolume: number;
	/** Volume for music (game_win, set_win, pause). Range 0..1, default 0.5. */
	musicVolume: number;
}

const DEFAULTS: AudioPrefs = {
	callerEnabled: false,   // D-06: caller OFF by default
	callerLang: 'en',
	sfxEnabled: false,      // D-06: music OFF by default
	pauseEnabled: true,     // D-08: auto-pause ON by default
	pauseLegs: 5,           // D-08: every 5 legs
	pauseMinutes: 8,        // D-08: 8-minute countdown
	callerVolume: 0.5,
	musicVolume: 0.25,
};

const KEY_MAP: Record<keyof AudioPrefs, string> = {
	callerEnabled: 'nvm_caller_enabled',
	callerLang: 'nvm_caller_lang',
	sfxEnabled: 'nvm_sfx_enabled',
	pauseEnabled: 'nvm_pause_enabled',
	pauseLegs: 'nvm_pause_legs',
	pauseMinutes: 'nvm_pause_minutes',
	callerVolume: 'nvm_caller_volume',
	musicVolume: 'nvm_music_volume',
};

/**
 * Reads all audio/pause preferences from localStorage.
 * Returns defaults on any failure — never throws.
 */
export function loadAudioPrefs(): AudioPrefs {
	try {
		const rawLang = localStorage.getItem(KEY_MAP.callerLang);
		const rawCaller = parseFloat(localStorage.getItem(KEY_MAP.callerVolume) ?? '');
		const rawMusic = parseFloat(localStorage.getItem(KEY_MAP.musicVolume) ?? '');
		const clamp = (v: number, fb: number) => isNaN(v) ? fb : Math.min(1, Math.max(0, v));
		return {
			callerEnabled: localStorage.getItem(KEY_MAP.callerEnabled) === 'true',
			callerLang: (rawLang === 'de' || rawLang === 'en') ? rawLang : 'en',
			sfxEnabled: localStorage.getItem(KEY_MAP.sfxEnabled) === 'true',
			pauseEnabled: localStorage.getItem(KEY_MAP.pauseEnabled) !== 'false',
			pauseLegs: Number(localStorage.getItem(KEY_MAP.pauseLegs)) || 5,
			pauseMinutes: Number(localStorage.getItem(KEY_MAP.pauseMinutes)) || 8,
			callerVolume: clamp(rawCaller, DEFAULTS.callerVolume),
			musicVolume: clamp(rawMusic, DEFAULTS.musicVolume),
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
