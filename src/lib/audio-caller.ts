// src/lib/audio-caller.ts
// Web Speech API caller: voice selection, announcement, silent fallback (AUD-01).
// D-01: uses speechSynthesis, no external TTS service.
// D-02: silently degrades when speechSynthesis is unavailable or no matching voice.
// T-05-01: only computed numeric scores and getSuggestion() output reach utterance.text.

let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Warm the voice list once at match start (or component mount).
 * Chrome loads voices asynchronously — Pitfall 1: getVoices() returns [] on first call.
 * Register onvoiceschanged to re-cache when the async load completes.
 * Never throws.
 */
export function initVoices(): void {
	if (typeof speechSynthesis === 'undefined') return;
	cachedVoices = speechSynthesis.getVoices();
	if ('onvoiceschanged' in speechSynthesis) {
		speechSynthesis.onvoiceschanged = () => {
			cachedVoices = speechSynthesis.getVoices();
		};
	}
}

/**
 * Select the best available voice for the given BCP-47 language prefix.
 * Pitfall 2: Android returns lang strings with underscores (e.g. "de_DE") — normalize.
 * Prefers localService voices (offline-capable for PWA).
 * Returns null when no matching voice exists — caller degrades silently (D-02).
 */
function findVoice(langPrefix: string): SpeechSynthesisVoice | null {
	const normalized = cachedVoices.map(v => ({
		v,
		lang: v.lang.replace(/_/g, '-'),
	}));
	const matches = normalized.filter(({ lang }) =>
		lang.toLowerCase().startsWith(langPrefix.toLowerCase())
	);
	if (matches.length === 0) return null;
	return (matches.find(({ v }) => v.localService) ?? matches[0]).v;
}

/**
 * Announce a visit score via speech synthesis. Fire-and-forget — never throws.
 * Must be called from a user-gesture context (tap/click handler chain) — Pitfall 4.
 *
 * D-03: appends German checkout hint ("du brauchst …") when suggestion is non-null.
 * D-02: returns silently when speechSynthesis is unavailable or no matching voice.
 * D-06: returns immediately when callerEnabled=false.
 * T-05-01: utterance text is built from numeric score and getSuggestion() output only.
 */
export function announceVisit(
	score: number,
	suggestion: string[] | null,
	lang: 'de' | 'en',
	callerEnabled: boolean
): void {
	if (!callerEnabled) return;
	if (typeof speechSynthesis === 'undefined') return;

	const voice = findVoice(lang === 'de' ? 'de' : 'en');
	if (!voice) return; // D-02: silent fallback when no matching voice

	const langTag = lang === 'de' ? 'de-DE' : 'en-GB';
	let text: string;
	if (lang === 'de') {
		text = suggestion
			? `${score} — du brauchst ${suggestion.join(', ')}`
			: `${score}`;
	} else {
		text = suggestion
			? `${score} — you need ${suggestion.join(', ')}`
			: `${score}`;
	}

	try {
		speechSynthesis.cancel(); // Clear queued utterances from rapid scoring (T-05-03)
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = langTag;
		utterance.voice = voice;
		utterance.rate = 1.1; // Slightly faster for caller feel
		utterance.onerror = () => {}; // Silence "interrupted" errors from cancel()
		speechSynthesis.speak(utterance);
	} catch {
		// Silently degrade — never block the scoring loop
	}
}
