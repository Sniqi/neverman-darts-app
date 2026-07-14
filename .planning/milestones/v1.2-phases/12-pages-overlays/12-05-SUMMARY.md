---
phase: 12-pages-overlays
plan: 05
subsystem: ui
tags: [svelte, css-tokens, design-system, pwa, cast]

# Dependency graph
requires:
  - phase: 09-core-components
    provides: ".btn/.btn--cta/.btn--ghost shared button classes and DS spacing/type-scale tokens"
  - phase: 12-pages-overlays (12-04)
    provides: "overlay restyle precedent for token-only CSS transcription against 12-UI-SPEC.md"
provides:
  - "ReloadPrompt.svelte restyled to DS surface-2/line-strong toast tokens with shared .btn--cta/.btn--ghost buttons"
  - "ResumeToast.svelte restyled to DS surface-2 background and token-based heading/body text"
  - "data/+page.svelte restyled to 520px column width and DS type scale"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Thin local .btn override (.pwa-toast-actions .btn { flex: 1; width: auto; }) to lay out full-width-by-default shared .btn classes side-by-side inside a fixed-width toast — same pattern as Phase 9's .btn-resume/.btn-discard hooks"

key-files:
  created: []
  modified:
    - src/ui/pwa/ReloadPrompt.svelte
    - src/ui/pwa/ReloadPrompt.test.ts
    - src/ui/cast/ResumeToast.svelte
    - src/routes/data/+page.svelte

key-decisions:
  - "ReloadPrompt border-color test updated in the same commit as the CSS change (border now targets --line-strong, not --accent) — required to keep the suite green per RESEARCH Pitfall 1"
  - "ResumeToast heading/body font-size token swap applied as a Claude's-Discretion consistency pass (UI-SPEC marked it optional); radius/shadow/accent-stripe/enter-animation left untouched as directed"

patterns-established: []

requirements-completed: [PAGE-04]

coverage:
  - id: D1
    description: "ReloadPrompt (PWA update toast) shows DS surface-2 background, --line-strong border, token-based padding/text-size, and shared .btn--cta/.btn--ghost buttons; onclick handlers and button text unchanged"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "src/ui/pwa/ReloadPrompt.test.ts (6 tests, including 'PLAT-04: toast has position:fixed and neutral hairline (--line-strong) border color')"
        status: pass
    human_judgment: false
  - id: D2
    description: "ResumeToast (Cast resume toast) shows DS surface-2 background; radius/shadow/accent-stripe/enter-animation unchanged"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "npm test full suite (563/563 passed, no ResumeToast regression)"
        status: pass
    human_judgment: true
    rationale: "No dedicated ResumeToast visual/computed-style test exists in the suite; background token swap is verified by full-suite green (no behavior change) but the visual result needs human/UAT confirmation."
  - id: D3
    description: "data/+page.svelte renders in the 520px column with DS type scale; export/import/storage-warning flows behaviorally unchanged"
    requirement: "PAGE-04"
    verification:
      - kind: unit
        ref: "npm test full suite (563/563 passed, data page tests unaffected — style-only diff, no script-block edits)"
        status: pass
    human_judgment: true
    rationale: "No dedicated visual/computed-style test asserts the 520px width or type-scale values; confirmed via code review that only <style> was touched, but final visual sign-off needs human/UAT."

duration: 8min
completed: 2026-07-14
status: complete
---

# Phase 12 Plan 05: PWA/Cast Toasts + Data Page Restyle Summary

**Restyled ReloadPrompt, ResumeToast, and the data/backup page to DS surface-2/line-strong toast tokens and the shared type scale, with the ReloadPrompt border-color test updated in the same commit to avoid breaking the suite.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-14T07:32:58+02:00 (branch point after 12-04)
- **Completed:** 2026-07-14T07:35:59+02:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ReloadPrompt (PWA update toast) now uses `--surface-2` background, `--line-strong` border, token-based padding/text-size, and shared `.btn--cta`/`.btn--ghost` buttons; all bespoke `button {}` CSS removed
- ReloadPrompt.test.ts's border-color assertion updated to the new `--line-strong` computed value in the same commit as the CSS change; `position: fixed` check kept intact
- ResumeToast (Cast resume toast) background moved to `--surface-2`; heading/body font-size moved to `--text-base`/`--text-sm`; radius/shadow/accent-stripe/enter-animation left unchanged
- data/+page.svelte widened to 520px column with DS type-scale tokens on title, section headings, and body text; export/import/storage-warning script logic untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: ReloadPrompt restyle + same-commit test update** - `b5014f6` (feat)
2. **Task 2: ResumeToast + Data/backup page restyle** - `bfde939` (feat)

**Plan metadata:** (pending — see final commit below)

## Files Created/Modified
- `src/ui/pwa/ReloadPrompt.svelte` - `.pwa-toast` restyled to DS surface-2/line-strong tokens; buttons swapped to shared `.btn--cta`/`.btn--ghost`; bespoke button CSS removed
- `src/ui/pwa/ReloadPrompt.test.ts` - border-color assertion renamed/updated to assert `--line-strong` instead of accent
- `src/ui/cast/ResumeToast.svelte` - background moved to `--surface-2`; heading/body font-size moved to type-scale tokens
- `src/routes/data/+page.svelte` - `.screen` widened to 520px; title/section-heading/body text moved to DS type-scale tokens

## Decisions Made
- ReloadPrompt border-color test update landed in the same commit as the CSS change (RESEARCH Pitfall 1) — a literal CSS-only transcription would have broken the test since it asserted the exact accent rgb value the border moved away from
- ResumeToast text token swap treated as optional discretionary consistency pass per UI-SPEC, applied without touching radius/shadow/accent-stripe/animation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 4 targeted files now match their DS toast/type-scale specs; PAGE-04 requirement complete
- Full `npm test` suite green at 563/563 (includes the browser-mode ReloadPrompt tests run via the unified `vitest run`)
- This was the final plan of Phase 12 (12-pages-overlays) — phase ready for closeout/milestone review

---
*Phase: 12-pages-overlays*
*Completed: 2026-07-14*

## Self-Check: PASSED

All 4 target files and the SUMMARY.md were found on disk; both task commits (`b5014f6`, `bfde939`) verified present in `git log`.
