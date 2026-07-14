---
phase: 11
slug: spectator-display
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| (filled by planner) | | | | | | | | | ⬜ pending |

## Wave 0 Requirements

- [ ] (filled by planner)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| On-device Chromecast rendering (DISP-03) | DISP-03 | Chrome 90 @1280×720 is real hardware — not locally emulatable | End-of-phase UAT: cast from /match, verify panels/header/idle/banners/win/pause/auto-rejoin on the TV |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity
- [ ] Wave 0 covers MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true`

**Approval:** pending
