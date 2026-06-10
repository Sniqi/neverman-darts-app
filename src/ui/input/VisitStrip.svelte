<script lang="ts">
	// src/ui/input/VisitStrip.svelte
	// Three 48px dart slots showing the active player's current-visit darts.
	// Tapping a slot dispatches UNDO (removes last dart; tapping earlier slot undoes back to it).
	// On bust, strip background animates to destructive red.
	import { matchStore } from '../../stores/match.svelte.js';
	import type { DartScore } from '../../engine/types.js';

	function formatDart(dart: DartScore): string {
		if (dart.segment === 0) return '0 (Daneben)';
		if (dart.segment === 50) return dart.multiplier === 2 ? 'Bull' : 'Outer Bull';
		if (dart.segment === 25) return 'Outer Bull';
		const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
		return `${prefix}${dart.segment}`;
	}

	// Slots: always show 3 slots
	const SLOTS = [0, 1, 2];

	// Detect bust: check if last visit of active player was a bust
	// We show bust styling when the current visit has ended and was a bust,
	// but during the correction window the last completed visit is in the player's visits array.
	// For the current visit strip, we check if a bust is pending confirmation.
	function isBustVisit(): boolean {
		const player = matchStore.activePlayer;
		if (!player) return false;
		const visits = player.visits;
		if (visits.length === 0) return false;
		return visits[visits.length - 1].bust;
	}
</script>

<div class="visit-strip" class:bust={isBustVisit()}>
	{#each SLOTS as slotIdx (slotIdx)}
		{@const dart = matchStore.currentVisit[slotIdx]}
		<button
			class="dart-slot"
			onclick={() => matchStore.dispatch({ type: 'UNDO' })}
			aria-label={dart ? `Rückgängig: ${formatDart(dart)}` : 'Leerer Dart-Slot'}
			disabled={matchStore.currentVisit.length === 0}
		>
			{dart ? formatDart(dart) : '—'}
		</button>
	{/each}
</div>

<style>
	.visit-strip {
		display: flex;
		flex-direction: row;
		gap: var(--space-xs, 4px);
		align-items: center;
		padding: 4px var(--space-md, 16px);
		transition: background-color 300ms ease-out;
	}

	.visit-strip.bust {
		background-color: rgba(192, 57, 43, 0.3);
	}

	.dart-slot {
		height: 48px;
		flex: 1;
		min-width: 80px;
		background: #1e2027;
		border: 1px solid #444444;
		border-radius: 4px;
		color: #f0f0f0;
		font-size: 14px;
		font-weight: 400;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 150ms ease;
	}

	.dart-slot:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.dart-slot:not(:disabled):active {
		background: #2d2d2d;
	}
</style>
