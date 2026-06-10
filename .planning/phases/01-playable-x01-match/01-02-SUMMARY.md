---
phase: 01-playable-x01-match
plan: 02
subsystem: engine
tags: [x01, reducer, event-log, polar-math, checkout, bust, svelte5, typescript]

# Dependency graph
requires:
  - phase: 01-playable-x01-match
    plan: 01
    provides: SvelteKit scaffold, Vitest multi-project harness, TypeScript config

provides:
  - Pure X01 reducer (reduce/initialState) over append-only event log with unlimited per-dart undo
  - Board polar-math hit classifier (classifyHit/angleToSegment) with D-01 enlarged ring radii
  - Bust detection (isBust) covering all three double-out conditions
  - Full 170-entry checkout table (getSuggestion/CHECKOUT_TABLE) from darts501.com
  - Impossible 3-dart visit validation (isValidVisitTotal/IMPOSSIBLE_3DART)
  - Turn rotation helpers (nextPlayerIndex/legStarterIndex)
  - Svelte 5 class-based MatchStore wrapping reducer with live suggestion getter
  - 126 unit tests covering ENG-01..07, INP-01..03, PROF-02

affects: [01-03, 01-04, phase-2-spectator, phase-3-persistence, phase-4-stats]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "start-of-visit remaining: remaining committed only at visit end, never per-dart, making bust revert trivial"
    - "UNDO as log replay: reduce(initialState(), ...log.slice(0,-1)) — single mental model for all undo depth"
    - "cfg() test helper: Record<string,any> cast lets test files use non-standard startScore values without type errors"
    - "MatchStore getters: plain class getters (not $derived) recompute on every read — sufficient for live D-10 suggestion"

key-files:
  created:
    - src/engine/types.ts
    - src/engine/board.ts
    - src/engine/board.test.ts
    - src/engine/bust.ts
    - src/engine/bust.test.ts
    - src/engine/checkout.ts
    - src/engine/checkout.test.ts
    - src/engine/impossible-scores.ts
    - src/engine/impossible-scores.test.ts
    - src/engine/rotation.ts
    - src/engine/rotation.test.ts
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
  modified: []

key-decisions:
  - "start-of-visit remaining: player.remaining stays at visit-start value during a visit; committed only when visit finalises (3 darts, bust, or leg win) — bust revert needs no special logic"
  - "UNDO is pure log replay: reduce(initialState(), ...log.slice(0,-1)) — no special undo state, correctly handles leg/set count revert (D-06 Pitfall 3)"
  - "checkout 180 entry: added T20 T20 T20 route for single-out suggestions; double-out guard (>170 returns null) prevents it appearing in double-out mode"
  - "MatchStore class getters (not $derived): plain getters in a class body recompute on each access which is sufficient for Svelte 5 reactivity without needing $derived at module level"
  - "cfg() test helper: uses Record<string,any> parameter to allow non-standard startScore integers in tests without type errors in svelte-check"

patterns-established:
  - "Engine isolation: src/engine/* has zero Svelte/DOM imports — pure TypeScript, testable in Node"
  - "Visit commit boundary: remaining is the start-of-visit value until visit finalises"
  - "Leg count from legsWon field on PlayerState (updated at leg win, reset by UNDO log replay)"

requirements-completed: [ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, INP-01, INP-02, INP-03, PROF-02]

# Metrics
duration: 12min
completed: 2026-06-10
---

# Phase 1 Plan 02: X01 Engine + MatchStore Summary

**Pure X01 reducer with append-only event-log undo, polar-math board classifier, full 170-entry checkout table, and Svelte 5 MatchStore — 126 unit tests all green**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-10T16:48:07Z
- **Completed:** 2026-06-10T17:00:14Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Complete X01 state machine: START_MATCH, DART_THROWN, NUMPAD_VISIT, UNDO — all bust conditions, leg/set counting, unlimited per-dart undo via event-log replay
- SVG dartboard polar-math classifier with D-01 enlarged ring radii (inner bull, outer bull, triple, double, miss zones), angleToSegment for all 20 segments
- Full 170-entry checkout table encoded from darts501.com; all 7 bogey numbers (159/162/163/165/166/168/169) return null; getSuggestion handles single-out vs double-out correctly
- Svelte 5 MatchStore class with live `suggestion` getter (recomputes after every dispatch, D-10), exposed for Plans 03 and 04

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Pure helpers tests** - `56cbe70` (test)
2. **Task 1 GREEN: Board, bust, checkout, impossible-scores, rotation** - `9d5d403` (feat)
3. **Task 2 RED: Reducer tests** - `8e198f9` (test)
4. **Task 2 GREEN: Pure reducer** - `74bdf4d` (feat)
5. **Task 3 RED: MatchStore tests** - `4ef29d7` (test)
6. **Task 3 GREEN: MatchStore + test type fix** - `ce0e073` (feat)

## Files Created/Modified

- `src/engine/types.ts` - MatchState, MatchConfig, MatchAction, DartScore, Visit, PlayerState, OutRule
- `src/engine/board.ts` - classifyHit (D-01 ring radii), angleToSegment, SEGMENT_ORDER, screenToBoard
- `src/engine/bust.ts` - isBust: 3 double-out conditions (overshot, ==1, ==0 non-double/non-bull)
- `src/engine/checkout.ts` - CHECKOUT_TABLE (170 entries), getSuggestion (bogey/>170 → null)
- `src/engine/impossible-scores.ts` - IMPOSSIBLE_3DART set, isValidVisitTotal
- `src/engine/rotation.ts` - nextPlayerIndex, legStarterIndex (L % n)
- `src/engine/reducer.ts` - reduce/initialState; start-of-visit remaining; UNDO = log replay
- `src/stores/match.svelte.ts` - MatchStore class with $state, dispatch, activePlayer, remaining, suggestion, isMatchComplete
- All matching `.test.ts` files (79 helper tests + 35 reducer tests + 11 store tests = 125; plus 1 pre-existing = 126 total)

## Decisions Made

- **Start-of-visit remaining:** `player.remaining` is not decremented per dart — only committed when the full visit finalises. This makes bust revert trivial: the remaining is already correct without special undo logic.
- **UNDO as pure log replay:** `reduce(initialState(), ...log.slice(0,-1))` is the single model for all undo depth. Correctly reverts leg wins and set counts without any special-case code (D-06 Pitfall 3).
- **Checkout table includes 180:** Added `180: ['T20', 'T20', 'T20']` entry for single-out mode. The `>170` guard in `getSuggestion` ensures it never surfaces in double-out.
- **MatchStore uses plain class getters:** Not `$derived` — plain getters recompute on each property access, which is sufficient for Svelte 5's fine-grained reactivity.
- **cfg() test helper:** Uses `Record<string,any>` parameter type to allow test-only startScore values (32, 40) without failing svelte-check's strict literal type check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Apostrophe in board.test.ts string literal broke the parser**
- **Found during:** Task 1 GREEN phase (vitest transform error)
- **Issue:** `it('0° (right / 3 o'clock) ...` — apostrophe inside single-quoted string terminated the string literal
- **Fix:** Renamed test description to `'0 degrees (right / 3 oclock) → segment 6'`
- **Files modified:** src/engine/board.test.ts
- **Verification:** Parse error resolved; board tests run
- **Committed in:** 56cbe70

**2. [Rule 1 - Bug] bust.test.ts: incorrect remaining for inner bull test**
- **Found during:** Task 1 GREEN phase
- **Issue:** Test called `isBust(50, d(2, 50), 'double')` — `d(2,50)` scores 100pts not 50, leaving -50 (a bust), but test expected `false`
- **Fix:** Changed to `isBust(100, d(2, 50), 'double')` — remaining=100, dart scores 100, newRemaining=0, segment=50 → valid inner bull finish
- **Files modified:** src/engine/bust.test.ts
- **Verification:** Bust tests all pass
- **Committed in:** 56cbe70

**3. [Rule 1 - Bug] checkout.test.ts: single-out 180 returned null**
- **Found during:** Task 1 GREEN phase
- **Issue:** Test expected `getSuggestion(180, 'single')` to return a route, but 180 was not in CHECKOUT_TABLE
- **Fix:** Added `180: ['T20', 'T20', 'T20']` to the table. The `> 170` guard in double-out mode prevents it appearing there.
- **Files modified:** src/engine/checkout.ts
- **Verification:** Checkout tests all pass
- **Committed in:** 9d5d403

**4. [Rule 1 - Bug] reducer.ts: remaining decremented per-dart caused wrong bust revert**
- **Found during:** Task 2 GREEN phase — 2 tests failed
- **Issue:** First implementation decremented `player.remaining` after each dart; on bust, the remaining was already reduced by earlier darts in the visit, not the start-of-visit value
- **Fix:** Redesigned to keep `player.remaining` at start-of-visit value throughout the visit; only commit at visit end (3 darts complete) or leg win. Bust revert needs no special logic.
- **Files modified:** src/engine/reducer.ts
- **Verification:** All 35 reducer tests pass; bust revert tests confirmed
- **Committed in:** 74bdf4d

**5. [Rule 1 - Bug] reducer.test.ts: startScore literal type rejected test values**
- **Found during:** Task 3 — svelte-check reported 7 errors
- **Issue:** `MatchConfig.startScore` is typed `301 | 401 | 501`; tests used values like 32, 40 for brevity; svelte-check's strict checker rejected them even with `as MatchConfig`
- **Fix:** Added `cfg()` test helper with `Record<string,any>` parameter type + `as MatchConfig` return cast, replacing all inline spread configs in tests
- **Files modified:** src/engine/reducer.test.ts
- **Verification:** svelte-check 0 errors; all tests still pass
- **Committed in:** ce0e073

---

**Total deviations:** 5 auto-fixed (5 bugs)
**Impact on plan:** All fixes were correctness issues caught in the RED/GREEN TDD cycle. No scope creep. The key architectural insight (start-of-visit remaining) emerged naturally from the failing bust tests.

## Issues Encountered

None beyond the deviations documented above — all resolved within the TDD cycle.

## Known Stubs

None. All engine modules are fully implemented with real logic:
- checkout.ts: full 170-entry table (not a stub — all scores 2–170 covered plus 180 single-out)
- reducer.ts: fully functional state machine

`src/stores/skeleton.svelte.ts` from Plan 01 is still present — Plan 03 removes it when replacing the placeholder match route.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Engine fully tested and ready: all 11 requirements (ENG-01..07, INP-01..03, PROF-02) have passing unit tests
- `matchStore` is the single reactive store Plans 03 and 04 import — dispatch/suggestion/undo behavior verified
- `src/engine/types.ts` exports are stable — Plans 03/04 and Phase 3 can import without risk
- Ready for Plan 01-03 (SVG dartboard component + scoring view layout)

## Self-Check: PASSED

- All 15 engine/store files exist on disk
- All 6 task commits (56cbe70, 9d5d403, 8e198f9, 74bdf4d, 4ef29d7, ce0e073) present in git log
- `npx vitest run --project=unit`: 126/126 passed
- `npx svelte-check --threshold error`: 0 errors, 0 warnings

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-10*
