import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'node:path';

// Vitest 4: the provider is a factory from @vitest/browser-playwright,
// not the string 'playwright' (which was the Vitest 2/3 API).

// SvelteKitPWA is excluded during Vitest runs (VITEST env is set) to prevent
// virtual:pwa-register/svelte and virtual:pwa-info from being unavailable in tests.
// Browser tests use aliases in the browser project to redirect these virtual modules
// to mocks (see test.alias below). (RESEARCH Pattern 7 / Pitfall 5)

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Guard: exclude SvelteKitPWA in Vitest so virtual modules don't break tests
		!process.env.VITEST && SvelteKitPWA({
			registerType: 'prompt',
			scope: base + '/',
			base: base + '/',
			kit: {
				spa: true,
				adapterFallback: '404.html',
				includeVersionFile: true,
			},
			manifest: {
				name: 'Neverman Darts',
				short_name: 'Neverman Darts',
				description: 'X01 Darts Wertung',
				lang: 'de',
				start_url: base + '/',
				scope: base + '/',
				display: 'standalone',
				theme_color: '#111318',
				background_color: '#111318',
				icons: [
					{ src: base + '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
					{ src: base + '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{
						src: base + '/maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
					{ src: base + '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
				],
			},
			workbox: {
				// client/** prefix matches .svelte-kit/output/client/ (Pitfall 7)
				// mp3 explicitly included so SFX are precached for offline play (Pitfall 4)
				// prerendered/** omitted — pure SPA, no prerendered pages (Anti-Pattern)
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
				navigateFallback: base + '/404.html',
				// D-03/D-04: Exclude /display from SW navigation fallback so the Chromecast
				// receiver fetches the prerendered build/display/index.html directly, not the
				// SPA 404.html shell. Without this denylist entry the SW intercepts the
				// receiver URL and returns the SPA shell, which the Cast SDK cannot parse
				// (Pitfall 7 — navigateFallback must not intercept prerendered routes).
				navigateFallbackDenylist: [/\/display(\/|$)/],
			},
			devOptions: {
				enabled: false,
			},
		}),
	].filter(Boolean),
	test: {
		projects: [
			{
				// Pure logic: engine, db, lib
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.ts', '!src/ui/**/*.test.ts'],
					setupFiles: ['src/test-setup-node.ts'],
					server: {
						deps: {
							inline: ['@sveltejs/kit']
						}
					}
				}
			},
			{
				// Component tests: dartboard hit-detection, score panel
				extends: './vite.config.ts',
				test: {
					name: 'browser',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/ui/**/*.test.ts'],
					// Redirect PWA virtual modules to mocks so browser-mode tests never
					// need the real SvelteKitPWA plugin (Pitfall 5 / RESEARCH Pattern 7).
					// Also redirect cast-receiver to its mock so browser-mode component
					// tests can force isCastReceiverContext() true via setMockReceiverContext()
					// without needing a real Chromecast SDK (D-10 dev workflow).
					alias: {
						'virtual:pwa-register/svelte': resolve(
							import.meta.dirname,
							'src/test-mocks/pwa-register-mock.ts'
						),
						'virtual:pwa-info': resolve(
							import.meta.dirname,
							'src/test-mocks/pwa-info-mock.ts'
						),
						'../../lib/cast-receiver.js': resolve(
							import.meta.dirname,
							'src/test-mocks/cast-receiver-mock.ts'
						)
					}
				}
			}
		]
	}
});
