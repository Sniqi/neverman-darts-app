---
phase: 01-playable-x01-match
plan: 01
subsystem: infra
tags: [sveltekit, svelte5, adapter-static, dexie, indexeddb, vitest, playwright, typescript]

# Dependency graph
requires: []
provides:
  - SvelteKit 2.64 + Svelte 5.56 scaffold building to static output (GitHub Pages ready)
  - Dexie AppDB version(1) with profiles table; version(2)+ reserved for Phase 3
  - Profile interface contract (id, name, color, initial, createdAt)
  - Vitest 4 multi-project test harness (unit: node + fake-indexeddb; browser: playwright provider)
  - Playwright E2E harness with webServer wrapping build+preview
  - Failing FLOW-01 happy-path E2E spec (RED baseline until Plans 03+04)
  - skeletonStore placeholder runes store (to be replaced by matchStore in Plan 02)
  - Routes /, /setup, /match with dark-mode design tokens in app.css
affects: [01-02, 01-03, 01-04, spectator, persistence, pwa-deployment]

# Tech tracking
tech-stack:
  added:
    - "@sveltejs/kit@2.64.0"
    - "svelte@5.56.3"
    - "@sveltejs/adapter-static@3.0.10"
    - "typescript@~5.9.3"
    - "dexie@4.4.3"
    - "vitest@4.1.8"
    - "@vitest/browser@4.1.8"
    - "@vitest/browser-playwright@4.1.8"
    - "vitest-browser-svelte@2.1.1"
    - "playwright@1.60.0"
    - "svelte-check@4.6.0"
    - "fake-indexeddb (dev)"
    - "@types/node (dev)"
  patterns:
    - "Class-based .svelte.ts runes store (SkeletonStore proves the pattern for Plan 02 matchStore)"
    - "Dexie liveQuery wrapped in a svelte/store readable for reactive DB reads (no extra package)"
    - "SPA static export: prerender=true + ssr=false + adapter-static fallback 404.html"
    - "paths.base from BASE_PATH env (empty in dev, repo subpath at Phase 6 deploy)"
    - "Try/catch around all Dexie writes; inline non-blocking error, app continues (T-01-02)"

key-files:
  created:
    - package.json
    - svelte.config.js
    - vite.config.ts
    - tsconfig.json
    - .gitignore
    - static/.nojekyll
    - src/app.html
    - src/app.css
    - src/routes/+layout.svelte
    - src/routes/+layout.ts
    - src/routes/+page.svelte
    - src/routes/setup/+page.svelte
    - src/routes/match/+page.svelte
    - src/db/db.ts
    - src/db/profiles.test.ts
    - src/stores/skeleton.svelte.ts
    - e2e/full-match-flow.spec.ts
    - playwright.config.ts
  modified:
    - .planning/phases/01-playable-x01-match/SKELETON.md

key-decisions:
  - "Vitest 4 browser provider is a factory import from @vitest/browser-playwright — the string 'playwright' was the Vitest 2/3 API and fails type-check under Vitest 4.1"
  - "Root redirect uses goto(`${base}/setup`) instead of resolve('/setup') because resolve()'s route typing rejects routes that do not exist yet at Task 1 time"
  - "fake-indexeddb backs Dexie in the node unit project (plan-sanctioned dev dependency)"
  - "deps.inline for @sveltejs/kit lives under test.server.deps in Vitest 4 (moved from test.deps)"

patterns-established:
  - "Runes class store: class with $state field + methods, exported singleton from .svelte.ts"
  - "liveQuery → readable wrapper for reactive Dexie reads in Svelte components"
  - "Per-task conventional commits scoped (01-01)"

requirements-completed: [PROF-01, INP-01]

# Metrics
duration: 14min
completed: 2026-06-10
---

# Phase 1 Plan 01: Walking Skeleton Summary

**SvelteKit 2 + Svelte 5 static scaffold with a real Dexie profile write/read on /setup, one wired runes-store dartboard tap on /match, Vitest unit+browser projects, and the failing FLOW-01 E2E RED baseline**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-10T16:30:00Z
- **Completed:** 2026-06-10T16:43:33Z
- **Tasks:** 4
- **Files modified:** 19

## Accomplishments

- Greenfield SvelteKit scaffold builds to pure static output (`build/` with `index.html` + `404.html` fallback), type-checks with 0 errors/0 warnings, GitHub Pages base path wired via `BASE_PATH`
- Real end-to-end persistence proof: `/setup` writes a `Profile` via `db.profiles.add` and reactively renders it back through a `liveQuery` → `readable` wrapper
- Real UI reactivity proof: `/match` placeholder board decrements a runes-driven score on `pointerdown` via `skeletonStore.tap(20)`
- Test backbone: Vitest 4 multi-project (unit node + browser chromium), first PROF-01 unit test green, Playwright E2E harness running against the built app
- FLOW-01 happy-path spec exists and fails at element-not-found on the unbuilt routes — the correct RED state (webServer build/start succeeded)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold SvelteKit + adapter-static + Vitest multi-project + Dexie** - `454abcd` (feat)
2. **Task 2: Write the failing end-to-end happy-path spec** - `2d39865` (test)
3. **Task 3: Thin end-to-end slice — real Dexie read/write + one wired dartboard tap** - `918c55a` (feat)
4. **Task 4: Emit SKELETON.md architectural backbone** - `d2c879e` (docs)

## Files Created/Modified

- `package.json` - Pinned deps (TS ~5.9, not 6.x) + dev/build/test scripts
- `svelte.config.js` - adapter-static, fallback 404.html, paths.base from BASE_PATH
- `vite.config.ts` - sveltekit plugin + Vitest projects (unit/node, browser/chromium)
- `src/db/db.ts` - Dexie AppDB v1 profiles table, Profile interface contract, ensureDbOpen guard
- `src/routes/setup/+page.svelte` - Skeleton setup: real Dexie write + reactive read
- `src/routes/match/+page.svelte` - Skeleton match: wired tap → skeletonStore
- `src/stores/skeleton.svelte.ts` - Placeholder runes store (deleted in Plan 02)
- `src/db/profiles.test.ts` - PROF-01 create+read unit test (fake-indexeddb)
- `e2e/full-match-flow.spec.ts` - Failing FLOW-01 RED baseline
- `playwright.config.ts` - webServer (build+preview on :4173), testDir e2e
- `src/app.css` - Dark-mode color + spacing tokens per UI-SPEC
- `.planning/phases/01-playable-x01-match/SKELETON.md` - Verified against as-built

## Decisions Made

- **Vitest 4 provider API:** `provider: playwright()` imported from `@vitest/browser-playwright` (separate official package, confirmed via vitest's bundled type docs) — the RESEARCH example used the older string/path form which no longer type-checks
- **`server.deps.inline`:** Vitest 4 moved `deps.inline` under `test.server.deps` (RESEARCH Pitfall 6 fix applied at the new location)
- **Root redirect:** `goto(`${base}/setup`)` instead of typed `resolve()` — resolve's route union didn't include `/setup` before Task 3 created it
- **fake-indexeddb** installed as dev dep so the Dexie unit test runs in the node project (anticipated by the plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest 4 browser provider package**
- **Found during:** Task 1 (vite.config.ts type-check)
- **Issue:** `provider: 'playwright'` (string) and `@vitest/browser/providers/playwright` import both fail under Vitest 4.1 — the provider moved to `@vitest/browser-playwright`
- **Fix:** Installed `@vitest/browser-playwright@4.1.8` (official vitest-dev package, referenced by name in vitest's own bundled documentation) and used the `playwright()` factory
- **Files modified:** vite.config.ts, package.json
- **Verification:** svelte-check 0 errors; `npx vitest run --project=browser` exits 0
- **Committed in:** 454abcd (Task 1 commit)

**2. [Rule 3 - Blocking] deps.inline location in Vitest 4**
- **Found during:** Task 1 (vite.config.ts type-check)
- **Issue:** `test.deps.inline` no longer exists in Vitest 4 config types
- **Fix:** Moved to `test.server.deps.inline` per current Vitest types
- **Files modified:** vite.config.ts
- **Verification:** svelte-check 0 errors; unit project runs
- **Committed in:** 454abcd (Task 1 commit)

**3. [Rule 1 - Bug] resolve('/setup') type error before route existed**
- **Found during:** Task 1 (root redirect page)
- **Issue:** `resolve('/setup')` fails type-check because the route union only contained `/` until Task 3 created the setup route
- **Fix:** Used `goto(`${base}/setup`)` with `base` from `$app/paths` — still base-path-aware per the plan's intent
- **Files modified:** src/routes/+page.svelte
- **Verification:** Build + svelte-check clean; redirect logic unchanged
- **Committed in:** 454abcd (Task 1 commit)

**4. [Rule 3 - Blocking] @types/node missing**
- **Found during:** Task 3 (svelte-check warning)
- **Issue:** Generated .svelte-kit/tsconfig.json references the `node` type library; configs use `process.env`
- **Fix:** Installed `@types/node@^22` as dev dependency
- **Files modified:** package.json, package-lock.json
- **Verification:** svelte-check now 0 errors, 0 warnings
- **Committed in:** 918c55a (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug)
**Impact on plan:** All fixes were toolchain-version corrections required for a clean type-check; no scope creep, no architectural change.

## Issues Encountered

- npm peer-conflict when `@sveltejs/vite-plugin-svelte@5.x` was explicitly listed (requires Vite 6 while SvelteKit 2.64 brings Vite 8) — resolved by relying on SvelteKit's transitive `@sveltejs/vite-plugin-svelte@7.1.2`

## Known Stubs

- `src/stores/skeleton.svelte.ts` — intentional placeholder store, marked `PLACEHOLDER`; replaced by the real matchStore in Plan 01-02
- `src/routes/match/+page.svelte` — placeholder board div; replaced by the real SVG Dartboard + ScorePanel in Plan 01-03
- `src/routes/setup/+page.svelte` — skeleton setup; full MatchSetup flow lands in Plan 01-04
- `e2e/full-match-flow.spec.ts` — intentionally failing RED baseline until Plans 03+04 wire the full flow

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Architectural backbone proven end-to-end (routing, Dexie persistence, runes reactivity, static build)
- Ready for Plan 01-02 (X01 reducer engine + matchStore)
- E2E RED baseline in place; Plans 03+04 turn it green

## Self-Check: PASSED

- All 18 created files verified on disk
- Commits 454abcd, 2d39865, 918c55a, d2c879e present in git log
- `npm run build` exit 0; svelte-check 0 errors/0 warnings; unit test 1/1 passed; `npx vitest run` exit 0; E2E fails at assertion level (expected RED)

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-10*
