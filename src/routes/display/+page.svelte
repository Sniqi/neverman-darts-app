<script lang="ts">
	// src/routes/display/+page.svelte
	// Spectator display route shell.
	// Connects displayStore on mount, branches on idle vs active match.
	// Manages legWinMessage state via legsWon/setsWon delta watcher (D-09).
	// Audio lives in /match — this window is a passive subscriber with no audio.
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { displayStore } from '../../stores/display.svelte.js';
	import { BC_RECORD_CHANNEL } from '../../lib/sync-constants.js';
	import { isCastReceiverContext, CastReceiverBridge } from '../../lib/cast-receiver.js';
	import MatchHeader from '../../ui/display/MatchHeader.svelte';
	import PlayerPanel from '../../ui/display/PlayerPanel.svelte';
	import IdleScreen from '../../ui/display/IdleScreen.svelte';
	import LegWinBanner from '../../ui/display/LegWinBanner.svelte';
	import MatchWinDisplay from '../../ui/display/MatchWinDisplay.svelte';
	import RecordOverlay from '../../ui/overlays/RecordOverlay.svelte';
	import PauseOverlay from '../../ui/overlays/PauseOverlay.svelte';

	// Cast receiver context flag — true only on a real Chromecast device (D-02).
	let isReceiver = $state(false);

	// One-time onMount: init the receiver bridge if running on a Chromecast.
	// onMount is correct here (not $effect) — this is a one-time side-effect with
	// no reactive dependencies. Matches the onMount pattern used in /match.
	onMount(() => {
		if (!isCastReceiverContext()) return;
		isReceiver = true;
		CastReceiverBridge.init({
			onSnapshot: (msg) => displayStore.receiveSnapshot(msg),
		});
	});

	// Connect the display store and subscribe to live updates.
	// $effect returns the cleanup function which closes the BroadcastChannel.
	$effect(() => displayStore.connect());

	// ── Record channel subscription (ACHV-02 / Pitfall 5) ────────────────────
	// Subscribes to BC_RECORD_CHANNEL independently of the match-state channel so
	// record payloads never reach displayStore.state (T-04-12).
	// When a win banner is showing (leg or match), fold records into the badge (D-08).
	let recordStrings = $state<string[]>([]);
	// WR-05: track the last-processed sequence id so a retransmit of the same event is
	// ignored, and append (not overwrite) records that arrive while a celebration is
	// still showing — two players hitting 180 in quick succession both get shown.
	let lastRecordSeq = -1;

	$effect(() => {
		let ch: BroadcastChannel;
		try {
			ch = new BroadcastChannel(BC_RECORD_CHANNEL);
			ch.addEventListener('message', (e: MessageEvent) => {
				const data = e.data as {
					type: string;
					seq?: number;
					records: string[];
				};
				if (data?.type === 'record-event' && Array.isArray(data.records)) {
					// Drop duplicate/stale sequences (seq is monotonic from the scorer).
					if (typeof data.seq === 'number') {
						if (data.seq <= lastRecordSeq) return;
						lastRecordSeq = data.seq;
					}
					// Append within the active dismiss window; replace once cleared.
					recordStrings =
						recordStrings.length > 0
							? [...recordStrings, ...data.records]
							: data.records;
				}
			});
		} catch {
			// BroadcastChannel unavailable (SSR / private mode) — skip silently
		}
		return () => {
			try { ch?.close(); } catch { /* ignore */ }
		};
	});

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
	let prevLegsWon: number[] = [];
	let prevSetsWon: number[] = [];

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
			// Two players → "Name - x : y - Name"; otherwise "x : y : z Unit".
			const subtitle = (values: number[], unit: string) =>
				s.players.length === 2
					? `${s.players[0].name} - ${values.join(' : ')} - ${s.players[1].name}`
					: `${values.join(' : ')} ${unit}`;
			for (let i = 0; i < s.players.length; i++) {
				const player = s.players[i];
				if (s.config.setsEnabled && player.setsWon > (prevSetsWon[i] ?? 0)) {
					// Set win
					legWinMessage = `Set für ${player.name}!`;
					legWinSubtitle = subtitle(s.players.map(p => p.setsWon), 'Sets');
					break;
				} else if (player.legsWon > (prevLegsWon[i] ?? 0)) {
					// Leg win
					legWinMessage = `Leg für ${player.name}!`;
					legWinSubtitle = subtitle(s.players.map(p => p.legsWon), 'Legs');
					break;
				}
			}
		}

		// Update previous counts for next comparison
		prevLegsWon = s.players.map(p => p.legsWon);
		prevSetsWon = s.players.map(p => p.setsWon);
	});

	// ── Fullscreen state (D-15 PC toggle, D-14 tablet exit) ──────────────────
	// isFullscreen tracks document.fullscreenElement state.
	// Guard document access — ssr=true for this route (Chromecast prerender, D-04), so
	// all DOM/fullscreen API calls must be inside $effect / click handlers (browser-only).
	let isFullscreen = $state(false);
	// Latches true once fullscreen has been entered at least once this page-load (WR-01):
	// after a fullscreen round-trip the big amber prompt must not re-appear over the live
	// scoreboard. The always-rendered top-right .fullscreen-toggle still re-enters fullscreen.
	let hasEnteredFullscreen = $state(false);

	// Read the tablet-fullscreen intent flag once at mount (fixed for page lifetime).
	// SpectatorChooser's goToDisplayFullscreen() sets ?fullscreen=1; openSecondWindow()
	// does NOT — so a PC second window never carries this flag and cannot show the prompt.
	const tabletFullscreenIntent =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('fullscreen') === '1';
	let showExit = $state(false);
	let exitTimerId: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		function onFullscreenChange() {
			isFullscreen = document.fullscreenElement !== null;
			if (isFullscreen) hasEnteredFullscreen = true;
		}
		document.addEventListener('fullscreenchange', onFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
	});

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen?.().catch(() => {});
		} else {
			document.documentElement.requestFullscreen().catch(() => {});
		}
	}

	function activateFullscreen() {
		document.documentElement.requestFullscreen().catch(() => {});
	}

	function handleDisplayTap() {
		showExit = true;
		if (exitTimerId !== null) clearTimeout(exitTimerId);
		exitTimerId = setTimeout(() => {
			showExit = false;
			exitTimerId = null;
		}, 3000);
	}

	function exitToMatch() {
		if (exitTimerId !== null) { clearTimeout(exitTimerId); exitTimerId = null; }
		document.exitFullscreen?.().catch(() => {});
		goto(`${base}/match`);
	}
</script>

<svelte:head>
	<!-- CAF Custom Web Receiver SDK (D-02, RECV-01).
	     Loaded in <svelte:head> so it is inert during SSR and on normal browsers.
	     The SDK sets window.cast.framework.CastReceiverContext only inside a real
	     Chromecast runtime; isCastReceiverContext() gates all receiver-specific code. -->
	<script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</svelte:head>

{#if matchState === null || matchState.phase === 'setup'}
	<IdleScreen />
{:else}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="display-root" class:cast-receiver={isReceiver} onclick={handleDisplayTap}>
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
		<!-- D-08: when records arrive coincident with a win, fold into the banner badge;
		     when no win is showing, RecordOverlay handles the celebration (z-50). -->
		{#if matchState.phase === 'match-complete'}
			<MatchWinDisplay
				state={matchState}
				recordBadge={recordStrings.length > 0 ? recordStrings.join(' · ') : null}
			/>
		{:else if legWinMessage !== null}
			<LegWinBanner
				message={legWinMessage}
				subtitle={legWinSubtitle}
				recordBadge={recordStrings.length > 0 ? recordStrings.join(' · ') : null}
			/>
		{/if}
	</div>
{/if}

<!-- Record celebration overlay (z-50): shown when no win banner is active (D-08) -->
{#if recordStrings.length > 0 && matchState !== null && matchState.phase !== 'match-complete' && legWinMessage === null}
	<RecordOverlay
		records={recordStrings}
		ondismiss={() => { recordStrings = []; }}
	/>
{/if}

<!-- FLOW-02: Auto-pause overlay on spectator view (z-60, read-only — no Weiter button, no local timer).
     pauseActive/pauseRemainingSeconds are updated by DisplayStore's pause-tick message handler.
     No new BroadcastChannel subscription needed here — displayStore.connect() handles it (Task 2). -->
<PauseOverlay
	pauseActive={displayStore.pauseActive}
	remainingSeconds={displayStore.pauseRemainingSeconds}
	showResume={false}
/>

<!-- Layer 3: fullscreen controls (z-index 30) — outside the conditional so always rendered -->

<!-- PC fullscreen toggle (D-15): small icon button top-right on /display.
     Hidden on a Cast receiver (isReceiver) — the TV is already fullscreen and has no pointer. -->
{#if !isReceiver}
<button
	class="fullscreen-toggle"
	aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbild aktivieren'}
	onclick={toggleFullscreen}
>
	{#if isFullscreen}
		<!-- Exit fullscreen icon -->
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
		</svg>
	{:else}
		<!-- Enter fullscreen icon -->
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
		</svg>
	{/if}
</button>
{/if}

<!-- Tablet fullscreen prompt (D-14, DISP-02): shown when not fullscreen AND either idle/setup
     OR the tablet-fullscreen intent flag is set (?fullscreen=1, only set by SpectatorChooser's
     goToDisplayFullscreen — PC second window has no flag and is never affected). The intent
     case is also gated on !hasEnteredFullscreen (WR-01) so the prompt does not re-appear over
     the live scoreboard after a mid-match fullscreen exit; the top-right toggle re-enters.
     Suppressed entirely on a Cast receiver (isReceiver) — useless on a non-interactive TV. -->
{#if !isReceiver && !isFullscreen && (matchState === null || matchState.phase === 'setup' || (tabletFullscreenIntent && !hasEnteredFullscreen))}
	<button class="fullscreen-prompt" onclick={activateFullscreen}>
		Vollbild aktivieren
	</button>
{/if}

<!-- Tablet exit button (D-14): auto-hides after 3s; tap anywhere to show -->
{#if showExit}
	<button class="exit-btn" onclick={exitToMatch}>
		Zurück zur Eingabe
	</button>
{/if}

<style>
	.display-root {
		display: flex;
		flex-direction: column;
		/* 100vh fallback FIRST: the Chromecast CAF receiver runs an older Chromium without
		   `dvh` support (added in Chrome 108). An unsupported unit invalidates the whole
		   declaration → the element collapsed to auto height (~20% of the TV, bottom clipped).
		   Modern browsers (tablet/PC) override with 100dvh on the next line. (UAT 07, 3rd pass) */
		height: 100vh;
		height: 100dvh;
		width: 100%;
		background: radial-gradient(
			120% 90% at 50% 0%,
			#1b1e26 0%,
			#111318 45%,
			#0b0c10 100%
		);
		overflow: hidden;
	}

	/* D-11: TV overscan safe margin removed per on-device UAT (07, 3rd pass) — the 96px border
	   wasted too much of the screen and most modern TVs/Chromecast output no overscan. If a
	   specific TV crops the edges, re-add a small symmetric inset here, e.g. `padding: 2.5vh 2.5vw`. */

	.panels-grid {
		flex: 1 1 0;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(var(--player-count), 1fr);
		gap: 2px;
		/* gap reveals this as thin seam lines between player columns */
		background: var(--line, rgba(255, 255, 255, 0.08));
	}

	/* Layer 3: fullscreen controls (z-index 30) */

	.fullscreen-toggle {
		position: fixed;
		top: 12px;
		right: 12px;
		z-index: 30;
		width: 40px;
		height: 40px;
		background: rgba(28, 31, 39, 0.6);
		border: 1px solid var(--line-strong, rgba(255, 255, 255, 0.14));
		border-radius: var(--radius-sm, 8px);
		color: #f0f0f0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-raise, 0 2px 10px rgba(0, 0, 0, 0.4));
		transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
	}

	.fullscreen-toggle:hover {
		background: rgba(232, 160, 32, 0.14);
		border-color: var(--accent, #e8a020);
		color: var(--accent, #e8a020);
	}

	.fullscreen-toggle:active {
		background: rgba(232, 160, 32, 0.22);
	}

	.fullscreen-prompt {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
		height: 48px;
		padding: 0 var(--space-xl, 32px);
		background: linear-gradient(180deg, #f0ab2c 0%, #e8a020 100%);
		border: none;
		border-radius: var(--radius-sm, 8px);
		color: #111318;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		min-width: 200px;
		box-shadow: 0 6px 22px rgba(232, 160, 32, 0.35);
		animation: fadeIn 150ms ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateX(-50%) translateY(4px); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	.exit-btn {
		position: fixed;
		bottom: 24px;
		right: 24px;
		z-index: 30;
		min-height: 48px;
		min-width: 120px;
		padding: 0 var(--space-lg, 24px);
		background: rgba(28, 31, 39, 0.85);
		border: 1px solid var(--accent, #e8a020);
		border-radius: var(--radius-sm, 8px);
		color: var(--accent, #e8a020);
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-raise, 0 2px 10px rgba(0, 0, 0, 0.4));
		animation: fadeInExit 150ms ease-out;
	}

	@keyframes fadeInExit {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.exit-btn:active {
		background: rgba(232, 160, 32, 0.1);
	}

</style>
