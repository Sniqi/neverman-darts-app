# Deferred Items — Phase 08

Out-of-scope discoveries logged during execution (not fixed, per executor scope boundary).

## Pre-existing E2E failures — REPAIRED 2026-07-14 (commit 2956c1e)

All 6 failures below were repaired via `/gsd-debug` (test-only changes, zero `src/` edits). Root causes were
three June-14 quick-task commits that changed setup defaults and the visit-confirm flow without updating specs:

- `b9e4ef4` — default `startScore` 501→301, `outRule` double→single, `setsEnabled` false→true
- `877828b` — default `legsToWin` 3→2
- `5be44aa` — `CorrectionWindow` overlay removed from `/match`, replaced by the dart-pill undo strip (visits commit immediately on "Bestätigen"; no more `.overlay` to wait for/dismiss)

Fix: each spec now selects 501 (+ Double Out + Sets off where leg-win math depends on it) explicitly instead of
relying on defaults, drops the overlay wait/dismiss logic, and disambiguates remaining-score assertions from the
display's history-row breadcrumb text (`"→321"`) with `exact: true`. Full suite verified green 3x consecutively
under default parallel workers (no flakiness, no `playwright.config.ts` changes needed); `vitest` 523/523 unchanged.

Debug session archived at `.planning/debug/resolved/e2e-spec-drift-repair.md`.

## Pre-existing E2E failures (predate Phase 8 — attribution completed 2026-07-13)

**Discovered:** 2026-07-13 during 08-02 Task 3 full-E2E verification run.
**Attribution completed:** 2026-07-13 by orchestrator — disposable worktree at `93ece5f` (pre-08-01, docs-only baseline) + isolated re-run at HEAD.

**Verdict: all 6 failures PREDATE Phase 8.** Under identical run shape (specs run in isolation), the failure points at HEAD are byte-identical to the pre-Phase-8 baseline; the spec files themselves are unchanged since v1.0. The "earlier" failure point ('Spieler hinzufügen' timeout) seen in full-suite runs is load-dependent flakiness under parallel workers, not a Phase 8 regression (verified: isolated HEAD run passes setup and fails at the same point as baseline).

**Failing specs (6) — identical at baseline `93ece5f` and HEAD:**

| Spec | Stable failure point | Likely cause | Status |
|---|---|---|---|
| e2e/full-match-flow.spec.ts (happy path) | `getByRole('button', {name:'Legs verringern'})` resolves but stays `disabled` | Spec drift: quick task 260614-q02 set default legs to 2 (likely the minimum) — decrement expectation stale | REPAIRED (commit `2956c1e`) — confirmed cause; also required selecting 501/Double Out and turning Sets off (commit `b9e4ef4` also defaulted `setsEnabled=true`, which made legsToWin apply per-set) |
| e2e/resume.spec.ts — both tests | `locator('.overlay')` (correction window) not found after Bestätigen | Spec/flow drift in numpad→correction-window lifecycle | REPAIRED (commit `2956c1e`) — confirmed cause: commit `5be44aa` removed CorrectionWindow from `/match` entirely (dart-pill undo strip replaces it); visits now commit immediately, no overlay to wait for |
| e2e/spectator-sync.spec.ts — all 3 | `getByText('501'/'321')` never visible on display page | Display window never renders score in test env — two-page BroadcastChannel timing or route drift since June | REPAIRED (commit `2956c1e`) — actual cause was simpler: commit `b9e4ef4` changed default `startScore` 501→301, so specs hardcoding 501-based arithmetic got wrong values. No BroadcastChannel/route-drift bug found; no SpectatorChooser gates `/display` (verified by reading `src/routes/display/+page.svelte`). |

**Passing specs:** e2e/reduced-motion.spec.ts (08-01), e2e/offline-fonts.spec.ts (08-02).

**Handling for the rest of Phase 8:**
- Executors and the verifier must evaluate E2E acceptance as **"no NEW failures vs this documented red baseline"** — reduced-motion + offline-fonts must pass; the 6 entries above are expected-red, pre-existing.
- These belong to a dedicated repair effort (spec-drift fix, likely test-only), NOT to the restyling milestone (pure-visual scope). Recommend `/gsd-debug "E2E spec drift since June quick tasks"` or a quick task after Phase 8 — before milestone audit ideally, since REQUIREMENTS.md's "all existing tests stay green" framing assumed a green baseline that did not actually exist at milestone start.
