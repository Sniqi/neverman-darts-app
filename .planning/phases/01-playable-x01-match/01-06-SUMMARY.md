---
phase: 01-playable-x01-match
plan: "06"
subsystem: ui
tags: [svelte, svg, dartboard, viewBox, hit-detection, vitest, browser-test]

requires:
  - phase: 01-playable-x01-match plan 03
    provides: SVG dartboard with polar-math hit detection and screenToBoard/classifyHit

provides:
  - Full dartboard SVG visible with double ring, outer single, miss zone, and labels inside viewBox
  - Browser tests using corrected screen→SVG scale for viewBox="-190 -190 780 780"

affects:
  - Any future plan touching Dartboard.svelte viewBox or test coordinate mapping
  - E2E tests that may tap SVG segments (note: current E2E uses numpad, not SVG taps)

tech-stack:
  added: []
  patterns:
    - "SVG viewBox centred on board geometry: board centre (200,200) is exact centre of viewBox span; polar hit-detection in board.ts needs no changes when only the visible window expands"
    - "Browser test screen-pixel mapping: scale = rect.width / viewBoxWidth; screen offset = scale * svgRadius"

key-files:
  created: []
  modified:
    - src/ui/input/Dartboard.svelte
    - src/ui/input/Dartboard.test.ts

key-decisions:
  - "viewBox='-190 -190 780 780': board centre (200,200) is exact geometric centre of this span (200 - (-190) = 390 = R_MISS_OUTER); zero-margin fit for the miss zone ring"
  - "screenToBoard and classifyHit in board.ts unchanged: they key off the board's user-space coordinates (200,200 centre, absolute radii) which are unaffected by the viewBox window"

patterns-established:
  - "SVG viewBox can be expanded without touching polar math as long as board centre user-space coordinates are preserved"

requirements-completed: [INP-01]

duration: 2min
completed: "2026-06-10"
---

# Phase 01 Plan 06: Dartboard ViewBox Fix (CR-01) Summary

**SVG viewBox expanded from "0 0 400 400" to "-190 -190 780 780" so the double ring, outer single, miss zone, and labels are fully visible and finger-hittable; polar hit-detection unchanged**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-10T21:23:10Z
- **Completed:** 2026-06-10T21:25:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed CR-01: the entire dartboard is now inside the SVG viewBox — double ring (r=303-325), outer single ring (r=209-303), miss zone (r=325-390), and segment labels (r=345) are all rendered and tappable
- Board centre remains at user-space (200,200); `screenToBoard` and `classifyHit` in `board.ts` are completely unchanged
- Browser tests updated to use `rect.width / 780` scale instead of `rect.width / 400`; all 3 tests pass

## Task Commits

1. **Task 1: Expand the dartboard viewBox to contain the full board (CR-01)** - `b5842d2` (fix)
2. **Task 2: Update the Dartboard browser test screen→SVG mapping for the new viewBox** - `ec183fb` (test)

## Files Created/Modified

- `src/ui/input/Dartboard.svelte` - Changed viewBox from "0 0 400 400" to "-190 -190 780 780" (single attribute change)
- `src/ui/input/Dartboard.test.ts` - Updated `scale = rect.width / 780` in miss-zone and triple-20 tests; updated comments to reference new viewBox

## Decisions Made

- `viewBox="-190 -190 780 780"` precisely fits the full board: the viewBox spans x∈[-190, 590] and y∈[-190, 590]; the board centre (200,200) is the exact geometric midpoint (200 - (-190) = 390 = R_MISS_OUTER). Zero-margin fit for the outermost miss zone ring.
- `board.ts` left entirely unchanged: `screenToBoard` subtracts the hardcoded centre (200,200) and `classifyHit` keys off absolute radii — both remain correct because the board geometry in user-space did not move, only the visible window expanded.

## Deviations from Plan

None - plan executed exactly as written.

Note: `npx svelte-check --threshold error` reported one pre-existing type error in `src/db/profiles.ts:24` (unrelated to this plan's files). That error predates this plan and is out of scope per deviation rules. Dartboard.svelte itself has no errors.

## Issues Encountered

Pre-existing `svelte-check` error in `src/db/profiles.ts`: `Type 'number | undefined' is not assignable to type 'number'` (Dexie `add()` return type vs `id?: number` optional field). Not introduced by this plan; logged here for visibility but not fixed (out of scope).

## Known Stubs

None.

## Threat Flags

None — this plan changes one SVG presentation attribute and one test constant. No new input surfaces, network endpoints, auth paths, or data flows introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-01 is closed: the double ring is fully visible and finger-hittable, making Double-Out leg completion possible via touch
- The E2E test still drives the match via numpad (not SVG taps) — plan 04 decision; this is intentional and unaffected
- Human verification (01-VERIFICATION.md human_verification[0]): on a tablet or Chrome touch emulation, the double ring of segment 20 should be visible and tapping it should record D20

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-10*
