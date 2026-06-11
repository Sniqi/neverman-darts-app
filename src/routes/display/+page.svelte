<script lang="ts">
	// src/routes/display/+page.svelte
	// Spectator display route shell.
	// Connects displayStore on mount, branches on idle vs active match.
	import { base } from '$app/paths';
	import { displayStore } from '../../stores/display.svelte.js';
	import MatchHeader from '../../ui/display/MatchHeader.svelte';
	import PlayerPanel from '../../ui/display/PlayerPanel.svelte';
	import IdleScreen from '../../ui/display/IdleScreen.svelte';

	// Connect the display store and subscribe to live updates.
	// $effect returns the cleanup function which closes the BroadcastChannel.
	$effect(() => displayStore.connect());

	let state = $derived(displayStore.state);

	// Current leg: sum of all players' legsWon + 1 (the leg currently in progress)
	let currentLeg = $derived.by(() => {
		if (!state || state.phase === 'setup') return 1;
		const totalLegsWon = state.players.reduce((sum, p) => sum + p.legsWon, 0);
		return totalLegsWon + 1;
	});

	// Suppress unused import warning — base used for future navigation
	void base;
</script>

{#if state === null || state.phase === 'setup'}
	<IdleScreen />
{:else}
	<div class="display-root">
		<MatchHeader config={state.config} {currentLeg} />
		<div
			class="panels-grid"
			style="--player-count:{state.players.length}"
		>
			{#each state.players as player, i (player.id)}
				<PlayerPanel
					{player}
					isActive={i === state.activePlayerIndex}
					config={state.config}
					legStartIndex={state.legStartVisitIndex[player.id] ?? 0}
				/>
			{/each}
		</div>
	</div>
{/if}

<style>
	.display-root {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100%;
		background: var(--bg, #111318);
		overflow: hidden;
	}

	.panels-grid {
		display: grid;
		grid-template-columns: repeat(var(--player-count), 1fr);
		height: calc(100dvh - 40px);
		gap: 2px;
	}
</style>
