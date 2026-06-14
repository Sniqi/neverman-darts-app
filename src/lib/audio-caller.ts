// src/lib/audio-caller.ts
// Caller audio: plays pre-generated ElevenLabs MP3s (static/sfx/caller/en/).
// Falls back to Web Speech API when the Audio constructor is unavailable
// (SSR, Node test environment) or a file fails to load/play.
// D-01/D-02: silent degradation — never throws, never blocks the scoring loop.

let cachedVoices: SpeechSynthesisVoice[] = [];

/** Clamp a volume to the valid HTMLMediaElement/SpeechSynthesis range [0, 1]. */
function clampVolume(volume: number): number {
	return Math.min(1, Math.max(0, volume));
}

/**
 * Warm the voice list once at match start (or component mount).
 * Chrome loads voices asynchronously — Pitfall 1: getVoices() returns [] on first call.
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
 */
function findVoice(langPrefix: string): SpeechSynthesisVoice | null {
	const normalized = cachedVoices.map((v) => ({
		v,
		lang: v.lang.replace(/_/g, '-'),
	}));
	const matches = normalized.filter(({ lang }) =>
		lang.toLowerCase().startsWith(langPrefix.toLowerCase())
	);
	if (matches.length === 0) return null;
	return (matches.find(({ v }) => v.localService) ?? matches[0]).v;
}

/** Speak arbitrary text via Web Speech, or no-op if unavailable / no matching voice. Never throws. */
function speak(text: string, lang: 'de' | 'en', volume: number): void {
	if (typeof speechSynthesis === 'undefined') return;
	const voice = findVoice(lang === 'de' ? 'de' : 'en');
	if (!voice) return;

	try {
		speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = lang === 'de' ? 'de-DE' : 'en-GB';
		utterance.voice = voice;
		utterance.rate = 1.1;
		utterance.volume = clampVolume(volume);
		utterance.onerror = () => {};
		speechSynthesis.speak(utterance);
	} catch {
		// Silently degrade
	}
}

/** Web Speech API fallback — same text logic as before MP3 caller was added. */
function webSpeechFallback(
	score: number,
	checkoutNumber: number | null,
	lang: 'de' | 'en',
	volume: number
): void {
	let text: string;
	if (lang === 'de') {
		text =
			checkoutNumber !== null ? `${score} — du brauchst ${checkoutNumber}` : `${score}`;
	} else {
		text = checkoutNumber !== null ? `${score} — you need ${checkoutNumber}` : `${score}`;
	}
	speak(text, lang, volume);
}

/**
 * Play "{name}" → "to throw first." → 1.5 s silence → "Game on.".
 * Re-uses the per-player name_*.mp3 plus shared throws_first.mp3 / game_on.mp3.
 * Fire-and-forget — never throws. Call once on match start when no visits thrown yet.
 */
export function announceGameStart(playerName: string, base = '', volume = 1.0): void {
	const vol = clampVolume(volume);

	const playGameOn = () => {
		setTimeout(() => {
			if (typeof Audio === 'undefined') return;
			const go = new Audio(`${base}/sfx/caller/en/game_on.mp3`);
			go.volume = vol;
			go.play().catch(() => {});
		}, 1500);
	};

	const playThrowsFirst = () => {
		const tf = new Audio(`${base}/sfx/caller/en/throws_first.mp3`);
		tf.volume = vol;
		tf.play().then(() => {
			tf.addEventListener('ended', playGameOn, { once: true });
		}).catch(playGameOn);
	};

	if (typeof Audio === 'undefined') {
		playGameOn();
		return;
	}

	// name_<name>.mp3 → throws_first.mp3 → (3s) → game_on.mp3.
	// Unknown name (no file) skips straight to game_on.
	const name = new Audio(`${base}/sfx/caller/en/name_${playerName.toLowerCase()}.mp3`);
	name.volume = vol;
	name.play().then(() => {
		name.addEventListener('ended', playThrowsFirst, { once: true });
	}).catch(playGameOn);
}

/**
 * Announce a visit score. Fire-and-forget — never throws.
 *
 * Primary path: plays score_N.mp3, then checkout_N.mp3 on 'ended'.
 * Fallback: Web Speech API (triggered when Audio is unavailable or a file fails).
 *
 * D-06: returns immediately when callerEnabled=false.
 * base: SvelteKit base path (e.g. '/neverman-darts-app') — required for GitHub Pages.
 */

export function announceVisit(
	score: number,
	checkoutNumber: number | null,
	lang: 'de' | 'en',
	callerEnabled: boolean,
	volume = 1.0,
	base = '',
	playerName = ''
): void {
	if (!callerEnabled) return;

	const vol = clampVolume(volume);

	if (typeof Audio === 'undefined') {
		webSpeechFallback(score, checkoutNumber, lang, vol);
		return;
	}

	const scoreAudio = new Audio(`${base}/sfx/caller/en/score_${score}.mp3`);
	scoreAudio.volume = vol;

	let fell = false;
	const fallback = () => {
		if (!fell) {
			fell = true;
			webSpeechFallback(score, checkoutNumber, lang, vol);
		}
	};

	const playCheckout = () => {
		const coAudio = new Audio(`${base}/sfx/caller/en/checkout_${checkoutNumber}.mp3`);
		coAudio.volume = vol;
		coAudio.play().catch(() => {});
	};

	const playNameThenCheckout = () => {
		const nameAudio = new Audio(`${base}/sfx/caller/en/name_${playerName.toLowerCase()}.mp3`);
		nameAudio.volume = vol;
		nameAudio.play().then(() => {
			nameAudio.addEventListener('ended', playCheckout, { once: true });
		}).catch(playCheckout); // no file for this name — skip straight to checkout
	};

	// error fires for 404/unsupported; catch handles autoplay-policy rejection
	scoreAudio.addEventListener('error', fallback, { once: true });
	scoreAudio.play().then(() => {
		scoreAudio.removeEventListener('error', fallback);
		if (checkoutNumber !== null) {
			scoreAudio.addEventListener(
				'ended',
				playerName ? playNameThenCheckout : playCheckout,
				{ once: true }
			);
		}
	}).catch(fallback);
}

/**
 * Announce a no-score visit (bust, or all three darts off the board).
 * Plays no_score.mp3, falling back to Web Speech. Fire-and-forget — never throws.
 * D-06: returns immediately when callerEnabled=false.
 */
export function announceNoScore(
	callerEnabled: boolean,
	lang: 'de' | 'en',
	base = '',
	volume = 1.0
): void {
	if (!callerEnabled) return;

	const vol = clampVolume(volume);
	const fallback = () => speak(lang === 'de' ? 'Kein Score' : 'No score', lang, vol);

	if (typeof Audio === 'undefined') {
		fallback();
		return;
	}

	const audio = new Audio(`${base}/sfx/caller/en/no_score.mp3`);
	audio.volume = vol;
	audio.addEventListener('error', fallback, { once: true });
	audio.play().then(() => {
		audio.removeEventListener('error', fallback);
	}).catch(fallback);
}
