<script lang="ts">
	// src/ui/input/CorrectionWindow.svelte
	// Post-visit overlay (D-05, INP-04): shows completed visit for ~2.5s with darts editable.
	// A draining progress bar auto-dismisses via CONFIRM_VISIT after 2.5s.
	// "Korrigieren" pauses timer and keeps overlay open for undo/correction.
	// Bust visits show "Überworfen!" — turn does NOT pass before window dismisses (Pitfall 5).
	import { matchStore } from '../../stores/match.svelte.js';
	import type { DartScore } from '../../engine/types.js';

	// Props: show/hide + the just-completed visit data
	interface Props {
		visible: boolean;
		visitDarts: DartScore[];
		isBust: boolean;
		visitTotal: number;
	}

	let { visible, visitDarts, isBust, visitTotal }: Props = $props();

	const TIMEOUT_MS = 2500;

	let paused = $state(false);
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let progressStartTime: number = 0;
	let elapsed = $state(0);
	let rafId: number | null = null;

	function formatDart(dart: DartScore): string {
		if (dart.segment === 0) return '0 (Daneben)';
		if (dart.segment === 50) return 'Bull';
		if (dart.segment === 25) return 'Outer Bull';
		const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
		return `${prefix}${dart.segment}`;
	}

	function startTimer() {
		progressStartTime = Date.now() - elapsed;
		rafId = requestAnimationFrame(tick);
		timerId = setTimeout(confirm, TIMEOUT_MS - elapsed);
	}

	function stopTimer() {
		if (timerId !== null) { clearTimeout(timerId); timerId = null; }
		if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
	}

	function tick() {
		elapsed = Date.now() - progressStartTime;
		if (elapsed < TIMEOUT_MS) {
			rafId = requestAnimationFrame(tick);
		}
	}

	function confirm() {
		stopTimer();
		matchStore.dispatch({ type: 'CONFIRM_VISIT' });
	}

	function pause() {
		paused = true;
		elapsed = Date.now() - progressStartTime;
		stopTimer();
	}

	function handleOutsideClick() {
		if (!paused) confirm();
	}

	// Start/stop timer when visibility changes
	$effect(() => {
		if (visible) {
			elapsed = 0;
			paused = false;
			startTimer();
		} else {
			stopTimer();
			elapsed = 0;
			paused = false;
		}
		return () => stopTimer();
	});

	let progressPct = $derived(Math.min(100, (elapsed / TIMEOUT_MS) * 100));
	let dartsLabel = $derived(visitDarts.map(formatDart).join(' · '));
</script>

{#if visible}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="overlay" role="presentation" onclick={handleOutsideClick}>
		<!-- Progress bar draining over 2.5s -->
		<div class="progress-bar">
			<div class="progress-fill" style="width: {100 - progressPct}%"></div>
		</div>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="window" role="presentation" onclick={(e) => e.stopPropagation()}>
			{#if isBust}
				<div class="bust-label">Überworfen!</div>
			{/if}

			<div class="visit-summary">
				{dartsLabel}
				{#if !isBust}
					<span class="total"> → {visitTotal}</span>
				{/if}
			</div>

			{#if !paused}
				<button class="korrigieren-btn" onclick={(e) => { e.stopPropagation(); pause(); }}>
					Korrigieren
				</button>
			{:else}
				<div class="paused-hint">Verwende Rückgängig zum Bearbeiten</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(30, 32, 39, 0.92);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
		z-index: 10;
		animation: fadeSlideIn 200ms ease-out;
	}

	@keyframes fadeSlideIn {
		from { opacity: 0; transform: translateY(8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.progress-bar {
		height: 3px;
		background: #444444;
		width: 100%;
		flex-shrink: 0;
	}

	.progress-fill {
		height: 100%;
		background: #e8a020;
		transition: width 100ms linear;
	}

	.window {
		padding: var(--space-lg, 24px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm, 8px);
	}

	.bust-label {
		font-size: 20px;
		font-weight: 600;
		color: #c0392b;
	}

	.visit-summary {
		font-size: 16px;
		color: #f0f0f0;
		text-align: center;
	}

	.total {
		font-weight: 600;
		color: #e8a020;
	}

	.korrigieren-btn {
		font-size: 14px;
		color: #e8a020;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		text-decoration: underline;
	}

	.paused-hint {
		font-size: 14px;
		color: #888888;
	}
</style>
