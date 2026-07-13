---
phase: 9
slug: core-components
status: draft
nyquist_compliant: false
wave_0_complete: false
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
- **After every plan wave:** Run full suite (vitest + Playwright — the E2E baseline is GREEN 8/8 since 2026-07-14 and must stay green)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner) | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] (filled by planner — candidate: browser-mode assertions for `.btn` variant contract / chip 56px / toggle track per CONTEXT.md discretion)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (filled by planner) | | | |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
