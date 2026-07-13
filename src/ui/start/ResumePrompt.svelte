<script lang="ts">
	// src/ui/start/ResumePrompt.svelte
	// Resume prompt card — shown when an unfinished match exists (D-01).
	// Security T-03-03: player names rendered via {interpolation} only, no {@html}.

	import type { MatchState } from '../../engine/types.js';

	interface Props {
		match: MatchState;
		onresume: () => void;
		ondiscard: () => void;
	}

	let { match, onresume, ondiscard }: Props = $props();

	// Build match info line: "[startScore] · [player A] vs. [player B] · [n] Legs"
	// For 3-4 players show winner-agnostic player list.
	let infoLine = $derived.by(() => {
		const { config, players } = match;
		const score = config.startScore;
		const totalLegsWon = players.reduce((sum, p) => sum + p.legsWon, 0);
		const legsLabel = totalLegsWon === 1 ? '1 Leg' : `${totalLegsWon} Legs`;

		if (players.length === 2) {
			return `${score} · ${players[0].name} vs. ${players[1].name} · ${legsLabel}`;
		}
		// 3-4 players: comma-separated list
		const names = players.map(p => p.name).join(', ');
		return `${score} · ${names} · ${legsLabel}`;
	});
</script>

<div class="resume-card" role="region" aria-label="Laufendes Spiel">
	<h2 class="resume-heading">Laufendes Spiel fortsetzen?</h2>
	<p class="resume-info">{infoLine}</p>
	<div class="resume-actions">
		<button class="btn btn--accent btn-resume" onclick={onresume}>Fortsetzen</button>
		<button class="btn btn--destructive-outline btn-discard" onclick={ondiscard}>Verwerfen</button>
	</div>
</div>

<style>
	.resume-card {
		background: var(--surface);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		animation: slideDown var(--dur-med) var(--ease);
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.resume-heading {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 var(--space-xs) 0;
		color: var(--text);
	}

	.resume-info {
		font-size: 14px;
		font-weight: 400;
		color: var(--text-muted);
		margin: 0 0 var(--space-md) 0;
		line-height: 1.4;
	}

	.resume-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.btn-resume {
		flex: 1;
		height: 56px;
	}

	.btn-discard {
		flex: 1;
	}
</style>
