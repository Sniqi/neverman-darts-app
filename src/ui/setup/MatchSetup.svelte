<script lang="ts">
	// MatchSetup.svelte — single scrollable setup screen (D-13, D-14).
	// Defaults: 501, Double Out, first-to 3 legs, sets off (D-14).
	// "Spiel starten" disabled until ≥1 player added (T-04-03, FLOW-01).
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import PlayerPicker from './PlayerPicker.svelte';
	import ProfileManager from './ProfileManager.svelte';
	import ConfirmDialog from '../dialogs/ConfirmDialog.svelte';
	import { loadUnfinishedMatch, clearUnfinishedMatch } from '../../lib/storage.js';
	import { loadAudioPrefs, saveAudioPref } from '../../lib/audio-prefs.js';
	import type { MatchConfig } from '../../engine/types.js';

	// ── Audio & Pause prefs (AUD-03) — read once at module level (localStorage is sync) ──
	const audioPrefs = loadAudioPrefs();

	interface MatchPlayer {
		id: string;
		name: string;
		isGuest: boolean;
	}

	// Setup config state
	let startScore = $state<301 | 401 | 501>(301);
	let outRule = $state<'single' | 'double'>('single');
	let legsToWin = $state(3);
	let setsEnabled = $state(true);
	let setsToWin = $state(2);

	// Player list (bound to PlayerPicker)
	let players = $state<MatchPlayer[]>([]);

	// Profile manager collapsible toggle
	let profilesOpen = $state(false);

	// D-02: new-match warning when a saved unfinished match exists
	let showSavedMatchWarning = $state(false);

	let canStart = $derived(players.length >= 1);

	function proceedToStart() {
		const config: MatchConfig = { startScore, outRule, legsToWin, setsEnabled, setsToWin };
		// Store config + players in sessionStorage for the bull-off screen to read
		sessionStorage.setItem(
			'pendingMatch',
			JSON.stringify({ config, players })
		);
		goto(`${base}/bulloff`);
	}

	function handleStart() {
		if (!canStart) return;
		// D-02: warn if an unfinished match is saved before replacing it
		if (loadUnfinishedMatch() !== null) {
			showSavedMatchWarning = true;
		} else {
			proceedToStart();
		}
	}

	function handleSavedMatchConfirm() {
		clearUnfinishedMatch();
		showSavedMatchWarning = false;
		proceedToStart();
	}

	function handleSavedMatchCancel() {
		showSavedMatchWarning = false;
	}

	function adjustLegs(delta: number) {
		const next = legsToWin + delta;
		if (next >= 1 && next <= 9) legsToWin = next;
	}

	function adjustSets(delta: number) {
		const next = setsToWin + delta;
		if (next >= 1 && next <= 9) setsToWin = next;
	}

	// ── Audio & Pause state (AUD-03 / D-07) ──────────────────────────────────
	let callerEnabled = $state(audioPrefs.callerEnabled);
	let callerLang = $state<'de' | 'en'>(audioPrefs.callerLang);
	let sfxEnabled = $state(audioPrefs.sfxEnabled);
	let pauseEnabled = $state(audioPrefs.pauseEnabled);
	let pauseLegs = $state(audioPrefs.pauseLegs);
	let pauseMinutes = $state(audioPrefs.pauseMinutes);
	let audioVolume = $state(audioPrefs.audioVolume);

	function adjustPauseLegs(delta: number) {
		const next = pauseLegs + delta;
		if (next >= 1 && next <= 20) {
			pauseLegs = next;
			saveAudioPref('pauseLegs', next);
		}
	}

	function adjustPauseMinutes(delta: number) {
		const next = pauseMinutes + delta;
		if (next >= 1 && next <= 30) {
			pauseMinutes = next;
			saveAudioPref('pauseMinutes', next);
		}
	}
</script>

<main class="setup-screen">
	<button class="back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück zur Startseite">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
			stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M15 18l-6-6 6-6" />
		</svg>
		Zurück
	</button>
	<h1>Neverman Darts</h1>

	<!-- Player picker section -->
	<section>
		<PlayerPicker bind:players />
	</section>

	<!-- Profile management (collapsible) -->
	<section>
		<button class="profiles-toggle" onclick={() => (profilesOpen = !profilesOpen)} aria-expanded={profilesOpen}>
			Profile verwalten
			<span class="toggle-arrow" class:open={profilesOpen}>▼</span>
		</button>
		{#if profilesOpen}
			<ProfileManager />
		{/if}
	</section>

	<!-- Game mode chips: 301 / 401 / 501 -->
	<section>
		<h2>Spielmodus</h2>
		<div class="chip-group" role="group" aria-label="Spielmodus">
			{#each [301, 401, 501] as score}
				<button
					class="chip"
					class:active={startScore === score}
					onclick={() => (startScore = score as 301 | 401 | 501)}
					aria-pressed={startScore === score}
				>{score}</button>
			{/each}
		</div>
	</section>

	<!-- Out rule segmented control -->
	<section>
		<h2>Abwurfregel</h2>
		<div class="seg-control" role="group" aria-label="Abwurfregel">
			<button
				class="seg-btn"
				class:active={outRule === 'single'}
				onclick={() => (outRule = 'single')}
				aria-pressed={outRule === 'single'}
			>Single Out</button>
			<button
				class="seg-btn"
				class:active={outRule === 'double'}
				onclick={() => (outRule = 'double')}
				aria-pressed={outRule === 'double'}
			>Double Out</button>
		</div>
	</section>

	<!-- Format: legs stepper + optional sets -->
	<section>
		<h2>Format</h2>
		<div class="stepper-row">
			<span class="stepper-label">Legs</span>
			<div class="stepper">
				<button class="stepper-btn" onclick={() => adjustLegs(-1)} disabled={legsToWin <= 1} aria-label="Legs verringern">−</button>
				<span class="stepper-value">{legsToWin}</span>
				<button class="stepper-btn" onclick={() => adjustLegs(1)} disabled={legsToWin >= 9} aria-label="Legs erhöhen">+</button>
			</div>
		</div>

		<div class="toggle-row">
			<label class="toggle-label" for="sets-toggle">Sätze</label>
			<input
				id="sets-toggle"
				type="checkbox"
				bind:checked={setsEnabled}
				role="switch"
			/>
		</div>

		{#if setsEnabled}
			<div class="stepper-row">
				<span class="stepper-label">Sätze</span>
				<div class="stepper">
					<button class="stepper-btn" onclick={() => adjustSets(-1)} disabled={setsToWin <= 1} aria-label="Sätze verringern">−</button>
					<span class="stepper-value">{setsToWin}</span>
					<button class="stepper-btn" onclick={() => adjustSets(1)} disabled={setsToWin >= 9} aria-label="Sätze erhöhen">+</button>
				</div>
			</div>
		{/if}
	</section>

	<!-- Audio & Pause (AUD-03 / D-07) -->
	<section>
		<h2>Audio &amp; Pause</h2>

		<!-- Caller toggle -->
		<div class="toggle-row">
			<label class="toggle-label" for="caller-toggle">Anrufer</label>
			<input
				id="caller-toggle"
				type="checkbox"
				role="switch"
				aria-checked={callerEnabled}
				bind:checked={callerEnabled}
				onchange={() => saveAudioPref('callerEnabled', callerEnabled)}
			/>
		</div>

		<!-- Language seg-control — only when caller is on -->
		{#if callerEnabled}
			<div class="stepper-row">
				<span class="stepper-label">Sprache</span>
				<div class="seg-control" role="group" aria-label="Sprache">
					<button
						class="seg-btn"
						class:active={callerLang === 'de'}
						onclick={() => { callerLang = 'de'; saveAudioPref('callerLang', 'de'); }}
						aria-pressed={callerLang === 'de'}
					>Deutsch</button>
					<button
						class="seg-btn"
						class:active={callerLang === 'en'}
						onclick={() => { callerLang = 'en'; saveAudioPref('callerLang', 'en'); }}
						aria-pressed={callerLang === 'en'}
					>Englisch</button>
				</div>
			</div>
		{/if}

		<!-- SFX toggle -->
		<div class="toggle-row">
			<label class="toggle-label" for="sfx-toggle">Soundeffekte</label>
			<input
				id="sfx-toggle"
				type="checkbox"
				role="switch"
				aria-checked={sfxEnabled}
				bind:checked={sfxEnabled}
				onchange={() => saveAudioPref('sfxEnabled', sfxEnabled)}
			/>
		</div>

		<!-- Volume slider (UAT) -->
		<div class="stepper-row">
			<label class="stepper-label" for="volume-slider">Lautstärke</label>
			<input
				id="volume-slider"
				type="range"
				min="0"
				max="1"
				step="0.05"
				bind:value={audioVolume}
				oninput={() => saveAudioPref('audioVolume', audioVolume)}
				aria-label="Lautstärke"
				class="volume-slider"
			/>
			<span class="stepper-unit">{Math.round(audioVolume * 100)}%</span>
		</div>

		<!-- Auto-pause toggle -->
		<div class="toggle-row">
			<label class="toggle-label" for="pause-toggle">Automatische Pause</label>
			<input
				id="pause-toggle"
				type="checkbox"
				role="switch"
				aria-checked={pauseEnabled}
				bind:checked={pauseEnabled}
				onchange={() => saveAudioPref('pauseEnabled', pauseEnabled)}
			/>
		</div>

		<!-- Pause steppers — only when auto-pause is on -->
		{#if pauseEnabled}
			<div class="stepper-row">
				<span class="stepper-label">Pause nach</span>
				<div class="stepper">
					<button class="stepper-btn" onclick={() => adjustPauseLegs(-1)} disabled={pauseLegs <= 1} aria-label="Legs verringern">−</button>
					<span class="stepper-value">{pauseLegs}</span>
					<button class="stepper-btn" onclick={() => adjustPauseLegs(1)} disabled={pauseLegs >= 20} aria-label="Legs erhöhen">+</button>
				</div>
				<span class="stepper-unit">Legs</span>
			</div>

			<div class="stepper-row">
				<span class="stepper-label">Pausendauer</span>
				<div class="stepper">
					<button class="stepper-btn" onclick={() => adjustPauseMinutes(-1)} disabled={pauseMinutes <= 1} aria-label="Minuten verringern">−</button>
					<span class="stepper-value">{pauseMinutes}</span>
					<button class="stepper-btn" onclick={() => adjustPauseMinutes(1)} disabled={pauseMinutes >= 30} aria-label="Minuten erhöhen">+</button>
				</div>
				<span class="stepper-unit">Minuten</span>
			</div>
		{/if}
	</section>

	<!-- Start button -->
	<section>
		{#if !canStart}
			<p class="validation-hint">Mindestens 1 Spieler erforderlich</p>
		{/if}
		<button
			class="start-btn"
			onclick={handleStart}
			disabled={!canStart}
			aria-disabled={!canStart}
		>Spiel starten</button>
	</section>
</main>

{#if showSavedMatchWarning}
	<ConfirmDialog
		heading="Es läuft noch ein Spiel"
		body="Wenn du ein neues Spiel startest, geht der aktuelle Spielstand verloren."
		ctaLabel="Verwerfen und neu starten"
		ctaStyle="destructive"
		backdropDismiss={false}
		onconfirm={handleSavedMatchConfirm}
		oncancel={handleSavedMatchCancel}
	/>
{/if}

<style>
	.setup-screen {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
		padding-bottom: var(--space-2xl);
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		color: #888;
		font-size: 15px;
		cursor: pointer;
		padding: 0;
		margin-bottom: calc(-1 * var(--space-md, 12px));
	}

	.back-btn:active {
		opacity: 0.7;
	}

	h1 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	/* Mode chips */
	.chip-group {
		display: flex;
		gap: var(--space-sm);
	}

	.chip {
		flex: 1;
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444;
		border-radius: 4px;
		padding: var(--space-sm);
		font-size: 16px;
		min-height: 48px;
		cursor: pointer;
		font-weight: 400;
	}

	.chip.active {
		background: var(--accent);
		color: #111318;
		border-color: var(--accent);
		font-weight: 600;
	}

	/* Segmented control */
	.seg-control {
		display: flex;
	}

	.seg-btn {
		flex: 1;
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		min-height: 48px;
		cursor: pointer;
	}

	.seg-btn:first-child {
		border-radius: 4px 0 0 4px;
	}

	.seg-btn:last-child {
		border-radius: 0 4px 4px 0;
		border-left: none;
	}

	.seg-btn.active {
		background: var(--accent);
		color: #111318;
		border-color: var(--accent);
		font-weight: 600;
	}

	/* Steppers */
	.stepper-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
	}

	.stepper-label {
		font-size: 16px;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.stepper-btn {
		width: 44px;
		height: 44px;
		background: #333;
		color: var(--text);
		border: none;
		border-radius: 4px;
		font-size: 20px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stepper-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.stepper-value {
		font-size: 20px;
		font-weight: 600;
		min-width: 24px;
		text-align: center;
	}

	.stepper-unit {
		font-size: 14px;
		color: #888;
		min-width: 48px;
	}

	/* Sets toggle */
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
	}

	.toggle-label {
		font-size: 16px;
	}

	input[type='checkbox'] {
		width: 44px;
		height: 24px;
		cursor: pointer;
	}

	/* Start button */
	.start-btn {
		width: 100%;
		background: var(--accent);
		color: #111318;
		border: none;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 18px;
		font-weight: 600;
		min-height: 56px;
		cursor: pointer;
	}

	.start-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.validation-hint {
		font-size: 14px;
		color: #888;
		margin: 0;
		text-align: center;
	}

	/* Volume slider (UAT) */
	.volume-slider {
		flex: 1;
		height: 44px;
		accent-color: #e8a020;
		cursor: pointer;
		min-width: 0;
	}

	/* Profile manager toggle */
	.profiles-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		min-height: 48px;
		cursor: pointer;
		text-align: left;
	}

	.toggle-arrow {
		font-size: 12px;
		transition: transform 0.2s;
	}

	.toggle-arrow.open {
		transform: rotate(180deg);
	}
</style>
