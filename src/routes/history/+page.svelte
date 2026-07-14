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
		<button class="btn btn--ghost btn--icon back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
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
		max-width: 520px;
		margin: 0 auto;
		min-height: 100dvh;
		background: var(--bg);
		color: var(--text);
	}

	.heading-bar {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		height: 40px;
		padding: 0 var(--space-md);
		background: var(--bg);
		border-bottom: 1px solid var(--surface-3);
	}

	.back-btn {
		margin-left: calc(-1 * var(--space-sm));
	}

	.screen-title {
		font-size: var(--text-xl);
		font-weight: 600;
		margin: 0;
		color: var(--text);
	}

	.content {
		padding: 0;
	}

	/* Empty state */
	.empty-state {
		padding: var(--space-xl) var(--space-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100dvh - 40px);
		gap: var(--space-sm);
		text-align: center;
	}

	.empty-heading {
		font-size: 16px;
		font-weight: 400;
		margin: 0;
		color: var(--text);
	}

	.empty-body {
		font-size: 14px;
		font-weight: 400;
		margin: 0;
		color: var(--text-muted);
	}

	/* Match list */
	.match-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: var(--edge-highlight);
	}
</style>
