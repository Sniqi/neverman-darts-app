---
phase: 04-statistics-achievements
reviewed: 2026-06-12T00:00:00Z
depth: standard
iteration: 2
files_reviewed: 24
files_reviewed_list:
  - src/engine/types.ts
  - src/engine/reducer.ts
  - src/engine/averages.ts
  - src/db/stats.ts
  - src/lib/sync-constants.ts
  - src/stores/match.svelte.ts
  - src/stores/display.svelte.ts
  - src/ui/stats/StatCard.svelte
  - src/ui/input/StatDrawer.svelte
  - src/ui/stats/ScoreDistributionChart.svelte
  - src/ui/stats/AverageTrendChart.svelte
  - src/ui/stats/DartsPerLegChart.svelte
  - src/ui/stats/ProfileStatDashboard.svelte
  - src/ui/history/MatchStatBreakdown.svelte
  - src/ui/history/PlayerStatRow.svelte
  - src/ui/overlays/RecordOverlay.svelte
  - src/ui/display/LegWinBanner.svelte
  - src/ui/display/MatchWinDisplay.svelte
  - src/ui/overlays/MatchWinOverlay.svelte
  - src/routes/match/+page.svelte
  - src/routes/display/+page.svelte
  - src/routes/stats/+page.svelte
  - src/routes/+page.svelte
  - src/routes/history/[id]/+page.svelte
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 4: Code Review Report (Iteration 2 — Re-Review)

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

This is a re-review confirming the prior BLOCKER (CR-01) and 7 warnings.

**Confirmed resolved:**
- **CR-01** (legCompleted only recorded for winner): genuinely fixed. `handleLegWinFromPlayers` (reducer.ts:302-306) now maps over ALL players and appends a `legCompleted` entry for each at leg close, using each player's `startScore - remaining`. UNDO replay rebuilds it correctly because legCompleted is derived purely from replayed state (full log replay from `initialState()` reconstructs `legStartVisitIndex` at every step). Lost legs are no longer dropped from lifetime stats. The set-win branch (reducer.ts:311-347) correctly carries `legCompleted` across set boundaries via spread while resetting `legsWon`.
- **WR-01** numpad checkout scoring, **WR-02/WR-03** visit reconstruction / leg-boundary drift, **WR-04** pendingRecords clearing, **WR-05** record-broadcast sequencing, **WR-07** snapshot validation: all verified resolved in the respective files.

**NOT resolved — new regression introduced by the WR-06 fix:** The WR-06 guard in `matchAverageCrossLeg` only special-cases `remaining === 0` (the winner). For **losers** of a completed match — whose `remaining > 0` — the final leg is double-counted. Because CR-01 now (correctly) records the loser's final leg into `legCompleted`, and three call sites pass `visits.length` as `currentLegStartIdx`, the loser's final-leg score is added a second time with zero darts. This inflates every loser's displayed match average on the history detail, the spectator match-win display, and the match-average record-detection path. See CR-01 (this iteration) below. The unit test for WR-06 only covers the winner (remaining=0) and never exercises the loser path, which is why the regression slipped through.

## Critical Issues

### CR-01: `matchAverageCrossLeg` double-counts the final leg for losers on completed matches

**File:** `src/engine/averages.ts:109-120` (consumed by `src/ui/history/PlayerStatRow.svelte:39`, `src/ui/display/MatchWinDisplay.svelte:44`, `src/stores/match.svelte.ts:245`)

**Issue:**
The WR-06 fix guards only on `player.remaining === 0`:

```ts
if (player.remaining === 0) {
    if (prevDarts === 0) return null;
    return (prevScored / prevDarts) * 3;   // winner: correct, no double count
}
// falls through for losers (remaining > 0):
const curVisits = player.visits.slice(currentLegStartIdx); // = [] when idx = visits.length
const curDarts = ...;                                       // = 0
const curScored = startScore - player.remaining;            // > 0  ← the final leg, AGAIN
const totalScored = prevScored + curScored;                 // double-counted
```

On a completed match every player's final leg is already in `legCompleted` (the CR-01 fix records it for ALL players, including losers). The three call sites pass `currentLegStartIdx = player.visits.length` deliberately so the current-leg *visit slice* is empty — but `curScored = startScore - remaining` is **not** derived from that slice; it is the loser's final-leg points, which `prevScored` already contains. Result: `totalScored` includes the final leg twice while `totalDarts` includes it once.

Concrete trace (1-leg, 501 match, loser B finished with remaining 100 after `Db` darts):
- `legCompleted = [{ dartsThrown: Db, scored: 401 }]` → `prevDarts = Db`, `prevScored = 401`
- `remaining = 100 ≠ 0` → guard skipped; `curDarts = 0`, `curScored = 501 - 100 = 401`
- result = `((401 + 401) / Db) * 3` = **double** the correct `(401 / Db) * 3`.

Every loser's "Ø Match" is wrong (roughly doubled in the scored numerator) in:
- the match history detail (`PlayerStatRow`),
- the spectator match-win screen (`MatchWinDisplay`),
- the match-average record detection (`#detectRecords`), which can fire a false "Bester Match-Schnitt" record for a loser.

Note `db/stats.ts` is NOT affected: it computes the per-match average directly from `legCompleted` only (stats.ts:124-133) and never calls `matchAverageCrossLeg` for completed matches. That is the correct pattern and confirms the right fix.

**Fix:** Skip the current-leg contribution whenever the current-leg slice is empty, not only when `remaining === 0`. Drive the guard off the slice itself so it is correct for winners and losers alike:

```ts
const completed = player.legCompleted ?? [];
const prevDarts = completed.reduce((s, l) => s + l.dartsThrown, 0);
const prevScored = completed.reduce((s, l) => s + l.scored, 0);

const curVisits = player.visits.slice(currentLegStartIdx);
const curDarts = curVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);

// Only add the current leg when it actually has uncommitted visits. On a completed
// match the callers pass visits.length, so curVisits is empty for EVERY player
// (winner and loser); the final leg lives solely in legCompleted.
if (curDarts === 0) {
    if (prevDarts === 0) return null;
    return (prevScored / prevDarts) * 3;
}

const curScored = startScore - player.remaining;
const totalDarts = prevDarts + curDarts;
const totalScored = prevScored + curScored;
if (totalDarts === 0) return null;
return (totalScored / totalDarts) * 3;
```

This preserves the live mid-leg StatDrawer behaviour (mid-leg `curDarts > 0`, so the current leg is still counted) while eliminating the loser double-count. Add a regression test that asserts a loser's average on a completed match equals the `legCompleted`-only ratio (the existing WR-06 test only covers the winner at `remaining === 0`).

## Warnings

### WR-01: WR-06 unit coverage is winner-only — the loser path is untested

**File:** `src/engine/averages.test.ts:269-284`

**Issue:** The single "does not double-count the final leg on a completed match" test constructs a player with `remaining: 0` (the winner). The loser case (`remaining > 0` on a completed match) — the exact condition under which CR-01 above manifests — has no test. The blind spot is what allowed the regression to ship in iteration 1's fix.

**Fix:** Add a test mirroring the winner test but with `remaining > 0` and the loser's final leg present in `legCompleted`, asserting the result equals `(prevScored / prevDarts) * 3` (no current-leg contribution). Include it in the same `describe` block so future refactors of `matchAverageCrossLeg` keep both paths covered.

### WR-02: Highest-checkout reconstruction duplicated in three places with drift risk

**File:** `src/db/stats.ts:160-176`, `src/ui/history/MatchStatBreakdown.svelte:24-42`, `src/stores/match.svelte.ts:215-236`

**Issue:** The "walk visits per leg, reset `running` at leg boundary, take the larger of board-sum or `running` for `wasCheckout` visits" logic is hand-copied into three components. They are currently consistent, but the leg-boundary reset (`if (running <= 0) running = startScore`) is a subtle invariant; any future change to one copy (e.g. switching to legCompleted-driven boundaries like `visitScoresFromState` already does) will silently diverge the history breakdown from the lifetime dashboard. This is the same class of boundary-drift bug WR-03 just fixed inside `visitScoresFromState`.

**Fix:** Extract a single `highestCheckout(player, startScore): number | null` into `averages.ts` (next to `highestVisit`) and import it in all three call sites. Prefer driving the boundary off `legCompleted` (as `visitScoresFromState` now does) so all reconstruction helpers share one boundary policy.

### WR-03: Record-detection numpad visit-score uses `prevPlayer.remaining` across a possible leg reset

**File:** `src/stores/match.svelte.ts:165-168`

**Issue:**
```ts
visitScore = nextLegCount > prevLegCount
    ? prevPlayer.remaining
    : prevPlayer.remaining - nextPlayer.remaining;
```
For a non-checkout numpad visit, `prevPlayer.remaining - nextPlayer.remaining` assumes `nextPlayer.remaining` is still in the same leg as `prevPlayer.remaining`. That holds for the no-leg-close branch here. But this relies on the reducer never resetting `remaining` on a non-leg-closing numpad dispatch — true today, yet undocumented at this call site. If a numpad visit ever both fails to increment `legCompleted` and resets remaining (e.g. a future bust-on-numpad path), `visitScore` would be negative and a spurious record could fire. Low likelihood, but the coupling is implicit.

**Fix:** Add an assertion/guard: `const delta = prevPlayer.remaining - nextPlayer.remaining; visitScore = nextLegCount > prevLegCount ? prevPlayer.remaining : (delta >= 0 ? delta : null);` so a negative delta degrades to "no record" instead of a bogus celebration.

### WR-04: `DisplayStore` BroadcastChannel message handler has no shape validation

**File:** `src/stores/display.svelte.ts:58-60`

**Issue:** WR-07 added validation for the localStorage hydration path (connect()), but the live BroadcastChannel handler assigns `this.state = e.data` with no validation. A malformed or partial `MatchState` posted on the channel (e.g. a future protocol change, or a stray same-origin sender) would reach the render loops the WR-07 guard was specifically added to protect (`repeat(0, 1fr)` grid, `players[activePlayerIndex]` out of range). The two ingress paths are inconsistent.

**Fix:** Extract the WR-07 shape check from `connect()` into a `isValidMatchState(parsed)` helper and apply it in the message handler too: `if (isValidMatchState(e.data)) this.state = e.data;`.

## Info

### IN-01: `matchAverage()` retained but superseded and misleading

**File:** `src/engine/averages.ts:58-74`

**Issue:** `matchAverage()` is documented (lines 64-70) as producing wrong results for multi-leg matches and is superseded by `matchAverageCrossLeg`. It is still exported. Keeping a known-incorrect function exported invites a future caller to pick it by name. No current Phase 4 file imports it.

**Fix:** Either remove it or rename to make the single-leg-only contract explicit (e.g. `currentLegMatchAverage`). Not urgent — flagged so it does not become a footgun.

### IN-02: `totalLegsCompleted = 0` dead local in set-win branch

**File:** `src/engine/reducer.ts:331-332`

**Issue:** `const totalLegsCompleted = 0; const nextLegStarter = legStarterIndex(totalLegsCompleted, numPlayers);` — the variable is a constant 0 with a comment; it reads as if it could vary. Minor clarity nit.

**Fix:** Inline: `const nextLegStarter = legStarterIndex(0, numPlayers);` with the existing comment.

### IN-03: Score-band reconstruction silently omits non-closing numpad visits

**File:** `src/engine/averages.ts:247-251`, `src/ui/input/StatDrawer.svelte:54-61`

**Issue:** Non-closing numpad visit scores cannot be reconstructed (no per-visit remaining is persisted) and are omitted from band counts and first-9 scoring. This is a known/documented limitation (RESEARCH Pitfall 2), not a new defect — flagged so it is not mistaken for a band-counting bug during QA. A numpad-entered 180 that does NOT close a leg will not appear in the "180er" count, whereas a board-entered or leg-closing numpad 180 will.

**Fix:** None required for v1 (documented limitation). If band accuracy for numpad play becomes important, persist a per-visit `scored` field on `Visit` rather than reconstructing.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
