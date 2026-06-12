---
phase: 04-statistics-achievements
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 27
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
  warning: 7
  info: 5
  total: 13
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 27 (24 source files + 3 test files cross-referenced)
**Status:** issues_found

## Summary

Phase 4 adds the statistics/achievements layer: pure stat functions (`averages.ts`),
lifetime aggregation (`stats.ts`), record detection in the match store, and the
SVG charts/dashboards/overlays. XSS hygiene is sound throughout — every player name
and record string is rendered via Svelte `{interpolation}`; no `{@html}` was found
anywhere in the reviewed files, matching the project convention. BroadcastChannel and
localStorage access is consistently wrapped in try/catch for private-mode resilience.

The dominant problem is **data correctness in the cross-leg accumulation model**. The
reducer records a `legCompleted` entry only for the *winner* of each leg, but
`stats.ts` derives a player's lifetime average, average-trend, best-leg and
darts-per-leg buckets *entirely* from `legCompleted`. The net effect: every leg a
player **lost** is silently dropped from their lifetime statistics — their lifetime
3-dart average reflects only the legs they won, systematically inflating it. This is
the single BLOCKER. The remaining issues are reconstruction gaps for numpad-entered
visits (highest-checkout always 0 for numpad finishes; mixed numpad/board leg-boundary
drift) and a handful of UI/edge-case robustness items.

## Critical Issues

### CR-01: Lost legs are never recorded, corrupting lifetime averages & trends

**File:** `src/engine/reducer.ts:287-384` (producer) → `src/db/stats.ts:110-177` (consumer)
**Issue:**
`handleLegWinFromPlayers` only appends a `legCompleted` entry to the **winner**:

```ts
const winnerWithLeg: PlayerState = {
    ...winner,
    legCompleted: [...(winner.legCompleted ?? []), legEntry],
};
const playersWithLeg = players.map((p, i) => i === playerIdx ? winnerWithLeg : p);
```

Losing players are mapped through unchanged — they get **no** `legCompleted` entry
for the leg they just lost. But `computeLifetimeStats` builds the most important
lifetime KPIs purely from `legCompleted`:

```ts
const completed = player.legCompleted ?? [];
const matchDarts  = completed.reduce((s, l) => s + l.dartsThrown, 0);
const matchScored = completed.reduce((s, l) => s + l.scored, 0);
// → averageTrend, lifetime matchAverage, bestLeg, dartsPerLegBuckets all derive from `completed`
```

Consequences for any multi-leg match (the default config is `legsToWin: 3`):
- A player who *loses* legs has those legs omitted from `matchAverage`,
  `averageTrend`, `bestLeg`, and `dartsPerLegBuckets`. Their lifetime average counts
  only their *winning* legs → systematically inflated.
- A player who loses the entire match but threw many darts can record
  `matchDarts === 0` (no won legs) and contribute **nothing** to `averageTrend`,
  even though they played a full match. `MatchStatBreakdown` / dashboards then show
  an empty/short trend.

This contradicts the test in `stats.test.ts:113` ("counts matches where the profile
player appears even as loser") — the match is counted, but the loser's actual scoring
is discarded. The reducer must capture a `legCompleted` entry for **every** player at
leg close (winner and losers), computed before `remaining` is reset.

**Fix:** Capture leg stats for all players at leg close, not just the winner:

```ts
// In handleLegWinFromPlayers, before resetting remaining:
const playersWithLeg = players.map((p, i) => {
    const legStart = state.legStartVisitIndex[p.id] ?? 0;
    const legEntry = captureLegStats(p, legStart, config.startScore);
    return { ...p, legCompleted: [...(p.legCompleted ?? []), legEntry] };
});
```

Note `captureLegStats` already computes `scored = startScore - player.remaining`,
which is correct for losers too (their `remaining` still holds the start-of-visit
value at the moment the leg closes). Add a reducer test asserting the loser receives
a `legCompleted` entry after a leg win, and a `stats.ts` test where the profile loses
a leg and still contributes those darts to `averageTrend`.

## Warnings

### WR-01: Numpad checkouts always score 0 in highestCheckout (dead ternary)

**File:** `src/db/stats.ts:156-163`
**Issue:** The highest-checkout scan computes a numpad checkout's score as a ternary
whose both branches are `0`:

```ts
const score = v.darts.length > 0
    ? v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
    : player.remaining === 0 ? 0 : 0; // numpad checkout: score=remaining before visit
```

`player.remaining === 0 ? 0 : 0` always evaluates to `0`, so any leg closed via the
numpad (`darts: []`, `wasCheckout: true`) contributes nothing to `highestCheckout`.
Since numpad is a first-class input path (`NUMPAD_VISIT` finishing visits store
`darts: []`), the lifetime "Höchstes Finish" record silently ignores all numpad
finishes. The comment even states the intended value (`remaining before visit`) but
the code does not implement it.

**Fix:** Reconstruct the numpad checkout score from the running remaining. Because the
checkout reduces remaining to 0, the checkout value equals the leg's remaining before
the closing visit. Use the same per-leg running-remaining walk that
`visitScoresFromState` performs (or fold the highest-checkout detection into that
walk), e.g. track `runningBeforeVisit` per leg and use it when `wasCheckout && darts.length === 0`.

### WR-02: Numpad checkouts also score 0 in the per-match breakdown

**File:** `src/ui/history/MatchStatBreakdown.svelte:52-59`
**Issue:** Same defect as WR-01 in the history detail view. `highestCheckoutScore`
maps numpad checkout visits to `0`:

```ts
v.darts.length > 0
    ? v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
    : 0   // numpad checkout → 0, never the real finish value
```

A match won via a numpad checkout shows "Höchstes Finish: —" even though a finish
occurred. Fix consistently with WR-01 (reconstruct from running remaining for the
leg-closing numpad visit).

### WR-03: visitScoresFromState leg-boundary reset drifts on mixed numpad/board legs

**File:** `src/engine/averages.ts:208-242`
**Issue:** Leg boundaries are detected solely by `running` reaching `<= 0` after a
scored visit. Non-checkout numpad visits (`darts: []`, `wasCheckout` falsy) are
`continue`d without decrementing `running` (lines 229-234). If a leg contains such a
numpad visit and is then closed by a *board* visit, `running` never reaches 0, the
leg-boundary reset is skipped, and the next leg's running remaining starts too high.
For pure score-band counting the pushed scores are dart-sums (independent of
`running`), so band counts survive — but any consumer relying on the reset (or future
use of `running` for per-visit numpad deltas) will be wrong, and a board checkout that
mathematically lands exactly on a prior leg's leftover can be misclassified. The
function's own inline comments acknowledge it "cannot reconstruct reliably."

**Fix:** Drive leg boundaries from structural data, not the running total. The reducer
already knows visit counts per leg (it sets `legStartVisitIndex` at each leg start);
persist per-leg visit counts (or store `legCompleted` visit-count alongside
`dartsThrown`) and reset `running` at the recorded boundary index rather than inferring
it from `running <= 0`.

### WR-04: Match-win badge persists into the next match (pendingRecords not cleared)

**File:** `src/routes/match/+page.svelte:215-223` and `src/stores/match.svelte.ts:59`
**Issue:** On match completion, `MatchWinOverlay` folds `matchStore.pendingRecords`
into its `recordBadge`. Unlike the playing-phase `RecordOverlay` (which clears
`pendingRecords` via `ondismiss`), the win overlay has **no** dismiss path that clears
`pendingRecords`. The only thing that resets it is the next `START_MATCH`. If a record
coincides with the match win, `pendingRecords` stays populated through "Neues Spiel"
navigation until a new match is dispatched, and any code reading `pendingRecords`
between matches sees stale records. Recommend clearing `pendingRecords` when the
match-complete overlay mounts (or in `#persistCompletedMatch`).

**Fix:** Clear `matchStore.pendingRecords = []` once the win overlay has rendered the
badge (e.g. an `onMount`/`$effect` in `MatchWinOverlay` when `isMatchComplete`), or
fold-and-clear inside the route the same way the playing-phase branch does.

### WR-05: Display record overlay can mis-attribute records across players

**File:** `src/routes/display/+page.svelte:25-43, 196-201`
**Issue:** `recordStrings` is set from the record-event payload and only cleared by the
`RecordOverlay` `ondismiss` (2.5s timer) or when a win banner shows. The broadcast
payload is `records: items.map(i => i.text)` — it carries no player association and no
sequence id. If two record events arrive within the 2.5s window (e.g. two players hit
180 in quick succession, or rapid dispatches), the second assignment replaces the first
and resets are not coordinated with the auto-dismiss timer, so a record can be dropped
or shown for the wrong duration. Lower severity because it is display-only celebration,
but it is a correctness gap in the sync protocol.

**Fix:** Include a monotonic id (or timestamp) in the record-event payload and queue
records on the display side, or at minimum append rather than replace within the
dismiss window.

### WR-06: matchAverageCrossLeg double-counts when called on a completed match with current-leg visits

**File:** `src/stores/match.svelte.ts:240-258`; `src/ui/display/MatchWinDisplay.svelte:38-44`; `src/ui/history/PlayerStatRow.svelte:35-38`
**Issue:** `matchAverageCrossLeg(player, legStartIdx, startScore)` adds the current-leg
contribution `startScore - player.remaining` on top of the `legCompleted` totals,
slicing current-leg visits from `legStartVisitIndex`. On `match-complete`, the final
leg has already been pushed into `legCompleted` by the reducer, **and** the winner's
`remaining` is 0 while `legStartVisitIndex` still points at the final leg's start.
For the winner, current-leg `scored = startScore - 0 = startScore` and current-leg
darts = the final leg's darts — i.e. the final leg is counted **twice** (once from
`legCompleted`, once from the current-leg slice). `stats.ts` deliberately avoids this
by treating `currentLegStartIdx` as `visits.length` (zero current-leg contribution),
but the live callers (`MatchWinDisplay`, the match-complete record detection, and
`PlayerStatRow` on persisted records) call it with the real `legStartVisitIndex`,
producing an inflated final-leg-weighted average on the win screen and in history.

**Fix:** For completed matches, call with a `currentLegStartIdx` equal to
`player.visits.length` (so the current-leg slice is empty), or have
`matchAverageCrossLeg` skip the current-leg contribution when `player.remaining === 0`
/ phase is complete. Verify against a 2-leg match and assert the win-screen average
equals the `legCompleted`-only ratio.

### WR-07: Empty player array on display crashes the panels grid template

**File:** `src/routes/display/+page.svelte:75` and `src/ui/display/MatchWinDisplay.svelte:22`
**Issue:** `prevLegsWon.length === s.players.length` and the grid render assume a
non-empty `players` array, and `MatchWinDisplay` reads
`state.players[state.activePlayerIndex]` without a length guard. A corrupt or partially
hydrated localStorage snapshot (`JSON.parse` in `display.svelte.ts:36` does no schema
validation) with `players: []` or an out-of-range `activePlayerIndex` would yield
`winner === undefined`; the template uses `winner?.name ?? ''` so it won't crash there,
but `--player-count:0` produces `grid-template-columns: repeat(0, 1fr)` (invalid) and
`standingText`/averages iterate an empty array. Hardening the hydration path (validate
`players.length > 0` and `activePlayerIndex` in range before assigning `this.state`)
would prevent a malformed snapshot from rendering a broken display.

**Fix:** In `DisplayStore.connect()`, validate the parsed snapshot shape
(`Array.isArray(parsed.players) && parsed.players.length > 0` and
`activePlayerIndex` within bounds) before assigning; otherwise leave `state = null`.

## Info

### IN-01: AverageTrendChart shows "not enough data" for a single completed match

**File:** `src/ui/stats/AverageTrendChart.svelte:73-109`
**Issue:** The chart only plots when `points.length >= 2`; a profile with exactly one
completed match sees "Nicht genug Daten." even though one data point exists. This is a
deliberate threshold, but a single labeled dot would be more informative. Cosmetic.

### IN-02: ScoreDistributionChart accent highlights the wrong band when 60+ dominates

**File:** `src/ui/stats/ScoreDistributionChart.svelte:31`
**Issue:** `highlightIdx = bands.findIndex(b => b.count > 0)` always accents the
*highest-tier non-empty* band (180 first), not the band with the most occurrences.
A player whose only scores are 60+ will correctly highlight 60+, but a player with one
180 and 200 sixties accents the single 180. If the intent is "highlight the standout
band," this is fine; if it is "highlight the most frequent," it is wrong. Clarify intent.

### IN-03: Dead/duplicated remaining-delta comment block in visitScoresFromState

**File:** `src/engine/averages.ts:196-205`
**Issue:** A ~10-line comment narrates an abandoned approach ("We reconstruct visit
counts per leg from dartsThrown? No — …") before the actual implementation. This is
working-notes commentary that should be condensed to a one-line statement of the chosen
strategy; it currently reads as confusion in shipped code.

### IN-04: Unused prop `totalLegsPlayed` threaded through PlayerStatRow

**File:** `src/ui/history/PlayerStatRow.svelte:14-18` and `src/routes/history/[id]/+page.svelte:106`
**Issue:** `PlayerStatRow` declares and receives `totalLegsPlayed` but never references
it in the template or script. The history route computes `totalLegsPlayed` and passes
it in. Dead prop + dead computation; remove both unless a near-term use is planned.

### IN-05: `worstLeg` is exported and unit-tested but never consumed

**File:** `src/engine/averages.ts:279-282`
**Issue:** `worstLeg` is fully implemented and tested but no UI or stats consumer
imports it (only `bestLeg`, `dartsPerLeg`, `highestVisit`, etc. are used). Either wire
it into a stat surface or mark it as intentionally-public API; otherwise it is
speculative surface per the project's "simplicity first" guideline.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
