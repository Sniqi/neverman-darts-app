---
phase: 01-playable-x01-match
plan: 11
subsystem: ui
tags: [svelte, correction-window, timer, untrack, vitest, browser-test]

requires:
  - phase: 01-playable-x01-match
    provides: "CorrectionWindow component (01-07), inner-bull encoding { multiplier: 2, segment: 25 } (01-10)"

provides:
  - "CorrectionWindow auto-dismisses once after 2.5s (untrack fix for CR-04 timer livelock)"
  - "CorrectionWindow always escapable while paused via 'Fertig' button or outside-click (CR-03 fix)"
  - "formatDart renders inner bull correctly per 01-10 encoding"
  - "Real-timer browser test proving single CONFIRM_VISIT dispatch (replaces false-green IN-08 fake-timer test)"

affects: [spectator-view, match-routing, visit-progression]

tech-stack:
  added: []
  patterns:
    - "untrack(() => fn()) to prevent $state reads inside a called function from becoming $effect dependencies"
    - "Scope vi.useFakeTimers() per-test to avoid contaminating real-timer tests in the same file"
    - "vi.waitFor() polling for Svelte DOM reactivity updates in browser-mode tests"

key-files:
  created: []
  modified:
    - src/ui/input/CorrectionWindow.svelte
    - src/ui/input/CorrectionWindow.test.ts

key-decisions:
  - "untrack(() => startTimer()) chosen over extracting elapsed reads — minimal surgical change, keeps tick/startTimer structure intact"
  - "Fertig button added to paused branch rather than moving undo button — avoids layout change in +page.svelte"
  - "handleOutsideClick made unconditional (no paused guard) — outside-click is always a dismiss signal per UI spec"
  - "Real-timer auto-dismiss test uses vi.waitFor with 3s timeout rather than sleep — polls immediately without blocking full 2.7s when fast"

patterns-established:
  - "Real-timer browser tests: use vi.waitFor() to assert async side-effects; scope fake timers inside the tests that need them"

requirements-completed: [INP-04]

duration: 3min
completed: 2026-06-10
---

# Phase 1 Plan 11: CorrectionWindow Timer and Paused-Escape Repair Summary

**Fixed Svelte $effect timer livelock (CR-04) with `untrack(() => startTimer())` and added in-window 'Fertig' dismiss control for the paused state (CR-03), making the correction window reliably auto-dismiss once and always escapable**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-10T23:54:19Z
- **Completed:** 2026-06-10T23:57:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed CR-04: `$effect` called `startTimer()` which read `$state` variable `elapsed`, registering it as a tracked dependency. Svelte re-ran the effect on every rAF tick (~60fps), cancelling the pending 2500ms `setTimeout` before it could fire. Fix: `untrack(() => startTimer())` so `elapsed` is not a dependency; the effect runs once per `visible` transition only.
- Fixed CR-03: pressing 'Korrigieren' rendered only a hint overlay that covered the undo button, with no escape path. Fix: added a 'Fertig' button in the paused `{:else}` branch that calls `confirm()`, and removed the `if (!paused)` guard from `handleOutsideClick` so outside-click always dismisses.
- Updated `formatDart` to align with plan 01-10 inner-bull encoding: `{ multiplier: 2, segment: 25 }` → 'Bull', `{ multiplier: 1, segment: 25 }` → 'Outer Bull'; removed the stale `segment === 50` branch.
- Replaced the false-green fake-timer auto-dismiss test (IN-08) with a real-timer test using `vi.waitFor` that asserts `CONFIRM_VISIT` fires exactly once after >2500ms, proving the timer is not restarted every frame.
- Added two new tests: 'Fertig' button while paused dispatches `CONFIRM_VISIT`; outside-click while paused dispatches `CONFIRM_VISIT`.

## Task Commits

1. **Task 1: Fix auto-dismiss timer (untrack) and paused escape path** - `4f3ddf4` (fix)
2. **Task 2: Replace false-green timer test and add paused-escape tests** - `120a168` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/ui/input/CorrectionWindow.svelte` - `untrack` import; `$effect` wraps `startTimer()` in `untrack()`; `handleOutsideClick` unconditional; 'Fertig' button in paused branch; `formatDart` updated for 01-10 inner-bull encoding; `.fertig-btn` CSS added
- `src/ui/input/CorrectionWindow.test.ts` - Real-timer auto-dismiss test (6 total tests, all passing); scoped fake timers; new Fertig and outside-click paused-escape tests

## Decisions Made

- Used `untrack(() => startTimer())` rather than restructuring `startTimer` to not read `elapsed` — minimal change, preserves resume-from-pause logic where `elapsed` is read to offset the timer start.
- Added 'Fertig' button inside the existing `{:else}` branch rather than moving the undo button or changing `.panel-relative` layout — no layout changes needed in `+page.svelte`.
- `handleOutsideClick` made unconditional — the UI spec says "tapping outside passes the turn"; the paused guard was a bug, not a feature.
- Real-timer test uses `vi.waitFor` with 3000ms timeout — polls as soon as the dispatch fires rather than sleeping the full 2.7s.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.waitFor needed for Svelte DOM reactivity after `.click()` in browser tests**
- **Found during:** Task 2 (first test run)
- **Issue:** After `korrigierenBtn.click()`, querying `.fertig-btn` immediately returned `null` — Svelte's DOM update is async in browser mode.
- **Fix:** Added `await vi.waitFor(() => { fertigBtn = container.querySelector('.fertig-btn'); expect(fertigBtn).toBeTruthy(); }, { timeout: 500 })` before asserting on the Fertig button. Applied same pattern to the outside-click test.
- **Files modified:** `src/ui/input/CorrectionWindow.test.ts`
- **Verification:** All 6 tests pass.
- **Committed in:** `120a168`

---

**Total deviations:** 1 auto-fixed (1 bug — async DOM update in browser test)
**Impact on plan:** Test-only fix; no behavior change. Both escape-path tests now reliably pass.

## Issues Encountered

None — plan executed with one minor test-infrastructure deviation handled automatically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CorrectionWindow is now fully functional: auto-dismisses once, always escapable, inner-bull labels correct.
- Visit progression (turn passing after correction window) unblocked — INP-04 resolved.
- Ready for plan 01-12 (final plan in phase 01).

---
*Phase: 01-playable-x01-match*
*Completed: 2026-06-10*

## Self-Check

- [x] `src/ui/input/CorrectionWindow.svelte` exists on disk
- [x] `src/ui/input/CorrectionWindow.test.ts` exists on disk
- [x] Commit `4f3ddf4` exists (`git log --oneline` confirmed)
- [x] Commit `120a168` exists (`git log --oneline` confirmed)
- [x] `npx vitest run src/ui/input/CorrectionWindow.test.ts` — 6 passed, 0 failed

## Self-Check: PASSED
