---
phase: 04-statistics-achievements
verified: 2026-06-12T17:15:00Z
status: passed
human_validated: 2026-06-12T19:15:00Z
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open /match in one window and /display in a second window. Score a 180. Confirm overlay appears on both views and auto-dismisses after ~2.5 seconds with no tap required."
    expected: "Both /match and /display show the '180!' overlay simultaneously; it disappears after 2.5 s; scoring continues normally underneath."
    why_human: "Cross-window BroadcastChannel behavior and CSS animation timing cannot be reliably asserted in Vitest unit tests."
  - test: "Open /match + /display in two windows. Score a record (e.g. new highest visit on a leg-closing throw). Confirm the record folds into the leg-win banner (not a second overlay)."
    expected: "LegWinBanner shows record badge text below the subtitle; no separate RecordOverlay appears on top."
    why_human: "Coincident-win folding (D-08) requires coordinated visual observation across two live windows."
  - test: "Open /stats, select a profile with >= 2 completed matches. Confirm the Score-Verteilung, Ø-Entwicklung, and Darts-pro-Leg charts render with correct labels and are legible."
    expected: "Three hand-rolled SVG charts visible; bars/lines render with amber accent; data matches known match history; no chart library loaded."
    why_human: "SVG chart layout and visual legibility require human judgment; pixel-level correctness cannot be asserted via unit tests."
  - test: "Play a multi-leg match to completion (e.g. best-of-3). Open History → select that match. Confirm PlayerStatRow shows a real numeric average (not '—') and MatchStatBreakdown renders per-player tiles."
    expected: "Cross-leg average is a real decimal number; breakdown section shows 180er, 140+, 100+, 60+, Finish %, Höchste Aufnahme, Höchstes Finish, Bestes Leg (Darts) per player."
    why_human: "Requires a real multi-leg match in history; the cross-leg average fix (STAT-01 debt) and breakdown rendering are best verified by human observation with known data."
---

# Phase 04: Statistics & Achievements Verification Report

**Phase Goal:** Players see live and lifetime statistics during and after every match; personal records are detected in real time and celebrated with an overlay
**Verified:** 2026-06-12T17:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | matchAverageCrossLeg returns the correct 3-dart average across 2+ completed legs | VERIFIED | `src/engine/averages.ts:93-124` — sums legCompleted + current-leg darts; handles null legCompleted via `?? []`; 8 test cases including multi-leg, live, and UNDO in averages.test.ts |
| 2 | first9Average returns null before 3 visits and the correct average at/after 3 visits | VERIFIED | `src/engine/averages.ts:139-145`; tests at averages.test.ts verify <3 / =3 / >3 visit cases |
| 3 | checkoutPercent returns null for single-out matches and formula for double-out | VERIFIED | `src/engine/averages.ts:158-164`; single-out → null; double-out → `(doublesHit/dartsAtDouble)*100` |
| 4 | computeScoreBands counts 180 / 140+ / 100+ / 60+ from non-bust visit scores | VERIFIED | `src/engine/averages.ts:182-191`; mutually exclusive descending bands; board and numpad-checkout paths tested |
| 5 | bestLeg / worstLeg return min/max darts-per-leg from legCompleted plus the current leg | VERIFIED | `src/engine/averages.ts:304-315`; includes empty-leg and current-in-progress cases |
| 6 | UNDO replay rebuilds legCompleted from scratch with no stale entries | VERIFIED | reducer.ts: `legCompleted` is additive optional field rebuilt by full log replay; reducer.test.ts covers this case |
| 7 | During a match the player can open a 'Statistik' toggle to see a live stats drawer | VERIFIED | `src/ui/input/StatDrawer.svelte` exists (195 lines); `src/routes/match/+page.svelte:167` mounts `<StatDrawer />` after `<ScorePanel />`; toggle uses `aria-expanded` and `aria-controls="stat-drawer"` |
| 8 | From the start screen the player can open Statistik → pick a profile → see lifetime stats | VERIFIED | `src/routes/+page.svelte:94` has "Statistik" menu button; `src/routes/stats/+page.svelte` implements profile picker → `ProfileStatDashboard`; `profileStatsLive` reactive liveQuery wired |
| 9 | The match-detail view shows per-player stat breakdown in place of the empty .phase4-region | VERIFIED | `src/routes/history/[id]/+page.svelte:114-119` replaces phase4-region div with `<MatchStatBreakdown>`; PlayerStatRow uses `matchAverageCrossLeg` (no more "—" for multi-leg) |
| 10 | Records are detected live and celebrated with overlay on both /match and /display | VERIFIED (automated portion) | `src/stores/match.svelte.ts` has `#detectRecords`, `#broadcastRecordEvent`, `preloadedRecords`, `pendingRecords`, `loadRecords`; `RecordOverlay` mounted on both routes; `BC_RECORD_CHANNEL='neverman-record'` in `sync-constants.ts`; 28 unit tests pass |

**Score:** 10/10 truths verified (automated); 4 human-verification items remain

### Deferred Items

None identified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/types.ts` | `PlayerState.legCompleted` and `Visit.wasCheckout` optional fields | VERIFIED | Both present with JSDoc; additive/optional; no existing fields renamed |
| `src/engine/averages.ts` | 8 new exports: matchAverageCrossLeg, first9Average, checkoutPercent, computeScoreBands, visitScoresFromState, dartsPerLeg, bestLeg, worstLeg, highestVisit | VERIFIED | All present and exported; 360 lines; null-on-zero convention throughout |
| `src/engine/reducer.ts` | legCompleted accumulator at leg close; wasCheckout flag | VERIFIED | `captureLegStats` helper; wired in all 4 branches of `handleLegWinFromPlayers` |
| `src/ui/stats/StatCard.svelte` | Reusable KPI tile | VERIFIED | 44 lines; props {label, value}; correct colors per UI-SPEC; no `{@html}` |
| `src/ui/input/StatDrawer.svelte` | Live stats drawer with toggle | VERIFIED | 195 lines (>40 min); imports all 8 stat functions; `aria-expanded`; CSS max-height transition; no `{@html}`; no dispatch calls |
| `src/db/stats.ts` | computeLifetimeStats + profileStatsLive + LifetimeStats | VERIFIED | 222 lines; exports verified; no `.version()` or `.stores()` call; liveQuery pattern mirrors matches.ts |
| `src/routes/stats/+page.svelte` | Stats route: profile picker → ProfileStatDashboard | VERIFIED | 227 lines (>30 min); `profileStatsLive` wired; `aria-label="Statistik für {name} anzeigen"`; guests excluded; base-path aware |
| `src/ui/stats/ProfileStatDashboard.svelte` | Lifetime dashboard: KPI tiles + 3 charts | VERIFIED | 145 lines (>40 min); KPI grid + records grid + 3 chart sections; empty-state `role="status"` |
| `src/ui/stats/ScoreDistributionChart.svelte` | Horizontal bar SVG chart | VERIFIED | `role="img"`, `aria-label`; hand-rolled SVG; no chart library |
| `src/ui/stats/AverageTrendChart.svelte` | Line chart SVG | VERIFIED | `role="img"`, `aria-label`; `<polyline>`; empty state "Nicht genug Daten." when <2 points |
| `src/ui/stats/DartsPerLegChart.svelte` | Bar chart SVG per leg | VERIFIED | `role="img"`, `aria-label`; hand-rolled bars |
| `src/ui/history/MatchStatBreakdown.svelte` | Per-player per-match stats grid | VERIFIED | 116 lines (>30 min); 4-prop interface; 8 StatCard tiles per player; winner accent |
| `src/ui/history/PlayerStatRow.svelte` | Cross-leg average instead of "—" | VERIFIED | Imports `matchAverageCrossLeg`; no `totalLegsPlayed > 1` early-return; `legStartVisitIndex` prop added |
| `src/ui/overlays/RecordOverlay.svelte` | Auto-dismiss celebration overlay | VERIFIED | 69 lines (>30 min); `role="status" aria-live="assertive"`; z-index 50; `$effect` auto-dismiss with `clearTimeout` teardown; no `{@html}` |
| `src/lib/sync-constants.ts` | Shared BroadcastChannel names incl. 'neverman-record' | VERIFIED | Exports `BC_CHANNEL`, `BC_RECORD_CHANNEL='neverman-record'`, `LS_SNAPSHOT`; both stores import from it |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/engine/reducer.ts` | `PlayerState.legCompleted` | `captureLegStats` push before remaining reset | VERIFIED | `legCompleted` populated in all 4 `handleLegWinFromPlayers` branches |
| `src/engine/averages.ts` | `PlayerState.legCompleted` | `matchAverageCrossLeg` sums completed + current | VERIFIED | `player.legCompleted ?? []` pattern throughout |
| `src/ui/input/StatDrawer.svelte` | `src/engine/averages.ts` | imports matchAverageCrossLeg, first9Average, checkoutPercent, computeScoreBands, visitScoresFromState, bestLeg, highestVisit | VERIFIED | All 8 functions imported at line 9-18; used in `$derived.by()` |
| `src/routes/match/+page.svelte` | `src/ui/input/StatDrawer.svelte` | mounted below ScorePanel inside .panel-area | VERIFIED | `<StatDrawer />` at line 167, after `<ScorePanel />` |
| `src/db/stats.ts` | `db.matches` | liveQuery filter on player.id | VERIFIED | `db.matches.filter(m => m.state.players.some(p => p.id === profileId))` |
| `src/routes/+page.svelte` | `/stats` | Statistik menu button goto | VERIFIED | Line 94: "Statistik" button navigating to `${base}/stats` |
| `src/ui/stats/ProfileStatDashboard.svelte` | `src/db/stats.ts` | renders LifetimeStats from computeLifetimeStats | VERIFIED | Imports `LifetimeStats` type; receives `stats: LifetimeStats` prop from route |
| `src/routes/history/[id]/+page.svelte` | `src/ui/history/MatchStatBreakdown.svelte` | mounted inside former .phase4-region | VERIFIED | Lines 113-119: `<MatchStatBreakdown>` with all 4 props |
| `src/ui/history/PlayerStatRow.svelte` | `src/engine/averages.ts` | matchAverageCrossLeg replaces computeAverage | VERIFIED | Imports `matchAverageCrossLeg`; no early-return for multi-leg; passes `player.visits.length` as legStart (WR-06) |
| `src/stores/match.svelte.ts` | `BroadcastChannel('neverman-record')` | one-shot postMessage in `#broadcastRecordEvent` | VERIFIED | `new BroadcastChannel(BC_RECORD_CHANNEL); ch.postMessage({type:'record-event',...}); ch.close()` |
| `src/routes/display/+page.svelte` | `BroadcastChannel('neverman-record')` | second channel subscription → RecordOverlay | VERIFIED | `$effect` opens `BroadcastChannel(BC_RECORD_CHANNEL)` at line 34; handles `{type:'record-event'}` only (T-04-11) |
| `src/stores/match.svelte.ts` | `src/db/stats.ts` | loadRecords preloads computeLifetimeStats per profile player | VERIFIED | `loadRecords` at line 103; calls `computeLifetimeStats` from `../db/stats.js` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `StatDrawer.svelte` | `stats` ($derived.by) | `matchStore.state.players[activePlayerIndex]` via `matchAverageCrossLeg` et al. | Yes — pure functions over live reducer state | FLOWING |
| `ProfileStatDashboard.svelte` | `stats: LifetimeStats` prop | `profileStatsLive(profileId)` → liveQuery over `db.matches` | Yes — real DB aggregation via `computeLifetimeStats` | FLOWING |
| `MatchStatBreakdown.svelte` | Per-player computed values | `computeScoreBands(visitScoresFromState(...))`, `checkoutPercent`, `highestVisit`, `highestCheckout`, `bestLeg` over stored blob | Yes — pure functions over stored `MatchRecord.state` | FLOWING |
| `RecordOverlay.svelte` | `records: string[]` | `matchStore.pendingRecords` (set by `#detectRecords` after dispatch) | Yes — record detection over real preloaded `LifetimeStats` baselines | FLOWING |
| `LegWinBanner.svelte` | `recordBadge` prop | `/display` route `recordStrings` from `BroadcastChannel(BC_RECORD_CHANNEL)` | Yes — channel receives real record events from scorer | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit suite passes (291 tests, 14 files) | `npm run test:unit -- --reporter=dot` | 291 passed, 0 failed | PASS |
| Record detection tests pass (28 tests incl. D-05 null-baseline) | `npm run test:unit -- src/stores/match.svelte.test.ts` | 28 passed | PASS |
| Lifetime stats aggregation tests pass (15 tests) | `npm run test:unit -- src/db/stats.test.ts` | 15 passed | PASS |
| svelte-check: 1 pre-existing error only | `npm run check` | 1 error in `src/db/profiles.ts:24` (pre-existing Phase 3 debt, not introduced by Phase 4); 0 warnings | PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` in repo; phase is UI/engine, not a migration/CLI phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| STAT-01 | 04-01, 04-02, 04-04 | Live + cross-leg 3-dart average | SATISFIED | `matchAverageCrossLeg` in averages.ts; StatDrawer; PlayerStatRow; 8 test cases |
| STAT-02 | 04-01, 04-02 | First-9 average per leg | SATISFIED | `first9Average` in averages.ts; shown in StatDrawer under "Erste 9 Ø" |
| STAT-03 | 04-01, 04-02, 04-04 | Checkout percentage | SATISFIED | `checkoutPercent` in averages.ts; StatDrawer; MatchStatBreakdown |
| STAT-04 | 04-01, 04-02, 04-03, 04-04 | Score bands 180s/140+/100+/60+ | SATISFIED | `computeScoreBands` + `visitScoresFromState`; StatDrawer; ProfileStatDashboard; MatchStatBreakdown |
| STAT-05 | 04-01, 04-02, 04-04 | Highest visit, highest checkout, best/worst leg | SATISFIED | `highestVisit`, `highestCheckout`, `bestLeg`, `worstLeg` in averages.ts; all surfaces |
| STAT-07 | 04-03 | Lifetime statistics per profile | SATISFIED | `computeLifetimeStats` + `profileStatsLive` in db/stats.ts; `/stats` route with profile picker |
| STAT-08 | 04-03 | Dashboard charts (score distribution, average trend, darts per leg, win rate) | SATISFIED | ScoreDistributionChart, AverageTrendChart, DartsPerLegChart all present; win rate in KPI tile; hand-rolled SVG — no chart library |
| ACHV-01 | 04-05 | Records detected during play | SATISFIED | `#detectRecords` in match.svelte.ts; 180 always (D-04); null-baseline first-occurrence (D-05); 28 unit tests |
| ACHV-02 | 04-05 | Records celebrated on both views | SATISFIED (automated) | RecordOverlay on /match and /display; BC_RECORD_CHANNEL broadcast; win-banner folding (D-08) — cross-window portion needs human check |
| ACHV-03 | 04-05 | Records stored permanently | SATISFIED | Records derived from `db.matches` recompute (no separate records table per D-09); `computeLifetimeStats` is the record source |

**REQUIREMENTS.md tracking note:** STAT-07 and STAT-08 are marked "Pending" in `.planning/REQUIREMENTS.md` (lines 145-146) while implementation is fully present and tested. This is a documentation artifact — the traceability table was not updated after Phase 4 completed. Not a code gap; no action required on the implementation side, but the REQUIREMENTS.md should be updated to "Complete".

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/averages.test.ts` | 531 | `expect(true).toBe(true); // placeholder` | WARNING | Hollow assertion inside `'uses remaining-delta for numpad visits'` test. Documents a known architectural limitation (intermediate numpad remainders not stored in PlayerState). Not a debt marker (no TBD/FIXME/XXX). Adjacent test at line 534 (`'handles leg-closing numpad visit via wasCheckout flag'`) provides the actual coverage for the testable portion of this path. Acceptable — limitation is documented in PLAN/SUMMARY/averages.ts JSDoc. |

No `TBD`, `FIXME`, or `XXX` markers found in any file modified by Phase 4.

No chart library imports found in `src/ui/stats/` (no `chart.js`, `d3`, `apexcharts`). All charts are hand-rolled SVG per CLAUDE.md smallest-runtime constraint.

No `{@html}` usage found in any Phase 4 component.

### Human Verification Required

#### 1. Cross-Window Record Overlay (ACHV-01 / ACHV-02)

**Test:** Open `/match` + `/display` in two browser windows. Score a 180 (board or numpad). Confirm overlay appears on both windows and auto-dismisses after ~2.5 seconds without any tap.
**Expected:** Both windows show the `180!` overlay in amber; play continues; overlay disappears on its own after 2.5 s.
**Why human:** Cross-window BroadcastChannel delivery and CSS animation timing cannot be reliably asserted in Vitest unit tests.

#### 2. Record Fold into Win Banner (D-08 / ACHV-02)

**Test:** Score a record (e.g. new highest visit) on a leg-winning throw. Observe both `/match` and `/display`.
**Expected:** No standalone `RecordOverlay` appears. The leg-win banner shows the record text as a badge below the subtitle line. Same for a match-winning throw.
**Why human:** Coincident win-folding requires coordinating two live windows with specific game state; not automatable without integration-level infrastructure.

#### 3. Chart Legibility on Stats Dashboard (STAT-08)

**Test:** Open `/stats`, select a profile with >= 2 completed matches. Review the Score-Verteilung, Ø-Entwicklung, and Darts-pro-Leg chart sections.
**Expected:** Charts render with correct proportions and labels; amber accent on the highest/best bars; "Nicht genug Daten." shows correctly for a profile with only 1 match (for AverageTrendChart which requires >= 2 points); no chart library is loaded.
**Why human:** SVG chart layout and visual legibility require human judgment; DevTools network panel confirms no chart library loaded.

#### 4. Cross-Leg Average in Match History (STAT-01)

**Test:** Play a multi-leg match (e.g. best-of-3). Open History → select that completed match. Observe the player rows in the "Ergebnis" section and the "Statistiken" breakdown section.
**Expected:** Each player row shows a real numeric average (e.g. "52.4") rather than "—". The breakdown section shows 8 StatCard tiles per player with real values.
**Why human:** Requires a real completed multi-leg match in history to verify; the specific bug (cross-leg average showing "—") was the STAT-01 display debt that Plan 04 resolved.

---

## Gaps Summary

No gaps identified. All 10 observable truths are verified at all four levels (existence, substantive, wired, data-flowing). The 4 human-verification items are standard UI/cross-window checks that cannot be automated with unit tests — they are not indicators of missing implementation.

**Pre-existing known issue (not a Phase 4 gap):** `src/db/profiles.ts:24` has one Type error (`Type 'number | undefined' is not assignable to type 'number'`) documented as Phase 3 debt. It was present before Phase 4 began, not introduced by any Phase 4 change, and appears in every plan's SUMMARY as explicitly out of scope.

**Documentation gap (minor, non-blocking):** `REQUIREMENTS.md` traceability table still shows STAT-07 and STAT-08 as "Pending" rather than "Complete". Implementation is present and tested — this is a documentation artifact only.

---

_Verified: 2026-06-12T17:15:00Z_
_Verifier: Claude (gsd-verifier)_
