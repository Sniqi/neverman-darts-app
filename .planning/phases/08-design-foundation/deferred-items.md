# Deferred Items — Phase 08

Out-of-scope discoveries logged during execution (not fixed, per executor scope boundary).

## Pre-existing E2E failures (predate Phase 8 — attribution completed 2026-07-13)

**Discovered:** 2026-07-13 during 08-02 Task 3 full-E2E verification run.
**Attribution completed:** 2026-07-13 by orchestrator — disposable worktree at `93ece5f` (pre-08-01, docs-only baseline) + isolated re-run at HEAD.

**Verdict: all 6 failures PREDATE Phase 8.** Under identical run shape (specs run in isolation), the failure points at HEAD are byte-identical to the pre-Phase-8 baseline; the spec files themselves are unchanged since v1.0. The "earlier" failure point ('Spieler hinzufügen' timeout) seen in full-suite runs is load-dependent flakiness under parallel workers, not a Phase 8 regression (verified: isolated HEAD run passes setup and fails at the same point as baseline).

**Failing specs (6) — identical at baseline `93ece5f` and HEAD:**

| Spec | Stable failure point | Likely cause |
|---|---|---|
| e2e/full-match-flow.spec.ts (happy path) | `getByRole('button', {name:'Legs verringern'})` resolves but stays `disabled` | Spec drift: quick task 260614-q02 set default legs to 2 (likely the minimum) — decrement expectation stale |
| e2e/resume.spec.ts — both tests | `locator('.overlay')` (correction window) not found after Bestätigen | Spec/flow drift in numpad→correction-window lifecycle |
| e2e/spectator-sync.spec.ts — all 3 | `getByText('501'/'321')` never visible on display page | Display window never renders score in test env — two-page BroadcastChannel timing or route drift since June |

**Passing specs:** e2e/reduced-motion.spec.ts (08-01), e2e/offline-fonts.spec.ts (08-02).

**Handling for the rest of Phase 8:**
- Executors and the verifier must evaluate E2E acceptance as **"no NEW failures vs this documented red baseline"** — reduced-motion + offline-fonts must pass; the 6 entries above are expected-red, pre-existing.
- These belong to a dedicated repair effort (spec-drift fix, likely test-only), NOT to the restyling milestone (pure-visual scope). Recommend `/gsd-debug "E2E spec drift since June quick tasks"` or a quick task after Phase 8 — before milestone audit ideally, since REQUIREMENTS.md's "all existing tests stay green" framing assumed a green baseline that did not actually exist at milestone start.
