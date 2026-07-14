---
phase: 09-core-components
plan: 06
subsystem: ui
tags: [svelte, css, design-system, buttons]

# Dependency graph
requires:
  - phase: 09-core-components
    provides: shared Button-family classes (.btn, .btn--ghost, .btn--icon, .btn--surface, .btn--cta, .btn--destructive, .btn--cancel) in src/styles/components.css (09-01)
provides:
  - PlayerPicker/ProfileManager/BullOffOrder button markup fully DS-conformant (COMP-01)
  - ProfileManager's hand-rolled delete-confirmation sheet closed for COMP-03 (scrim blur + typography)
affects: [phase-10-scoring-surface, phase-11-spectator-display, phase-12-pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Local CSS overrides layered on shared .btn--* classes for justified non-DS shapes (dashed add-row border, compact inline-edit height)"

key-files:
  created: []
  modified:
    - src/ui/setup/PlayerPicker.svelte
    - src/ui/setup/ProfileManager.svelte
    - src/ui/setup/BullOffOrder.svelte

key-decisions:
  - "PlayerPicker's .picker-item/.guest-btn intentionally left unshared (single-file list-row pattern with no ≥2-file reuse and no shared class fitting a normal-color avatar+name+badge row); only typography/press-state aligned"
  - "ProfileManager's inline edit-mode Speichern/Abbrechen buttons get a new local .edit-action compact override (36px height) layered on .btn--surface/.btn--ghost — the full 56/64px Button-family scale would break the inline-edit row's compact layout"
  - "ProfileManager's .add-btn kept as fully local/unshared styling (no DS-recognized shape for this bordered square '+' button) — only touch target (48px) and press-state added"

requirements-completed: [COMP-01, COMP-03]

coverage:
  - id: D1
    description: "PlayerPicker's remove/add-player buttons consume shared .btn--ghost/.btn--icon and .btn--surface classes with justified local overrides (font-size, dashed border); picker-item gets typography/press-state alignment"
    requirement: "COMP-01"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts#full X01 match happy path: setup → bull-off → match → leg win"
        status: pass
    human_judgment: false
  - id: D2
    description: "ProfileManager's icon buttons, add-btn, inline-edit buttons, and delete-sheet buttons all get DS-conformant treatment; delete sheet gets scrim blur + typography fixes"
    requirement: "COMP-01"
    verification:
      - kind: unit
        ref: "src/ui/setup/ProfileManager.test.ts (4 cases: create/list, delete-sheet strings, Abbrechen cancel)"
        status: pass
    human_judgment: false
  - id: D3
    description: "ProfileManager's hand-rolled delete-confirmation bottom sheet gets scrim blur (COMP-03) independent of the shared ConfirmDialog component"
    requirement: "COMP-03"
    verification:
      - kind: unit
        ref: "src/ui/setup/ProfileManager.test.ts#opens the delete bottom sheet with correct German strings"
        status: pass
    human_judgment: false
  - id: D4
    description: "BullOffOrder's confirm button consumes the shared .btn--cta class; local CSS reduced to only the layout-specific margin-top rule"
    requirement: "COMP-01"
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts, e2e/resume.spec.ts, e2e/spectator-sync.spec.ts (getByRole button name 'Spielreihenfolge bestätigen')"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-14
status: complete
---

# Phase 09 Plan 06: Setup-cluster button-class closeout Summary

**PlayerPicker, ProfileManager, and BullOffOrder buttons switched to shared Button-family classes (.btn--ghost/.btn--icon/.btn--surface/.btn--cta/.btn--destructive/.btn--cancel), and ProfileManager's hand-rolled delete sheet got scrim blur + typography alignment — closing out COMP-01/COMP-03 for the entire player-setup flow.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-14T01:57:00+02:00
- **Completed:** 2026-07-14T02:01:25+02:00
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- PlayerPicker's remove/add-player buttons now consume shared `.btn--ghost.btn--icon` / `.btn--surface` classes; picker-item aligned to DS typography scale (`var(--text-md)`) with a new press-state
- ProfileManager's icon (edit/delete), add-profile, inline-edit, and delete-sheet buttons all restyled onto shared classes; delete sheet gets `backdrop-filter: blur(var(--blur-backdrop))` and typography-token alignment
- BullOffOrder's confirm button now consumes `.btn--cta`; local CSS reduced to just the layout-specific `margin-top: auto` rule

## Task Commits

Each task was committed atomically:

1. **Task 1: PlayerPicker.svelte button-class swaps** - `93fdc14` (feat)
2. **Task 2: ProfileManager.svelte button-class swaps + delete-sheet blur/typography** - `f99659d` (feat)
3. **Task 3: BullOffOrder.svelte confirm-btn class swap** - `3cd3b13` (feat)

_No TDD tasks in this plan — style-only changes verified against existing E2E/component tests._

## Files Created/Modified
- `src/ui/setup/PlayerPicker.svelte` - remove/add-player buttons on shared classes; picker-item typography/press-state alignment
- `src/ui/setup/ProfileManager.svelte` - icon/add/inline-edit/delete-sheet buttons on shared classes; delete-sheet scrim blur + typography
- `src/ui/setup/BullOffOrder.svelte` - confirm-btn on shared `.btn--cta` class

## Decisions Made
- PlayerPicker's `.picker-item`/`.guest-btn` intentionally left as local, unshared styles (single-file pattern, no shared class fits a normal-color avatar+name+badge row) — only typography and press-state were aligned for touch consistency, per the plan's explicit instruction.
- ProfileManager's inline edit-mode `Speichern`/`Abbrechen` buttons (previously fully unstyled bare `<button>` elements) get a new local `.edit-action` compact override (36px height, `var(--text-sm)`) layered on `.btn--surface`/`.btn--ghost` — the full 56/64px Button-family scale would break the inline-edit row's compact layout.
- ProfileManager's `.add-btn` kept as fully local/unshared styling (no DS-recognized shape for this bordered square "+" button) — only the touch target (`var(--hit-min)`, 48px) and a new `:active` press-state were added.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Player-setup flow (PlayerPicker, ProfileManager, BullOffOrder) fully DS-conformant on COMP-01 (buttons); COMP-03 closed for ProfileManager's independent delete-sheet blur treatment.
- All locked E2E (`full-match-flow.spec.ts`, `resume.spec.ts`, `spectator-sync.spec.ts`) and component tests (`ProfileManager.test.ts`, 4 cases) verified green after changes.
- This was plan 6 of 7 in Phase 09 (Core Components); plan 7 remains.

---
*Phase: 09-core-components*
*Completed: 2026-07-14*

## Self-Check: PASSED
