import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: process.argv.includes('dev')
				? ''
				: (process.env.BASE_PATH ?? ''),
			// Absolute asset paths (e.g. /neverman-darts-app/_app/...) instead of relative
			// (../_app/...). Relative paths only resolve at the exact prerendered URL with a
			// trailing slash; a direct/full load of a deep route — notably the Cast receiver
			// loading /display, or a manual reload — resolves them one level too high and 404s
			// every chunk, so SvelteKit never boots (RECV-01 "Failed to cast"). (UAT 07, 3rd pass)
			relative: false
		},
		serviceWorker: {
			register: false // Prevent conflict with @vite-pwa/sveltekit SW (RESEARCH Pattern 2 / Pitfall 3)
		}
	}
};

export default config;
