# Phase 6: PWA & Deployment - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous) — user decisions captured via AskUserQuestion

<domain>
## Phase Boundary

Make the app an installable PWA that works fully offline after first load, deployed to GitHub Pages at the project subpath, with an explicit update prompt when a new version ships. Requirements: PLAT-01, PLAT-02, PLAT-03, PLAT-04.

In scope: PWA tooling + service worker + web manifest + icons; offline precaching of the whole app (including `/sfx/*.mp3`); correct base-path handling for the Pages subpath; an "update available" prompt; a GitHub Actions deploy workflow.

Out of scope: creating the GitHub repo / enabling Pages / the actual go-live push (these require the user's GitHub account and are outward-facing — handled as a final user step, not by the autonomous run).
</domain>

<decisions>
## Implementation Decisions

### Pages target & base path (LOCKED — user)
- **Project site**: `username.github.io/neverman-darts-app`. Build with `BASE_PATH=/neverman-darts-app` (the existing `svelte.config.js` already reads `process.env.BASE_PATH`). Dev keeps base `''`.
- adapter-static is already configured with `fallback: '404.html'` — keep it (SPA fallback works on Pages; `404.html` is the Pages convention).

### Deploy mechanism (LOCKED — user)
- **GitHub Actions**: add `.github/workflows/deploy.yml` that builds with `BASE_PATH=/neverman-darts-app`, uploads the `build/` output as a Pages artifact, and deploys via `actions/deploy-pages` on push to the default branch. Pages source = "GitHub Actions".
- No remote is configured yet — the workflow is committed but only runs once the user creates the repo, enables Pages (source: GitHub Actions), and pushes.

### PWA library & update strategy (LOCKED — goal + Claude's discretion)
- Use **`@vite-pwa/sveltekit`** (the SvelteKit integration of vite-plugin-pwa / Workbox) — the recommended stack choice; no new framework runtime.
- **`registerType: 'prompt'`** — the roadmap goal mandates an explicit update prompt, NOT silent auto-update. Use `workbox-window`'s `registerSW({ onNeedRefresh })` to show a German "Neue Version verfügbar" toast/button that calls `updateSW()` on tap.
- **Precache everything** needed for offline: set `workbox.globPatterns` to include all built assets (`**/*.{js,css,html,svg,png,webp,woff2,mp3,webmanifest}`) so the app — including the SFX — works offline after first load (PLAT-02). Set the SW `scope`/`base` from Vite's base so it is correct under the subpath.

### Icons & manifest (LOCKED — user: generate placeholders)
- Generate simple on-brand **placeholder icons** now: dark `#111318` background, accent `#e8a020`, a dart/board motif. Provide `192x192`, `512x512`, and a `512x512` maskable variant (plus an Apple touch icon). User can replace later.
- Manifest: German `name`/`short_name` ("Neverman Darts"), `display: standalone`, `theme_color: #111318`, `background_color: #111318`, `start_url`/`scope` respecting the base path, `lang: de`, dark.

### Language & look (LOCKED — constraint)
- All new user-facing strings (update prompt, install copy) in **German**, dark mode. (PLAT-04)
</decisions>

<code_context>
## Existing Code Insights

- `svelte.config.js`: `@sveltejs/adapter-static` with `fallback: '404.html'`, `paths.base` from `BASE_PATH` env (dev = `''`). Ready for the subpath build.
- `@sveltejs/adapter-static@^3.0.10` installed. **NOT installed:** `vite-plugin-pwa` / `@vite-pwa/sveltekit` / `workbox-window` — Phase 6 adds them.
- `vite.config.ts` has no `base`/PWA plugin yet (SvelteKit derives base from svelte.config; the PWA plugin must be added to vite.config and read the same base).
- `static/` currently holds only `sfx/` (the Phase 5 audio assets) — must be precached. No icons/manifest yet.
- No `.github/workflows/` yet. No git remote configured (`git remote -v` empty).
- Known pre-existing tech debt: one svelte-check error at `src/db/profiles.ts:24` (from Phase 1) — unrelated to this phase; don't let it block, but a cleanup is welcome.
</code_context>

<specifics>
## Specific Ideas

- Verify offline locally before declaring done: `BASE_PATH=/neverman-darts-app npm run build` then `npm run preview`, load it, then go offline (DevTools) and confirm it still loads + the SFX still play.
- The update-prompt toast should be unobtrusive, dark, German ("Neue Version verfügbar — Aktualisieren"), and only appear when a new SW is waiting.
- Ensure all asset URLs (icons, manifest, SFX, SW registration) resolve under the `/neverman-darts-app/` base — the most common Pages-subpath failure mode.
</specifics>

<deferred>
## Deferred Ideas

- Real designed app icons (user will supply later; placeholders ship now).
- Custom domain / CNAME — not requested.
- Push notifications / background sync — out of scope for v1.0.
</deferred>

---

*Phase: 06-pwa-deployment*
*Context gathered: 2026-06-13 via autonomous smart-discuss*
