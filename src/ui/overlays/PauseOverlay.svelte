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
				<button class="btn btn--cta" onclick={onresume}>Weiter</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.pause-overlay {
		position: fixed;
		inset: 0;
		background: var(--backdrop);
		backdrop-filter: blur(var(--blur-backdrop));
		-webkit-backdrop-filter: blur(var(--blur-backdrop));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
	}

	.pause-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xl);
		padding: var(--space-xl);
		text-align: center;
		background: var(--surface-2);
		border-radius: var(--radius-lg);
		border: 1px solid var(--line-strong);
		box-shadow: var(--shadow-panel), var(--edge-highlight);
		animation: pauseContentIn var(--dur-med) var(--ease-spring);
	}

	@keyframes pauseContentIn {
		from { opacity: 0; transform: scale(0.94) translateY(8px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	.pause-heading {
		font-size: var(--text-xl);
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
		margin: 0;
	}

	.pause-subtitle {
		font-size: var(--text-base);
		font-weight: 400;
		color: var(--text);
		margin: 0;
	}

	.countdown-digits {
		font-size: clamp(4rem, 10vw, 12rem);
		font-weight: 600;
		color: var(--accent);
		line-height: 1.0;
		margin: 0;
		font-variant-numeric: tabular-nums;
	}

	/* UI-1: zero flash shares countdown sizing/color; not a DS-documented exception,
	   retimed to --dur-slow per CONTEXT.md Motion & Sweep Ambiguities resolution. */
	.zero-flash {
		animation: zeroFlashFade var(--dur-slow) var(--ease) forwards;
	}

	@keyframes zeroFlashFade {
		from { opacity: 1; }
		to   { opacity: 0; }
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
