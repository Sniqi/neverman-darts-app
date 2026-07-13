---
phase: 09-core-components
plan: 03
subsystem: ui
tags: [svelte, css-custom-properties, design-system, dialogs, vitest-browser]

# Dependency graph
requires:
  - phase: 09-core-components
    provides: "Plan 09-01's shared .btn/.btn--* button classes in src/styles/components.css"
provides:
  - "ConfirmDialog restyled to DS spec: 12px scrim blur, surface-2/420px/xl-padding panel with border+shadow-panel, 0.94->1 scale-in with translateY(8px)->0, --text-xl/--text-base typography"
  - "ConfirmDialog's confirm/cancel buttons consuming shared .btn--destructive/.btn--accent/.btn--cancel classes, old local button CSS deleted"
  - "DartsAtDoubleDialog's backdrop with matching 12px scrim blur"
  - "ResumePrompt's Fortsetzen/Verwerfen buttons consuming shared .btn--accent/.btn--destructive-outline classes at a documented 56px side-by-side exception"
  - "New ConfirmDialog.test.ts browser-mode test proving computed backdrop-filter/border-radius/max-width"
affects: [core-components, dialogs, resume-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dialogs consume shared .btn/.btn--* classes from components.css instead of local per-component button CSS"
    - "Component-local class names (e.g. .btn-resume/.btn-discard) retained alongside shared .btn--* classes purely as flex-layout/height override hooks when a documented DS exception (e.g. 56px side-by-side row) differs from the shared class default"

key-files:
  created:
    - src/ui/dialogs/ConfirmDialog.test.ts
  modified:
    - src/ui/dialogs/ConfirmDialog.svelte
    - src/ui/input/DartsAtDoubleDialog.svelte
    - src/ui/start/ResumePrompt.svelte

key-decisions:
  - "ConfirmDialog buttons consume shared .btn--destructive/.btn--accent/.btn--cancel classes directly (RESEARCH Open Question 3's recommended answer) rather than wrapping them in new local classes"
  - "ResumePrompt keeps thin local .btn-resume/.btn-discard classes solely to add flex:1 (side-by-side row) and a 56px height override on .btn-resume, since .btn--accent's shared default is the taller --row-h; .btn--destructive-outline is already 56px so .btn-discard needs no height override"

patterns-established: []

requirements-completed: [COMP-01, COMP-03]

coverage:
  - id: D1
    description: "ConfirmDialog restyled to DS spec (12px scrim blur, 420px/surface-2/border+shadow panel, 0.94 scale-in + translateY(8px), --text-xl/--text-base typography) with buttons on shared .btn--* classes"
    requirement: "COMP-03"
    verification:
      - kind: unit
        ref: "src/ui/dialogs/ConfirmDialog.test.ts#ConfirmDialog backdrop has 12px blur and dialog panel has 20px radius / 420px max-width"
        status: pass
      - kind: e2e
        ref: "npx playwright test (full suite, 8 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "DartsAtDoubleDialog backdrop gets matching 12px scrim blur; ResumePrompt buttons consume shared .btn--accent/.btn--destructive-outline classes at documented 56px exception"
    requirement: "COMP-01"
    verification:
      - kind: e2e
        ref: "e2e/resume.spec.ts (Fortsetzen/Verwerfen click-through, 2 passed)"
        status: pass
    human_judgment: false

# Metrics
duration: ~8min
completed: 2026-07-14
status: complete
---

# Phase 9 Plan 3: Confirmation Dialog Cluster Restyle Summary

**ConfirmDialog/DartsAtDoubleDialog/ResumePrompt restyled to DS spec (12px scrim blur, 420px panel, scale-in motion) with all three consuming Plan 09-01's shared `.btn--*` button classes**

## Performance

- **Duration:** ~8 min
- **Tasks:** 3
- **Files modified:** 3 modified, 1 created

## Accomplishments
- ConfirmDialog's backdrop now blurs (12px), panel is `surface-2`/420px-max-width/`xl`-padding with border + `shadow-panel`, scale-in motion changed to `0.94 → 1` with `translateY(8px) → 0`, and heading/body typography moved onto `--text-xl`/`--text-base` tokens
- ConfirmDialog's confirm/cancel buttons swapped onto the shared `.btn`, `.btn--destructive`, `.btn--accent`, `.btn--cancel` classes; all old local `.cta-btn`/`.cancel-btn`/`.cta-destructive`/`.cta-accent` CSS deleted
- DartsAtDoubleDialog's backdrop gets the same 12px blur, with its bottom-sheet shape/motion left untouched
- ResumePrompt's Fortsetzen/Verwerfen buttons swapped onto shared `.btn--accent`/`.btn--destructive-outline` classes at a documented 56px side-by-side exception; old local button color/press-state CSS deleted
- New `ConfirmDialog.test.ts` browser-mode test proves computed `backdrop-filter`, `border-radius`, and `max-width`

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle ConfirmDialog.svelte** - `9db5e38` (style)
2. **Task 2: DartsAtDoubleDialog blur + ResumePrompt button-class swap** - `6bf92f2` (style)
3. **Task 3: Wave-0 browser test for ConfirmDialog computed styles** - `97ecd4e` (test)

**Plan metadata:** (this commit) — docs: complete plan

## Files Created/Modified
- `src/ui/dialogs/ConfirmDialog.svelte` - Backdrop blur, panel radius/max-width/motion/typography per DS spec; buttons on shared `.btn--*` classes; old local button CSS deleted
- `src/ui/dialogs/ConfirmDialog.test.ts` - New browser test asserting computed backdrop-filter/border-radius/max-width and the "Abbrechen" button's presence
- `src/ui/input/DartsAtDoubleDialog.svelte` - One-line backdrop-filter blur addition on `.backdrop`; no other change
- `src/ui/start/ResumePrompt.svelte` - Fortsetzen/Verwerfen buttons on shared `.btn--accent`/`.btn--destructive-outline` classes with local `flex:1`/56px-height override hooks

## Decisions Made
- ConfirmDialog and ResumePrompt buttons consume shared `.btn--*` classes directly per RESEARCH Open Question 3's recommended answer, rather than introducing new wrapper classes
- ResumePrompt retains thin local `.btn-resume`/`.btn-discard` classes purely as `flex:1`/height-override hooks for the documented 56px side-by-side exception (UI-SPEC's gap note), not as a residual-duplicate-CSS pitfall

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ConfirmDialog/DartsAtDoubleDialog/ResumePrompt cluster fully aligned to the DS ConfirmDialog spec (COMP-03) and shared button classes (COMP-01 dialog-button slice)
- Full Playwright suite (8 tests) and full Vitest suite (533 tests, including new ConfirmDialog test) both green
- No blockers for subsequent Phase 9 plans

---
*Phase: 09-core-components*
*Completed: 2026-07-14*
