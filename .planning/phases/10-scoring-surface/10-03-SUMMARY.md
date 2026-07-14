---
phase: 10-scoring-surface
plan: 03
subsystem: ui
tags: [svelte, dartpill, notation, tdd, playwright]

# Dependency graph
requires:
  - phase: 08-design-foundation
    provides: "--accent-soft/--accent-line/--accent-double/--destructive-soft/--destructive-line/--text-faint/--text-soft/--radius-pill design tokens"
provides:
  - "Shared src/ui/input/dart-notation.ts formatDart module (single source of truth for scoring-surface notation)"
  - "Live /match dart-pill strip restyled to DS DartPill.jsx states (triple/bull/double/miss/bust)"
  - "New E2E coverage proving board-tap -> pill-notation wiring"
affects: [11-display-surface]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared pure-formatting helper module (dart-notation.ts) consumed by two Svelte components, keeping a third (VisitLine.svelte) deliberately independent for a later phase"
    - "Precomputed static hex (#f27c79) in place of a live color-mix() expression, per the project-wide Chrome-90 static-precompute rule"

key-files:
  created:
    - src/ui/input/dart-notation.ts
    - src/ui/input/dart-notation.test.ts
    - e2e/dart-notation.spec.ts
  modified:
    - src/routes/match/+page.svelte
    - src/ui/input/VisitStrip.svelte

key-decisions:
  - "Consolidated the two in-scope duplicate formatDart copies (match/+page.svelte, VisitStrip.svelte) into one shared dart-notation.ts module per CONTEXT.md's Discretion carve-out"
  - "VisitStrip.svelte (orphaned, never rendered) received ONLY the formatDart import swap -- no CSS/class restyling, per the plan-checker-revised scope boundary"
  - "Bust text color shipped as precomputed static #f27c79 rather than live color-mix(), consistent with the project's Chrome-90 rule even though /match itself doesn't run on the Cast receiver"

patterns-established:
  - "New dart-pill state classes (dart-pill--triple/--double/--miss) derived from the existing DartScore, no store/reducer changes -- a pattern for any future scoring-surface visual state"

requirements-completed: [SCOR-03]

coverage:
  - id: D1
    description: "Shared dart-notation.ts formatDart matches the locked DS notation contract (single/T-prefix/D-prefix/Bull (50)/Bull (25)/miss) with 6 unit tests"
    requirement: "SCOR-03"
    verification:
      - kind: unit
        ref: "src/ui/input/dart-notation.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live /match dart-pill strip renders the 3 new DS visual states (triple/bull amber, double pale amber, miss dashed) plus bust struck-through treatment, wired from the same DartScore the Dartboard/Numpad already dispatch"
    requirement: "SCOR-03"
    verification:
      - kind: e2e
        ref: "e2e/dart-notation.spec.ts (Bull (50) and T20 aria-labels asserted via real dartboard taps)"
        status: pass
      - kind: unit
        ref: "npm test (550/550 pass, full Vitest suite green after the restyle)"
        status: pass
    human_judgment: true
    rationale: "Exact visual colors/borders (amber glow vs pale amber vs dashed vs struck-through red) are asserted structurally (class bindings, token names) but not pixel-verified -- a human dev-server spot-check confirms the DS visual intent per CONTEXT.md's supplementary verification note."
  - id: D3
    description: "VisitLine.svelte and VisitLine.test.ts (Phase 11 scope) remain byte-unchanged and green -- the phase boundary guardrail"
    verification:
      - kind: unit
        ref: "src/ui/display/VisitLine.test.ts (10/10 pass, unchanged); grep -c formatDart on VisitLine.svelte stays 4"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-14
status: complete
---

# Phase 10 Plan 3: Dart-Pill Notation & DS Restyle Summary

**Consolidated the two in-scope duplicate `formatDart` helpers into one shared `src/ui/input/dart-notation.ts` module, restyled the LIVE `/match` dart-pill strip to DS `DartPill.jsx`'s triple/bull/double/miss/bust states, and closed a zero-coverage E2E gap for board-tap-driven notation.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-14T03:47:00Z
- **Completed:** 2026-07-14T03:51:06Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- New shared `dart-notation.ts` module (6/6 unit tests, TDD RED→GREEN) is now the single source of truth for scoring-surface dart notation, replacing two duplicate local copies
- `match/+page.svelte`'s LIVE `.dart-column`/`.dart-pill` strip (the surface players actually see — confirmed via RESEARCH.md that `VisitStrip.svelte` is orphaned dead code) now renders the DS `DartPill.jsx` visual contract: triple/bull amber glow, pale-amber doubles, dashed misses, and a precomputed-static-color struck-through bust state
- New isolated `e2e/dart-notation.spec.ts` drives the real Dartboard SVG via `page.mouse.click` and proves the live wiring end-to-end (inner bull → "Bull (50)", triple-20 → "T20"), growing the Playwright suite from 9 to 10 passing specs
- `src/ui/display/VisitLine.svelte` + its test (Phase 11 scope) are provably untouched (grep-verified byte-unchanged) and stay green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared dart-notation.ts module + unit tests (RED then GREEN)** - `b1b7d90` (feat)
2. **Task 2: Wire shared helper + restyle match/+page.svelte's dart-pill and VisitStrip.svelte for consistency (GREEN)** - `b642d68` (feat)
3. **Task 3: New isolated E2E spec proving live dart-pill notation wiring** - `7c5bb8e` (test)

**Plan metadata:** (final commit below)

## Files Created/Modified
- `src/ui/input/dart-notation.ts` - Shared `formatDart(dart: DartScore): string` per the locked DS notation contract
- `src/ui/input/dart-notation.test.ts` - 6 unit tests covering every DartScore branch
- `src/routes/match/+page.svelte` - Imports shared `formatDart` (removed local copy + unused `DartScore` type import); `.dart-pill` restyled with `--dart-pill--triple/--double/--miss` classes and precomputed-static bust color
- `src/ui/input/VisitStrip.svelte` - Imports shared `formatDart` (removed local copy + unused `DartScore` type import); no other changes (orphaned/consistency-only)
- `e2e/dart-notation.spec.ts` - New isolated Playwright spec proving board-tap → pill-notation wiring

## Decisions Made
- Consolidated both in-scope duplicate `formatDart` copies into `dart-notation.ts`, per CONTEXT.md's "Claude's Discretion" carve-out allowing this refactor when output stays byte-identical
- Kept `VisitStrip.svelte` changes to the single authorized formatDart-import swap — no CSS/class restyling, since the plan was explicitly revised by the plan-checker to scope this file down to consistency-only
- Shipped the bust text color as a precomputed static `#f27c79` rather than a live `color-mix()` expression, matching the project-wide Chrome-90 rule even though `/match` itself doesn't render on the Cast receiver (consistency + cheap insurance per PATTERNS.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SCOR-03 is fully wired on the live scoring surface; `VisitLine.svelte` (Phase 11 — the `/display` surface) still carries the OLD notation strings and its own duplicate `formatDart`, exactly as intended for Phase 11 to pick up and align
- Full Vitest suite (550/550) and full Playwright suite (10/10) both green — no regressions carried forward

---
*Phase: 10-scoring-surface*
*Completed: 2026-07-14*

## Self-Check: PASSED

All created files found on disk; all 3 task commit hashes (b1b7d90, b642d68, 7c5bb8e) verified in git log.
