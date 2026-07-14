---
phase: 12-pages-overlays
plan: 03
subsystem: ui
tags: [svelte, css-custom-properties, design-system, svg-charts]

requires:
  - phase: 09-component-primitives
    provides: StatCard component (already DS-correct, verify-only in this plan)
provides:
  - Stats route (/stats) and ProfileStatDashboard at DS type scale (520px column, 26px title, 15px caption, 22px section headings)
  - Chart Recolor Contract satisfied — ScoreDistributionChart/DartsPerLegChart non-highlighted bar fill uses var(--surface-3) instead of double-duty var(--line-strong)
affects: [12-04, 12-05, future stats/chart work]

tech-stack:
  added: []
  patterns:
    - "Chart recolor via scoped grep gate (var(--line-strong) count drop from 2 to 1) proves rebuild-forbidden constraint held structurally, not just by instruction"

key-files:
  created: []
  modified:
    - src/routes/stats/+page.svelte
    - src/ui/stats/ProfileStatDashboard.svelte
    - src/ui/stats/ScoreDistributionChart.svelte
    - src/ui/stats/DartsPerLegChart.svelte

key-decisions:
  - "Chart recolor limited to the exact 2 flagged @const fill lines — no other SVG geometry, viewBox math, or data-binding touched, verified via git diff --stat showing 1 changed line per chart file"

patterns-established: []

requirements-completed: [PAGE-03]

coverage:
  - id: D1
    description: "Stats page + dashboard restyled to DS type scale (520px column, 26px page title, 15px picker caption, 22px section headings x5)"
    requirement: "PAGE-03"
    verification:
      - kind: unit
        ref: "npm test (563/563 vitest suite, no dedicated test file for these components — full regression proves no behavior break)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ScoreDistributionChart and DartsPerLegChart non-highlighted bar fill changed from var(--line-strong) to var(--surface-3), 1-line change each, rebuild-forbidden constraint held"
    requirement: "PAGE-03"
    verification:
      - kind: unit
        ref: "grep -c \"var(--line-strong)\" (reports 1 for each file, down from 2) + git diff --stat (1 line changed per file) + npm test (563/563 pass)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-14
status: complete
---

# Phase 12 Plan 03: Stats Dashboard Restyle Summary

**Stats route + dashboard restyled to DS type scale (520px/26px/15px/22px), and the shared bar-chart fill role split from the axis-hairline token via a grep-gated 2-line color-literal fix — zero SVG structure changes.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-14T05:20:00Z (approx)
- **Completed:** 2026-07-14T05:27:25Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `stats/+page.svelte` and `ProfileStatDashboard.svelte` now use the DS type scale: 520px column, 26px page title, 15px picker caption, 22px section headings (Übersicht/Rekorde/Score-Verteilung/Ø-Entwicklung/Darts pro Leg)
- `ScoreDistributionChart.svelte` and `DartsPerLegChart.svelte` non-highlighted/non-best bar fill now uses `var(--surface-3)` instead of double-duty `var(--line-strong)` — axis hairline role stays untouched
- Rebuild-forbidden constraint enforced structurally: grep gate confirms `var(--line-strong)` count dropped from 2 to 1 per chart file (only the surviving axis `stroke` line), and `git diff --stat` confirms exactly 1 changed line per chart file

## Task Commits

Each task was committed atomically:

1. **Task 1: Stats page + dashboard typography** - `70b86a7` (feat)
2. **Task 2: Chart recolor fix (2-line REBUILD-FORBIDDEN change)** - `f7f2b19` (fix)

**Plan metadata:** (pending — final commit below)

## Files Created/Modified
- `src/routes/stats/+page.svelte` - `.screen` max-width 480px→520px, `.screen-title` 20px→var(--text-xl), `.picker-heading` 14px→var(--text-sm)
- `src/ui/stats/ProfileStatDashboard.svelte` - `.section-heading` 20px→var(--text-lg) (drives all 5 headings)
- `src/ui/stats/ScoreDistributionChart.svelte` - line 67 `@const fill` non-highlighted branch `var(--line-strong)`→`var(--surface-3)` (only line changed)
- `src/ui/stats/DartsPerLegChart.svelte` - line 81 `@const fill` non-best branch `var(--line-strong)`→`var(--surface-3)` (only line changed)

## Decisions Made
None - followed plan as specified.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. `npm test` reported 563/563 passing after both tasks; the two vite-plugin-svelte compile warnings observed (SpectatorChooser unknown_element, MatchSetup a11y label warnings) are pre-existing, in files not touched by this plan, and out of scope per the plan's scope boundary.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PAGE-03 (stats dashboard restyle) complete; StatCard and AverageTrendChart remain verify-only/untouched as scoped
- 12-04 and 12-05 plans can proceed independently — no shared file overlap with this plan's 4 files

---
*Phase: 12-pages-overlays*
*Completed: 2026-07-14*

## Self-Check: PASSED

All 4 source files, the SUMMARY.md, and both task commits (70b86a7, f7f2b19) verified present on disk / in git log.
