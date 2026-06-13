---
phase: 05-audio-auto-pause
plan: "03"
subsystem: match-flow
tags: [auto-pause, BroadcastChannel, countdown, setInterval, FLOW-02, svelte5-runes]
dependency_graph:
  requires:
    - phase: 05-01
      provides: audio-prefs (loadAudioPrefs — pause threshold config)
    - phase: 05-02
      provides: audio-sfx, audio-settings-ui (MatchSetup pause toggles/steppers)
  provides:
    - pause-state (pauseActive, pauseRemainingSeconds, pauseLegCount on MatchStore)
    - pause-tick-channel (MSG_PAUSE_TICK on BC_CHANNEL, type-discriminated)
    - PauseOverlay (prop-driven full-screen countdown, both routes)
    - DisplayStore pause state (pauseActive/pauseRemainingSeconds from pause-tick)
    - countdown-effect (/match setInterval $effect with clearInterval cleanup)
  affects:
    - phase-06 (PWA precache — no new assets added in this plan)
    - 05-VALIDATION (manual UAT: pause on both views, countdown sync, Weiter)
tech_stack:
  added: []
  patterns:
    - pause-state-on-store (session UI state on MatchStore class, not in reducer/MatchState)
    - type-discriminated-BC-message (MSG_PAUSE_TICK alongside match-state on BC_CHANNEL)
    - setInterval-in-effect ($effect with clearInterval cleanup return, Pitfall 7)
    - prop-driven-overlay (PauseOverlay imports no store — testable in isolation)
key-files:
  created:
    - src/ui/overlays/PauseOverlay.svelte
    - src/ui/overlays/PauseOverlay.test.ts
  modified:
    - src/lib/sync-constants.ts
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/stores/display.svelte.ts
    - src/routes/match/+page.svelte
    - src/routes/display/+page.svelte
key-decisions:
  - "Pause state lives on MatchStore class ($state fields), NOT in MatchState/reducer — pause is session/UI state that doesn't need to survive reload as part of the game log (RESEARCH Pattern 3)"
  - "pause-tick rides BC_CHANNEL as a type-discriminated message — separate from match-state snapshots; isValidMatchState never sees pause-tick payloads (RESEARCH Pitfall 3)"
  - "legCompleted.length (monotonic) used for leg counting, NOT legsWon (resets on set win) — critical for correct pause interval counting across sets"
  - "PauseOverlay is prop-driven with no store import — enables isolated browser testing and reuse on both routes with different showResume behavior"
  - "Countdown $effect on /match uses setInterval + clearInterval cleanup return — clears on unmount AND when pauseActive flips false, preventing the Pitfall 7 timer leak"
patterns-established:
  - "Type-discriminated BC message: add `type` discriminant when a new message type shares an existing channel; handle BEFORE isValidMatchState guard in DisplayStore"
  - "Session state on store class: pause-like transient UI state belongs on the Svelte class as $state, not in the serialized reducer"
  - "$effect with setInterval + cleanup return: the canonical Svelte 5 pattern for recurring side effects that must stop when a reactive condition changes"
requirements-completed: [FLOW-02]
duration: ~6min
completed: 2026-06-12
---

# Phase 5 Plan 03: Auto-Pause Slice Summary

**FLOW-02 auto-pause end-to-end: configurable-leg countdown overlay synced to both /match and /display via type-discriminated pause-tick on BC_CHANNEL, with manual Weiter resume and auto-resume at 0:00**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-12T20:31:00Z
- **Completed:** 2026-06-12T20:37:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- MatchStore gains pauseActive/pauseRemainingSeconds/pauseLegCount $state with #checkAutoPause (legCompleted-based, set-safe), decrementPause(), resumePause(), and #broadcastPause() (MSG_PAUSE_TICK on BC_CHANNEL)
- PauseOverlay.svelte created as a prop-driven full-screen countdown (z-60, MM:SS, German copy, role=dialog, aria-live) with 11 green browser tests
- DisplayStore updated with pause $state and a type-discriminated pause-tick branch that routes before isValidMatchState, keeping the match-state path unchanged
- /match mounts the countdown $effect (setInterval + clearInterval cleanup) and PauseOverlay with showResume=true; /display mounts PauseOverlay with showResume=false, no local timer, no new channel

## Task Commits

Each task was committed atomically:

1. **Task 1: MatchStore pause state + auto-pause detection + pause-tick channel** - `54967d0` (feat)
2. **Task 2: PauseOverlay component + DisplayStore pause handling** - `71b1e28` (feat)
3. **Task 3: Mount PauseOverlay on both routes + countdown $effect** - `ad45675` (feat)

## Files Created/Modified

- `src/lib/sync-constants.ts` — Added MSG_PAUSE_TICK constant with JSDoc (rides BC_CHANNEL, D-09)
- `src/stores/match.svelte.ts` — Added pause $state fields, constructor reading loadAudioPrefs(), #checkAutoPause, decrementPause, resumePause, #broadcastPause
- `src/stores/match.svelte.test.ts` — Extended with matchStore.pause describe block (9 unit tests)
- `src/stores/display.svelte.ts` — Added pauseActive/pauseRemainingSeconds $state; pause-tick branch in connect() before isValidMatchState
- `src/ui/overlays/PauseOverlay.svelte` — New: prop-driven overlay (pauseActive, remainingSeconds, showResume, onresume); z-index 60; rgba(17,19,24,0.96); fadeIn 300ms; clamp(4rem,10vw,12rem) countdown in --accent; German copy
- `src/ui/overlays/PauseOverlay.test.ts` — New: 11 browser tests (render gating, MM:SS formatting, Weiter visibility, onresume callback, position:fixed, German copy)
- `src/routes/match/+page.svelte` — Added countdown $effect (setInterval→decrementPause, clearInterval cleanup); PauseOverlay mount with showResume=true
- `src/routes/display/+page.svelte` — PauseOverlay mount with showResume=false; no local timer; sources state from displayStore

## Decisions Made

- legCompleted.length used instead of legsWon for leg counting: legCompleted is monotonic and survives set wins; legsWon resets to 0 on a set win and would miscalculate the pause interval in sets-enabled matches
- Pause config read once in MatchStore constructor: pauseEnabled/pauseLegs/pauseMinutes are match-lifetime settings, not reactive; reading once via loadAudioPrefs() at construction matches the audio-prefs pattern from Plan 01
- PauseOverlay is prop-driven with no store import: this enables isolated vitest-browser-svelte testing without mocking the store, and allows the same component to be driven from either matchStore (on /match) or displayStore (on /display)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- `--grep` flag not supported by this vitest version; used `--testNamePattern` instead for targeted unit test runs. Did not affect correctness.

## Known Stubs

None — all exported state and methods are fully wired to real behavior.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. T-05-07 (pause-tick payload discriminated by type, reads only boolean + number primitives) and T-05-08 (countdown setInterval cleaned up via $effect return) are fully mitigated as specified. T-05-09 (same-origin spoofing) accepted per plan.

## Self-Check: PASSED
