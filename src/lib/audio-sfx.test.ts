// src/lib/audio-sfx.test.ts
// Unit tests for playSfx (AUD-02).
// Audio is not available in Node — stub with vi.stubGlobal per VALIDATION.md.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playSfx } from './audio-sfx.js';

// Minimal Audio mock: tracks constructor calls and records volume assignment.
const mockPlay = vi.fn().mockResolvedValue(undefined);

// lastAudioInstance is set by MockAudio so tests can inspect volume after playSfx.
let lastAudioInstance: { play: typeof mockPlay; volume: number } | null = null;

const MockAudio = vi.fn(function AudioMock(this: unknown) {
	lastAudioInstance = { play: mockPlay, volume: 1 };
	return lastAudioInstance;
});

beforeEach(() => {
	vi.stubGlobal('Audio', MockAudio);
	MockAudio.mockClear();
	mockPlay.mockClear();
	lastAudioInstance = null;
});

describe('audio-sfx', () => {
	describe('playSfx — disabled guard (D-06)', () => {
		it('does NOT construct Audio when sfxEnabled=false', () => {
			playSfx('game_win', false);
			expect(MockAudio).not.toHaveBeenCalled();
		});

		it('does NOT call play() when sfxEnabled=false', () => {
			playSfx('game_win', false);
			expect(mockPlay).not.toHaveBeenCalled();
		});

		it('is a no-op for all event types when disabled', () => {
			playSfx('set_win', false);
			playSfx('pause', false);
			expect(MockAudio).not.toHaveBeenCalled();
		});
	});

	describe('playSfx — enabled (AUD-02)', () => {
		it('constructs Audio with /music/game_win.mp3 for "game_win" event', () => {
			playSfx('game_win', true);
			expect(MockAudio).toHaveBeenCalledWith('/music/game_win.mp3');
		});

		it('constructs Audio with /music/set_win.mp3 for "set_win" event', () => {
			playSfx('set_win', true);
			expect(MockAudio).toHaveBeenCalledWith('/music/set_win.mp3');
		});

		it('constructs Audio with /music/pause.mp3 for "pause" event', () => {
			playSfx('pause', true);
			expect(MockAudio).toHaveBeenCalledWith('/music/pause.mp3');
		});

		it('prepends base path when provided (AUD-02/PLAT-02 — GitHub Pages subpath)', () => {
			playSfx('game_win', true, 0.5, '/neverman-darts-app');
			expect(MockAudio).toHaveBeenCalledWith('/neverman-darts-app/music/game_win.mp3');
		});

		it('default base "" leaves URL unchanged (dev environment)', () => {
			playSfx('game_win', true, 0.5);
			expect(MockAudio).toHaveBeenCalledWith('/music/game_win.mp3');
		});

		it('sets volume to 0.8 (default) on the Audio instance', () => {
			playSfx('game_win', true);
			expect(lastAudioInstance?.volume).toBe(0.8);
		});

		it('applies a custom volume when provided', () => {
			playSfx('game_win', true, 0.5);
			expect(lastAudioInstance?.volume).toBe(0.5);
		});

		it('clamps volume above 1 to 1', () => {
			playSfx('game_win', true, 1.5);
			expect(lastAudioInstance?.volume).toBe(1);
		});

		it('clamps volume below 0 to 0', () => {
			playSfx('game_win', true, -0.3);
			expect(lastAudioInstance?.volume).toBe(0);
		});

		it('calls play() on the Audio instance', () => {
			playSfx('game_win', true);
			expect(mockPlay).toHaveBeenCalledOnce();
		});
	});

	describe('playSfx — no-throw guarantee', () => {
		it('does not throw when Audio constructor throws', () => {
			MockAudio.mockImplementationOnce(() => {
				throw new Error('Audio unavailable');
			});
			expect(() => playSfx('game_win', true)).not.toThrow();
		});

		it('does not throw when play() rejects (autoplay policy)', () => {
			mockPlay.mockRejectedValueOnce(new DOMException('NotAllowedError'));
			expect(() => playSfx('pause', true)).not.toThrow();
		});
	});
});
