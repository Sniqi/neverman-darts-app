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

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		onRegistered(registration) {
			if (registration) {
				setInterval(() => registration.update(), 60_000);
			}
		},
		onRegisterError(error) {
			console.error('SW registration error', error);
		},
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
				<button onclick={() => updateServiceWorker(true)}>Aktualisieren</button>
			{/if}
			<button onclick={close}>Schließen</button>
		</div>
	</div>
{/if}

<style>
	.pwa-toast {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		background: var(--surface, #1e2027);
		color: var(--text, #f0f0f0);
		border: 1px solid var(--accent, #e8a020);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		z-index: 9999;
		max-width: 22rem;
	}

	.pwa-toast p {
		margin: 0;
		font-size: 14px;
		line-height: 1.4;
	}

	.pwa-toast-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	button {
		background: none;
		border: 1px solid var(--accent, #e8a020);
		color: var(--accent, #e8a020);
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		transition: opacity 150ms ease;
	}

	button:active {
		opacity: 0.85;
	}

	/* Primary action: filled accent, dark text */
	button:first-child {
		background: var(--accent, #e8a020);
		color: #111318;
	}
</style>
