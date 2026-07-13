---
phase: 07-chromecast-integration
plan: 05
subsystem: cast-sender-wiring
tags: [cast, sender, dispatch, ui, toast, spectator-chooser]
depends_on:
  requires: [07-02, 07-03]
  provides: [cast-publish-in-dispatch, resume-toast, cast-row-in-chooser]
  affects: [match-store, match-route, spectator-chooser]
tech_stack:
  added: []
  patterns:
    - additive third publish block after BC/LS in dispatch()
    - setCastManager() injection pattern (singleton received from route onMount)
    - one-shot $state signal consumed via $effect in ResumeToast
key_files:
  created:
    - src/ui/cast/ResumeToast.svelte
  modified:
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/routes/match/+page.svelte
    - src/ui/display/SpectatorChooser.svelte
decisions:
  - "setCastManager() injection: route calls store method rather than store importing sender directly — avoids circular import, keeps store unit-testable with a fake manager"
  - "requestSession() called programmatically on row click; <google-cast-launcher> is display:none — avoids web component visual chrome conflicting with app design (UI-SPEC §1)"
  - "Svelte suppress comment for <google-cast-launcher>: used <!-- svelte-ignore unknown_element --> (Svelte 5 code)"
metrics:
  duration: "~15 min"
  completed: "2026-06-18"
  tasks_completed: 3
  files_changed: 5
status: complete
---

# Phase 07 Plan 05: Sender Wiring — Dispatch, ResumeToast, SpectatorChooser Cast Row Summary

End-to-end Cast sender wiring: additive `#publishToCast` block in `MatchStore.dispatch()`, `ResumeToast` component for SESSION_RESUMED, and Cast row in `SpectatorChooser` — making casting user-visible and live.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | #publishToCast + setCastManager in MatchStore (TDD) | b3b12f3 | match.svelte.ts, match.svelte.test.ts |
| 2 | ResumeToast component + /match Cast init | 9a5e277 | ResumeToast.svelte, +page.svelte |
| 3 | Cast row in SpectatorChooser | 6741207 | SpectatorChooser.svelte |

## What Was Built

### Task 1 — Additive `#publishToCast` in `MatchStore.dispatch()` (SYNC-02/SYNC-04)

- `#castManager: CastSenderManager | null` private field added to `MatchStore`
- `setCastManager(mgr)` public setter — called from `/match` onMount after Cast SDK init
- `#publishToCast()` private method: guards on `#castManager?.activeSession`, projects `toDisplayState(state, pauseActive, pauseRemainingSeconds)`, optionally logs DEV-only size warning, calls `sendSnapshot()` in try/catch (non-fatal)
- Wired as the THIRD call in `dispatch()` immediately after the localStorage block, before `#detectRecords`
- 6 new unit tests added: sendSnapshot called once with active session, no-op with null session, no-op with no manager, throw swallowed, BC+LS blocks unchanged, ordering assertion (BC before Cast, LS before Cast)
- All 45 tests pass (40 pre-existing + 5 new Cast tests)

### Task 2 — `ResumeToast.svelte` + `/match` Cast init (CAST-06/SETUP-02)

- `src/ui/cast/ResumeToast.svelte` created: fixed `bottom:80px; right:16px; z-index:45`, `--surface` background, 4px `--accent` left stripe, `role="status"` / `aria-live="polite"`, enter `opacity+translateY` 200ms ease-out, auto-dismiss after 3500ms, `onDestroy` clears timer
- Binds to `castSenderManager.resumeDeviceName` one-shot signal via `$effect`; consumes signal (resets to null) immediately after capture
- `/match/+page.svelte` onMount: reads `import.meta.env.VITE_CAST_APP_ID`; if present calls `castSenderManager.init(appId)` + `matchStore.setCastManager(castSenderManager)` (SETUP-02/D-13)
- `<ResumeToast />` rendered near other overlays in template
- Existing wake-lock / records / audio onMount logic untouched

### Task 3 — Cast row in `SpectatorChooser.svelte` (CAST-01/CAST-02/CAST-03/CAST-04)

- Imports `castSenderManager` from `cast-sender.svelte.js`
- `requestCastSession()` helper calls `CastContext.getInstance().requestSession()` in try/catch
- `{#if castSenderManager.castAvailable}` block wraps the entire Cast row — fully absent on non-Chrome (D-13), no disabled state
- Hidden `<google-cast-launcher>` web component (display:none); row button triggers `requestCastSession()` directly (simpler than sizing the web component's chrome)
- Cast row uses existing `.chooser-action-btn` styling, inline SVG cast icon (screen-with-waves), German label "Auf Chromecast übertragen"
- `{#if castSenderManager.activeSession !== null}` connected status line: accent `●` dot + muted "Überträgt auf:" + accent device name via `getCastDevice().friendlyName`
- All 8 existing `SpectatorChooser.test.ts` tests still pass

## Verification

- `npx vitest run --project unit src/stores/match.svelte.test.ts`: 45/45 passed
- `npx vitest run --project browser src/ui/display/SpectatorChooser.test.ts`: 8/8 passed
- `BASE_PATH=/neverman-darts-app npm run build`: clean build
- `VITE_CAST_APP_ID` flows only through `import.meta.env` → `init(appId)` → `setOptions({receiverApplicationId: appId})` — never hardcoded literal (SETUP-02)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced beyond those already in the plan's threat model (T-07-06, T-07-03).

## Self-Check: PASSED

- src/stores/match.svelte.ts: FOUND
- src/stores/match.svelte.test.ts: FOUND
- src/ui/cast/ResumeToast.svelte: FOUND
- src/routes/match/+page.svelte: FOUND
- src/ui/display/SpectatorChooser.svelte: FOUND
- Commits b3b12f3, 9a5e277, 6741207: verified in git log
