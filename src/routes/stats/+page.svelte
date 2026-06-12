<script lang="ts">
	// src/routes/stats/+page.svelte
	// Lifetime statistics route (D-10, STAT-07, STAT-08).
	// Step 1: Profile picker — lists db.profiles (guests never appear here).
	// Step 2: ProfileStatDashboard for selected profile via profileStatsLive.
	// Security T-04-05: profile names via {interpolation} — never {@html}.

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { profilesLive } from '../../db/profiles.js';
	import { profileStatsLive } from '../../db/stats.js';
	import ProfileStatDashboard from '../../ui/stats/ProfileStatDashboard.svelte';

	const profiles = profilesLive();

	let selectedProfileId = $state<string | null>(null);
	let selectedProfileName = $state('');

	// Reactive stats store — recreated whenever selected profile changes
	const stats = $derived(
		selectedProfileId !== null ? profileStatsLive(selectedProfileId) : null
	);

	function selectProfile(id: string, name: string) {
		selectedProfileId = id;
		selectedProfileName = name;
	}

	function backToPicker() {
		selectedProfileId = null;
		selectedProfileName = '';
	}
</script>

<div class="screen">
	<header class="heading-bar">
		<button
			class="back-btn"
			onclick={selectedProfileId !== null ? backToPicker : () => goto(`${base}/`)}
			aria-label="Zurück"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1 class="screen-title">Statistik</h1>
	</header>

	<div class="content">
		{#if selectedProfileId === null}
			<!-- Profile picker -->
			<p class="picker-heading">Profil auswählen</p>

			{#if $profiles.length === 0}
				<div class="empty-state" role="status">
					<p class="empty-heading">Noch keine Profile.</p>
					<p class="empty-body">Erstelle ein Profil beim nächsten Spiel.</p>
				</div>
			{:else}
				<nav class="profile-list" aria-label="Profil auswählen">
					{#each $profiles as profile (profile.id)}
						<button
							class="menu-btn"
							aria-label="Statistik für {profile.name} anzeigen"
							onclick={() => selectProfile(String(profile.id), profile.name)}
						>
							{profile.name}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
								stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M9 18l6-6-6-6" />
							</svg>
						</button>
					{/each}
				</nav>
			{/if}
		{:else}
			<!-- Per-profile dashboard -->
			{#if stats !== null && $stats !== null}
				<ProfileStatDashboard stats={$stats} profileName={selectedProfileName} />
			{:else}
				<div class="loading" role="status">
					<p class="loading-text">Lade Statistiken…</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.screen {
		max-width: 480px;
		margin: 0 auto;
		min-height: 100dvh;
		background: #111318;
		color: #f0f0f0;
	}

	.heading-bar {
		display: flex;
		align-items: center;
		gap: var(--space-sm, 8px);
		height: 40px;
		padding: 0 var(--space-md, 16px);
		background: #111318;
		border-bottom: 1px solid #2d2d2d;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: transparent;
		border: none;
		color: #f0f0f0;
		cursor: pointer;
		flex-shrink: 0;
		margin-left: calc(-1 * var(--space-sm, 8px));
		outline: none;
	}

	.back-btn:focus-visible {
		outline: 2px solid #e8a020;
		outline-offset: 2px;
	}

	.back-btn:active {
		opacity: 0.7;
	}

	.screen-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #f0f0f0;
	}

	.content {
		padding: 0;
	}

	.picker-heading {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0;
		padding: var(--space-md, 16px) var(--space-md, 16px) var(--space-sm, 8px);
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		padding: 0 var(--space-md, 16px) var(--space-md, 16px);
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
		outline: none;
	}

	.menu-btn:focus-visible {
		outline: 2px solid #e8a020;
		outline-offset: 2px;
	}

	.menu-btn:active {
		opacity: 0.85;
	}

	/* Empty state */
	.empty-state {
		padding: var(--space-xl, 32px) var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100dvh - 40px);
		gap: var(--space-sm, 8px);
		text-align: center;
	}

	.empty-heading {
		font-size: 16px;
		font-weight: 400;
		margin: 0;
		color: #f0f0f0;
	}

	.empty-body {
		font-size: 14px;
		font-weight: 400;
		margin: 0;
		color: #888888;
	}

	/* Loading state */
	.loading {
		padding: var(--space-xl, 32px) var(--space-md, 16px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-text {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0;
	}
</style>
