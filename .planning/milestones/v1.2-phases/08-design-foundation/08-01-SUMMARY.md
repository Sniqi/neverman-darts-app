---
phase: 08-design-foundation
plan: 01
subsystem: ui
tags: [css, design-tokens, playwright, reduced-motion, chrome-90]

# Dependency graph
requires: []
provides:
  - "src/styles/colors.css — full DS color token set, Chrome-90-safe (no color-mix())"
  - "src/styles/elevation.css — DS radius/shadow/motion-duration tokens + global prefers-reduced-motion collapse"
  - "src/styles/typography.css — DS type scale + base body/link/selection/focus-visible styles"
  - "src/styles/spacing.css — DS spacing + touch-target scale"
  - "src/app.css rewritten as a 4-import token aggregator + box-sizing reset"
  - "e2e/reduced-motion.spec.ts — automated proof the reduced-motion collapse works end-to-end"
affects: [08-02, 08-03, 08-04, 08-05, 08-06, phase-09, phase-10, phase-11, phase-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DS token files copied verbatim into src/styles/ from design/tokens/, imported from src/app.css; design/ stays untouched/re-syncable"
    - "color-mix() derivatives precomputed to static rgba() for Chrome-90 (Cast receiver) safety"
    - "src/app.css is a thin @import aggregator, no inline token values"

key-files:
  created:
    - src/styles/colors.css
    - src/styles/elevation.css
    - src/styles/typography.css
    - src/styles/spacing.css
    - e2e/reduced-motion.spec.ts
  modified:
    - src/app.css

key-decisions:
  - "src/app.css does not import fonts.css yet (that file is created in 08-02) — importing it now would break the build with an unresolved-import error"
  - "typography.css and spacing.css copied byte-for-byte from design/tokens/ (verified via diff, 0 differences)"
  - "6 color-mix() derived tokens precomputed to static rgba(): --accent-soft, --accent-line, --focus-ring, --destructive-soft, --destructive-line, --positive-soft (colors.css) + --glow-accent (elevation.css)"

patterns-established:
  - "Chrome-90-safe token pattern: precompute color-mix(in oklab, X%, transparent) to a static rgba() at the same alpha, applied consistently across colors.css and elevation.css"
  - "Reduced-motion E2E pattern: playwright/test with page.emulateMedia({ reducedMotion: 'reduce' }), assert computed style numerically (parseFloat) rather than exact string match, since browsers format sub-millisecond durations differently"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04]

coverage:
  - id: D1
    description: "src/styles/colors.css and elevation.css created with full DS token set, 0 color-mix() occurrences (Chrome-90 safe)"
    requirement: "FOUND-01"
    verification:
      - kind: other
        ref: "grep -c 'color-mix' src/styles/colors.css src/styles/elevation.css → 0, 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "src/styles/typography.css and spacing.css created (byte-identical to design/tokens/ sources); src/app.css rewritten as a 4-import aggregator with no old provisional values"
    requirement: "FOUND-03"
    verification:
      - kind: other
        ref: "diff design/tokens/{typography,spacing}.css src/styles/{typography,spacing}.css → no differences"
        status: pass
      - kind: unit
        ref: "npm run build (Vite CSS import resolution)"
        status: pass
      - kind: unit
        ref: "npx vitest run --project unit → 435/435 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "prefers-reduced-motion collapses all animation/transition durations app-wide, proven end-to-end via a new automated E2E test"
    requirement: "FOUND-04"
    verification:
      - kind: e2e
        ref: "e2e/reduced-motion.spec.ts#collapses .toggle-arrow transition duration to near-zero"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 1: DS Token Layer + Reduced-Motion Proof Summary

**Four DS CSS token files (colors, elevation, typography, spacing) copied into `src/styles/`, `src/app.css` rewritten as a thin import aggregator, and a new Playwright E2E test proves `prefers-reduced-motion` actually collapses transitions app-wide.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-13T19:46:29Z
- **Completed:** 2026-07-13T19:50:06Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Established the full DS token layer (`colors.css`, `elevation.css`, `typography.css`, `spacing.css`) in `src/styles/`, with all 6 Chrome-90-unsafe `color-mix()` tokens replaced by precomputed static `rgba()` values
- Rewrote `src/app.css` from a 42-line provisional token file into a 4-import aggregator, deferring the `fonts.css` import to 08-02
- Added `e2e/reduced-motion.spec.ts`, the first automated proof in the suite that the global reduced-motion collapse actually overrides a component's own transition duration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/styles/colors.css and src/styles/elevation.css with Chrome-90-safe static rgba** - `a757bdb` (feat)
2. **Task 2: Create src/styles/typography.css and src/styles/spacing.css, rewrite src/app.css as aggregator** - `a506952` (feat)
3. **Task 3: Add an E2E test proving prefers-reduced-motion collapses all motion** - `1d7290d` (test)

**Plan metadata:** (recorded below in Final Commit)

_Note: no TDD tasks in this plan; each commit is a single feat/test commit._

## Files Created/Modified
- `src/styles/colors.css` - Full DS color token set (surfaces, text, accent, semantic, hairlines, dartboard fills); 6 color-mix() derivatives precomputed to static rgba()
- `src/styles/elevation.css` - DS radius/shadow/motion tokens + verbatim global `@media (prefers-reduced-motion: reduce)` collapse; `--glow-accent` precomputed to static rgba()
- `src/styles/typography.css` - DS type scale + base body/link/selection/focus-visible rules (byte-identical to `design/tokens/typography.css`)
- `src/styles/spacing.css` - DS spacing + touch-target scale (byte-identical to `design/tokens/spacing.css`)
- `src/app.css` - Rewritten as a 4-import aggregator (colors, typography, spacing, elevation) + `box-sizing: border-box` reset; no more inline `:root` block or hardcoded values
- `e2e/reduced-motion.spec.ts` - New Playwright E2E test: emulates `reducedMotion: 'reduce'`, asserts `.toggle-arrow`'s computed `transitionDuration` collapses to <1ms

## Decisions Made
- Deferred the `fonts.css` `@import` in `src/app.css` to 08-02 (per plan instruction) — adding it now would break the Vite build since the file doesn't exist yet
- Precomputed values for the 6 color-mix() derivatives matched exactly the values specified in the plan/PATTERNS.md (base color at the stated alpha)

## Deviations from Plan

**1. [Rule 1 - Bug] Removed literal "color-mix" substring from colors.css header comment**
- **Found during:** Task 1 verification (`grep -c 'color-mix' src/styles/colors.css` returned 2, not 0)
- **Issue:** The doc-comment at the top of the newly written `colors.css` used the prose phrase "color-mix(in oklab)" to describe the derivation, which caused the acceptance criterion's literal grep gate (0 occurrences of the substring `color-mix`) to fail even though no CSS `color-mix()` function was actually present
- **Fix:** Reworded the comment to describe the precomputation without using the literal substring "color-mix"
- **Files modified:** src/styles/colors.css
- **Verification:** `grep -c 'color-mix' src/styles/colors.css src/styles/elevation.css` → 0, 0
- **Committed in:** a757bdb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial wording fix to satisfy a literal grep gate; no functional change. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The DS token layer is fully in place for 08-02 (fonts) to build on — `src/app.css` is ready to receive the `@import './styles/fonts.css';` line once that file exists
- The reduced-motion collapse is proven working before any component sweep (08-03 onward) begins, satisfying FOUND-04's foundational precondition
- Full test suite (`npx vitest run`) at 512/512 passing; `npm run build` clean

---
*Phase: 08-design-foundation*
*Completed: 2026-07-13*

## Self-Check: PASSED

All created files verified present on disk (src/styles/{colors,elevation,typography,spacing}.css, src/app.css, e2e/reduced-motion.spec.ts, this SUMMARY.md). All 3 task commit hashes (a757bdb, a506952, 1d7290d) verified present in git log.
