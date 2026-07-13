---
phase: 9
slug: core-components
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser mode) + Playwright 1.60.x (E2E) |
| **Config file** | `vite.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 s unit/browser; ~3 min full E2E |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project unit`
- **After every plan wave:** Run full suite (vitest + Playwright — the E2E baseline is GREEN 8/8 since 2026-07-14 and must stay green; this phase adds 1 new E2E spec, so the post-Plan-09-07 baseline becomes 9/9)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-T1 | 09-01 | 1 | COMP-01, COMP-02 | T-09-01-SC | zero new packages; no forbidden hex introduced | unit | `npx vitest run --project unit -t "design tokens"` | ✅ existing regression test | ⬜ pending |
| 09-01-T2 | 09-01 | 1 | COMP-01 | T-09-01-01 | hub button accessible names/onclick unchanged | e2e | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing spec | ⬜ pending |
| 09-01-T3 | 09-01 | 1 | COMP-01, COMP-02 | T-09-01-SC | shared .btn/.switch classes render at DS values | browser (new, Wave 0 gap) | `npx vitest run --project=browser -t "components-css"` | ❌ MISSING — created by this task | ⬜ pending |
| 09-02-T1 | 09-02 | 2 | COMP-01 | T-09-02-01 | back-btn/menu-btn/delete-btn accessible names unchanged | e2e | `npx playwright test` | ✅ existing full suite | ⬜ pending |
| 09-02-T2 | 09-02 | 2 | COMP-01 | T-09-02-01 | export/import buttons keep disabled/onclick behavior | e2e | `npx playwright test` | ✅ existing full suite | ⬜ pending |
| 09-03-T1 | 09-03 | 2 | COMP-01, COMP-03 | T-09-03-01 | ConfirmDialog props/ARIA/German labels unchanged | e2e | `npx playwright test` | ✅ existing full suite | ⬜ pending |
| 09-03-T2 | 09-03 | 2 | COMP-01, COMP-03 | T-09-03-01 | "Fortsetzen"/"Verwerfen" accessible names unchanged | e2e | `npx playwright test e2e/resume.spec.ts` | ✅ existing spec | ⬜ pending |
| 09-03-T3 | 09-03 | 2 | COMP-03 | T-09-03-01 | ConfirmDialog computed blur/radius/max-width match DS spec | browser (new, Wave 0 gap) | `npx vitest run --project=browser -t "ConfirmDialog"` | ❌ MISSING — created by this task | ⬜ pending |
| 09-04-T1 | 09-04 | 1 | COMP-04 | T-09-04-01 | StatCard props (label/value) unchanged | browser | `npx vitest run --project=browser -t "StatCard"` | ❌ MISSING — created by Task 2, exercised here | ⬜ pending |
| 09-04-T2 | 09-04 | 1 | COMP-04 | T-09-04-01 | StatCard computed value/label typography match DS spec | browser (new, Wave 0 gap) | `npx vitest run --project=browser -t "StatCard"` | ❌ MISSING — created by this task | ⬜ pending |
| 09-05-T1 | 09-05 | 2 | COMP-02 | T-09-05-02 | chip/segment aria-pressed + accessible names unchanged | e2e | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing spec | ⬜ pending |
| 09-05-T2 | 09-05 | 2 | COMP-01, COMP-02 | T-09-05-02 | "Legs verringern"/"Spiel starten" accessible names unchanged | e2e | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing spec | ⬜ pending |
| 09-05-T3 | 09-05 | 2 | COMP-02 | T-09-05-01 | id/role=switch/aria-checked preserved on all 4 toggles | e2e | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing spec (line 27 `getByRole('switch',{name:'Sets'})`) | ⬜ pending |
| 09-06-T1 | 09-06 | 2 | COMP-01 | T-09-06-01 | "Spieler hinzufügen"/"Gast hinzufügen" accessible names unchanged | e2e | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing spec | ⬜ pending |
| 09-06-T2 | 09-06 | 2 | COMP-01, COMP-03 | T-09-06-01 | ProfileManager accessible names + data-testid unchanged | browser | `npx vitest run --project=browser -t "ProfileManager"` | ✅ existing test file | ⬜ pending |
| 09-06-T3 | 09-06 | 2 | COMP-01 | T-09-06-01 | "Spielreihenfolge bestätigen" accessible name unchanged | e2e | `npx playwright test` | ✅ existing full suite | ⬜ pending |
| 09-07-T1 | 09-07 | 2 | COMP-02 | T-09-07-01, T-09-07-02 | id/role=switch/aria-checked preserved; row height 48px not 64px | e2e | `npx playwright test` | ✅ existing full suite (indirect) | ⬜ pending |
| 09-07-T2 | 09-07 | 2 | COMP-02 | T-09-07-01 | direct role=switch/aria-checked toggle proof for /match | e2e (new, Wave 0 gap) | `npx playwright test e2e/match-audio-toggle.spec.ts` | ❌ MISSING — created by this task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per RESEARCH.md's Validation Architecture, this phase had 4 coverage gaps at planning time — all 4 are scaffolded as dedicated tasks within the plan that creates the underlying behavior, per the Nyquist Rule:

- [x] `.btn`/`.switch` shared-class computed-style proof — `src/ui/shared/components-css.test.ts`, created in 09-01-T3 (immediately after the classes are defined in 09-01-T1)
- [x] ConfirmDialog computed backdrop-filter/radius/max-width proof — `src/ui/dialogs/ConfirmDialog.test.ts`, created in 09-03-T3 (after the restyle in 09-03-T1)
- [x] StatCard computed value/label typography proof — `src/ui/stats/StatCard.test.ts`, created in 09-04-T2 (after the restyle in 09-04-T1)
- [x] `/match` audio-toggle role=switch/aria-checked E2E proof (RESEARCH.md flagged this as previously zero-coverage) — `e2e/match-audio-toggle.spec.ts`, created in 09-07-T2 (after the markup swap in 09-07-T1), as a new isolated spec that does not modify the existing green `full-match-flow.spec.ts`

---

## Manual-Only Verifications

None. Per CONTEXT.md's explicit resolution of the `/match` audio-bar sizing question (Q2) and per the `planning_context` instruction that this phase requires no checkpoints, every task in this phase has a concrete `<automated>` verification path — either an existing locked E2E/component-test assertion (accessible names, ARIA roles) or a newly-scaffolded Wave-0 test closing a coverage gap RESEARCH.md identified. A supplementary dev-server visual spot-check (`npm run dev`, navigate through `/`, `/setup`, `/match`) is recommended but not required for phase completion, matching the Phase 8 precedent.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (18/18 tasks across 7 plans)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has an `<automated>` command)
- [x] Wave 0 covers all MISSING references (4/4 gaps scaffolded, see above)
- [x] No watch-mode flags (all commands use `run`/`test`, not `--watch`)
- [x] Feedback latency < 180s (targeted vitest `-t` filters and single-spec Playwright runs are all well under this; full-suite gates run once per wave)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (plans not yet executed)
