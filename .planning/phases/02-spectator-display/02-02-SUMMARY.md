---
phase: 02-spectator-display
plan: "02"
subsystem: stores + display route + UI components
tags: [broadcast-channel, localStorage, spectator-display, tdd, player-panel, match-header, idle-screen, live-sync]
dependency_graph:
  requires:
    - src/engine/averages.ts (legAverage, matchAverage — from 02-01)
    - src/stores/display.svelte.ts (DisplayStore, displayStore — from 02-01)
    - src/engine/types.ts (MatchState, PlayerState, MatchConfig, legStartVisitIndex — from 02-01)
  provides:
    - src/stores/match.svelte.ts (BC_CHANNEL + LS_SNAPSHOT publisher in dispatch())
    - src/routes/display/+page.svelte (spectator route shell)
    - src/ui/display/PlayerPanel.svelte (TV player column with name, remaining, averages)
    - src/ui/display/MatchHeader.svelte (40px slim header bar)
    - src/ui/display/IdleScreen.svelte (waiting screen)
    - src/ui/display/PlayerPanel.test.ts (browser component tests)
  affects:
    - e2e/spectator-sync.spec.ts (red baseline from 02-01 now has a real /display route to hit)
tech_stack:
  added: []
  patterns:
    - Fire-and-forget BroadcastChannel (create/postMessage/close per dispatch)
    - Both publisher ops wrapped in independent try/catch (non-fatal; match continues)
    - Prop-driven display component (PlayerPanel reads no store — pure props)
    - $derived.by() for computed averages inside Svelte 5 component
    - CSS custom property --player-count drives repeat(var(--player-count),1fr) grid
    - TDD RED/GREEN cycle for browser component tests
key_files:
  created:
    - src/ui/display/PlayerPanel.svelte
    - src/ui/display/MatchHeader.svelte
    - src/ui/display/IdleScreen.svelte
    - src/routes/display/+page.svelte
    - src/ui/display/PlayerPanel.test.ts
  modified:
    - src/stores/match.svelte.ts
decisions:
  - BC_CHANNEL and LS_SNAPSHOT are module-top constants (not inside the class) — matches display.svelte.ts pattern
  - Both BroadcastChannel and localStorage operations use independent try/catch so one failure cannot suppress the other
  - PlayerPanel is purely prop-driven; the route maps state.legStartVisitIndex[player.id] to legStartIndex prop
  - currentLeg derived as sum(player.legsWon) + 1 — covers both legs-only and sets formats
  - void base in the route suppresses the unused-import warning without removing the import (needed for future navigation)
metrics:
  duration: "3 minutes"
  completed: "2026-06-11"
  tasks: 2
  files: 6
---

# Phase 02 Plan 02: Spectator Display — Live Grid and Sync Transport Summary

**One-liner:** BroadcastChannel + localStorage publisher wired into MatchStore.dispatch(), and the /display route built as a TV-style 1–4 player grid with name, large remaining score, legs/sets, per-panel averages, slim header bar, and idle waiting screen.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add BroadcastChannel + localStorage publisher to MatchStore.dispatch() | `f36711b` | src/stores/match.svelte.ts |
| 2 | /display route + PlayerPanel + MatchHeader + IdleScreen (TDD RED + GREEN) | `c13c511` (RED), `04286f5` (GREEN) | PlayerPanel.svelte, MatchHeader.svelte, IdleScreen.svelte, +page.svelte, PlayerPanel.test.ts |

## Verification

- `npm run test:unit -- src/stores/match.svelte.test.ts` — 15 tests, all passing (publisher is additive)
- `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` — 6 tests, all passing
- `npm run check` — 1 pre-existing error in `src/db/profiles.ts` only (not introduced by this plan)
- `grep -rn "{@html" src/ui/display` — 0 matches (T-02-04 XSS guard confirmed)
- `grep -n "repeat(var(--player-count)" src/routes/display/+page.svelte` — confirmed D-01 equal-fraction grid
- `grep -n "displayStore.connect" src/routes/display/+page.svelte` — confirmed $effect connection
- `npm run build` — succeeds; `/display` prerenders under adapter-static

## Acceptance Criteria Status

- [x] `npm run test:unit -- src/stores/match.svelte.test.ts` passes (publisher additive, 15 tests)
- [x] `grep -n "new BroadcastChannel" src/stores/match.svelte.ts` shows publisher in dispatch()
- [x] `grep -n "neverman-match" src/stores/match.svelte.ts` shows both channel name and snapshot key
- [x] Both postMessage and setItem wrapped in independent try/catch
- [x] `npm run check` no new type errors (pre-existing profiles.ts error unchanged)
- [x] `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` passes (6 tests)
- [x] `grep -rn "{@html" src/ui/display` returns 0 matches (T-02-04)
- [x] `grep -n "repeat(var(--player-count)" src/routes/display/+page.svelte` confirmed (D-01)
- [x] PlayerPanel renders Ø Leg and Ø Match labels and — for zero-visit player (D-04)
- [x] `npm run build` succeeds (/display prerenders under adapter-static)

## Deviations from Plan

None — plan executed exactly as written.

The `void base` pattern in the route suppresses the TypeScript unused-import warning for the `base` import from `$app/paths` without removing it. The import is reserved for future navigation (Plan 03 SpectatorChooser window.open call) per the plan's note. This is a minor cosmetic deviation to keep the check clean.

## TDD Gate Compliance

Task 2 followed the RED/GREEN cycle:

- RED commit: `c13c511` — 6 browser tests written; all fail (import error: PlayerPanel.svelte does not exist)
- GREEN commit: `04286f5` — all 6 tests pass after implementing PlayerPanel, MatchHeader, IdleScreen, +page.svelte

## Known Stubs

None — all components are fully wired implementations. PlayerPanel reads real averages from averages.ts via props. The /display route reads from displayStore which subscribes to live BroadcastChannel updates. No placeholder data or hardcoded values flow to the UI.

## Threat Flags

No new security surface beyond the plan's threat model.

- T-02-04 (XSS): mitigated — `grep -rn "{@html" src/ui/display` returns 0 matches. All player names rendered via `{player.name}` Svelte interpolation (auto-escaped).
- T-02-03 (DoS / localStorage quota): mitigated — setItem wrapped in try/catch in dispatch(); silent failure.
- T-02-02 (BroadcastChannel origin spoofing): accepted — same-origin only (ASVS L1).

## Self-Check: PASSED
