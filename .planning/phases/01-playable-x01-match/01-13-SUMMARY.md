---
phase: 01-playable-x01-match
plan: 13
subsystem: ui
tags: [svelte, svelte5, x01, numpad, dartboard, flash, match-win, dialog-suppression]

requires:
  - phase: 01-playable-x01-match plan 07
    provides: match-win dialog suppression decision (locked 01-07); MatchWinOverlay z-index 100 vs DartsAtDoubleDialog z-index 20
  - phase: 01-playable-x01-match plan 10
    provides: classifyHit encoding fix — inner bull returns {multiplier:2, segment:25}, never segment:50
  - phase: 01-playable-x01-match plan 12
    provides: handleNumpadVisit refactor that introduced the match-win suppression regression

provides:
  - handleNumpadVisit uses side-effect-free trial reduce to detect match-complete before deciding to show the darts-at-double dialog
  - match-winning numpad finish dispatches immediately with dartsAtDouble:0; MatchWinOverlay owns the screen unobstructed
  - continuing-leg numpad finish still defers to the darts-at-double dialog (INP-03 / D-08 preserved)
  - Dartboard.svelte flash logic distinguishes inner bull (multiplier===2 && segment===25) from outer bull (multiplier===1 && segment===25)
  - dead segment===50 flash branch removed

affects: [01-playable-x01-match verification, Phase 4 stats dashboard (darts-at-double on match-win recorded as 0)]

tech-stack:
  added: []
  patterns:
    - "Trial reduce pattern: import pure reduce() and compute prospective state before deciding on side effects — safe because reducer never mutates its input"

key-files:
  created: []
  modified:
    - src/routes/match/+page.svelte
    - src/ui/input/Dartboard.svelte

key-decisions:
  - "Trial reduce for match-win detection: import reduce from engine/reducer.js, compute prospective = reduce(matchStore.state, NUMPAD_VISIT), check prospective.phase === 'match-complete' — read-only, no mutation, no side effects"
  - "dartsAtDouble:0 on match-winning dispatch: locked 01-07 decision preserved — win overlay owns screen, dialog cannot be reached, Phase 1 has no stats consumer for this value"
  - "Flash key keyed on multiplier not segment: multiplier===2 && segment===25 → inner-bull; multiplier===1 && segment===25 → outer-bull; segment===50 branch was dead code since 01-10"

patterns-established:
  - "Trial reduce: compute a prospective next state from a pure reducer to make UI branching decisions without committing to the dispatch — safe because reduce() is side-effect-free"

requirements-completed: [INP-03, FLOW-01, INP-01]

duration: 6min
completed: 2026-06-11
---

# Phase 01 Plan 13: Gap Closure (Match-Win Dialog + Inner-Bull Flash) Summary

**Restored match-win dialog suppression via trial reduce in handleNumpadVisit and fixed inner-bull flash to key off multiplier instead of the dead segment===50 branch**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-11T11:42:00Z
- **Completed:** 2026-06-11T11:48:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Match-winning numpad finish now shows MatchWinOverlay directly — no darts-at-double dialog blocking it; the E2E happy-path spec (`full-match-flow.spec.ts`) passes in 1.4s
- Continuing-leg numpad finish still defers to the darts-at-double dialog (INP-03 / D-08 unchanged)
- Inner-bull taps now flash the amber center circle, not the outer-bull ring; scoring unchanged at 50 pts
- Dead `segment === 50` flash branch removed (classifyHit has not returned segment 50 since plan 01-10)

## Task Commits

1. **Task 1: Suppress darts-at-double dialog for match-winning numpad visits** - `914d39f` (fix)
2. **Task 2: Flash inner-bull region on inner-bull taps** - `1d8fa46` (fix)

## Files Created/Modified

- `src/routes/match/+page.svelte` — added `import { reduce }` from reducer; handleNumpadVisit now runs a trial reduce for finishing visits and dispatches immediately on match-complete
- `src/ui/input/Dartboard.svelte` — flash branch now uses `multiplier===2 && segment===25` for inner-bull and `multiplier===1 && segment===25` for outer-bull; dead `segment===50` branch removed

## Decisions Made

- **Trial reduce for match-win detection:** rather than duplicating phase-transition logic in the UI, import the pure `reduce()` from the engine and compute a prospective state — read-only, never mutates `matchStore.state`, discarded after the branch decision.
- **dartsAtDouble:0 on match-win dispatch:** per the locked 01-07 decision; MatchWinOverlay (z-100) owns the screen on match-complete and the DartsAtDoubleDialog (z-20) would be unreachable. Phase 1 has no stats consumer for the final-visit darts-at-double value; D-08 scopes the prompt to legs that continue play.

## Deviations from Plan

None — plan executed exactly as written. The E2E spec comment at lines 96-97 was already accurate (it described the suppression correctly); no change was needed there.

## Issues Encountered

None. All four verification checks passed on the first attempt:
- `npx playwright test e2e/full-match-flow.spec.ts` — 1 passed (1.4s)
- `npx vitest run` — 162 passed
- `npx svelte-check --threshold error` — 0 new errors (pre-existing `src/db/profiles.ts` error out of scope, noted in 01-07-SUMMARY)
- `npx vite build` — built in 2.35s

## User Setup Required

None — no external service configuration required.

## Known Stubs

None — both edits are pure logic fixes with no placeholder values or incomplete data paths.

## Threat Flags

None — no new attack surface introduced. Both edits are pure client-side UI logic over the existing validated reducer path (trial reduce is read-only; flash key is purely presentational).

## Next Phase Readiness

Phase 01 gap closure complete: all 5 must-have truths from 01-VERIFICATION.md are now satisfied. The phase is ready for final verification sign-off and Phase 02 planning.

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-11*
