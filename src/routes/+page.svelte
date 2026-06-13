<script lang="ts">
	// src/routes/+page.svelte
	// Start screen hub (D-07). Replaces the bare goto('/setup') redirect.
	// Shows resume prompt when an unfinished match exists (D-01).
	// "Neues Spiel" warns before replacing a saved match (D-02).

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { loadUnfinishedMatch, clearUnfinishedMatch, requestPersistentStorage } from '../lib/storage.js';
	import { matchStore } from '../stores/match.svelte.js';
	import ResumePrompt from '../ui/start/ResumePrompt.svelte';
	import ConfirmDialog from '../ui/dialogs/ConfirmDialog.svelte';
	import ProfileManager from '../ui/setup/ProfileManager.svelte';
	import type { MatchState } from '../engine/types.js';

	// Unfinished match loaded on mount; drives conditional render of ResumePrompt
	let unfinishedMatch = $state<MatchState | null>(null);

	// New-match warning dialog visibility
	let showNewMatchWarning = $state(false);

	// Profile manager toggle
	let profilesOpen = $state(false);

	onMount(() => {
		unfinishedMatch = loadUnfinishedMatch();
		// Fire-and-forget: request persistent storage so data isn't evicted (T-03-02)
		requestPersistentStorage();
	});

	function handleResume() {
		if (!unfinishedMatch) return;
		matchStore.restore(unfinishedMatch);
		goto(`${base}/match`);
	}

	function handleDiscard() {
		clearUnfinishedMatch();
		unfinishedMatch = null;
	}

	function handleNewGame() {
		if (unfinishedMatch) {
			// Warn before replacing the saved match (D-02)
			showNewMatchWarning = true;
		} else {
			goto(`${base}/setup`);
		}
	}

	function handleNewMatchConfirm() {
		clearUnfinishedMatch();
		unfinishedMatch = null;
		showNewMatchWarning = false;
		goto(`${base}/setup`);
	}

	function handleNewMatchCancel() {
		showNewMatchWarning = false;
	}
</script>

<main class="start-screen">
	<h1 class="app-title">Neverman Darts</h1>

	{#if unfinishedMatch}
		<ResumePrompt
			match={unfinishedMatch}
			onresume={handleResume}
			ondiscard={handleDiscard}
		/>
	{/if}

	<nav class="menu" aria-label="Hauptmenü">
		<button class="menu-btn menu-btn--accent" onclick={handleNewGame}>
			Neues Spiel
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
		<button class="menu-btn" onclick={() => goto(`${base}/history`)}>
			Match-Verlauf
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
		<button class="menu-btn" onclick={() => goto(`${base}/data`)}>
			Daten / Backup
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
		<button class="menu-btn" onclick={() => goto(`${base}/stats`)}>
			Statistik
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
		<button class="menu-btn profiles-toggle" onclick={() => (profilesOpen = !profilesOpen)} aria-expanded={profilesOpen}>
			Spieler verwalten
			<span class="toggle-arrow" class:open={profilesOpen}>▼</span>
		</button>
	</nav>

	{#if profilesOpen}
		<div class="profiles-panel">
			<ProfileManager />
		</div>
	{/if}
</main>

{#if showNewMatchWarning}
	<ConfirmDialog
		heading="Es läuft noch ein Spiel"
		body="Wenn du ein neues Spiel startest, geht der aktuelle Spielstand verloren."
		ctaLabel="Verwerfen und neu starten"
		ctaStyle="destructive"
		backdropDismiss={false}
		onconfirm={handleNewMatchConfirm}
		oncancel={handleNewMatchCancel}
	/>
{/if}

<style>
	.start-screen {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--space-2xl, 48px) var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-xl, 32px);
	}

	.app-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #f0f0f0;
	}

	.menu {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg, 24px);
	}

	.menu-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 56px;
		padding: 0 var(--space-md, 16px);
		background: #1e2027;
		color: #f0f0f0;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		text-align: left;
	}

	.menu-btn--accent {
		background: #e8a020;
		color: #111318;
	}

	.menu-btn:active {
		opacity: 0.85;
	}

	.profiles-toggle {
		font-weight: 400;
	}

	.toggle-arrow {
		font-size: 12px;
		transition: transform 0.2s;
	}

	.toggle-arrow.open {
		transform: rotate(180deg);
	}

	.profiles-panel {
		padding: 0 var(--space-xs, 4px);
	}
</style>
