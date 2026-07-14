---
phase: 08-design-foundation
plan: 06
subsystem: testing
tags: [dexie, vitest, design-tokens, regression-test]

# Dependency graph
requires:
  - phase: 08-design-foundation (08-01 through 08-05)
    provides: Full component/page/CSS sweep replacing provisional colors with DS tokens
provides:
  - Profile.color default and comment/test fixtures aligned to new DS accent hex
  - Durable src/lib/design-tokens.test.ts regression test guarding zero old provisional colors
affects: [09-typography, 10-core-components, 11-scoring-surface, 12-pages-motion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File-scanning regression test (node fs, no glob dependency) enforcing a forbidden-literal list across .svelte + css entrypoints"

key-files:
  created: [src/lib/design-tokens.test.ts]
  modified: [src/db/profiles.ts, src/db/db.ts, src/db/profiles.test.ts, src/lib/backup.test.ts]

key-decisions:
  - "Profile.color's default updated #e8a020 -> #f0a424 with a one-line rationale comment; confirmed zero UI render path currently reads the field, so this is a data-default change with no visible behavior impact"
  - "design-tokens.test.ts excludes bare 3-digit greys (#444/#333/#888) from its forbidden list to avoid false-positiving on legitimately new DS values; verified no ambiguity exists in the current 5 CSS token files before finalizing the 10-value list"
  - "Used fs.readdirSync recursion instead of adding a glob dependency — small file count (44 .svelte files + 5 css files) makes manual recursion sufficient"

patterns-established:
  - "Pattern: forbidden-literal regression tests live under src/lib/*.test.ts in the node unit project when they're pure file-scanning logic with no DOM need"

requirements-completed: [FOUND-01]

coverage:
  - id: D1
    description: "Profile.color's default value and JSDoc example both use the new DS accent hex (#f0a424), not the old provisional one (#e8a020)"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "src/db/profiles.test.ts#createProfile stores name, derived initial, and default color"
        status: pass
    human_judgment: false
  - id: D2
    description: "A durable automated test locks in zero old provisional colors anywhere in src/ so Phases 9-12 cannot silently reintroduce them"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "src/lib/design-tokens.test.ts#contains zero occurrences of forbidden old value (10 parameterized cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full ~511+ test suite is green at the end of this phase"
    requirement: "FOUND-01"
    verification:
      - kind: unit
        ref: "npm test (vitest run, unit + browser projects): 31 files / 523 tests passed"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-07-13
status: complete
---

# Phase 8 Plan 6: Profile.color Default Sweep + Durable Regression Test Summary

**Profile.color's stored-data default moved to the new DS accent hex, and a new file-scanning Vitest test now durably guards against any old provisional color reappearing anywhere in src/ for Phases 9-12.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-13T23:27Z (approx, first commit)
- **Completed:** 2026-07-13T23:31Z
- **Tasks:** 2 completed
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments
- `Profile.color`'s default literal, its `db.ts` JSDoc example, and 4 companion test-fixture literals (`profiles.test.ts` x1, `backup.test.ts` x3) all now consistently use `#f0a424` instead of the old `#e8a020`
- Confirmed via `grep` that zero occurrences of `#e8a020` remain anywhere in `src/` after this sweep
- New `src/lib/design-tokens.test.ts` scans every `.svelte` file plus `src/app.css` and `src/styles/**/*.css` for 10 forbidden old provisional hex values, verified as a genuine guard (deliberately reintroduced a forbidden literal into a scratch file, confirmed the test went red, reverted, confirmed green again)
- Full test suite (`npm test`): 31 files / 523 tests passing — phase-closing gate for FOUND-01

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Profile.color's default and its comment/test fixtures to the new DS accent** - `9834e20` (feat)
2. **Task 2: Add the durable "no provisional colors" regression test and run the full suite** - `24b28d6` (test)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/db/profiles.ts` - `createProfile()` default color literal changed to `#f0a424` with a one-line rationale comment
- `src/db/db.ts` - `Profile.color` interface JSDoc example updated to reference the new hex
- `src/db/profiles.test.ts` - default-color assertion updated to expect `#f0a424`
- `src/lib/backup.test.ts` - 3 seeded color fixture literals updated to `#f0a424` for consistency
- `src/lib/design-tokens.test.ts` - new durable regression test scanning `src/**/*.svelte` + `src/app.css` + `src/styles/**/*.css` for 10 forbidden old provisional hex values

## Decisions Made
- Profile.color's default is a stored-data field with zero current UI render path (confirmed by grep for `profile.color`/`player.color` across `.svelte` files), so updating it is a safe data-default change, not a behavior regression — matches RESEARCH.md Pitfall 3 / Assumption A1
- design-tokens.test.ts's forbidden list intentionally omits bare 3-digit greys (`#444`, `#333`, `#888`) since they risk false-positiving on legitimately new DS token values; verified the current 5 CSS token files contain none of the 10 finalized forbidden values before locking the list
- Used `fs.readdirSync` recursion rather than installing a glob dependency, since the plan explicitly allowed this given the small file count (44 `.svelte` files, 5 `.css` files)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8 (Design Foundation) is now fully closed: all 6 plans complete, FOUND-01's "zero old provisional colors in src/" gate is both satisfied and durably guarded by an automated test
- Full suite green (31 files / 523 tests) — no new failures introduced; the 6 pre-existing E2E failures documented in `08-design-foundation/deferred-items.md` remain unchanged (out of scope for this plan, `npm test` doesn't run E2E)
- Ready for Phase 9 (Typography) and beyond — the regression test in `src/lib/design-tokens.test.ts` will fail loudly if any future phase accidentally reintroduces an old provisional hex value

---
*Phase: 08-design-foundation*
*Completed: 2026-07-13*

## Self-Check: PASSED

- FOUND: src/lib/design-tokens.test.ts
- FOUND: .planning/phases/08-design-foundation/08-06-SUMMARY.md
- FOUND: 9834e20 (Task 1 commit)
- FOUND: 24b28d6 (Task 2 commit)
