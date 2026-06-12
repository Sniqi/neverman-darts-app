---
phase: 04-statistics-achievements
fixed_at: 2026-06-12T00:00:00Z
review_path: .planning/phases/04-statistics-achievements/04-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-06-12
**Source review:** .planning/phases/04-statistics-achievements/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (CR-01 + WR-01..WR-07)
- Fixed: 8
- Skipped: 0
- Info findings (IN-01..IN-05): out of scope (critical_warning), not addressed

All fixes were applied in an isolated git worktree, verified per-fix with `npm run test:unit`
(290 tests passing, up from a 284-test baseline — 6 new regression tests added) and
`npm run check` (svelte-check). The only remaining type error is the KNOWN pre-existing
`src/db/profiles.ts:24` Phase 3 debt — no new type errors were introduced by any fix.

## Fixed Issues

### CR-01: Lost legs are never recorded, corrupting lifetime averages & trends

**Files modified:** `src/engine/reducer.ts`, `src/engine/reducer.test.ts`, `src/db/stats.test.ts`
**Commit:** efe9088
**Applied fix:** Rewrote `handleLegWinFromPlayers` to capture a `legCompleted` entry for
EVERY player at leg close (winner and losers) via `captureLegStats(p, legStart, startScore)`
computed BEFORE `remaining` is reset. The winner's `remaining` is already 0 (scored =
startScore); each loser's `remaining` still holds the start-of-visit value, so
`scored = startScore - remaining` correctly captures the lost leg. Added a reducer test
asserting losers receive a `legCompleted` entry, a reducer test asserting UNDO replay
rebuilds `legCompleted` for all players, and a stats test asserting a losing profile's
darts now contribute to `averageTrend`, `matchAverage`, `bestLeg`, and
`dartsPerLegBuckets`. UNDO correctness is preserved because UNDO replays the event log
through the same reducer path.

### WR-01: Numpad checkouts always score 0 in highestCheckout (dead ternary)

**Files modified:** `src/db/stats.ts`, `src/db/stats.test.ts`
**Commit:** e350fcd
**Applied fix:** Replaced the dead `player.remaining === 0 ? 0 : 0` ternary with a per-leg
running-remaining walk. For a numpad checkout (`darts: []`, `wasCheckout: true`) the finish
value is reconstructed as the running remaining before the closing visit (the cleared
amount). Board checkouts still sum dart values. Typed the `running` accumulator as `number`
to avoid a `301 | 401 | 501` literal-type assignment error (the `running = 0` reset).
Added a test asserting a numpad checkout contributes its real finish value (501) to
`highestCheckout`. The existing board-checkout test still passes.

### WR-02: Numpad checkouts also score 0 in the per-match breakdown

**Files modified:** `src/ui/history/MatchStatBreakdown.svelte`
**Commit:** 14e5586
**Applied fix:** Added a `highestCheckout(player, startScore)` helper using the same per-leg
running-remaining walk as WR-01, and replaced the inline `{@const highestCheckoutScore}`
that mapped numpad checkouts to `0`. A match won via a numpad finish now shows the real
"Höchstes Finish" value. svelte-check passes with no new errors.

### WR-06: matchAverageCrossLeg double-counts the final leg on a completed match — requires human verification

**Files modified:** `src/engine/averages.ts`, `src/engine/averages.test.ts`,
`src/ui/display/MatchWinDisplay.svelte`, `src/ui/history/PlayerStatRow.svelte`,
`src/stores/match.svelte.ts`
**Commit:** d001f27
**Applied fix:** Two-pronged. (1) In `matchAverageCrossLeg`, when `player.remaining === 0`
(the winner has just closed a leg already pushed to `legCompleted`), return the
`legCompleted`-only ratio and skip the current-leg slice entirely — preventing the winner's
final leg being counted twice. Mid-leg (`remaining > 0`) the current leg is still counted,
so the live StatDrawer average is unaffected. (2) Because after CR-01 the LOSER's final leg
is also in `legCompleted` (but the loser's `remaining > 0`), the three completed-match
callers — `MatchWinDisplay.svelte`, `PlayerStatRow.svelte`, and the `#detectRecords`
match-complete branch — now pass `player.visits.length` as `currentLegStartIdx`, so the
current-leg slice is empty and no player double-counts the final leg. Added a 2-leg
completed-match test asserting the win-screen average equals the `legCompleted`-only ratio.
**Human-verification flag:** this is a logic change touching the average shown on the win
screen and in history. Tier 1/2 verification (re-read + tests + svelte-check) passed, but a
developer should confirm the win-screen and history averages read correctly against a real
2-leg match before sign-off.

### WR-04: Match-win badge persists into the next match (pendingRecords not cleared)

**Files modified:** `src/ui/overlays/MatchWinOverlay.svelte`
**Commit:** 433a1bf
**Applied fix:** Added a `$effect` that, on `isMatchComplete`, snapshots the incoming
`recordBadge` into a local `displayBadge` state and then clears `matchStore.pendingRecords`.
The local snapshot is necessary because the route derives `recordBadge` from
`pendingRecords` — clearing the store first would blank the prop. The template now renders
`displayBadge`. `displayBadge` resets when the overlay is no longer complete (next match).
This prevents stale records leaking past "Neues Spiel" navigation.

### WR-05: Display record overlay can mis-attribute / drop records across players

**Files modified:** `src/stores/match.svelte.ts`, `src/routes/display/+page.svelte`
**Commit:** 238c85c
**Applied fix:** Added a monotonic `#recordSeq` counter in `MatchStore`; the
`record-event` broadcast payload now carries `seq`. On the display side, the record-channel
subscription tracks `lastRecordSeq`, ignores stale/duplicate sequences, and APPENDS records
that arrive while a celebration is still showing (replacing only once the overlay has
cleared). Two players hitting 180 in quick succession are both shown rather than the second
overwriting the first.

### WR-07: Empty player array on display crashes the panels grid template

**Files modified:** `src/stores/display.svelte.ts`
**Commit:** bbd52a9
**Applied fix:** `DisplayStore.connect()` now validates the parsed localStorage snapshot
shape — `Array.isArray(parsed.players) && parsed.players.length > 0` and
`activePlayerIndex` a number within `[0, players.length)` — before assigning to state. A
corrupt or partially hydrated snapshot leaves `state = null` (idle screen) instead of
rendering `grid-template-columns: repeat(0, 1fr)` and iterating an empty array.

### WR-03: visitScoresFromState leg-boundary reset drifts on mixed numpad/board legs — requires human verification

**Files modified:** `src/engine/averages.ts`, `src/engine/averages.test.ts`
**Commit:** 57dcd73
**Applied fix:** Rewrote the leg-boundary detection to be driven by structural data — the
per-leg `scored` totals in `legCompleted` — instead of inferring boundaries from `running`
reaching `<= 0`. The walk advances to the next leg when (a) the visit is an explicit
`wasCheckout` leg-closer, or (b) the leg's accumulated score reaches
`completed[legIdx].scored`, falling back to the `running <= 0` zero-crossing only when no
structural data is available (legacy blobs / the in-progress leg). Added a test for a
board-closed mixed leg. **Residual limitation (documented in code):** a NON-closing numpad
visit's score still cannot be reconstructed (no per-visit remaining is persisted), so its
points are omitted from the returned band scores and such a leg may not reach its expected
`scored` total from board visits alone. This is the same pre-existing numpad-delta
limitation (RESEARCH Pitfall 2) and is unchanged by this fix — the fix strictly improves
boundary accuracy for board-closed and checkout-closed legs without regressing the existing
band-counting behavior (all prior tests still pass).
**Human-verification flag:** boundary-reconstruction logic; verified by tests + svelte-check
but a developer should confirm against a real mixed numpad/board multi-leg match.

## Notes / Residuals (not blocking, out of scope)

- **PlayerStatRow `legStartVisitIndex` prop now unused:** the WR-06 fix made
  `PlayerStatRow.svelte` pass `player.visits.length` instead of the `legStartVisitIndex`
  prop, so that prop is now dead. It was left in place (still passed by
  `history/[id]/+page.svelte`) to keep the change surgical — removing it requires touching
  the route too. This overlaps with IN-04 (the `totalLegsPlayed` dead prop on the same
  component), which is an Info finding out of the critical_warning scope. Recommend removing
  both dead props together in an IN-tier cleanup pass.
- **Info findings IN-01..IN-05** were not addressed (out of `critical_warning` scope).

---

_Fixed: 2026-06-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
