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
				callerLang: 'de',
				sfxEnabled: false,
				pauseEnabled: true,
				pauseLegs: 5,
				pauseMinutes: 8,
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

		it('pauseLegs falls back to 5 when key is absent', () => {
			expect(loadAudioPrefs().pauseLegs).toBe(5);
		});

		it('pauseMinutes falls back to 8 when key is absent', () => {
			expect(loadAudioPrefs().pauseMinutes).toBe(8);
		});

		it('reads back values written by saveAudioPref', () => {
			saveAudioPref('callerEnabled', true);
			saveAudioPref('callerLang', 'en');
			saveAudioPref('pauseLegs', 3);
			saveAudioPref('pauseMinutes', 10);
			const prefs = loadAudioPrefs();
			expect(prefs.callerEnabled).toBe(true);
			expect(prefs.callerLang).toBe('en');
			expect(prefs.pauseLegs).toBe(3);
			expect(prefs.pauseMinutes).toBe(10);
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

		it('writes nvm_pause_legs = "7" for pauseLegs=7', () => {
			saveAudioPref('pauseLegs', 7);
			expect(localStorage.getItem('nvm_pause_legs')).toBe('7');
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
	});
});
