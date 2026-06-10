# Project Research Summary

**Project:** neverman-darts-app
**Domain:** Offline-first, touch-optimized X01 darts scoring PWA with dual-window spectator display
**Researched:** 2026-06-10
**Confidence:** HIGH

## Executive Summary

This is a touch-first, single-device, offline darts scoring app for steel darts (X01 301/401/501) for home/hobby use by up to 4 players. Hosted as a static PWA on GitHub Pages with a secondary spectator window on a PC monitor and an in-app fullscreen view on tablets. Research across all four domains converges on: a layered offline-first SPA built on SvelteKit and adapter-static, with a pure-function X01 engine, IndexedDB (Dexie) for durable storage, and BroadcastChannel plus localStorage for cross-window sync.

The recommended approach front-loads correctness: build the pure X01 rules engine and dartboard hit-detection first, prove them with exhaustive unit tests, then layer UI, persistence, spectator sync, statistics, and PWA packaging on top. Scoring bugs that survive to a deployed PWA corrupt stored match history and live in users' cached builds.

Key risks: (1) rules correctness -- bust logic has three conditions routinely missed, 3-dart average is non-obvious, checkout table has known bogey numbers; (2) touch input -- proportional ring hit zones are finger-unusable; (3) PWA data durability -- IndexedDB can be evicted without navigator.storage.persist() and there is no backend, so JSON export/import is mandatory insurance.

## Key Findings

### Recommended Stack

SvelteKit 2.x with @sveltejs/adapter-static: smallest runtime, GitHub Pages prerendering, Svelte 5 runes reactivity. TypeScript 5.9.x (pinned -- avoid 6.0). Dexie 4.x for structured IndexedDB. vite-plugin-pwa handles SW and manifest with correct GH Pages subpath handling.

**Core technologies:**
- **SvelteKit 2.64.x + @sveltejs/adapter-static 3.0.x**: App framework and static export for GitHub Pages
- **Svelte 5.56.x (runes)**: Fine-grained reactivity without VDOM overhead
- **TypeScript ~5.9.x**: Type safety for the X01 state machine and stats (pin; avoid 6.0)
- **Dexie 4.4.x**: IndexedDB wrapper with schema versioning, migrations, TypeScript support
- **vite-plugin-pwa 1.3.x**: SW and manifest with correct GitHub Pages subpath handling
- **BroadcastChannel (native)**: Cross-window live sync -- no library needed
- **Vitest 4.1.x + @vitest/browser + Playwright 1.60.x**: Engine unit tests and real-browser component tests

### Expected Features

The committed PROJECT.md scope is well-calibrated. Three additions are borderline table-stakes for v1: undo last entry, bust handling with full-visit revert, and screen wake lock. Checkout/double-attempt tracking is v1 (required for checkout %). JSON export/import is near-table-stakes given there is no backend.

**Must have (table stakes):**
- Undo last entry (reversible state model) -- mis-taps are guaranteed on touch
- Bust handling: all three bust conditions with full-visit revert
- Per-visit numeric keypad alongside per-dart board input
- Checkout and double-attempt tracking -- required to compute checkout %
- Core stats: 3-dart average, first-9 average, checkout %, 180/140/100 counts, highest score/checkout, best/worst leg
- Screen wake lock with visibilitychange re-acquire
- JSON export / import / backup -- mandatory data insurance for an offline-only app

**Should have (competitive):**
- Caller voice (Web Speech API, German) -- highest delight multiplier; Russ Bray's signature feature
- Training modes: Around the Clock, Bob's 27, Cricket, Shanghai, 121/checkout drill
- Sound effects and celebration overlay tied to 180s / records / high checkouts
- Stat dashboard and charts once history accumulates
- Guest players (no profile required) for visiting friends

**Defer (v2+):**
- Recorded high-quality caller audio clips (vs WebSpeech)
- Cricket as a full standalone match type
- Drag-to-modifier and advanced touch speed aids
- Handicap and per-player start offsets

### Architecture Approach

Layered offline-first SPA with strict domain/adapter separation. Pure-function X01 engine (reduce(state, action) -> state) owns all rules. State fans out from a single in-memory match store to: IndexedDB (event log + snapshot model) and BroadcastChannel + localStorage (spectator sync + reload rehydration). Dartboard uses polar-coordinate math for touch hit testing.

**Major components:**
1. **X01 Engine** (domain/x01/engine.ts) -- pure reducer: bust logic, double/single-out, turn rotation, leg/set advancement
2. **Checkout Engine** (domain/checkout/) -- precomputed lookup table (2-170), handles all 7 bogey numbers
3. **Dartboard component** (ui/input/) -- SVG display with pointerdown events and polar-coordinate hit test; enlarged hit zones
4. **Match Store** (state/matchStore.ts) -- single in-memory source of truth; fans out to persistence and sync
5. **Persistence adapter** (persistence/) -- Dexie/IndexedDB; event log + snapshots; boot recovery; versioned schema
6. **Sync adapter** (sync/) -- BroadcastChannel; localStorage latest snapshot; request-state handshake
7. **Stats and Achievements** (domain/stats/) -- materialized projections over the event log; incrementally updated
8. **PWA shell** -- vite-plugin-pwa with /neverman-darts-app/ base path; precache; update prompt

### Critical Pitfalls

1. **Incomplete bust logic** -- All three bust conditions required: score<0, score==1 (double-out), finish on non-double
2. **Wrong 3-dart average** -- Average = points_scored / darts_actually_thrown * 3. Checkout legs count actual darts; busts count as 3. Max is 167.0
3. **Stale service worker** -- Use vite-plugin-pwa with build-time hashing; implement update-prompt flow in the SW phase
4. **PWA broken by GitHub Pages subpath** -- Set Vite base /neverman-darts-app/; align manifest scope; test on real GH Pages URL
5. **IndexedDB data loss** -- navigator.storage.persist() after first user intent; JSON export/import ships with IndexedDB phase
6. **Touch targets too small** -- Use polar math with enlarged hit zones (>=44px); proportional rings are finger-unusable
7. **BroadcastChannel spectator race** -- Request-state handshake + localStorage snapshot rehydration required from the start

## Implications for Roadmap

Based on the dependency graph and risk profile across all four research files, the following 8-phase structure is recommended:

### Phase 1: Domain Core -- X01 Engine + Types
**Rationale:** Everything else depends on the engine. Rules bugs shipped to a PWA corrupt stored match history. No dependencies -- build first.
**Delivers:** Pure TypeScript X01 state machine with exhaustive unit tests: all three bust conditions, double/single-out validation, turn rotation (up to 4 players), leg/set advancement, bull-off result recording, snapshot-based undo primitive.
**Addresses:** Undo last entry, bust handling, correct game loop
**Avoids:** Pitfalls 1 (incomplete bust), 2 (wrong bust revert), 3 (dart counting for average), 10 (undo restores full state)

### Phase 2: Dartboard Geometry + Touch Input
**Rationale:** Second pure-logic correctness risk. Hit-test math is independent; build and test before any rendering. Touch target sizing must be validated on the real tablet early.
**Delivers:** domain/board/geometry.ts hit-test function with tests; SVG dartboard with Pointer Events; enlarged hit zones; pending-visit buffer; per-visit numeric keypad; double-tap guards.
**Addresses:** Per-dart board input, per-visit numeric input, pending-visit confirmation
**Avoids:** Pitfalls 9 (small touch targets), 15 (double-tap / unconfirmed entry)

### Phase 3: Match Store + Playable Loop
**Rationale:** Wire domain and input into an end-to-end playable match without persistence -- verify correctness first.
**Delivers:** In-memory match store; dispatch -> engine -> UI re-render; undo in UI; checkout suggestion; bull-off entry; match setup; complete match flow.
**Uses:** SvelteKit routing, Svelte 5 runes store pattern
**Implements:** Match Store, Checkout Engine, minimal UI components

### Phase 4: Persistence + Recovery
**Rationale:** Once the loop is correct, make it durable. Event log + snapshots enables recovery and all future statistics. Export/import is mandatory data insurance.
**Delivers:** Dexie schema (profiles, matches, events, snapshots) with versioned migrations; event append; snapshot per leg; boot recovery; player profiles; match history; navigator.storage.persist(); JSON export/import.
**Uses:** Dexie 4.4.x
**Avoids:** Pitfalls 7 (storage eviction), 8 (schema migration)

### Phase 5: Spectator Display + Cross-Window Sync
**Rationale:** Needs stable SpectatorView from store and persistence for rehydration. The 27-inch-at-3m readable design constraint requires dedicated UX attention.
**Delivers:** Spectator route (read-only, large-typography, high-contrast, responsive 1-4 players); BroadcastChannel sync; localStorage latest snapshot; request-state handshake; window.open() in click handler; wake lock on both windows.
**Avoids:** Pitfalls 11 (BC race), 12 (popup-blocked), 13 (screen sleep), 14 (unreadable spectator)

### Phase 6: Statistics + Achievements
**Rationale:** Needs event log (Phase 4) and stable spectator view (Phase 5 shapes what stats are broadcast live).
**Delivers:** 3-dart average (correct dart counting), first-9 average, checkout %, 180/140/100 counts, highest score/checkout, best/worst leg; personal records; live achievement overlay + sound; long-term stats dashboard.
**Avoids:** Pitfall 3 (wrong average), Architecture Anti-Pattern 4 (stats as source of truth)

### Phase 7: PWA Shell + GitHub Pages Deployment
**Rationale:** Placed late so there is a complete app to install. Required before user acceptance testing on real devices.
**Delivers:** vite-plugin-pwa with /neverman-darts-app/ base; precache manifest; update-prompt flow; manifest icons; GitHub Actions deploy; verified install + offline on real GH Pages URL on Android tablet and Windows PC.
**Avoids:** Pitfalls 5 (stale SW), 6 (GH Pages subpath)

### Phase 8: Polish + Training Modes
**Rationale:** All infrastructure exists; training modes are thin rules modules on top of proven infrastructure.
**Delivers:** German caller voice (Web Speech API); sound effects; auto-pause countdown; dark-mode spectator tuning; training modes: Around the Clock, Bob's 27, Cricket, Shanghai, 121/checkout drill; guest player slots.

### Phase Ordering Rationale

- Pure domain logic first (1-2): Bugs here have the highest recovery cost; no dependencies on anything else.
- Playable loop before persistence (3 before 4): Catch rules and UX issues before the event log schema is set in stone.
- Persistence before spectator (4 before 5): Spectator needs stable SpectatorView and a rehydration source.
- Stats after event log (6 after 4): Statistics are projections over stored events.
- PWA packaging late (7): Avoids subpath complexity contaminating local dev.
- Training modes last (8): Small rules variants on top of fully proven infrastructure.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Persistence):** Dexie schema for an event-sourced match model is non-trivial; migration patterns need a focused research pass.
- **Phase 8 (Cricket training mode):** Cricket has its own marks/points rules distinct from X01; verify correct implementation before building.

Phases with standard patterns (skip research-phase):
- **Phase 1 (X01 Engine):** X01 rules fully documented; bust logic, average formula, bogey numbers verified.
- **Phase 2 (Dartboard Geometry):** Polar hit-test math and wheel order verified.
- **Phase 3 (Match Store):** Standard Svelte 5 runes store pattern.
- **Phase 5 (Spectator Sync):** BroadcastChannel + localStorage handshake fully specified in architecture research.
- **Phase 7 (PWA / GH Pages):** vite-plugin-pwa + adapter-static patterns well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry 2026-06-10. Dartboard SVG component has no canonical library -- must be built (MEDIUM for that choice). |
| Features | HIGH | Table-stakes corroborated across DartCounter, n01, Russ Bray, Score Darts, ScoreApp. Prioritization is MEDIUM -- judgment applied to this specific context. |
| Architecture | HIGH | All major patterns (pure reducer, polar hit-test, dual-window sync, event sourcing) map to well-established, documented techniques. |
| Pitfalls | HIGH | Rules bugs verified against official darts sources; PWA/storage pitfalls verified against MDN, caniuse, WebKit blog. |

**Overall confidence:** HIGH

### Gaps to Address

- **Checkout table completeness:** The 2-170 table must be verified against darts501.com. The 7 bogey numbers and 156/157 finishes must be explicitly tested.
- **Dartboard SVG ring-radius constants:** Band-edge fractions need to be tuned against the actual rendered SVG and calibrated on-device.
- **Web Speech API German voice quality:** Depends on OS having a German TTS voice. Design a fallback (silent / text-only) from the start.

## Sources

### Primary (HIGH confidence)
- npm registry (2026-06-10) -- verified package versions for all core dependencies
- vite-pwa-org.netlify.app -- precache, base path, navigateFallback, autoUpdate
- dexie.org + Dexie GitHub -- IndexedDB wrapper, liveQuery, PWA support
- svelte.dev/docs -- Svelte 5 runes, SvelteKit static adapter, testing
- MDN -- BroadcastChannel API, Screen Wake Lock API, Storage quotas and eviction
- DartCounter, n01, Russ Bray Scorer, Score Darts, ScoreApp -- feature and UX reference
- darts501.com, dartscheckoutassistant.com -- checkout table, bogey numbers
- Darts Atlas, DartHelp -- 3-dart average convention
- DartCounter bust rule docs, ScoreApp scoring rules -- bust conditions
- Martin Fowler Event Sourcing; Microsoft Azure Event Sourcing pattern
- vite-plugin-pwa GitHub issues #4, #263 -- GH Pages subpath handling

### Secondary (MEDIUM confidence)
- Scott Spence Vitest Browser Mode guide -- Svelte component testing 2026 direction
- Clickable SVG dartboard references (djave.co.uk, CodePen) -- board geometry
- klemenstraeger/darts-scorer -- Web Speech API caller pattern
- beskardarts.com, dartsplanet.tv, dartsy.org -- training game rules

---
*Research completed: 2026-06-10*
*Ready for roadmap: yes*