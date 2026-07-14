<script lang="ts">
	// src/ui/cast/ResumeToast.svelte
	// "Verbindung wiederhergestellt" toast for Cast SESSION_RESUMED events (CAST-06).
	// Binds to castSenderManager.resumeDeviceName (one-shot signal from Plan 07-03).
	// Auto-dismisses after 3500ms. No user interaction required.
	// Sender-only — lives in /match, never rendered in /display or receiver context.
	//
	// UI-SPEC §3: bottom-right fixed, --surface background, 4px --accent left stripe,
	// enter opacity+translateY 200ms ease-out, exit opacity 150ms ease-in, z-index 45.
	import { onDestroy } from 'svelte';
	import { castSenderManager } from '../../lib/cast-sender.svelte.js';

	let visible = $state(false);
	let deviceName = $state<string | null>(null);
	let dismissTimer: ReturnType<typeof setTimeout> | null = null;

	function clearTimer() {
		if (dismissTimer !== null) {
			clearTimeout(dismissTimer);
			dismissTimer = null;
		}
	}

	// Watch the one-shot resume signal from the sender manager (CAST-06).
	// Reading resumeDeviceName creates the reactive dependency that re-runs this
	// effect when it changes. consumeResumeSignal() is the single safe consumption
	// point — avoids direct $state field writes from an external component (WR-04).
	$effect(() => {
		const name = castSenderManager.resumeDeviceName;
		if (name !== null) {
			clearTimer();
			deviceName = name;
			visible = true;
			// Consume via the encapsulated method (atomic read+clear, not a direct field write)
			castSenderManager.consumeResumeSignal();
			dismissTimer = setTimeout(() => {
				visible = false;
				dismissTimer = null;
			}, 3500);
		}
	});

	onDestroy(() => {
		clearTimer();
	});
</script>

{#if visible}
	<div
		class="resume-toast"
		role="status"
		aria-live="polite"
	>
		<p class="toast-heading">Verbindung wiederhergestellt</p>
		<p class="toast-body">Überträgt weiter auf: {deviceName ?? ''}</p>
	</div>
{/if}

<style>
	.resume-toast {
		position: fixed;
		bottom: 80px;
		right: 16px;
		z-index: 45;
		min-width: 240px;
		max-width: 320px;
		background: var(--surface-2);
		border: 1px solid var(--line-strong);
		border-left: 4px solid var(--accent);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		box-shadow: var(--shadow-raise);
		animation: toastEnter var(--dur-med) var(--ease) forwards;
	}

	@keyframes toastEnter {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.toast-heading {
		margin: 0 0 2px 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text);
		line-height: 1.2;
	}

	.toast-body {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--text-soft);
		line-height: 1.4;
	}
</style>
