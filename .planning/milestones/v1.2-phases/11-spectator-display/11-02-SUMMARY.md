---
phase: 11-spectator-display
plan: 02
subsystem: ui
tags: [svelte, css, spectator-display, design-tokens, chrome-90]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: design tokens (--font-score, --accent, --surface-2, --surface, --shadow-panel) and the project-wide Chrome-90 precomputed-static rule for color-mix()
provides:
  - MatchHeader.svelte restyled to match design/components/display/MatchHeader.jsx typography, spacing, weight, and bloom values exactly
affects: [11-03 PlayerPanel restyle (sibling plan, no shared code), phase-level spectator display UAT]

# Tech tracking
tech-stack:
  added: []
  patterns: [precomputed static rgba for Chrome-90-unsupported color-mix() expressions, same convention as match/+page.svelte dart-pill]

key-files:
  created: []
  modified: [src/ui/display/MatchHeader.svelte]

key-decisions:
  - "MatchHeader's background gradient intentionally left unchanged (nearest-token mapping to var(--surface-2)/var(--surface) stays acceptable) rather than swapped to the DS's literal hex — distinct from PlayerPanel's locked-literal background requirement in the separate Plan 11-03"
  - "Bloom's color-mix(in oklab, var(--accent) 28%, transparent) precomputed to static rgba(240, 164, 36, 0.28) per the project-wide Chrome-90 Cast-receiver rule"

patterns-established: []

requirements-completed: [DISP-02]

coverage:
  - id: D1
    description: "MatchHeader typography (font-family, font-size clamp, base/mode/leg weights, dot size/position) matches design/components/display/MatchHeader.jsx exactly"
    requirement: "DISP-02"
    verification:
      - kind: unit
        ref: "npm test (563 tests, 39 files) — full suite green, confirms zero regression from CSS-only value swap"
        status: pass
      - kind: e2e
        ref: "npx playwright test (12 tests, includes e2e/spectator-sync.spec.ts DISP-05 display sync specs that render MatchHeader)"
        status: pass
    human_judgment: true
    rationale: "Visual typography/spacing correctness on the 27-inch/3m spectator display cannot be confirmed by automated tests alone (no dedicated MatchHeader test file exists, by design per RESEARCH.md) — final confirmation via phase-level manual on-device UAT."
  - id: D2
    description: "Bloom renders at DS's 28%-intensity amber as a Chrome-90-safe precomputed static rgba, zero live color-mix() in the file"
    requirement: "DISP-02"
    verification:
      - kind: other
        ref: "grep -rn \"color-mix(\" src/ui/display/MatchHeader.svelte"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-07-14
status: complete
---

# Phase 11 Plan 02: MatchHeader Restyle Summary

**CSS-only value swap bringing MatchHeader.svelte's typography, spacing, and bloom to the design system's literal values, with the DS's live color-mix() bloom precomputed to a static rgba for Chrome-90 Cast-receiver safety**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-14T06:08:47+02:00
- **Completed:** 2026-07-14T06:11:29Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- `.match-header` now uses `font-family: var(--font-score)` (was silently inheriting `--font-ui`), the DS's literal `font-size` clamp, `font-weight: 600`, and DS spacing/gap clamps
- `.mh-mode` weight 600→700, `.mh-leg` weight 700→800, `.mh-dot` size/position adjusted to DS values
- Amber bloom under the header rule precomputed from `--accent-soft` (13% intensity) to a static `rgba(240, 164, 36, 0.28)` (28% intensity), matching the DS's `color-mix()` expression without any live color-mixing (Chrome 90 / Cast receiver has no support)
- Background gradient confirmed intentionally unchanged (nearest-token mapping stays acceptable per UI-SPEC, distinct from PlayerPanel's Plan 11-03 requirement)

## Task Commits

Each task was committed atomically:

1. **Task 1: Typography, spacing, and weight fixes on .match-header and its segments** - `0b4a0ea` (feat)
2. **Task 2: Precompute the bloom's color-mix to a static rgba (Chrome-90 safety) and bump its height** - `89aff41` (feat)

**Plan metadata:** committed separately below (docs: complete plan)

## Files Created/Modified
- `src/ui/display/MatchHeader.svelte` - Typography/spacing/weight values corrected to DS literals; bloom background precomputed to static rgba, height bumped 14px→16px

## Decisions Made
- MatchHeader's background gradient left unchanged (nearest-token mapping to `--surface-2`/`--surface` remains acceptable) — this plan does not conflate it with PlayerPanel's locked-literal background requirement in the separate Plan 11-03
- Bloom's `color-mix(in oklab, var(--accent) 28%, transparent)` precomputed to static `rgba(240, 164, 36, 0.28)`, following the same convention already established in `match/+page.svelte`'s dart-pill rule

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- MatchHeader restyle complete; ready for Plan 11-03 (PlayerPanel restyle) and phase-level manual on-device UAT
- No blockers

---
*Phase: 11-spectator-display*
*Completed: 2026-07-14*

## Self-Check: PASSED
