<script lang="ts">
	// Skeleton setup route: real Dexie write + reactive read (PROF-01 partial).
	// Plan 04 replaces this with the full MatchSetup flow.
	import { readable } from 'svelte/store';
	import { liveQuery } from 'dexie';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { db, type Profile } from '../../db/db';

	let name = $state('');
	let dbError = $state(false);

	// liveQuery → readable wrapper (RESEARCH Pattern 6) — no extra package
	const profiles = readable<Profile[]>([], (set) => {
		const subscription = liveQuery(() => db.profiles.toArray()).subscribe({
			next: set,
			error: () => {
				dbError = true;
			}
		});
		return () => subscription.unsubscribe();
	});

	async function addPlayer() {
		const trimmed = name.trim();
		if (!trimmed) return;
		try {
			await db.profiles.add({
				name: trimmed,
				color: '#e8a020',
				initial: trimmed[0].toUpperCase(),
				createdAt: Date.now()
			});
			name = '';
		} catch {
			// Dexie open/write failure (private browsing, quota) — app keeps
			// working without persisted profiles (T-01-02); inline error only.
			dbError = true;
		}
	}
</script>

<main>
	<h1>Neverman Darts</h1>

	<label>
		Spielername
		<input type="text" bind:value={name} placeholder="Name eingeben" />
	</label>
	<button onclick={addPlayer}>Spieler hinzufügen</button>

	{#if dbError}
		<p class="error">Profile können nicht gespeichert werden (Speicher nicht verfügbar).</p>
	{/if}

	<ul>
		{#each $profiles as profile (profile.id)}
			<li>{profile.name}</li>
		{/each}
	</ul>

	<button class="start" onclick={() => goto(`${base}/match`)}>Spiel starten</button>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	h1 {
		font-size: 20px;
		font-weight: 600;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	input {
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444444;
		border-radius: 4px;
		padding: var(--space-sm);
		font-size: 16px;
	}
	button {
		background: var(--surface);
		color: var(--text);
		border: none;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		min-height: 44px;
		cursor: pointer;
	}
	button.start {
		background: var(--accent);
		color: #111318;
		font-weight: 600;
	}
	.error {
		color: var(--destructive);
		font-size: 14px;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	li {
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
	}
</style>
