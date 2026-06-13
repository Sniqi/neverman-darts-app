// src/test-mocks/pwa-register-mock.ts
// Shared stand-in for `virtual:pwa-register/svelte` in tests.
// The browser project's test.alias in vite.config.ts redirects that virtual
// module here so no real PWA plugin is needed during vitest runs (Pitfall 5).
//
// Module-level design: the test and the component share the SAME store and
// updateServiceWorker instances because ESM modules are singletons. vi.spyOn
// cannot redefine ESM exports in browser mode (ESM namespace is not configurable),
// so instead this mock tracks calls in `updateSWCalls` — an exported array the
// test can inspect and reset between cases.
import { writable } from 'svelte/store';

export const needRefresh = writable(false);
export const offlineReady = writable(false);

/** Tracks arguments passed to updateServiceWorker. Reset in beforeEach via .splice(0). */
export const updateSWCalls: Array<boolean | undefined> = [];

export function useRegisterSW(
	_options?: {
		onRegistered?: (r: ServiceWorkerRegistration | undefined) => void;
		onRegisterError?: (e: unknown) => void;
	}
) {
	return {
		needRefresh,
		offlineReady,
		updateServiceWorker: async (reloadPage?: boolean) => {
			updateSWCalls.push(reloadPage);
		},
	};
}
