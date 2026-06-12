<script lang="ts">
	// src/routes/history/[id]/+page.svelte
	// Match detail view (STAT-06, D-05, D-09).
	// Extensible Phase 4 growth surface — empty region between scoreboard and delete button.
	// Security T-03-04: id parsed in loader (+page.ts); T-03-05: all names via {interpolation}.

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types.js';
	import { deleteMatch } from '../../../db/matches.js';
	import ConfirmDialog from '../../../ui/dialogs/ConfirmDialog.svelte';
	import PlayerStatRow from '../../../ui/history/PlayerStatRow.svelte';
	import MatchStatBreakdown from '../../../ui/history/MatchStatBreakdown.svelte';

	let { data }: { data: PageData } = $props();
	const record = $derived(data.record);

	let showDeleteDialog = $state(false);
	let deleteError = $state<string | null>(null);

	/** Winner is the player whose id matches record.winnerId. */
	const winner = $derived(
		record.state.players.find((p) => p.id === record.winnerId) ?? record.state.players[0]
	);

	/** Total legs played in the match — sum of all players' legsWon. */
	const totalLegsPlayed = $derived(
		record.state.players.reduce((sum, p) => sum + p.legsWon, 0)
	);

	/** Full long date for the detail header card, e.g. "12. Juni 2026". */
	const longDate = $derived(
		new Date(record.completedAt).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})
	);

	/** Format line, e.g. "501 Double Out · Best of 3 Legs". */
	const formatLine = $derived.by(() => {
		const { config } = record.state;
		const outRule = config.outRule === 'double' ? 'Double Out' : 'Single Out';
		if (config.setsEnabled) {
			const plural = config.setsToWin === 1 ? 'Satz' : 'Sätze';
			return `${config.startScore} ${outRule} · Best of ${config.setsToWin} ${plural}`;
		} else {
			const plural = config.legsToWin === 1 ? 'Leg' : 'Legs';
			return `${config.startScore} ${outRule} · Best of ${config.legsToWin} ${plural}`;
		}
	});

	/** Result headline score, e.g. "3:1" (legs or sets). */
	const resultScore = $derived.by(() => {
		const { config, players } = record.state;
		if (players.length === 2) {
			const a = config.setsEnabled ? players[0].setsWon : players[0].legsWon;
			const b = config.setsEnabled ? players[1].setsWon : players[1].legsWon;
			return `${a}:${b}`;
		}
		const n = winner.legsWon;
		return n === 1 ? '1 Leg' : `${n} Legs`;
	});

	async function handleDeleteConfirm() {
		try {
			await deleteMatch(record.id!);
			goto(`${base}/history`);
		} catch {
			deleteError = 'Löschen fehlgeschlagen.';
		}
	}
</script>

<div class="screen">
	<header class="heading-bar">
		<button class="back-btn" onclick={() => goto(`${base}/history`)} aria-label="Zurück">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
				stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>
		<h1 class="screen-title">Match-Details</h1>
	</header>

	<div class="content">
		<!-- Summary header card -->
		<div class="summary-card">
			<p class="summary-date">{longDate}</p>
			<p class="summary-format">{formatLine}</p>
			<p class="summary-result">
				<span class="result-winner">{winner.name}</span>
				{' gewinnt '}{resultScore}
			</p>
		</div>

		<!-- Scoreboard section -->
		<section class="scoreboard-section">
			<h2 class="section-heading">Ergebnis</h2>
			<div class="player-rows">
				{#each record.state.players as player (player.id)}
					<PlayerStatRow
						{player}
						isWinner={player.id === record.winnerId}
						config={record.state.config}
						{totalLegsPlayed}
						legStartVisitIndex={record.state.legStartVisitIndex[player.id] ?? 0}
					/>
				{/each}
			</div>
		</section>

		<!-- Phase 4: per-player match stats breakdown -->
		<MatchStatBreakdown
			players={record.state.players}
			config={record.state.config}
			winnerId={record.winnerId}
			legStartVisitIndex={record.state.legStartVisitIndex}
		/>

		<!-- Delete action -->
		<div class="delete-section">
			<button
				class="delete-btn"
				onclick={() => { showDeleteDialog = true; }}
			>
				Spiel löschen
			</button>
			{#if deleteError}
				<p class="delete-error" role="alert">{deleteError}</p>
			{/if}
		</div>
	</div>
</div>

{#if showDeleteDialog}
	<ConfirmDialog
		heading="Spiel löschen?"
		body="Dieser Eintrag wird dauerhaft aus dem Verlauf entfernt und kann nicht wiederhergestellt werden."
		ctaLabel="Löschen"
		ctaStyle="destructive"
		backdropDismiss={true}
		onconfirm={handleDeleteConfirm}
		oncancel={() => { showDeleteDialog = false; }}
	/>
{/if}

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
		padding: var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-md, 16px);
	}

	/* Summary card */
	.summary-card {
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-md, 16px);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs, 4px);
	}

	.summary-date,
	.summary-format {
		font-size: 14px;
		font-weight: 400;
		color: #888888;
		margin: 0;
	}

	.summary-result {
		font-size: 16px;
		font-weight: 600;
		color: #f0f0f0;
		margin: 0;
	}

	.result-winner {
		color: #e8a020;
	}

	/* Scoreboard section */
	.scoreboard-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.section-heading {
		font-size: 20px;
		font-weight: 600;
		color: #f0f0f0;
		margin: 0;
	}

	.player-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	/* Delete section */
	.delete-section {
		padding-top: var(--space-md, 16px);
	}

	.delete-btn {
		width: 100%;
		height: 52px;
		border: 1px solid #c0392b;
		background: transparent;
		color: #c0392b;
		font-size: 16px;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
	}

	.delete-btn:active {
		background: rgba(192, 57, 43, 0.1);
	}

	.delete-error {
		font-size: 14px;
		font-weight: 400;
		color: #c0392b;
		margin: var(--space-sm, 8px) 0 0 0;
	}
</style>
