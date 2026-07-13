---
phase: 08-design-foundation
plan: 03
subsystem: ui
tags: [svelte, css-custom-properties, design-tokens, motion, tabular-nums]

# Dependency graph
requires:
  - phase: 08-design-foundation (08-01, 08-02)
    provides: DS token files (src/styles/*.css), src/app.css aggregator, self-hosted fonts
provides:
  - 15 scoring-input/dialog/overlay/toast components fully swept to DS tokens (zero hardcoded hex/rgba)
  - Dartboard.svelte board segment fills mapped to --board-single/-red/-green/-stroke/-bg
  - Numpad.svelte radius/motion/tabular-nums exceptions applied per CONTEXT.md's locked decisions
  - ReloadPrompt.test.ts PLAT-04 assertion updated to new accent RGB + app.css import pattern
    for isolated component tests that assert computed var()-driven colors
affects: [09-core-components, 10-scoring-surface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Text-on-accent-fill pairs use var(--on-accent), never var(--bg), even though both were
      visually similar under the old palette"
    - "Isolated Vitest browser-mode component tests that assert getComputedStyle() on a
      var(--token)-driven property must import the global token stylesheet (src/app.css)
      directly in the test file, since no root layout is rendered in isolation"
    - "Locked motion-duration exceptions (Numpad shake 400ms, Dartboard score-float 1.6s) keep
      their literal duration but adopt var(--ease); PauseOverlay's zeroFlashFade was NOT a
      documented exception and was retimed to var(--dur-slow)"

key-files:
  created: []
  modified:
    - src/ui/input/CheckoutSuggestion.svelte
    - src/ui/input/VisitStrip.svelte
    - src/ui/input/ScorePanel.svelte
    - src/ui/input/DartsAtDoubleDialog.svelte
    - src/ui/dialogs/ConfirmDialog.svelte
    - src/ui/input/Numpad.svelte
    - src/ui/input/CorrectionWindow.svelte
    - src/ui/input/StatDrawer.svelte
    - src/ui/input/Dartboard.svelte
    - src/ui/cast/ResumeToast.svelte
    - src/ui/overlays/RecordOverlay.svelte
    - src/ui/overlays/PauseOverlay.svelte
    - src/ui/overlays/MatchWinOverlay.svelte
    - src/ui/pwa/ReloadPrompt.svelte
    - src/ui/pwa/ReloadPrompt.test.ts
    - src/ui/start/ResumePrompt.svelte

key-decisions:
  - "VisitStrip's bust background (old rgba(192,57,43,0.3)) mapped to var(--destructive-line)
    (0.40 alpha) as the nearest available destructive-alpha token — no 0.3 token exists"
  - "Overlay scrims with no exact DS token (rgba(17,19,24,0.88/0.92/0.96), rgba(0,0,0,0.6)) all
    mapped to var(--backdrop), the DS token explicitly documented for dialog/overlay scrims"
  - "Dartboard's translucent white flash highlights (rgba(255,255,255,0.35/0.15)) mapped to
    var(--text-faint) as the nearest neutral faint-white token; exact board flash treatment
    is explicitly deferred to Phase 10 per the phase boundary"
  - "Dartboard's per-dart float text stroke (rgba(0,0,0,0.75)) mapped to var(--backdrop) as the
    nearest near-black token available"
  - "Toast/card/sheet radii not already on a var() (6/8/12px hardcoded) mapped by DS role:
    buttons/keys -> --radius-sm, cards/toasts -> --radius-md, dialogs/sheets -> --radius-lg"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-04]

coverage:
  - id: D1
    description: "All 15 files show 0 hardcoded hex/rgba color literals (grep gate)"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "grep -Ec '#[0-9a-fA-F]{3,6}|rgba\\(' across all 15 files"
        status: pass
    human_judgment: false
  - id: D2
    description: "Numpad shake (400ms) and Dartboard score-float (1.6s) locked motion
      exceptions preserved; PauseOverlay zeroFlashFade retimed to 300ms"
    requirement: "FOUND-04"
    verification:
      - kind: unit
        ref: "grep 'shake 400ms' src/ui/input/Numpad.svelte; grep 'score-float 1.6s' src/ui/input/Dartboard.svelte"
        status: pass
    human_judgment: false
  - id: D3
    description: "ReloadPrompt.test.ts PLAT-04 asserts new accent RGB (240, 164, 36)"
    requirement: "FOUND-01"
    verification:
      - kind: automated_ui
        ref: "src/ui/pwa/ReloadPrompt.test.ts#PLAT-04: toast has position:fixed and accent (#f0a424) border color"
        status: pass
    human_judgment: false
  - id: D4
    description: "ScorePanel and Numpad score-bearing elements use --font-score + tabular-nums"
    requirement: "FOUND-02"
    verification:
      - kind: unit
        ref: "grep 'font-family: var(--font-score)' src/ui/input/ScorePanel.svelte src/ui/input/Numpad.svelte"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full test suite stays green (no regressions from the sweep)"
    verification:
      - kind: unit
        ref: "npm test (vitest run, both projects)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 3: Sweep Scoring-Input/Dialog/Overlay Components Summary

**Swept 15 scoring-input, dialog, and overlay/toast components to DS color/radius/motion tokens, including Dartboard's inline SVG script colors and the two locked motion-duration exceptions (Numpad shake 400ms, Dartboard score-float 1.6s).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-13T22:41:00+02:00 (approx.)
- **Completed:** 2026-07-13T22:52:00+02:00
- **Tasks:** 3
- **Files modified:** 16 (15 planned + app.css import added to ReloadPrompt.test.ts as a Rule 3 fix)

## Accomplishments
- Replaced all hardcoded hex/rgba color literals across 15 components (both `<style>` blocks and Dartboard's inline `<script>` SVG fill/stroke logic) with DS `var(--token)` equivalents
- Dropped all `var(--token, #fallback)` dead fallbacks in these 15 files
- Retimed 12 transitions/animations to `--dur-*`/`--ease` tokens; ConfirmDialog's `dialogIn` uses `--ease-spring`
- Preserved both locked motion exceptions verbatim (Numpad `shake` at 400ms, Dartboard `score-float` at 1.6s with its custom cubic-bezier), only swapping their easing keyword where directed
- Retimed PauseOverlay's `zeroFlashFade` from 800ms to `var(--dur-slow)` (300ms) — confirmed NOT a DS-documented exception
- Applied `--font-score` + `tabular-nums` to ScorePanel's `.remaining` and Numpad's `.input-display`/`.digit-key`
- Applied `--press-scale` to every pre-existing `:active` state across the 15 files
- Fixed the correct text-on-accent-fill pairing (`var(--on-accent)`, not `var(--bg)`) on ConfirmDialog's `.cta-accent`, Numpad's `.confirm-key`, PauseOverlay's `.weiter-btn`, MatchWinOverlay's `.new-game-btn`, and ResumePrompt's `.btn-resume`

## Task Commits

Each task was committed atomically:

1. **Task 1: Sweep CheckoutSuggestion, VisitStrip, ScorePanel, DartsAtDoubleDialog, ConfirmDialog** - `0d70de2` (feat)
2. **Task 2: Sweep Numpad, CorrectionWindow, StatDrawer, Dartboard, ResumeToast** - `82d22dd` (feat)
3. **Task 3: Sweep RecordOverlay, PauseOverlay, MatchWinOverlay, ReloadPrompt (+ its test), ResumePrompt** - `d6ed562` (feat)

**Plan metadata:** (pending — this commit)

## Files Created/Modified
- `src/ui/input/CheckoutSuggestion.svelte` - Accent color token swap only
- `src/ui/input/VisitStrip.svelte` - Colors, radius (`--radius-sm`), motion, press-scale
- `src/ui/input/ScorePanel.svelte` - Colors, fallback cleanup, `--font-score` + tabular-nums on `.remaining`
- `src/ui/input/DartsAtDoubleDialog.svelte` - Colors, sheet radius (`--radius-lg`), motion, press-scale
- `src/ui/dialogs/ConfirmDialog.svelte` - Colors, dialog radius (`--radius-lg`), `dialogIn` spring easing, on-accent text fix, press-scale
- `src/ui/input/Numpad.svelte` - Colors, `.input-display`/`.key`/`.confirm-key` -> `--radius-sm`, shake kept at 400ms w/ `--ease`, tabular-nums on digit/entry elements, on-accent text fix, press-scale
- `src/ui/input/CorrectionWindow.svelte` - Colors, motion (progress-fill kept `linear` for real-time correctness)
- `src/ui/input/StatDrawer.svelte` - Colors, fallback cleanup, motion
- `src/ui/input/Dartboard.svelte` - Board segment fills + flash highlights (script and template), score-float kept at 1.6s unchanged
- `src/ui/cast/ResumeToast.svelte` - Fallback cleanup only (colors already tokenized)
- `src/ui/overlays/RecordOverlay.svelte` - Colors, motion
- `src/ui/overlays/PauseOverlay.svelte` - Colors, `zeroFlashFade` retimed to `--dur-slow`, on-accent text fix, press-scale
- `src/ui/overlays/MatchWinOverlay.svelte` - Colors, radius, motion, on-accent text fix, press-scale
- `src/ui/pwa/ReloadPrompt.svelte` - Colors, radius (`--radius-md`/`--radius-sm`), shadow token, on-accent text fix, press-scale
- `src/ui/pwa/ReloadPrompt.test.ts` - PLAT-04 literal updated to new accent RGB; added `app.css` import so the isolated component render resolves `--accent`
- `src/ui/start/ResumePrompt.svelte` - Colors, radius, motion, on-accent text fix, press-scale

## Decisions Made
- Ambiguous colors/radii with no exact 1:1 entry in the old→new mapping table were resolved by nearest-DS-token-by-role, per CONTEXT.md's explicit discretion clause (documented in frontmatter `key-decisions`)
- CorrectionWindow's progress-bar fill transition kept `linear` easing (not `var(--ease)`) since it drives a real-time countdown redraw every animation frame — switching to a cubic-bezier easing would visibly stutter a value that is already being recomputed continuously; only its duration was retimed to `var(--dur-fast)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ReloadPrompt.test.ts PLAT-04 assertion failed after fallback removal**
- **Found during:** Task 3 (ReloadPrompt sweep + test update)
- **Issue:** Per Sweep Rule 3, `var(--accent, #e8a020)` had its fallback dropped to `var(--accent)`. This component test renders `ReloadPrompt.svelte` in isolation via `vitest-browser-svelte` (no root `+layout.svelte`, so `src/app.css`'s `:root` token definitions were never loaded into the test's document). With the fallback gone, `getComputedStyle().borderColor` resolved to unset/initial (`rgb(0, 0, 0)`) instead of the new accent value, failing the updated PLAT-04 assertion.
- **Fix:** Added `import '../../app.css';` to `ReloadPrompt.test.ts` so the DS `:root` tokens are present in the test's document, letting `var(--accent)` resolve to the real DS value for the computed-style assertion.
- **Files modified:** src/ui/pwa/ReloadPrompt.test.ts
- **Verification:** `npx vitest run --project=browser src/ui/pwa/ReloadPrompt.test.ts` — all 6 tests pass
- **Committed in:** d6ed562 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to satisfy the plan's own acceptance criterion (PLAT-04 test must pass with the new RGB). No scope creep — the fix is scoped to the one test file this plan's Task 3 already modifies.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 15 files in this plan's scope are free of hardcoded colors; full test suite (30 files, 512 tests) passes
- Phase 9 (Core Components) and Phase 10 (Scoring Surface) can build on these tokens without further foundation work in this component set
- No blockers

---
*Phase: 08-design-foundation*
*Completed: 2026-07-13*

## Self-Check: PASSED

All 15 modified component files + `ReloadPrompt.test.ts` + this SUMMARY.md confirmed present on disk. All 3 task commits (`0d70de2`, `82d22dd`, `d6ed562`) confirmed present in `git log`.
