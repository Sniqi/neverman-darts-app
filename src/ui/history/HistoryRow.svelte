<script lang="ts">
	// src/ui/history/HistoryRow.svelte
	// Single history list row (D-04).
	// Shows: date (left) + result (right), player names (winner accent), format subtitle, trailing chevron.
	// Security T-03-05: all player names/stats via {interpolation} — no {@html}.

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { toHistoryRow } from '../../db/matches.js';
	import type { MatchRecord } from '../../db/db.js';

	interface Props {
		record: MatchRecord;
	}

	let { record }: Props = $props();

	const row = $derived(toHistoryRow(record));

	function navigate() {
		if (record.id == null) return;
		goto(`${base}/history/${record.id}`);
	}
</script>

<li class="row-item">
	<button class="row" onclick={navigate} aria-label="Match vom {row.date} öffnen">
		<div class="row-main">
			<div class="row-top">
				<span class="date">{row.date}</span>
				{#if row.otherNames.length === 1}
					<span class="result">{row.result}</span>
				{/if}
			</div>
			<div class="row-names">
				{#if row.otherNames.length === 1}
					<!-- 2-player: [Winner accent] · [Loser] (result shown in top-right) -->
					<span class="winner-name">{row.winnerName}</span>
					<span class="separator"> · </span>
					<span class="other-name">{row.otherNames[0]}</span>
				{:else}
					<!-- 3-4 player: [Winner accent] gewinnt — n Legs -->
					<span class="winner-name">{row.winnerName}</span>
					<span class="other-name"> gewinnt — {row.result}</span>
				{/if}
			</div>
			<div class="row-format">{row.format}</div>
		</div>
		<span class="chevron" aria-hidden="true">›</span>
	</button>
</li>

<style>
	.row-item {
		list-style: none;
		margin: 0;
		padding: 0;
		border-bottom: 1px solid var(--line-strong);
	}

	.row-item:last-child {
		border-bottom: none;
	}

	.row {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 64px;
		padding: var(--space-sm) var(--space-md);
		background: var(--surface);
		border: none;
		color: var(--text);
		cursor: pointer;
		text-align: left;
		gap: var(--space-sm);
	}

	.row:active {
		background: var(--surface-3);
	}

	.row-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.row-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.date {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-muted);
	}

	.result {
		font-size: 16px;
		font-weight: 600;
		color: var(--text);
	}

	.row-names {
		font-size: 16px;
		line-height: 1.5;
	}

	.winner-name {
		font-weight: 600;
		color: var(--accent);
	}

	.separator {
		font-weight: 400;
		color: var(--text);
	}

	.other-name {
		font-weight: 400;
		color: var(--text);
	}

	.row-format {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-muted);
	}

	.chevron {
		font-size: 14px;
		color: var(--text-muted);
		flex-shrink: 0;
	}
</style>
