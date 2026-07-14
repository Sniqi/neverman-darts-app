---
phase: 10-scoring-surface
verified: 2026-07-14T05:00:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Active player's remaining score renders at 96px/800 with amber inset edge + glow; inactive at 44px/700 — uniformly in portrait AND landscape (3-4 player landscape clipping fixed via playerCount-gated compact clamp, plan 10-05)"
  gaps_remaining: []
  regressions: []
---

# Phase 10: Scoring Surface Verification Report

**Phase Goal:** The touch-scoring screen (`/match`) visually matches the DS scoring specs while every existing scoring behavior stays unchanged.
**Verified:** 2026-07-14T05:00:00Z (re-verification after gap closure)
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 10-05, commits 629182a / 978257a / c7edc33)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Numpad shows DS-sized keys/digits (76px/40px/32px), visible pressed state, ⌫ backspace, and still enters scores correctly | ✓ VERIFIED | `src/ui/input/Numpad.svelte` — `.key`/`.digit-key`/`.confirm-key`/`.input-display` all migrated to `--key-h`/`--text-3xl`/`--text-2xl`/`--text-lg` tokens; amber gradient confirm key; `aria-label="Letzte Ziffer löschen"` on ⌫; `pressDigit`/`pressClear`/`pressConfirm`/`pressBackspace`/`isValidVisitTotal` script block byte-identical (diff-verified); `Numpad.test.ts` 6/6 pass; WR-01 inset-shadow fix applied (`box-shadow: inset 0 2px 6px rgba(0,0,0,.35)` present) |
| 2 | Dartboard renders DS board colors + active-touch highlight; polar hit detection, enlarged rings, and segment geometry keep working exactly as before | ✓ VERIFIED | `git diff c7372da..HEAD -- src/ui/input/Dartboard.svelte` shows zero changes to `screenToBoard`/`classifyHit`/`buildRegions`/`segmentStartAngle`/`polarToXY`/`describeAnnularSlice`/`describeFullCircle`/any `R_*` radius constant (grep-confirmed); only 5 literal color/opacity/font-size edits + 2 test-selector attributes; the 3 pre-existing dispatch tests plus 3 new flash/float tests all pass (6/6); WR-03 fix applied (`color = '#ffffff'` for single-hit float) |
| 3 | Visit strip shows pill-shaped dart notation (`T20`, `D16`, `Bull (50)`, `✕`) with the triple-flash color on triple hits | ✓ VERIFIED | The LIVE `/match` strip is `match/+page.svelte`'s `.dart-column`/`.dart-pill` (not the orphaned `VisitStrip.svelte` — confirmed dead via `grep -rn "VisitStrip.svelte" src/`, only self-reference + a comment). `dart-notation.ts` `formatDart` produces exactly `T20`/`D16`/`Bull (50)`/`Bull (25)`/`✕` (6/6 unit tests pass); `.dart-pill` has `border-radius: var(--radius-pill)` (999); `.dart-pill--triple` uses `--accent` (amber, applies to true triples AND both bulls per DS); `.dart-pill--double` uses `--accent-double`; `.dart-pill--miss` dashed `--text-faint`; bust uses precomputed `#f27c79` + `--destructive-soft`/`--destructive-line` + strikethrough; `e2e/dart-notation.spec.ts` proves live board-tap → pill text wiring (1/1 pass); WR-02 fix applied (18px/600/tabular-nums base pill typography, was 16px/400) |
| 4 | Score panel shows the active player in the large amber-edged treatment, inactive players smaller, checkout suggestions with an amber glow, and a red BUST flash — all matching current scoring behavior exactly | ✓ VERIFIED | Amber-edged treatment (`inset 4px 0 0 var(--accent)` + `--glow-accent`), 96px/800 vs 44px/700 typography (via `--text-score-active`/`--weight-heavy`), amber-glowing checkout pill (17px/700/999px/`--glow-accent`), and BUST-via-DartPill treatment (per CONTEXT.md Q2; `grep -c "bust" ScorePanel.svelte` = 0, red struck-through pill lives in `match/+page.svelte`) all implemented and unit-tested (`ScorePanel.test.ts` 6/6 incl. 2 new compact-mode tests, `CheckoutSuggestion.test.ts` 1/1). Store-read logic (`{#each}`/`isActive`/`matchStore.suggestion` guard) byte-identical. **Gap closed (10-05):** 3-4 player landscape clipping fixed — see Gap Closure Evidence below. |

**Score:** 7/7 must-haves verified (4 roadmap Success Criteria + the 3 plan-level invariant truths: Numpad validation/shake unchanged, Dartboard hit-detection byte-identical, VisitLine.svelte/Phase-11 boundary untouched)

### Gap Closure Evidence (Re-verification, plan 10-05)

The single gap from the initial verification (active player's 96px score clipped with 3-4 players in landscape at 1024×768; `.score-panel` scrollWidth 338 > clientWidth 324; screenshot showed "501" rendering as truncated "50") is **closed**:

**Fix (commit 978257a):** `ScorePanel.svelte` gained a `playerCount` derived value and a `class:compact={playerCount >= 3}` binding on `.score-panel`. Two new rules, scoped entirely INSIDE the existing `@media (orientation: landscape)` block:
- `.score-panel.compact .player-card { padding: 10px 4px; }`
- `.score-panel.compact .remaining-active { font-size: clamp(22px, 4vw, var(--text-score-active)); }`

2-player landscape and ALL portrait scenarios are untouched — the `.compact` class is absent below 3 players, and the rules only exist inside the landscape media query, so the DS 96px scale still applies everywhere it fits.

**Verification performed:**

| Check | Command / Method | Result |
|-------|------------------|--------|
| New E2E regression spec (reproduces the exact original failing scenario: 1024×768, 3 and 4 guest players, scrollWidth ≤ clientWidth on panel + every card, active-score bounding-rect contained in its card) | `e2e/score-panel-landscape.spec.ts` (commit 629182a, RED-first) via `npx playwright test` | ✓ 2/2 pass |
| New unit tests (compact class present at 4 players; absent at 2 players with `.remaining-active` still 96px) | `src/ui/input/ScorePanel.test.ts` (2 tests appended) | ✓ pass |
| Full Vitest suite | `npx vitest run` | ✓ 557/557 (39 files) |
| Full Playwright suite | `npx playwright test` | ✓ 12/12 |
| Independent visual re-probe (verifier's own throwaway spec, not committed): full-page screenshots at 1024×768 with 3 and 4 guest players | Ad-hoc Playwright screenshot + image inspection | ✓ All scores render fully unclipped — "501" complete and readable in every card (active and inactive) in both the 3- and 4-player case; active-player amber treatment intact |
| Fix regresses nothing else | Diff review of 978257a (12 insertions, 1 line changed in ScorePanel.svelte, all inside/adjacent to the landscape media block) + full suites green | ✓ No regressions |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/ui/input/Numpad.svelte` | DS 76px/40px/32px restyle, ⌫ aria-label, script untouched | ✓ VERIFIED | Confirmed by reading file; matches plan + WR-01 fix |
| `src/ui/input/Numpad.test.ts` | 6 computed-style/interaction tests | ✓ VERIFIED | 6 `test(...)` blocks present, all pass |
| `src/ui/input/Dartboard.svelte` | Flash/float literal-value fixes, hit-detection byte-identical | ✓ VERIFIED | 5 literal edits + 2 selector attrs only; diff confirms no math changes |
| `src/ui/input/Dartboard.test.ts` | 3 original + 3 new tests | ✓ VERIFIED | 6 tests total, all pass |
| `src/ui/input/dart-notation.ts` | Shared `formatDart` module | ✓ VERIFIED | Exports exactly `formatDart(dart: DartScore): string` per locked contract |
| `src/ui/input/dart-notation.test.ts` | 6 unit tests | ✓ VERIFIED | 6/6 pass |
| `src/routes/match/+page.svelte` | Live dart-pill restyle + shared formatDart import | ✓ VERIFIED | Imports `formatDart` from `dart-notation.js`; `.dart-pill--triple/--double/--miss` classes present; WR-02 typography fix applied |
| `src/ui/input/VisitStrip.svelte` | Consistency-only formatDart swap (orphaned, no restyle) | ✓ VERIFIED | Imports shared `formatDart`; no class/CSS restyling added (matches locked Q1 decision) |
| `e2e/dart-notation.spec.ts` | New isolated E2E spec | ✓ VERIFIED | 1/1 pass, isolated from `full-match-flow.spec.ts` |
| `src/ui/input/ScorePanel.svelte` | DS ScoreCard restyle, landscape override removed, compact-mode overflow mitigation | ✓ VERIFIED | Typography/box-shadow per DS; playerCount-gated `.compact` clamp closes the landscape overflow gap (10-05) |
| `src/ui/input/CheckoutSuggestion.svelte` | Amber-glowing pill | ✓ VERIFIED | 17px/700/999px radius/`--glow-accent`, D-12 null-suggestion guard untouched |
| `src/ui/input/ScorePanel.test.ts` | 4 computed-style tests + 2 compact-mode tests | ✓ VERIFIED | 6/6 pass |
| `src/ui/input/CheckoutSuggestion.test.ts` | 1 computed-style test | ✓ VERIFIED | 1/1 pass |
| `e2e/score-panel-landscape.spec.ts` | Landscape overflow regression spec (gap closure) | ✓ VERIFIED | 2/2 pass (3-player and 4-player scenarios) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `Numpad.svelte` | `isValidVisitTotal` (`engine/impossible-scores.ts`) | unchanged import/handler wiring | ✓ WIRED | Diff shows zero script changes |
| `Dartboard.svelte` | dispatch/`onhit` callback | `handlePointerDown` unchanged | ✓ WIRED | 3 pre-existing dispatch tests pass unmodified |
| `match/+page.svelte` | `dart-notation.ts` | `import { formatDart } from '../../ui/input/dart-notation.js'` | ✓ WIRED | Grep-confirmed single import, zero local `formatDart` left |
| `VisitStrip.svelte` | `dart-notation.ts` | `import { formatDart } from './dart-notation.js'` | ✓ WIRED | Consistency-only, component remains unrendered (orphaned, expected) |
| `ScorePanel.svelte` | `matchStore.state.players`/`activePlayerIndex` | `{#each}` + `isActive` derivation + new `playerCount` derived | ✓ WIRED | `class:compact={playerCount >= 3}` proven live by E2E (compact behavior observable at 1024×768 with 3-4 players) |
| `CheckoutSuggestion.svelte` | `matchStore.suggestion` | `{#if matchStore.suggestion !== null}` guard | ✓ WIRED | Unchanged script; D-12 null-suggestion behavior preserved |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full Vitest suite | `npx vitest run` | 557/557 passed (39 files) | ✓ PASS |
| Full Playwright suite | `npx playwright test` | 12/12 passed | ✓ PASS |
| Production build | `npm run build` | Built successfully, static output + SW precache generated | ✓ PASS |
| Design-tokens forbidden-hex guard | `npx vitest run src/lib/design-tokens.test.ts` | 11/11 passed | ✓ PASS |
| Dartboard hit-detection byte-identity | `git diff c7372da..HEAD -- src/ui/input/Dartboard.svelte` grepped for math-function names | 0 matches — no changes to `screenToBoard`/`classifyHit`/`buildRegions`/`R_*`/etc. | ✓ PASS |
| 3-4 player landscape score-panel overflow (was FAIL in initial verification) | `e2e/score-panel-landscape.spec.ts` (2 tests) + independent verifier screenshot probe | No overflow: scrollWidth ≤ clientWidth on panel and every card; screenshots show all "501" scores fully rendered in 3p and 4p landscape | ✓ PASS |
| 2-player landscape unaffected by compact fix | `ScorePanel.test.ts` compact-absence test + earlier 2-player screenshot | `.compact` absent, `.remaining-active` stays 96px | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|-------------|-------------|--------|----------|
| SCOR-01 | 10-01 | Numpad matches DS spec (76px keys, 32px digits, press states, ⌫) | ✓ SATISFIED | Numpad.svelte restyle + Numpad.test.ts, WR-01 fix applied |
| SCOR-02 | 10-02 | Dartboard DS colors + active-touch highlight, geometry unchanged | ✓ SATISFIED | Dartboard.svelte literal-value fixes + Dartboard.test.ts, WR-03 fix applied |
| SCOR-03 | 10-03 | Visit strip/dart pills match DS specs (radius, notation, triple flash) | ✓ SATISFIED | dart-notation.ts + match/+page.svelte restyle + e2e/dart-notation.spec.ts, WR-02 fix applied |
| SCOR-04 | 10-04 + 10-05 | Score panel matches DS ScoreCard spec (active/inactive treatment, checkout glow, BUST red) | ✓ SATISFIED | ScorePanel/CheckoutSuggestion restyle + landscape compact clamp (10-05) + e2e/score-panel-landscape.spec.ts regression coverage |

No orphaned requirements — all 4 SCOR-01..04 IDs declared in plan frontmatter match `.planning/REQUIREMENTS.md`'s Phase 10 mapping exactly.

### Anti-Patterns Found

No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) found in any file modified across the 5 plans. No stub returns, empty handlers, or hardcoded-empty-data patterns found.

Two Info-level findings from `10-REVIEW.md` were explicitly and knowingly left unfixed (correctly out of scope, not gaps):
- IN-01: `VisitStrip.svelte` is dead code (never imported) — flagged for a future milestone-audit/cleanup decision, per the phase's own locked Q1 decision (CONTEXT.md) not to delete pre-existing dead code.
- IN-02: `.dart-pill--triple` class naming is arguably ambiguous (amber, not red, despite the name) — cosmetic, explicitly won't-fix per REVIEW-FIX.md.

### Human Verification Required

None. The one item originally flagged as "manual-only" (3-4 player landscape overflow) was settled with objective automated evidence: it FAILED in the initial verification (screenshot-confirmed clipping), was fixed in plan 10-05, and now PASSES both the committed E2E regression spec and an independent verifier screenshot probe. No aesthetic judgment remains open.

### Gaps Summary

No gaps remaining. The initial verification found one gap — the active player's 96px score was clipped with 3-4 players in landscape (1024×768) after Plan 10-04 removed the landscape font overrides without a replacement mitigation. Plan 10-05 closed it with a playerCount-gated `.compact` clamp (`clamp(22px, 4vw, 96px)` + compact padding) scoped strictly to the ≥3-player landscape case, preserving the DS 96px scale everywhere else, and added both unit and E2E regression coverage so the failure mode can't silently return. All suites green (557/557 vitest, 12/12 Playwright), build succeeds, no regressions.

---

_Verified: 2026-07-14T05:00:00Z (re-verification)_
_Verifier: Claude (gsd-verifier)_
