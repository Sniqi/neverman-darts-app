---
phase: 06-pwa-deployment
plan: "02"
subsystem: pwa-icons-and-plugin
tags: [pwa, sveltekit, workbox, icons, manifest, offline, german-ui, subpath]
dependency_graph:
  requires: [pwa-toolchain, virtual-module-mocks, reload-prompt-component]
  provides: [pwa-plugin-wired, brand-icons, web-manifest, service-worker, offline-precache]
  affects: [vite.config.ts, svelte.config.js, src/routes/+layout.svelte, static/]
tech_stack:
  added:
    - "@vite-pwa/assets-generator@1.0.2 (used for icon generation)"
  patterns:
    - SvelteKitPWA() plugin with !process.env.VITEST guard + .filter(Boolean)
    - base = process.env.BASE_PATH ?? '' read once; all PWA URLs prefixed with base
    - virtual:pwa-info dynamic manifest link injection in root layout
    - Dynamic import of ReloadPrompt in layout to avoid SSR issues
    - kit.serviceWorker.register false to prevent SvelteKit/plugin SW conflict
    - workbox globPatterns include mp3 for offline SFX; omit prerendered/** (pure SPA)
key_files:
  created:
    - static/logo.svg
    - static/pwa-64x64.png
    - static/pwa-192x192.png
    - static/pwa-512x512.png
    - static/maskable-icon-512x512.png
    - static/apple-touch-icon-180x180.png
    - static/favicon.ico
    - pwa-assets.config.ts
  modified:
    - vite.config.ts
    - svelte.config.js
    - src/routes/+layout.svelte
decisions:
  - "Double-slash workaround for Windows/Git Bash POSIX path expansion: BASE_PATH='//neverman-darts-app' in Git Bash shell; process.env receives '/neverman-darts-app' correctly. The GitHub Actions workflow uses env: BASE_PATH: '/${{ github.event.repository.name }}' so this is a local-only concern."
  - "prerendered/** omitted from globPatterns: pure SPA with adapter fallback, no prerendered pages; including it would produce a Workbox 0-match warning"
  - "devOptions.enabled false: no SW in dev mode to avoid stale cache confusion"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-13"
  tasks_completed: 3
  files_created: 8
  files_modified: 3
  tests_before: 427
  tests_after: 427
---

# Phase 06 Plan 02: PWA Icons + Plugin Wiring Summary

**One-liner:** SvelteKitPWA plugin wired with subpath-correct German manifest and mp3 precache; placeholder brand icons generated from SVG; manifest link and ReloadPrompt mounted in root layout; subpath production build verified.

## What Was Built

### Task 1 — Generate placeholder brand icons from a source SVG

Created `static/logo.svg`: 512×512 SVG with dark `#111318` background, concentric `#e8a020` dartboard rings, accent bull, and "N" monogram.

Created `pwa-assets.config.ts` at project root: `@vite-pwa/assets-generator` config using `minimal2023Preset` with `compressionLevel: 9 / quality: 95`.

Ran `npx pwa-assets-generator` to produce in `static/`:
- `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`
- `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`

All icon files are committed as static assets (served by Pages, not generated at build time).

**Verification:** `static/logo.svg` contains `#e8a020`; all four manifest-referenced PNGs exist.

### Task 2 — Wire SvelteKitPWA plugin, disable SvelteKit SW, inject manifest + mount ReloadPrompt

**`vite.config.ts`:** Added `SvelteKitPWA()` import and plugin block:
- Guarded by `!process.env.VITEST` with `.filter(Boolean)` — existing 427-test suite remains unaffected
- `registerType: 'prompt'` (explicit update, not silent)
- `const base = process.env.BASE_PATH ?? ''` read once at top of file
- `scope: base + '/'`, `base: base + '/'` (trailing slash required for SW scope — Pitfall 2)
- `kit: { spa: true, adapterFallback: '404.html', includeVersionFile: true }`
- German manifest: name 'Neverman Darts', description 'X01 Darts Wertung', lang 'de', theme/background `#111318`
- All manifest icon `src` values prefixed with `base` (e.g. `base + '/pwa-192x192.png'`)
- `workbox.globPatterns`: `['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}']` — mp3 explicit for offline SFX (Pitfall 4); `prerendered/**` omitted (Anti-Pattern)
- `workbox.navigateFallback: base + '/404.html'`
- `devOptions.enabled: false`

**`svelte.config.js`:** Added `kit.serviceWorker.register: false` to prevent SvelteKit's built-in SW from conflicting with the plugin SW (Pitfall 3 / RESEARCH Pattern 2).

**`src/routes/+layout.svelte`:** Updated to:
- Import `pwaInfo` from `virtual:pwa-info` (resolved to stub mock in tests)
- `$derived` `webManifest` from `pwaInfo.webManifest.linkTag` (or empty string when falsy)
- `<svelte:head>{@html webManifest}</svelte:head>` for manifest link injection
- `{#await import('../ui/pwa/ReloadPrompt.svelte') then ...}` dynamic import to avoid SSR issues

**Verification:** All 427 tests green (353 unit + 74 browser). VITEST guard keeps virtual modules out of both test projects.

### Task 3 — Production build emits manifest + SW + mp3 precache under the subpath

Ran `BASE_PATH='//neverman-darts-app' npm run build` (double-slash workaround for Windows/Git Bash POSIX path expansion — see Deviations).

PWA plugin reported: `67 entries (454.32 KiB)` in precache.

All build assertions passed:
- `build/manifest.webmanifest` exists — contains `/neverman-darts-app/` in `start_url`, `scope`, and all icon `src` values
- `build/sw.js` exists
- SW precache includes `sfx/180.mp3`, `sfx/record.mp3`, `sfx/highfinish.mp3` with revision hashes
- No source edits required — config was correct first time

### Task 4 — Checkpoint automated portion (manual UAT documented below)

All automatically-verifiable assertions from the checkpoint were covered in Task 3. Manual install/offline verification steps are documented in the "Manual Verification" section below.

## Manual Verification Required (Task 4 — PLAT-01)

The following steps require a human to perform in a browser. Run locally:

```bash
BASE_PATH='//neverman-darts-app' npm run build
npm run preview
```

Then open `http://localhost:4173/neverman-darts-app/` (the SUBPATH — not root, which shows blank for a subpath build — Pitfall 8).

**Checklist:**
1. DevTools → Application → Manifest: confirm name "Neverman Darts", theme/background `#111318`, icons load without 404s, no manifest errors, install affordance is offered
2. DevTools → Application → Service Workers: confirm SW is registered/active with scope `http://localhost:4173/neverman-darts-app/` (trailing slash)
3. DevTools → Application → Cache Storage: confirm `.mp3` entries are present (`sfx/180.mp3`, `sfx/record.mp3`, `sfx/highfinish.mp3`)
4. DevTools → Network → check "Offline", then reload: app loads from cache
5. Navigate to `/neverman-darts-app/match` and `/neverman-darts-app/display` while offline: no broken assets, routes resolve. If a route 404s offline, add `workbox.navigateFallbackAllowlist: [/^\/neverman-darts-app\//]` to `vite.config.ts` per RESEARCH Open Question 1
6. Trigger a 180 (or a record) while offline: confirm SFX plays (mp3 served from cache)

**Note on Windows build command:** In Git Bash, use `BASE_PATH='//neverman-darts-app' npm run build` (double slash prevents POSIX path expansion to `C:/Program Files/Git/neverman-darts-app`). The GitHub Actions workflow uses `env: BASE_PATH: '/${{ github.event.repository.name }}'` which is not subject to this expansion — no change needed there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Windows/Git Bash POSIX path expansion of `/neverman-darts-app`**
- **Found during:** Task 3 (first build attempt)
- **Issue:** `BASE_PATH=/neverman-darts-app npm run build` in Git Bash on Windows caused the shell to expand `/neverman-darts-app` as a POSIX path to `C:/Program Files/Git/neverman-darts-app`. SvelteKit rejected this non-root-relative value with: `config.kit.paths.base option must either be the empty string or a root-relative path that starts but doesn't end with '/'`
- **Fix:** Use `BASE_PATH='//neverman-darts-app'` (double-slash prefix). Git Bash passes `//` paths through without POSIX expansion; Node.js `process.env` then receives `/neverman-darts-app` correctly. This is documented in the SUMMARY decisions and the Manual Verification section.
- **GitHub Actions impact:** None — the workflow uses YAML `env:` syntax which bypasses shell path expansion entirely.
- **Files modified:** None — config change only in how the build command is invoked locally.

## Known Stubs

None — the PWA plugin, icons, manifest, SW, and layout wiring are fully configured. The placeholder icons (`static/logo.svg` and generated PNGs) are intentional per the LOCKED CONTEXT decision: user replaces brand icons later.

## Threat Flags

None — this plan adds only static asset files and build-time plugin configuration. No new network endpoints, auth paths, or trust boundary crossings beyond what is documented in the plan's threat model (T-06-03 through T-06-06, all mitigated/accepted in the plan). SW scope is bounded to `/neverman-darts-app/` — same-origin only, cannot intercept cross-origin requests (T-06-03 mitigated).

## Self-Check: PASSED
