// e2e/offline-fonts.spec.ts
// FOUND-02 end-to-end: self-hosted fonts survive a fully-offline reload.
//
// Why this spec runs its own static server instead of the shared vite preview
// (port 4173): SvelteKit's `vite preview` serves the kit client output, not the
// adapter-static `build/` directory — it returns 404 for `build/404.html`, which
// IS in the SW precache manifest (adapterFallback). One failed precache entry
// aborts the whole service-worker install, so the SW never takes control under
// vite preview. GitHub Pages (production) serves every build/ file directly, so
// the tiny server below mirrors production semantics. The shared webServer still
// runs first (`npm run build && npm run preview`), guaranteeing build/ is fresh.
//
// The offline assertion is a genuine regression guard for RESEARCH.md Pitfall 4:
// remove `woff2` from vite.config.ts globPatterns and the font file is absent
// from the precache, the offline fetch fails, and document.fonts.check() stays
// false after the reload.

import { test, expect } from 'playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const PORT = 4517;
const BUILD_DIR = join(import.meta.dirname, '..', 'build');

const MIME: Record<string, string> = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.mp3': 'audio/mpeg',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
	'.txt': 'text/plain'
};

let server: Server;

test.beforeAll(async () => {
	server = createServer(async (req, res) => {
		// Strip query (workbox appends ?__WB_REVISION__ cache-busters)
		const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
		const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
		const candidates = [
			join(BUILD_DIR, safe),
			join(BUILD_DIR, safe, 'index.html'),
			join(BUILD_DIR, '404.html') // SPA fallback, like GitHub Pages
		].filter((p) => p.startsWith(BUILD_DIR + sep) || p === BUILD_DIR);

		for (const file of candidates) {
			try {
				const body = await readFile(file);
				res.writeHead(200, {
					'content-type': MIME[extname(file)] ?? 'application/octet-stream'
				});
				res.end(body);
				return;
			} catch {
				// try next candidate
			}
		}
		res.writeHead(404).end();
	});
	await new Promise<void>((resolve) => server.listen(PORT, resolve));
});

test.afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((err) => (err ? reject(err) : resolve()))
	);
});

test.describe('FOUND-02: offline fonts', () => {
	test('Barlow remains available after going offline and reloading', async ({
		page,
		context
	}) => {
		test.setTimeout(120_000);

		// ── Step 1: First load — SW installs and precaches all assets ───────────
		await page.goto(`http://localhost:${PORT}/`);

		// Wait until the service worker controls the page. clientsClaim (via
		// registerType: 'autoUpdate') means this happens without a manual reload,
		// and control implies the install — i.e. the full precache — succeeded.
		await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
			timeout: 60_000
		});

		// Sanity: the font is loadable online (guards against a broken @font-face
		// path making the offline assertion vacuously test the wrong thing).
		await page.evaluate(() => document.fonts.load('600 16px Barlow'));
		expect(await page.evaluate(() => document.fonts.check('600 16px Barlow'))).toBe(true);

		// ── Step 2: Go offline and reload — everything must come from the SW ────
		await context.setOffline(true);
		await page.reload();

		// document.fonts.check() only returns true once the face is actually
		// loaded, so force a load first; offline, it can only come from the
		// SW precache — a network fetch would fail.
		await page.evaluate(() => document.fonts.load('600 16px Barlow'));
		const barlowAvailableOffline = await page.evaluate(() =>
			document.fonts.check('600 16px Barlow')
		);
		expect(barlowAvailableOffline).toBe(true);

		// ── Step 3: Restore connectivity so other specs are unaffected ──────────
		await context.setOffline(false);
	});
});
