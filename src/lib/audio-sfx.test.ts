// src/lib/audio-sfx.test.ts
// Unit tests for playSfx (AUD-02).
// Audio is not available in Node — stub with vi.stubGlobal per VALIDATION.md.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playSfx } from './audio-sfx.js';

// Minimal Audio mock: tracks constructor calls and records volume assignment.
const mockPlay = vi.fn().mockResolvedValue(undefined);

function makeMockAudio() {
	return { play: mockPlay, volume: 1 };
}

const MockAudio = vi.fn(makeMockAudio);

beforeEach(() => {
	vi.stubGlobal('Audio', MockAudio);
	MockAudio.mockClear();
	mockPlay.mockClear();
});

describe('audio-sfx', () => {
	describe('playSfx — disabled guard (D-06)', () => {
		it('does NOT construct Audio when sfxEnabled=false', () => {
			playSfx('180', false);
			expect(MockAudio).not.toHaveBeenCalled();
		});

		it('does NOT call play() when sfxEnabled=false', () => {
			playSfx('180', false);
			expect(mockPlay).not.toHaveBeenCalled();
		});

		it('is a no-op for all event types when disabled', () => {
			playSfx('highfinish', false);
			playSfx('record', false);
			expect(MockAudio).not.toHaveBeenCalled();
		});
	});

	describe('playSfx — enabled (AUD-02)', () => {
		it('constructs Audio with /sfx/180.mp3 for "180" event', () => {
			playSfx('180', true);
			expect(MockAudio).toHaveBeenCalledWith('/sfx/180.mp3');
		});

		it('constructs Audio with /sfx/highfinish.mp3 for "highfinish" event', () => {
			playSfx('highfinish', true);
			expect(MockAudio).toHaveBeenCalledWith('/sfx/highfinish.mp3');
		});

		it('constructs Audio with /sfx/record.mp3 for "record" event', () => {
			playSfx('record', true);
			expect(MockAudio).toHaveBeenCalledWith('/sfx/record.mp3');
		});

		it('sets volume to 0.8 on the constructed Audio instance', () => {
			// Use a regular function so 'new' semantics work correctly in vitest.
			// The constructor sets this.volume; we spy on the instance via mock.instances.
			MockAudio.mockImplementationOnce(function (this: { volume: number; play: () => Promise<void> }) {
				this.volume = 1;
				this.play = mockPlay;
			});
			playSfx('180', true);
			const instance = MockAudio.mock.instances[0] as unknown as { volume: number };
			expect(instance.volume).toBe(0.8);
		});

		it('calls play() on the Audio instance', () => {
			playSfx('180', true);
			expect(mockPlay).toHaveBeenCalledOnce();
		});
	});

	describe('playSfx — no-throw guarantee', () => {
		it('does not throw when Audio constructor throws', () => {
			MockAudio.mockImplementationOnce(() => {
				throw new Error('Audio unavailable');
			});
			expect(() => playSfx('180', true)).not.toThrow();
		});

		it('does not throw when play() rejects (autoplay policy)', () => {
			mockPlay.mockRejectedValueOnce(new DOMException('NotAllowedError'));
			expect(() => playSfx('record', true)).not.toThrow();
		});
	});
});
