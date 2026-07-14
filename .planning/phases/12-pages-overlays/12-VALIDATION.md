---
phase: 12
slug: pages-overlays
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-14
---

# Phase 12 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser) + Playwright 1.60.x (E2E) |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npx vitest run && npx playwright test` |

## Sampling Rate

- After every task commit: `npx vitest run --project unit`
- After every plan wave: full suite (563+ vitest, 12/12 Playwright)
- Max feedback latency: 180 s

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | | | | | | | ⬜ pending |

## Wave 0 Requirements

- [ ] (filled by planner)

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (filled by planner) | | | |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity · Wave 0 covers MISSING · No watch-mode · Latency < 180s
- [ ] `nyquist_compliant: true`

**Approval:** pending
