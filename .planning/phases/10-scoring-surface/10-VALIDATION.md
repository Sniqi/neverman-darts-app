---
phase: 10
slug: scoring-surface
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser) + Playwright 1.60.x (E2E) |
| **Config file** | `vite.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 s vitest; ~3 min E2E |

---

## Sampling Rate

- **After every task commit:** `npx vitest run --project unit`
- **After every plan wave:** full suite (535+ vitest, 9/9 Playwright — green baseline must stay green)
- **Before `/gsd-verify-work`:** full suite green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-T1 | 10-01 | 1 | SCOR-01 | T-10-01-01 | Script (isValidVisitTotal/handlers) untouched | unit (browser) | `npm run test:browser -- src/ui/input/Numpad.test.ts` | ❌ → created this task | ⬜ pending |
| 10-01-T2 | 10-01 | 1 | SCOR-01 | T-10-01-01, T-10-01-02 | 76px/40px/32px DS values; ⌫ aria-label; shake stays 400ms | unit (browser) | `npm run test:browser -- src/ui/input/Numpad.test.ts` | ✅ (created by T1) | ⬜ pending |
| 10-02-T1 | 10-02 | 1 | SCOR-02 | T-10-02-01 | Existing 3 dispatch tests stay byte-identical | unit (browser) | `npm run test:browser -- src/ui/input/Dartboard.test.ts` | ✅ exists, appended | ⬜ pending |
| 10-02-T2 | 10-02 | 1 | SCOR-02 | T-10-02-01, T-10-02-02 | Flash/float literal values only; hit-detection math byte-identical | unit (browser) | `npm run test:browser -- src/ui/input/Dartboard.test.ts` | ✅ (appended by T1) | ⬜ pending |
| 10-03-T1 | 10-03 | 1 | SCOR-03 | T-10-03-01 | formatDart pure function, no engine change | unit (browser) | `npm run test:browser -- src/ui/input/dart-notation.test.ts` | ❌ → created this task | ⬜ pending |
| 10-03-T2 | 10-03 | 1 | SCOR-03 | T-10-03-01, T-10-03-02 | VisitLine.svelte/.test.ts (Phase 11) byte-unchanged | regression (browser) | `npm test -- --project=browser src/ui/display/VisitLine.test.ts` | ✅ exists, must stay green | ⬜ pending |
| 10-03-T3 | 10-03 | 1 | SCOR-03 | T-10-03-02 | Live board-tap → pill-text wiring proof | E2E | `npx playwright test dart-notation` | ❌ → created this task | ⬜ pending |
| 10-04-T1 | 10-04 | 1 | SCOR-04 | T-10-04-01 | Store-read logic (isActive/suggestion guard) untouched | unit (browser) | `npm run test:browser -- src/ui/input/ScorePanel.test.ts src/ui/input/CheckoutSuggestion.test.ts` | ❌ → created this task | ⬜ pending |
| 10-04-T2 | 10-04 | 1 | SCOR-04 | T-10-04-01, T-10-04-02 | 96px/44px DS values; zero new bust code in ScorePanel; landscape overflow explicitly checked | unit (browser) + manual | `npm run test:browser -- src/ui/input/ScorePanel.test.ts src/ui/input/CheckoutSuggestion.test.ts` | ✅ (created by T1) | ⬜ pending |

**Phase gate (all plans, after Wave 1 completes):**

| Check | Command | Baseline |
|-------|---------|----------|
| Full Vitest suite | `npx vitest run` | 535+ green (was 535 at Phase 9 close; grows by ~17 new tests this phase: 6 Numpad + 3 Dartboard + 6 dart-notation + 5 ScorePanel/CheckoutSuggestion) |
| Full Playwright suite | `npx playwright test` | 9/9 green baseline → 10/10 after Plan 10-03 adds `dart-notation.spec.ts` |

---

## Wave 0 Requirements

RESEARCH.md identified 6 Wave 0 coverage gaps (files with zero prior test coverage for the values this phase changes). Per this plan set's design, every gap is closed INLINE by each plan's first task (test-file-first, RED→GREEN) rather than deferred to a separate wave — no plan depends on another plan's scaffold, so no distinct "wave 0" plan is required. Gaps and their closing task:

- [x] `src/ui/input/Numpad.test.ts` (new) — closed by 10-01-T1
- [x] New assertions in `src/ui/input/Dartboard.test.ts` (existing 3 tests untouched) — closed by 10-02-T1
- [x] Live `/match` dart-pill notation coverage (`e2e/dart-notation.spec.ts`, new) — closed by 10-03-T3 (plus `src/ui/input/dart-notation.test.ts` unit coverage of the formatting logic, closed by 10-03-T1)
- [x] `src/ui/input/ScorePanel.test.ts` (new) — closed by 10-04-T1
- [x] `src/ui/input/CheckoutSuggestion.test.ts` (new) — closed by 10-04-T1
- [x] No framework/config install needed — Vitest browser-mode + Playwright already configured identically to Phase 9's pattern

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| 3-4 player landscape layout does not clip/overflow with the 96px active score (RESEARCH.md Pitfall 4) | SCOR-04 | Requires a real/emulated tablet landscape viewport (~1024px wide) with multiple concurrent player cards — not practical to assert precisely via computed-style unit tests (font-size/weight are covered automatically; visual overflow/clipping across a narrow flex column is not) | `npm run dev`, start a match with 4 guest players, rotate to landscape (or resize browser to ~1024×768), confirm the active player's 96px score and all 3 inactive 44px scores render without clipping, wrapping, or overlapping. Embedded as a `<human-check>` in Plan 10-04 Task 2 (not a blocking checkpoint — `human_verify_mode: end-of-phase` per config.json). If it overflows, raise as a scope question at end-of-phase review rather than silently patching with a functional layout change. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every task across all 4 plans has an `<automated>` command; Plan 10-04 Task 2 additionally has a non-blocking `<human-check>`)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every single task has one)
- [x] Wave 0 covers all MISSING references (6/6 gaps closed, see above)
- [x] No watch-mode flags (all commands use `vitest run` / `npx playwright test`, never `--watch`)
- [x] Feedback latency < 180s (targeted single-file `test:browser`/`playwright test` runs are seconds; full-suite gate ~60s vitest + ~3min E2E, run once per wave per Sampling Rate above)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (planner sign-off — 2026-07-14)
