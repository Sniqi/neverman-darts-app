---
phase: 10-scoring-surface
verified: 2026-07-14T04:30:00Z
status: gaps_found
score: 6/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Active player's remaining score renders at 96px/800 with amber inset edge + glow; inactive at 44px/700 — uniformly in portrait AND landscape, no separate smaller landscape scale"
    status: failed
    reason: >
      Plan 10-04 deliberately removed ScorePanel.svelte's `@media (orientation: landscape)`
      typography overrides (32px name / 80px active / 52px inactive / 22px legs) so the DS's
      single 96px/44px scale would apply uniformly, per RESEARCH.md Pitfall 4. This was correctly
      flagged as needing a landscape overflow check, but that check was deferred to a
      non-blocking, human-only spot-check (human_verify_mode=end-of-phase) and never actually run.
      An automated Playwright probe (viewport 1024x768, matching VALIDATION.md's own "3-4 player
      landscape" scenario) plus a full-page screenshot were run ad-hoc during verification and
      show the exact overflow RESEARCH.md warned about: with 3 or 4 players in landscape, the
      active player's 96px score is clipped by its own card — e.g. "501" renders as "50" with
      the "1" hidden behind/under the neighboring card. `.score-panel`'s scrollWidth (338px)
      exceeds its clientWidth (324px) in the 4-player case. 2-player landscape is fine (card is
      wide enough); the bug is specific to 3-4 concurrent player cards, which is exactly the
      scenario the phase's own VALIDATION.md identified as risky and never closed the loop on.
      This is an objective, screenshot-confirmed clipping bug, not an aesthetic judgment call —
      it directly defeats the score panel's purpose (the active player's score must be readable)
      and is a real regression introduced by removing the landscape overrides without adding a
      replacement mitigation (e.g. a with-more-players font clamp, `clamp()`, or a narrower
      DS-compliant landscape scale).
    artifacts:
      - path: src/ui/input/ScorePanel.svelte
        issue: >
          `.remaining-active`/`.remaining-inactive` use the fixed 96px/44px tokens uniformly in
          all orientations and player counts; `.player-card` has no `min-width: 0` fallback that
          also shrinks the font, and no `overflow` handling on `.remaining` to prevent the score
          becoming illegible when the flex column can't fit 3-4 cards at 96px in a ~1024px-wide
          landscape viewport.
    missing:
      - "A landscape/player-count-aware mitigation for the active score (e.g. clamp()-based font-size, a horizontal-scroll allowance with visible affordance, or a reduced but still-DS-consistent scale for 3+ players in landscape) so the active player's remaining score is never visually clipped."
      - "An automated regression test (Playwright, viewport 1024x768, 3-4 guest players) asserting no horizontal overflow/clipping on `.score-panel`/`.player-card`, replacing the never-executed manual spot-check so this can't silently regress again."
---

# Phase 10: Scoring Surface Verification Report

**Phase Goal:** The touch-scoring screen (`/match`) visually matches the DS scoring specs while every existing scoring behavior stays unchanged.
**Verified:** 2026-07-14T04:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Numpad shows DS-sized keys/digits (76px/40px/32px), visible pressed state, ⌫ backspace, and still enters scores correctly | ✓ VERIFIED | `src/ui/input/Numpad.svelte` — `.key`/`.digit-key`/`.confirm-key`/`.input-display` all migrated to `--key-h`/`--text-3xl`/`--text-2xl`/`--text-lg` tokens; amber gradient confirm key; `aria-label="Letzte Ziffer löschen"` on ⌫; `pressDigit`/`pressClear`/`pressConfirm`/`pressBackspace`/`isValidVisitTotal` script block byte-identical (diff-verified); `Numpad.test.ts` 6/6 pass; WR-01 inset-shadow fix applied (`box-shadow: inset 0 2px 6px rgba(0,0,0,.35)` present) |
| 2 | Dartboard renders DS board colors + active-touch highlight; polar hit detection, enlarged rings, and segment geometry keep working exactly as before | ✓ VERIFIED | `git diff c7372da..HEAD -- src/ui/input/Dartboard.svelte` shows zero changes to `screenToBoard`/`classifyHit`/`buildRegions`/`segmentStartAngle`/`polarToXY`/`describeAnnularSlice`/`describeFullCircle`/any `R_*` radius constant (grep-confirmed); only 5 literal color/opacity/font-size edits + 2 test-selector attributes; the 3 pre-existing dispatch tests plus 3 new flash/float tests all pass (6/6); WR-03 fix applied (`color = '#ffffff'` for single-hit float) |
| 3 | Visit strip shows pill-shaped dart notation (`T20`, `D16`, `Bull (50)`, `✕`) with the triple-flash color on triple hits | ✓ VERIFIED | The LIVE `/match` strip is `match/+page.svelte`'s `.dart-column`/`.dart-pill` (not the orphaned `VisitStrip.svelte` — confirmed dead via `grep -rn "VisitStrip.svelte" src/`, only self-reference + a comment). `dart-notation.ts` `formatDart` produces exactly `T20`/`D16`/`Bull (50)`/`Bull (25)`/`✕` (6/6 unit tests pass); `.dart-pill` has `border-radius: var(--radius-pill)` (999); `.dart-pill--triple` uses `--accent` (amber, applies to true triples AND both bulls per DS); `.dart-pill--double` uses `--accent-double`; `.dart-pill--miss` dashed `--text-faint`; bust uses precomputed `#f27c79` + `--destructive-soft`/`--destructive-line` + strikethrough; `e2e/dart-notation.spec.ts` proves live board-tap → pill text wiring (1/1 pass); WR-02 fix applied (18px/600/tabular-nums base pill typography, was 16px/400) |
| 4 | Score panel shows the active player in the large amber-edged treatment, inactive players smaller, checkout suggestions with an amber glow, and a red BUST flash — all matching current scoring behavior exactly | ✗ FAILED (partial) | Amber-edged treatment, 96px/800 vs 44px/700 typography, amber-glowing checkout pill, and the BUST-via-DartPill treatment (per CONTEXT.md Q2, confirmed `grep -c "bust" ScorePanel.svelte` = 0, red struck-through pill lives in `match/+page.svelte`) are all correctly implemented and unit-tested (5/5 pass). Store-read logic (`{#each}`/`isActive`/`matchStore.suggestion` guard) is byte-identical. **However**, removing the landscape-only font overrides (the phase's fix for RESEARCH.md Pitfall 4) causes the active player's 96px score to be **visually clipped** with 3 or 4 players in landscape (1024×768) — screenshot-confirmed (see Gaps below). This was flagged in RESEARCH.md/VALIDATION.md as a manual-only check that was never actually performed before phase sign-off. |

**Score:** 6/7 truths verified (7 = 4 roadmap SCs + Numpad-a11y + Dartboard-hit-detection-invariant + notation-consolidation sub-truths collapsed into the table above; see per-plan must_haves detail below for the full breakdown)

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
| `src/ui/input/ScorePanel.svelte` | DS ScoreCard restyle, landscape override removed | ⚠️ HOLLOW (see gap) | Typography/box-shadow correct in isolation, but the landscape-override removal is unmitigated and causes clipping at 3-4 players |
| `src/ui/input/CheckoutSuggestion.svelte` | Amber-glowing pill | ✓ VERIFIED | 17px/700/999px radius/`--glow-accent`, D-12 null-suggestion guard untouched |
| `src/ui/input/ScorePanel.test.ts` | 4 computed-style tests | ✓ VERIFIED | 4/4 pass (but tests only cover 2-player fixture, not the 3-4 player landscape overflow scenario) |
| `src/ui/input/CheckoutSuggestion.test.ts` | 1 computed-style test | ✓ VERIFIED | 1/1 pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `Numpad.svelte` | `isValidVisitTotal` (`engine/impossible-scores.ts`) | unchanged import/handler wiring | ✓ WIRED | Diff shows zero script changes |
| `Dartboard.svelte` | dispatch/`onhit` callback | `handlePointerDown` unchanged | ✓ WIRED | 3 pre-existing dispatch tests pass unmodified |
| `match/+page.svelte` | `dart-notation.ts` | `import { formatDart } from '../../ui/input/dart-notation.js'` | ✓ WIRED | Grep-confirmed single import, zero local `formatDart` left |
| `VisitStrip.svelte` | `dart-notation.ts` | `import { formatDart } from './dart-notation.js'` | ✓ WIRED | Consistency-only, component remains unrendered (orphaned, expected) |
| `ScorePanel.svelte` | `matchStore.state.players`/`activePlayerIndex` | `{#each}` + `isActive` derivation | ✓ WIRED | Unchanged script; `CheckoutSuggestion` composed conditionally on `isActive` |
| `CheckoutSuggestion.svelte` | `matchStore.suggestion` | `{#if matchStore.suggestion !== null}` guard | ✓ WIRED | Unchanged script; D-12 null-suggestion behavior preserved |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full Vitest suite | `npx vitest run` | 555/555 passed (39 files) | ✓ PASS |
| Full Playwright suite | `npx playwright test` | 10/10 passed | ✓ PASS |
| Production build | `npm run build` | Built successfully, static output + SW precache generated | ✓ PASS |
| Design-tokens forbidden-hex guard | `npx vitest run src/lib/design-tokens.test.ts` | 11/11 passed | ✓ PASS |
| Dartboard hit-detection byte-identity | `git diff c7372da..HEAD -- src/ui/input/Dartboard.svelte` grepped for math-function names | 0 matches — no changes to `screenToBoard`/`classifyHit`/`buildRegions`/`R_*`/etc. | ✓ PASS |
| 3-4 player landscape score-panel overflow (ad-hoc probe, not committed — settling VALIDATION.md's deferred manual-only item) | Throwaway Playwright spec: 1024×768 viewport, 3 and 4 guest players, `/match`, screenshot + `scrollWidth`/`clientWidth` on `.score-panel`/`.player-card` | 4-player: `.score-panel` scrollWidth 338 > clientWidth 324 (14px overflow); screenshot shows active player's "501" rendering as clipped "50" with the trailing digit hidden under the neighboring card. 3-player: same clipping observed visually ("501" → "50" cut off). 2-player: no overflow, renders correctly. | ✗ FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|-------------|-------------|--------|----------|
| SCOR-01 | 10-01 | Numpad matches DS spec (76px keys, 32px digits, press states, ⌫) | ✓ SATISFIED | Numpad.svelte restyle + Numpad.test.ts, WR-01 fix applied |
| SCOR-02 | 10-02 | Dartboard DS colors + active-touch highlight, geometry unchanged | ✓ SATISFIED | Dartboard.svelte literal-value fixes + Dartboard.test.ts, WR-03 fix applied |
| SCOR-03 | 10-03 | Visit strip/dart pills match DS specs (radius, notation, triple flash) | ✓ SATISFIED | dart-notation.ts + match/+page.svelte restyle + e2e/dart-notation.spec.ts, WR-02 fix applied |
| SCOR-04 | 10-04 | Score panel matches DS ScoreCard spec (active/inactive treatment, checkout glow, BUST red) | ✗ BLOCKED (partial) | ScorePanel.svelte/CheckoutSuggestion.svelte restyle is correct in isolation, but the landscape-overflow mitigation for 3-4 players is missing — the active score is clipped, which is a direct regression of legibility for a core multi-player scenario |

No orphaned requirements — all 4 SCOR-01..04 IDs declared in plan frontmatter match `.planning/REQUIREMENTS.md`'s Phase 10 mapping exactly.

### Anti-Patterns Found

No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) found in any of the 7 files modified across the 4 plans (`Numpad.svelte`, `Dartboard.svelte`, `dart-notation.ts`, `VisitStrip.svelte`, `ScorePanel.svelte`, `CheckoutSuggestion.svelte`, `match/+page.svelte`). No stub returns, empty handlers, or hardcoded-empty-data patterns found.

Two Info-level findings from `10-REVIEW.md` were explicitly and knowingly left unfixed (correctly out of scope, not gaps):
- IN-01: `VisitStrip.svelte` is dead code (never imported) — flagged for a future milestone-audit/cleanup decision, per the phase's own locked Q1 decision (CONTEXT.md) not to delete pre-existing dead code.
- IN-02: `.dart-pill--triple` class naming is arguably ambiguous (amber, not red, despite the name) — cosmetic, explicitly won't-fix per REVIEW-FIX.md.

### Human Verification Required

None required — the one item flagged in VALIDATION.md/PLAN-10-04 as "manual-only" (3-4 player landscape overflow) was settled with an objective automated probe (screenshot + DOM overflow metrics) rather than left to human judgment, per this verification's instructions. The result is a definitive FAIL, not an open question — see Gaps below.

### Gaps Summary

Phase 10 successfully restyled 3 of its 4 scoring-surface components (Numpad, Dartboard, VisitStrip/DartPill) to the DS spec with zero behavioral regressions — all engine/store logic is byte-identical, confirmed by diff and by the full 555-test Vitest suite and 10-test Playwright suite staying green, and all three code-review warnings (WR-01/02/03) were fixed and re-verified.

The fourth component, ScorePanel, is the source of the one real gap: Plan 10-04 correctly identified (via RESEARCH.md Pitfall 4) that removing the landscape-only smaller-font overrides was necessary to make the DS's single 96px/44px scale apply "uniformly" as CONTEXT.md required — but the overflow risk this creates for 3-4 concurrent player cards in landscape was never actually checked before phase completion. It was routed to a non-blocking, human-only checkpoint (`human_verify_mode: end-of-phase`) that, per the phase's own SUMMARY/VALIDATION trail, was never executed (no evidence of it having been run appears anywhere in the phase artifacts). Running that exact check now (ad-hoc, automated) shows the active player's remaining score is genuinely clipped by its own card in the 3- and 4-player landscape case — the "1" in "501" is rendered outside/under the neighboring card. This is a visual regression of the score panel's core purpose (the active player must be able to read their own remaining score) and directly affects the app's stated touch-scoring use case (players scoring their own X01 match, commonly 3-4 players).

This does not block SCOR-01/02/03 (Numpad, Dartboard, VisitStrip/DartPill), which are all fully verified. It blocks full closure of SCOR-04 and, by extension, the phase's overall goal ("visually matches the DS scoring specs ... every existing scoring behavior stays unchanged") — the DS-mandated single scale does not actually render usably for the phase's own flagged risk scenario.

**This looks like an incomplete mitigation, not an intentional deviation** — no override is suggested; the fix should add a genuine overflow mitigation (e.g. `clamp()`-based sizing keyed to player count/available width, or a tested minimum-safe landscape scale) plus an automated regression test at 1024×768 with 3-4 players, replacing the manual-only checkpoint that was never exercised.

---

_Verified: 2026-07-14T04:30:00Z_
_Verifier: Claude (gsd-verifier)_
