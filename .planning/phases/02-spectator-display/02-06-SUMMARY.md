---
phase: 02-spectator-display
plan: 06
subsystem: ui
tags: [gap-closure, fullscreen, svelte-runes, tablet, display, DISP-02]
dependency_graph:
  requires:
    - phase: "02-04"
      provides: "SpectatorChooser goToDisplayFullscreen() + /display fullscreen-prompt render logic"
  provides:
    - "Tablet mid-match 'Vollbild aktivieren' prompt visible when navigated via SpectatorChooser tablet path"
    - "URL query flag (fullscreen=1) encodes tablet-fullscreen intent for disambiguation from PC second-window path"
  affects: ["src/ui/display/SpectatorChooser.svelte", "src/routes/display/+page.svelte"]
tech_stack:
  added: []
  patterns:
    - "URL query flag at mount as a fixed-for-page-lifetime intent signal — plain const from URLSearchParams, not reactive $state"
    - "Disambiguation of tablet vs PC display entry via navigation mechanism (goto vs window.open), not heuristics"
key_files:
  modified:
    - src/ui/display/SpectatorChooser.svelte
    - src/routes/display/+page.svelte
key_decisions:
  - "Carry tablet fullscreen intent as a URL query flag (fullscreen=1) rather than widening the bare !isFullscreen condition, which would render the amber prompt on every PC second window mid-match"
  - "Read the flag once at mount via window.location.search (plain const, not $state/$derived) — the intent is fixed for the page lifetime and the route is ssr:false"
patterns-established:
  - "Intent-carrying URL flags: when two navigation paths share a route but need different behavior, encode the intent at the call site and read it once at mount rather than inferring from runtime state"
requirements-completed: [DISP-02]
duration: "~10 min (Task 1 auto + Task 2 real-browser UAT)"
completed: "2026-06-11"
---

# Phase 02 Plan 06: Tablet Mid-Match Fullscreen Prompt (DISP-02 Gap Closure) Summary

**Widened the /display "Vollbild aktivieren" prompt to appear during an active match on the tablet path by adding a `fullscreen=1` URL flag in SpectatorChooser, closing the last DISP-02 UAT gap without regressing the PC second-window scoreboard.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-11T~20:15Z
- **Completed:** 2026-06-11T~20:25Z
- **Tasks:** 2 (1 auto + 1 human-verify)
- **Files modified:** 2

## Accomplishments

- Closed DISP-02 UAT gap (02-UAT Test 4): the large amber "Vollbild aktivieren" prompt now appears during an active match (`phase === 'playing'`) when the user arrives via SpectatorChooser's tablet path ("Anzeige hier im Vollbild").
- PC second-window path remains unaffected: `openSecondWindow()` still navigates to `/display` with no query flag, so the amber prompt is not shown over the live scoreboard.
- Idle/setup prompt behavior (existing) is fully preserved; the widened condition adds the tablet-intent case without touching the original logic.
- Real-browser UAT verification (Playwright, live 501 match in `phase=playing`) confirmed all three scenarios pass.

## Task Commits

1. **Task 1: Widen fullscreen-prompt condition to honor tablet-fullscreen intent without regressing PC** - `3d5a77b` (feat)
2. **Task 2: Human-verify tablet mid-match fullscreen prompt and PC no-regression** - verification only (no code commit — human-approved checkpoint)

**Plan metadata:** _(see docs commit below)_

## Files Created/Modified

- `src/ui/display/SpectatorChooser.svelte` — `goToDisplayFullscreen()` now navigates to `` `${base}/display?fullscreen=1` ``; `openSecondWindow()` left unchanged (no query flag on PC path)
- `src/routes/display/+page.svelte` — Reads `fullscreen=1` flag once at mount from `window.location.search` as a plain `const`; `.fullscreen-prompt` render condition widened to `!isFullscreen && (matchState === null || matchState.phase === 'setup' || tabletFullscreenIntent)` with an inline comment explaining that the PC second window never carries the flag

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| How to distinguish tablet vs PC path | URL query flag (`fullscreen=1`) carried by the tablet navigation, absent from PC `window.open` | Deterministic (encodes the user's explicit choice), zero new dependencies, self-contained — PC window physically cannot carry the flag so the regression cannot occur |
| How to read the flag | Plain `const` at mount from `window.location.search`; no `$state`, no `$derived` | The intent is fixed for the page lifetime; the route is `ssr:false` so `window` is safe; using `$state` would add unnecessary reactivity |
| Bare `!isFullscreen` widening | Rejected | Would render the large amber prompt on EVERY non-fullscreen `/display`, including a PC second window mid-match, obstructing the live scoreboard |

## Deviations from Plan

None — plan executed exactly as written. Both surgical edits matched the design decision and action specification precisely; `svelte-check` passed clean.

## Human Verification Results (Task 2)

Verification was performed by the orchestrator via a real Playwright browser session against `npm run dev`. A live single-player 501 match (`phase=playing`) was running for all three scenarios:

| Scenario | Expected | Result |
|----------|----------|--------|
| Tablet path: navigated to `/display?fullscreen=1` via "Anzeige hier im Vollbild" | `.fullscreen-prompt` ("Vollbild aktivieren") visible at bottom-center over live scoreboard | **PASS** — amber prompt visible (rect ~200×48 px), scoreboard rendering correctly (Gast 1, 501, Leg 1) |
| PC path: navigated to `/display` (no flag) with same playing match | `.fullscreen-prompt` ABSENT; only `.fullscreen-toggle` present | **PASS** — amber prompt not rendered; small toggle icon present |
| Idle: `/display` with no flag, no match state | `.fullscreen-prompt` present on idle "Warte auf Match…" screen | **PASS** — existing behavior unchanged |

**Caveat:** Actual fullscreen entry (tapping the prompt to call `document.documentElement.requestFullscreen()`) was not exercised under Playwright automation — the Fullscreen API requires a real user gesture and cannot be triggered programmatically in headless mode. However, this plan only widened the prompt's *render condition*; the `onclick={activateFullscreen}` wiring is pre-existing, untouched behavior from Plan 02-04. Only console error observed was an unrelated favicon.ico 404.

## Known Stubs

None — the prompt appears with real match state from IndexedDB/BroadcastChannel; no placeholder data introduced.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The URL flag is a client-side read of the current window's own query string; no cross-origin exposure.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 02 is fully complete: all 6 plans executed, all DISP-0x requirements satisfied, UAT passed.
- Phase 03 (Persistence & Data) can begin. Recommended: a focused Dexie event-sourced schema research pass before planning (noted in STATE.md blockers).

---
*Phase: 02-spectator-display*
*Completed: 2026-06-11*

## Self-Check: PASSED

- `02-06-SUMMARY.md` written at `.planning/phases/02-spectator-display/02-06-SUMMARY.md` — FOUND (this file)
- Commit `3d5a77b` (Task 1 feat) — FOUND (confirmed via `git log --oneline --grep="02-06"`)
- Source files modified per completed_state: `src/ui/display/SpectatorChooser.svelte` and `src/routes/display/+page.svelte` — matches plan artifacts
- Task 2 human-verify: APPROVED with real-browser evidence — documented above
