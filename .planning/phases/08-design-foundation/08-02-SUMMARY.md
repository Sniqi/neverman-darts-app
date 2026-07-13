---
phase: 08-design-foundation
plan: 02
subsystem: ui
tags: [fonts, woff2, pwa, workbox, precache, playwright, offline]

# Dependency graph
requires:
  - "08-01: src/app.css aggregator (fonts import slot deferred to this plan)"
provides:
  - "src/styles/fonts/*.woff2 — 7 self-hosted Barlow/Barlow Semi Condensed binaries + OFL.txt"
  - "src/styles/fonts.css — 7 @font-face rules (Barlow 400/500/600/700, BSC 600/700/800), font-display: swap"
  - "src/app.css completed as 5-import aggregator (fonts.css added)"
  - "vite.config.ts globPatterns precaches woff2/ttf; manifest colors = DS --bg #0c0e14"
  - "e2e/offline-fonts.spec.ts — automated proof fonts survive a fully-offline reload"
affects: [08-03, 08-04, 08-05, 08-06, phase-09, phase-10, phase-11, phase-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fonts under src/styles/fonts/ referenced via relative url() → Vite hashes them into _app/immutable/assets/ (subpath-safe on GitHub Pages)"
    - "PWA globPatterns is an explicit allowlist — every new asset extension must be added or it silently fails offline (Pitfall 4)"
    - "SW-dependent E2E specs must serve build/ with an in-spec static server; SvelteKit's vite preview 404s build/404.html (a precache entry) which aborts SW install"

key-files:
  created:
    - src/styles/fonts.css
    - src/styles/fonts/Barlow-Regular.woff2
    - src/styles/fonts/Barlow-Medium.woff2
    - src/styles/fonts/Barlow-SemiBold.woff2
    - src/styles/fonts/Barlow-Bold.woff2
    - src/styles/fonts/BarlowSemiCondensed-SemiBold.woff2
    - src/styles/fonts/BarlowSemiCondensed-Bold.woff2
    - src/styles/fonts/BarlowSemiCondensed-ExtraBold.woff2
    - src/styles/fonts/OFL.txt
    - e2e/offline-fonts.spec.ts
  modified:
    - src/app.css
    - vite.config.ts

key-decisions:
  - "All 7 TTFs converted to WOFF2 successfully (no TTF fallback needed): ~740KB → ~278KB (62% smaller precache)"
  - "Skipped the optional <link rel=preload> for font files (plan-granted discretion) — font-display: swap already prevents invisible text, and a base-path-aware preload URL adds complexity for marginal first-paint gain"
  - "offline-fonts E2E hosts its own dependency-free node:http static server over build/ (port 4517) instead of the shared vite preview — vite preview serves kit client output, not adapter-static build/, so build/404.html 404s, one failed precache entry aborts the whole SW install, and the SW never takes control. GitHub Pages serves every build/ file directly, so the static server mirrors production semantics. playwright.config.ts unchanged."
  - "pip install skipped — fonttools 4.63.0 and brotli already installed and verified in the environment (per research session)"

patterns-established:
  - "SW-E2E pattern: in-spec node:http server over build/ with MIME map, query-string stripping (workbox __WB_REVISION__ cache-busters), and 404.html SPA fallback — then page.waitForFunction(navigator.serviceWorker.controller !== null) implies precache completed (control ⇒ install succeeded, clientsClaim via autoUpdate)"
  - "Non-tautology proof for precache regression guards: rebuild with the extension removed from globPatterns and confirm the spec fails"

requirements-completed: [FOUND-02]

coverage:
  - id: D1
    description: "7 Barlow/BSC weights self-hosted as WOFF2 under src/styles/fonts/ with OFL.txt, each smaller than its TTF source"
    requirement: "FOUND-02"
    verification:
      - kind: other
        ref: "per-file size check: every .woff2 < source .ttf (e.g. Barlow-Regular 104,068 → 38,456 bytes); 7 binaries + OFL.txt present"
        status: pass
    human_judgment: false
  - id: D2
    description: "Fonts wired via @font-face and precached by the SW; manifest colors reflect DS background"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "npm run build → 7 hashed .woff2 in build/_app/immutable/assets/ AND all 7 listed in build/sw.js precache manifest"
        status: pass
      - kind: other
        ref: "grep vite.config.ts: globPatterns contains woff2/ttf; theme_color/background_color = #0c0e14; 0 matches for #111318"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fonts remain available fully offline after first load (FOUND-02 'loads offline' clause, first automated coverage)"
    requirement: "FOUND-02"
    verification:
      - kind: e2e
        ref: "e2e/offline-fonts.spec.ts#Barlow remains available after going offline and reloading — document.fonts.check('600 16px Barlow') true after context.setOffline(true) + reload"
        status: pass
      - kind: e2e
        ref: "negative control: rebuilt with woff2 removed from globPatterns → spec fails (genuine Pitfall 4 regression guard, not a tautology)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 2: Self-Hosted Fonts + Offline Precache Summary

**Barlow + Barlow Semi Condensed (7 weights) converted TTF→WOFF2 with fonttools, self-hosted under src/styles/fonts/, wired via @font-face into the app.css aggregator, precached by the SW via extended globPatterns, and proven to survive a fully-offline reload by a new E2E spec.**

## What Was Built

- **7 WOFF2 font binaries + OFL.txt** (`src/styles/fonts/`): Barlow 400/500/600/700 for UI text, Barlow Semi Condensed 600/700/800 for score numerals. All conversions succeeded (~740KB TTF → ~278KB WOFF2); the CONTEXT.md TTF fallback was not needed.
- **`src/styles/fonts.css`**: 7 `@font-face` blocks mirroring `design/tokens/fonts.css` exactly, with `url()` paths rewritten from `../assets/fonts/*.ttf` to `./fonts/*.woff2` and `format("woff2")`; `font-display: swap` kept on every block.
- **`src/app.css`**: fonts.css added as the 5th import, completing the aggregator 08-01 left a slot for.
- **`vite.config.ts`**: `workbox.globPatterns` extended with `woff2,ttf` so the SW precaches fonts (RESEARCH.md Pitfall 4 — globPatterns is an explicit allowlist); manifest `theme_color`/`background_color` corrected from provisional `#111318` to DS `--bg` `#0c0e14` (FOUND-01 sweep).
- **`e2e/offline-fonts.spec.ts`**: first automated coverage for FOUND-02's offline clause — SW takes control, browser context goes offline, page reloads, `document.fonts.check('600 16px Barlow')` returns true.

## Task Commits

1. **Task 0: Package legitimacy checkpoint (fonttools, brotli)** — no commit (verification-only). Approved: fonttools → github.com/fonttools/fonttools (4.63.0), brotli → github.com/google/brotli (1.2.0); both dev-time only, already installed and exercised in this environment. Verification outcome recorded in the Task 1 commit message.
2. **Task 1: Convert 7 TTFs to WOFF2** — `44ef6ab` (feat)
3. **Task 2: Wire fonts.css, complete app.css, extend precache, fix manifest colors** — `50b0d2a` (feat)
4. **Task 3: Offline-fonts E2E spec** — `20fb848` (test)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Plan's SW-test assumption false under vite preview — spec hosts its own static server**
- **Found during:** Task 3
- **Issue:** The plan assumed "webServer runs npm run build && npm run preview, so the SW is genuinely active in this test context." In practice SvelteKit's `vite preview` serves the kit client output, not adapter-static `build/` — `build/404.html` (in the SW precache manifest via `adapterFallback`) returns 404, one failed precache entry aborts the entire SW install, the registration is discarded, and `navigator.serviceWorker.controller` never becomes non-null. Diagnosed by instrumenting `navigator.serviceWorker.register` (call succeeds, registration later vanishes) and curling all 423 precache URLs (only `404.html` failed).
- **Fix:** The spec starts a ~50-line dependency-free `node:http` static server over `build/` on port 4517 (MIME map, `__WB_REVISION__` query stripping, 404.html SPA fallback — mirroring GitHub Pages semantics). The shared webServer still runs first, keeping `build/` fresh; `playwright.config.ts` and the other specs are untouched. No new packages installed.
- **Files modified:** e2e/offline-fonts.spec.ts
- **Commit:** `20fb848`

### Notes

- **pip install skipped:** fonttools/brotli were already installed and verified working (per phase research); no new supply-chain event occurred. Task 0 approval is recorded in the Task 1 commit body.
- **Optional preload links skipped** per plan-granted discretion (see key-decisions).
- **vite preview quirk documented for future plans:** any future SW-dependent E2E must not rely on `vite preview`.

## Deferred Issues

**6 pre-existing E2E failures (NOT caused by this plan)** — `e2e/full-match-flow.spec.ts` (1), `e2e/resume.spec.ts` (2), `e2e/spectator-sync.spec.ts` (3) fail identically at the pre-plan baseline commit `eaec1c7` (verified via a disposable git worktree). 08-01 only verified vitest + its own spec, so no green full-E2E baseline exists after 08-01; breakage may predate Phase 8. Logged in `.planning/phases/08-design-foundation/deferred-items.md`; not fixed per executor scope boundary. `e2e/reduced-motion.spec.ts` and `e2e/offline-fonts.spec.ts` pass.

## Verification

- `npm run build` clean; 7 hashed `.woff2` files in `build/_app/immutable/assets/` and all 7 present in `build/sw.js` precache manifest
- `npm test` (unit + browser): **512/512 passed**
- `npx playwright test e2e/offline-fonts.spec.ts`: **passed** (891ms–953ms)
- Negative control: removing `woff2` from globPatterns + rebuild → spec **fails** (genuine regression guard)
- `grep`: vite.config.ts contains `woff2` (2) and `#0c0e14` (2), zero `#111318`

## Known Stubs

None — no placeholder values or unwired data introduced.

## Threat Flags

None — no new attack surface beyond the plan's threat model (dev-time pip packages were human-verified per T-08-02-SC; font binaries are public OFL assets).

## Self-Check: PASSED

- src/styles/fonts.css — FOUND
- src/styles/fonts/Barlow-Regular.woff2 (+6 siblings) + OFL.txt — FOUND
- e2e/offline-fonts.spec.ts — FOUND
- Commits 44ef6ab, 50b0d2a, 20fb848 — FOUND in git log
