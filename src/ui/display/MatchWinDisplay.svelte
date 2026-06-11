<script lang="ts">
	// src/ui/display/MatchWinDisplay.svelte
	// Persistent full-screen match winner display for the spectator view.
	// Prop-driven — pure presentation component; reads state: MatchState prop.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	// No navigation button — persists until a new match starts (phase flips to 'playing').
	// No dedicated component test by design — pure prop component; matchAverage is
	// unit-tested in averages.test.ts; render covered by Plan-04 e2e match-completion flow.
	import { matchAverage } from '../../engine/averages.js';
	import type { MatchState } from '../../engine/types.js';

	interface Props {
		state: MatchState;
	}

	let { state }: Props = $props();

	// Winner is the player at activePlayerIndex when phase === 'match-complete'
	// (the reducer sets activePlayerIndex to the winner on match completion).
	let winner = $derived(state.players[state.activePlayerIndex]);

	// Build final standing subtitle: "[n] – [m] Legs" or "Sätze" when setsEnabled
	let standingText = $derived.by(() => {
		const p = state.players;
		if (state.config.setsEnabled) {
			const scores = p.map(pl => pl.setsWon).join(' – ');
			return `${scores} Sätze`;
		} else {
			const scores = p.map(pl => pl.legsWon).join(' – ');
			return `${scores} Legs`;
		}
	});

	// Per-player match averages formatted to one decimal
	let playerAverages = $derived(
		state.players.map(pl => {
			const val = matchAverage(pl.visits, state.config.startScore, pl.remaining);
			return val !== null ? val.toFixed(1) : '—';
		})
	);
</script>

<div class="match-win-display" role="dialog" aria-modal="true" aria-label="{winner?.name ?? ''} gewinnt">
	<div class="win-content">
		<h1 class="win-heading">
			<span class="winner-name">{winner?.name ?? ''}</span> gewinnt!
		</h1>
		<p class="win-standing">{standingText}</p>
		<div class="averages-row">
			{#each state.players as player, i (player.id)}
				<div class="player-avg">
					<span class="avg-name">{player.name}</span>
					<span class="avg-label">Ø Match</span>
					<span class="avg-value">{playerAverages[i]}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.match-win-display {
		position: fixed;
		inset: 0;
		z-index: 20;
		background: #111318;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: matchWinFadeIn 300ms ease-out;
	}

	@keyframes matchWinFadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.win-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl, 32px);
		padding: var(--space-xl, 32px);
		text-align: center;
	}

	.win-heading {
		font-size: clamp(2.5rem, 6vw, 8rem);
		font-weight: 600;
		color: var(--text, #f0f0f0);
		line-height: 1.1;
		margin: 0;
	}

	.winner-name {
		color: #e8a020;
	}

	.win-standing {
		font-size: clamp(1rem, 2vw, 2.5rem);
		font-weight: 400;
		color: var(--text, #f0f0f0);
		margin: 0;
	}

	.averages-row {
		display: flex;
		gap: var(--space-2xl, 48px);
		flex-wrap: wrap;
		justify-content: center;
	}

	.player-avg {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs, 4px);
	}

	.avg-name {
		font-size: clamp(0.875rem, 1.5vw, 1.75rem);
		font-weight: 600;
		color: var(--text, #f0f0f0);
	}

	.avg-label {
		font-size: clamp(0.75rem, 1.2vw, 1.5rem);
		font-weight: 400;
		color: var(--text, #f0f0f0);
		opacity: 0.7;
	}

	.avg-value {
		font-size: clamp(1rem, 2vw, 2.5rem);
		font-weight: 600;
		color: #e8a020;
	}
</style>
