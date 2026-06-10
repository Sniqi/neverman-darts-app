<script lang="ts">
	// PlayerPicker.svelte — select from profiles or add a guest (PROF-02).
	// Guests carry isGuest:true and are NOT written to db.profiles (T-04-04).
	import { profilesLive } from '../../db/profiles.js';
	import type { Profile } from '../../db/db.js';

	// Added match participants (bound from parent MatchSetup)
	interface MatchPlayer {
		id: string;
		name: string;
		isGuest: boolean;
	}

	let { players = $bindable<MatchPlayer[]>([]) }: { players: MatchPlayer[] } = $props();

	const profiles = profilesLive();

	let showPicker = $state(false);
	let guestCount = $state(0);

	function addFromProfile(profile: Profile) {
		if (players.length >= 4) return;
		// Avoid adding the same profile twice
		if (players.some((p) => p.id === String(profile.id))) return;
		players = [
			...players,
			{ id: String(profile.id), name: profile.name, isGuest: false }
		];
		showPicker = false;
	}

	function addGuest() {
		if (players.length >= 4) return;
		guestCount += 1;
		const id = `guest-${guestCount}`;
		players = [...players, { id, name: `Gast ${guestCount}`, isGuest: true }];
		showPicker = false;
	}

	function removePlayer(id: string) {
		players = players.filter((p) => p.id !== id);
	}
</script>

<div class="player-picker">
	<h3>Spieler</h3>

	{#if players.length === 0}
		<div class="empty-state">
			<p class="empty-heading">Spieler hinzufügen</p>
			<p class="empty-body">Tippe auf + um ein Profil zu wählen oder einen Gast hinzuzufügen.</p>
		</div>
	{/if}

	<!-- Added players list -->
	<ul class="player-list">
		{#each players as player (player.id)}
			<li class="player-row">
				<span class="avatar">{player.name[0]?.toUpperCase() ?? '?'}</span>
				<span class="name">{player.name}</span>
				{#if player.isGuest}
					<span class="guest-badge">Gast</span>
				{/if}
				<button
					class="remove-btn"
					onclick={() => removePlayer(player.id)}
					aria-label="Spieler entfernen"
				>×</button>
			</li>
		{/each}
	</ul>

	<!-- Add player button (hidden when max 4 reached) -->
	{#if players.length < 4}
		<button class="add-player-btn" onclick={() => (showPicker = !showPicker)}>
			Spieler hinzufügen
		</button>
	{/if}

	<!-- Profile/guest picker dropdown -->
	{#if showPicker}
		<div class="picker-panel">
			{#if $profiles.length > 0}
				<p class="picker-section-label">Profile</p>
				<ul class="picker-list">
					{#each $profiles as profile (profile.id)}
						{@const alreadyAdded = players.some((p) => p.id === String(profile.id))}
						<li>
							<button
								class="picker-item"
								disabled={alreadyAdded}
								onclick={() => addFromProfile(profile)}
							>
								<span class="avatar small">{profile.initial}</span>
								<span>{profile.name}</span>
								{#if alreadyAdded}
									<span class="added-badge">✓</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<p class="picker-section-label">Gast</p>
			<button class="picker-item guest-btn" onclick={addGuest}>
				<span class="avatar small">G</span>
				<span>Gast hinzufügen</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.player-picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	h3 {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
	}

	.empty-state {
		background: var(--surface);
		padding: var(--space-md);
		border-radius: 4px;
		text-align: center;
	}

	.empty-heading {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 var(--space-xs);
	}

	.empty-body {
		font-size: 14px;
		margin: 0;
		color: #aaa;
	}

	.player-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: var(--surface);
		padding: var(--space-sm) var(--space-md);
		border-radius: 4px;
		min-height: 56px;
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent);
		color: #111318;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
	}

	.avatar.small {
		width: 28px;
		height: 28px;
		font-size: 14px;
	}

	.name {
		flex: 1;
		font-size: 16px;
	}

	.guest-badge {
		font-size: 12px;
		color: #aaa;
		background: #333;
		padding: 2px 6px;
		border-radius: 10px;
	}

	.remove-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text);
		font-size: 20px;
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-player-btn {
		background: var(--surface);
		color: var(--text);
		border: 1px dashed #444;
		border-radius: 4px;
		padding: var(--space-sm) var(--space-md);
		font-size: 16px;
		min-height: 48px;
		cursor: pointer;
		text-align: left;
	}

	.picker-panel {
		background: var(--surface);
		border: 1px solid #444;
		border-radius: 4px;
		padding: var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.picker-section-label {
		font-size: 12px;
		color: #888;
		margin: var(--space-xs) 0 2px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.picker-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.picker-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text);
		font-size: 16px;
		padding: var(--space-sm);
		border-radius: 4px;
		min-height: 48px;
		text-align: left;
	}

	.picker-item:hover:not(:disabled) {
		background: #2a2d35;
	}

	.picker-item:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.added-badge {
		margin-left: auto;
		color: var(--accent);
	}

	.guest-btn {
		border-top: 1px solid #333;
		margin-top: var(--space-xs);
	}
</style>
