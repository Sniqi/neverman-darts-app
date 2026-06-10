---
phase: "01"
plan: "08"
subsystem: match-store
tags: [bugfix, live-recalculation, ux, tdd]
dependency_graph:
  requires: []
  provides: [live-mid-visit-remaining, live-checkout-suggestion]
  affects: [src/stores/match.svelte.ts, src/stores/match.svelte.test.ts]
tech_stack:
  added: []
  patterns: [getter-derivation-over-reducer-state]
key_files:
  created: []
  modified:
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
decisions:
  - "remaining getter subtracts currentVisit running total for live display; reducer stays committed at visit end only"
metrics:
  duration: "4 min"
  completed: "2026-06-10"
---

# Phase 01 Plan 08: Live Mid-Visit Remaining (CR-06) Summary

**One-liner:** Fixed `MatchStore.remaining` getter to subtract the current board visit's running dart total, so remaining score and checkout suggestion update live after every dart (ENG-07 / D-10).

## What Was Built

Closed CR-06: the `remaining` getter in `MatchStore` now computes a derived live value by subtracting the sum of `state.currentVisit` dart scores (`multiplier * segment`) from the active player's committed `remaining`. Since `get suggestion()` already calls `this.remaining`, the checkout suggestion also updates live for free — no change to the suggestion getter or the reducer was needed.

### Files Modified

| File | Change |
|------|--------|
| `src/stores/match.svelte.ts` | `get remaining()` now subtracts `currentVisit` running total |
| `src/stores/match.svelte.test.ts` | Added 4 mid-visit tests covering CR-06 behavior |

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Add failing mid-visit remaining tests | 7a3012e | match.svelte.test.ts |
| GREEN | Fix MatchStore.remaining getter | 4a75611 | match.svelte.ts |

## TDD Gate Compliance

- RED commit (`test(01-08)` at 7a3012e): 3 tests added, all failed as expected.
- GREEN commit (`feat(01-08)` at 4a75611): all 15 tests pass.
- No REFACTOR step needed — the change is a minimal 5-line getter body replacement.

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `get remaining()` subtracts sum over `currentVisit` | PASS — getter body confirmed |
| Reducer (`src/engine/reducer.ts`) not modified | PASS — untouched |
| After one T20 from 501: `remaining === 441` | PASS |
| After two T20s from 501: `remaining === 381` | PASS |
| On 100 then T20: `remaining === 40`, suggestion includes D20 | PASS |
| After two numpad 180s: `remaining === 141`, `currentVisit` empty | PASS (unchanged) |
| `npx vitest run src/stores/match.svelte.test.ts` — all 15 pass | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Pure in-memory read-only derivation as described in the threat model.

## Self-Check: PASSED

- `src/stores/match.svelte.ts` — found, getter body verified
- `src/stores/match.svelte.test.ts` — found, 4 new mid-visit tests present
- Commit 7a3012e — found (RED)
- Commit 4a75611 — found (GREEN)
