<script lang="ts">
	// ProfileManager.svelte — create / edit / delete persistent profiles (PROF-01).
	// Names rendered via Svelte {interpolation} only — no {@html} (T-04-01).
	import { profilesLive, createProfile, updateProfile, deleteProfile } from '../../db/profiles.js';

	const profiles = profilesLive();

	let newName = $state('');
	let createError = $state('');

	// Inline edit state
	let editingId = $state<number | null>(null);
	let editName = $state('');

	// Delete bottom-sheet state
	let deletingId = $state<number | null>(null);
	let deletingName = $state('');

	async function handleCreate() {
		const trimmed = newName.trim();
		if (!trimmed) {
			createError = 'Bitte einen Namen eingeben.';
			return;
		}
		try {
			await createProfile(trimmed);
			newName = '';
			createError = '';
		} catch {
			createError = 'Profil konnte nicht gespeichert werden.';
		}
	}

	function startEdit(id: number, name: string) {
		editingId = id;
		editName = name;
	}

	async function saveEdit() {
		if (editingId === null) return;
		const trimmed = editName.trim();
		if (!trimmed) return;
		try {
			await updateProfile(editingId, { name: trimmed });
		} catch {
			// ignore — profile list stays unchanged
		}
		editingId = null;
		editName = '';
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
	}

	function openDeleteSheet(id: number, name: string) {
		deletingId = id;
		deletingName = name;
	}

	async function confirmDelete() {
		if (deletingId === null) return;
		try {
			await deleteProfile(deletingId);
		} catch {
			// ignore
		}
		deletingId = null;
		deletingName = '';
	}

	function cancelDelete() {
		deletingId = null;
		deletingName = '';
	}
</script>

<div class="profile-manager">
	<h2>Profile</h2>

	<!-- Profile list -->
	<ul>
		{#each $profiles as profile (profile.id)}
			<li class="profile-row">
				{#if editingId === profile.id}
					<input
						type="text"
						bind:value={editName}
						onkeydown={(e) => {
							if (e.key === 'Enter') saveEdit();
							if (e.key === 'Escape') cancelEdit();
						}}
					/>
					<button onclick={saveEdit}>Speichern</button>
					<button onclick={cancelEdit}>Abbrechen</button>
				{:else}
					<span class="avatar">{profile.initial}</span>
					<span class="name">{profile.name}</span>
					<button class="icon-btn" onclick={() => startEdit(profile.id!, profile.name)} aria-label="Bearbeiten">✏️</button>
					<button class="icon-btn destructive" onclick={() => openDeleteSheet(profile.id!, profile.name)} aria-label="Profil löschen">🗑️</button>
				{/if}
			</li>
		{/each}
	</ul>

	<!-- Create new profile -->
	<div class="create-row">
		<input
			type="text"
			bind:value={newName}
			placeholder="Neues Profil"
			onkeydown={(e) => { if (e.key === 'Enter') handleCreate(); }}
		/>
		<button class="add-btn" onclick={handleCreate}>+</button>
	</div>
	{#if createError}
		<p class="error">{createError}</p>
	{/if}
</div>

<!-- Delete confirmation bottom sheet -->
{#if deletingId !== null}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="sheet-overlay" role="presentation" onclick={cancelDelete}></div>
	<div class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="delete-heading">
		<h3 id="delete-heading">Profil löschen?</h3>
		<p>Alle gespeicherten Daten für diesen Spieler gehen verloren.</p>
		<div class="sheet-actions">
			<button class="delete-btn" data-testid="confirm-delete" onclick={confirmDelete}>Löschen</button>
			<button class="cancel-btn" onclick={cancelDelete}>Abbrechen</button>
		</div>
	</div>
{/if}

<style>
	.profile-manager {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.profile-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
		min-height: 48px;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--accent);
		color: #111318;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
	}

	.name {
		flex: 1;
		font-size: 16px;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: var(--space-xs);
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		color: var(--text);
	}

	.icon-btn.destructive {
		color: var(--destructive);
	}

	.create-row {
		display: flex;
		gap: var(--space-sm);
	}

	.create-row input {
		flex: 1;
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444444;
		border-radius: 4px;
		padding: var(--space-sm);
		font-size: 16px;
	}

	.add-btn {
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444444;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 20px;
		min-width: 44px;
		min-height: 44px;
		cursor: pointer;
	}

	.error {
		color: var(--destructive);
		font-size: 14px;
		margin: 0;
	}

	input[type='text'] {
		background: var(--surface);
		color: var(--text);
		border: 1px solid #444444;
		border-radius: 4px;
		padding: var(--space-sm);
		font-size: 16px;
		flex: 1;
	}

	/* Delete bottom sheet */
	.sheet-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
	}

	.bottom-sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--surface);
		border-radius: 12px 12px 0 0;
		padding: var(--space-lg);
		z-index: 101;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.bottom-sheet h3 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	.bottom-sheet p {
		font-size: 16px;
		margin: 0;
		color: var(--text);
	}

	.sheet-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.delete-btn {
		background: var(--destructive);
		color: #f0f0f0;
		border: none;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		font-weight: 600;
		min-height: 48px;
		cursor: pointer;
	}

	.cancel-btn {
		background: #333;
		color: var(--text);
		border: none;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		min-height: 48px;
		cursor: pointer;
	}
</style>
