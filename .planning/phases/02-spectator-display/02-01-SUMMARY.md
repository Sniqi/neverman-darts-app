---
phase: 02-spectator-display
plan: "01"
subsystem: engine + stores
tags: [averages, leg-average, match-average, display-store, broadcast-channel, tdd, red-green]
dependency_graph:
  requires: []
  provides:
    - src/engine/averages.ts (computeAverage, legAverage, matchAverage)
    - src/engine/types.ts (MatchState.legStartVisitIndex)
    - src/stores/display.svelte.ts (DisplayStore, displayStore)
  affects:
    - src/engine/reducer.ts (legStartVisitIndex initialisation + leg transitions)
    - All MatchState consumers (legStartVisitIndex is a new required field)
tech_stack:
  added: []
  patterns:
    - Pure stateless utility (averages.ts mirrors checkout.ts pattern)
    - Svelte 5 runes class store (DisplayStore mirrors MatchStore pattern)
    - BroadcastChannel subscriber with localStorage hydration
    - TDD RED/GREEN cycle per task
key_files:
  created:
    - src/engine/averages.ts
    - src/engine/averages.test.ts
    - src/stores/display.svelte.ts
    - src/stores/display.svelte.test.ts
    - e2e/spectator-sync.spec.ts
  modified:
    - src/engine/types.ts
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
decisions:
  - legStartVisitIndex initialised per player to 0 at applyStartMatch; reset to each player's visits.length at every new leg/set start in handleLegWinFromPlayers
  - UNDO correctness is automatic via log replay (no special UNDO handling needed for legStartVisitIndex)
  - computeAverage does not round — formatting to one decimal is the display layer's job
  - DisplayStore unit tests mock BroadcastChannel and localStorage via vi.stubGlobal (node env)
  - e2e/spectator-sync.spec.ts is the intentionally-failing red baseline (no /display route yet)
metrics:
  duration: "6 minutes"
  completed: "2026-06-11"
  tasks: 2
  files: 8
---

# Phase 02 Plan 01: Data Foundation and Failing E2E Baseline Summary

**One-liner:** legStartVisitIndex added to MatchState for per-leg visit isolation, averages.ts pure computation functions, DisplayStore BroadcastChannel subscriber with localStorage hydration, and failing DISP-05 e2e baseline committed.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add legStartVisitIndex to MatchState + reducer; create averages.ts + tests | `62d9eaf` | types.ts, reducer.ts, reducer.test.ts, averages.ts, averages.test.ts |
| 2 | DisplayStore subscriber + failing e2e baseline | `fab79c4` | display.svelte.ts, display.svelte.test.ts, spectator-sync.spec.ts |

## Verification

- `npm run test:unit` — 173 tests, all passing (10 test files)
- `npm run check` — only 1 pre-existing error in `src/db/profiles.ts` (not introduced by this plan)
- `npx playwright test e2e/spectator-sync.spec.ts` — 2 tests fail as intended (red baseline; /display route does not exist yet)
- `grep -rn "legStartVisitIndex" src/engine` — 18+ matches across types.ts, reducer.ts, reducer.test.ts, averages.ts

## Acceptance Criteria Status

- [x] `npm run test:unit -- src/engine/averages.test.ts src/engine/reducer.test.ts` passes
- [x] `npm run check` reports no NEW type errors (pre-existing profiles.ts error unchanged)
- [x] `grep -rn "legStartVisitIndex" src/engine` shows >= 4 matches (verified: 18+)
- [x] averages.ts exports exactly `computeAverage`, `legAverage`, `matchAverage`; imports only `import type { Visit }` from types.ts
- [x] `computeAverage` returns null for empty visits array
- [x] `npm run test:unit -- src/stores/display.svelte.test.ts` passes (9 tests)
- [x] `e2e/spectator-sync.spec.ts` exists and FAILS (documented red baseline)
- [x] display.svelte.ts uses exact strings `'neverman-match'` and `'neverman-match-snapshot'`
- [x] `connect()` returns a cleanup function and does not throw on corrupt snapshot

## Deviations from Plan

None — plan executed exactly as written.

The test for "cleanup prevents further updates" was written to test via `postMessage` routing through the mock instances list (not `_dispatch` directly on the closed channel), which more accurately tests the real BroadcastChannel behavior: once closed, a channel is removed from the active set and receives no further messages.

## TDD Gate Compliance

Both tasks followed the RED/GREEN cycle:

**Task 1:**
- RED commit: tests written in averages.test.ts and reducer.test.ts extensions → 3 failing (legStartVisitIndex undefined)
- GREEN commit: `62d9eaf` — all 57 tests pass

**Task 2:**
- RED: display.svelte.test.ts written → fails (module not found)
- GREEN commit: `fab79c4` — all 9 tests pass

## Known Stubs

None — no stub patterns introduced. averages.ts and display.svelte.ts are fully wired implementations, not placeholders.

## Threat Flags

No new security surface beyond the plan's threat model. T-02-01 (localStorage JSON.parse) is mitigated via try/catch in DisplayStore.connect(). T-02-02 (BroadcastChannel same-origin) accepted as per plan.

## Self-Check: PASSED
