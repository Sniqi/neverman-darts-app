---
phase: 09-core-components
plan: 07
subsystem: ui
tags: [svelte, playwright, design-system, switch, accessibility]

# Dependency graph
requires:
  - phase: 09-core-components (Plan 01)
    provides: shared .switch/.thumb CSS in src/styles/components.css
provides:
  - "/match's Caller and Musik audio toggles use the DS 56x34 custom switch"
  - "e2e/match-audio-toggle.spec.ts — E2E coverage for the two switches (previously zero)"
affects: [phase-10-audio-auto-pause-ui, future-match-page-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "button[role=switch].switch > span.thumb markup reused identically from MatchSetup.svelte for all app switches"

key-files:
  created:
    - e2e/match-audio-toggle.spec.ts
  modified:
    - src/routes/match/+page.svelte

key-decisions:
  - ".audio-row height raised 36px -> var(--hit-min) (48px), not var(--row-h) (64px), per 09-CONTEXT.md Q2 resolution"

patterns-established: []

requirements-completed: [COMP-02]

coverage:
  - id: D1
    description: "/match Caller and Musik toggle rows use the DS 56x34 custom switch instead of the native checkbox, with row height raised to 48px (not 64px)"
    requirement: "COMP-02"
    verification:
      - kind: e2e
        ref: "e2e/match-audio-toggle.spec.ts#match audio toggles: Caller and Musik switches flip aria-checked on click"
        status: pass
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts (full suite regression, unaffected)"
        status: pass
    human_judgment: false
  - id: D2
    description: "No other /match UI (undo/board/numpad/dart-pill) was touched by this change"
    verification:
      - kind: other
        ref: "git diff --stat -- e2e/full-match-flow.spec.ts (zero changes) and grep -c audio-check (0 matches remain)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-14
status: complete
---

# Phase 09 Plan 07: Match audio toggle switch swap Summary

**Swapped /match's Caller and Musik native checkbox toggles to the shared DS 56x34 button/switch markup, raised the compact audio row to the 48px hit-min (not the full 64px DS row), and closed a previously zero-coverage E2E gap with a new isolated Playwright spec.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-14T00:00:00Z
- **Completed:** 2026-07-14T00:06:28Z
- **Tasks:** 2
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments
- `#match-caller-toggle` and `#match-sfx-toggle` now render as `<button role="switch" class="switch">` with a `.thumb` span, matching MatchSetup.svelte's existing switch pattern exactly (same 56x34 visual contract from components.css)
- `.audio-row` height raised from `36px` to `var(--hit-min)` (48px) per CONTEXT.md Q2's binding resolution — deliberately NOT the full 64px DS list-row height
- Dead `.audio-check` CSS rule removed (no `<input>` with that class remains)
- New `e2e/match-audio-toggle.spec.ts` closes the RESEARCH.md-flagged coverage gap: asserts both switches expose `role=switch` with correct accessible name and flip `aria-checked` on click

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap /match audio toggles to the custom switch + bump row hit-target** - `5452233` (feat)
2. **Task 2: New E2E test closing the audio-toggle coverage gap** - `6dab9a0` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/routes/match/+page.svelte` - Caller/Musik toggles swapped from `<input type=checkbox role=switch>` to `<button role=switch class=switch>`; `.audio-row` height 36px→48px; `.audio-check` CSS rule removed
- `e2e/match-audio-toggle.spec.ts` - new isolated Playwright spec covering the two switches (setup→bulloff→match, then toggle assertions)

## Decisions Made
- `.audio-row` height set to `var(--hit-min)` (48px), not `var(--row-h)` (64px) — CONTEXT.md Q2 explicitly says not to force the full DS list-row height onto this compact scoring toolbar row.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Verification (`npx playwright test`, full 9-test suite) passed on first run; `full-match-flow.spec.ts` diff confirmed zero changes from this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- This closes the last COMP-02 surface outside MatchSetup.svelte — Phase 09's switch-component rollout is now complete across the app.
- No blockers for Phase 10 (audio/auto-pause UI); the `/match` audio bar's markup and behavior (audio plays from `/match` only) are unchanged, only the visual toggle element changed.

---
*Phase: 09-core-components*
*Completed: 2026-07-14*

## Self-Check: PASSED
- FOUND: e2e/match-audio-toggle.spec.ts
- FOUND: .planning/phases/09-core-components/09-07-SUMMARY.md
- FOUND commit: 5452233
- FOUND commit: 6dab9a0
