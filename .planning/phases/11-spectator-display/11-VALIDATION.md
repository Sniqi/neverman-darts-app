---
phase: 11
slug: spectator-display
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
---

# Phase 11 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser) + Playwright 1.60.x (E2E) |
| **Config file** | `vite.config.ts` / `playwright.config.ts` |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~60 s vitest; ~3 min E2E |

## Sampling Rate

- **After every task commit:** `npx vitest run --project unit`
- **After every plan wave:** full suite (557+ vitest, 12/12 Playwright)
- **Before `/gsd-verify-work`:** full suite green
- **Max feedback latency:** 180 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-T1 | 11-01 | 1 | DISP-01 | T-11-01-01 | No `{@html}`; formatter accepts only engine-typed `DartScore` | unit | `npx vitest run --project unit src/ui/input/dart-notation.test.ts` | ✅ exists | ⬜ pending |
| 11-01-T2 | 11-01 | 1 | DISP-01, DISP-04 | T-11-01-01 | No `{@html}`; formatter accepts only engine-typed `DartScore` | component (browser) | `npx vitest run --project=browser src/ui/display/VisitLine.test.ts` | ✅ exists | ⬜ pending |
| 11-02-T1 | 11-02 | 1 | DISP-02 | T-11-02-01 | No `{@html}`; only `MatchConfig` numeric/enum fields rendered | regression (no dedicated test file — CSS-only, stable text content) | `npm test` | ❌ no MatchHeader.test.ts (not a gap — visual-only change, per RESEARCH.md) | ⬜ pending |
| 11-02-T2 | 11-02 | 1 | DISP-02 | T-11-02-01 | Chrome-90-safe precomputed static (no live color-mix) | grep gate | `grep -rn "color-mix(" src/ui/display/MatchHeader.svelte` | ✅ gate is the test | ⬜ pending |
| 11-03-T1 | 11-03 | 2 | DISP-01 | T-11-03-01 | No `{@html}`; pre-existing Svelte auto-escaping on `{player.name}` | component (browser) | `npx vitest run --project=browser src/ui/display/PlayerPanel.test.ts` | ✅ exists | ⬜ pending |
| 11-03-T2 | 11-03 | 2 | DISP-01 | T-11-03-01 | Same as above | component (browser) | `npx vitest run --project=browser src/ui/display/PlayerPanel.test.ts` | ✅ exists | ⬜ pending |
| 11-03-T3 | 11-03 | 2 | DISP-01, DISP-03, DISP-04 | T-11-03-01 | Zero live color-mix(); Chrome-90 vw-fallback synced; formatDart consolidated | component (browser) + E2E + grep gate | `grep -rn "color-mix(" src/ui/display/ && npx vitest run --project=browser src/ui/display/ && npx playwright test e2e/spectator-sync.spec.ts` | ✅ exists | ⬜ pending |

## Wave 0 Requirements

None — existing test infrastructure (`PlayerPanel.test.ts`, `VisitLine.test.ts`, `dart-notation.test.ts`, `e2e/spectator-sync.spec.ts`) already covers every automatable phase requirement. The two planned test-string updates in `VisitLine.test.ts` (11-01-T2) are edits to an existing file, not new test infrastructure. `MatchHeader.svelte` has no dedicated test file and none is being added — RESEARCH.md confirms this is not a Wave 0 gap (visual-only CSS change on a component with stable, already-covered text content; full-suite regression + grep gates + the end-of-phase manual on-device UAT are the verification net for DISP-02/DISP-03).

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| On-device Chromecast rendering (DISP-03) | DISP-03 | Chrome 90 @1280×720 is real hardware — not locally emulatable | End-of-phase UAT: cast from /match, verify panels/header/idle/banners/win/pause/auto-rejoin on the TV |

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity
- [x] Wave 0 covers MISSING references (none needed — see Wave 0 Requirements)
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true`

**Approval:** approved (2026-07-14, at planning time — per-task commands verified runnable against current package.json scripts)
