---
phase: 06-pwa-deployment
plan: "01"
subsystem: pwa-foundation
tags: [pwa, vitest, mocks, component-test, german-ui, tdd]
dependency_graph:
  requires: []
  provides: [pwa-toolchain, virtual-module-mocks, reload-prompt-component]
  affects: [vite.config.ts, test-suite]
tech_stack:
  added:
    - "@vite-pwa/sveltekit@1.1.0"
    - "workbox-window@7.4.1"
    - "@vite-pwa/assets-generator@1.0.2"
  patterns:
    - Vitest test-mode guard via VITEST env + test.alias for virtual modules
    - Module-level shared stores pattern (ESM-safe alternative to vi.spyOn in browser mode)
    - TDD RED/GREEN cycle for Svelte component browser tests
key_files:
  created:
    - src/test-mocks/pwa-register-mock.ts
    - src/test-mocks/pwa-info-mock.ts
    - src/ui/pwa/ReloadPrompt.svelte
    - src/ui/pwa/ReloadPrompt.test.ts
  modified:
    - vite.config.ts
    - package.json
    - package-lock.json
decisions:
  - "Module-level updateSWCalls array instead of vi.spyOn: ESM module namespaces are not configurable in Vitest browser mode — vi.spyOn cannot redefine exports. Solved by exporting a mutable call-tracking array from the mock that both component and test share via the singleton module."
  - "Placed ReloadPrompt under src/ui/pwa/ not src/lib/: the browser Vitest project includes only src/ui/**/*.test.ts; placing the component here ensures its test runs in the correct project without config changes."
  - "pwa-info-mock.ts exports default undefined: +layout.svelte (Plan 02) renders nothing when virtual:pwa-info is falsy — a minimal stub is sufficient and avoids any layout-import failures in future tests."
metrics:
  duration: "~5 minutes"
  completed: "2026-06-13"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
  tests_before: 421
  tests_after: 427
---

# Phase 06 Plan 01: PWA Foundation + ReloadPrompt Toast Summary

**One-liner:** PWA toolchain installed with Vitest virtual-module mocks; German dark `ReloadPrompt` toast built TDD with 6 passing browser tests.

## What Was Built

### Task 1 — PWA toolchain + test-mode guard + mocks

Installed three devDependencies at pinned versions:
- `@vite-pwa/sveltekit@1.1.0` — SvelteKit PWA integration (Plan 02 will activate it)
- `workbox-window@7.4.1` — client-side SW registration peer dep
- `@vite-pwa/assets-generator@1.0.2` — icon generation CLI (Plan 02)

Created `src/test-mocks/pwa-register-mock.ts`: exports module-level `needRefresh`/`offlineReady` writable stores plus a `useRegisterSW()` function that returns them alongside a call-tracking `updateSWCalls` array. The stores are module-level singletons so the component and its test share the same instance via the alias.

Created `src/test-mocks/pwa-info-mock.ts`: `export default undefined` — stubs `virtual:pwa-info` so any test that transitively imports the layout (Plan 02) resolves the virtual module without the PWA plugin.

Updated `vite.config.ts` browser project with `test.alias` entries redirecting both `virtual:pwa-register/svelte` and `virtual:pwa-info` to their mocks. Added `resolve` from `node:path` import. Added Plan 02 guard comment noting where `SvelteKitPWA()` will be inserted.

**Verification:** 353 unit tests + 68 browser tests — all green.

### Task 2 — ReloadPrompt German toast (TDD)

**RED:** `src/ui/pwa/ReloadPrompt.test.ts` written first (6 tests), confirmed failing because the component did not exist.

**GREEN:** `src/ui/pwa/ReloadPrompt.svelte` implemented:
- Imports `useRegisterSW` from `virtual:pwa-register/svelte` (resolved to mock in tests via Task 1 alias; real module provided by SvelteKitPWA plugin in Plan 02)
- Calls `useRegisterSW` with 60-second polling interval in `onRegistered`
- Renders `{#if $needRefresh || $offlineReady}` toast with `role="alert"` `aria-live="polite"`
- German copy: "Neue Version verfügbar — bitte aktualisieren." / "App bereit für Offline-Nutzung."
- "Aktualisieren" button calls `updateServiceWorker(true)`; "Schließen" calls `close()` (sets both stores false)
- `position: fixed` bottom-right, `--surface/#1e2027` bg, `--accent/#e8a020` border, z-index 9999, max-width 22rem
- Primary button filled accent (#e8a020) with dark text; secondary outlined accent

**Verification:** 427 total tests green (353 unit + 74 browser, including 6 new ReloadPrompt tests).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.spyOn ESM export not configurable in Vitest browser mode**
- **Found during:** Task 2 GREEN phase (first test run)
- **Issue:** The test used `vi.spyOn(mockModule, 'useRegisterSW').mockImplementation(...)` to intercept calls to `updateServiceWorker`. Vitest browser mode uses live ESM modules whose namespace object is not configurable — `Cannot redefine property: useRegisterSW`.
- **Fix:** Extended the mock to export a module-level `updateSWCalls: Array<boolean | undefined>` array. The mock's `updateServiceWorker` function pushes to this array. The test resets it in `beforeEach` via `.splice(0)` and inspects it after the button click. This is the standard ESM-safe alternative to `vi.spyOn` in browser mode.
- **Files modified:** `src/test-mocks/pwa-register-mock.ts`, `src/ui/pwa/ReloadPrompt.test.ts`
- **Commit:** 75962d8

## TDD Gate Compliance

- RED gate commit: `4e26c22` — `test(06-01): add failing browser tests for ReloadPrompt toast (RED)`
- GREEN gate commit: `75962d8` — `feat(06-01): implement ReloadPrompt German dark toast + pass browser tests (GREEN)`
- REFACTOR: not needed — implementation was clean on first pass.

## Known Stubs

None — ReloadPrompt is fully wired to `useRegisterSW` from `virtual:pwa-register/svelte`. The real virtual module is provided in Plan 02 when `SvelteKitPWA()` is added to `vite.config.ts`. The mock ensures tests pass without it.

## Threat Flags

None — this plan adds only devDependencies (build-time only, not shipped to browser) and a client-side UI component. No new network endpoints, auth paths, or trust boundary crossings beyond what is already documented in the plan's threat model (T-06-01, T-06-02, T-06-SC — all accepted/mitigated in the plan).

## Self-Check: PASSED
