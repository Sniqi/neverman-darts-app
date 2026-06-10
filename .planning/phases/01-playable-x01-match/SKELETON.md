# Walking Skeleton — Neverman Darts App

**Phase:** 1
**Generated:** 2026-06-10

## Capability Proven End-to-End

> One sentence: the smallest user-visible capability that exercises the full stack.

A player can create a profile (written to and read back from IndexedDB) on the `/setup` route and tap a placeholder dartboard region on the `/match` route to decrement a live, runes-driven score — proving that SvelteKit routing, Dexie/IndexedDB persistence, Svelte 5 runes reactivity, and the adapter-static build all work together.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit 2.64.x + Svelte 5.56.x runes (`$state`/`$derived`/`$effect`), TypeScript ~5.9.x | Locked by CLAUDE.md. Smallest runtime of the mainstream options — matters for a touch app on Android tablets and PWA cold-start. Built-in file routing covers setup/bull-off/match. TS pinned to ~5.9 (NOT 6.0) until the svelte-check ecosystem confirms 6.0 support. |
| Build / export | `@sveltejs/adapter-static@3.0.x` + `prerender = true`, `ssr = false` (SPA) | GitHub Pages serves static files only — no server runtime. `fallback: '404.html'` enables SPA client routing under a repo subpath. |
| Base path | `kit.paths.base` from `process.env.BASE_PATH` (empty in dev, `/neverman-darts-app` in CI) | GitHub Pages serves under a repository subpath; the adapter reads `base` so assets and routes resolve correctly. Verified at Phase 6 deploy. |
| Data layer | Dexie 4.4.x over IndexedDB. `version(1)` = `profiles` table only; `version(2)+` reserved (comment) for Phase 3 (`matches`, `events`) | localStorage's ~5 MB string-only cap is unfit for match history + lifetime stats. Dexie gives typed schema versioning, transactions, and `liveQuery`. Phase 3 extends the SAME DB additively — no migration from in-memory needed. |
| Match state | Pure reducer `reduce(state, action) → state` over an append-only event log, wrapped by a class-based `.svelte.ts` runes store (`matchStore`) | Single source of truth for bust handling, undo (log replay), leg/set counting, rotation, dart tracking. Framework-free engine is exhaustively unit-testable in Node before any UI. State is kept serializable so Phase 2's spectator view can post it over BroadcastChannel. |
| Auth | None | Single-device local app; no accounts, no sessions, no network. Up to 4 known players are handled via local profiles + (Phase 3) JSON export/import. |
| Cross-window sync | Deferred to Phase 2 (BroadcastChannel + IndexedDB hydration) | Not part of the skeleton. MatchState is kept serializable now so Phase 2 can adopt it without refactor. |
| Deployment target | GitHub Pages static (Phase 6). Local full-stack run: `npm run build && npm run preview` | Static-only host; no backend. Phase 1 proves the stack locally; Phase 6 wires PWA + Pages deploy. |
| Directory layout | `src/engine/` (pure TS), `src/db/` (Dexie), `src/stores/` (runes stores), `src/routes/` (SvelteKit file routing), `src/ui/{input,setup,overlays}/` (bespoke Svelte components), `src/lib/` (browser helpers), `static/` (`.nojekyll`) | Mirrors the RESEARCH Recommended Project Structure. Separates framework-free logic (engine) from client components, which keeps the engine testable in Node and the components testable in the Vitest browser project. |
| Test infra | Vitest 4.1.x multi-project: `unit` (node — engine, db) + `browser` (Playwright/chromium — components); Playwright 1.60.x for E2E | Pure logic runs fast in Node; pointer/touch/SVG hit-detection needs a real browser (jsdom lies). One Playwright install backs both browser-mode component tests and the full-match E2E. |

## Stack Touched in Phase 1

- [x] Project scaffold (SvelteKit + adapter-static, TypeScript, Vitest unit+browser projects, Playwright, svelte-check) — Plan 01 Task 2
- [x] Routing — `/`, `/setup`, `/match` real routes (`/bulloff` added in Plan 04) — Plan 01 Tasks 2–3
- [x] Database — real Dexie read AND write of a profile on `/setup` — Plan 01 Task 3 (full CRUD in Plan 04)
- [x] UI — interactive dartboard tap wired through a runes store to a displayed score — Plan 01 Task 3 (real Dartboard in Plan 03)
- [x] Deployment — documented local full-stack run (`npm run build && npm run preview`); GitHub Pages deploy itself is Phase 6

## Out of Scope (Deferred to Later Slices)

> Anything that is *not* in the skeleton. This list prevents future phases from re-litigating Phase 1's minimalism.

- Spectator display — second-window + in-app fullscreen, BroadcastChannel sync (Phase 2)
- Match persistence / resume-after-reload, match history list, JSON export/import (Phase 3)
- Live + lifetime statistics, charts dashboard, personal-record detection + celebration overlays (Phase 4)
- Caller voice (speech synthesis), sound effects, configurable auto-pause countdown (Phase 5)
- PWA packaging (service worker, manifest, install), GitHub Pages deployment, update prompt (Phase 6)
- Training modes, per-player handicaps, recorded caller clips (v2 — REQUIREMENTS.md)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2 — Spectator Display:** a live, large-type spectator view (second window on PC / in-app fullscreen on tablet) that subscribes to the serializable MatchState via BroadcastChannel and hydrates from IndexedDB on reopen.
- **Phase 3 — Persistence & Data:** extend the Dexie DB (`version(2)`: matches, events) so a match survives reload/crash; match history list; JSON export/import.
- **Phase 4 — Statistics & Achievements:** derive live + lifetime stats from the event log; charts dashboard; detect + celebrate personal records on both views.
- **Phase 5 — Audio & Auto-Pause:** caller voice (DE/EN speech synthesis), 180/high-finish/record sound effects, configurable auto-pause countdown between legs.
- **Phase 6 — PWA & Deployment:** vite-plugin-pwa service worker + manifest, offline precache, GitHub Pages deploy at the repo subpath, update prompt.
