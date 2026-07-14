---
phase: 11-spectator-display
plan: 01
subsystem: ui
tags: [svelte, dart-notation, formatter-consolidation, spectator-display]

# Dependency graph
requires: []
provides:
  - "formatDartShort export in src/ui/input/dart-notation.ts (short/pill dart notation, transcribed verbatim from design/components/scoring/DartPill.jsx)"
  - "VisitLine.svelte consolidated onto the shared formatDartShort (no local copy)"
affects: [11-03-player-panel-restyle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-formatter split in dart-notation.ts: formatDart (long form) vs formatDartShort (pill/short form) — both documented in the module header, both sourced from the same DartScore input type"

key-files:
  created: []
  modified:
    - src/ui/input/dart-notation.ts
    - src/ui/input/dart-notation.test.ts
    - src/ui/display/VisitLine.svelte
    - src/ui/display/VisitLine.test.ts

key-decisions:
  - "formatDartShort's outer-bull string is 'Outer' (not 'Bull' or 'Outer Bull'), matching design/components/scoring/DartPill.jsx literally — per CONTEXT.md's resolved Q1 that the .jsx is the authoritative value source over the UI-SPEC's prose paraphrase"

patterns-established:
  - "Formatter consolidation pattern: components needing dart-pill notation import formatDartShort from src/ui/input/dart-notation.ts rather than defining a local copy (PlayerPanel.svelte will follow this in Plan 11-03)"

requirements-completed: [DISP-01, DISP-04]

coverage:
  - id: D1
    description: "formatDartShort exported from dart-notation.ts, transcribed verbatim from DartPill.jsx (miss -> ✕, inner bull -> Bull, outer bull -> Outer, else {T|D}{segment})"
    requirement: "DISP-01"
    verification:
      - kind: unit
        ref: "src/ui/input/dart-notation.test.ts#formatDartShort: single segment renders plain number (+5 more formatDartShort tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "VisitLine.svelte consolidated onto the shared formatDartShort; local formatDart copy deleted"
    requirement: "DISP-04"
    verification:
      - kind: unit
        ref: "src/ui/display/VisitLine.test.ts#formatDart: inner bull / miss / outer bull / double / triple (all 10 tests)"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-07-14
status: complete
---

# Phase 11 Plan 01: Shared dart-pill notation formatter Summary

**Added `formatDartShort` to dart-notation.ts (transcribed verbatim from DartPill.jsx) and consolidated VisitLine.svelte's local copy onto it, eliminating one of two duplicated short-form dart formatters ahead of Plan 11-03's PlayerPanel.svelte restyle.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-14T04:00:00Z (approx.)
- **Completed:** 2026-07-14T04:06:00Z (approx.)
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `formatDartShort` exported from `src/ui/input/dart-notation.ts`, returning the exact same four literal shapes as `design/components/scoring/DartPill.jsx`'s `formatDart`: `'✕'` (miss), `'Bull'` (inner bull), `'Outer'` (outer bull), `${prefix}${segment}` (else)
- Module header comment rewritten to document the two-formatter split (`formatDart` long form vs `formatDartShort` short/pill form) and their respective consumers
- `VisitLine.svelte`'s local `formatDart` function deleted; both call sites (`liveSlotText`, `completedBreakdown`) now use the shared `formatDartShort`
- `VisitLine.test.ts`'s three bull/miss assertions updated to the new short-form strings (`'✕'`, `'Bull'`, `'Outer'`) instead of the old long-form ones (`'0 (Daneben)'`, `'Bull'`, `'Outer Bull'`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add formatDartShort to dart-notation.ts, transcribed verbatim from DartPill.jsx** - `c358e23` (feat)
2. **Task 2: Consolidate VisitLine.svelte onto the shared formatDartShort; update its planned test-string changes** - `e862474` (refactor)

**Plan metadata:** (pending — this commit)

_Note: Both tasks were single commits; no separate RED/GREEN split was needed since tests and implementation were written together per task per the plan's action instructions._

## Files Created/Modified
- `src/ui/input/dart-notation.ts` - Added `formatDartShort` export; rewrote stale header comment
- `src/ui/input/dart-notation.test.ts` - Added 6 new unit tests for `formatDartShort`
- `src/ui/display/VisitLine.svelte` - Deleted local `formatDart`; imports and uses shared `formatDartShort`
- `src/ui/display/VisitLine.test.ts` - Updated 3 test assertions/titles to short-form strings

## Decisions Made
- Outer bull renders as `'Outer'` (not `'Bull'` or `'Outer Bull'`), matching `DartPill.jsx` literally per CONTEXT.md's resolved Q1 — the `.jsx` is the authoritative value source over the UI-SPEC's prose paraphrase.

## Deviations from Plan

None - plan executed exactly as written.

**Minor documentation-only discrepancies noted (not code deviations):**
- Task 1's verify command in PLAN.md reads `npx vitest run --project unit src/ui/input/dart-notation.test.ts`, but per `vite.config.ts`'s project `include` patterns, files under `src/ui/**` are routed to the `browser` project, not `unit`. Running with `--project=browser` (or with no `--project` flag, which auto-selects the correct project) passes all 12 tests. No code change was needed — this is purely a stale flag in the plan's verify command text.
- Task 2's acceptance criteria states "All 9 tests in VisitLine.test.ts pass" but the file actually contains 10 tests (all passing). Likely an off-by-one in the plan's prose, not a functional issue.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `formatDartShort` is now available in `src/ui/input/dart-notation.ts` for Plan 11-03 (wave 2) to consume in `PlayerPanel.svelte`'s own consolidation, per this plan's cross-plan dependency.
- Full Vitest suite green: 39 test files, 563 tests passing (`npm test`).
- No blockers for Plan 11-02 or 11-03.

---
*Phase: 11-spectator-display*
*Completed: 2026-07-14*

## Self-Check: PASSED
