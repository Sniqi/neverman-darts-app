---
phase: 07-chromecast-integration
plan: "02"
subsystem: cast-types
tags: [tdd, cast, projection, types, size-bound]
status: complete

dependency_graph:
  requires: [07-01]
  provides: [CastDisplayState, CastSnapshotMessage, toDisplayState, isValidCastState]
  affects: [07-03, 07-04, 07-05]

tech_stack:
  added: []
  patterns:
    - "visits trim: slice to current-leg only + rebase legStartVisitIndex to 0"
    - "pure-module projection: no Svelte runes, safe to import from sender and receiver"
    - "isValidCastState mirrors isValidMatchState discipline (display.svelte.ts)"

key_files:
  created:
    - src/lib/cast-types.ts
    - src/lib/cast-types.test.ts
  modified: []

decisions:
  - "Visits trim: scope each player's visits to current leg only (visits.slice(legStartVisitIndex[id])), rebase legStartVisitIndex to 0 — keeps legAverage/matchAverage numerically identical to /display output, keeps recentVisitsWithScores correct for the current leg, and ensures worst-case 4-player payload is well under 32 KB"

metrics:
  duration: "~3 min"
  completed: "2026-06-18"
  tasks_completed: 2
  files_changed: 2
---

# Phase 07 Plan 02: CastDisplayState Projection Summary

CastDisplayState projection (D-05/D-07) with visits trimmed to current leg, enforced 32 KB size bound, and isValidCastState guard — all TDD RED→GREEN.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RED — write cast-types projection tests | 0c49675 | src/lib/cast-types.test.ts |
| 2 | GREEN — implement cast-types.ts projection | 3518ec3 | src/lib/cast-types.ts |

## What Was Built

`src/lib/cast-types.ts` exports:

- **`CastDisplayState`** — trimmed snapshot interface containing exactly what `/display` components read: `config`, `players[]` (with `id`, `name`, `remaining`, `legsWon`, `setsWon`, `visits`), `activePlayerIndex`, `currentVisit`, `phase`, `legStartVisitIndex`, `pauseActive`, `pauseRemainingSeconds`
- **`CastSnapshotMessage`** — `{ type: 'snapshot' } & CastDisplayState` — the on-wire message type; `type` discriminant routes snapshots vs. future record/request messages at the receiver
- **`toDisplayState(state, pauseActive, pauseRemainingSeconds)`** — pure projection function, no Svelte runes, no side effects
- **`isValidCastState(msg)`** — receiver-side shape guard mirroring `isValidMatchState` discipline

## Visits Trim Decision (Claude's Discretion)

The plan required a recorded rationale for the `visits` trim approach. The decision:

**Trim to current leg only** — each player's `visits` is sliced to `visits.slice(legStartVisitIndex[id])` and `legStartVisitIndex` is rebased to `0` in the projection.

Rationale:
1. **`recentVisitsWithScores`** (last 4 visits) — reads `player.visits` directly; trimming to current leg is correct because the live scoreboard never shows visits from a completed leg in this slot
2. **`legAverage`** — receives `visits.slice(legStartVisitIndex)` from `PlayerPanel`; after rebasing to 0, the full projected `visits` IS the current-leg slice — numerically identical
3. **`matchAverage`** — receives all `player.visits` but per `averages.ts` documentation the formula `(startScore - remaining) / dartsThrown` only captures current-leg scoring regardless of how many visits are passed; result identical to the trimmed projection
4. **Size impact** — worst-case 4 players × 40 visits → 4 players × 10 visits (if `legStartVisitIndex = 30`); this alone reduces payload by ~75%, well within the 32 KB margin

The D-07 size test with 4 players × 40 total visits / 10 current-leg visits per player passes with bytes well under 32768.

## Test Results

21/21 tests pass across 4 behavior groups:

- **Field completeness** (6 tests): top-level fields, per-player fields, visits trim & rebase, legAverage numerical equivalence, recentVisitsWithScores window, bust/wasCheckout preservation, currentVisit passthrough
- **isValidCastState guard** (9 tests): valid state, null, undefined, empty players, out-of-range high/negative index, non-array players, missing players field, CastSnapshotMessage with extra `type` field
- **Pause passthrough SYNC-03** (3 tests): `pauseActive=true` with seconds, `pauseActive=false`, arbitrary countdown values
- **Size bound D-07** (2 tests): worst-case 4-player sets match < 32768 bytes; 2-player < 32768 bytes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dynamic `await import()` inside non-async test function**
- **Found during:** Task 1 (RED) — first vitest run
- **Issue:** The legAverage equivalence test used `const { legAverage } = await import(...)` inside a synchronous `it()` callback; oxc transform rejected it with `await is only allowed within async functions`
- **Fix:** Moved `import { legAverage }` to the top-level static imports of the test file (where it belongs)
- **Files modified:** src/lib/cast-types.test.ts
- **Commit:** Folded into the RED commit (0c49675) — the fix was pre-commit

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. `cast-types.ts` is a pure module with no I/O — the threat model items T-07-02 (size bound) and T-07-IV (shape guard) are addressed by the passing tests.

## TDD Gate Compliance

- RED gate: `test(07-02): add failing CastDisplayState projection tests` — commit 0c49675
- GREEN gate: `feat(07-02): implement CastDisplayState projection (D-05/D-07)` — commit 3518ec3
- REFACTOR gate: not needed — implementation is clean

## Self-Check

Files exist:
- src/lib/cast-types.ts: FOUND
- src/lib/cast-types.test.ts: FOUND

Commits exist:
- 0c49675 (RED): FOUND
- 3518ec3 (GREEN): FOUND

Self-Check: PASSED
