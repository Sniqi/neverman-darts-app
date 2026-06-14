// scripts/generate-caller-audio.mjs
// One-time script: generates ElevenLabs caller audio for all darts visit scores.
//
// Usage:
//   ELEVENLABS_API_KEY=<key> node scripts/generate-caller-audio.mjs
//
// Optional env vars:
//   ELEVENLABS_VOICE_ID=<id>   default: JBFqnCBsd6RMkjVDRZzb (George — deep British male)
//   ELEVENLABS_MODEL=<id>      default: eleven_turbo_v2_5 (English, fast, cheapest)
//
// Generates files into static/sfx/caller/en/:
//   score_1.mp3 … score_180.mp3            (valid 3-dart visit totals)
//   checkout_1.mp3 … checkout_170.mp3, checkout_180.mp3  ("You require N")
//   name_<name>.mp3                        (per known player)
//   throws_first.mp3, game_on.mp3          (game-start sequence)
//
// Skips existing files — safe to re-run if interrupted.
// Estimated API usage: ~2,600 characters (well within 10k free tier).
//
// NOTE: After generating, ensure vite-plugin-pwa globPatterns includes "**/*.mp3"
// so the files are precached for offline use.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';
const MODEL_ID = process.env.ELEVENLABS_MODEL ?? 'eleven_turbo_v2_5';
const OUTPUT_DIR = join(process.cwd(), 'static', 'sfx', 'caller', 'en');
const DELAY_MS = 350;
const TEST_MODE = process.argv.includes('--test');

// Scores impossible to achieve in 3 darts
const IMPOSSIBLE = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179]);

const ALL_VISIT_SCORES = Array.from({ length: 180 }, (_, i) => i + 1)
	.filter((n) => !IMPOSSIBLE.has(n));

// 1–170 plus 180: every score the engine can suggest a checkout for.
// 1 and 180 are single-out-only finishes; bogey numbers in this range
// generate unused files but keep the range simple (mirrors the engine table).
const ALL_CHECKOUT_NUMBERS = [...Array.from({ length: 170 }, (_, i) => i + 1), 180];

// One sample per tier + both checkout samples + all names
const TEST_SCORES = [26, 60, 85, 121, 140, 180];
const TEST_CHECKOUTS = [180, 141, 32, 1];

// Player names with pre-generated audio
const PLAYER_NAMES = ['Sascha', 'Peter', 'Marco'];

const VISIT_SCORES = TEST_MODE ? TEST_SCORES : ALL_VISIT_SCORES;
const CHECKOUT_NUMBERS = TEST_MODE ? TEST_CHECKOUTS : ALL_CHECKOUT_NUMBERS;

// Convert a darts score (1–180) to English words so ElevenLabs doesn't mispronounce
// numbers when exclamation marks are appended directly after digits (e.g. "85!!!").
function toWords(n) {
	const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
		'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
		'seventeen', 'eighteen', 'nineteen'];
	const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
	if (n <= 19) return ones[n];
	if (n < 100) {
		const t = tens[Math.floor(n / 10)];
		const o = ones[n % 10];
		return o ? `${t}-${o}` : t;
	}
	const rem = n % 100;
	return rem === 0 ? 'one hundred' : `one hundred and ${toWords(rem)}`;
}

// Voice settings scale with score: higher scores get more style (expressiveness)
// and lower stability (more emotional variation in delivery).
function voiceSettingsFor(score) {
	if (score === 180) return { stability: 0.20, similarity_boost: 0.75, style: 0.90, use_speaker_boost: true };
	if (score >= 140)  return { stability: 0.28, similarity_boost: 0.75, style: 0.75, use_speaker_boost: true };
	if (score >= 100)  return { stability: 0.38, similarity_boost: 0.75, style: 0.55, use_speaker_boost: true };
	if (score >= 80)   return { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true };
	if (score >= 50)   return { stability: 0.52, similarity_boost: 0.75, style: 0.18, use_speaker_boost: true };
	return                    { stability: 0.60, similarity_boost: 0.75, style: 0.05, use_speaker_boost: true };
}

// Checkout hints are informational — consistent, clear delivery
const CHECKOUT_VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true };

// Names: announcing quality, slightly warmer than checkout
const NAME_VOICE_SETTINGS = { stability: 0.50, similarity_boost: 0.75, style: 0.22, use_speaker_boost: true };

// Game start ("to throw first" / "Game on") — calm, even delivery (high stability, low style)
const GAME_START_SETTINGS = { stability: 0.70, similarity_boost: 0.75, style: 0.05, use_speaker_boost: true };

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function generateAudio(text, outputPath, voiceSettings) {
	if (await exists(outputPath)) {
		process.stdout.write('.');
		return;
	}

	const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
		method: 'POST',
		headers: {
			'xi-api-key': API_KEY,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: voiceSettings }),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`ElevenLabs ${response.status}: ${body}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	await writeFile(outputPath, buffer);
	process.stdout.write('+');
	await sleep(DELAY_MS); // rate-limit only after a real API call, not on skips
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function main() {
	if (!API_KEY) {
		console.error('Error: ELEVENLABS_API_KEY is not set.');
		process.exit(1);
	}

	await mkdir(OUTPUT_DIR, { recursive: true });

	// ── Score files ────────────────────────────────────────────────────────────
	console.log(`\nGenerating ${VISIT_SCORES.length} score files  (+new  .skip)`);
	let i = 0;
	for (const score of VISIT_SCORES) {
		const words = toWords(score);
		const text =
			score === 180 ? 'One Hundred and Eighty!!!!!' :
			score >= 140  ? `${words}!!!!!` :
			score >= 100  ? `${words}!!!!` :
			score >= 80   ? `${words}!!!` :
			score >= 50   ? `${words}!!` :
			words;
		await generateAudio(text, join(OUTPUT_DIR, `score_${score}.mp3`), voiceSettingsFor(score));
		if (++i % 40 === 0) process.stdout.write(` ${i}/${VISIT_SCORES.length}\n`);
	}
	process.stdout.write(` ${VISIT_SCORES.length}/${VISIT_SCORES.length}\n`);

	// ── Checkout files ─────────────────────────────────────────────────────────
	console.log(`\nGenerating ${CHECKOUT_NUMBERS.length} checkout files`);
	let j = 0;
	for (const n of CHECKOUT_NUMBERS) {
		await generateAudio(`You require ${toWords(n)}.`, join(OUTPUT_DIR, `checkout_${n}.mp3`), CHECKOUT_VOICE_SETTINGS);
		if (++j % 40 === 0) process.stdout.write(` ${j}/${CHECKOUT_NUMBERS.length}\n`);
	}
	process.stdout.write(` ${CHECKOUT_NUMBERS.length}/${CHECKOUT_NUMBERS.length}\n`);

	// ── Name files ────────────────────────────────────────────────────────────
	console.log(`\nGenerating ${PLAYER_NAMES.length} name files`);
	for (const name of PLAYER_NAMES) {
		await generateAudio(name, join(OUTPUT_DIR, `name_${name.toLowerCase()}.mp3`), NAME_VOICE_SETTINGS);
	}
	process.stdout.write('\n');

	// ── Game start files ───────────────────────────────────────────────────
	// Shared phrase, played after the per-player name_*.mp3: "{name} to throw first."
	console.log(`\nGenerating game start files`);
	await generateAudio('to throw first.', join(OUTPUT_DIR, 'throws_first.mp3'), GAME_START_SETTINGS);
	await generateAudio('Game on.', join(OUTPUT_DIR, 'game_on.mp3'), GAME_START_SETTINGS);
	process.stdout.write('\n');

	console.log('\nDone! Files written to static/sfx/caller/en/');
}

main().catch((err) => {
	console.error('\n' + err.message);
	process.exit(1);
});
