---
phase: 01-playable-x01-match
plan: 05
subsystem: engine
tags: [engine, undo, event-log, impossible-scores, tdd, bug-fix]
dependency_graph:
  requires: []
  provides: [ENG-05, INP-02]
  affects: [src/engine/reducer.ts, src/engine/impossible-scores.ts]
tech_stack:
  added: []
  patterns: [TDD RED/GREEN, pure reducer event-log, impossible-score guard]
key_files:
  created: []
  modified:
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
    - src/engine/impossible-scores.ts
    - src/engine/impossible-scores.test.ts
decisions:
  - "START_MATCH resets eventLog to [action] — not an append to the existing log (CR-07)"
  - "CONFIRM_VISIT returns state unchanged and is never appended to the log (WR-01)"
  - "IMPOSSIBLE_3DART now contains all 9 unreachable 3-dart totals: 163, 166, 169, 172, 173, 175, 176, 178, 179"
metrics:
  duration: "3 min"
  completed: "2026-06-10"
  tasks: 2
  files: 4
---

# Phase 01 Plan 05: Engine Correctness Gaps (ENG-05, INP-02) Summary

**One-liner:** Event-log reset on START_MATCH, CONFIRM_VISIT excluded from log, and IMPOSSIBLE_3DART extended with 163 and 166 — all verified by 9 new unit tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests: event-log reset + CONFIRM_VISIT no-op | 53f0f12 | reducer.test.ts |
| 1 (GREEN) | Fix event-log reset and CONFIRM_VISIT in reducer | 77cfd62 | reducer.ts |
| 2 (RED) | Failing tests: 163 and 166 impossible totals | 923c595 | impossible-scores.test.ts |
| 2 (GREEN) | Add 163 and 166 to IMPOSSIBLE_3DART | c3065b2 | impossible-scores.ts |

## What Was Built

### Task 1 — Event-log semantics (ENG-05, CR-07, WR-01)

Two bugs were fixed in `src/engine/reducer.ts`:

**CR-07 — START_MATCH appended to prior log instead of resetting it.**
`reduce()` previously built `newLog = [...state.eventLog, action]` for all non-UNDO actions, then passed that shared `newLog` into `applyStartMatch`. Starting match B on a state with a non-empty log (e.g. a completed match A) would produce a log containing both matches' actions. An UNDO at the start of match B would then replay match A and resurface `phase: 'match-complete'`.

Fix: `START_MATCH` is now handled before the shared `newLog` is built. `applyStartMatch` no longer accepts a `newLog` parameter — it always sets `eventLog: [action]` (fresh single-entry log).

**WR-01 — CONFIRM_VISIT was appended to the log as a no-op.**
`CONFIRM_VISIT` carries no state change (per Phase 01-03 decision: it is a pure UI signal). But it was being appended to the event log, so the first UNDO after any confirmed visit silently consumed the CONFIRM_VISIT no-op rather than undoing the actual dart. Two presses were required to undo one real action.

Fix: `CONFIRM_VISIT` is now handled before `newLog` is built, returning `state` unchanged with no log entry.

### Task 2 — Impossible 3-dart totals (INP-02, CR-02)

`IMPOSSIBLE_3DART` in `src/engine/impossible-scores.ts` was missing 163 and 166. These are physically unreachable 3-dart totals on a standard board (confirmed by D-12 bogey number list in CONTEXT.md). The numpad would previously accept them and allow corrupt match state.

Fix: `IMPOSSIBLE_3DART` now contains all 9 impossible values: `{163, 166, 169, 172, 173, 175, 176, 178, 179}`. JSDoc comment updated to list the complete set.

## Test Results

```
Test Files  2 passed (2)
Tests       64 passed (64)
```

- `reducer.test.ts`: 39 tests (35 pre-existing + 4 new ENG-05 tests)
- `impossible-scores.test.ts`: 25 tests (18 pre-existing + 7 new CR-02 tests)

All pre-existing tests remain green. No regressions.

## TDD Gate Compliance

Both tasks followed the full RED → GREEN cycle:

1. RED commit: failing tests written and committed before implementation
2. GREEN commit: minimal implementation to pass the tests committed after
3. No REFACTOR step needed — implementation was already clean

Gate compliance verified via git log — `test(01-05)` commits precede `feat(01-05)` commits for both tasks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion comment was incorrect in Task 1 RED**
- **Found during:** Task 1 RED phase verification
- **Issue:** Initial test for "single UNDO after CONFIRM_VISIT" had a wrong inline comment asserting `players[0].remaining === 501` after `numpadVisit(60)` — the actual value after the visit is 441 (score deducted, turn passed to player B)
- **Fix:** Corrected the comment and assertion before the RED commit so the test accurately captures the intended behavior
- **Files modified:** reducer.test.ts
- **Commit:** Included in 53f0f12 (RED commit)

None beyond the above comment correction — plan executed as written.

## Type Check

`npx svelte-check` reports 1 pre-existing error in `src/db/profiles.ts` (not touched by this plan). No new type errors introduced in `reducer.ts` or `impossible-scores.ts`.

## Known Stubs

None — this plan modifies pure-logic engine functions only. No UI rendering, no data sources.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The threat mitigations documented in the plan are implemented:

- T-01-05-01: `isValidVisitTotal` now rejects 163 and 166 in addition to the prior 7 values
- T-01-05-02: `START_MATCH` resets the event log — a new match cannot inherit/replay a prior match's actions via UNDO

## Self-Check: PASSED

Files verified present:
- src/engine/reducer.ts — FOUND
- src/engine/reducer.test.ts — FOUND
- src/engine/impossible-scores.ts — FOUND
- src/engine/impossible-scores.test.ts — FOUND

Commits verified:
- 53f0f12 (test RED Task 1) — FOUND
- 77cfd62 (feat GREEN Task 1) — FOUND
- 923c595 (test RED Task 2) — FOUND
- c3065b2 (feat GREEN Task 2) — FOUND
