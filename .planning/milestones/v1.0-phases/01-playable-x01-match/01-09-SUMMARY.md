---
phase: "01"
plan: "09"
subsystem: ui/setup
tags: [profile-management, setup-flow, gap-closure]
dependency_graph:
  requires: []
  provides: [PROF-01, FLOW-01]
  affects: [src/ui/setup/MatchSetup.svelte]
tech_stack:
  added: []
  patterns: [collapsible-section, svelte5-runes-state]
key_files:
  created: []
  modified:
    - src/ui/setup/MatchSetup.svelte
decisions:
  - "Collapsible 'Profile verwalten' toggle chosen over always-visible section to keep the setup screen uncluttered; profile management is an infrequent action"
  - "ProfileManager placed between PlayerPicker and game mode chips — proximity to the picker makes the create-then-pick workflow discoverable"
metrics:
  duration: "3min"
  completed: "2026-06-10"
---

# Phase 01 Plan 09: Mount ProfileManager in Setup Flow Summary

**One-liner:** Collapsible "Profile verwalten" section added to MatchSetup, making ProfileManager reachable from the setup screen for the first time.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Mount ProfileManager in the setup flow (CR-08) | 1d43a6f | src/ui/setup/MatchSetup.svelte |

## What Was Built

`MatchSetup.svelte` now imports and renders `ProfileManager` inside a collapsible `<section>` placed between the PlayerPicker section and the game mode chips. A "Profile verwalten" toggle button (with a rotating arrow indicator) shows/hides the ProfileManager component. The collapsed state is managed by a local `profilesOpen = $state(false)` boolean.

`ProfileManager` and `PlayerPicker` both read `profilesLive()` from `db.profiles` — a profile created in ProfileManager appears live in PlayerPicker's dropdown with no additional wiring.

All existing setup sections (mode chips, out-rule, format, start button) and the `canStart`/`handleStart` logic are unchanged.

## Verification Results

- `npx svelte-check --threshold error`: 1 pre-existing error in `src/db/profiles.ts` (line 24, `number | undefined` return from Dexie `add()`). Confirmed pre-existing by stash/verify. MatchSetup.svelte itself introduces no new errors.
- `npx vitest run src/ui/setup/ProfileManager.test.ts`: 4/4 tests pass (ProfileManager unchanged).

## Deviations from Plan

None — plan executed exactly as written. The collapsible toggle pattern was explicitly offered as an option in the task action and was used as-specified with German copy "Profile verwalten".

## Known Stubs

None. ProfileManager is fully implemented (create/edit/delete with Dexie persistence) and PlayerPicker reads the same live table — no placeholder data.

## Threat Flags

No new trust boundaries introduced. Profile names are rendered only via Svelte `{interpolation}` in ProfileManager (T-01-09-01 disposition: mitigate — enforced by existing component code, unchanged by this plan).

## Self-Check: PASSED

- [x] `src/ui/setup/MatchSetup.svelte` exists and contains `ProfileManager` import and render
- [x] Commit `1d43a6f` exists in git log
- [x] ProfileManager.svelte unmodified
- [x] PlayerPicker.svelte unmodified
- [x] All 4 ProfileManager tests pass
