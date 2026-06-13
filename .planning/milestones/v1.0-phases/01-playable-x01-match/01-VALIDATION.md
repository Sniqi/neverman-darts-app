---
phase: 1
slug: playable-x01-match
status: filled
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-10
updated: 2026-06-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Populated from 01-RESEARCH.md "Validation Architecture" and the `<verify>` blocks of plans 01-01..01-04 (planner revision, 2026-06-10).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (multi-project: `unit` node + `browser` Playwright/chromium) + Playwright 1.60.0 (E2E) |
| **Config file** | `vite.config.ts` (vitest projects) + `playwright.config.ts` (E2E) — both created by Plan 01-01 Tasks 1–2 |
| **Quick run command** | `npx vitest run --project=unit` |
| **Full suite command** | `npx vitest run` (unit + browser); E2E gate: `npx playwright test e2e/full-match-flow.spec.ts --reporter=line` |
| **Estimated runtime** | unit ~5–15 s · full vitest ~30–60 s (browser project boots chromium) · E2E gate ~60–120 s (build + preview + spec) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project=unit`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full vitest suite green AND `npx playwright test e2e/full-match-flow.spec.ts` green (FLOW-01), plus the manual wake-lock smoke test (see Manual-Only Verifications)
- **Max feedback latency:** 120 seconds — this ceiling is set by the Plan 01-04 Task 2 final gate (`npm run build && npx playwright test`, expected 60–120 s). This is a **documented, expected high-latency final gate** for FLOW-01; it runs once at the end of Wave 3, not per-task. All other gates complete in < 60 s.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | (infra: scaffold for all REQs) | T-01-SC | Only RESEARCH-audited packages installed | build+typecheck | `npm run build && npx svelte-check --tsconfig ./tsconfig.json --threshold error` | ❌ W0 — created in-task | ⬜ pending |
| 1-01-02 | 01 | 1 | FLOW-01 (RED baseline) | — | N/A | e2e (expected RED) | `npx playwright test e2e/full-match-flow.spec.ts --reporter=line` — non-zero exit expected until 01-04; must fail at assertion level, never "command not found" | ❌ W0 — created in-task | ⬜ pending |
| 1-01-03 | 01 | 1 | PROF-01 (create+read) | T-01-01, T-01-02 | Names rendered via Svelte interpolation; Dexie open failure caught | unit | `npx vitest run --project=unit src/db/profiles.test.ts && npm run build` | ❌ W0 — created in-task | ⬜ pending |
| 1-01-04 | 01 | 1 | (docs: SKELETON.md) | — | N/A | CLI | `test -f .planning/phases/01-playable-x01-match/SKELETON.md && grep -q "Architectural Decisions" .planning/phases/01-playable-x01-match/SKELETON.md` | ✅ pre-drafted | ⬜ pending |
| 1-02-01 | 02 | 2 | ENG-03, ENG-04, ENG-07, INP-01, INP-02 | T-02-01 | Impossible totals rejected by `isValidVisitTotal` | unit (TDD RED→GREEN) | `npx vitest run --project=unit src/engine/board.test.ts src/engine/bust.test.ts src/engine/checkout.test.ts src/engine/impossible-scores.test.ts src/engine/rotation.test.ts` | ❌ W0 — RED-first in-task | ⬜ pending |
| 1-02-02 | 02 | 2 | ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, INP-03, PROF-02 | T-02-02 | Reducer immutability asserted; no IO in engine | unit (TDD RED→GREEN) | `npx vitest run --project=unit src/engine/reducer.test.ts` | ❌ W0 — RED-first in-task | ⬜ pending |
| 1-02-03 | 02 | 2 | ENG-07 (store suggestion getter), ENG-05 (undo passthrough) | — | N/A | unit + typecheck | `npx vitest run --project=unit src/stores/match.svelte.test.ts && npx svelte-check --tsconfig ./tsconfig.json --threshold error` | ❌ W0 — RED-first in-task | ⬜ pending |
| 1-03-01 | 03 | 3 | INP-01, ENG-05 (undo UI) | T-03-02 | Polar math via screenToBoard, never SVG contains() | browser component | `npx vitest run --project=browser src/ui/input/Dartboard.test.ts && npm run build` | ❌ W0 — created in-task | ⬜ pending |
| 1-03-02 | 03 | 3 | INP-02, INP-03, INP-04, INP-05, ENG-04 (bust display) | T-03-01, T-03-03, T-03-04 | Numpad validates before dispatch; wake-lock failure non-fatal; names auto-escaped | browser component | `npx vitest run --project=browser src/ui/input/CorrectionWindow.test.ts && npm run build && npx svelte-check --tsconfig ./tsconfig.json --threshold error` | ❌ W0 — created in-task | ⬜ pending |
| 1-04-01 | 04 | 3 | PROF-01 (full CRUD) | T-04-01, T-04-02 | XSS-safe rendering; graceful Dexie failure (guests still work) | unit + browser | `npx vitest run --project=unit src/db/profiles.test.ts && npx vitest run --project=browser src/ui/setup/ProfileManager.test.ts` | ❌ W0 — created in-task (extends 1-01-03 file) | ⬜ pending |
| 1-04-02 | 04 | 3 | FLOW-01, ENG-01, ENG-02, ENG-03, ENG-06, PROF-02 | T-04-03, T-04-04 | Start disabled with 0 players; guests never written to DB | e2e (GREEN gate, **high-latency 60–120 s**) | `npm run build && npx playwright test e2e/full-match-flow.spec.ts --reporter=line` | ✅ exists from 1-01-02 (flipped GREEN here) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Notes:**
- 1-01-02 is intentionally RED (walking-skeleton baseline). Its "pass" condition is a non-zero exit failing at assertion level. It flips to a normal GREEN gate at 1-04-02.
- 1-04-02 is the documented high-latency final gate (checker warning acknowledged): full static build + preview server + E2E happy path. Run it once per Wave-3 completion and at the phase gate, not per-task.
- No watch-mode flags anywhere — all commands use `vitest run` / one-shot `playwright test`.

---

## Wave 0 Requirements

- [ ] Test framework install (vitest, @vitest/browser, vitest-browser-svelte, playwright, svelte-check) + `npx playwright install chromium` — performed by **Plan 01-01 Task 1** (scaffold precedes all Playwright-based verifies; checker blocker fix)
- [ ] `vite.config.ts` vitest `projects` (unit/browser) + `playwright.config.ts` — created by Plan 01-01 Tasks 1–2
- [ ] `e2e/full-match-flow.spec.ts` — RED stub for FLOW-01 created by Plan 01-01 Task 2
- [ ] `src/db/profiles.test.ts` — PROF-01 create+read created by Plan 01-01 Task 3 (extended to full CRUD in Plan 01-04 Task 1)

No separate Wave 0 pass is required beyond Plan 01-01: all engine tests (`src/engine/*.test.ts`, `src/stores/match.svelte.test.ts`) are written RED-first inside Plan 01-02's TDD tasks, and component tests are created inside Plans 01-03/01-04 alongside the components they verify.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Screen stays awake during an active match; wake lock re-acquired after tab switch | INP-05 | Browser wake lock depends on real device power state/permissions; not automatable in CI (RESEARCH Validation Architecture marks INP-05 manual) | On a real Android tablet (or laptop on battery): start a match, leave it idle past the OS screen timeout — screen must not dim. Switch apps and return — scoring continues, screen stays awake. |
| Portrait + landscape scoring layouts; all dartboard segments finger-hittable | INP-01 (D-01, D-02) | Physical ergonomics on a 10" tablet cannot be asserted by DOM tests | Per Plan 01-03 `<human-check>`: rotate the device both ways, tap triple/double rings with a finger across all 20 segments, verify no mis-hits. |
| Full setup → bull-off → match flow feel | FLOW-01 (D-13, D-15) | UX confirmation beyond the automated E2E assertions | Per Plan 01-04 `<human-check>`: create profile, add guest, configure 301/Single Out/2 legs, order players in bull-off, land on scoring view with correct first thrower. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task has one)
- [x] Wave 0 covers all MISSING references (Plan 01-01 Tasks 1–3 create all infra + stubs)
- [x] No watch-mode flags (all `vitest run` / one-shot `playwright test`)
- [x] Feedback latency < 120 s (ceiling = documented 1-04-02 E2E gate; all other gates < 60 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-10
