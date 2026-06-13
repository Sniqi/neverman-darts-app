---
phase: 04-statistics-achievements
plan: "03"
subsystem: db + ui + routes
tags: [statistics, lifetime-stats, svg-charts, profile-picker, dexie, tdd]
dependency_graph:
  requires:
    - computeLifetimeStats (04-01 engine functions: matchAverageCrossLeg, checkoutPercent, computeScoreBands, visitScoresFromState, highestVisit)
    - StatCard (04-02)
    - db.matches (Phase 3)
    - db.profiles / profilesLive (Phase 3)
  provides:
    - computeLifetimeStats
    - profileStatsLive
    - LifetimeStats interface (LOCKED field names for 04-04/04-05)
    - ScoreDistributionChart
    - AverageTrendChart
    - DartsPerLegChart
    - ProfileStatDashboard
    - /stats route
    - Statistik start-screen entry
  affects:
    - src/db/stats.ts
    - src/db/stats.test.ts
    - src/ui/stats/ScoreDistributionChart.svelte
    - src/ui/stats/AverageTrendChart.svelte
    - src/ui/stats/DartsPerLegChart.svelte
    - src/ui/stats/ProfileStatDashboard.svelte
    - src/routes/stats/+page.svelte
    - src/routes/+page.svelte
tech_stack:
  added: []
  patterns:
    - "liveQuery → Readable pattern (mirroring matchesLive) for profileStatsLive"
    - "hand-rolled SVG charts: horizontal bar (ScoreDistributionChart, DartsPerLegChart), line chart (AverageTrendChart)"
    - "SVG coordinate math: barWidth = (count/maxCount)*availableWidth; yCoord = padTop + plotH - ratio*plotH"
    - "TDD RED/GREEN — stats.test.ts committed before stats.ts"
    - "Svelte $derived for reactive chart coordinate computation"
    - "Two-step route: profile picker → ProfileStatDashboard with back-btn returning to picker"
key_files:
  created:
    - src/db/stats.ts
    - src/db/stats.test.ts
    - src/ui/stats/ScoreDistributionChart.svelte
    - src/ui/stats/AverageTrendChart.svelte
    - src/ui/stats/DartsPerLegChart.svelte
    - src/ui/stats/ProfileStatDashboard.svelte
    - src/routes/stats/+page.svelte
  modified:
    - src/routes/+page.svelte
decisions:
  - "computeLifetimeStats uses legCompleted[] for match darts/scored (not legStartVisitIndex) — all legs captured in legCompleted for completed blobs; currentLeg contribution is zero for fully-completed matches"
  - "highestCheckout computed by scanning wasCheckout=true board visits and summing dart values — board visits have exact dart scores, numpad checkout value computation deferred (score would be running remaining at visit time, which is not stored per-visit)"
  - "averageTrend omits matches with zero darts (matchDarts=0) — these are legacy blobs without legCompleted; only pushes real match averages"
  - "profileStatsLive returns null on DB failure (graceful degradation for private mode per T-04-07)"
  - "Pre-existing profiles.ts type error left as-is — out of scope, predates this plan (documented in 04-02 SUMMARY)"
metrics:
  duration: "7 min"
  completed: "2026-06-12"
  tasks: 3
  files: 8
---

# Phase 04 Plan 03: Lifetime Statistics Dashboard Summary

Lifetime statistics slice: `computeLifetimeStats` pure aggregation from `db.matches` blobs, three hand-rolled SVG chart components, `ProfileStatDashboard` with KPI tiles + records, `/stats` route with profile picker, and "Statistik" start-screen entry — all without a chart library or new DB schema.

## What Was Built

### Task 1 — db/stats.ts: computeLifetimeStats + profileStatsLive (commits d970db3, ffb55da, ba9ad9d)

Created `src/db/stats.ts`:
- `LifetimeStats` interface with LOCKED cross-plan field names: `matchAverage: number | null`, `highestVisit: number`, `highestCheckout: number`, `bestLeg: number | null` (consumed by 04-04/04-05 record preload)
- `computeLifetimeStats(matches, profileId)`: pure function — filters by `player.id === profileId`, aggregates `matchesPlayed`, `wins`, `winRate`, lifetime average (total darts ratio, not mean-of-means), `checkoutPercent`, `scoreBands`, `highestVisit`, `highestCheckout`, `bestLeg`, `averageTrend` (oldest→newest), `dartsPerLegBuckets`
- `profileStatsLive(profileId)`: mirrors `matchesLive()` verbatim — `liveQuery` → `readable<LifetimeStats | null>`, emits null on DB failure
- No `.version()` or `.stores()` — reads `db.matches` only (D-09 compliance)

Created `src/db/stats.test.ts` (13 tests, all green):
- player.id filtering, other-player exclusion
- guest id yields matchesPlayed=0
- win count and win-rate formula
- highestVisit, bestLeg, highestCheckout, averageTrend ordering
- legacy blob without legCompleted does not throw
- profileStatsLive reactive emission

TDD: RED commit (d970db3) before GREEN commit (ffb55da). Auto-fix ba9ad9d corrected a TypeScript cast in the test (Rule 1 - Bug).

### Task 2 — SVG charts and ProfileStatDashboard (commit 1d59e90)

Created three hand-rolled SVG chart components in `src/ui/stats/`:
- `ScoreDistributionChart.svelte`: horizontal bar chart, bands 180/140+/100+/60+, accent `#e8a020` on highest-count band, `role="img"` + `aria-label`
- `AverageTrendChart.svelte`: `<polyline>` line chart with axes, y-axis ticks, data dots; empty state "Nicht genug Daten." when < 2 points; flat-line-at-midpoint when maxY===minY
- `DartsPerLegChart.svelte`: vertical bar chart per leg, accent on best (fewest-dart) leg; empty state when no data; scrollable for large leg counts

Created `src/ui/stats/ProfileStatDashboard.svelte`:
- Props: `stats: LifetimeStats`, `profileName: string`
- When `stats.matchesPlayed === 0`: `role="status"` empty state ("Noch keine Spiele." / "Spiele ein Match…")
- When matches exist: KPI grid (StatCard tiles — "Matches gespielt", "Gewinnrate", "3-Dart Ø (Lifetime)", "Finish %"), records grid ("Höchste Aufnahme", "Höchstes Finish", "Bestes Leg (Darts)"), three chart sections under `<h2>` headings
- null → "—"; averages formatted to one decimal; percentages as rounded integers
- All strings via `{interpolation}`; no `{@html}`; StatCard reused from 04-02

### Task 3 — /stats route and start-screen entry (commit 1896409)

Created `src/routes/stats/+page.svelte`:
- Profile picker: `profilesLive()` → button row per profile (`class="menu-btn"`, `aria-label="Statistik für {name} anzeigen"`); empty state when no profiles
- Profile selected: `$derived(profileStatsLive(selectedProfileId))` → `ProfileStatDashboard`
- Back-btn: returns to picker when profile selected, to start screen when at picker
- Loading state while `$stats === null`
- Base-path aware throughout; no guest source (guests not in db.profiles)

Modified `src/routes/+page.svelte`:
- Added fourth `<button class="menu-btn">Statistik</button>` after "Daten / Backup" button with identical chevron SVG; navigates to `${base}/stats`

## Test Results

```
Test Files  14 passed (14)
Tests       275 passed (275)
```

All new tests green. All existing tests unaffected. `npm run check`: 1 pre-existing error in `src/db/profiles.ts` (out-of-scope type error predating this plan, documented in 04-02 SUMMARY). Zero new errors or warnings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript double-cast for legacy-blob test**
- **Found during:** Task 1 `npm run check` pass
- **Issue:** `p as Record<string, unknown>` triggered TS strict-overlap error — `PlayerState` does not satisfy string-index constraint
- **Fix:** Changed to `p as unknown as Record<string, unknown>` (standard safe double-cast pattern)
- **Files modified:** `src/db/stats.test.ts`
- **Commit:** ba9ad9d

**2. [Rule 1 - Bug] Svelte $derived reference warning in ScoreDistributionChart**
- **Found during:** Task 2 `npm run check` pass
- **Issue:** `const viewBoxHeight = bands.length * ROW_HEIGHT + 10` referenced `$derived` state `bands` from a plain `const` — Svelte emits "This reference only captures the initial value"
- **Fix:** Changed to `const viewBoxHeight: number = $derived(bands.length * ROW_HEIGHT + 10)`
- **Files modified:** `src/ui/stats/ScoreDistributionChart.svelte`
- **Commit:** 1d59e90 (included in task commit)

## Known Stubs

None. All stat values flow from real `db.matches` aggregation. `highestCheckout` for numpad checkout visits computes from `wasCheckout=true` board-visit dart sums; numpad-checkout values are 0 (numpad checkout visits have `darts: []` so there is no dart-sum to compute — the value would require per-visit remaining which is not stored). This is a known limitation: numpad checkouts will show 0 in highestCheckout rather than the actual score. Tracked as deferred — the same limitation applies to `visitScoresFromState` for non-closing numpad visits (documented in 04-01 SUMMARY).

## Threat Flags

T-04-05 mitigated: all profile/player names rendered via Svelte `{interpolation}` throughout — `src/routes/stats/+page.svelte`, `src/ui/stats/ProfileStatDashboard.svelte`, all chart `aria-label` attributes use computed strings via template interpolation. Grep confirmed no `{@html}` usage in any new file.

T-04-06 mitigated: legacy blobs without `legCompleted` handled via `player.legCompleted ?? []` in `computeLifetimeStats`. Test fixture confirms non-throwing behaviour. Score fields default to 0/null for empty-data cases.

No new network endpoints, auth paths, file access patterns, or schema changes introduced. `db.matches` read-only filter scan, no `.version()` bump.

## Self-Check: PASSED

- src/db/stats.ts: FOUND
- src/db/stats.test.ts: FOUND
- src/ui/stats/ScoreDistributionChart.svelte: FOUND
- src/ui/stats/AverageTrendChart.svelte: FOUND
- src/ui/stats/DartsPerLegChart.svelte: FOUND
- src/ui/stats/ProfileStatDashboard.svelte: FOUND
- src/routes/stats/+page.svelte: FOUND
- src/routes/+page.svelte: FOUND (modified — Statistik button)
- commit d970db3 (RED): FOUND
- commit ffb55da (GREEN): FOUND
- commit ba9ad9d (fix cast): FOUND
- commit 1d59e90 (charts + dashboard): FOUND
- commit 1896409 (route + start screen): FOUND
