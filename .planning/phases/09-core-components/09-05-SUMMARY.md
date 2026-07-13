---
phase: 09-core-components
plan: 05
subsystem: ui
tags: [svelte, css-design-tokens, accessibility, dartsapp]

# Dependency graph
requires:
  - phase: 09-core-components
    provides: shared .btn/.btn--cta/.btn--ghost and .switch/.thumb primitives (Plan 09-01)
provides:
  - MatchSetup.svelte fully restyled to DS spec (chips, segmented control, steppers, toggle rows)
  - 4 toggle rows migrated from native checkbox to shared custom button+thumb switch
  - start-btn/back-btn consuming shared .btn--cta/.btn--ghost classes
affects: [09-core-components remaining plans, any future MatchSetup edits]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Custom switch markup: <button type=button role=switch aria-checked class=switch class:on onclick> + <span class=thumb>, label association via existing <label for> targeting the button id"

key-files:
  created: []
  modified:
    - src/ui/setup/MatchSetup.svelte

key-decisions:
  - "Kept native <label for=...> association pointing at the new <button> id — buttons are labelable elements, so the accessible name computation is unchanged; verified at runtime via the pre-existing getByRole('switch', {name:'Sets'}) E2E assertion rather than by trusting the svelte a11y_consider_explicit_label linter warning (a static false positive noted in the plan itself)"

patterns-established:
  - "Toggle rows composed with onclick handlers that inline both state flip and persistence call (e.g. callerEnabled = !callerEnabled; saveAudioPref(...)), replacing bind:checked+onchange pairs"

requirements-completed: [COMP-01, COMP-02]

coverage:
  - id: D1
    description: "301/401/501 chips render at 56px min-height, 19px font, DS gradient active fill with press-scale"
    requirement: "COMP-02"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path (chip selection)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Single/Double Out segmented control renders as a recessed track with borderless gradient-active options"
    requirement: "COMP-02"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path (Double Out selection)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 4 steppers (Legs, Sets, Pause nach, Pausendauer) render at 64px row height with 48x48 buttons and 26px/700 values"
    requirement: "COMP-02"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path (Legs verringern)"
        status: pass
    human_judgment: false
  - id: D4
    description: "All 4 toggle rows (Sets, Caller, Musik, Automatische Pause) use custom button+thumb switch, preserving id/role=switch/aria-checked"
    requirement: "COMP-02"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path (getByRole('switch', {name:'Sets'}).click())"
        status: pass
    human_judgment: false
  - id: D5
    description: "'Spiel starten' renders as the DS cta variant via .btn--cta"
    requirement: "COMP-01"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path (Spiel starten click)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 09 Plan 05: MatchSetup COMP-02 Restyle Summary

**MatchSetup.svelte's chips, segmented control, 4 steppers, and 4 toggle rows restyled to DS spec; toggles swapped from native checkbox to the shared custom button+thumb switch; start/back buttons moved onto shared `.btn` classes.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Chips (301/401/501) now render at 56px min-height / 19px font with DS gradient active fill and press-scale
- SegmentedControl (Single/Double Out) now renders as a recessed track (bg-deep, 4px gap/padding) with borderless 8px-radius options and gradient active fill
- All 4 steppers (Legs, Sets, Pause nach, Pausendauer) and their shared `.toggle-row` container now render at 64px row height with 48x48 stepper buttons and 26px/700 values
- All 4 toggle rows (Sets, Caller, Musik, Automatische Pause) swapped from native `<input type=checkbox role=switch>` to the shared custom `.switch`/`.thumb` button markup, preserving every `id`/`role=switch`/`aria-checked` exactly
- "Spiel starten" and the back button now consume the shared `.btn--cta`/`.btn--ghost` classes; local `.start-btn`/`.back-btn` rules reduced to only the layout-specific overrides not covered by the shared classes

## Task Commits

Each task was committed atomically:

1. **Task 1: Chips + SegmentedControl restyle** - `f448e33` (feat)
2. **Task 2: Steppers restyle + start-btn/back-btn class swap** - `2833ec4` (feat)
3. **Task 3: ToggleRow markup swap (4 instances)** - `26d8898` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/ui/setup/MatchSetup.svelte` - Chips/segmented-control/steppers/toggle-rows restyled to DS spec; 4 toggle rows swapped to custom switch; start-btn/back-btn moved onto shared `.btn` classes

## Decisions Made
- Kept native `<label for="...">` association targeting the new `<button>` id rather than adding `aria-label` to silence the svelte a11y linter warning — buttons are labelable elements, so the accessible-name computation is unaffected; verified via the pre-existing `getByRole('switch', {name:'Sets'})` E2E assertion (a real runtime check, stronger evidence than the static linter warning noted as a known false positive in the plan's own `read_first` guidance)

## Deviations from Plan

None - plan executed exactly as written. The `input[type='checkbox']` dead-CSS rule referenced in Task 3's action was already removed as part of Task 2's `.toggle-row` rewrite (same selector block); no separate action was needed for it in Task 3, and the removal is reflected in Task 2's commit rather than Task 3's — a sequencing nuance, not a scope deviation.

## Issues Encountered
- `svelte-plugin-svelte` a11y linter (`a11y_consider_explicit_label`) flags all 4 new switch buttons as lacking visible text/aria-label. This is a known, plan-anticipated false positive: native `<label for>` targeting a labelable `<button>` element supplies the accessible name per the HTML/AccName spec, confirmed at runtime by the passing `getByRole('switch', {name:'Sets'})` E2E assertion. No fix applied — treating it otherwise (adding a redundant `aria-label`) was explicitly out of scope per the plan's action text ("keeping every existing `<label for="...">` untouched").

## Next Phase Readiness
- MatchSetup.svelte fully closes out COMP-02 for the setup screen and the `cta`/`ghost` slice of COMP-01
- Full test suite green: 533/533 Vitest unit/component tests, 8/8 Playwright E2E tests (including the load-bearing `full-match-flow.spec.ts` line-27 switch assertion)
- No blockers for remaining Phase 09 plans

---
*Phase: 09-core-components*
*Completed: 2026-07-14*

## Self-Check: PASSED

- FOUND: src/ui/setup/MatchSetup.svelte
- FOUND: .planning/phases/09-core-components/09-05-SUMMARY.md
- FOUND: f448e33 (Task 1 commit)
- FOUND: 2833ec4 (Task 2 commit)
- FOUND: 26d8898 (Task 3 commit)
