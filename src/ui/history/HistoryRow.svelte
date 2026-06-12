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
		border-bottom: 1px solid #2d2d2d;
	}

	.row-item:last-child {
		border-bottom: none;
	}

	.row {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 64px;
		padding: var(--space-sm, 8px) var(--space-md, 16px);
		background: #1e2027;
		border: none;
		color: #f0f0f0;
		cursor: pointer;
		text-align: left;
		gap: var(--space-sm, 8px);
	}

	.row:active {
		background: #2d2d35;
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
		color: #888888;
	}

	.result {
		font-size: 16px;
		font-weight: 600;
		color: #f0f0f0;
	}

	.row-names {
		font-size: 16px;
		line-height: 1.5;
	}

	.winner-name {
		font-weight: 600;
		color: #e8a020;
	}

	.separator {
		font-weight: 400;
		color: #f0f0f0;
	}

	.other-name {
		font-weight: 400;
		color: #f0f0f0;
	}

	.row-format {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
	}

	.chevron {
		font-size: 14px;
		color: #888888;
		flex-shrink: 0;
	}
</style>
