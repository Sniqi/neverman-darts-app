---
phase: 03-persistence-data
plan: "01"
subsystem: persistence
tags: [crash-resume, start-screen, dialogs, e2e, FLOW-03]
dependency_graph:
  requires: []
  provides: [loadUnfinishedMatch, clearUnfinishedMatch, requestPersistentStorage, getStorageWarning, MatchStore.restore, start-screen, ResumePrompt, ConfirmDialog, history-shell, data-shell]
  affects: [src/routes/+page.svelte, src/ui/setup/MatchSetup.svelte]
tech_stack:
  added: []
  patterns: [localStorage-parse-try-catch, vi.stubGlobal-localStorage, Svelte5-$state-$derived, fixed-backdrop-dialog, base-path-navigation]
key_files:
  created:
    - src/lib/storage.ts
    - src/lib/storage.test.ts
    - src/ui/dialogs/ConfirmDialog.svelte
    - src/ui/start/ResumePrompt.svelte
    - src/routes/history/+page.svelte
    - src/routes/data/+page.svelte
    - e2e/resume.spec.ts
  modified:
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/routes/+page.svelte
    - src/ui/setup/MatchSetup.svelte
decisions:
  - "D-02 guard placed in MatchSetup.svelte (not setup/+page.svelte) — setup route delegates entirely to MatchSetup; surgical change to the component that owns handleStart()"
  - "localStorage mocked via vi.stubGlobal in storage.test.ts — mirrors display.svelte.test.ts pattern; node unit env has no localStorage"
  - "ConfirmDialog uses tabindex=-1 on backdrop div to satisfy a11y_interactive_supports_focus svelte-check rule"
metrics:
  duration: "7 min"
  completed_date: "2026-06-12"
  tasks: 3
  files: 11
---

# Phase 03 Plan 01: Start Screen + Crash-Resume Slice Summary

JWT-style crash-resume with localStorage snapshot detection, matchStore.restore(), start-screen hub, ResumePrompt, ConfirmDialog, and FLOW-03 E2E green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Resume detection utility + MatchStore.restore() | a752719 | storage.ts, storage.test.ts, match.svelte.ts, match.svelte.test.ts |
| 2 | ConfirmDialog + start screen + route shells | 9e92723 | +page.svelte, ConfirmDialog.svelte, ResumePrompt.svelte, history/+page.svelte, data/+page.svelte |
| 3 | New-match warning on setup + resume E2E | f344170 | MatchSetup.svelte, e2e/resume.spec.ts |

## What Was Built

- `src/lib/storage.ts`: `loadUnfinishedMatch()` (phase-guards: only 'playing'/'leg-complete' return non-null), `clearUnfinishedMatch()`, `requestPersistentStorage()`, `getStorageWarning()` — all wrapped in try/catch, never throw (T-03-01, T-03-02)
- `MatchStore.restore(state)`: direct `$state` field assignment — same mechanism as `dispatch()`
- `src/routes/+page.svelte`: real start screen — app title, conditional ResumePrompt, 3 nav buttons; `$effect` loads snapshot on mount, fires `requestPersistentStorage()` fire-and-forget
- `src/ui/start/ResumePrompt.svelte`: heading + info line + Fortsetzen/Verwerfen; player names via `{interpolation}` (T-03-03)
- `src/ui/dialogs/ConfirmDialog.svelte`: reusable modal with Escape key handler, optional backdrop-dismiss, destructive/accent CTA variants; `role="dialog" aria-modal tabindex=-1` (T-03-03)
- `/history` and `/data` route shells with back-chevron navigation
- D-02 guard in `MatchSetup.svelte`: `handleStart()` checks `loadUnfinishedMatch()` before proceeding; shows ConfirmDialog on conflict
- `e2e/resume.spec.ts`: FLOW-03 end-to-end — 2 tests green (Fortsetzen restores exact score, Verwerfen clears permanently)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Accessibility] tabindex on dialog backdrop**
- **Found during:** Task 2 svelte-check
- **Issue:** `role="dialog"` element requires `tabindex` per a11y_interactive_supports_focus rule
- **Fix:** Added `tabindex="-1"` to `.backdrop` div in ConfirmDialog.svelte
- **Files modified:** src/ui/dialogs/ConfirmDialog.svelte

**2. [Rule 3 - Blocking] Empty CSS ruleset**
- **Found during:** Task 2 svelte-check warning
- **Issue:** `.resume-area` CSS block was empty (comment-only), causing svelte-check warning
- **Fix:** Removed the empty ruleset and the wrapping div (the flex gap handles spacing)
- **Files modified:** src/routes/+page.svelte

**3. [Rule 3 - Deviation] D-02 guard in MatchSetup.svelte, not setup/+page.svelte**
- **Found during:** Task 3 implementation
- **Issue:** Plan listed `src/routes/setup/+page.svelte` as the file to modify, but that file is `<MatchSetup />` only — the actual start logic and "Spiel starten" button live in `MatchSetup.svelte`
- **Fix:** Applied the D-02 guard to `MatchSetup.svelte` (surgical change to the correct location); `setup/+page.svelte` unchanged
- **Files modified:** src/ui/setup/MatchSetup.svelte

## Known Stubs

- `src/routes/history/+page.svelte`: placeholder empty state only — no MatchRecord list, no liveQuery. Filled in by Plan 03-02.
- `src/routes/data/+page.svelte`: "Wird in Plan 03-03 implementiert." placeholder. Filled in by Plan 03-03.

These stubs are intentional: the plan explicitly states "keep them minimal but valid so the menu links resolve without 404."

## Threat Flags

None. All threat mitigations from the plan's threat register (T-03-01, T-03-02, T-03-03) are implemented:
- T-03-01: `loadUnfinishedMatch()` uses JSON.parse inside try/catch + phase guard
- T-03-02: `requestPersistentStorage()` called on mount; all storage access in try/catch
- T-03-03: No `{@html}` in ResumePrompt or ConfirmDialog; player names via `{interpolation}`

## Verification Results

- `npm run test:unit -- src/lib/storage.test.ts src/stores/match.svelte.test.ts`: 25/25 passed
- `npm run check`: 0 errors, 0 warnings (1 pre-existing profiles.ts error out of scope)
- `npx playwright test e2e/resume.spec.ts`: 2/2 passed
- `npx playwright test e2e/full-match-flow.spec.ts`: 1/1 passed (no regression)

## Self-Check: PASSED
