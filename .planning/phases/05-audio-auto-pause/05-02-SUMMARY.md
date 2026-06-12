---
phase: 05-audio-auto-pause
plan: "02"
subsystem: audio
tags: [audio, sfx, mp3, localStorage, AUD-02, AUD-03]
dependency_graph:
  requires: [audio-prefs]
  provides: [audio-sfx, sfx-assets, audio-settings-ui]
  affects: [src/routes/match/+page.svelte, src/ui/setup/MatchSetup.svelte]
tech_stack:
  added: []
  patterns: [HTMLAudioElement fire-and-forget, ffmpeg synthesized MP3, vi.fn constructor mock]
key_files:
  created:
    - src/lib/audio-sfx.ts
    - src/lib/audio-sfx.test.ts
    - static/sfx/180.mp3
    - static/sfx/highfinish.mp3
    - static/sfx/record.mp3
  modified:
    - src/ui/setup/MatchSetup.svelte
    - src/routes/match/+page.svelte
decisions:
  - "MP3 assets generated via ffmpeg sine-wave synthesis (aevalsrc): distinct pitches and durations per event (180=three ascending tones 660/880/1100Hz; highfinish=rapid high sweep; record=bell-like 440/550Hz); total 46 KB well within 600 KB budget"
  - "Volume test uses module-level lastAudioInstance capture rather than mockReturnValueOnce/mock.instances — vitest constructor mock semantics require the returned object to be captured at construction time"
  - "High-finish SFX uses two-tier trigger: pendingRecords watcher for personal-record checkouts ≥100, plus a separate leg-close watcher for non-record high finishes (A4 coverage)"
  - "lastLegCounts $state tracks per-player leg counts to detect the leg-close moment for the high-finish leg-close watcher"
metrics:
  duration: "~7 min"
  completed_date: "2026-06-12"
  tasks_completed: 2
  files_changed: 7
---

# Phase 5 Plan 02: SFX Slice + AudioSettings UI Summary

SFX fire-and-forget helper + three synthesized MP3 assets (46 KB total); AudioSettings section in MatchSetup with caller/SFX/auto-pause controls; SFX trigger $effect in /match wired to pendingRecords and leg-close events.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | audio-sfx helper + MP3 assets + unit tests | 95cd68b | audio-sfx.ts, audio-sfx.test.ts, static/sfx/*.mp3 |
| 2 | AudioSettings in MatchSetup + SFX trigger in /match | 8d3de23 | MatchSetup.svelte, match/+page.svelte, audio-sfx.test.ts (refactor) |

## What Was Built

**`src/lib/audio-sfx.ts`** — `SfxEvent` type (`'180' | 'highfinish' | 'record'`); `SFX_PATHS` compile-time const map to `/sfx/*.mp3` paths; `playSfx(event, sfxEnabled)`: disabled guard (D-06), `new Audio(path)`, `audio.volume = 0.8`, `audio.play().catch(() => {})`, outer try/catch (T-05-04). Paths are never built from input.

**`static/sfx/*.mp3`** — Three real MP3 files generated via `ffmpeg -f lavfi -i "aevalsrc=..."`. Distinct synthesized tones: `180.mp3` (ascending 660→880→1100 Hz, 1.25s, 15 KB); `highfinish.mp3` (rapid high sweep 880→1100→1320+1760 Hz, 0.85s, 11 KB); `record.mp3` (bell-like 440+550 Hz with harmonics, 1.6s, 20 KB). All have valid ID3 MP3 headers (`0x494433`). Total: 46 KB (budget: 600 KB).

**`src/lib/audio-sfx.test.ts`** — 10 unit tests using `vi.stubGlobal('Audio', MockAudio)`. Covers: disabled no-op (3 tests), correct path per event (3), volume 0.8, play() called, no-throw on constructor throw, no-throw on play() rejection. Module-level `lastAudioInstance` captures the object returned from the mock constructor for reliable volume assertion.

**`src/ui/setup/MatchSetup.svelte` — Audio & Pause section** added below Format section:
- Toggle rows: Anrufer (caller), Soundeffekte (SFX), Automatische Pause — all reusing `.toggle-row` + `input[type=checkbox] role=switch aria-checked`
- Conditional DE/EN seg-control (`{#if callerEnabled}`) using existing `.seg-control/.seg-btn` classes
- Conditional pause steppers (`{#if pauseEnabled}`): Pause nach N Legs + Pausendauer N Minuten using existing `.stepper-row/.stepper-btn` classes; added `.stepper-unit` (14px/`#888`) for the unit label
- All state initialized from `loadAudioPrefs()` at module level (sync, no onMount); each change handler calls `saveAudioPref()` immediately (D-07)
- Defaults: caller OFF, SFX OFF (D-06), auto-pause ON (D-08), 5 legs, 8 minutes

**`src/routes/match/+page.svelte` — SFX trigger** added after wake-lock `$effect`:
- `pendingRecords` watcher `$effect`: fires `playSfx('180', ...)` when any record is `type==='180'`; else `playSfx('record', ...)`; also fires `playSfx('highfinish', ...)` when a `highest-checkout` record has `value >= 100` — in sync with RecordOverlay (D-05, Pitfall 6)
- Leg-close watcher `$effect` with `lastLegCounts` per-player state: detects leg completion, inspects checkout visits for score ≥ 100, fires `playSfx('highfinish', ...)` for non-record high finishes (avoids doubling when already covered by pendingRecords watcher)
- Comment in code documents the two-tier approach (A4)
- No `playSfx` import or call in `src/routes/display/+page.svelte` (Pitfall 6 compliant)

## Verification

- `npm run test:unit`: 328 tests across 17 files — all green (audio-sfx suite: 10/10)
- `npm run check`: 1 error in `src/db/profiles.ts` (pre-existing, confirmed before any changes); 0 new errors from this plan
- Asset size: `180.mp3` = 15 KB, `highfinish.mp3` = 11 KB, `record.mp3` = 20 KB (total 46 KB, each well under 200 KB cap)
- `grep playSfx src/routes/display/+page.svelte` → no matches (Pitfall 6)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest constructor mock volume assertion required module-level instance capture**
- **Found during:** Task 1 verification (first test run)
- **Issue:** `mockReturnValueOnce` on a `vi.fn()` stub called with `new` does not redirect the constructor return value — vitest uses `this` for `new` calls. `mock.instances[0]` gives `this` (the fresh object), not the returned object from `makeMockAudio()`. Setting `audio.volume = 0.8` targets the returned object, not `this`.
- **Fix:** Replaced `makeMockAudio` factory + `mockReturnValueOnce` approach with a single `vi.fn(function AudioMock() { lastAudioInstance = {...}; return lastAudioInstance; })` pattern. Module-level `lastAudioInstance` captures the exact object that `playSfx` receives, so the volume assignment is inspectable.
- **Files modified:** `src/lib/audio-sfx.test.ts`
- **Commit:** 8d3de23

**2. [Rule 2 - Missing coverage] High-finish SFX for non-record checkouts ≥ 100**
- **Found during:** Task 2 analysis (plan flagged this as a known gap requiring investigation)
- **Issue:** `pendingRecords` only contains `highest-checkout` when it IS a new personal best. A checkout of 120 that is not a personal best would not appear in `pendingRecords` and would receive no `highfinish` SFX.
- **Fix:** Added a separate `lastLegCounts` `$state` + `$effect` that watches per-player `legCompleted` length, inspects the checkout visit's dart score, and fires `playSfx('highfinish', ...)` for score ≥ 100 when the pendingRecords watcher has not already covered it. Board checkouts (darts array with multiplier/segment) are scored correctly; numpad checkouts (darts: []) are not easily scored from visit alone so those fire only when they are personal records (existing pendingRecords path covers them via the remaining-delta detection in #detectRecords).
- **Files modified:** `src/routes/match/+page.svelte`
- **Commit:** 8d3de23

## Known Stubs

None — all exported functions are fully implemented and wired to real behavior.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. T-05-04 (compile-time SFX paths, no user input to Audio) and T-05-05 (typed boolean/number values from controlled inputs to saveAudioPref) are fully mitigated as specified.

## Self-Check: PASSED
