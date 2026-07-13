---
phase: 09-core-components
plan: 04
subsystem: ui
tags: [svelte, css-tokens, design-system, stats]

# Dependency graph
requires: []
provides:
  - "StatCard.svelte restyled to DS spec (radius-16, 16/24 padding, 40px/700 value with -0.02em tracking, 17px/500 label)"
  - "Wave-0 browser test proving StatCard's computed container/value/label styles"
affects: [ui, stats, ProfileStatDashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Style-only DS restyle: swap literal px/weight values for CSS custom properties (--text-3xl, --radius-md, --space-md/--space-lg, --tracking-tight) without touching props/markup"

key-files:
  created:
    - src/ui/stats/StatCard.test.ts
  modified:
    - src/ui/stats/StatCard.svelte

key-decisions:
  - "Updated the stale doc comment in StatCard.svelte (old 20px/600 / 14px/400 values) to match the new DS typography, since it directly documents the code changed in this same task"

patterns-established: []

requirements-completed: [COMP-04]

coverage:
  - id: D1
    description: "StatCard container uses radius-16 and asymmetric 16px/24px padding matching the DS StatCard.jsx spec"
    requirement: "COMP-04"
    verification:
      - kind: unit
        ref: "src/ui/stats/StatCard.test.ts#.stat-card computed border-radius is 16px"
        status: pass
    human_judgment: false
  - id: D2
    description: "StatCard value renders at 40px/700 (var(--text-3xl)) with -0.02em letter-spacing and tabular-nums, above a 17px/500 muted label"
    requirement: "COMP-04"
    verification:
      - kind: unit
        ref: "src/ui/stats/StatCard.test.ts#.stat-value computed font-size is 40px and font-weight is 700"
        status: pass
      - kind: unit
        ref: "src/ui/stats/StatCard.test.ts#.stat-label computed font-size is 17px and font-weight is 500"
        status: pass
    human_judgment: false
  - id: D3
    description: "StatCard's label/value props stay unchanged — every existing call site (ProfileStatDashboard) keeps working with zero prop-shape changes"
    verification:
      - kind: unit
        ref: "full suite: npx vitest run (532 tests passed, including ProfileStatDashboard consumers)"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-07-13
status: complete
---

# Phase 09 Plan 04: StatCard DS Restyle Summary

**StatCard.svelte's container/value/label restyled to the DS spec — radius-16, asymmetric 16/24 padding, 40px/700 value with -0.02em tracking, 17px/500 label — with a new Wave-0 browser test proving the computed styles.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-13T23:24:00Z (approx, from STATE.md)
- **Completed:** 2026-07-13T23:32:14Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `.stat-card` now uses `var(--radius-md)` (16px), asymmetric `var(--space-md) var(--space-lg)` padding (16px/24px), plus a `1px solid var(--line)` border and `var(--edge-highlight)` inset shadow (previously absent)
- `.stat-value` now uses `var(--text-3xl)` (40px), `font-weight: 700`, `letter-spacing: var(--tracking-tight)` (-0.02em), and `line-height: 1.1` (was 28px/600/1.2, no tracking)
- `.stat-label` now uses `var(--text-base)` (17px) and `font-weight: 500` (was 18px/400)
- New `src/ui/stats/StatCard.test.ts` with 4 browser-mode tests proving text content and computed styles for value/label/card
- `Props` interface (`label: string`, `value: string`) and markup structure untouched — zero-impact on all existing call sites

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle StatCard.svelte** - `a201b96` (feat)
2. **Task 2: Wave-0 browser test for StatCard computed styles** - `09cf670` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/ui/stats/StatCard.svelte` - Restyled container/value/label CSS to DS spec; props/markup unchanged
- `src/ui/stats/StatCard.test.ts` - New browser-mode test proving computed value/label/container styles

## Decisions Made
- Updated the stale doc comment in `StatCard.svelte` (referenced the old 20px/600 value and 14px/400 label sizes, which were already inaccurate even before this plan — actual pre-existing CSS was 28px/600 and 18px/400) to reflect the new 40px/700/-0.02em value and 17px/500 label — directly documents the code changed in this task, not an unrelated edit.

## Deviations from Plan

None - plan executed exactly as written. The one comment update above is a same-file, same-line-of-work documentation fix directly tied to Task 1's CSS change, not a separate deviation.

## Issues Encountered
None. The `vitest run --project=browser -t "StatCard"` filter form used in the plan's `<verify>` blocks returned 0 matched tests in this environment (all files skipped by the `-t` name filter against file-level test names); running `npx vitest run --project=browser src/ui/stats/StatCard.test.ts` (path-scoped instead of name-filtered) correctly ran and passed all 4 tests. Full suite (`npx vitest run`, no filter) also passed at 532/532, confirming no regressions in ProfileStatDashboard or other consumers.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
COMP-04 closed — StatCard is the only outstanding success criterion in Phase 09 not touching buttons/toggles/dialogs. No blockers for remaining Phase 09 plans (buttons/toggles/dialogs restyle work).

---
*Phase: 09-core-components*
*Completed: 2026-07-13*
