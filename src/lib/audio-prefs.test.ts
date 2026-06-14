// src/lib/audio-prefs.test.ts
// Unit tests for audio-prefs localStorage helpers (AUD-03).
// Runs in the `unit` vitest project (Node environment).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAudioPrefs, saveAudioPref } from './audio-prefs.js';

// localStorage is not available in Node — stub it for the unit project.
const store: Record<string, string> = {};
const localStorageMock = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, val: string) => { store[key] = val; },
	removeItem: (key: string) => { delete store[key]; },
	clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
vi.stubGlobal('localStorage', localStorageMock);

describe('audio-prefs', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('loadAudioPrefs', () => {
		it('returns full defaults when localStorage is empty', () => {
			const prefs = loadAudioPrefs();
			expect(prefs).toEqual({
				callerEnabled: false,
				callerLang: 'en',
				sfxEnabled: false,
				pauseEnabled: true,
				pauseSets: 2,
				pauseMinutes: 8,
				callerVolume: 0.5,
				musicVolume: 0.25,
			});
		});

		it('callerEnabled is false when key is absent', () => {
			expect(loadAudioPrefs().callerEnabled).toBe(false);
		});

		it('callerEnabled is true when key is "true"', () => {
			localStorage.setItem('nvm_caller_enabled', 'true');
			expect(loadAudioPrefs().callerEnabled).toBe(true);
		});

		it('sfxEnabled is false when key is absent', () => {
			expect(loadAudioPrefs().sfxEnabled).toBe(false);
		});

		it('pauseEnabled defaults to true when key is absent', () => {
			expect(loadAudioPrefs().pauseEnabled).toBe(true);
		});

		it('pauseEnabled is false only when key is "false"', () => {
			localStorage.setItem('nvm_pause_enabled', 'false');
			expect(loadAudioPrefs().pauseEnabled).toBe(false);
		});

		it('pauseSets falls back to 2 when key is absent', () => {
			expect(loadAudioPrefs().pauseSets).toBe(2);
		});

		it('pauseMinutes falls back to 8 when key is absent', () => {
			expect(loadAudioPrefs().pauseMinutes).toBe(8);
		});

		it('reads back values written by saveAudioPref', () => {
			saveAudioPref('callerEnabled', true);
			saveAudioPref('callerLang', 'en');
			saveAudioPref('pauseSets', 3);
			saveAudioPref('pauseMinutes', 10);
			const prefs = loadAudioPrefs();
			expect(prefs.callerEnabled).toBe(true);
			expect(prefs.callerLang).toBe('en');
			expect(prefs.pauseSets).toBe(3);
			expect(prefs.pauseMinutes).toBe(10);
		});

		it('callerVolume defaults to 0.5 when key is absent', () => {
			expect(loadAudioPrefs().callerVolume).toBe(0.5);
		});

		it('musicVolume defaults to 0.25 when key is absent', () => {
			expect(loadAudioPrefs().musicVolume).toBe(0.25);
		});

		it('callerVolume reads back a saved value', () => {
			saveAudioPref('callerVolume', 0.75);
			expect(loadAudioPrefs().callerVolume).toBe(0.75);
		});

		it('musicVolume reads back a saved value', () => {
			saveAudioPref('musicVolume', 0.4);
			expect(loadAudioPrefs().musicVolume).toBe(0.4);
		});

		it('callerVolume clamps values above 1 to 1', () => {
			localStorage.setItem('nvm_caller_volume', '1.5');
			expect(loadAudioPrefs().callerVolume).toBe(1);
		});

		it('callerVolume clamps values below 0 to 0', () => {
			localStorage.setItem('nvm_caller_volume', '-0.2');
			expect(loadAudioPrefs().callerVolume).toBe(0);
		});

		it('callerVolume falls back to 0.5 when key is non-numeric', () => {
			localStorage.setItem('nvm_caller_volume', 'loud');
			expect(loadAudioPrefs().callerVolume).toBe(0.5);
		});

		it('musicVolume falls back to 0.25 when key is non-numeric', () => {
			localStorage.setItem('nvm_music_volume', 'loud');
			expect(loadAudioPrefs().musicVolume).toBe(0.25);
		});
	});

	describe('saveAudioPref', () => {
		it('writes nvm_caller_enabled = "true" for callerEnabled=true', () => {
			saveAudioPref('callerEnabled', true);
			expect(localStorage.getItem('nvm_caller_enabled')).toBe('true');
		});

		it('writes nvm_caller_enabled = "false" for callerEnabled=false', () => {
			saveAudioPref('callerEnabled', false);
			expect(localStorage.getItem('nvm_caller_enabled')).toBe('false');
		});

		it('writes nvm_pause_sets = "7" for pauseSets=7', () => {
			saveAudioPref('pauseSets', 7);
			expect(localStorage.getItem('nvm_pause_sets')).toBe('7');
		});

		it('writes nvm_pause_minutes = "12" for pauseMinutes=12', () => {
			saveAudioPref('pauseMinutes', 12);
			expect(localStorage.getItem('nvm_pause_minutes')).toBe('12');
		});

		it('writes nvm_caller_lang = "en" for callerLang="en"', () => {
			saveAudioPref('callerLang', 'en');
			expect(localStorage.getItem('nvm_caller_lang')).toBe('en');
		});

		it('writes nvm_sfx_enabled = "true" for sfxEnabled=true', () => {
			saveAudioPref('sfxEnabled', true);
			expect(localStorage.getItem('nvm_sfx_enabled')).toBe('true');
		});

		it('writes nvm_pause_enabled = "false" for pauseEnabled=false', () => {
			saveAudioPref('pauseEnabled', false);
			expect(localStorage.getItem('nvm_pause_enabled')).toBe('false');
		});

		it('writes nvm_caller_volume = "0.75" for callerVolume=0.75', () => {
			saveAudioPref('callerVolume', 0.75);
			expect(localStorage.getItem('nvm_caller_volume')).toBe('0.75');
		});

		it('writes nvm_music_volume = "0.4" for musicVolume=0.4', () => {
			saveAudioPref('musicVolume', 0.4);
			expect(localStorage.getItem('nvm_music_volume')).toBe('0.4');
		});
	});
});
