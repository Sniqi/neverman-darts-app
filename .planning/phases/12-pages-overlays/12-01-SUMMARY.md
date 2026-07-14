---
phase: 12-pages-overlays
plan: 01
subsystem: ui
tags: [svelte, css-tokens, design-system]

# Dependency graph
requires:
  - phase: 08-design-tokens
    provides: "--space-*, --text-*, --radius-*, --row-h tokens"
  - phase: 09-shared-primitives
    provides: ".btn variants, .switch, .chip, .seg-btn, .stepper-* primitives"
provides:
  - "Start hub (routes/+page.svelte) restyled to DS 520px column, DS spacing, DS title type scale, boxed profiles-panel"
  - "Match setup (MatchSetup.svelte) restyled to DS 520px column, 'Neues Spiel' h1 at DS type scale, DS section headings"
  - "PlayerPicker.svelte rows restyled to DS radius/height/border"
affects: [12-02, 12-03, 12-04, 12-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DS list-box container pattern: background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); padding: var(--space-md) — reused for collapsible panel wrappers"

key-files:
  created: []
  modified:
    - src/routes/+page.svelte
    - src/ui/setup/MatchSetup.svelte
    - src/ui/setup/PlayerPicker.svelte

key-decisions:
  - "Setup h1 copy changed from 'Neverman Darts' to 'Neues Spiel' per DS literal — confirmed zero test coupling via MatchSetup.test.ts grep before editing"

patterns-established:
  - "DS list-box container: background var(--surface) + 1px var(--line) border + var(--radius-md) + var(--space-md) padding, applied to .profiles-panel"

requirements-completed: [PAGE-01]

coverage:
  - id: D1
    description: "Start hub renders in centered 520px column with DS spacing and DS title type scale"
    requirement: "PAGE-01"
    verification:
      - kind: unit
        ref: "npm test (563/563 passing after edit)"
        status: pass
    human_judgment: false
  - id: D2
    description: "'Profile verwalten' collapsible section renders as bordered, radius-16 list box"
    requirement: "PAGE-01"
    verification: []
    human_judgment: true
    rationale: "Visual box appearance (border/radius/background rendering) requires human/visual confirmation; no automated visual regression test exists for this component."
  - id: D3
    description: "Setup page title reads 'Neues Spiel' at DS type scale; section headings use DS lg scale"
    requirement: "PAGE-01"
    verification:
      - kind: unit
        ref: "src/ui/setup/MatchSetup.test.ts (1/1 passing, 4 switch accessible-name queries unaffected)"
        status: pass
    human_judgment: false
  - id: D4
    description: "PlayerPicker rows show DS hairline border, DS row height (64px), DS radius (12px)"
    requirement: "PAGE-01"
    verification: []
    human_judgment: true
    rationale: "Visual row appearance (border visibility, spacing) requires human/visual confirmation; no automated visual regression test exists for this component."

duration: 5min
completed: 2026-07-14
status: complete
---

# Phase 12 Plan 01: Hub & Setup DS Restyle Summary

**Restyled start hub and match setup screens to the DS 520px column with token-based spacing/typography and a bordered profiles list-box, closing requirement PAGE-01.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-14T07:17:00+02:00
- **Completed:** 2026-07-14T07:19:03+02:00
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- Start hub (`routes/+page.svelte`) now uses the DS 520px centered column, `--space-3xl`/`--space-lg` padding, DS `--text-xl` title typography with tight letter-spacing, tightened `.menu` gap, and a bordered/radius-16 `.profiles-panel` list-box wrapping `<ProfileManager />`
- Match setup (`MatchSetup.svelte`) now uses the DS 520px column, DS bottom padding, "Neues Spiel" h1 copy at DS `--text-xl` scale, DS `--text-lg` section headings (all 6 sections), and DS `--text-base` back-button size
- `PlayerPicker.svelte` player rows now use DS `--radius-sm` (12px), DS `--row-h` (64px) min-height, and a visible 1px `--line` hairline border

## Task Commits

Each task was committed atomically:

1. **Task 1: Hub restyle (routes/+page.svelte)** - `0bcc598` (feat)
2. **Task 2: Setup + PlayerPicker restyle** - `195f1c6` (feat)

**Plan metadata:** _pending final commit_

## Files Created/Modified
- `src/routes/+page.svelte` - 520px column, DS spacing/title typography, boxed `.profiles-panel`
- `src/ui/setup/MatchSetup.svelte` - 520px column, "Neues Spiel" h1 at DS type scale, 22px section headings
- `src/ui/setup/PlayerPicker.svelte` - DS row radius/height/border on `.player-row`

## Decisions Made
- None beyond what the plan specified — pure token/copy transcription against the pre-approved UI-SPEC diff tables. Confirmed via grep that `MatchSetup.test.ts` has no coupling to the old h1 copy before making the copy change.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing a11y lint warnings (missing aria-label on toggle switches, lines 226/261/278/300 in MatchSetup.svelte) and an unrelated `unknown_element` warning in `SpectatorChooser.svelte` appeared in test output but are pre-existing, out of scope for this plan's files/changes, and unrelated to the DS restyle — not modified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Hub and setup screens now match DS parity (PAGE-01 complete); `npm test` remains 563/563 green.
- Plans 12-02 through 12-05 (history list/detail, stats dashboard, data/backup, overlays/toasts) are unblocked and can proceed independently — no shared file conflicts with this plan's scope.
- Visual/box appearance of `.profiles-panel` and `.player-row` (D2/D4 above) awaits human UAT confirmation per phase's end-of-phase human_verify_mode.

---
*Phase: 12-pages-overlays*
*Completed: 2026-07-14*

## Self-Check: PASSED
