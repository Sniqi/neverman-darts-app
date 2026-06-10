<script lang="ts">
	// Skeleton match route: ONE wired tap interaction through the runes store.
	// Plan 03 replaces this with the real Dartboard + ScorePanel components.
	import { skeletonStore } from '../../stores/skeleton.svelte';
</script>

<main>
	<p class="score">{skeletonStore.score}</p>

	<!-- Placeholder dartboard region — Plan 03 builds the real SVG board -->
	<div
		class="board"
		role="button"
		tabindex="0"
		aria-label="Dartboard (Platzhalter) — tippen wirft T20"
		onpointerdown={() => skeletonStore.tap(20)}
	>
		<span>T20</span>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2xl);
		padding: var(--space-xl);
	}
	.score {
		font-size: 48px;
		font-weight: 600;
		line-height: 1;
		margin: 0;
	}
	.board {
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: var(--surface);
		border: 2px solid #444444;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-weight: 600;
		cursor: pointer;
		touch-action: none;
		user-select: none;
	}
	.board:active {
		background: #2d2d2d;
	}
</style>
