---
phase: 04-statistics-achievements
reviewed: 2026-06-12T17:09:00Z
depth: standard
iteration: 3
files_reviewed: 16
files_reviewed_list:
  - src/engine/types.ts
  - src/engine/reducer.ts
  - src/engine/averages.ts
  - src/db/stats.ts
  - src/lib/sync-constants.ts
  - src/stores/match.svelte.ts
  - src/stores/display.svelte.ts
  - src/ui/input/StatDrawer.svelte
  - src/ui/stats/ProfileStatDashboard.svelte
  - src/ui/history/MatchStatBreakdown.svelte
  - src/ui/history/PlayerStatRow.svelte
  - src/ui/overlays/RecordOverlay.svelte
  - src/ui/display/MatchWinDisplay.svelte
  - src/ui/overlays/MatchWinOverlay.svelte
  - src/routes/match/+page.svelte
  - src/routes/display/+page.svelte
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 4: Code Review Report (Final Re-Review — iteration 3)

**Reviewed:** 2026-06-12T17:09:00Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** clean

## Summary

Final adversarial re-review of the auto fix/re-review loop (iteration 3), focused on
the three confirmation points raised by the workflow. The iteration-2 fixes are correct
and complete; no new BLOCKER or WARNING-severity correctness issues were introduced. All
291 unit tests pass (62 in `averages.test.ts`, including dedicated regression tests for
the loser double-count and the mid-leg live path).

This phase is **clean** of Critical/Warning issues.

### Confirmation 1 — `matchAverageCrossLeg` loser double-count resolved AND mid-leg StatDrawer still correct

**Confirmed.** The guard now gates on the current-leg slice being empty
(`curDarts === 0`, averages.ts:114) instead of `remaining === 0`:

- **Completed match, loser:** The reducer captures every player's final leg into
  `legCompleted` for winner AND loser (`handleLegWinFromPlayers`, reducer.ts:302-306),
  and `legStartVisitIndex` is left pointing at the final leg's start on match-complete.
  All three average callers pass `currentLegStartIdx = player.visits.length`, so
  `curVisits = visits.slice(visits.length) = []` → `curDarts === 0` → the function
  returns `prevScored / prevDarts` from `legCompleted` only. The loser's final leg is
  counted exactly once. The old `remaining === 0` guard only caught the winner (whose
  remaining is 0) and let the loser's `curScored = startScore - remaining > 0` be added
  on top of `legCompleted`, doubling the loser's average. Now fixed.
  Covered by the dedicated test `averages.test.ts:285` (LOSER, remaining>0).

- **Mid-leg live StatDrawer:** `StatDrawer.svelte:68` passes the real
  `legStart = state.legStartVisitIndex[player.id]`. While a leg is in progress, the
  current leg is NOT yet in `legCompleted` and has committed visits, so `curDarts > 0`
  → the current-leg contribution (`curScored = startScore - player.remaining`) is
  included. Covered by `averages.test.ts:301-312`
  (`matchAverageCrossLeg(player, 2, 501) === 60` with an in-progress current leg).

- **New-leg boundary (after a leg closes, before any dart in the next leg):** `legStart`
  equals `visits.length`, slice is empty, `curDarts === 0` → returns the
  `legCompleted`-only average. Correct — shows accumulated completed legs until the next
  dart lands. No regression.

- **Mid-visit (darts in `currentVisit`, visit not yet committed):** `player.remaining`
  holds the start-of-visit value and uncommitted darts are absent from `player.visits`,
  so both `curScored` and `curDarts` exclude the in-flight darts consistently. Correct.

### Confirmation 2 — the three callers are consistent with the new contract

**Confirmed.** All consumers of completed/persisted player state pass
`player.visits.length` so the current-leg slice is empty and the contract holds:

- `PlayerStatRow.svelte:39` — `matchAverageCrossLeg(player, player.visits.length, config.startScore)`.
- `MatchWinDisplay.svelte:44` — `matchAverageCrossLeg(pl, pl.visits.length, state.config.startScore)`.
- `match.svelte.ts:255` (record detection, match-complete branch) —
  `matchAverageCrossLeg(nextPlayer, nextPlayer.visits.length, next.config.startScore)`.

The live path (`StatDrawer.svelte:68`) deliberately passes the real `legStart` to include
the in-progress leg. `db/stats.ts:125-134` computes the per-match average directly from
`legCompleted` (no current-leg contribution), which is exactly equivalent to the
`curDarts === 0` branch — fully consistent. Note: the callers passing `visits.length`
rather than relying on `legStartVisitIndex` makes them robust to the reducer's
set-win/match-complete branch (reducer.ts:320-328) not refreshing `legStartVisitIndex`.

### Confirmation 3 — no new regressions from the iteration-2 fixes

**Confirmed.** Reviewed all iteration-2 changes:

- **`highestCheckout()` extraction (WR-02, averages.ts:340-359):** Behavior-preserving.
  The body is identical to the former `MatchStatBreakdown` copy (`null` initial,
  `best === null || score > best`). Rewiring `db/stats.ts:158` to
  `hc !== null && hc > highestCheckoutVal` is equivalent to the prior inline `> 0`
  semantics (a checkout always clears a positive remaining, so `null` and `0` never
  collide). The documented numpad non-closing-visit `running` limitation is pre-existing
  (RESEARCH Pitfall 2), not introduced here.

- **`isValidMatchState()` extraction (display.svelte.ts:25-35):** Applied identically to
  BOTH ingress paths — localStorage hydration (line 59) and the live BroadcastChannel
  handler (line 73). No divergence; both reject empty `players` and out-of-range
  `activePlayerIndex` before the render loops.

- **Numpad record delta non-negative guard (WR-03, match.svelte.ts:176-177):**
  `delta >= 0 ? delta : null` correctly degrades a hypothetical negative delta to
  "no record" rather than firing a bogus celebration. Defensive and harmless on the
  current reducer (which never resets `remaining` on a non-closing numpad dispatch).

- **`visitScoresFromState` structural leg-boundary detection (WR-03, averages.ts:208-278)**
  and **WR-05 record sequence ids** (`match.svelte.ts:289-290` /
  `display/+page.svelte:29,39-48`): reviewed; logic is sound and consistent across the
  scorer/display boundary (monotonic `seq`, `<= lastRecordSeq` drop, append-within-window).

**Test evidence:** `npx vitest run --project=unit` → 14 files, 291 tests passed.

## Narrative Findings (AI reviewer)

No Critical or Warning findings.

The previously-documented INFO items (single-point trend-chart threshold, accent-band
intent, comment cleanup, dead props) were re-examined and are not actual bugs; they
remain out of scope per the re-review instructions. The known pre-existing
`src/db/profiles.ts:24` type error is Phase 3 debt and out of scope.

---

_Reviewed: 2026-06-12T17:09:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
