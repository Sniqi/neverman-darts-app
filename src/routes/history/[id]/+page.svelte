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
			const plural = config.setsToWin === 1 ? 'Set' : 'Sets';
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
		<button class="btn btn--ghost btn--icon back-btn" onclick={() => goto(`${base}/history`)} aria-label="Zurück">
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
				class="btn btn--destructive-outline"
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
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	/* Summary card */
	.summary-card {
		background: var(--surface);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.summary-date,
	.summary-format {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--text-muted);
		margin: 0;
	}

	.summary-result {
		font-size: var(--text-md);
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.result-winner {
		color: var(--accent);
	}

	/* Scoreboard section */
	.scoreboard-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.section-heading {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text);
		margin: 0;
	}

	.player-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	/* Delete section */
	.delete-section {
		padding-top: var(--space-md);
	}

	.delete-error {
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--destructive);
		margin: var(--space-sm) 0 0 0;
	}
</style>
