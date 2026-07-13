---
phase: 8
slug: design-foundation
status: planned
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser mode) + Playwright 1.60.x (E2E) |
| **Config file** | `vite.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds (unit), several minutes full |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project unit`
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 08-01 | 1 | FOUND-01, FOUND-03 | T-08-01-01 | colors.css/elevation.css have 0 `color-mix()` | grep-gate | `grep -c 'color-mix' src/styles/colors.css src/styles/elevation.css` | ✅ new files created by task | ⬜ pending |
| 08-01-T2 | 08-01 | 1 | FOUND-03 | T-08-01-01 | app.css is a 4-import aggregator, no old tokens | build | `grep -c "@import" src/app.css` | ✅ new/rewritten | ⬜ pending |
| 08-01-T3 | 08-01 | 1 | FOUND-04 | T-08-01-02 | reduced-motion collapses all animation/transition | e2e (new, Wave 0 gap) | `npx playwright test e2e/reduced-motion.spec.ts` | ❌ MISSING — created by this task | ⬜ pending |
| 08-02-T0 | 08-02 | 2 | FOUND-02 | T-08-02-SC | pip package legitimacy approved before install | human-check | manual PyPI review + "approved" | n/a | ⬜ pending |
| 08-02-T1 | 08-02 | 2 | FOUND-02 | T-08-02-02 | 7 fonts converted to WOFF2 (or documented TTF fallback) | asset-check | `ls -la src/styles/fonts/*.woff2 2>/dev/null \| wc -l` | ❌ MISSING — created by this task | ⬜ pending |
| 08-02-T2 | 08-02 | 2 | FOUND-02 | T-08-02-03 | globPatterns + manifest colors updated | grep-gate + build | `grep -c "woff2" vite.config.ts && grep -c "0c0e14" vite.config.ts` | ✅ existing file modified | ⬜ pending |
| 08-02-T3 | 08-02 | 2 | FOUND-02 | T-08-02-02 | fonts survive fully-offline reload | e2e (new, Wave 0 gap) | `npx playwright test e2e/offline-fonts.spec.ts` | ❌ MISSING — created by this task | ⬜ pending |
| 08-03-T1 | 08-03 | 3 | FOUND-01, FOUND-03, FOUND-04 | T-08-03-01 | 0 hex/rgba in 5 input/dialog files | grep-gate + browser | per-file `grep -Ec '#[0-9a-fA-F]{3,6}\|rgba\(' <file>` loop | ✅ existing files modified | ⬜ pending |
| 08-03-T2 | 08-03 | 3 | FOUND-01, FOUND-02, FOUND-03, FOUND-04 | T-08-03-01 | 0 hex/rgba in 5 files; shake=400ms / score-float=1.6s preserved | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-03-T3 | 08-03 | 3 | FOUND-01, FOUND-04 | T-08-03-01 | 0 hex/rgba in 5 files; zeroFlashFade retimed; PLAT-04 updated | grep-gate + browser | `npx vitest run --project=browser src/ui/pwa/ReloadPrompt.test.ts` | ✅ existing files modified | ⬜ pending |
| 08-04-T1 | 08-04 | 3 | FOUND-01, FOUND-03, FOUND-04 | T-08-04-01 | 0 hex/rgba in 5 display/setup files | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-04-T2 | 08-04 | 3 | FOUND-01, FOUND-02, FOUND-04 | T-08-04-01 | 0 hex/rgba in 4 files; liveRowPulse=1.6s infinite preserved | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-04-T3 | 08-04 | 3 | FOUND-01, FOUND-03 | T-08-04-01 | 0 hex/rgba in 5 files; no logic change | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-05-T1 | 08-05 | 3 | FOUND-01, FOUND-02 | T-08-05-01 | 0 hex/rgba in 5 stats files; StatCard tabular-nums | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-05-T2 | 08-05 | 3 | FOUND-01, FOUND-03 | T-08-05-01 | 0 hex/rgba in 5 route pages; accent CTA text-on-fill fix | grep-gate | per-file grep loop | ✅ existing files modified | ⬜ pending |
| 08-05-T3 | 08-05 | 3 | FOUND-01, FOUND-04 | T-08-05-01 | 0 hex/rgba in match/display shells; E2E flows intact | grep-gate + e2e | `npx playwright test e2e/full-match-flow.spec.ts e2e/spectator-sync.spec.ts` | ✅ existing files/tests | ⬜ pending |
| 08-06-T1 | 08-06 | 4 | FOUND-01 | T-08-06-01 | Profile.color default + fixtures consistent | unit | `npx vitest run --project unit src/db/profiles.test.ts src/lib/backup.test.ts` | ✅ existing files modified | ⬜ pending |
| 08-06-T2 | 08-06 | 4 | FOUND-01 | T-08-06-02 | durable regression lock; full suite green | unit + full suite | `npx vitest run --project unit src/lib/design-tokens.test.ts && npm test` | ❌ MISSING — created by this task | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Per RESEARCH.md's Validation Architecture, this phase had 4 coverage gaps at planning time — all 4 are now scaffolded as the first task of the plan that creates the underlying behavior, per the Nyquist Rule:

- [x] Automated "no provisional colors" regression test — `src/lib/design-tokens.test.ts`, created in 08-06-T2 (last task, since it can only pass once the full sweep across 08-03/08-04/08-05 is complete)
- [x] Reduced-motion E2E coverage — `e2e/reduced-motion.spec.ts`, created in 08-01-T3 (first plan, since the collapse rule itself lands in 08-01-T1)
- [x] Offline font-loading E2E coverage — `e2e/offline-fonts.spec.ts`, created in 08-02-T3 (right after the font precache wiring it verifies)
- [x] `ReloadPrompt.test.ts` PLAT-04 literal edit — handled in 08-03-T3 as an in-scope expected test update, not a regression

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overall visual spot-check (colors/spacing/radii/elevation "look right" across scoring app + spectator display) | FOUND-01, FOUND-03 | Subjective visual judgment beyond what a grep/computed-style assertion can prove; CONTEXT.md accepts this as a supplementary dev-server check, not a replacement for the automated grep gates above | Run `npm run dev`, navigate through `/`, `/setup`, `/bulloff`, `/match`, `/display`, `/stats`, `/history`, `/data`, confirming the DS dark/blue-tinted palette and amber accent render everywhere with no leftover light/mismatched colors |
| pip package legitimacy approval (fonttools, brotli) | FOUND-02 | Blocking human-verify checkpoint per the Package Legitimacy Gate protocol — SUS-flagged packages are never auto-approvable | See 08-02-PLAN.md Task 0's `<how-to-verify>` steps |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (08-02-T0 is a human-check checkpoint by design, not a Wave 0 gap)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task across all 6 plans has an `<automated>` command except the one legitimacy checkpoint)
- [x] Wave 0 covers all MISSING references (4/4 gaps scaffolded, see above)
- [x] No watch-mode flags (all commands use `run`, not `--watch`)
- [x] Feedback latency < 120s (grep gates and targeted vitest/playwright runs are all well under this)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planning complete — ready for `/gsd-execute-phase 8`
