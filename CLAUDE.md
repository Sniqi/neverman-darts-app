<!-- GSD:project-start source:PROJECT.md -->

## Project

**Neverman Darts App**

A touch-optimized darts scoring web app (PWA) for home play with steel darts. Players enter their thrown darts manually on an on-screen dartboard; a separate spectator display shows the live game state, readable from across the room. Runs on Android tablets and Windows PCs without any dev tools — installable from GitHub Pages, fully offline-capable afterwards.

**Core Value:** A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

### Constraints

- **Platform**: Must run on Android (Chrome) and Windows browsers with zero dev tools or installation steps — PWA from a URL
- **Hosting**: GitHub Pages — static files only, no backend, no server-side logic
- **Input**: Touch-first UI; triple/double board segments must be reliably hittable by finger
- **Readability**: Spectator view legible on 27" at 3 m — large typography, high contrast, dark mode
- **Language**: German UI throughout

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **SvelteKit** | 2.64.x | App framework + router | Compiles to tiny, framework-free JS — the smallest runtime of the mainstream options. This matters for a touch app on Android tablets (lower CPU/memory) and for fast cold-start on a PWA. Built-in routing covers the two needed "pages" (scoring view, spectator view). Has first-class static prerendering for GitHub Pages. |
| **Svelte** | 5.56.x | UI component model (runes) | Svelte 5 runes (`$state`, `$derived`, `$effect`) give fine-grained reactivity ideal for a live-updating score display and spectator window without a virtual DOM. Less boilerplate than React for a small solo project. |
| **@sveltejs/adapter-static** | 3.0.x | Static export | Produces pure HTML/CSS/JS in `build/` with no server runtime — exactly what GitHub Pages serves. Set `fallback: 'index.html'` (or `'200.html'`) for SPA-style client routing under a subpath. |
| **Vite** | 8.0.x | Build tool + dev server | SvelteKit is built on Vite; nothing to choose here, but it is the reason `vite-plugin-pwa` works out of the box. Handles the `base` path rewriting that GitHub Pages subpaths require. |
| **TypeScript** | 5.9.x (NOT 6.0) | Type safety | A darts scoring engine (X01 state machine, checkout math, stats aggregation) is exactly where types prevent bugs. Pin to TS 5.9.x — see Version Compatibility note: TS 6.0 is brand-new and ecosystem tooling (`svelte-check`, vite plugins) may lag. |
| **vite-plugin-pwa** | 1.3.x | Service worker + manifest generation | The de-facto standard for turning a Vite/SvelteKit app into an installable, offline PWA. Wraps Workbox, auto-generates the precache manifest and `manifest.webmanifest`, and integrates with SvelteKit. Reads Vite's `base` so the SW scope is correct on GitHub Pages. |
| **Dexie.js** | 4.4.x | IndexedDB persistence | Player profiles, full match history, and long-term statistics will exceed localStorage's ~5 MB string-only limit and need real queries (per-player averages, records over time). Dexie is the standard IndexedDB wrapper: promise API, schema versioning/migrations, transactions, TypeScript-friendly. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **workbox-window** | 7.4.x | Client-side SW registration / update prompts | Pulled in by vite-plugin-pwa; use its `registerSW` flow to show a "new version available" toast. With `registerType: 'autoUpdate'` you may not need to touch it directly. |
| **svelte-i18n** | 4.0.x | German UI strings (and future locales) | The UI is German throughout. Even single-locale, a message catalog beats hardcoded strings — number/ordinal formatting (Leg/Set, averages) and easy future locales. Lightweight; alternative is a hand-rolled `$state` dictionary if you want zero deps. |
| **dexie-react-hooks** | — | (Do NOT install) | Listed only to flag it as React-specific. On Svelte, wrap Dexie's `liveQuery()` in a Svelte store or `$derived` — no extra package needed. |
| (none — built-in) **BroadcastChannel API** | platform | Cross-window live sync | For keeping the spectator window in sync with the main scoring window. No library needed (see Architecture/Cross-Window note below). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vitest** | 4.1.x | Unit/logic tests — game engine, checkout suggestions, stats. Runs in Node, fast. The X01 rules engine is pure-logic and should be near-100% unit tested. |
| **@vitest/browser** + **vitest-browser-svelte** | 4.1.x / 2.1.x | Component tests in a real browser via Playwright. Use for the dartboard hit-detection component and spectator layout, where real DOM/pointer/CSS behavior matters and jsdom would lie. This is the 2026-current direction for Svelte component testing. |
| **Playwright** | 1.60.x | E2E: full match flow, install/offline smoke test, second-window sync. Also the engine behind Vitest browser mode (`npx playwright install`). |
| **svelte-check** | 4.6.x | Type+template checking for `.svelte` files in CI. |
| **happy-dom** | 20.10.x | (Optional) fast simulated DOM for trivial component tests. Prefer Vitest browser mode for anything touch/pointer-related; happy-dom only for simple render assertions. |

## Installation

# Scaffold (interactive) — choose: SvelteKit minimal, TypeScript, Vitest, Playwright

# Core runtime + persistence

# PWA + static adapter (adapter-static usually added by scaffolder; install if not)

# Testing (browser-mode component tests)

# Pin TypeScript to 5.9.x (avoid TS 6.0 until tooling catches up)

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **SvelteKit** | **React + Vite + vite-plugin-pwa** | If you (or future contributors) strongly prefer React's ecosystem/hiring pool, or want Dexie's `useLiveQuery` React hook out of the box. Larger bundle, heavier hydration — a real but minor cost here. Safe, mature, well-documented for offline PWAs. |
| **SvelteKit** | **Vanilla TS + hand-written SW + Vite** | If you want zero framework runtime and full control. Viable because the app is small, but you'd hand-roll routing, reactivity for the live spectator view, and SW wiring — more work than SvelteKit saves. |
| **SvelteKit (static adapter)** | **Astro** | If the app were mostly static content with islands of interactivity. It is the opposite — a highly interactive scoring app — so Astro's islands model adds friction. |
| **Dexie.js** | **idb / idb-keyval** | If you only stored a handful of key-value blobs. You need queries and history, so a full wrapper wins. |
| **Dexie.js** | **localForage** | For simple async key-value caches/preferences only. Use localStorage/localForage for tiny UI prefs (theme, last-used game mode); use Dexie for the actual data model. |
| **BroadcastChannel** | **localStorage `storage` event** | As a fallback only. BroadcastChannel is supported in all modern target browsers (Chrome/Edge on Android + Windows), so a fallback is not required for this project. |
| **Vitest browser mode** | **jsdom/happy-dom** | For pure logic and trivial DOM assertions. Anything involving pointer/touch hit detection on the dartboard should run in a real browser. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App** | Deprecated (Feb 2025); removed its built-in service worker, no maintained offline story. | SvelteKit, or React + Vite + vite-plugin-pwa. |
| **Next.js / SvelteKit SSR adapters** | Favor a server runtime; GitHub Pages is static-only. SSR features are dead weight and break on Pages. | `@sveltejs/adapter-static` with prerender. |
| **window.opener for spectator sync** | Brittle: severed by `rel="noopener"` (browser default), navigation, or close; couples a specific window pair; security (reverse tabnabbing) concerns. | `BroadcastChannel` for live messages; persist truth in IndexedDB so a late-opened spectator window can hydrate. |
| **localStorage as the primary data store** | ~5–10 MB cap, strings only, synchronous (blocks main thread), no queries — unfit for match history + long-term stats. | Dexie/IndexedDB for data; localStorage only for tiny prefs. |
| **TypeScript 6.0.x (right now)** | Just released; `svelte-check`, vite/svelte plugins, and type-defs across the ecosystem may not yet declare 6.0 compatibility. | Pin `typescript@~5.9` until the Svelte toolchain confirms 6.0 support. |
| **Canvas-only dartboard with manual region math and no semantic markup** | Harder to make accessible/large-touch-target tunable and to test. | SVG `<path>` segments (DOM-testable, scalable, stylable) — optionally with polar-coordinate fallback math for accuracy (see below). |
| **next-pwa / gatsby-plugin-offline patterns copied over** | Known to under-cache or only cache visited routes — fails "fully offline after install." | vite-plugin-pwa with explicit `globPatterns` precaching everything needed. |

## Dartboard rendering & touch hit-detection (domain-specific)

- **SVG over Canvas:** segments are real DOM nodes — individually styleable (dark-mode colors, active-touch highlight), resolution-independent via `viewBox`, and directly testable with Vitest browser mode. ~82 regions: 20 numbers × (inner single, triple, outer single, double) + outer/inner bull.
- **Touch targets:** the PROJECT constraint is that triple/double rings be reliably finger-hittable. SVG lets you tune ring thickness independently of a realistic board, and add an invisible larger hit overlay per thin ring. Use `pointer-events: none` on decorative number labels/dividers so taps fall through to the scoring path.
- **Pointer Events, not separate mouse/touch:** one `pointerdown` code path covers tablet touch and PC mouse.
- **Accuracy fallback:** under heavy scaling some browsers mis-hit-test thin SVG paths. The robust pattern is to capture the pointer coordinate, transform to SVG user space via `getScreenCTM().inverse()`, then derive ring (radius via Pythagoras) and segment (angle via `atan2`) mathematically. A hybrid — SVG for display, polar math for scoring — sidesteps the precision bug entirely.
- No mature, maintained npm "dartboard component" is standard; build it (open-source clickable-SVG-dartboard references exist to adapt). Confidence MEDIUM for this being the "standard" since it is bespoke per app.

## Cross-window state sync (domain-specific)

- The main scoring window posts state deltas (or a snapshot) on a named channel; the spectator window subscribes and re-renders.
- Because BroadcastChannel is fire-and-forget, the spectator window (opened later, or reloaded) hydrates initial state by reading the current match from Dexie, then listens for live deltas.
- On Android tablet there is no second movable window — the spectator "view" is just an in-app fullscreen route; same state, no channel needed. The channel layer is PC-only and degrades gracefully.

## Stack Patterns by Variant

- Use SvelteKit + adapter-static (recommended). Smallest runtime, lightest hydration.
- Swap to React 19 + Vite + vite-plugin-pwa + Dexie (`dexie-react-hooks` `useLiveQuery`). Everything else (Workbox, IndexedDB, BroadcastChannel, SVG board) is framework-agnostic and carries over unchanged.
- Vanilla TS + Vite + vite-plugin-pwa + Dexie; hand-roll a tiny reactive store for the live view. More code, viable only because the app is small.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite-plugin-pwa@1.3.x | Vite ≥3.1, Node ≥16, Workbox v7 | Works with current Vite 8. Set Vite `base: '/<repo-name>/'`; the plugin reads it for SW scope + manifest paths on GitHub Pages. |
| @sveltejs/adapter-static@3.0.x | SvelteKit@2.x | Use `fallback` for SPA routing under a subpath; ensure `paths.base` matches the GitHub Pages subpath. |
| @vitest/browser@4.1.x + vitest-browser-svelte@2.1.x | Vitest@4.1.x + Playwright@1.60.x | Run `npx playwright install` or browser tests fail with "No browsers found". Use `await expect.element(...)` in browser mode. |
| svelte-check@4.6.x | Svelte 5 + TypeScript 5.9.x | Verify 6.0 support before bumping TypeScript. |
| Dexie@4.4.x | All modern browsers, PWAs | Pair with `navigator.storage.persist()` / `.estimate()` so data is not evicted under storage pressure and you can warn the user. |

## Sources

- npm registry (verified 2026-06-10) — current versions: vite 8.0.16, vite-plugin-pwa 1.3.0, svelte 5.56.3, @sveltejs/kit 2.64.0, @sveltejs/adapter-static 3.0.10, dexie 4.4.3, vitest 4.1.8, @vitest/browser 4.1.8, vitest-browser-svelte 2.1.1, playwright 1.60.0, workbox-window 7.4.1, svelte-i18n 4.0.1, svelte-check 4.6.0, happy-dom 20.10.2, typescript 6.0.3 (advise pin to ~5.9). — HIGH
- Vite PWA org docs (vite-pwa-org.netlify.app) — precache/globPatterns, base path on GitHub Pages, navigateFallback, autoUpdate. — HIGH
- dexie.org + Dexie GitHub — IndexedDB wrapper features, liveQuery, browser/PWA support. — HIGH
- Svelte docs (svelte.dev/docs/svelte/testing) + Scott Spence "Vitest Browser Mode" guide — 2026 Svelte component-testing direction. — HIGH (official) / MEDIUM (guide)
- MDN-aligned community comparisons — BroadcastChannel vs storage event vs window.opener (transient vs persistent, same-origin, browser support). — MEDIUM
- Clickable SVG dartboard references (djave.co.uk free SVG dartboard; CodePen clickable dartboard) + Smashing Magazine "SVG pointer-events"; polar-coordinate scoring (101computing) — SVG board + hit-detection patterns. — MEDIUM

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
