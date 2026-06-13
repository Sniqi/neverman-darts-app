---
phase: 01-playable-x01-match
plan: 12
subsystem: ui
tags: [svelte, typescript, x01, scoring, reducer, gap-closure]

requires:
  - phase: 01-playable-x01-match
    provides: matchStore remaining getter (plan 08), CorrectionWindow repair (plan 11), inner-bull encoding fix (plan 10)

provides:
  - Live mid-visit score display in ScorePanel bound to matchStore.remaining
  - Crash-proof 0-player match start guard in BullOffOrder + reducer
  - Functional darts-at-double capture on numpad leg-winning visits

affects: [01-VERIFICATION, spectator-view, stats-phase]

tech-stack:
  added: []
  patterns:
    - "Defer dispatch until dialog confirms to carry dialog-chosen values into the event log"
    - "Reducer defense-in-depth: UI guard is primary, reducer returns initialState() as secondary invariant"
    - "Live getter (matchStore.remaining) wired to same source as CheckoutSuggestion for consistent on-screen values"

key-files:
  created: []
  modified:
    - src/ui/input/ScorePanel.svelte
    - src/ui/setup/BullOffOrder.svelte
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
    - src/routes/match/+page.svelte
    - src/ui/input/DartsAtDoubleDialog.svelte

key-decisions:
  - "Active remaining in ScorePanel uses isActive ? matchStore.remaining : player.remaining — same live getter as CheckoutSuggestion, eliminating contradictory score/suggestion display"
  - "Reducer applyStartMatch returns initialState() (phase=setup) for empty resolved player list — state machine invariant: no 0-player playing state can be produced"
  - "Numpad finish dispatched after dialog confirms so dartsAtDouble flows into the event log; non-finishing visits dispatched immediately as before (dartsAtDouble=0 per D-08)"

patterns-established:
  - "Defer-dispatch pattern: store pending values before dialog opens; dispatch after confirm"
  - "Dual-layer guard: UI prevents bad navigation, reducer enforces state machine invariant as defense in depth"

requirements-completed: [ENG-07, FLOW-01, INP-03]

duration: 8min
completed: 2026-06-11
---

# Phase 01 Plan 12: Gap Closure — Live Score, 0-Player Guard, Darts-at-Double Summary

**Three surgical fixes: live mid-visit score display (CR-02/ENG-07), crash-proof 0-player match guard (CR-05/FLOW-01), and functional darts-at-double capture on numpad finishes (WR-01/INP-03)**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-11T02:00:00Z
- **Completed:** 2026-06-11T02:08:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- ScorePanel active player remaining now reads `isActive ? matchStore.remaining : player.remaining` — live mid-visit updates agree with the CheckoutSuggestion beside it
- BullOffOrder.confirmOrder redirects to /setup when order is empty; confirm button is disabled when order is empty; reducer returns `initialState()` for any empty resolved player list
- handleNumpadVisit defers the finishing NUMPAD_VISIT dispatch until the darts-at-double dialog confirms, carrying the chosen value into the event log

## Task Commits

Each task was committed atomically:

1. **Task 1: Bind active player score to live remaining getter (CR-02)** - `0dae112` (fix)
2. **Task 2: Guard the 0-player match start in BullOffOrder and the reducer (CR-05)** - `a07139f` (fix)
3. **Task 3: Record darts-at-double on a numpad finish (WR-01 / INP-03)** - `3e45d71` (fix)

## Files Created/Modified

- `src/ui/input/ScorePanel.svelte` — Active remaining uses `isActive ? matchStore.remaining : player.remaining`
- `src/ui/setup/BullOffOrder.svelte` — confirmOrder empty-order guard; confirm button `disabled={order.length === 0}`
- `src/engine/reducer.ts` — applyStartMatch uses filter-safe lookup (no `find()!`); returns `initialState()` for empty player list
- `src/engine/reducer.test.ts` — Three new CR-05 tests: empty order, all-unmatched order, partial-match order
- `src/routes/match/+page.svelte` — handleNumpadVisit defers finish dispatch; handleDartsAtDoubleConfirm dispatches with dartsAtDouble/dartsUsed
- `src/ui/input/DartsAtDoubleDialog.svelte` — Clarifying comment on Phase 1 darts-at-double equals darts-used semantics

## Decisions Made

- Used a simple `isFinish` flag in handleNumpadVisit rather than watching store phase post-dispatch, because prevRemaining and prevPhase must be captured before any dispatch
- Reducer returns `initialState()` (not a custom error state) for the empty-player case — keeps the state machine clean with a single "safe" non-playing state
- DartsAtDoubleDialog `select()` continues to call `onconfirm(darts, darts)` — no UI change needed for Phase 1; a comment documents the Phase 4 distinction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The existing `'finishing numpad visit carries dartsAtDouble'` test in reducer.test.ts already covered the reducer behaviour for Task 3 — no new reducer test was needed beyond the CR-05 START_MATCH guard tests.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three gap defects from 01-REVIEW.md are now closed: CR-02, CR-05, WR-01
- Phase 01 plans complete: active scoring, correction window, darts-at-double capture all functional end-to-end
- Ready for phase verification (01-VERIFICATION.md human tests #1 and #4) and phase completion

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-11*

## Self-Check: PASSED

- `src/ui/input/ScorePanel.svelte` exists and contains `isActive ? matchStore.remaining : player.remaining`
- `src/ui/setup/BullOffOrder.svelte` exists with `order.length === 0` guard and disabled button
- `src/engine/reducer.ts` exists with filter-safe lookup and `initialState()` return
- `src/engine/reducer.test.ts` exists with 42 passing tests (verified by vitest run)
- `src/routes/match/+page.svelte` exists with deferred dispatch and `dartsAtDouble` in confirm
- Commits 0dae112, a07139f, 3e45d71 verified in git log
