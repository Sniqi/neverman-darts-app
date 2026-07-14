<script lang="ts">
	// src/ui/input/CheckoutSuggestion.svelte
	// Compact accent checkout route line beside the active player's remaining score.
	// Renders nothing when matchStore.suggestion is null (D-12: no placeholder for bogey/>170).
	import { matchStore } from '../../stores/match.svelte.js';
</script>

{#if matchStore.suggestion !== null}
	<span class="suggestion">{matchStore.suggestion.join(' ')}</span>
{/if}

<style>
	.suggestion {
		font-size: var(--text-base);
		font-weight: 700;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent-line);
		border-radius: var(--radius-pill);
		padding: 4px 14px;
		line-height: 1.4;
		white-space: nowrap;
		letter-spacing: 0.02em;
		font-variant-numeric: tabular-nums;
		box-shadow: var(--glow-accent);
	}
</style>
