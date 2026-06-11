<script lang="ts">
	// src/routes/display/+page.svelte
	// Spectator display route shell.
	// Connects displayStore on mount, branches on idle vs active match.
	// Manages legWinMessage state via legsWon/setsWon delta watcher (D-09).
	import { base } from '$app/paths';
	import { displayStore } from '../../stores/display.svelte.js';
	import MatchHeader from '../../ui/display/MatchHeader.svelte';
	import PlayerPanel from '../../ui/display/PlayerPanel.svelte';
	import IdleScreen from '../../ui/display/IdleScreen.svelte';
	import LegWinBanner from '../../ui/display/LegWinBanner.svelte';
	import MatchWinDisplay from '../../ui/display/MatchWinDisplay.svelte';

	// Connect the display store and subscribe to live updates.
	// $effect returns the cleanup function which closes the BroadcastChannel.
	$effect(() => displayStore.connect());

	// Use matchState to avoid naming conflict with the $state rune.
	let matchState = $derived(displayStore.state);

	// Current leg: sum of all players' legsWon + 1 (the leg currently in progress)
	let currentLeg = $derived.by(() => {
		if (!matchState || matchState.phase === 'setup') return 1;
		const totalLegsWon = matchState.players.reduce((sum, p) => sum + p.legsWon, 0);
		return totalLegsWon + 1;
	});

	// Leg/set win banner state (D-09)
	// legWinMessage is set when a player's legsWon or setsWon increases,
	// and cleared when the first dart of the next leg is thrown (currentVisit.length > 0).
	let legWinMessage: string | null = $state(null);
	let legWinSubtitle: string | null = $state(null);
	let prevLegsWon: number[] = $state([]);
	let prevSetsWon: number[] = $state([]);

	$effect(() => {
		const s = matchState;
		if (!s || s.phase === 'setup') return;

		// Clear banner when first dart of next leg is thrown (event-driven dismiss D-09)
		if (legWinMessage && s.currentVisit.length > 0) {
			legWinMessage = null;
			legWinSubtitle = null;
		}

		// Detect leg/set win: a player's legsWon or setsWon increased
		// Only detect when transitioning back to 'playing' (leg-complete → playing)
		if (s.phase === 'playing' && prevLegsWon.length === s.players.length) {
			for (let i = 0; i < s.players.length; i++) {
				const player = s.players[i];
				if (s.config.setsEnabled && player.setsWon > (prevSetsWon[i] ?? 0)) {
					// Set win
					const scores = s.players.map(p => p.setsWon).join(' : ');
					legWinMessage = `Satz für ${player.name}!`;
					legWinSubtitle = `${scores} Sätze`;
					break;
				} else if (player.legsWon > (prevLegsWon[i] ?? 0)) {
					// Leg win
					const scores = s.players.map(p => p.legsWon).join(' : ');
					legWinMessage = `Leg für ${player.name}!`;
					legWinSubtitle = `${scores} Legs`;
					break;
				}
			}
		}

		// Update previous counts for next comparison
		prevLegsWon = s.players.map(p => p.legsWon);
		prevSetsWon = s.players.map(p => p.setsWon);
	});

	// Suppress unused import warning — base used for future navigation
	void base;
</script>

{#if matchState === null || matchState.phase === 'setup'}
	<IdleScreen />
{:else}
	<div class="display-root">
		<MatchHeader config={matchState.config} {currentLeg} />
		<div
			class="panels-grid"
			style="--player-count:{matchState.players.length}"
		>
			{#each matchState.players as player, i (player.id)}
				<PlayerPanel
					{player}
					isActive={i === matchState.activePlayerIndex}
					config={matchState.config}
					legStartIndex={matchState.legStartVisitIndex[player.id] ?? 0}
					currentVisit={i === matchState.activePlayerIndex ? matchState.currentVisit : []}
				/>
			{/each}
		</div>

		<!-- Overlay layers: match-win (z-20) takes precedence over leg banner (z-10) -->
		{#if matchState.phase === 'match-complete'}
			<MatchWinDisplay state={matchState} />
		{:else if legWinMessage !== null}
			<LegWinBanner message={legWinMessage} subtitle={legWinSubtitle} />
		{/if}
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
