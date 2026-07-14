---
phase: 10-scoring-surface
audited: 2026-07-14
asvs_level: 1
block_on: high
threats_total: 15
threats_closed: 15
threats_open: 0
threats_open_non_blocking: 0
status: secured
---

# Phase 10: Scoring Surface — Security Audit

**Scope:** CSS/markup restyle of the live scoring surface (Numpad, Dartboard, dart-pill notation, ScorePanel/CheckoutSuggestion) across 5 plans (incl. gap-closure 10-05), plus one shared pure-formatting module (`dart-notation.ts`). No new packages, no new endpoints, no new storage, no new user input surface declared or found.

**Method:** Every threat below was independently re-verified against the current on-disk implementation and, where the disposition rested on a test claim, by actually re-running the cited test suite/spec (not by trusting SUMMARY.md's stated pass/fail alone). Concretely: read every modified source file in full and diffed the claimed "script untouched" boundary against the actual script blocks; ran `npx vitest run` (557/557 passed) and `npx playwright test` (12/12 passed) live during this audit; ran `npx playwright test score-panel-landscape` in isolation to directly confirm the landscape-overflow mitigation; checked `git diff <phase-range> -- package.json package-lock.json` for supply-chain claims (empty diff, confirmed); grepped changed files for `{@html}` (none introduced); grepped `src/` for any new import of the orphaned `VisitStrip.svelte` (still zero — no new trust boundary opened).

## Threat Verification

| Threat ID | Category | Severity | Disposition | Status | Evidence |
|-----------|----------|----------|-------------|--------|----------|
| T-10-01-01 | Tampering | low | accept | CLOSED | `src/ui/input/Numpad.svelte` script block read in full: `isValidVisitTotal` import, `pressDigit`/`pressClear`/`pressConfirm`/`pressBackspace` are byte-identical to pre-phase behavior (only the ⌫ button gained `aria-label`, template/style only). `git log` for the file shows the restyle commit (`1af696c`) and the review-fix inset-shadow commit (`28c9273`) as the only phase-10 touches. |
| T-10-01-02 | Denial of Service | low | accept | CLOSED | `.input-display.shake { animation: shake 400ms var(--ease); }` confirmed unchanged in `Numpad.svelte:128-130`; `setTimeout(() => { shaking = false; }, 400)` in `pressConfirm` unchanged — same single timer, no new timer/loop introduced. |
| T-10-01-SC | Tampering (supply chain) | n/a | accept | CLOSED | `git diff` across phase 10's full commit range (`3d3f582^..c7edc33`) on `package.json`/`package-lock.json` is empty — zero dependency changes. |
| T-10-02-01 | Tampering | low | accept | CLOSED | `src/ui/input/Dartboard.svelte` read in full: `screenToBoard`/`classifyHit` imports, `buildRegions()`, `segmentStartAngle()`, `polarToXY()`, ring radii constants (`R_INNER_BULL=30` … `R_MISS_OUTER=400`), and `handlePointerDown()`'s dispatch logic (`matchStore.dispatch({ type: 'DART_THROWN', dart })`) are unchanged — only `fill`/`font-size`/`stroke` literal values differ. All 6 `Dartboard.test.ts` assertions pass (confirmed via full `npx vitest run`). |
| T-10-02-02 | Information Disclosure | low | accept | CLOSED | `data-segment-key="outer-bull"` / `="inner-bull"` confirmed present in `Dartboard.svelte:230,242`, both circles still carry `pointer-events="none"` — static test-selector strings, zero behavioral or data-exposure surface. |
| T-10-02-SC | Tampering (supply chain) | n/a | accept | CLOSED | Same package.json/lock check as above — no new deps. |
| T-10-03-01 | Tampering | low | accept | CLOSED | `src/ui/input/dart-notation.ts` is a pure function over an engine-produced `DartScore`; 6/6 unit tests in `dart-notation.test.ts` pass (verified in the live `npx vitest run`), covering every branch (single/T/D/Bull-50/Bull-25/miss). |
| T-10-03-02 | Repudiation / Scope leak | medium | mitigate | CLOSED | `src/ui/display/VisitLine.svelte` read in full: still has its own independent, OLD-string local `formatDart` (`'0 (Daneben)'`/`'Bull'`/`'Outer Bull'`), does not import from `dart-notation.ts`. `git log -- src/ui/display/VisitLine.svelte` shows its last touching commits (`bd54f3e`, `283083f`) are both Phase 8, none in Phase 10's range — confirms byte-unchanged, not just "test still green." |
| T-10-03-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps (same check). |
| T-10-04-01 | Tampering | low | accept | CLOSED | `src/ui/input/ScorePanel.svelte`/`CheckoutSuggestion.svelte` read in full: `{#each matchStore.state.players as player, i}` loop, `isActive` derivation, and `matchStore.suggestion !== null` guard are unchanged — the only script addition across both 10-04 and 10-05 is the single `playerCount` derived read (declared and scoped to that purpose). |
| T-10-04-02 | Denial of Service (layout overflow) | medium | mitigate | CLOSED — via superseding mitigation, see note | **Note:** the ORIGINAL mitigation plan for this threat ("explicit manual verification step required before phase sign-off") was **not executed as declared** — 10-VALIDATION.md's own "Manual-Only Verifications" section states this check "was never actually exercised before phase sign-off." The underlying risk was real: 10-VERIFICATION.md's automated audit subsequently found and screenshot-confirmed the exact overflow (`.score-panel` scrollWidth 338px > clientWidth 324px at 4 players/1024×768 landscape). This is treated as CLOSED here only because a follow-up plan (10-05, see T-10-05-02) fully closed the actual threat with a strictly stronger, automated mitigation — re-verified live by this audit (`npx playwright test score-panel-landscape` → 2/2 pass). Flagging this discrepancy explicitly per the adversarial-stance requirement to distrust disposition text, not just accept "mitigate" at face value. |
| T-10-04-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps (same check). |
| T-10-05-01 | Tampering | low | accept | CLOSED | `ScorePanel.svelte`'s only script addition is `let playerCount = $derived(matchStore.state.players.length);` — a read-only derived value with no write path; `{#each}`/`isActive`/`CheckoutSuggestion` composition unchanged, confirmed by direct read. |
| T-10-05-02 | Denial of Service (layout overflow / illegible score) | medium | mitigate | CLOSED | Re-ran `npx playwright test score-panel-landscape` live during this audit: **2/2 pass** — both 3-player and 4-player cases assert `.score-panel`/every `.player-card` `scrollWidth <= clientWidth` and the active score's bounding-rect stays within its own card. This is the automated regression that replaces the never-executed T-10-04-02 manual checkpoint; confirmed to actually gate the file going forward (test exists on disk, is not a stub, and demonstrably fails-then-passes per the plan's documented RED/GREEN cycle in 10-05-SUMMARY.md, independently reproduced by this audit's live run). |
| T-10-05-SC | Tampering (supply chain) | n/a | accept | CLOSED | No new deps (same check). |

## Open Threats

None. All 15 threats resolve to CLOSED (0 open, blocking or non-blocking).

## Unregistered Flags

None found. Cross-checked all 5 SUMMARY.md files for a `## Threat Flags` section — none of the 5 include one (a process omission, not itself a finding, consistent with Phase 9's audit noting the same section is often skipped by executors). Independently corroborated by:
- 10-REVIEW.md (code review, `findings.critical: 0`) — no security-relevant issues found across all 13 reviewed files; its 3 Warning-tier findings (WR-01/02/03) were all DS-typography/color compliance gaps, not security gaps, and all 3 were subsequently fixed per 10-REVIEW-FIX.md.
- This audit's own greps: zero `{@html}` introduced in any phase-10-changed file; zero new imports of the orphaned `VisitStrip.svelte` (still dead code, no new trust boundary); zero `package.json`/`package-lock.json` changes across the full phase commit range.
- No new routes, endpoints, or storage APIs touched — confirmed via the full changed-file list (`git diff --name-only` across the phase range): only `src/ui/input/*`, `src/routes/match/+page.svelte`, and `e2e/*.spec.ts` files.

## Accepted Risks Log

The following threats are formally accepted (not mitigated by code) per their PLAN.md disposition, verified CLOSED above because the cited rationale/evidence was independently confirmed to exist and hold:

- T-10-01-01, T-10-01-02, T-10-02-01, T-10-02-02, T-10-03-01, T-10-04-01, T-10-05-01 — all `low` severity, accepted on the basis of confirmed byte-identical script/logic boundaries and/or passing test coverage, independently re-verified by direct file reads (not SUMMARY.md claims alone).
- T-10-01-SC, T-10-02-SC, T-10-03-SC, T-10-04-SC, T-10-05-SC — `n/a` severity, accepted supply-chain non-events (zero new packages across the full phase-10 commit range, confirmed via `git diff` on `package.json`/`package-lock.json`).

Two `medium`-severity threats were dispositioned `mitigate` rather than `accept` and are recorded above with direct evidence rather than here (T-10-03-02, T-10-05-02); T-10-04-02 is recorded above with an explicit note that its originally-declared mitigation was not executed, closed only via the superseding T-10-05-02 fix.

## Recommendation

Secured at ASVS Level 1 / `block_on: high`. Phase 10 may ship — `threats_open: 0`.

One process note for future phases (not a blocker): T-10-04-02 is the second consecutive phase (after Phase 9's T-09-02-01) where a disposition's stated mitigation evidence did not actually hold up under independent verification — in this case, a "manual verification step required before phase sign-off" that was never run. It was caught only because a later automated verification pass (10-VERIFICATION.md) happened to test the exact scenario, and a gap-closure plan (10-05) fixed it properly. Recommend treating `human-check` verification steps in `<threat_model>` mitigation plans as unreliable by default — prefer automated regression tests as the primary mitigation evidence for any `mitigate`-dispositioned threat, exactly as 10-05 ultimately did.

---
*Audited: 2026-07-14*
*Auditor: Claude (gsd-security-auditor)*
