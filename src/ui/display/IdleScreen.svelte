<script lang="ts">
	// src/ui/display/IdleScreen.svelte
	// Waiting screen shown when no match is active (D-11).
	// Displays app name and status text, centered on dark background.
</script>

<div class="idle-screen">
	<h1 class="app-name">Neverman Darts</h1>
	<p class="status">Warte auf Match…</p>
</div>

<style>
	.idle-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100dvh;
		width: 100%;
		background: var(--bg);
		color: var(--text);
		gap: var(--space-md);
	}

	.app-name {
		font-size: 20px;
		font-weight: 600;
		line-height: 1.2;
		margin: 0;
	}

	.status {
		font-size: 16px;
		font-weight: 400;
		line-height: 1.5;
		margin: 0;
	}
</style>
