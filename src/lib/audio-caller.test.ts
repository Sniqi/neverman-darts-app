// src/lib/audio-caller.test.ts
// Unit tests for audio-caller Web Speech wrapper (AUD-01).
// Runs in the `unit` vitest project (Node environment).
// speechSynthesis and SpeechSynthesisUtterance are not available in Node —
// stubbed per 05-VALIDATION.md test infrastructure note.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initVoices, announceVisit } from './audio-caller.js';

// ── SpeechSynthesisUtterance stub ─────────────────────────────────────────────
// Captures the constructor arg and property assignments so tests can assert
// what text/lang/voice/volume was set.
class MockUtterance {
	text: string;
	lang: string = '';
	voice: SpeechSynthesisVoice | null = null;
	rate: number = 1;
	volume: number = 1;
	onerror: (() => void) | null = null;

	constructor(text: string) {
		this.text = text;
	}
}

function makeVoice(lang: string, localService = false): SpeechSynthesisVoice {
	return { lang, localService, name: `Voice-${lang}`, voiceURI: '', default: false } as unknown as SpeechSynthesisVoice;
}

const mockSpeak = vi.fn();
const mockCancel = vi.fn();
const mockGetVoices = vi.fn<() => SpeechSynthesisVoice[]>(() => []);

describe('audio-caller', () => {
	beforeEach(() => {
		mockSpeak.mockClear();
		mockCancel.mockClear();
		mockGetVoices.mockClear();

		vi.stubGlobal('speechSynthesis', {
			speak: mockSpeak,
			cancel: mockCancel,
			getVoices: mockGetVoices,
			onvoiceschanged: null,
		});
		vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

		// Reset module-level voice cache by re-calling initVoices with empty list
		mockGetVoices.mockReturnValue([]);
		initVoices();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('announceVisit — disabled guard', () => {
		it('does NOT call speak when callerEnabled=false', () => {
			mockGetVoices.mockReturnValue([makeVoice('de-DE', true)]);
			initVoices();

			announceVisit(140, null, 'de', false);

			expect(mockSpeak).not.toHaveBeenCalled();
		});
	});

	describe('announceVisit — enabled with German voice', () => {
		beforeEach(() => {
			mockGetVoices.mockReturnValue([makeVoice('de-DE', true)]);
			initVoices();
		});

		it('calls speak once when callerEnabled=true and a de voice exists', () => {
			announceVisit(140, null, 'de', true);
			expect(mockSpeak).toHaveBeenCalledOnce();
		});

		it('utterance text contains the score when no checkoutNumber', () => {
			announceVisit(140, null, 'de', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toContain('140');
		});

		it('utterance text contains score AND remaining number when checkoutNumber provided', () => {
			announceVisit(60, 121, 'de', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toContain('60');
			expect(utterance.text).toContain('du brauchst');
			expect(utterance.text).toContain('121');
		});

		it('utterance text does NOT contain dart notation (T20, D14 etc) — speaks number only', () => {
			announceVisit(60, 121, 'de', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).not.toContain('T20');
			expect(utterance.text).not.toContain('D14');
		});

		it('calls cancel before speak (clears queue)', () => {
			announceVisit(100, null, 'de', true);
			expect(mockCancel).toHaveBeenCalledBefore(mockSpeak);
		});

		it('applies volume to the utterance', () => {
			announceVisit(140, null, 'de', true, 0.6);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.volume).toBe(0.6);
		});

		it('clamps volume above 1 to 1', () => {
			announceVisit(140, null, 'de', true, 1.5);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.volume).toBe(1);
		});

		it('clamps volume below 0 to 0', () => {
			announceVisit(140, null, 'de', true, -0.2);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.volume).toBe(0);
		});
	});

	describe('announceVisit — enabled with English voice', () => {
		beforeEach(() => {
			mockGetVoices.mockReturnValue([makeVoice('en-GB', false)]);
			initVoices();
		});

		it('utterance text contains "you need" and remaining number for English with checkoutNumber', () => {
			announceVisit(100, 141, 'en', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toContain('you need');
			expect(utterance.text).toContain('141');
		});
	});

	describe('findVoice — Android lang normalization (Pitfall 2)', () => {
		it('matches a voice with underscore lang "de_DE" when lang prefix is "de"', () => {
			// Android returns "de_DE" (underscore) — must be normalized to "de-DE"
			mockGetVoices.mockReturnValue([makeVoice('de_DE', false)]);
			initVoices();

			announceVisit(60, null, 'de', true);

			// speak IS called — underscore voice was matched after normalization
			expect(mockSpeak).toHaveBeenCalledOnce();
		});
	});

	describe('silent fallback (D-02)', () => {
		it('does NOT call speak when no matching voice exists', () => {
			// Only an English voice available, but caller lang is 'de'
			mockGetVoices.mockReturnValue([makeVoice('en-GB', true)]);
			initVoices();

			announceVisit(60, null, 'de', true);

			expect(mockSpeak).not.toHaveBeenCalled();
		});

		it('does not throw when no matching voice exists', () => {
			mockGetVoices.mockReturnValue([]);
			initVoices();

			expect(() => announceVisit(60, null, 'de', true)).not.toThrow();
		});

		it('does not throw when speechSynthesis is undefined', () => {
			vi.stubGlobal('speechSynthesis', undefined);

			expect(() => announceVisit(60, null, 'de', true)).not.toThrow();
		});
	});

	describe('announceVisit — checkout hint is remaining number, not dart route', () => {
		beforeEach(() => {
			mockGetVoices.mockReturnValue([makeVoice('de-DE', true)]);
			initVoices();
		});

		it('DE: speaks the remaining number in the hint', () => {
			announceVisit(81, 100, 'de', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toBe('81 — du brauchst 100');
		});

		it('EN: speaks the remaining number in the hint', () => {
			mockGetVoices.mockReturnValue([makeVoice('en-GB', false)]);
			initVoices();
			announceVisit(81, 100, 'en', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toBe('81 — you need 100');
		});

		it('no hint when checkoutNumber is null', () => {
			announceVisit(140, null, 'de', true);
			const utterance = mockSpeak.mock.calls[0][0] as MockUtterance;
			expect(utterance.text).toBe('140');
		});
	});
});
