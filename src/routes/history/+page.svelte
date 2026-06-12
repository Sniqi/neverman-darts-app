<script lang="ts">
	// src/routes/history/+page.svelte
	// Match history list (STAT-06, D-04, D-06).
	// Displays completed matches newest-first via liveQuery readable.
	// Security T-03-05: player names rendered via HistoryRow {interpolation} — no {@html}.

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { matchesLive } from '../../db/matches.js';
	import HistoryRow from '../../ui/history/HistoryRow.svelte';

	const matches = matchesLive();
</script>

<div class="screen">
	<header class="heading-bar">
		<button class="back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1 class="screen-title">Match-Verlauf</h1>
	</header>

	<div class="content">
		{#if $matches.length === 0}
			<div class="empty-state">
				<p class="empty-heading">Noch keine Spiele.</p>
				<p class="empty-body">Spiele ein Match und es erscheint hier.</p>
			</div>
		{:else}
			<ul class="match-list">
				{#each $matches as record (record.id)}
					<HistoryRow {record} />
				{/each}
			</ul>
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

	/* Match list */
	.match-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
