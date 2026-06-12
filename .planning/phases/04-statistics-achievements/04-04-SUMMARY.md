---
phase: 04-statistics-achievements
plan: "04"
subsystem: ui
tags: [statistics, match-detail, breakdown, history, PlayerStatRow, cross-leg-average]
dependency_graph:
  requires:
    - matchAverageCrossLeg
    - computeScoreBands
    - visitScoresFromState
    - checkoutPercent
    - highestVisit
    - bestLeg
    - StatCard
  provides:
    - MatchStatBreakdown
  affects:
    - src/ui/history/MatchStatBreakdown.svelte
    - src/ui/history/PlayerStatRow.svelte
    - src/routes/history/[id]/+page.svelte
tech_stack:
  added: []
  patterns:
    - "@const destructuring for per-iteration derived values in {#each} blocks"
    - "Svelte {interpolation} only for all player names (T-04-09)"
    - "Legacy blob safety: ?. and ?? [] guards on optional fields"
key_files:
  created:
    - src/ui/history/MatchStatBreakdown.svelte
  modified:
    - src/ui/history/PlayerStatRow.svelte
    - src/routes/history/[id]/+page.svelte
decisions:
  - "highestCheckoutScore computed inline in {#each} block via checkoutVisits filter + map — avoids adding a new engine function for a one-off display derivation"
  - "Orphaned .phase4-region CSS rule removed when the div was replaced — my own change made it unused (Rule 3 cleanup)"
metrics:
  duration: "2 min"
  completed: "2026-06-12"
  tasks: 2
  files: 3
---

# Phase 04 Plan 04: Match Detail Stats Breakdown Summary

Fills the Phase 3 `.phase4-region` growth surface with `MatchStatBreakdown` (per-player score bands, checkout %, highest visit/checkout, best leg) and fixes the cross-leg average in `PlayerStatRow` (STAT-01 display debt resolved).

## What Was Built

### Task 1 — MatchStatBreakdown component (commit 3257946)

Created `src/ui/history/MatchStatBreakdown.svelte` (122 lines):
- Props interface `{ players: PlayerState[]; config: MatchConfig; winnerId: string; legStartVisitIndex: Record<string, number> }`
- Section heading "Statistiken" (20px/600) per UI-SPEC Copywriting table
- `{#each players}` loop renders a `.player-stat-block` per player with `<h3 class="player-name" class:winner>` using accent `#e8a020` for winner, `#f0f0f0` for others
- 8 StatCard tiles per player: 180er, 140+, 100+, 60+, Finish %, Höchste Aufnahme, Höchstes Finish, Bestes Leg (Darts)
- German labels from UI-SPEC Copywriting table
- Stats computed via 04-01 functions: `computeScoreBands(visitScoresFromState(...))`, `checkoutPercent`, `highestVisit`, `bestLeg`
- Highest checkout derived inline from `player.visits.filter(v => v.wasCheckout === true)` — returns "—" for legacy blobs with no `wasCheckout` visits (T-04-10 mitigated)
- All names via `{interpolation}` — no `{@html}` (T-04-09)
- CSS reuses section-card / section-heading tokens; 2-column `kpi-grid` via CSS Grid

### Task 2 — PlayerStatRow cross-leg average + route mount (commit 62ae46b)

Extended `src/ui/history/PlayerStatRow.svelte`:
- Added `legStartVisitIndex: number` prop (additive to existing `Props` interface)
- Replaced `if (totalLegsPlayed > 1) return '—'` early-return with `matchAverageCrossLeg(player, legStartVisitIndex, config.startScore)` — STAT-01 cross-leg display debt resolved
- Import changed from `computeAverage` to `matchAverageCrossLeg`

Modified `src/routes/history/[id]/+page.svelte`:
- Imported `MatchStatBreakdown`
- Passed `legStartVisitIndex={record.state.legStartVisitIndex[player.id] ?? 0}` to each `<PlayerStatRow>`
- Replaced `<div class="phase4-region" aria-hidden="true"></div>` with `<MatchStatBreakdown players={...} config={...} winnerId={...} legStartVisitIndex={...} />`
- Removed orphaned `.phase4-region` CSS rule (my edit made it unused)

## Test Results

```
Test Files  14 passed (14)
Tests       275 passed (275)
```

All existing tests pass. No regressions.

## Deviations from Plan

None — plan executed exactly as written.

The pre-existing `src/db/profiles.ts` type error (`Type 'number | undefined' is not assignable to type 'number'`) remains out of scope. It predates this plan and was already logged in the 04-02 SUMMARY deferred items.

## Known Stubs

None. All stat values flow from real engine computation over stored match state. Null/zero cases correctly display "—".

## Threat Flags

T-04-09 mitigated: player names in `MatchStatBreakdown` and `PlayerStatRow` rendered via Svelte `{interpolation}` only — confirmed by grep (no `{@html}` in either file).

T-04-10 mitigated: `highestCheckoutScore` derived from `player.visits.filter(v => v.wasCheckout === true)` — returns null/`"—"` for legacy blobs with no `wasCheckout` field. `bestLeg` and `highestVisit` use `?? []` guards in 04-01 engine layer. No-throw confirmed via `npm run check`.

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- src/ui/history/MatchStatBreakdown.svelte: FOUND (122 lines, >= 30 minimum)
- src/ui/history/PlayerStatRow.svelte: FOUND (modified)
- src/routes/history/[id]/+page.svelte: FOUND (modified)
- commit 3257946: FOUND
- commit 62ae46b: FOUND
