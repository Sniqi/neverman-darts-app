---
phase: 05-audio-auto-pause
plan: "01"
subsystem: audio
tags: [audio, speech, prefs, localStorage, AUD-01, AUD-03]
dependency_graph:
  requires: []
  provides: [audio-prefs, audio-caller, visit-announcement]
  affects: [src/routes/match/+page.svelte]
tech_stack:
  added: []
  patterns: [Web Speech API, localStorage prefs, try/catch no-throw, fire-and-forget]
key_files:
  created:
    - src/lib/audio-prefs.ts
    - src/lib/audio-prefs.test.ts
    - src/lib/audio-caller.ts
    - src/lib/audio-caller.test.ts
  modified:
    - src/routes/match/+page.svelte
decisions:
  - "Checkout hint uses getSuggestion(player.remaining + total, outRule) — pre-visit remaining recovered by adding the visit total back to post-visit remaining (Assumption A3 resolved)"
  - "localStorage mock (inline vi.stubGlobal) added to audio-prefs.test.ts — Node env lacks localStorage; keeps no-throw contract testable without happy-dom"
  - "audioPrefs read once at component init (module-scope const) — prefs are read once for the match lifetime, not reactively; loadAudioPrefs is synchronous localStorage"
metrics:
  duration: "~7 min"
  completed_date: "2026-06-12"
  tasks_completed: 2
  files_changed: 5
---

# Phase 5 Plan 01: Caller Voice Slice Summary

Web Speech API caller with localStorage prefs — announces visit scores (with German checkout hints) after each confirmed non-bust visit; silent fallback when no voice or synthesis available.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | audio-prefs helper + RED caller tests (Wave 0) | 0f88d38 | audio-prefs.ts, audio-prefs.test.ts, audio-caller.test.ts |
| 2 | audio-caller (Web Speech) — GREEN + wire into /match | 6b3225c | audio-caller.ts, match/+page.svelte |

## What Was Built

**`src/lib/audio-prefs.ts`** — `AudioPrefs` interface + `loadAudioPrefs()` / `saveAudioPref<K>()`. Reads/writes 6 `nvm_*` localStorage keys with full type coercion (boolean via `=== 'true'`, number via `Number() || fallback`, `pauseEnabled` defaulting true via `!== 'false'`). Wraps reads in `try/catch` returning DEFAULTS on failure (T-05-02).

**`src/lib/audio-caller.ts`** — `initVoices()` (synchronous `getVoices()` + `onvoiceschanged` re-cache, Pitfall 1), `findVoice()` (normalizes Android underscore langs via `.replace(/_/g, '-')`, prefers `localService` voices, Pitfall 2), `announceVisit()` (disabled guard D-06, `speechSynthesis` undefined guard D-02, null-voice silent return D-02, German/English text with checkout hint D-03, `cancel()` before `speak()` T-05-03, full `try/catch` T-05-01).

**`src/routes/match/+page.svelte`** — `loadAudioPrefs()` read at component init (sync, no `onMount` needed), `initVoices()` called inside existing `onMount`, `announceVisit()` wired inside the EXISTING visit-detection `$effect` after `total` is computed — non-bust visits only, with pre-visit remaining computed as `player.remaining + total` for the checkout hint (A3).

## Verification

- `npm run test:unit`: 318 tests across 16 files — all green
- `npm run check`: 1 error in `src/db/profiles.ts` (pre-existing, confirmed present before any changes; unrelated to this plan)
- `announceVisit` import confirmed absent from `src/routes/display/+page.svelte` (Pitfall 5 — no double speech)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] localStorage not available in Node unit test environment**
- **Found during:** Task 1 verification (`npx vitest run --project=unit src/lib/audio-prefs.test.ts`)
- **Issue:** `ReferenceError: localStorage is not defined` — Node's `unit` project has no browser globals; `audio-prefs.ts` calls `localStorage.getItem()` directly
- **Fix:** Added an inline `vi.stubGlobal('localStorage', localStorageMock)` at the top of `audio-prefs.test.ts` with a minimal in-memory store implementation, matching the pattern used in `display.svelte.test.ts` for BroadcastChannel. No changes to `audio-prefs.ts` itself (the production code is correct; only the test environment needed the stub)
- **Files modified:** `src/lib/audio-prefs.test.ts`
- **Commit:** 0f88d38

## Known Stubs

None — all exported functions are fully implemented and wired to real behavior.

## Threat Flags

No new threat surface beyond the plan's `<threat_model>`. T-05-01 (utterance text from computed values only), T-05-02 (localStorage coercion), and T-05-03 (cancel before speak) are all mitigated as specified.

## Self-Check: PASSED
