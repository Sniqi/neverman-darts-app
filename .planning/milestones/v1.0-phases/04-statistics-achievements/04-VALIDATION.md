---
phase: 4
slug: statistics-achievements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (2 projects: unit + browser) |
| **Config file** | `vite.config.ts` (root) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` (runs both unit + browser projects) |
| **Estimated runtime** | ~10–20 seconds (unit); browser project longer |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds (unit)

---

## Per-Task Verification Map

> Requirement-level map from RESEARCH.md Validation Architecture. Exact task IDs are
> assigned by the planner; each task covering a requirement below inherits that test type
> and command. `File Exists` ❌ W0 = the test file/case is a Wave 0 deliverable.

| Requirement | Behavior | Test Type | Automated Command | File Exists |
|-------------|----------|-----------|-------------------|-------------|
| STAT-01 | Cross-leg match average correct across 2+ legs | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-01 | Live leg average for active player | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-01 | UNDO does not corrupt cross-leg average | unit | `npm run test:unit -- src/engine/reducer.test.ts` | ❌ W0 |
| STAT-02 | first-9 average for < 3, = 3, > 3 visits | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-03 | Checkout % formula: doubles hit / darts at double | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-03 | Checkout % returns null for single-out matches | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-04 | Score band counts for board visits | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-04 | Score band counts for numpad visits (remaining-delta) | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-05 | Best/worst leg from legCompleted | unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ W0 |
| STAT-07 | Lifetime aggregation: correct player.id filter | unit | `npm run test:unit -- src/db/stats.test.ts` | ❌ W0 |
| STAT-07 | Guest players excluded from lifetime stats | unit | `npm run test:unit -- src/db/stats.test.ts` | ❌ W0 |
| STAT-08 | Win rate calculation | unit | `npm run test:unit -- src/db/stats.test.ts` | ❌ W0 |
| ACHV-01 | New highest visit detected after dispatch | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ❌ W0 |
| ACHV-01 | 180 always celebrated even if not a new record | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ❌ W0 |
| ACHV-02 | Record event posted on BroadcastChannel | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/averages.test.ts` — extend with `matchAverageCrossLeg`, `first9Average`, `checkoutPercent`, `computeScoreBands`, `bestLeg`, `worstLeg`
- [ ] `src/db/stats.test.ts` — new file; covers `computeLifetimeStats`, `profileStatsLive` with `fake-indexeddb`
- [ ] `src/stores/match.svelte.test.ts` — extend with record detection hooks, 180 always-celebrate, BroadcastChannel record event (`vi.stubGlobal` per `display.svelte.test.ts`)
- [ ] `src/engine/reducer.test.ts` — extend with `legCompleted` accumulator at leg close, UNDO replay preserves `legCompleted`, `wasCheckout` flag on leg-winning visits

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Record overlay renders + auto-dismisses on input AND spectator views | ACHV-01/ACHV-02 | Cross-window BroadcastChannel + CSS animation timing not reliably assertable in unit tests | Open `/match` + `/display` in two windows; score a 180; confirm overlay appears on both and dismisses after 2.5 s |
| Chart legibility / layout on stats dashboard | STAT-08 | Visual/SVG layout correctness | Open `/stats`, select a profile with ≥2 matches; confirm charts render and are readable |

*Remaining phase behaviors have automated unit verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
