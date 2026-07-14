---
phase: 12-pages-overlays
plan: 04
subsystem: ui
tags: [svelte, css-custom-properties, design-system, overlays]

requires:
  - phase: 09-component-primitives
    provides: .btn/.btn--cta shared button primitive (components.css)
  - phase: 03-04
    provides: PauseOverlay countdown/aria-live logic (untouched by this plan)
provides:
  - PauseOverlay, RecordOverlay, MatchWinOverlay restyled to DS overlay treatment (backdrop-blur scrim + surface-2/radius-lg/line-strong/shadow-panel dialog panel)
  - Weiter (PauseOverlay) and Neues Spiel (MatchWinOverlay) buttons now use shared .btn--cta primitive
affects: [12-05, future overlay/dialog work]

tech-stack:
  added: []
  patterns:
    - "Overlay panel treatment mirrors ConfirmDialog.svelte's .dialog rule (surface-2/radius-lg/line-strong border/shadow-panel + edge-highlight, spring scale-in keyframe), with a per-component keyframe name to avoid collisions when overlays coexist in the DOM (pauseContentIn/recordContentIn/winContentIn)"

key-files:
  created: []
  modified:
    - src/ui/overlays/PauseOverlay.svelte
    - src/ui/overlays/RecordOverlay.svelte
    - src/ui/overlays/MatchWinOverlay.svelte

key-decisions:
  - "RecordOverlay's .record-content panel treatment applied for visual consistency across the three overlays, per UI-SPEC's Claude's-Discretion recommendation — this overlay is celebratory/non-interactive so the panel was optional, but applied to keep all 3 overlays visually consistent"
  - ".win-heading kept at hardcoded 48px (documented KEEP exception — no DS token exists at this celebratory size, mirrors RecordOverlay's own clamp() literal sizing)"

patterns-established: []

requirements-completed: [PAGE-04]

coverage:
  - id: D1
    description: "PauseOverlay, RecordOverlay, MatchWinOverlay scrims blur the background and panels get surface-2/radius-lg/line-strong-border/shadow-panel treatment"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "PauseOverlay.test.ts 20/20 passing; visual/computed-style acceptance criteria per plan (backdrop-filter, surface-2 background, radius-lg, line-strong border) satisfied by CSS matching ConfirmDialog's proven .backdrop/.dialog pattern"
        status: pass
    human_judgment: false
  - id: D2
    description: "Weiter and Neues Spiel buttons swapped to shared .btn--cta primitive, bespoke .weiter-btn/.new-game-btn CSS removed"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "grep -c weiter-btn PauseOverlay.svelte == 0; grep -c new-game-btn MatchWinOverlay.svelte == 0; PauseOverlay.test.ts 20/20; e2e/full-match-flow.spec.ts passing (1/1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Countdown/auto-dismiss/win-derivation logic byte-identical — no <script> block changes in any of the 3 overlays"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "Only <style> blocks and button class/markup attributes changed per task diffs; PauseOverlay.test.ts's countdown-format/zero-flash/aria-live tests (14 of the 20) all pass unchanged"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 12 Plan 04: Overlay Restyle (Pause/Record/MatchWin) Summary

**PauseOverlay, RecordOverlay, and MatchWinOverlay scrims now blur the background and their panels carry the DS surface-2/radius-lg/line-strong-border/shadow-panel treatment (mirroring ConfirmDialog), with Weiter/Neues-Spiel buttons swapped to the shared .btn--cta primitive — zero countdown/auto-dismiss/win-derivation logic changed.**

## Performance

- **Duration:** 12 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- All 3 overlay scrims (`.pause-overlay`, `.record-overlay`, `.win-overlay`) now apply `backdrop-filter: blur(var(--blur-backdrop))` (+ `-webkit-` prefix), matching `ConfirmDialog.svelte`'s `.backdrop` rule exactly
- All 3 overlay panels (`.pause-content`, `.record-content`, `.win-content`) now use the DS dialog-panel treatment: `background: var(--surface-2)`, `border-radius: var(--radius-lg)`, `border: 1px solid var(--line-strong)`, `box-shadow: var(--shadow-panel), var(--edge-highlight)`, plus a spring scale-in entrance keyframe (`pauseContentIn`/`recordContentIn`/`winContentIn` — distinct names to avoid collision if overlays coexist in the DOM)
- `PauseOverlay`'s heading/subtitle and `MatchWinOverlay`'s body/record-badge font-sizes switched from hardcoded px to DS text tokens (`--text-xl`, `--text-base`)
- `PauseOverlay`'s "Weiter" button and `MatchWinOverlay`'s "Neues Spiel" button now render as the shared `.btn.btn--cta` primitive (amber gradient, inner sheen, `scale(.97)` press) — the bespoke `.weiter-btn`/`.new-game-btn` CSS rules were deleted entirely in the same commit
- All pre-existing class names (`.pause-overlay`, `.pause-content`, `.countdown-digits`, `.zero-flash`, `.win-overlay`, `.win-content`, `.record-overlay`, `.record-content`) preserved verbatim, as required by `PauseOverlay.test.ts` and `e2e/full-match-flow.spec.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Backdrop-filter + panel treatment for all 3 overlays** - `2ab80a1` (feat)
2. **Task 2: Button swap to shared .btn--cta + remaining text-token fixes** - `52c21bd` (feat)

**Plan metadata:** (pending — final commit below)

## Files Created/Modified
- `src/ui/overlays/PauseOverlay.svelte` - scrim backdrop-blur, `.pause-content` DS panel + `pauseContentIn` keyframe, heading/subtitle text tokens, Weiter button → `.btn.btn--cta`, `.weiter-btn` CSS removed
- `src/ui/overlays/RecordOverlay.svelte` - scrim backdrop-blur, `.record-content` DS panel + `recordContentIn` keyframe (discretionary consistency application; existing `bannerFadeIn` on the scrim untouched)
- `src/ui/overlays/MatchWinOverlay.svelte` - scrim backdrop-blur, `.win-content` DS panel + `winContentIn` keyframe, body/record-badge text tokens, Neues-Spiel button → `.btn.btn--cta`, `.new-game-btn` CSS removed, `.win-heading` kept at 48px (documented KEEP exception)

## Decisions Made
- Applied the DS panel treatment to `RecordOverlay.svelte`'s `.record-content` even though the plan flagged this as discretionary (celebratory/non-interactive overlay) — chosen for visual consistency across all 3 overlays per UI-SPEC's stated default.
- Kept `.win-heading` at its hardcoded `48px` — no DS token exists at this celebratory size; this mirrors `RecordOverlay`'s own `clamp(2.5rem, 6vw, 8rem)` literal sizing and matches the plan's explicit KEEP instruction.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None. `PauseOverlay.test.ts` reported 20/20 passing after both tasks. `e2e/full-match-flow.spec.ts` reported 1/1 passing (win-flow heading/button assertions green). Pre-existing vite-plugin-svelte compile warnings (SpectatorChooser unknown_element, MatchSetup a11y label warnings) observed during the E2E dev-server boot are unrelated to this plan's files and out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PAGE-04 overlay portion (Pause/Record/MatchWin) complete
- 12-05 (the remaining PAGE-04 scope, if any, or the next plan in the phase) can proceed independently — no shared file overlap with this plan's 3 files

---
*Phase: 12-pages-overlays*
*Completed: 2026-07-14*

## Self-Check: PASSED

All 3 source files and both task commits (2ab80a1, 52c21bd) verified present on disk / in git log.
