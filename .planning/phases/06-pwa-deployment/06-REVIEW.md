---
phase: 06-pwa-deployment
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - vite.config.ts
  - svelte.config.js
  - pwa-assets.config.ts
  - src/app.d.ts
  - src/routes/+layout.svelte
  - src/ui/pwa/ReloadPrompt.svelte
  - src/ui/pwa/ReloadPrompt.test.ts
  - src/test-mocks/pwa-register-mock.ts
  - src/test-mocks/pwa-info-mock.ts
  - .github/workflows/deploy.yml
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-06-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed 10 files covering the PWA plugin wiring, SvelteKit static adapter config, GitHub Actions deployment workflow, update-prompt component, and test infrastructure. The subpath base-path prefixing is correctly applied across manifest fields, icon `src` values, and `navigateFallback`. The VITEST guard and browser-project alias approach for virtual modules are sound.

Four warnings found: the `pwa-info-mock.ts` exports a default instead of a named export (mismatches the real module's shape — latent test failure if the layout is ever rendered in a test), the `deploy.yml` workflow triggers on `main` while the working branch is `master` (silent no-op until an explicit `master:main` push is performed), the `setInterval` in `ReloadPrompt.svelte` is never cleared (leaks on component unmount), and the `build` job in `deploy.yml` is missing `actions/configure-pages` (skip-able today because BASE_PATH covers it, but fragile). Two info items are also noted.

---

## Warnings

### WR-01: `pwa-info-mock.ts` uses `export default` but `virtual:pwa-info` uses a named export

**File:** `src/test-mocks/pwa-info-mock.ts:7`
**Issue:** The real `virtual:pwa-info` module declares `export const pwaInfo: PwaInfo | undefined` — a named export. The layout imports it as `import { pwaInfo } from 'virtual:pwa-info'`. The mock uses `export default undefined`, which means any test that exercises `+layout.svelte` through the alias will resolve `pwaInfo` as `undefined` at the binding level (the named import is not satisfied by a default export), and in strict TypeScript mode this is a type error. Currently the existing tests render `ReloadPrompt.svelte` in isolation and never render the layout, so this is silent. The moment a test renders the full layout (e.g., integration or E2E smoke test in browser mode), the mock will silently supply `undefined` for the wrong reason — not because the plugin is disabled, but because the export shape is wrong.

**Fix:**
```ts
// src/test-mocks/pwa-info-mock.ts
export const pwaInfo = undefined;
```
Replace `export default undefined` with a named export matching the real module's shape. This is a one-line change.

---

### WR-02: Workflow triggers on `main` but working branch is `master` — deploy never fires automatically

**File:** `.github/workflows/deploy.yml:5`
**Issue:** The workflow is gated on `push: branches: ['main']`. The repository's current working branch is `master` (confirmed by `git branch`). Pushes to `master` do not trigger this workflow. The app will only deploy if someone manually triggers `workflow_dispatch` or explicitly force-pushes/merges `master` into `main`. This is a known go-live footgun documented in the project context ("the documented go-live pushes master:main"), but the workflow itself gives no indication of this dependency. A future contributor who pushes a hotfix to `master` will not see a deploy and may not understand why.

**Fix (two options — choose one):**

Option A — trigger on `master` (matches current development reality):
```yaml
on:
  push:
    branches: ['master']
  workflow_dispatch:
```

Option B — keep `main` as the deploy branch but add a comment documenting the merge step:
```yaml
on:
  push:
    branches: ['main']   # deploy branch; merge master→main to release
  workflow_dispatch:
```
If Option B is intentional (master = dev, main = release gate), document the merge process in the repo README or a `RELEASING.md` so it is not silently forgotten.

---

### WR-03: `setInterval` in `ReloadPrompt.svelte` is never cleared — interval leaks on unmount

**File:** `src/ui/pwa/ReloadPrompt.svelte:15-18`
**Issue:** The `onRegistered` callback calls `setInterval(() => registration.update(), 60_000)` but never stores the handle and never calls `clearInterval`. In a Svelte 5 component this `useRegisterSW` call runs once at component initialisation. If `ReloadPrompt` were ever destroyed and re-created (e.g., during HMR, or if the layout were conditionally rendered), a new interval would be created each time while the previous one keeps running. The interval is also never cleared when the page is unloaded, which is benign for production but is a code-quality smell and will produce console noise in tests that perform component unmount-remount cycles.

**Fix:**
```ts
// src/ui/pwa/ReloadPrompt.svelte <script>
import { onDestroy } from 'svelte';

let intervalId: ReturnType<typeof setInterval> | undefined;

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegistered(registration) {
        if (registration) {
            intervalId = setInterval(() => registration.update(), 60_000);
        }
    },
    onRegisterError(error) {
        console.error('SW registration error', error);
    },
});

onDestroy(() => {
    if (intervalId !== undefined) clearInterval(intervalId);
});
```

---

### WR-04: `deploy.yml` `build` job is missing `actions/configure-pages` — relies entirely on hardcoded `BASE_PATH`

**File:** `.github/workflows/deploy.yml:14-36`
**Issue:** The canonical GitHub Pages workflow pattern includes an `actions/configure-pages` step in the build job. That action does two things: it sets `GITHUB_PAGES=true` and writes `steps.pages.outputs.base_path` (the correct subpath for the repo), which can then be passed to the build as `BASE_PATH`. The current workflow hardcodes `BASE_PATH: '/${{ github.event.repository.name }}'` instead. For the default case (repo deployed to `<owner>.github.io/<repo>`) this is equivalent and works correctly. However if the Pages configuration is ever changed to a custom domain or a different base path in the repository's GitHub Pages settings, the hardcoded value will silently produce the wrong base while `configure-pages` would have read the correct value automatically. Additionally `configure-pages` enables Pages in the repository settings if it has not already been enabled — without it, the first deploy may fail if Pages is not pre-configured.

**Fix:**
```yaml
# In the build job, add before the Build step:
- name: Setup Pages
  id: pages
  uses: actions/configure-pages@v5

# Change the Build step env:
- name: Build
  env:
    BASE_PATH: ${{ steps.pages.outputs.base_path }}
  run: npm run build
```
This reads the authoritative base path from Pages configuration instead of deriving it from the repository name.

---

## Info

### IN-01: `unit` test project has no alias for `virtual:pwa-register/svelte` or `virtual:pwa-info`

**File:** `vite.config.ts:66-79`
**Issue:** The `browser` test project correctly aliases both PWA virtual modules. The `unit` test project (environment: node) has no such alias. Unit tests include all `src/**/*.test.ts` except `src/ui/**/*.test.ts`, and they extend the root `vite.config.ts` which excludes the `SvelteKitPWA` plugin during `VITEST` runs. This means if any non-UI test file ever imports something that transitively imports `virtual:pwa-register/svelte` or `virtual:pwa-info`, the unit project will throw a module-not-found error. Currently no non-UI files import those virtuals, so this is not a live defect — but the aliasing protection is only half-applied. No fix required now; note for when the test suite grows.

---

### IN-02: `pwa-64x64.png` in `static/` is not listed in the manifest `icons` array

**File:** `vite.config.ts:40-50`
**Issue:** `static/pwa-64x64.png` exists on disk but is absent from the PWA manifest `icons` array, which lists 192x192, 512x512, maskable 512x512, and apple-touch 180x180. The four listed icons are sufficient for modern install prompts. The 64x64 image is likely a favicon-size variant from the asset generator and its absence from the manifest is not a bug — browsers use `favicon.ico` for small sizes. Documenting for awareness.

---

_Reviewed: 2026-06-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
