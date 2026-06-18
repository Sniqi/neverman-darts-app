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
	// When resumeDeviceName becomes non-null: capture the name, show the toast,
	// consume the signal (reset to null), and start the 3500ms auto-dismiss timer.
	$effect(() => {
		const name = castSenderManager.resumeDeviceName;
		if (name !== null) {
			clearTimer();
			deviceName = name;
			visible = true;
			// Consume the one-shot signal so it does not re-trigger
			castSenderManager.resumeDeviceName = null;
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
		background: var(--surface, #1e2027);
		border: 1px solid var(--line-strong, rgba(255, 255, 255, 0.14));
		border-left: 4px solid var(--accent, #e8a020);
		border-radius: var(--radius-md, 12px);
		padding: 12px 16px;
		box-shadow: var(--shadow-raise, 0 2px 10px rgba(0, 0, 0, 0.4));
		animation: toastEnter 200ms ease-out forwards;
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
		font-size: 16px;
		font-weight: 600;
		color: var(--text, #f0f0f0);
		line-height: 1.2;
	}

	.toast-body {
		margin: 0;
		font-size: 14px;
		font-weight: 400;
		color: rgba(240, 240, 240, 0.6);
		line-height: 1.4;
	}
</style>
