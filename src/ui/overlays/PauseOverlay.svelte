<script lang="ts">
	// src/ui/overlays/PauseOverlay.svelte
	// Full-screen auto-pause countdown overlay (FLOW-02 / D-08 / D-09).
	// Shown on both /match (showResume=true) and /display (showResume=false).
	// Prop-driven — imports no store so it is testable in isolation and reusable.
	// Structure mirrors MatchWinOverlay.svelte (PATTERNS analog).
	// z-index: 60 (above RecordOverlay 50, below MatchWinOverlay 100 — UI-SPEC).
	import { fade } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';

	interface Props {
		pauseActive: boolean;
		remainingSeconds: number;
		/** Whether to render the "Weiter" resume button. False on /display. Default true. */
		showResume?: boolean;
		/** Called when the player taps "Weiter". Noop default so the prop is optional. */
		onresume?: () => void;
	}

	let {
		pauseActive,
		remainingSeconds,
		showResume = true,
		onresume = () => {},
	}: Props = $props();

	// Format MM:SS — zero-padded, e.g. 480 → "08:00", 5 → "00:05", 272 → "04:32"
	let mm = $derived(String(Math.floor(remainingSeconds / 60)).padStart(2, '0'));
	let ss = $derived(String(remainingSeconds % 60).padStart(2, '0'));

	// UI-1: show "Weiter geht's!" flash when countdown reaches exactly 0.
	// Both /match and /display see remainingSeconds === 0 via broadcast, so this
	// derived flag drives the flash on both windows without any local timer.
	let isZero = $derived(remainingSeconds === 0 && pauseActive);

	// UI-2: aria-live companion — only populated at coarse intervals (every 60s and ≤10s).
	// The visible digits have no aria-live so screen readers are not flooded every second.
	let ariaAnnouncement = $derived.by(() => {
		if (!pauseActive) return '';
		if (isZero) return "Weiter geht's!";
		if (remainingSeconds <= 10) return `${remainingSeconds} Sekunden`;
		if (remainingSeconds % 60 === 0) return `${Math.floor(remainingSeconds / 60)} Minuten`;
		return '';
	});
</script>

{#if pauseActive}
	<div
		class="pause-overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Pause"
		in:fade={{ duration: 300, easing: (t) => 1 - Math.pow(1 - t, 2) }}
		out:fade={{ duration: 200, easing: cubicIn }}
	>
		<div class="pause-content">
			<h1 class="pause-heading">Pause</h1>
			<p class="pause-subtitle">Nächste Leg in Kürze</p>
			<!-- UI-1: zero state shows closure copy; normal state shows MM:SS digits -->
			<!-- UI-2: aria-live removed from visible element; companion below handles announcements -->
			{#if isZero}
				<p class="countdown-digits zero-flash">Weiter geht's!</p>
			{:else}
				<p class="countdown-digits">{mm}:{ss}</p>
			{/if}
			<!-- UI-2: visually hidden aria-live element, updated only at coarse intervals -->
			<span class="sr-only" aria-live="polite" aria-atomic="true">{ariaAnnouncement}</span>
			{#if showResume}
				<button class="weiter-btn" onclick={onresume}>Weiter</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.pause-overlay {
		position: fixed;
		inset: 0;
		background: rgba(17, 19, 24, 0.96);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
	}

	.pause-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl, 32px);
		padding: var(--space-xl, 32px);
		text-align: center;
	}

	.pause-heading {
		font-size: 20px;
		font-weight: 600;
		color: var(--text, #f0f0f0);
		line-height: 1.2;
		margin: 0;
	}

	.pause-subtitle {
		font-size: 16px;
		font-weight: 400;
		color: var(--text, #f0f0f0);
		margin: 0;
	}

	.countdown-digits {
		font-size: clamp(4rem, 10vw, 12rem);
		font-weight: 600;
		color: var(--accent, #e8a020);
		line-height: 1.0;
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	/* UI-1: zero flash shares countdown sizing/color but fades out over 800ms per spec */
	.zero-flash {
		animation: zeroFlashFade 800ms ease-out forwards;
	}

	@keyframes zeroFlashFade {
		from { opacity: 1; }
		to   { opacity: 0; }
	}

	/* "Weiter" button — exact copy of MatchWinOverlay .new-game-btn (PATTERNS analog) */
	.weiter-btn {
		height: 56px;
		padding: 0 var(--space-xl, 32px);
		background: #e8a020;
		border: none;
		border-radius: 6px;
		color: #111318;
		font-size: 18px;
		font-weight: 600;
		cursor: pointer;
		min-width: 200px;
		transition: opacity 150ms ease;
	}

	.weiter-btn:active {
		opacity: 0.85;
	}

	/* UI-2: visually hidden but readable by screen readers */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
