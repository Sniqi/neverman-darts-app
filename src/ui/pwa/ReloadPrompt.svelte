<script lang="ts">
	// src/ui/pwa/ReloadPrompt.svelte
	// German dark-mode update toast (PLAT-03 / PLAT-04).
	// Shown when a new service worker is waiting (needRefresh=true) or the app
	// has been cached for offline use (offlineReady=true).
	//
	// Imports useRegisterSW from virtual:pwa-register/svelte — at build time
	// this is provided by the SvelteKitPWA plugin (added in Plan 02). In tests,
	// the browser project alias in vite.config.ts redirects this to
	// src/test-mocks/pwa-register-mock.ts, which exports module-level writable
	// stores so the test and component share the same state instance.
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { onDestroy } from 'svelte';

	// Periodic SW update check; handle retained so it is cleared on unmount (WR-03).
	let updateInterval: ReturnType<typeof setInterval> | undefined;

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		onRegistered(registration) {
			if (registration) {
				updateInterval = setInterval(() => registration.update(), 60_000);
			}
		},
		onRegisterError(error) {
			console.error('SW registration error', error);
		},
	});

	onDestroy(() => {
		if (updateInterval) clearInterval(updateInterval);
	});

	function close() {
		offlineReady.set(false);
		needRefresh.set(false);
	}
</script>

{#if $needRefresh || $offlineReady}
	<div class="pwa-toast" role="alert" aria-live="polite">
		<p>
			{#if $needRefresh}
				Neue Version verfügbar — bitte aktualisieren.
			{:else}
				App bereit für Offline-Nutzung.
			{/if}
		</p>
		<div class="pwa-toast-actions">
			{#if $needRefresh}
				<button class="btn btn--cta" onclick={() => updateServiceWorker(true)}>Aktualisieren</button>
			{/if}
			<button class="btn btn--ghost" onclick={close}>Schließen</button>
		</div>
	</div>
{/if}

<style>
	.pwa-toast {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		background: var(--surface-2);
		color: var(--text);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		box-shadow: var(--shadow-raise);
		z-index: 9999;
		max-width: 22rem;
	}

	.pwa-toast p {
		margin: 0;
		font-size: var(--text-sm);
		line-height: 1.4;
	}

	.pwa-toast-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.pwa-toast-actions .btn {
		flex: 1;
		width: auto;
		min-height: var(--hit-min);
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--text-base);
	}
</style>
