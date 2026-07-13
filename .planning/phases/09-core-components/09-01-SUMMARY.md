---
phase: 09-core-components
plan: 01
subsystem: ui
tags: [css, svelte, design-system, buttons, toggle-switch]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: DS color/spacing/radius/elevation/typography tokens (--row-h, --hit-min, --radius-sm, --accent, --press-scale, --ease-spring, etc.)
provides:
  - src/styles/components.css with .btn base + 5 DS variants (menu/accent/cta/destructive/cancel) + 4 discretionary extensions (ghost/icon/surface/destructive-outline)
  - shared .switch/.thumb toggle primitive
  - canonical migrated usage example (routes/+page.svelte) for all other Phase 9 button-swap plans to match against
affects: [09-02, 09-03, 09-04, 09-05, 09-06, 09-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared .btn base + .btn--<variant> modifier classes in a global stylesheet, consumed via class-attribute swaps in Svelte components"
    - "CSS :active pseudo-class press-state (scale + brightness/opacity) instead of JS pointerdown/up handlers"
    - "Custom <button role=switch aria-checked> + .switch/.thumb classes replacing native <input type=checkbox role=switch>"

key-files:
  created:
    - src/styles/components.css
    - src/ui/shared/components-css.test.ts
  modified:
    - src/app.css
    - src/routes/+page.svelte

key-decisions:
  - "components.css added as app.css's 6th @import, immediately after fonts.css, before the `* { box-sizing: border-box; }` rule"
  - "routes/+page.svelte's profiles-toggle class dropped entirely — it had no CSS rule of its own (only font-weight:400, now redundant since btn--menu is already 500) and was not referenced by any test or logic, only by aria-expanded which stays on the button element regardless of class"
  - "New browser-mode test file placed at src/ui/shared/components-css.test.ts (not src/styles/) to match the browser Vitest project's include glob (src/ui/**/*.test.ts), per plan instruction"

patterns-established:
  - "Pattern: shared global .btn/.switch classes in components.css are the single source of truth for button/toggle visuals — per-file local button CSS must be deleted in the same commit as the class swap (Pitfall 3 sweep), never left coexisting"

requirements-completed: [COMP-01, COMP-02]

coverage:
  - id: D1
    description: "src/styles/components.css defines .btn base + all 5 DS button variants (menu/accent/cta/destructive/cancel) plus 4 discretionary extensions (ghost/icon/surface/destructive-outline), wired into app.css as its 6th import"
    requirement: COMP-01
    verification:
      - kind: unit
        ref: "npx vitest run --project unit -t \"design tokens\" — design-tokens.test.ts (FOUND-01 forbidden-value regression)"
        status: pass
      - kind: unit
        ref: "src/ui/shared/components-css.test.ts#components-css: .btn.btn--menu computed height is 64px"
        status: pass
      - kind: unit
        ref: "src/ui/shared/components-css.test.ts#components-css: .btn.btn--accent computed height is 64px and background is a gradient"
        status: pass
      - kind: unit
        ref: "src/ui/shared/components-css.test.ts#components-css: .btn.btn--cta computed minHeight/fontSize/fontWeight match DS spec"
        status: pass
      - kind: unit
        ref: "src/ui/shared/components-css.test.ts#components-css: .btn.btn--ghost.btn--icon computed width/height are 48px"
        status: pass
    human_judgment: false
  - id: D2
    description: "Shared .switch/.thumb toggle classes defined in components.css matching DS ToggleRow spec (56x34, spring thumb transition)"
    requirement: COMP-02
    verification:
      - kind: unit
        ref: "src/ui/shared/components-css.test.ts#components-css: .switch computed width/height/borderRadius match DS spec"
        status: pass
    human_judgment: false
  - id: D3
    description: "routes/+page.svelte's 5 hub buttons migrated to shared .btn/.btn--accent (1x) and .btn/.btn--menu (4x) classes; local .menu-btn/.menu-btn--accent/.profiles-toggle CSS fully deleted"
    requirement: COMP-01
    verification:
      - kind: e2e
        ref: "e2e/full-match-flow.spec.ts — getByRole('button', {name:'Neues Spiel'}) still found and clicked successfully"
        status: pass
      - kind: unit
        ref: "grep -c \"menu-btn\\|profiles-toggle\" src/routes/+page.svelte — zero matches"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full regression suite (unit+browser+E2E) stays green after the migration"
    verification:
      - kind: unit
        ref: "npx vitest run — 528/528 tests passed (32 files)"
        status: pass
      - kind: e2e
        ref: "npx playwright test — 8/8 tests passed"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-14
status: complete
---

# Phase 9 Plan 01: Core Components — Shared Button/Switch Classes Summary

**Built the shared `.btn` (5 DS variants + 4 discretionary extensions) and `.switch`/`.thumb` toggle classes in a new `src/styles/components.css`, wired it into `app.css`, and proved it out by migrating the hub page's 5 buttons off local `.menu-btn` CSS.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-14T01:23:00+02:00
- **Completed:** 2026-07-14T01:26:00+02:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Created `src/styles/components.css` with `.btn` base + `.btn--menu/--accent/--cta/--destructive/--cancel` (the 5 DS Button.jsx variants) plus `.btn--ghost/--icon/--surface/--destructive-outline` (discretionary extensions for icon-only, flat-surface, and outline-destructive buttons not covered by the DS's 5 variants)
- Added the shared `.switch`/`.thumb` custom toggle-switch classes (56×34, spring-eased thumb) transcribed verbatim from `design/components/core/ToggleRow.jsx`
- Wired `components.css` into `app.css` as the 6th `@import`
- Migrated `routes/+page.svelte`'s 5 hub buttons to the shared classes and deleted all local `.menu-btn`/`.menu-btn--accent`/`.profiles-toggle` CSS in the same commit (Pitfall 3 sweep)
- Added a new Wave-0 browser-mode test (`src/ui/shared/components-css.test.ts`) proving 5 computed-style assertions against the shared classes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/styles/components.css and wire it into app.css** - `652eb41` (feat)
2. **Task 2: Migrate routes/+page.svelte to shared classes** - `12d029f` (feat)
3. **Task 3: Wave-0 browser test for shared .btn/.switch computed styles** - `8be54f4` (test)

_Plan metadata commit hash recorded below after this SUMMARY is committed._

## Files Created/Modified
- `src/styles/components.css` (NEW) - `.btn` base + 5 DS variants + 4 discretionary extensions + `.switch`/`.thumb` toggle primitive
- `src/app.css` (MODIFIED) - added `@import './styles/components.css';` as 6th import
- `src/routes/+page.svelte` (MODIFIED) - 5 buttons migrated to shared classes; local button CSS deleted
- `src/ui/shared/components-css.test.ts` (NEW) - browser-mode computed-style proof for shared classes

## Decisions Made
- `components.css` import placed immediately after `fonts.css` (6th import, before `* { box-sizing: border-box; }`), per plan spec
- `profiles-toggle` class removed entirely from `routes/+page.svelte`'s "Spieler verwalten" button — it carried no meaningful CSS (only a now-redundant `font-weight: 400`) and wasn't referenced by tests or logic; `aria-expanded` stays on the button element itself
- New test file placed at `src/ui/shared/components-css.test.ts` to match the `browser` Vitest project's `include: ['src/ui/**/*.test.ts']` glob, even though the code under test is plain CSS

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None - this plan only adds CSS classes and swaps class attributes on existing buttons; no new network endpoints, auth paths, file access, or schema changes.

## Next Phase Readiness

- `src/styles/components.css` is now the canonical source for `.btn`/`.switch` classes; Plans 09-02 through 09-07 can consume these class names directly (`.btn--menu`, `.btn--accent`, `.btn--cta`, `.btn--destructive`, `.btn--cancel`, `.btn--ghost`, `.btn--icon`, `.btn--surface`, `.btn--destructive-outline`, `.switch`/`.thumb`).
- `routes/+page.svelte` stands as the validated "canonical .menu-btn source" migration other button-swap plans should pattern-match against.
- Full regression suite (528 unit/browser tests + 8 E2E tests) confirmed green before handoff — no blockers for subsequent Phase 9 plans.

---
*Phase: 09-core-components*
*Completed: 2026-07-14*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all 3 task commits (652eb41, 12d029f, 8be54f4) confirmed in git log.
