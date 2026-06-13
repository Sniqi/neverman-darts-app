// src/test-mocks/pwa-register-mock.ts
// Shared stand-in for `virtual:pwa-register/svelte` in tests.
// The browser project's test.alias in vite.config.ts redirects that virtual
// module here so no real PWA plugin is needed during vitest runs (Pitfall 5).
//
// The stores are module-level so the test and the component share the SAME
// writable instance when the alias is active — the test sets needRefresh.set(true)
// before render and the component reads $needRefresh correctly.
import { writable } from 'svelte/store';

export const needRefresh = writable(false);
export const offlineReady = writable(false);

export function useRegisterSW(
	_options?: {
		onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (e: unknown) => void;
	}
) {
	return {
		needRefresh,
		offlineReady,
		updateServiceWorker: async (_reloadPage?: boolean) => {},
	};
}
