---
phase: 10-scoring-surface
fixed_at: 2026-07-14T02:20:26Z
review_path: .planning/phases/10-scoring-surface/10-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-07-14T02:20:26Z
**Source review:** .planning/phases/10-scoring-surface/10-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (all Warning-tier — user-scoped this run to WR-01..03 only)
- Fixed: 3
- Skipped: 0

Note: IN-01 (dead `VisitStrip.svelte`) and IN-02 (`dart-pill--triple` class naming) were explicitly excluded from this run's scope per the dispatching instructions (documented milestone-audit item / cosmetic wont-fix respectively) — not attempted, not counted above.

## Fixed Issues

### WR-01: Numpad entry display is missing the spec-required inset shadow

**Files modified:** `src/ui/input/Numpad.svelte`
**Commit:** 28c9273
**Applied fix:** Added `box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);` to the `.input-display` rule, matching `10-UI-SPEC.md:164` exactly. Verified the current code state matched the review's cited lines before editing; no other properties on the rule were touched.

### WR-02: Live `.dart-pill` typography does not match the DS DartPill contract

**Files modified:** `src/routes/match/+page.svelte`
**Commit:** 71e61ae
**Applied fix:** Changed the base `.dart-pill` rule's `font-size: 16px; font-weight: 400;` to `font-size: 18px; font-weight: 600;` and added `line-height: 1.1; letter-spacing: 0.01em; font-variant-numeric: tabular-nums;`, matching `10-UI-SPEC.md:77`'s DartPill notation type-scale row exactly. Confirmed `font-family: var(--font-ui)` is already inherited globally from the `body` rule in `src/styles/typography.css:45`, so it did not need to be added locally (consistent with the review's own Fix snippet, which omitted it). Did not add the review's *suggested* new component test (mirroring `ScorePanel.test.ts`/`Numpad.test.ts`) — that was framed as a follow-up recommendation, not part of the cited CSS gap, and was out of this run's explicit 3-item scope.

### WR-03: Dartboard "single hit" floating-label color deviates from the DS literal

**Files modified:** `src/ui/input/Dartboard.svelte`
**Commit:** 0f6f0bc
**Applied fix:** Changed the single-hit branch of `spawnFloat()` from `color = 'var(--text)'` to the literal `color = '#ffffff';`, matching the DS source of truth (`design/components/scoring/Dartboard.jsx:64`: `else { label = String(dart.segment); color = '#ffffff'; }`) and `10-UI-SPEC.md:128`'s floating-label color table, which specifies `#ffffff` as a hard literal (no nearest-token allowance, unlike the Miss row). Confirmed `#ffffff` is not on the forbidden-values list in `src/lib/design-tokens.test.ts` before applying.

## Skipped Issues

None — all 3 in-scope findings were fixed cleanly with no rollbacks required.

## Verification

- `npx vitest run`: 555/555 passed (39 test files) — no new/adjusted assertions were needed; none of the phase's existing tests asserted the old gap values (font-size/box-shadow/color) that changed here.
- `npx playwright test`: 10/10 passed.
- `src/lib/design-tokens.test.ts` (FOUND-01 forbidden-color guard): passed — `#ffffff` is not on the forbidden-values list, so the WR-03 literal is safe.

---

_Fixed: 2026-07-14T02:20:26Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
