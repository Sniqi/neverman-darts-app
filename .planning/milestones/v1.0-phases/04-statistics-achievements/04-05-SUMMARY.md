---
phase: 04-statistics-achievements
plan: "05"
subsystem: stores + ui/overlays + routes
tags: [records, achievements, broadcast, overlay, tdd]
dependency_graph:
  requires:
    - BC_CHANNEL / LS_SNAPSHOT (match.svelte.ts Phase 2)
    - computeLifetimeStats + LifetimeStats (04-03)
    - matchAverageCrossLeg / bestLeg / highestVisit (04-01)
    - StatDrawer (04-02, preserved in /match route)
  provides:
    - BC_RECORD_CHANNEL constant ('neverman-record')
    - RecordItem interface
    - MatchStore.preloadedRecords / pendingRecords / loadRecords / #detectRecords / #broadcastRecordEvent
    - RecordOverlay component (auto-dismiss, combined-card D-07)
    - recordBadge prop on LegWinBanner / MatchWinDisplay / MatchWinOverlay (D-08)
    - /display second BroadcastChannel subscription for record events
    - matchAverageCrossLeg wired in MatchWinDisplay (replaces matchAverage)
  affects:
    - src/lib/sync-constants.ts
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/stores/display.svelte.ts
    - src/ui/overlays/RecordOverlay.svelte
    - src/ui/display/LegWinBanner.svelte
    - src/ui/display/MatchWinDisplay.svelte
    - src/ui/overlays/MatchWinOverlay.svelte
    - src/routes/match/+page.svelte
    - src/routes/display/+page.svelte
tech_stack:
  added: []
  patterns:
    - "Separate BroadcastChannel('neverman-record') for record events — avoids DisplayStore type collision (Pitfall 5, T-04-12)"
    - "One-shot BC pattern (open/post/close) for record broadcast — mirrors match-state broadcast"
    - "TDD RED/GREEN — record detection tests committed before implementation"
    - "null-baseline first-occurrence guard: (preloaded.bestLeg === null || newLegDarts < preloaded.bestLeg) (D-05)"
    - "$effect auto-dismiss with clearTimeout teardown for RecordOverlay"
    - "D-08 coincident-win fold: phase check routes records to badge vs standalone overlay"
key_files:
  created:
    - src/lib/sync-constants.ts
    - src/ui/overlays/RecordOverlay.svelte
  modified:
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/stores/display.svelte.ts
    - src/ui/display/LegWinBanner.svelte
    - src/ui/display/MatchWinDisplay.svelte
    - src/ui/overlays/MatchWinOverlay.svelte
    - src/routes/match/+page.svelte
    - src/routes/display/+page.svelte
decisions:
  - "Null-baseline D-05: (preloaded.bestLeg === null || newLegDarts < preloaded.bestLeg) and (preloaded.matchAverage === null || liveAvg > preloaded.matchAverage) — plain < null / > null evaluate false in JS and silently skip first-ever record"
  - "RESOLVED (post-exec fix): numpad visit score detection now uses the RESEARCH remaining-delta approach (prev.remaining - next.remaining; prev.remaining for a numpad checkout) — numpad-entered 180s, highest-visit, and highest-checkout now celebrate (D-04 restored). New unit test covers the numpad path."
  - "loadRecords called from onMount in /match route — guard for players.length > 0"
  - "matchAverageCrossLeg replaces matchAverage in MatchWinDisplay — cross-leg correct for multi-leg final screen"
metrics:
  duration: "8 min"
  completed: "2026-06-12"
  tasks: 3
  files: 10
---

# Phase 04 Plan 05: Record Detection and Celebration Overlay Summary

Real-time personal-record detection and the celebration overlay across both views: a shared sync-constants module, `RecordOverlay` component, record detection in `MatchStore`, win-banner folding (D-08), and the overlay wired into both `/match` and `/display` — without a new Dexie table, without a new npm dependency.

## What Was Built

### Task 1 — Shared sync constants + RecordOverlay (commit 1f2abb0)

Created `src/lib/sync-constants.ts` exporting `BC_CHANNEL = 'neverman-match'`, `BC_RECORD_CHANNEL = 'neverman-record'`, `LS_SNAPSHOT = 'neverman-match-snapshot'`. Updated `match.svelte.ts` and `display.svelte.ts` to import from the shared module — values byte-identical, no sync behavior changed.

Created `src/ui/overlays/RecordOverlay.svelte`:
- Props: `records: string[]`, `autoDismissMs = 2500`, `ondismiss?: () => void`
- Renders only when `records.length > 0`; combined single-card headline via `records.join(' · ')` (D-07)
- `$effect` auto-dismiss: `setTimeout(ondismiss, autoDismissMs)` with `clearTimeout` teardown
- `role="status" aria-live="assertive"`, `z-index: 50`, `rgba(17,19,24,0.88)` backdrop, `bannerFadeIn 250ms ease-out` animation — matches LegWinBanner exactly
- All text via `{interpolation}` — no `{@html}` (T-04-13)

### Task 2 — Record detection in MatchStore (commits f00b787, RED/GREEN)

Extended `src/stores/match.svelte.ts`:
- Exported `RecordItem` interface: `{ playerId, type, value?, text }` where `text` is the pre-formatted German string
- Added `preloadedRecords = $state<Map<string, LifetimeStats>>(new Map())` and `pendingRecords = $state<RecordItem[]>([])`
- `loadRecords(state)`: for each non-guest player calls `db.matches.filter(...).toArray()` then `computeLifetimeStats(...)`, stores in `preloadedRecords`; wrapped in try/catch (Pitfall 4 — play continues on DB failure)
- `#detectRecords(prev, next)`: detects 180 (D-04 always), new highest-visit (board visits only), best-leg with null-baseline guard (D-05), highest-checkout from wasCheckout visits, match-avg with null-baseline guard (D-05). Returns combined list across all players (D-07). Never calls `dispatch` or `reduce` (T-04-14 no-infinite-loop)
- `#broadcastRecordEvent(items)`: one-shot `BroadcastChannel(BC_RECORD_CHANNEL)` — separate channel from match-state (Pitfall 5, T-04-12)
- Wired into `dispatch()`: capture `prevState` before `reduce()`; call `#detectRecords` after publish, before `#persistCompletedMatch`

Extended `src/stores/match.svelte.test.ts` (8 new tests, all green):
- Highest-visit detection after dispatch (171 beats 140 baseline)
- 180 always celebrates even when highestVisit baseline is already 180 (D-04)
- Record event posted on BC_RECORD_CHANNEL with `{ type: 'record-event', records: string[] }`
- Guest players excluded — no records fired even with preloaded baseline (D-11)
- No-preload: detection silently skips when player absent from preloadedRecords
- D-05 null-baseline: `bestLeg: null` → first leg celebrates `best-leg`
- D-05 null-baseline: `matchAverage: null` → first completed match celebrates `match-avg`
- No-infinite-loop stability: state intact after record-triggering dispatch

### Task 3 — Win banners + route wiring (commit 990677f)

Extended three win components with `recordBadge?: string | null` (default null):
- `LegWinBanner.svelte`: `{#if recordBadge}<p class="record-badge">{recordBadge}</p>{/if}` after subtitle; `.record-badge { margin: var(--space-sm,8px) 0 0; font-size: 16px; font-weight: 400; color: #e8a020; }`
- `MatchWinDisplay.svelte`: same badge below `.win-standing`; replaced `matchAverage()` import/call with `matchAverageCrossLeg(pl, legStartIdx, startScore)` for cross-leg-correct final average (RESEARCH State of the Art)
- `MatchWinOverlay.svelte`: same badge below `.win-body`

`/match` route (`src/routes/match/+page.svelte`):
- Imports `RecordOverlay`, adds `onMount` call to `matchStore.loadRecords(matchStore.state)` (guard: `players.length > 0`)
- D-08 coincident-win fold: when `matchStore.isMatchComplete` passes `recordBadge` to `MatchWinOverlay`; `RecordOverlay` only mounts when `phase === 'playing'` and records are pending
- `StatDrawer` mount from 04-02 preserved — not touched

`/display` route (`src/routes/display/+page.svelte`):
- Imports `BC_RECORD_CHANNEL` and `RecordOverlay`
- Second `$effect`: opens `BroadcastChannel(BC_RECORD_CHANNEL)`, listens for `{ type:'record-event', records }` shape only (unknown shapes ignored, T-04-11), sets `recordStrings = $state<string[]>([])`; cleanup closes channel (mirrors displayStore.connect teardown)
- D-08 fold: passes `recordBadge={recordStrings.join(' · ')}` to `MatchWinDisplay` and `LegWinBanner` when a win is showing; mounts standalone `RecordOverlay` otherwise

## Test Results

```
Test Files  14 passed (14)
Tests       283 passed (283)
```

8 new record-detection tests all green. All 275 existing tests unaffected. `npm run check`: 1 pre-existing error in `src/db/profiles.ts` (out-of-scope type error predating this plan). Zero new errors or warnings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Cleanup] Removed unused `{#snippet recordBadgeText()}` block from match route**
- **Found during:** Task 3 template editing — accidentally inserted an orphaned snippet block
- **Fix:** Removed before commit; did not generate a check error but was dead code
- **Files modified:** `src/routes/match/+page.svelte`
- **Commit:** 990677f (included in task commit)

**2. [RESOLVED post-exec] Numpad visit score detection**
- **Found during:** Task 2 implementation — `#detectRecords` computed visit score from `visit.darts.reduce()`, which returns 0 for numpad visits (`darts: []`), so numpad-entered 180s/highest-visit/highest-checkout did not celebrate.
- **Resolution (post-execution fix):** `#detectRecords` now applies the RESEARCH-prescribed remaining-delta approach — `prevPlayer.remaining - nextPlayer.remaining` for an in-leg numpad visit, and `prevPlayer.remaining` (the cleared amount) for a numpad checkout. Board visits still sum dart values. This restores D-04 ("180 always celebrates") for the numpad input path, which is a real/primary fast-entry method (`Numpad.svelte`, `NUMPAD_VISIT`).
- **Files modified:** `src/stores/match.svelte.ts` (`#detectRecords`), `src/stores/match.svelte.test.ts` (new numpad-path test).
- **Verification:** 284/284 unit tests pass; new test asserts numpad 180 → "180!" and numpad 160 → highest-visit.

## Known Stubs

None. Record detection flows from real preloaded `computeLifetimeStats` baselines. All overlay text is pre-formatted German strings from the UI-SPEC copywriting table. No placeholder text.

## Threat Flags

T-04-11 mitigated: `/display` record handler checks `data?.type === 'record-event'` before using payload — unknown shapes are ignored.

T-04-12 mitigated: separate `BroadcastChannel('neverman-record')` used throughout — `displayStore.state` is never touched by the record handler.

T-04-13 mitigated: all record strings rendered via Svelte `{interpolation}` in RecordOverlay, record-badge paragraphs, and route templates. No `{@html}` in any new code. Grep confirmed.

T-04-14 mitigated: `#detectRecords` only mutates `pendingRecords` and posts to BroadcastChannel; unit test confirms state integrity after record-triggering dispatch.

T-04-15 mitigated: `loadRecords` wrapped in per-player try/catch; missing player in `preloadedRecords` → detection skips that player.

No new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- src/lib/sync-constants.ts: FOUND
- src/ui/overlays/RecordOverlay.svelte: FOUND
- src/stores/match.svelte.ts: FOUND
- src/stores/match.svelte.test.ts: FOUND
- src/ui/display/LegWinBanner.svelte: FOUND
- src/ui/display/MatchWinDisplay.svelte: FOUND
- src/ui/overlays/MatchWinOverlay.svelte: FOUND
- src/routes/match/+page.svelte: FOUND
- src/routes/display/+page.svelte: FOUND
- commit 1f2abb0 (Task 1): FOUND
- commit f00b787 (Task 2): FOUND
- commit 990677f (Task 3): FOUND
