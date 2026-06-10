<script lang="ts">
	// MatchSetup.svelte — single scrollable setup screen (D-13, D-14).
	// Defaults: 501, Double Out, first-to 3 legs, sets off (D-14).
	// "Spiel starten" disabled until ≥1 player added (T-04-03, FLOW-01).
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import PlayerPicker from './PlayerPicker.svelte';
	import ProfileManager from './ProfileManager.svelte';
	import type { MatchConfig } from '../../engine/types.js';

	interface MatchPlayer {
		id: string;
		name: string;
		isGuest: boolean;
	}

	// Setup config state (D-14 defaults)
	let startScore = $state<301 | 401 | 501>(501);
	let outRule = $state<'single' | 'double'>('double');
	let legsToWin = $state(3);
	let setsEnabled = $state(false);
	let setsToWin = $state(1);

	// Player list (bound to PlayerPicker)
	let players = $state<MatchPlayer[]>([]);

	// Profile manager collapsible toggle
	let profilesOpen = $state(false);

	let canStart = $derived(players.length >= 1);

	function handleStart() {
		if (!canStart) return;
		const config: MatchConfig = { startScore, outRule, legsToWin, setsEnabled, setsToWin };
		// Store config + players in sessionStorage for the bull-off screen to read
		sessionStorage.setItem(
			'pendingMatch',
			JSON.stringify({ config, players })
		);
		goto(`${base}/bulloff`);
	}

	function adjustLegs(delta: number) {
		const next = legsToWin + delta;
		if (next >= 1 && next <= 9) legsToWin = next;
	}

	function adjustSets(delta: number) {
		const next = setsToWin + delta;
		if (next >= 1 && next <= 9) setsToWin = next;
	}
</script>

<main class="setup-screen">
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
