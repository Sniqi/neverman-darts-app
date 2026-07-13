# Deferred Items — Phase 08

Out-of-scope discoveries logged during execution (not fixed, per executor scope boundary).

## Pre-existing E2E failures (discovered during 08-02, NOT caused by 08-01/08-02 plan changes... verified against pre-plan baseline)

**Discovered:** 2026-07-13 during 08-02 Task 3 full-E2E verification run.

**Baseline proof:** A disposable git worktree at commit `eaec1c7` (pre-08-02 HEAD, includes 08-01) reproduced the exact same failures — so 08-02's font changes are not the cause. 08-01 only verified vitest (512/512) + its own reduced-motion spec, so there is no known-green full-E2E baseline after 08-01; the breakage may predate Phase 8 entirely (e.g. quick task 260614-q02 changed /setup defaults/labels) or stem from 08-01's typography rewrite.

**Failing specs (6):**

| Spec | Failure point |
|---|---|
| e2e/full-match-flow.spec.ts (happy path) | setup/match flow interaction |
| e2e/resume.spec.ts — Fortsetzen restores score | `.overlay` (correction window) not found after Bestätigen |
| e2e/resume.spec.ts — Verwerfen clears match | `.overlay` not found after Bestätigen |
| e2e/spectator-sync.spec.ts — all 3 tests | timeout waiting for 'Spieler hinzufügen' on /setup |

**Passing specs:** e2e/reduced-motion.spec.ts (08-01), e2e/offline-fonts.spec.ts (08-02).

**Action needed:** Investigate and repair in a later phase-08 plan or via /gsd-debug before phase verification — likely a stale-selector/flow drift issue in the specs vs the current UI, not a product bug (unit/browser suite is 512/512 green and the app renders/plays in the failure snapshots).
