import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Vitest 4: the provider is a factory from @vitest/browser-playwright,
// not the string 'playwright' (which was the Vitest 2/3 API).

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
					include: ['src/ui/**/*.test.ts']
				}
			}
		]
	}
});
