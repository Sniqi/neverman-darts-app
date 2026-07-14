---
phase: 10-scoring-surface
plan: 01
subsystem: ui
tags: [svelte, css-tokens, design-system, numpad, accessibility]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: "--key-h/--text-2xl/--text-3xl/--text-xl/--text-lg/--text-sm/--bg-deep/--edge-highlight/--shadow-raise/--accent-bright/--accent-deep tokens"
  - phase: 09-core-components
    provides: "established computed-style component test pattern (StatCard.test.ts)"
provides:
  - "Numpad.svelte restyled to DS 76px/40px/32px key sizing with amber gradient confirm key"
  - "Numpad.test.ts — first computed-style test coverage for the numpad (Wave 0 gap closed)"
  - "backspace aria-label 'Letzte Ziffer löschen' (Phase 8 deferred a11y item redeemed)"
affects: [11-display-surface, 12-page-shells]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Numpad keys deliberately do NOT reuse .btn (own 76px spec, per 10-UI-SPEC.md)"

key-files:
  created:
    - src/ui/input/Numpad.test.ts
  modified:
    - src/ui/input/Numpad.svelte

key-decisions:
  - "digit-key font-family corrected from --font-score to --font-ui, following the more specific UI-SPEC.md type-scale table + literal DS Numpad.jsx source over PATTERNS.md's general summary row"

patterns-established: []

requirements-completed: [SCOR-01]

coverage:
  - id: D1
    description: "Numpad renders at DS 76px keys / 40px entry display / 32px digits with the amber gradient Bestätigen key"
    requirement: "SCOR-01"
    verification:
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#.input-display computed height/font-size/font-weight/background match DS spec"
        status: pass
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#.digit-key computed height/font-size/font-weight match DS spec"
        status: pass
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#.clear-key computed font-size/font-weight match DS spec"
        status: pass
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#.confirm-key computed height/font-size/font-weight/backgroundImage match DS spec"
        status: pass
    human_judgment: false
  - id: D2
    description: "Backspace key has aria-label 'Letzte Ziffer löschen' (Phase 8 deferred item)"
    requirement: "SCOR-01"
    verification:
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#.backspace-key has aria-label \"Letzte Ziffer löschen\""
        status: pass
    human_judgment: false
  - id: D3
    description: "Invalid totals still shake 400ms and show 'Ungültige Punktzahl' with zero validation-logic change"
    requirement: "SCOR-01"
    verification:
      - kind: unit
        ref: "src/ui/input/Numpad.test.ts#entering the impossible total 179 shows .error-msg at 15px and does not call onconfirm"
        status: pass
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts (numpad-driven visit entry, 180->321 flow)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-14
status: complete
---

# Phase 10 Plan 01: Numpad Restyle Summary

**Numpad.svelte restyled to DS 76px key / 40px entry-display / 32px digit sizing with an amber `linear-gradient` "Bestätigen" key, plus a new `Numpad.test.ts` computed-style test file and the Phase-8-deferred backspace `aria-label`.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-14T03:34:00Z
- **Completed:** 2026-07-14T03:36:15Z
- **Tasks:** 2 (TDD: RED then GREEN)
- **Files modified:** 2

## Accomplishments
- `Numpad.test.ts` created with 6 computed-style/interaction assertions (Wave 0 test-coverage gap closed) — confirmed RED against the unmodified component, then GREEN after the restyle
- `.input-display`/`.key`/`.confirm-key` moved off hardcoded pixel values onto `--key-h`/`--text-2xl`/`--text-3xl`/`--text-lg`/`--text-xl`/`--text-sm` tokens
- "Bestätigen" confirm key now renders the DS amber `linear-gradient(180deg, --accent-bright 0%, --accent 45%, --accent-deep 130%)` with `--shadow-raise` + inner sheen, replacing the flat `--accent` fill
- `.clear-key`/`.backspace-key` each get their own 26px/`--text-xl` font-size override (previously silently inherited `.key`'s old 24px)
- Backspace button gets `aria-label="Letzte Ziffer löschen"` — redeems the Phase 8 UI-review deferred accessibility item
- `isValidVisitTotal`/`pressDigit`/`pressClear`/`pressConfirm`/`pressBackspace` script logic is byte-identical to before this plan — diff is template-attribute + `<style>` block only

## Task Commits

Each task was committed atomically:

1. **Task 1: Write Numpad.test.ts — computed-style + aria-label assertions (RED)** - `3d3f582` (test)
2. **Task 2: Restyle Numpad.svelte to DS values + add ⌫ aria-label (GREEN)** - `1af696c` (feat)

_No REFACTOR commit needed — the GREEN implementation required no cleanup pass._

## Files Created/Modified
- `src/ui/input/Numpad.test.ts` - New browser-mode component test: 6 assertions covering `.input-display`/`.digit-key`/`.clear-key`/`.backspace-key`/`.confirm-key` computed styles + the invalid-179 shake/error-msg/no-onconfirm behavior
- `src/ui/input/Numpad.svelte` - Restyled `<style>` block to DS token values; added one `aria-label` attribute on the ⌫ button; script block untouched

## Decisions Made
- **digit-key font-family:** Plan flagged a discrepancy between PATTERNS.md's diff table (silent on this rule) and UI-SPEC.md's general "Design System" summary row (which generalizes all score numerals to `--font-score`). Followed the more specific, source-grounded value instead: UI-SPEC.md's own "Scoring Surface Type Scale" table row ("Numpad digit keys (0–9) | 32px | 500 | `--font-ui`") and the literal DS `Numpad.jsx` source (`fontFamily: 'var(--font-ui)'` on the shared key style object) both independently confirm `--font-ui`. `.input-display` keeps `--font-score` (entry value is a rendered numeral display, distinct from the button labels) — verified by the `grep -c "var(--font-score)"` acceptance criterion returning exactly 1.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria were met without needing Rule 1-4 fixes.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SCOR-01 (Numpad) complete; Numpad.test.ts establishes the computed-style test pattern other Phase 10 plans (Dartboard, VisitStrip/DartPill, ScoreCard) can replicate per 10-PATTERNS.md.
- Full test suite (541 tests) and `full-match-flow` E2E stay green — numpad-driven visit entry (180 → 321 assertions) unaffected.
- No blockers for the remaining Phase 10 plans (SCOR-02/03/04).

---
*Phase: 10-scoring-surface*
*Completed: 2026-07-14*

## Self-Check: PASSED
