---
phase: 04-statistics-achievements
fixed_at: 2026-06-12T15:04:33Z
review_path: .planning/phases/04-statistics-achievements/04-REVIEW.md
iteration: 2
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report (Iteration 2)

**Fixed at:** 2026-06-12T15:04:33Z
**Source review:** .planning/phases/04-statistics-achievements/04-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope (Critical + Warning): 5
- Fixed: 5
- Skipped: 0

In-scope findings were CR-01, WR-01, WR-02, WR-03, WR-04. The three Info findings
(IN-01, IN-02, IN-03) were out of scope for `critical_warning` and were not touched.

Verification after fixes: `npm run test:unit` → 14 files / 291 tests passing;
`npm run check` → only the pre-existing, KNOWN Phase 3 debt error at
`src/db/profiles.ts:24` remains (untouched, not worsened). No new errors or warnings
introduced.

## Fixed Issues

### CR-01: `matchAverageCrossLeg` double-counts the final leg for losers on completed matches

**Files modified:** `src/engine/averages.ts`
**Commit:** 7ffee8d
**Applied fix:** Replaced the `if (player.remaining === 0)` early-return guard with
`if (curDarts === 0)`, computing `curDarts` from the current-leg slice
(`player.visits.slice(currentLegStartIdx)`) BEFORE the guard. On a completed match all
three callers pass `currentLegStartIdx = visits.length`, so the slice is empty
(`curDarts === 0`) for every player — winner AND loser — and the final leg is taken
solely from `legCompleted`. This eliminates the loser double-count (the old guard only
caught the winner's `remaining === 0`, so a loser's `curScored = startScore - remaining`
was added a second time on top of `legCompleted`). The live mid-leg StatDrawer behaviour
is preserved because mid-leg has uncommitted visits (`curDarts > 0`).

Confirmed all three callers pass `visits.length` and remain correct:
- `src/ui/history/PlayerStatRow.svelte:39`
- `src/ui/display/MatchWinDisplay.svelte:44`
- `src/stores/match.svelte.ts:245` (match-complete record detection — a false
  "Bester Match-Schnitt" record for a loser no longer fires)

`src/db/stats.ts` was already correct (computes per-match average directly from
`legCompleted`, never calls `matchAverageCrossLeg` for completed matches) and was not
changed for this finding.

### WR-01: WR-06 unit coverage is winner-only — the loser path is untested

**Files modified:** `src/engine/averages.test.ts`
**Commit:** 7ffee8d (committed atomically with the CR-01 source fix)
**Applied fix:** Added a LOSER regression test in the `matchAverageCrossLeg` describe
block: a completed 1-leg match with `remaining: 100 > 0` and the loser's final leg in
`legCompleted = [{ dartsThrown: 12, scored: 401 }]`, asserting the average equals the
`legCompleted`-only ratio `(401 / 12) * 3` with no current-leg contribution. Also updated
the existing winner test to pass `player.visits.length` (the value the real callers pass)
instead of a synthetic mid-array index, so the test now models the actual caller contract
that makes the empty-slice guard fire. Full suite: 62 averages tests pass.

### WR-02: Highest-checkout reconstruction duplicated in three places with drift risk

**Files modified:** `src/engine/averages.ts`, `src/db/stats.ts`, `src/ui/history/MatchStatBreakdown.svelte`
**Commit:** 7ed2e00
**Applied fix:** Extracted a single `highestCheckout(player, startScore): number | null`
helper into `averages.ts` (next to `highestVisit`) holding the per-leg checkout-reconstruction
walk. Replaced the inline copy in `db/stats.ts` (imported as `highestCheckoutFn`) and removed
the local function copy in `MatchStatBreakdown.svelte` (now imported from averages). The two
full-replay consumers now share one implementation.

Scope note: the third site cited by the review, the live record-detection in
`match.svelte.ts:215-236`, uses a per-dispatch `prevPlayer.remaining` delta (incremental,
single-visit, not a full visit replay) — a different mechanism that cannot consume the
`highestCheckout(player, startScore)` full-replay signature without restructuring the live
record loop. It was intentionally left as-is; this divergence is now documented directly on
the shared helper's JSDoc so the distinction is explicit and not mistaken for drift.

### WR-03: Record-detection numpad visit-score uses `prevPlayer.remaining` across a possible leg reset

**Files modified:** `src/stores/match.svelte.ts`
**Commit:** 3cffb51
**Applied fix:** Restructured the numpad visit-score branch so the in-leg case computes
`const delta = prevPlayer.remaining - nextPlayer.remaining; visitScore = delta >= 0 ? delta : null;`.
A negative delta (which could only arise from a hypothetical future bust-on-numpad path that
resets `remaining` without incrementing the leg count) now degrades to "no record" instead of
firing a spurious celebration. The implicit coupling is documented at the call site.

### WR-04: `DisplayStore` BroadcastChannel message handler has no shape validation

**Files modified:** `src/stores/display.svelte.ts`
**Commit:** 84ad6d6
**Applied fix:** Extracted the WR-07 shape check from `connect()` into a module-level
`isValidMatchState(parsed): parsed is MatchState` type guard (validates
`Array.isArray(players) && players.length > 0` and `activePlayerIndex` in range) and applied
it in BOTH ingress paths — the localStorage hydration path and the live BroadcastChannel
message handler (`if (isValidMatchState(e.data)) this.state = e.data;`). A malformed or partial
`MatchState` posted on the channel can no longer reach the render loops the WR-07 guard protects.

## Skipped Issues

None — all in-scope findings were fixed.

Out-of-scope (Info, not attempted under `critical_warning`): IN-01 (`matchAverage()` retained
but superseded), IN-02 (`totalLegsCompleted = 0` dead local), IN-03 (non-closing numpad visit
score-band omission — documented v1 limitation).

---

_Fixed: 2026-06-12T15:04:33Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
