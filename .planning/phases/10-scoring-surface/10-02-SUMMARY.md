---
phase: 10-scoring-surface
plan: 02
subsystem: ui
tags: [svelte, svg, dartboard, design-system, tdd]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: DS color/spacing tokens, provisional-color grep gate
  - phase: 09-core-components
    provides: shared button/component restyle patterns, Phase 9 established CSS-value-edit pattern
provides:
  - Dartboard.svelte flash-overlay and floating-label literal values matched to DS spec (rgba(255,255,255,0.35) region/bull flash, rgba(255,255,255,0.15) miss-zone flash, 56px/rgba(0,0,0,.75) float label)
  - data-segment-key test-selector attributes on outer-bull/inner-bull circles
  - 3 new computed-DOM-attribute tests appended to Dartboard.test.ts
affects: [11-spectator-display, ui-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "flushSync(() => { svg.dispatchEvent(...) }) to flush $state writes from a raw pointerdown event before asserting DOM attributes (mirrors PlayerPanel.test.ts's flushSync usage)"

key-files:
  created: []
  modified:
    - src/ui/input/Dartboard.svelte
    - src/ui/input/Dartboard.test.ts

key-decisions:
  - "Miss-zone flash keeps its own dimmer 0.15 opacity, distinct from the 0.35 used by region/bull flashes, per DS spec (not a uniform value)"
  - "data-segment-key test attributes added to outer-bull/inner-bull circles are zero-effect on hit-detection (pointer-events:none already set on both) — selector-only addition for test targeting"

patterns-established: []

requirements-completed: [SCOR-02]

coverage:
  - id: D1
    description: "Dartboard flash overlays (region/outer-bull/inner-bull) use DS-exact rgba(255,255,255,0.35); miss-zone flash uses the dimmer rgba(255,255,255,0.15)"
    requirement: "SCOR-02"
    verification:
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#center tap flashes inner bull with DS flash opacity 0.35"
        status: pass
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#miss-zone tap flashes with dimmer DS flash opacity 0.15"
        status: pass
    human_judgment: false
  - id: D2
    description: "Floating score label uses DS-exact font-size 56 and stroke halo rgba(0,0,0,.75)"
    requirement: "SCOR-02"
    verification:
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#center tap floating label uses DS font-size 56 and stroke halo rgba(0,0,0,.75)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Hit-detection dispatch (screenToBoard/classifyHit/buildRegions/ring radii) remains byte-identical — the 3 pre-existing dispatch tests pass with zero assertion changes"
    requirement: "SCOR-02"
    verification:
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#center tap dispatches inner bull {multiplier:2, segment:25}"
        status: pass
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#miss-zone tap dispatches segment 0"
        status: pass
      - kind: unit
        ref: "src/ui/input/Dartboard.test.ts#triple-20 tap dispatches {multiplier:3, segment:20}"
        status: pass
      - kind: e2e
        ref: "npx playwright test full-match-flow"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-14
status: complete
---

# Phase 10 Plan 02: Dartboard DS Literal-Value Finish Summary

**Closed Dartboard.svelte's last 3 DS-spec literal-value gaps (flash opacity, miss-zone dimmer opacity, float-label font-size/stroke halo) via RED/GREEN TDD while keeping polar-math hit-detection byte-identical.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-14T01:38:00Z
- **Completed:** 2026-07-14T01:44:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Region/outer-bull/inner-bull flash fill migrated from `var(--text-faint)` to the DS-exact `rgba(255,255,255,0.35)`
- Miss-zone flash fill given its own dimmer `rgba(255,255,255,0.15)` (was incorrectly sharing the region flash's uniform token)
- Floating score label upgraded to DS-exact `font-size="56"` and `stroke="rgba(0,0,0,.75)"` halo (was `52`/`var(--backdrop)`)
- Added `data-segment-key="outer-bull"`/`"inner-bull"` test-selector attributes (no hit-detection impact — both circles already `pointer-events="none"`)
- Dartboard.test.ts grew from 3 to 6 tests; all 3 pre-existing dispatch tests pass with zero assertion-body changes, proving `screenToBoard`/`classifyHit`/`buildRegions`/ring radii stayed byte-identical

## Task Commits

Each task was committed atomically (TDD RED/GREEN cycle):

1. **Task 1: Append flash/float computed-value assertions to Dartboard.test.ts (RED)** - `3390aa4` (test)
2. **Task 2: Close the 3 literal-value gaps in Dartboard.svelte (GREEN)** - `b70b80d` (feat)

**Plan metadata:** (this commit, docs)

## Files Created/Modified
- `src/ui/input/Dartboard.test.ts` - 3 new tests appended (flash opacity 0.35/0.15, float label 56/rgba(0,0,0,.75)) using `flushSync(() => { svg.dispatchEvent(...) })` to flush `$state` writes before asserting; existing 3 tests untouched
- `src/ui/input/Dartboard.svelte` - 5 literal-value edits (4 flash-fill sites off `var(--text-faint)`, float-label font-size + stroke) + 2 `data-segment-key` test-selector attributes; `screenToBoard`/`classifyHit`/`buildRegions()`/ring radii/dispatch logic untouched

## Decisions Made
- Miss-zone flash intentionally kept at a dimmer `0.15` opacity, distinct from the `0.35` used everywhere else — matches DS spec's two distinct values rather than one uniform token (per plan's `must_haves.truths`)
- `data-segment-key` additions are pure test-selector plumbing; zero behavioral or security surface since both circles already carry `pointer-events="none"`

## Deviations from Plan

None - plan executed exactly as written. All 5 literal-value edits and 2 test-selector attributes matched the plan's exact line-by-line diff spec; no additional bugs, missing functionality, or blocking issues were found.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/ui/input/Dartboard.svelte` is now fully DS-aligned (colors, notation strings, ring geometry, flash/float literal values) — no remaining gaps for this component per RESEARCH.md Pitfall 5
- Full test suite (544 tests) and `full-match-flow` E2E spec stay green; no regressions introduced
- Ready for the next Phase 10 plan (VisitStrip/ScorePanel/CheckoutSuggestion/match `+page.svelte` restyle per 10-PATTERNS.md)

---
*Phase: 10-scoring-surface*
*Completed: 2026-07-14*

## Self-Check: PASSED
- FOUND: .planning/phases/10-scoring-surface/10-02-SUMMARY.md
- FOUND: src/ui/input/Dartboard.svelte
- FOUND: src/ui/input/Dartboard.test.ts
- FOUND: commit 3390aa4 (test)
- FOUND: commit b70b80d (feat)
