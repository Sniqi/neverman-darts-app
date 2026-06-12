# Phase 6: PWA & Deployment - Research

**Researched:** 2026-06-13
**Domain:** PWA / Service Workers / GitHub Pages Deployment / Icon Generation
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Pages target & base path:** Project site at `username.github.io/neverman-darts-app`. Build with `BASE_PATH=/neverman-darts-app`. The existing `svelte.config.js` already reads `process.env.BASE_PATH`. Dev keeps base `''`.
- **adapter-static fallback:** `fallback: '404.html'` — keep as-is (already configured).
- **Deploy mechanism:** GitHub Actions — `.github/workflows/deploy.yml` that builds with `BASE_PATH=/neverman-darts-app`, uploads `build/` as a Pages artifact, deploys via `actions/deploy-pages` on push to default branch. Pages source = "GitHub Actions". No remote configured yet.
- **PWA library & update strategy:** Use `@vite-pwa/sveltekit` (SvelteKit integration of vite-plugin-pwa / Workbox). `registerType: 'prompt'` — explicit update prompt, NOT silent auto-update. Use `workbox-window`'s `registerSW({ onNeedRefresh })` to show a German "Neue Version verfügbar" toast.
- **Precache everything:** `workbox.globPatterns` to include all built assets (`**/*.{js,css,html,svg,png,webp,woff2,mp3,webmanifest}`) so the app including SFX works offline after first load.
- **Icons & manifest:** Generate placeholder icons now — dark `#111318` background, accent `#e8a020`. Provide 192×192, 512×512, maskable 512×512, Apple touch icon. User replaces later. Manifest: German name/short_name, `display: standalone`, `theme_color: #111318`, `background_color: #111318`, `start_url`/`scope` under base path, `lang: de`.
- **Language:** All new user-facing strings (update prompt, install copy) in **German**, dark mode.

### Claude's Discretion

- PWA library: `@vite-pwa/sveltekit` was Claude's recommendation; user confirmed it.
- Update strategy: `registerType: 'prompt'` per roadmap goal.

### Deferred Ideas (OUT OF SCOPE)

- Real designed app icons (user supplies later; placeholders ship now).
- Custom domain / CNAME.
- Push notifications / background sync.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | App is installable as a PWA (Android home screen, desktop) and works fully offline after first load | Standard Stack section: `@vite-pwa/sveltekit` + Workbox + `registerType:'prompt'`; Icon generation; Manifest config |
| PLAT-02 | App is deployed to GitHub Pages and works correctly under the repository subpath | Architecture Patterns: base-path config, GitHub Actions workflow, `.nojekyll` |
| PLAT-03 | When a new version is deployed, the app shows an update prompt instead of silently serving a stale cached build | Standard Stack + Code Examples: `registerType:'prompt'`, `useRegisterSW`, ReloadPrompt component |
| PLAT-04 | UI is fully German with native dark mode design | Code Examples: German manifest strings; update toast strings; CLAUDE.md constraint already met across prior phases |
</phase_requirements>

---

## Summary

This phase makes the Neverman Darts App installable and fully offline as a PWA, then deploys it to GitHub Pages under the `/neverman-darts-app` subpath. The core challenge is threefold: (1) correctly wiring the base path so the service worker scope, manifest URLs, icon paths, and SW registration all resolve under `/neverman-darts-app/` rather than the root; (2) implementing a `registerType:'prompt'` update flow with a German toast; and (3) automating the GitHub Pages deploy with a GitHub Actions workflow.

The `@vite-pwa/sveltekit` package is the right integration layer — it wraps `vite-plugin-pwa` and handles the SvelteKit-specific rebuild ordering problem (the adapter runs *after* the initial Vite build, so a naive `vite-plugin-pwa` integration misses adapter-generated files; `@vite-pwa/sveltekit` resolves this internally). The SPA-mode `kit.spa: true` option plus `adapterFallback: '404.html'` ensures the 404.html fallback file (used by GitHub Pages for SPA routing) is correctly included in the service worker precache.

The base path is the single biggest failure mode. `@vite-pwa/sveltekit` reads Vite's base automatically, but `scope`, `start_url`, manifest icon `src` paths, and the SW `base` must all be explicitly set to match the `/neverman-darts-app/` subpath in the `SvelteKitPWA()` config when building for production.

**Primary recommendation:** Install `@vite-pwa/sveltekit`, `workbox-window`, and `@vite-pwa/assets-generator` as devDependencies; configure `SvelteKitPWA()` in `vite.config.ts` with the subpath options; generate icons from a source SVG; wire the German ReloadPrompt component into `+layout.svelte`; add the GitHub Actions workflow.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PWA installation / installability | Browser / Client | CDN / Static (Pages) | `manifest.webmanifest` served statically; browser prompts install; no server needed |
| Service worker & offline cache | Browser / Client | CDN / Static | SW registered client-side; Workbox precache from static build output |
| Update prompt ("Neue Version") | Browser / Client | — | `useRegisterSW` hook; entirely client-side toast component |
| GitHub Pages deployment | CDN / Static | — | adapter-static produces `build/`; GH Actions uploads artifact; Pages serves it |
| Build-time PWA generation | Build pipeline (Vite) | — | `SvelteKitPWA` plugin runs during `vite build`, then `@vite-pwa/sveltekit` re-runs after adapter |
| Icon / manifest generation | Build pipeline (dev-time) | CDN / Static | `@vite-pwa/assets-generator` CLI run once; output committed to `static/`; served as static assets |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vite-pwa/sveltekit` | 1.1.0 | SvelteKit PWA integration (wraps vite-plugin-pwa) | Official SvelteKit integration; handles post-adapter rebuild timing issue; zero-config with SvelteKit base path [VERIFIED: npm registry] |
| `vite-plugin-pwa` | 1.3.0 | Workbox config, generateSW, virtual modules | Pulled in transitively by `@vite-pwa/sveltekit`; 2.7M weekly downloads; owned by same org [VERIFIED: npm registry] |
| `workbox-window` | 7.4.1 | Client-side SW registration; provides `useRegisterSW` indirectly | Google Workbox; peer dep of vite-plugin-pwa; 7.8M weekly downloads [VERIFIED: npm registry] |
| `@vite-pwa/assets-generator` | 1.0.2 | Generates PWA icon PNGs from a source SVG (uses `sharp` internally) | Official vite-pwa org tool; handles all required sizes + maskable in one command [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `workbox-build` | 7.4.1 | Low-level Workbox build primitives | Pulled in transitively; rarely configured directly |

> Note: `workbox-window` is a **peer dependency** of `vite-plugin-pwa`. It must be installed explicitly because `@vite-pwa/sveltekit` lists `vite-plugin-pwa` as a dependency, which lists `workbox-window` as a peer. Confirmed pattern from multiple projects: `npm i @vite-pwa/sveltekit workbox-window -D`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vite-pwa/sveltekit` | `vite-plugin-pwa` directly | `vite-plugin-pwa` alone requires a manual `buildPwa.js` post-build script to re-run Workbox after the adapter; `@vite-pwa/sveltekit` eliminates this |
| `@vite-pwa/assets-generator` | Custom Node.js SVG-to-PNG script | Assets generator handles maskable padding, apple-touch sizing correctly; a custom script is error-prone |

**Installation:**
```bash
npm install @vite-pwa/sveltekit workbox-window @vite-pwa/assets-generator -D
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|--------------|-------------|---------|-------------|
| `@vite-pwa/sveltekit` | npm | ~1.5 yr (since 2024) | 48,928 | github.com/vite-pwa/sveltekit | OK | Approved |
| `vite-plugin-pwa` | npm | ~4 yr | 2,778,973 | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| `workbox-window` | npm | ~7 yr | 7,793,825 | github.com/googlechrome/workbox | OK | Approved |
| `@vite-pwa/assets-generator` | npm | ~2 yr | 136,902 | github.com/vite-pwa/assets-generator | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none

---

## Architecture Patterns

### System Architecture Diagram

```
[Developer pushes to main]
        |
        v
[GitHub Actions: build job]
  - npm ci
  - BASE_PATH=/neverman-darts-app npm run build
  - Vite runs:
      sveltekit() plugin → SvelteKit app JS/CSS
      SvelteKitPWA() plugin →
        1st pass: generates SW + manifest (from .svelte-kit/output/client/)
        post-adapter pass: re-injects fallback revision via version.json
  - adapter-static writes build/
        |
  actions/upload-pages-artifact
        |
[GitHub Pages CDN at /neverman-darts-app/]
        |
[Browser first visit]
  - Fetches /neverman-darts-app/ → index.html (or 404.html via Pages SPA fallback)
  - Loads app JS → registers SW at scope /neverman-darts-app/
  - SW precaches ALL assets listed in workbox manifest
        |
[Subsequent visits (offline capable)]
  - SW serves from cache: HTML, JS, CSS, SVG, PNG, MP3
        |
[New deploy triggers new SW]
  - Old SW detects new SW waiting
  - useRegisterSW needRefresh → true
  - ReloadPrompt toast appears: "Neue Version verfügbar — Aktualisieren"
  - User taps → updateServiceWorker(true) → reload
```

### Recommended Project Structure

```
static/
├── logo.svg             # Source SVG for icon generation (add this)
├── pwa-192x192.png      # Generated by @vite-pwa/assets-generator
├── pwa-512x512.png      # Generated
├── maskable-icon-512x512.png  # Generated
├── apple-touch-icon-180x180.png  # Generated
├── .nojekyll            # Prevents GitHub Pages Jekyll processing (add this)
└── sfx/                 # Existing audio assets
    ├── 180.mp3
    ├── highfinish.mp3
    └── record.mp3

src/
├── lib/
│   └── ReloadPrompt.svelte  # New: German update toast
└── routes/
    └── +layout.svelte       # Modified: inject webManifest link + ReloadPrompt

.github/
└── workflows/
    └── deploy.yml       # New: GitHub Actions Pages deploy

pwa-assets.config.ts     # New: assets-generator config (project root)
vite.config.ts           # Modified: add SvelteKitPWA() plugin
svelte.config.js         # Modified: add kit.serviceWorker.register:false
```

### Pattern 1: SvelteKitPWA Plugin Configuration (vite.config.ts)

**What:** Configure the PWA plugin with subpath-correct scope, manifest, and SPA fallback.
**When to use:** Production builds with BASE_PATH env set.

```typescript
// Source: vite-pwa-org.netlify.app/frameworks/sveltekit + github.com/vite-pwa/sveltekit issues/36
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
  plugins: [
    sveltekit(),
    // Conditionally exclude PWA plugin in Vitest test runs
    !process.env.VITEST && SvelteKitPWA({
      registerType: 'prompt',
      scope: base + '/',
      base: base + '/',
      kit: {
        spa: true,
        adapterFallback: '404.html',
        includeVersionFile: true,
      },
      manifest: {
        name: 'Neverman Darts',
        short_name: 'Neverman Darts',
        description: 'X01 Darts Wertung',
        lang: 'de',
        start_url: base + '/',
        scope: base + '/',
        display: 'standalone',
        theme_color: '#111318',
        background_color: '#111318',
        icons: [
          { src: base + '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: base + '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: base + '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: base + '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // globDirectory defaults to .svelte-kit/output - use 'client/**' prefix
        globPatterns: [
          'client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}',
          'prerendered/**/*.{html,json}',
        ],
        navigateFallback: base + '/404.html',
      },
      devOptions: {
        enabled: false, // disable in dev; no SW during development
      },
    }),
  ].filter(Boolean),
  // ... vitest config unchanged
});
```

> **Critical:** `scope: base + '/'` — the trailing slash is required for SW scope. When `BASE_PATH=''` (dev), `scope` becomes `'/'` which is correct. When `BASE_PATH=/neverman-darts-app`, scope becomes `/neverman-darts-app/`. [ASSUMED — trailing slash requirement inferred from Workbox docs; verify at test time]

### Pattern 2: svelte.config.js — Disable SvelteKit's Built-in SW

**What:** Prevent SvelteKit's native service worker from conflicting with vite-plugin-pwa.
**When to use:** Any time you add `@vite-pwa/sveltekit`.

```javascript
// Source: vite-pwa-org.netlify.app/frameworks/sveltekit.html
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: {
      base: process.argv.includes('dev')
        ? ''
        : (process.env.BASE_PATH ?? '')
    },
    serviceWorker: {
      register: false  // <-- ADD THIS; prevents conflict with @vite-pwa/sveltekit
    }
  }
};
export default config;
```

### Pattern 3: Inject Web Manifest in Root Layout (+layout.svelte)

**What:** Insert the PWA manifest `<link>` tag into `<head>` and mount the update toast.
**When to use:** Root `+layout.svelte` only.

```svelte
<!-- Source: github.com/vite-pwa/sveltekit/blob/main/examples/sveltekit-ts/src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { pwaInfo } from 'virtual:pwa-info';

  let { children } = $props();
  const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
  {@html webManifest}
</svelte:head>

{@render children()}

{#await import('$lib/ReloadPrompt.svelte') then { default: ReloadPrompt }}
  <ReloadPrompt />
{/await}
```

> The dynamic `import()` is intentional — it prevents SSR issues with the virtual PWA module. [CITED: vite-pwa-org.netlify.app/frameworks/sveltekit.html]

### Pattern 4: ReloadPrompt Component (German, Svelte 5 runes)

**What:** Toast shown when a new SW version is waiting. Uses `useRegisterSW` from the virtual module.
**When to use:** Mounted once in root layout. Conditionally shown.

```svelte
<!-- Source: adapted from github.com/vite-pwa/sveltekit/blob/main/examples/sveltekit-ts/src/lib/ReloadPrompt.svelte -->
<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegistered(registration) {
      // optional: poll for updates every 60s
      if (registration) {
        setInterval(() => registration.update(), 60_000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  function close() {
    offlineReady.set(false);
    needRefresh.set(false);
  }
</script>

{#if $needRefresh || $offlineReady}
  <div class="pwa-toast" role="alert" aria-live="polite">
    <p>
      {#if $needRefresh}
        Neue Version verfügbar — bitte aktualisieren.
      {:else}
        App bereit für Offline-Nutzung.
      {/if}
    </p>
    <div class="pwa-toast-actions">
      {#if $needRefresh}
        <button onclick={() => updateServiceWorker(true)}>Aktualisieren</button>
      {/if}
      <button onclick={close}>Schließen</button>
    </div>
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: #1e2128;
    color: #f0f0f0;
    border: 1px solid #e8a020;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 9999;
    max-width: 22rem;
  }
  .pwa-toast-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  button {
    background: none;
    border: 1px solid #e8a020;
    color: #e8a020;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  button:first-child {
    background: #e8a020;
    color: #111318;
  }
</style>
```

> `useRegisterSW` returns Svelte writable stores. Use `$needRefresh` and `$offlineReady` with store subscription syntax in Svelte 5 (same as Svelte 4 store syntax — `$state` runes are for local state; stores from `workbox-window` use the Svelte store contract). [CITED: vite-pwa-org.netlify.app/frameworks/sveltekit.html]

### Pattern 5: Icon Generation via @vite-pwa/assets-generator

**What:** Generate all required PWA PNG icons from a source SVG without ImageMagick.
**When to use:** Once, at development time. Outputs committed to `static/`.

Step 1 — Create `static/logo.svg` (a 512×512 dark-background SVG):

```xml
<!-- static/logo.svg — placeholder brand mark -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#111318"/>
  <!-- Dartboard ring rings -->
  <circle cx="256" cy="256" r="220" fill="none" stroke="#e8a020" stroke-width="4"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="#e8a020" stroke-width="2"/>
  <circle cx="256" cy="256" r="80" fill="none" stroke="#e8a020" stroke-width="2"/>
  <!-- Bull -->
  <circle cx="256" cy="256" r="32" fill="#e8a020"/>
  <circle cx="256" cy="256" r="14" fill="#111318"/>
  <!-- "N" monogram -->
  <text x="256" y="390" font-family="sans-serif" font-size="80" font-weight="bold"
        fill="#e8a020" text-anchor="middle">N</text>
</svg>
```

Step 2 — Create `pwa-assets.config.ts` at project root:

```typescript
// Source: vite-pwa-org.netlify.app/assets-generator/cli
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    png: { compressionLevel: 9, quality: 95 },
  },
  images: ['static/logo.svg'],
});
```

Step 3 — Run:

```bash
npx pwa-assets-generator
```

This generates in `static/`:
- `pwa-64x64.png`
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-icon-512x512.png`
- `apple-touch-icon-180x180.png`

> `@vite-pwa/assets-generator` has `sharp` as a **direct dependency** — sharp is installed as part of the package, not a separate peer install. [VERIFIED: npm registry — checked dependencies field]

### Pattern 6: GitHub Actions Deploy Workflow

**What:** Build with BASE_PATH and deploy to GitHub Pages.
**When to use:** Add to `.github/workflows/deploy.yml`.

```yaml
# Source: svelte.dev/docs/kit/adapter-static (official SvelteKit docs)
name: Deploy to GitHub Pages

on:
  push:
    branches: 'main'

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

> The `${{ github.event.repository.name }}` resolves to `neverman-darts-app` once the repo is created, producing `BASE_PATH=/neverman-darts-app`. [CITED: svelte.dev/docs/kit/adapter-static]

### Pattern 7: Vitest — Exclude PWA Plugin in Tests

**What:** Prevent `virtual:pwa-register/svelte` from breaking the unit test build.
**When to use:** In `vite.config.ts` where `SvelteKitPWA()` is added.

The conditional in Pattern 1 (`!process.env.VITEST && SvelteKitPWA(...)`) handles this at the plugin level. For any component test that imports `virtual:pwa-register/svelte` directly (i.e., `ReloadPrompt.svelte`), add a test alias:

```typescript
// In the browser test project in vite.config.ts:
{
  test: {
    name: 'browser',
    alias: {
      'virtual:pwa-register/svelte': resolve(__dirname, 'src/test-mocks/pwa-register-mock.ts'),
    },
    // ...
  }
}
```

```typescript
// src/test-mocks/pwa-register-mock.ts
import { writable } from 'svelte/store';
export function useRegisterSW() {
  return {
    needRefresh: writable(false),
    offlineReady: writable(false),
    updateServiceWorker: async () => {},
  };
}
```

### Anti-Patterns to Avoid

- **Using `vite-plugin-pwa` directly without `@vite-pwa/sveltekit`:** Requires a manual `buildPwa.js` post-adapter script to re-run Workbox; the dedicated SvelteKit integration handles this internally.
- **Omitting `kit.serviceWorker.register: false` in svelte.config.js:** SvelteKit registers its own dummy service worker by default; this conflicts with the PWA plugin's SW.
- **Hardcoding `/` in manifest `start_url`, `scope`, and icon `src`:** These must include the base path for a subpath deploy. If left as `/`, the SW registers at the wrong scope and icons 404.
- **Not adding `.nojekyll` to `static/`:** GitHub Pages runs Jekyll by default, which ignores files starting with `_`. SvelteKit's `_app/` assets directory will be silently omitted without this file.
- **Setting `navigateFallback: '/404.html'` without the base prefix when deployed under a subpath:** The SW intercepts navigation and serves the cached URL literally; it must be `/neverman-darts-app/404.html`.
- **Importing `virtual:pwa-info` outside `<script>`:** Must be in the `<script lang="ts">` section; the virtual module is resolved at build time.
- **Precaching `prerendered/**` when no pages are prerendered:** This SPA uses `fallback: '404.html'` — no prerendered pages. The `prerendered/**` glob will produce a Workbox warning ("glob pattern matched 0 files") but is harmless. Remove it to keep the build clean. [ASSUMED]
- **Using `devOptions.enabled: true` in production config:** Only enable the dev SW during active PWA debugging; it can cause stale state between dev sessions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker generation + precache manifest | Custom `sw.js` with manual `self.addEventListener('fetch')` | `@vite-pwa/sveltekit` + Workbox `generateSW` | Cache busting, revision hashing, glob discovery, streaming responses, background sync support, update detection — all pre-built |
| Update detection and SW lifecycle management | `navigator.serviceWorker.getRegistration()` polling | `useRegisterSW` from `virtual:pwa-register/svelte` | Handles install, activate, waiting, and update lifecycle correctly; avoids the "update never fires" bug from manual registration |
| PWA icon resizing | Node.js canvas / manual PNG generation | `@vite-pwa/assets-generator` | Correct maskable safe-zone padding, all required sizes, proper compression — sharp handles it |
| Web manifest `<link>` tag | Hardcoded `<link rel="manifest">` in `app.html` | `virtual:pwa-info` → `pwaInfo.webManifest.linkTag` | The plugin generates a content-hashed manifest filename; the virtual module returns the correct URL including base path |

**Key insight:** The service worker lifecycle (install → activate → fetch interception → update) has numerous subtle edge cases. Every custom SW implementation rediscovers the same bugs. Workbox + vite-plugin-pwa represent years of production hardening.

---

## Common Pitfalls

### Pitfall 1: Base Path Asset 404s (the #1 failure mode)

**What goes wrong:** After deploy, the manifest, icons, SW, or JS assets 404 because they're served from `/pwa-192x192.png` instead of `/neverman-darts-app/pwa-192x192.png`.
**Why it happens:** Any URL that doesn't use `base` from `$app/paths` (for links) or isn't prefixed with `BASE_PATH` in the SvelteKitPWA config is absolute from `/`.
**How to avoid:** In `SvelteKitPWA()` config, construct `base` from `process.env.BASE_PATH ?? ''` and prefix `scope`, `start_url`, all manifest icon `src` values, and `navigateFallback`. The SvelteKit paths.base handles in-app routes; the PWA plugin config handles the manifest URLs.
**Warning signs:** `Failed to register a ServiceWorker … 404`; manifest icons fail to load in DevTools Application tab; install banner never appears.

### Pitfall 2: SW Scope Too Narrow (or Wrong)

**What goes wrong:** The SW registers but only intercepts a subset of routes, or fails to intercept the root entirely.
**Why it happens:** The SW `scope` must be the base path with a trailing slash. `/neverman-darts-app` (no trailing slash) is treated as a file path scope, not a directory scope.
**How to avoid:** Set `scope: base + '/'` where `base = '/neverman-darts-app'`. For dev where `base = ''`, this resolves to `'/'` which is correct.
**Warning signs:** DevTools Application → Service Workers shows SW active but coverage shows only partial URL tree.

### Pitfall 3: SvelteKit's Built-in SW Conflicts

**What goes wrong:** Two service workers fight over the same scope; the PWA SW never activates; `needRefresh` never fires.
**Why it happens:** SvelteKit auto-registers a SW at `src/service-worker.(js|ts)` if the file exists, and also registers a built-in SW if the SvelteKit SW module is enabled.
**How to avoid:** Set `kit.serviceWorker.register: false` in `svelte.config.js`. Do not create `src/service-worker.ts`. [CITED: vite-pwa-org.netlify.app/frameworks/sveltekit.html]
**Warning signs:** Console shows SW registration from `/@sveltekit/default-sw.js` alongside the PWA SW.

### Pitfall 4: MP3 Files Not Precached (Offline SFX Broken)

**What goes wrong:** App loads offline but SFX (180.mp3, highfinish.mp3, record.mp3) fail to play because the browser falls back to network fetch (which fails offline).
**Why it happens:** The default `globPatterns` in `@vite-pwa/sveltekit` do not include `mp3`.
**How to avoid:** Explicitly add `mp3` to `workbox.globPatterns`: `'client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'`.
**Warning signs:** DevTools → Application → Cache Storage shows no `.mp3` entries; SW Network tab shows failed fetch for audio.

### Pitfall 5: Vitest Breaks on virtual:pwa-register/svelte

**What goes wrong:** `npm test` fails with `Cannot find module 'virtual:pwa-register/svelte'`.
**Why it happens:** Vite virtual modules provided by plugins are not available when the plugin is excluded in test mode.
**How to avoid:** Exclude `SvelteKitPWA()` in test mode (`!process.env.VITEST && SvelteKitPWA(...)`). For browser component tests of `ReloadPrompt.svelte`, add a `test.alias` redirect to a mock module.
**Warning signs:** Unit test run fails immediately after adding `SvelteKitPWA` to vite.config.ts.

### Pitfall 6: GitHub Pages Jekyll Swallows _app/ Assets

**What goes wrong:** All JavaScript and CSS 404 after deploy because `_app/immutable/` is under a `_` prefix.
**Why it happens:** GitHub Pages runs Jekyll by default, which ignores files/dirs beginning with `_`.
**How to avoid:** Add an empty `.nojekyll` file to `static/`. adapter-static copies `static/` contents to `build/` during build, so it ends up in the deploy artifact.
**Warning signs:** App loads blank white page; DevTools Network tab shows 404 for all `_app/immutable/*.js` files.

### Pitfall 7: .svelte-kit/output vs build/ Path Confusion in globDirectory

**What goes wrong:** Workbox precache manifest references the wrong paths; assets are never served from cache.
**Why it happens:** `@vite-pwa/sveltekit` defaults `globDirectory` to `.svelte-kit/output`. The `client/**` prefix matches assets in `.svelte-kit/output/client/`. If you accidentally use `build/**` or omit the `client/` prefix, globs match 0 files.
**How to avoid:** Always use `'client/**/*.{...}'` prefix in globPatterns. The plugin sets the glob base correctly.
**Warning signs:** Build succeeds but Workbox logs "Glob pattern matched 0 files" or SW precache list is empty.

### Pitfall 8: Offline Verify Must Use the Subpath Preview

**What goes wrong:** `npm run preview` serves at `http://localhost:4173/` but the build has `base=/neverman-darts-app`; app loads blank because routes expect a subpath.
**Why it happens:** `vite preview` serves from root by default; SvelteKit's adapter-static build at a subpath expects to be served from `/neverman-darts-app/`.
**How to avoid:** Access `http://localhost:4173/neverman-darts-app/` (not the root) in preview. Alternatively set `BASE_PATH='' npm run build` for local verification (but this will not test the subpath SW scope).
**Warning signs:** Preview shows blank page or "Not found".

---

## Code Examples

### Verify Offline After Build

```bash
# Build with production base path
BASE_PATH=/neverman-darts-app npm run build

# Start preview server
npm run preview
# Navigate to: http://localhost:4173/neverman-darts-app/
# DevTools → Application → Service Workers → confirm SW registered
# DevTools → Application → Cache Storage → confirm assets cached
# DevTools → Network → check "Offline" checkbox
# Reload → app should load from SW cache
# Play audio: SFX should play (mp3 served from cache)
```

### Check SW Scope in Browser Console

```javascript
// Run in browser console after SW registers
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(r => console.log('scope:', r.scope))
);
// Expected: "https://localhost:4173/neverman-darts-app/"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `vite-plugin-pwa` directly in SvelteKit | `@vite-pwa/sveltekit` wrapper | 2023 | Handles post-adapter rebuild timing; zero extra build script |
| `registerType: 'autoUpdate'` (silent) | `registerType: 'prompt'` | N/A (both valid) | User controls update timing; prevents jarring mid-game reloads |
| Manually generating PWA icons (ImageMagick) | `@vite-pwa/assets-generator` | 2023 | Single CLI command; correct maskable safe zones |
| Manual `buildPwa.js` post-build script | Built-in via `kit.includeVersionFile: true` | `@vite-pwa/sveltekit` v0.6+ | No extra script needed; plugin manages its own rebuild |

**Deprecated/outdated:**
- `KitOptions.base` option in `@vite-pwa/sveltekit`: deprecated since v0.1.0; Vite base is read automatically. However `scope` and manifest fields still need manual subpath prefixing.
- String `'playwright'` as Vitest browser provider: Vitest 4 uses the factory import (`playwright()`) — already correctly configured in this project's vite.config.ts.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `prerendered/**` glob can be omitted safely since this is a pure SPA (no prerendered pages) | Anti-Patterns | If any route is prerendered, those pages won't be precached — app won't load those routes offline |
| A2 | `scope: base + '/'` trailing slash is required for correct SW scope on a subpath | Pattern 1, Pitfall 2 | Without trailing slash the SW scope may be incorrectly set, causing fetch interception to fail |
| A3 | `sharp` is automatically installed as a dependency of `@vite-pwa/assets-generator` with no separate install needed | Standard Stack | If sharp's native binary fails on the developer's platform, icon generation will fail; manual workaround needed |
| A4 | `devOptions.enabled: false` is sufficient to prevent SW from running in dev | Pattern 1 | If not fully disabled in dev, stale SW caches can cause confusing behavior during development |

---

## Open Questions

1. **Does `navigateFallback: base + '/404.html'` correctly handle deep routes under the subpath?**
   - What we know: `navigateFallback` in Workbox `generateSW` intercepts navigation requests not in the precache and serves the fallback. For a pure SPA this is all routes.
   - What's unclear: Whether Workbox's `navigateFallbackAllowlist` needs configuration to avoid intercepting API-like URL patterns (none exist in this static app, so likely fine).
   - Recommendation: Test the `/neverman-darts-app/match/` and `/neverman-darts-app/display/` routes offline after first cache population. If they 404, add `navigateFallbackAllowlist: [/^\/neverman-darts-app\//]`.

2. **Will the `prerendered/**` glob cause a build warning?**
   - What we know: No pages are prerendered in this SPA; the glob may match 0 files.
   - What's unclear: Whether `@vite-pwa/sveltekit` suppresses this warning or if the Workbox build step emits it to stderr.
   - Recommendation: Remove `'prerendered/**/*.{html,json}'` from globPatterns since this is a pure SPA. If the build output in `.svelte-kit/output/prerendered/` ever has content, add it back.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `@vite-pwa/assets-generator` CLI, build | Yes | v22.22.0 | — |
| `convert` (ImageMagick) | Alternative icon generation | Not confirmed (command found but no output) | — | Use `@vite-pwa/assets-generator` (preferred) |
| npx | Running CLI tools | Yes | bundled with npm | — |
| Git + GitHub account | Deploying workflow | Partial (git installed; no remote yet) | — | Workflow committed; runs on first push after user creates repo |
| sharp (via `@vite-pwa/assets-generator`) | Icon PNG generation | Not locally installed (not in devDeps yet) | — | `npm i @vite-pwa/assets-generator -D` installs sharp as a dependency |

**Missing dependencies with no fallback:**
- None that block development.

**Missing dependencies with fallback:**
- ImageMagick `convert`: Not confirmed usable on this machine. Use `@vite-pwa/assets-generator` instead (it brings its own `sharp` binary). No fallback needed for ImageMagick.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (unit) + Vitest browser mode 4.1.8 (component) |
| Config file | `vite.config.ts` (both projects defined inline) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | PWA is installable (manifest valid, SW registered, icons present) | manual | DevTools → Application → Manifest (must show green checkmarks) | N/A — manual only |
| PLAT-01 | App loads offline after first visit | manual | DevTools offline mode after SW install | N/A — manual only |
| PLAT-01 | SFX play offline | manual | Mute/unmute + offline; trigger 180 | N/A — manual only |
| PLAT-02 | Pages deploy accessible at correct URL | manual | Browse `https://username.github.io/neverman-darts-app/` after first deploy | N/A — requires live repo |
| PLAT-03 | Update toast appears with German text | unit (component) | `npm run test:browser -- --reporter=verbose src/lib/ReloadPrompt.test.ts` | ❌ Wave 0 — create test |
| PLAT-03 | Clicking "Aktualisieren" calls `updateServiceWorker(true)` | unit (component) | Same test file | ❌ Wave 0 |
| PLAT-03 | Clicking "Schließen" hides toast | unit (component) | Same test file | ❌ Wave 0 |
| PLAT-04 | Toast strings are German | unit (component) | grep/component render check | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual offline verification before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/ReloadPrompt.test.ts` — covers PLAT-03 update prompt behavior
- [ ] `src/test-mocks/pwa-register-mock.ts` — shared mock for `virtual:pwa-register/svelte`

*(The offline/install/deploy verification is inherently manual. All other existing tests must continue to pass — the PWA plugin exclusion in test mode ensures they do.)*

---

## Security Domain

> `security_enforcement: true` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static app; no auth |
| V3 Session Management | No | No server sessions |
| V4 Access Control | No | No protected resources |
| V5 Input Validation | No | PWA layer adds no new user inputs |
| V6 Cryptography | No | HTTPS enforced by GitHub Pages; no custom crypto |
| V9 Communications | Yes (low) | GitHub Pages enforces HTTPS; SW only registered over HTTPS — standard |
| V12 Files and Resources | Low | Static assets served; no upload |

### Service Worker Security Notes

- **SW scope is same-origin:** The SW registered at `https://username.github.io/neverman-darts-app/` cannot intercept requests outside that scope. No cross-origin interception risk.
- **SW cache poisoning:** Not applicable for a static GitHub Pages app — all assets are served from the same origin with content-hashed filenames. An attacker cannot inject malicious content into the SW cache without compromising the GitHub Pages deployment itself (which is protected by repository access controls).
- **HTTPS enforced by Pages:** Service workers require a secure context (HTTPS). GitHub Pages provides HTTPS automatically; this requirement is already met.
- **No sensitive data in SW precache:** The precache contains only JS/CSS/HTML/PNG/MP3 — no tokens, keys, or PII. The Dexie IndexedDB data (match history, player profiles) is never precached.
- **Update prompt timing:** `registerType:'prompt'` gives the user control. If a user ignores the update prompt, they continue running the older cached version — this is the expected behavior, not a security concern for this application type.

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale content from outdated SW | Information Disclosure | `registerType:'prompt'` ensures user sees update prompt; version file (`includeVersionFile:true`) ensures new SW is detected |
| SW registration at wrong scope | Elevation of Privilege | Explicit `scope` in `SvelteKitPWA()` config; tested via DevTools |
| GitHub Actions workflow secret exfil | N/A | This workflow uses no secrets — only `GITHUB_TOKEN` implicit permissions for Pages deploy |

---

## Sources

### Primary (MEDIUM confidence)
- [vite-pwa-org.netlify.app/frameworks/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit) — SvelteKitPWA configuration, adapterFallback, virtual:pwa-info, ReloadPrompt pattern
- [github.com/vite-pwa/sveltekit examples](https://github.com/vite-pwa/sveltekit/blob/main/examples/sveltekit-ts/vite.config.ts) — Reference vite.config.ts with SvelteKitPWA options
- [vite-pwa-org.netlify.app/assets-generator/cli](https://vite-pwa-org.netlify.app/assets-generator/cli) — @vite-pwa/assets-generator CLI usage, preset options
- [svelte.dev/docs/kit/adapter-static](https://svelte.dev/docs/kit/adapter-static) — Official SvelteKit GitHub Actions workflow example

### Secondary (LOW confidence — web search)
- [github.com/vite-pwa/sveltekit/issues/36](https://github.com/vite-pwa/sveltekit/issues/36) — GitHub Pages subpath scope tracking issue
- [github.com/vite-pwa/docs/blob/main/frameworks/sveltekit.md](https://github.com/vite-pwa/docs/blob/main/frameworks/sveltekit.md) — Additional SvelteKit/SPA mode documentation
- [github.com/vite-pwa/vite-plugin-pwa/issues/447](https://github.com/vite-pwa/vite-plugin-pwa/issues/447) — virtual:pwa-register Vitest issue and workarounds

### Registry Verified (HIGH confidence)
- npm registry: `@vite-pwa/sveltekit@1.1.0`, `vite-plugin-pwa@1.3.0`, `workbox-window@7.4.1`, `@vite-pwa/assets-generator@1.0.2` — all verified via `npm show` and legitimacy gate

---

## Metadata

**Confidence breakdown:**

- Standard stack: MEDIUM — packages verified on npm registry; config patterns from official docs but some subpath details inferred from issue tracker
- Architecture: MEDIUM — base-path handling verified via official SvelteKit docs and vite-pwa-org; exact `navigateFallback` behavior under subpath tagged ASSUMED
- Pitfalls: MEDIUM — pitfalls 1-3 and 6 confirmed by multiple community sources; others inferred from documentation

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (stable ecosystem, but `@vite-pwa/sveltekit` is under active development)
