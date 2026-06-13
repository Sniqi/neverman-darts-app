// PWA virtual module types (provided by vite-plugin-pwa via @vite-pwa/sveltekit).
// These declare `virtual:pwa-register/svelte` and `virtual:pwa-info` so svelte-check
// can resolve the imports in ReloadPrompt.svelte and +layout.svelte (Phase 6).
/// <reference types="vite-plugin-pwa/svelte" />
/// <reference types="vite-plugin-pwa/info" />

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
