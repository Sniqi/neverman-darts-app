import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'node:path';

// Vitest 4: the provider is a factory from @vitest/browser-playwright,
// not the string 'playwright' (which was the Vitest 2/3 API).

// Plan 02 will append:
//   !process.env.VITEST && SvelteKitPWA({ registerType: 'prompt', ... })
// to the plugins array (with .filter(Boolean)) once the real PWA plugin is added.
// This guard ensures the existing test suite never loads the real virtual module.

export default defineConfig({
	plugins: [sveltekit()],
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
					alias: {
						'virtual:pwa-register/svelte': resolve(
							import.meta.dirname,
							'src/test-mocks/pwa-register-mock.ts'
						),
						'virtual:pwa-info': resolve(
							import.meta.dirname,
							'src/test-mocks/pwa-info-mock.ts'
						)
					}
				}
			}
		]
	}
});
