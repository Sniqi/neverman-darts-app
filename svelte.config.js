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
				: (process.env.BASE_PATH ?? '')
		},
		serviceWorker: {
			register: false // Prevent conflict with @vite-pwa/sveltekit SW (RESEARCH Pattern 2 / Pitfall 3)
		}
	}
};

export default config;
