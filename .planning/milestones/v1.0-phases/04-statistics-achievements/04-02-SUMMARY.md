---
phase: 04-statistics-achievements
plan: "02"
subsystem: ui
tags: [statistics, drawer, statcard, svelte, accessibility]
dependency_graph:
  requires:
    - matchAverageCrossLeg
    - legAverage
    - first9Average
    - checkoutPercent
    - computeScoreBands
    - visitScoresFromState
    - bestLeg
    - highestVisit
  provides:
    - StatCard
    - StatDrawer
  affects:
    - src/ui/stats/StatCard.svelte
    - src/ui/input/StatDrawer.svelte
    - src/routes/match/+page.svelte
tech_stack:
  added: []
  patterns:
    - "$derived.by() for multi-step reactive stat computations"
    - "CSS max-height transition for drawer expand/collapse (no JS animation library)"
    - "aria-expanded + aria-controls accessibility pattern"
    - "Pre-formatted value strings passed to StatCard (display layer owns formatting)"
key_files:
  created:
    - src/ui/stats/StatCard.svelte
    - src/ui/input/StatDrawer.svelte
  modified:
    - src/routes/match/+page.svelte
decisions:
  - "first9Average legScored computed inline in StatDrawer by walking first 3 leg visits with running remaining — handles board visits exactly; non-closing numpad visits in first 3 skipped (unrecoverable per 04-01 visitScoresFromState limitation)"
  - "StatDrawer wrapper uses border-top on outer container not the panel div — keeps the collapsed state visually connected to ScorePanel"
  - "Accent bottom-border on toggle when open (UI-SPEC color item 6) rather than left-border to avoid layout shift in the panel-area flex column"
metrics:
  duration: "3 min"
  completed: "2026-06-12"
  tasks: 3
  files: 3
---

# Phase 04 Plan 02: Live Stats Drawer Summary

Live in-match statistics drawer: `StatCard` KPI tile + `StatDrawer` toggle/panel reading all 04-01 engine functions, mounted below `ScorePanel` on the match route.

## What Was Built

### Task 1 — StatCard KPI tile (commit 1d58fd0)

Created `src/ui/stats/StatCard.svelte`:
- Props `{ label: string; value: string }` — value pre-formatted by caller
- Template: `.stat-value` (20px/600/`#f0f0f0`) above `.stat-label` (14px/400/`#888888`)
- Background `#1e2027`, border-radius 8px, padding `var(--space-md, 16px)` per UI-SPEC
- All strings via `{interpolation}` — no `{@html}` (T-04-03)

### Task 2 — StatDrawer live stats panel (commit b43693e)

Created `src/ui/input/StatDrawer.svelte`:
- Imports all 8 stat functions from `../../engine/averages.js`
- Local `let open = $state(false)` — resets to closed on route navigation (state is component-local)
- `$derived.by()` computes all stats reactively from `matchStore.state`
- Two-column grid layout: left = "Dieses Leg" (3-Dart Ø, Erste 9 Ø), right = "Dieses Match" (3-Dart Ø, Finish %, 180er, 140+, 100+, Höchste Aufnahme, Bestes Leg (Darts))
- Exact German labels from UI-SPEC Copywriting table
- CSS `max-height: 0 → 60dvh` transition 200ms ease — no JS animation library
- Toggle button: min-height 44px, `aria-expanded={open}`, `aria-controls="stat-drawer"`
- Panel: `id="stat-drawer"`, `role="region"`
- Accent bottom-border on toggle when open (UI-SPEC accent usage item 6)
- Focus ring `outline: 2px solid #e8a020; outline-offset: 2px` on toggle
- No `{@html}`; no `matchStore.dispatch()` call

### Task 3 — Mount in match route (commit 6f15d21)

Modified `src/routes/match/+page.svelte`:
- Added 1 import line: `import StatDrawer from '../../ui/input/StatDrawer.svelte'`
- Added 1 mount line: `<StatDrawer />` after `<ScorePanel />` inside `.panel-area`
- Zero changes to ScorePanel, CorrectionWindow, Numpad, Dartboard, or overlay wiring

## Test Results

```
Test Files  13 passed (13)
Tests       262 passed (262)
```

All existing tests pass. No regressions.

## Deviations from Plan

None — plan executed exactly as written.

The pre-existing `src/db/profiles.ts` type error (`Type 'number | undefined' is not assignable to type 'number'`) is out of scope for this plan (it predates this work). Logged to deferred items.

## Known Stubs

None. All stat values flow from live engine state via the 04-01 functions. Null results display as `'—'` which is the correct empty-data representation per UI-SPEC.

## Threat Flags

T-04-03 mitigated: all player names and computed stat values rendered via Svelte `{interpolation}` only. Verified by grep — no `{@html}` in either new component.

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- src/ui/stats/StatCard.svelte: FOUND
- src/ui/input/StatDrawer.svelte: FOUND
- src/routes/match/+page.svelte: FOUND (modified)
- commit 1d58fd0: FOUND
- commit b43693e: FOUND
- commit 6f15d21: FOUND
