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
		font-size: 14px;
		font-weight: 400;
		color: #e8a020;
		line-height: 1.4;
		white-space: nowrap;
	}
</style>
