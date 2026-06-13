---
phase: 01-playable-x01-match
plan: 10
subsystem: engine
tags: [svelte, typescript, vitest, x01, scoring, bull, bust]

# Dependency graph
requires:
  - phase: 01-playable-x01-match
    provides: board.ts classifyHit, bust.ts isBust, VisitStrip formatDart
provides:
  - Correct inner-bull encoding { multiplier:2, segment:25 } = 50 pts
  - Valid double-out finish on Bull from remaining=50
  - All checkout routes ending in Bull (170, 167, 164, 161, 50) produce no bust
affects: [01-playable-x01-match, checkout suggestions, spectator display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inner bull encoded as double of 25: { multiplier: 2, segment: 25 } so multiplier*segment=50 at every scoring site"
    - "Double-out finish validation: multiplier===2 only (no separate segment===50 branch needed)"

key-files:
  created: []
  modified:
    - src/engine/board.ts
    - src/engine/bust.ts
    - src/engine/types.ts
    - src/engine/board.test.ts
    - src/engine/bust.test.ts
    - src/ui/input/VisitStrip.svelte

key-decisions:
  - "Inner bull canonical encoding changed to { multiplier:2, segment:25 } so multiplier*segment=50 matches every scoring site without special-casing"
  - "isBust double-out finish: removed isInnerBull/segment===50 branch; multiplier===2 is sufficient and now covers both regular doubles and the inner bull"
  - "VisitStrip formatDart: checks multiplier+segment pair to distinguish inner bull (m=2,s=25) from outer bull (m=1,s=25) before generic D-prefix branch"

patterns-established:
  - "Bull scoring pattern: inner bull is double-25 (multiplier:2, segment:25); outer bull is single-25 (multiplier:1, segment:25)"

requirements-completed: [ENG-04, ENG-07]

# Metrics
duration: 8min
completed: 2026-06-11
---

# Phase 01 Plan 10: Inner Bull Encoding Fix Summary

**Fixed inner-bull domain bug CR-01: canonical encoding changed to { multiplier:2, segment:25 } so bull taps score 50 pts, bull finishes from remaining=50 are valid double-out wins, and checkout routes 170/167/164/161/50 no longer bust.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-11T01:47:00Z
- **Completed:** 2026-06-11T01:55:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Corrected classifyHit inner-bull return from `{ multiplier:2, segment:50 }` to `{ multiplier:2, segment:25 }` — 2×25=50 points at every scoring site
- Simplified isBust double-out finish check to `multiplier===2` only; removed the now-redundant `isInnerBull`/`segment===50` branch
- Updated board.test.ts and bust.test.ts to assert the correct 50-point rule; removed the 100-point bug assertion
- Updated VisitStrip formatDart to label `{ multiplier:2, segment:25 }` as 'Bull' (before the generic D-prefix branch) and `{ multiplier:1, segment:25 }` as 'Outer Bull'
- All 124 engine tests green; svelte-check 0 errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-encode inner bull in board.ts and remove dead bust.ts branch** - `41cd4f2` (fix)
2. **Task 2: Update board.test.ts, bust.test.ts, and VisitStrip label** - `aa08529` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/engine/board.ts` — classifyHit inner-bull return changed to `{ multiplier:2, segment:25 }`; ring-boundary comment updated
- `src/engine/bust.ts` — isBust double-out finish simplified to `multiplier===2`; `isInnerBull` and `segment===50` branch removed
- `src/engine/types.ts` — DartScore.segment comment updated to describe new canonical inner-bull encoding
- `src/engine/board.test.ts` — inner-bull assertions updated to `{ multiplier:2, segment:25 }`; test description updated
- `src/engine/bust.test.ts` — removed 100-point bug test; added correct `isBust(50, d(2,25),'double')` test; updated description
- `src/ui/input/VisitStrip.svelte` — formatDart uses multiplier+segment pair to label Bull/Outer Bull correctly; removed dead `segment===50` branch

## Decisions Made
- Used `{ multiplier:2, segment:25 }` (double-of-25) encoding so `multiplier * segment = 50` at every site without special-casing. The `multiplier===2` finish check in bust.ts already treats this as a valid double finish — no new conditional needed.
- Removed the `segment===50` branch entirely rather than patching it: a single canonical finish rule (`multiplier===2`) is simpler and eliminates the class of dual-branch bugs that caused CR-01.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Inner-bull scoring is now correct: 50 pts, valid double-out finish, all Bull checkout routes work
- Ready for plan 11 (if any) or phase verification
- CR-01 resolved; ENG-04 and ENG-07 confirmed working on Bull finishes

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-11*

## Self-Check: PASSED

- `src/engine/board.ts` exists: FOUND
- `src/engine/bust.ts` exists: FOUND
- `src/engine/board.test.ts` exists: FOUND
- `src/engine/bust.test.ts` exists: FOUND
- `src/ui/input/VisitStrip.svelte` exists: FOUND
- Commit 41cd4f2 exists: FOUND
- Commit aa08529 exists: FOUND
- `npx vitest run src/engine` — 124 tests passed
- `npx svelte-check` — 0 errors
