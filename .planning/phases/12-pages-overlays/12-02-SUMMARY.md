---
phase: 12-pages-overlays
plan: 02
subsystem: ui
tags: [svelte, css-tokens, design-system, history]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: design tokens (typography.css, spacing.css, elevation.css) consumed by this plan
  - phase: 09-core-components
    provides: shared chevron SVG pattern (routes/+page.svelte menu buttons) reused for HistoryRow
provides:
  - Match history list (src/routes/history/+page.svelte + HistoryRow.svelte) restyled to DS list-box spec
  - Match history detail (src/routes/history/[id]/+page.svelte + PlayerStatRow.svelte + MatchStatBreakdown.svelte) restyled to DS type scale
affects: [12-pages-overlays remaining plans, phase-12 UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "History rows reuse the app-wide inline stroke-SVG chevron pattern (viewBox 0 0 24 24, stroke-width 2, path M9 18l6-6-6-6) instead of a Unicode '›' glyph"
    - "2-player history result uses --font-score (Barlow Semi Condensed) with font-variant-numeric: tabular-nums, matching DS ScoreCard-style numeric rendering"

key-files:
  created: []
  modified:
    - src/routes/history/+page.svelte
    - src/ui/history/HistoryRow.svelte
    - src/routes/history/[id]/+page.svelte
    - src/ui/history/PlayerStatRow.svelte
    - src/ui/history/MatchStatBreakdown.svelte

key-decisions:
  - "None beyond plan-specified token swaps — pure CSS/markup transcription against 12-UI-SPEC.md's pre-approved diff tables"

patterns-established: []

requirements-completed: [PAGE-02]

coverage:
  - id: D1
    description: "Match history list renders inside a bordered, radius-16 list box (edge-highlight shadow), not a bare unstyled <ul>"
    requirement: "PAGE-02"
    verification:
      - kind: unit
        ref: "npm test (563/563 suite green, design-tokens.test.ts guard included)"
        status: pass
    human_judgment: true
    rationale: "Visual box/shadow rendering requires human eyeballing against 12-UI-SPEC.md HistoryRow table; no dedicated component test exists for this file."
  - id: D2
    description: "HistoryRow shows inline SVG chevron (not Unicode '›'), DS row gap/height, and 2-player result in Barlow Semi Condensed tabular figures"
    requirement: "PAGE-02"
    verification:
      - kind: unit
        ref: "npm test (563/563 suite green)"
        status: pass
    human_judgment: true
    rationale: "Font-family/tabular-nums rendering and SVG glyph appearance require visual verification; no dedicated HistoryRow test file exists."
  - id: D3
    description: "History detail page, scoreboard rows, and stat breakdown use the DS type scale (26px title, 22px section headings, 19px body, 15px captions)"
    requirement: "PAGE-02"
    verification:
      - kind: unit
        ref: "npm test (563/563 suite green)"
        status: pass
    human_judgment: true
    rationale: "Type-scale visual proportions require human comparison against 12-UI-SPEC.md; automated tests only guard against regressions, not visual correctness."

duration: 8min
completed: 2026-07-14
status: complete
---

# Phase 12 Plan 02: Match History Restyle Summary

**Match history list and detail pages restyled to DS `HistoryRow.jsx` spec — boxed list container, inline SVG chevron, Barlow Semi Condensed tabular result, and full DS type scale across 5 files, zero behavior change.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-14T05:15:00Z (approx.)
- **Completed:** 2026-07-14T05:23:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- History list (`history/+page.svelte`) widened to 520px column with DS `--text-xl` title; `.match-list` now a bordered, radius-16 list box with `--edge-highlight` inset shadow
- `HistoryRow.svelte` restyled: `--line` border, DS `--space-md` gap and `--row-h` (64px token) height, DS type-scale date/names/format text, `--font-score` tabular-nums result, and Unicode `›` replaced with the app-wide inline SVG chevron pattern
- History detail (`history/[id]/+page.svelte`), `PlayerStatRow.svelte`, and `MatchStatBreakdown.svelte` all moved from hardcoded pixel font sizes to DS type-scale tokens (`--text-xl`/`--text-lg`/`--text-md`/`--text-sm`)
- `npm test` stayed 563/563 green throughout both tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: History list page + HistoryRow restyle** - `fa04c7e` (feat)
2. **Task 2: History detail + stat row components restyle** - `f40dcc3` (feat)

**Plan metadata:** (pending — final docs commit follows this SUMMARY)

## Files Created/Modified
- `src/routes/history/+page.svelte` - 520px column, DS title typography, boxed `.match-list`
- `src/ui/history/HistoryRow.svelte` - DS row gap/height/border tokens, tabular Barlow result, inline SVG chevron
- `src/routes/history/[id]/+page.svelte` - DS type scale on title/section-heading/summary/error text
- `src/ui/history/PlayerStatRow.svelte` - DS type scale on player name/wins/avg text
- `src/ui/history/MatchStatBreakdown.svelte` - DS type scale on section-heading/player-name text

## Decisions Made
None - plan executed exactly as written (pure token/markup transcription against pre-approved 12-UI-SPEC.md diff tables).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PAGE-02 requirement complete; match history list + detail now match the DS `HistoryRow.jsx` spec and DS type scale
- Navigation (goto to `/history/{id}`) and the delete-match `ConfirmDialog` flow verified unchanged (byte-identical wrapping markup, only chevron/typography classes touched)
- Manual visual comparison against 12-UI-SPEC.md HistoryRow/type-scale tables deferred to phase-12 end-of-phase UAT (per `human_verify_mode: end-of-phase` config)

---
*Phase: 12-pages-overlays*
*Completed: 2026-07-14*

## Self-Check: PASSED

All 5 modified source files and the SUMMARY.md itself confirmed present on disk. Both task commits (`fa04c7e`, `f40dcc3`) confirmed present in git log.
