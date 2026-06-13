---
phase: 02-spectator-display
plan: 05
subsystem: spectator-sync
tags: [gap-closure, broadcastchannel, svelte-runes, e2e, popup]
dependency_graph:
  requires: ["02-04"]
  provides: ["live-spectator-sync", "leg-win-banner-stability", "popup-block-detection"]
  affects: ["src/stores/match.svelte.ts", "src/routes/display/+page.svelte", "src/ui/display/SpectatorChooser.svelte", "e2e/spectator-sync.spec.ts"]
tech_stack:
  added: []
  patterns: ["$state.snapshot() for structuredClone-safe postMessage", "plain let variables as previous-value trackers inside $effect", "win.opener = null for reverse-tabnabbing guard without noopener features string"]
key_files:
  modified:
    - src/stores/match.svelte.ts
    - src/routes/display/+page.svelte
    - src/ui/display/SpectatorChooser.svelte
    - src/ui/display/SpectatorChooser.test.ts
    - e2e/spectator-sync.spec.ts
decisions:
  - "WR-02 option (a): drop noopener features string, null win.opener manually to preserve T-02-06 reverse-tabnabbing intent"
metrics:
  duration: "5 min"
  completed: "2026-06-11T18:37:41Z"
  tasks: 4
  files_modified: 5
---

# Phase 02 Plan 05: Gap Closure — Live Sync + Effect Loop + Popup Fix Summary

**One-liner:** Three surgical fixes restoring live BroadcastChannel sync ($state.snapshot), eliminating infinite $effect loop (plain prev-value trackers), and correcting false popup-blocked detection (drop noopener, null opener manually), plus a live no-reload e2e guard.

## What Was Built

This gap-closure plan repaired three defects found during Phase 02 verification that prevented the spectator display from functioning correctly during live matches. No new public symbols were added.

### Task 1: Restore live BroadcastChannel sync (CR-01 / DISP-05)
**Commit:** `eef1047`

In `MatchStore.dispatch()`, changed `ch.postMessage(this.state)` to `ch.postMessage($state.snapshot(this.state))`. `this.state` is a Svelte 5 `$state` reactive Proxy; the structuredClone algorithm inside `postMessage` throws `DataCloneError` on every call, silently swallowed by the surrounding try/catch. `$state.snapshot()` is the documented Svelte 5 escape hatch that returns a plain, structured-clone-safe deep copy. The localStorage snapshot line using `JSON.stringify` was left unchanged.

### Task 2: Fix infinite $effect loop on leg-win watcher (CR-02)
**Commit:** `3652a84`

In `display/+page.svelte`, changed `prevLegsWon` and `prevSetsWon` from `$state([])` to plain `let` declarations (`let prevLegsWon: number[] = []`, `let prevSetsWon: number[] = []`). These variables are only ever used as previous-value trackers inside the leg-win `$effect`. Because they were `$state`, every run of the effect assigned new array references which re-triggered the effect — causing `effect_update_depth_exceeded` whenever a match was active. All other lines of the effect are unchanged; `legWinMessage` and `legWinSubtitle` remain `$state` as they drive the banner render.

### Task 3: Fix popup-blocked false positive in SpectatorChooser (WR-02 / DISP-01)
**Commit:** `67baa65`

**Decision recorded:** WR-02 option (a) — drop `noopener` from the `window.open` features string; null `win.opener` manually after open.

Per the HTML spec, when `noopener` is in the features string, `window.open` returns `null` even when the window opens successfully. The existing `if (!win) popupBlocked = true; else close()` therefore always triggered the "Bitte Popups für diese Seite erlauben" warning and never closed the menu. Dropping `noopener` from the features string makes the return value usable for genuine block detection. Manually setting `win.opener = null` on a successful open preserves the reverse-tabnabbing guard required by T-02-06 (the target is same-origin `/display` content). Updated `SpectatorChooser.test.ts` to cover both the success case (menu closes, no warning, opener nulled) and the blocked case (warning shown, menu stays open).

### Task 4: Add live no-reload BroadcastChannel e2e test (DISP-05)
**Commit:** `04381a9`

Added a third test to `e2e/spectator-sync.spec.ts` that exercises the live BroadcastChannel path: opens `/display` in the same context BEFORE entering a dart (so the listener is registered), asserts `501` is visible, enters a 180 visit on the scoring page, then asserts `321` appears WITHOUT calling `displayPage.reload()`. The two existing snapshot-path tests are unchanged. Updated the file header comment to note that the live path is now covered alongside the snapshot path.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WR-02 popup fix approach | Option (a): drop noopener features string, null win.opener manually | Preserves reliable popup-block detection (usable return value) AND reverse-tabnabbing guard (T-02-06). Target is same-origin /display so no cross-origin opener leak possible. |

## Verification Results

| Check | Result |
|-------|--------|
| `src/stores/match.svelte.ts` contains `$state.snapshot(this.state)` | PASS |
| `src/routes/display/+page.svelte` has plain `prevLegsWon`/`prevSetsWon` | PASS |
| `SpectatorChooser.svelte` has no `noopener`, has `win.opener = null` | PASS |
| `npx vitest run src/ui/display/SpectatorChooser.test.ts` (8 tests) | PASS |
| `npx playwright test e2e/spectator-sync.spec.ts` (3 tests) | PASS |
| `npx svelte-check --threshold error` | Pre-existing error in `src/db/profiles.ts` (unrelated to this plan; confirmed present before any changes) |

Note: `svelte-check` reports one pre-existing `Type 'number | undefined' is not assignable to type 'number'` error in `src/db/profiles.ts` line 24. This error existed before this plan's changes (confirmed via `git stash` comparison) and is out of scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used `{ exact: true }` on the `501` assertion in the live e2e test**
- **Found during:** Task 4
- **Issue:** `displayPage.getByText('501')` matched two elements in strict mode: the remaining-score `<div>` (`501`) and the header bar text `"501 Double Out · First to 3 Legs · Leg 1"`. Playwright strict mode requires a unique match.
- **Fix:** Changed to `displayPage.getByText('501', { exact: true })` which matches only the remaining score element.
- **Files modified:** `e2e/spectator-sync.spec.ts`
- **Commit:** `04381a9`

## Known Stubs

None — all changes wire real behavior; no placeholder data or TODO stubs introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The BroadcastChannel and localStorage paths remain same-origin only. Dropping `noopener` from the features string is offset by the manual `win.opener = null`; target is same-origin content (T-02-06 mitigated as planned).

## Self-Check: PASSED

- SUMMARY.md exists at `.planning/phases/02-spectator-display/02-05-SUMMARY.md` — FOUND
- Commit `eef1047` (Task 1) — FOUND
- Commit `3652a84` (Task 2) — FOUND
- Commit `67baa65` (Task 3) — FOUND
- Commit `04381a9` (Task 4) — FOUND
