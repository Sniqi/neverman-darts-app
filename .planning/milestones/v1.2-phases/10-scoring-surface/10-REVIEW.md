---
phase: 10-scoring-surface
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/ui/input/Numpad.svelte
  - src/ui/input/Numpad.test.ts
  - src/ui/input/Dartboard.svelte
  - src/ui/input/Dartboard.test.ts
  - src/ui/input/dart-notation.ts
  - src/ui/input/dart-notation.test.ts
  - src/ui/input/ScorePanel.svelte
  - src/ui/input/ScorePanel.test.ts
  - src/ui/input/CheckoutSuggestion.svelte
  - src/ui/input/CheckoutSuggestion.test.ts
  - src/ui/input/VisitStrip.svelte
  - src/routes/match/+page.svelte
  - e2e/dart-notation.spec.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the Phase 10 "Scoring Surface" restyle diff (`c7372da..HEAD`) against `.planning/phases/10-scoring-surface/10-UI-SPEC.md`. Confirmed the required invariants hold: Dartboard geometry (`R_INNER_BULL`/`R_OUTER_BULL`/`R_INNER_SINGLE`/`R_TRIPLE_END`/`R_OUTER_SINGLE`/`R_DOUBLE_END`/`R_MISS_OUTER`, `viewBox`, `screenToBoard`/`classifyHit`/`buildRegions`/`segmentStartAngle`) is byte-identical — only fill colors, flash opacity, and float-label font-size/stroke changed. No `engine/` or `stores/` files are touched by this diff (confirmed via `git diff --stat`). The new `dart-notation.ts` module correctly consolidates the two in-scope duplicate `formatDart` helpers (`match/+page.svelte`, `VisitStrip.svelte`) to the new DS strings (`'✕'`, `'Bull (50)'`, `'Bull (25)'`), and `audio-caller.ts` / `VisitLine.svelte` / `CorrectionWindow.svelte` each keep their own independent, unmodified `formatDart` copies (verified via diff and grep), so caller announcements and the Phase-11-scoped spectator notation are unaffected. All 23 relevant Vitest specs pass (`npx vitest run` on the 5 test files); DS token values (`--key-h`, `--text-3xl`, `--text-score-active`, `--accent`, `--radius-pill`, etc.) resolve to the exact numbers the tests assert, and the new tests assert real DS literals rather than tautologies. One color-mix precompute (`#f27c79` for the bust dart-pill) was independently verified against the OKLab formula in the code comment and is exact to the pixel.

No Critical/blocker issues found — this is a low-risk, behavior-preserving visual pass. Three Warning-level DS-spec compliance gaps were found (missed CSS declarations/values from `10-UI-SPEC.md` that shipped without test coverage to catch them), plus two Info-level quality notes.

## Warnings

### WR-01: Numpad entry display is missing the spec-required inset shadow

**File:** `src/ui/input/Numpad.svelte:96-110`
**Issue:** `10-UI-SPEC.md:164` requires the numpad entry display to have `inset 0 2px 6px rgba(0,0,0,.35)` (depth cue distinguishing the recessed input from the raised keys). The `.input-display` rule sets `height`, `background`, `border`, `font-*`, and `transition`, but never sets `box-shadow`. `Numpad.test.ts` doesn't assert `box-shadow` for this element, so the gap shipped silently.
**Fix:**
```css
.input-display {
	height: var(--key-h);
	background: var(--bg-deep);
	border: 2px solid var(--line-strong);
	border-radius: var(--radius-sm);
	box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
	color: var(--text);
	...
}
```

### WR-02: Live `.dart-pill` typography does not match the DS DartPill contract

**File:** `src/routes/match/+page.svelte:451-486`
**Issue:** `10-UI-SPEC.md:77` specifies the DartPill notation type scale as `18px literal / 600 / --font-ui / line-height: 1.1 / letter-spacing: 0.01em / tabular-nums`. The base `.dart-pill` rule (which this diff otherwise restyled — background/border/border-radius/color all moved to DS values, and `dart-pill--triple`/`--double`/`--miss` variant classes were newly added per the color contract) still ships the pre-existing `font-size: 16px; font-weight: 400;` with no `line-height`, `letter-spacing`, or `font-variant-numeric: tabular-nums`. Only the variant classes bump `font-weight` to 600 — the base (empty slot, plain single-hit) stays at 400, and font-size is never corrected to 18px anywhere. There is no test file covering `match/+page.svelte`'s dart-pill CSS at all, so this partial-implementation gap is invisible to CI.
**Fix:**
```css
.dart-pill {
	width: 76px;
	height: 52px;
	...
	font-size: 18px;
	font-weight: 600;
	line-height: 1.1;
	letter-spacing: 0.01em;
	font-variant-numeric: tabular-nums;
	color: var(--text-soft);
	...
}
```
Add a component test (mirroring the pattern in `ScorePanel.test.ts`/`Numpad.test.ts`) asserting the computed `fontSize`/`fontWeight`/`letterSpacing` for `.dart-pill` so this doesn't regress silently again.

### WR-03: Dartboard "single hit" floating-label color deviates from the DS literal

**File:** `src/ui/input/Dartboard.svelte:47-49`
**Issue:** `10-UI-SPEC.md:128` (Dartboard floating-label colors table) specifies the "Single" hit label color as the literal `#ffffff`, with no "nearest token" allowance (unlike the Miss row, which explicitly permits mapping to the nearest grey token). The code uses `color = 'var(--text)'`, which resolves to `#eef1f6`, not pure white. `Dartboard.test.ts` doesn't assert the single-hit float color, so this deviation is untested.
**Fix:** Either use the literal value (`color = '#ffffff';`) to match the DS table exactly, or add an explicit comment noting the intentional nearest-token substitution (consistent with how the Miss row's `--text-muted` substitution is documented in the spec itself).

## Info

### IN-01: `VisitStrip.svelte` is dead code

**File:** `src/ui/input/VisitStrip.svelte`
**Issue:** This component is not imported anywhere in `src/` (confirmed via `grep -rn "VisitStrip.svelte" src/` — the only hits are the file itself and a comment in `VisitLine.svelte`). The live "three dart slots" UI on `/match` is implemented entirely inline in `match/+page.svelte` (`.dart-pill` markup/CSS), not via `<VisitStrip>`. Phase 10 spent real effort wiring the new consolidated `formatDart` import into this file, but it has no effect on the shipped app and its DS-spec typography gaps (`--control-h` height, `--text-md` label size, filled/empty variants per `10-UI-SPEC.md:178`) were never applied here or anywhere else, since nothing renders it.
**Fix:** No action required for this phase (out of scope), but worth flagging to the team: either wire `VisitStrip` into `/match` (replacing the duplicated inline markup in `+page.svelte`) in a future phase, or delete it to avoid maintainers mistaking it for the live component.

### IN-02: `dart-pill--triple` class name is misleading given its accent/amber styling

**File:** `src/routes/match/+page.svelte:342, 467-472`
**Issue:** The class is applied to true triples AND both bull variants, and styles them with `--accent` (amber) tokens — this is correct per `10-UI-SPEC.md`'s explicit instruction (point 4 in the Color section) that DartPill's "triple" treatment is intentionally amber/accent, unlike the Dartboard's own float-label color table where triple/inner-bull use the red `--triple` token. However, because the rest of the codebase (e.g. `Dartboard.svelte`'s `--triple: #ff7d75`) uses "triple" to mean red, a maintainer skimming `+page.svelte` in isolation could reasonably expect `.dart-pill--triple` to use `--triple`/red, not `--accent`/amber.
**Fix:** Consider renaming to something unambiguous, e.g. `dart-pill--accent` or `dart-pill--big-hit`, with a one-line comment cross-referencing the DS's "two independent color specs" note. Not required — purely a readability suggestion.

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
