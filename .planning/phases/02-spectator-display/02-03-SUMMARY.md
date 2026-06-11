---
phase: 02-spectator-display
plan: "03"
subsystem: display UI components + overlay wiring
tags: [visit-line, leg-win-banner, match-win-display, bust-flash, checkout-route, tdd, red-green, xss-guard]
dependency_graph:
  requires:
    - src/engine/averages.ts (legAverage, matchAverage — from 02-01)
    - src/engine/checkout.ts (getSuggestion — reused for D-06 checkout route)
    - src/stores/display.svelte.ts (DisplayStore — from 02-01)
    - src/ui/display/PlayerPanel.svelte (from 02-02 — extended here)
    - src/routes/display/+page.svelte (from 02-02 — extended here)
  provides:
    - src/ui/display/VisitLine.svelte (live dart slots + completed visit line)
    - src/ui/display/LegWinBanner.svelte (full-screen leg/set win banner)
    - src/ui/display/MatchWinDisplay.svelte (persistent match winner display)
  affects:
    - src/ui/display/PlayerPanel.svelte (checkout route + BUST flash + VisitLine integration)
    - src/routes/display/+page.svelte (overlay layers + legsWon-delta watcher)
tech_stack:
  added: []
  patterns:
    - formatDart copied verbatim from VisitStrip.svelte (no re-implementation)
    - getSuggestion() reused from checkout.ts for D-06 checkout route
    - $state + $effect + setTimeout for 2s BUST flash with cleanup
    - legsWon/setsWon delta watcher + clear-on-first-dart for event-driven D-09 dismiss
    - Renamed 'state' derived to 'matchState' to avoid $state rune naming conflict in svelte-check
    - position:absolute bust overlay; position:fixed banner (z-10) and match-win (z-20)
key_files:
  created:
    - src/ui/display/VisitLine.svelte
    - src/ui/display/VisitLine.test.ts
    - src/ui/display/LegWinBanner.svelte
    - src/ui/display/LegWinBanner.test.ts
    - src/ui/display/MatchWinDisplay.svelte
  modified:
    - src/ui/display/PlayerPanel.svelte
    - src/routes/display/+page.svelte
decisions:
  - formatDart copied verbatim from VisitStrip.svelte to maintain identical German copy (0/Daneben, Bull, Outer Bull, T/D prefixes)
  - completedTotal prop passed from parent to VisitLine for numpad visits (resolves RESEARCH Open Question 1 — no Visit type mutation needed)
  - liveRemaining computed in PlayerPanel by subtracting currentVisit running total from player.remaining for D-05 live score countdown
  - 'matchState' variable name used instead of 'state' in display route to avoid svelte-check false-positive treating $state(null) as a store subscription on 'state'
  - MatchWinDisplay has no dedicated component test — pure prop component; matchAverage unit-tested in 02-01; render covered by Plan-04 e2e match-completion flow
metrics:
  duration: "8 minutes"
  completed: "2026-06-11"
  tasks: 2
  files: 7
---

# Phase 02 Plan 03: Live Visit Display, Special States, and Overlay Wiring Summary

**One-liner:** VisitLine dart-by-dart slot component, checkout route and BUST flash in PlayerPanel, leg/set win banner and match win display with overlay wiring in the /display route.

## Tasks Completed

| # | Task | Commits | Files |
|---|------|---------|-------|
| 1 | VisitLine + checkout route + BUST flash in PlayerPanel (TDD) | `9fdab9d` (RED), `40f95dc` (GREEN) | VisitLine.svelte, VisitLine.test.ts, PlayerPanel.svelte (extended), PlayerPanel.test.ts (extended) |
| 2 | LegWinBanner + MatchWinDisplay + overlay wiring in /display (TDD) | `15136c3` (RED), `5819708` (GREEN) | LegWinBanner.svelte, LegWinBanner.test.ts, MatchWinDisplay.svelte, +page.svelte (extended) |

## Verification

- `npm run test:browser -- src/ui/display/VisitLine.test.ts src/ui/display/LegWinBanner.test.ts src/ui/display/PlayerPanel.test.ts` — 27 tests, all passing (3 test files)
- `npm run check` — 1 pre-existing error in `src/db/profiles.ts` only (not introduced by this plan)
- `npm run build` — succeeds; /display prerenders under adapter-static with all new components
- `grep -rn "{@html" src/ui/display/ | grep -v "// "` — 0 matches (T-02-04 XSS guard confirmed)
- `grep -n "getSuggestion" src/ui/display/PlayerPanel.svelte` — confirmed checkout reuse (import + 2 usage lines; no re-implemented logic)
- `grep -n "legWinMessage" src/routes/display/+page.svelte` — confirmed delta watcher + clear-on-first-dart

## Acceptance Criteria Status

- [x] `npm run test:browser -- src/ui/display/VisitLine.test.ts src/ui/display/PlayerPanel.test.ts` passes (21 tests)
- [x] VisitLine renders "T20 · – · –" for single-dart current visit and total-only for numpad completed visit
- [x] `grep -n "getSuggestion" src/ui/display/PlayerPanel.svelte` confirms checkout reuse
- [x] `grep -rn "{@html" src/ui/display` returns ZERO matches (T-02-04)
- [x] PlayerPanel shows the "BUST" label when active player's last visit is a bust; clears after ~2s
- [x] `npm run test:browser -- src/ui/display/LegWinBanner.test.ts` passes (6 tests)
- [x] LegWinBanner renders nothing for `message=null` and the message text for non-null, with name in accent color
- [x] `grep -n "legWinMessage" src/routes/display/+page.svelte` confirms legsWon-delta watcher + clear-on-first-dart
- [x] `grep -n "phase === 'match-complete'" src/routes/display/+page.svelte` confirms match-win branch
- [x] MatchWinDisplay.svelte exists; rendered on match-complete branch; no dedicated component test by design
- [x] `npm run check` clean (pre-existing profiles.ts error only)
- [x] `npm run build` succeeds

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed `state` derived variable to `matchState` in display route**
- **Found during:** Task 2 — `npm run check` after implementing overlay wiring
- **Issue:** `let state = $derived(displayStore.state)` combined with `$state(null)` rune calls in the same `<script>` caused svelte-check to treat `$state(null)` as a store auto-subscription attempt on the `state` variable (a `MatchState | null`), producing 4 false-positive type errors
- **Fix:** Renamed the derived variable from `state` to `matchState` throughout the route; no behavior change
- **Files modified:** `src/routes/display/+page.svelte`
- **Commit:** `5819708`

## TDD Gate Compliance

Both tasks followed the RED/GREEN cycle:

**Task 1:**
- RED commit `9fdab9d`: VisitLine.test.ts (10 tests, module-not-found fail) + PlayerPanel.test.ts extended (2 new tests fail for checkout/BUST)
- GREEN commit `40f95dc`: VisitLine.svelte created, PlayerPanel.svelte extended — all 21 tests pass

**Task 2:**
- RED commit `15136c3`: LegWinBanner.test.ts (6 tests, module-not-found fail)
- GREEN commit `5819708`: LegWinBanner.svelte, MatchWinDisplay.svelte created, +page.svelte extended — all 27 tests pass

## Known Stubs

None — all components are fully wired implementations:
- VisitLine renders from real `currentVisit` / `lastCompletedVisit` / `completedTotal` props
- PlayerPanel checkout route uses real `getSuggestion()` from the engine
- BUST flash reads real `player.visits[last].bust` value
- LegWinBanner is prop-driven; parent wires real legsWon delta detection
- MatchWinDisplay reads real `state.players[activePlayerIndex]` and `matchAverage()`
- No hardcoded placeholder text, empty arrays flowing to UI, or TODO labels

## Threat Flags

No new security surface beyond the plan's threat model.

- T-02-04 (XSS / Injection): mitigated — `grep -rn "{@html" src/ui/display/ | grep -v "// "` returns 0 matches. All player names in LegWinBanner (`{message}`), MatchWinDisplay (`{winner?.name}`), and BUST label (static string "BUST") rendered via Svelte interpolation (auto-escaped).
- T-02-05 (legsWon delta watcher tampering): accepted — same-origin channel; snapshot integrity equals the scoring tab's own state (ASVS L1). Undo correctly reverts legsWon so banner clears (RESEARCH A5).

## Self-Check: PASSED
