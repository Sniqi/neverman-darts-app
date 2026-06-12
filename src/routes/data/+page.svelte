<script lang="ts">
	// src/routes/data/+page.svelte
	// Daten / Backup screen — shell (Plan 03-01, Task 2).
	// Filled in by Plan 03-03 with export/import functionality.

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
</script>

<div class="screen">
	<header class="heading-bar">
		<button class="back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1 class="screen-title">Daten / Backup</h1>
	</header>

	<div class="content">
		<p class="placeholder">Wird in Plan 03-03 implementiert.</p>
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
		padding: var(--space-xl, 32px) var(--space-md, 16px);
	}

	.placeholder {
		font-size: 14px;
		color: #888888;
		margin: 0;
	}
</style>
