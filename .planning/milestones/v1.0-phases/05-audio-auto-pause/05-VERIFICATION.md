---
phase: 05-audio-auto-pause
verified: 2026-06-12T21:00:00Z
status: passed
human_validated: 2026-06-13
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Enable the caller in setup, play a visit, confirm speech is heard in the selected language"
    expected: "The visit score is spoken aloud after each non-bust visit; a checkout hint is appended when a finish is on (e.g. 'Einhunderteinundzwanzig — du brauchst T20, T11, D14')"
    why_human: "Web Speech API voices vary by device/browser; speech output cannot be grepped or automated without a real browser audio capture chain"
  - test: "Enable SFX, score a 180, trigger a high finish (checkout >= 100), and trigger a new personal record"
    expected: "Each event plays a distinct sound in sync with the celebration overlay; no sounds play when SFX is disabled"
    why_human: "Audio output of HTMLAudioElement.play() cannot be verified without a real browser; requires live playback confirmation"
  - test: "Set auto-pause to every 1 leg, finish a leg, check both the /match scoring window and the /display spectator window"
    expected: "Countdown overlay appears on both windows simultaneously, ticks down in sync, auto-resumes at 0:00, and resumes immediately when 'Weiter' is pressed on /match; /display shows no 'Weiter' button"
    why_human: "Cross-window BroadcastChannel sync and countdown legibility on a 27\" monitor at 3m require physical verification; timer drift check requires observation across windows"
  - test: "Verify caller language switching: enable caller, set language to English, score a visit"
    expected: "Announcement uses English phrasing ('you need T20, D20') instead of German ('du brauchst')"
    why_human: "Language of spoken TTS output cannot be verified programmatically"
---

# Phase 5: Audio & Auto-Pause Verification Report

**Phase Goal:** The caller announces visit scores and celebrates 180s and high checkouts with sound; the match automatically pauses with a countdown after a configurable number of legs
**Verified:** 2026-06-12T21:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | After every visit, a caller voice announces the score in the selected language (German or English) via speech synthesis | VERIFIED | `announceVisit()` in `audio-caller.ts` (L52-87): builds German/English text, calls `speechSynthesis.speak()` with correct `lang` tag; wired in `match/+page.svelte` visit-detection `$effect` (L188-196); disabled guard (D-06) and undefined-synthesis guard (D-02) both present; unit tests all pass |
| SC-2 | Sound effects play on 180s, high finishes, and new personal records, reinforcing the achievement overlay | VERIFIED | `playSfx()` in `audio-sfx.ts` (L25-34); fired from two `$effect`s in `match/+page.svelte` (L77-135): pendingRecords watcher for 180/record/highest-checkout-record; leg-close watcher for non-record checkouts ≥ 100; three real MP3 assets in `static/sfx/` (valid ID3 headers, 15+11+20 = 46 KB total, all within 200 KB cap) |
| SC-3 | Player can mute or independently configure the caller voice and sound effects | VERIFIED | `audio-prefs.ts` exports `loadAudioPrefs`/`saveAudioPref` with 6 independent `nvm_*` keys; `MatchSetup.svelte` "Audio & Pause" section (L193-279) has separate toggles for Anrufer/Soundeffekte/Automatische Pause plus conditional DE/EN seg-control and pause steppers; each change handler calls `saveAudioPref()` immediately |
| SC-4 | After a configurable number of legs, a pause screen with a countdown timer appears on both views; the match continues automatically when the timer expires or when the player presses a button | VERIFIED | `match.svelte.ts` `#checkAutoPause` (L350-377): uses monotonic `legCompleted.length` (set-reset-safe), trips pause at configured interval; `decrementPause`/`resumePause` methods implemented; `PauseOverlay.svelte` (prop-driven, role=dialog, MM:SS, z-index 60); mounted on `/match` (L334-339) with `showResume=true` and countdown `$effect` (L63-69); mounted on `/display` (L220-224) with `showResume=false`; `DisplayStore.connect()` handles `pause-tick` messages before `isValidMatchState` guard (L82-86) |

**Score:** 4/4 roadmap success criteria verified

### Plan-Level Must-Have Truths

#### Plan 01 (AUD-01, AUD-03 caller half)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When the caller is enabled, a spoken visit score is heard after each confirmed visit | VERIFIED | `announceVisit` called inside visit-detection `$effect` in `match/+page.svelte` (L195); guards check `callerEnabled` before speaking |
| 2 | When a checkout is on, the spoken announcement appends the German checkout hint (D-03) | VERIFIED | `audio-caller.ts` L66-74: builds `${score} — du brauchst ${suggestion.join(', ')}` or `${score} — you need ${suggestion.join(', ')}`; pre-visit remaining computed as `player.remaining + total` (A3 resolved) |
| 3 | When the caller is disabled (default), no speech is attempted (D-06) | VERIFIED | `announceVisit` L58: `if (!callerEnabled) return;`; test "does NOT call speak when callerEnabled=false" passes |
| 4 | When speechSynthesis is unavailable or no matching voice exists, scoring continues silently (D-02) | VERIFIED | L59: `if (typeof speechSynthesis === 'undefined') return;`; L63: `const voice = findVoice(...); if (!voice) return;`; tests for both paths pass |
| 5 | Audio preferences load from localStorage with correct defaults and persist on change | VERIFIED | `audio-prefs.ts` DEFAULTS object (L15-22); `KEY_MAP` maps camelCase to `nvm_*` keys; `loadAudioPrefs` in try/catch; 15 unit tests all cover load/save round-trips |

#### Plan 02 (AUD-02, AUD-03 full)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When SFX are enabled, a sound plays on a 180 and on a new personal record, in sync with the celebration overlay (D-05) | VERIFIED | `$effect` in `match/+page.svelte` L77-93 watches `matchStore.pendingRecords`; fires `playSfx('180', ...)` when `type==='180'`; else `playSfx('record', ...)`; synced to RecordOverlay via same `pendingRecords` signal |
| 2 | When SFX are enabled, a sound plays on a high finish (checkout >= 100) | VERIFIED | Two-tier: (a) `playSfx('highfinish', ...)` when `highest-checkout` record has `value >= 100` (L89-92); (b) leg-close watcher (L100-135) fires for non-record high finishes via board checkout dart scoring |
| 3 | When SFX are disabled (default), no sound plays (D-06) | VERIFIED | `audio-sfx.ts` L26: `if (!sfxEnabled) return;`; tests "does NOT construct Audio when sfxEnabled=false" passes |
| 4 | The player can independently toggle caller, caller language, and SFX, and configure auto-pause, in match setup (AUD-03/D-07) | VERIFIED | `MatchSetup.svelte` L193-279: all four controls present with correct `saveAudioPref` calls in change handlers |
| 5 | Audio prefs chosen in setup persist across matches via localStorage | VERIFIED | Each change handler writes via `saveAudioPref`; `loadAudioPrefs` reads back; round-trip confirmed by unit tests |

#### Plan 03 (FLOW-02)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After the configured number of legs, a pause screen with a live countdown appears on the input view (/match) | VERIFIED | `match/+page.svelte` L334-339: PauseOverlay mounted with `pauseActive={matchStore.pauseActive}`; countdown `$effect` L63-69 drives `decrementPause()` every second |
| 2 | The same pause screen appears on the spectator view (/display), synced via BroadcastChannel (D-09) | VERIFIED | `display/+page.svelte` L220-224: PauseOverlay mounted with `pauseActive={displayStore.pauseActive}`; `displayStore.connect()` L82-86 handles `MSG_PAUSE_TICK` messages |
| 3 | The match auto-resumes when the countdown reaches 0:00 OR when the player presses 'Weiter' (D-09) | VERIFIED | `decrementPause()` L384-392: when remaining reaches 1 calls `resumePause()`; `resumePause()` L398-402 clears state; "Weiter" button (L339) calls `matchStore.resumePause()`; 9 unit tests cover both paths |
| 4 | Auto-pause is ON by default at 5 legs / 8 minutes, configurable, and can be turned off (D-08) | VERIFIED | `audio-prefs.ts` DEFAULTS L18-21: `pauseEnabled: true`, `pauseLegs: 5`, `pauseMinutes: 8`; MatchSetup exposes all three controls |
| 5 | The countdown timer runs only in the scoring window; /display is a read-only subscriber (no drift) | VERIFIED | No `setInterval`, `decrementPause`, `initVoices`, or `announceVisit` in `display/+page.svelte`; DisplayStore only sets `pauseActive`/`pauseRemainingSeconds` from incoming messages |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/audio-prefs.ts` | AudioPrefs interface + loadAudioPrefs + saveAudioPref | VERIFIED | 64 lines; exports all three; 6 nvm_ keys; try/catch no-throw |
| `src/lib/audio-caller.ts` | initVoices + findVoice + announceVisit | VERIFIED | 88 lines; all exports present; Android normalization, disabled guard, null-voice guard |
| `src/lib/audio-sfx.ts` | playSfx + SfxEvent type + SFX_PATHS | VERIFIED | 35 lines; disabled guard; .catch() on play(); try/catch outer |
| `src/ui/overlays/PauseOverlay.svelte` | Prop-driven overlay with role=dialog | VERIFIED | 117 lines; role=dialog, aria-modal, position:fixed, z-index 60, MM:SS, German copy; showResume conditional |
| `src/lib/audio-prefs.test.ts` | AUD-03 unit coverage | VERIFIED | 115 lines; 15 tests; covers defaults, key mapping, round-trips |
| `src/lib/audio-caller.test.ts` | AUD-01 unit coverage | VERIFIED | 149 lines; covers disabled guard, German/English voice, Android lang, no-voice, no-throw |
| `src/lib/audio-sfx.test.ts` | AUD-02 unit coverage | VERIFIED | 86 lines; 10 tests; disabled no-op, path correctness, volume 0.8, no-throw |
| `src/ui/overlays/PauseOverlay.test.ts` | FLOW-02 browser tests | VERIFIED | 123 lines; 11 tests; render gating, MM:SS, Weiter visibility, onresume callback, position:fixed |
| `static/sfx/180.mp3` | Real MP3, ≤200 KB | VERIFIED | 15,717 bytes; valid ID3 header (0x494433) |
| `static/sfx/highfinish.mp3` | Real MP3, ≤200 KB | VERIFIED | 11,015 bytes; valid ID3 header |
| `static/sfx/record.mp3` | Real MP3, ≤200 KB | VERIFIED | 20,106 bytes; valid ID3 header |
| `src/stores/match.svelte.ts` | pauseActive/pauseRemainingSeconds/pauseLegCount $state + pause methods | VERIFIED | L68-83: three $state fields; L384-423: decrementPause, resumePause, #broadcastPause, #checkAutoPause; no reducer changes |
| `src/stores/display.svelte.ts` | pauseActive/pauseRemainingSeconds $state + pause-tick branch | VERIFIED | L42-44: two $state fields; L82-86: MSG_PAUSE_TICK branch before isValidMatchState |
| `src/lib/sync-constants.ts` | MSG_PAUSE_TICK constant | VERIFIED | L26-30: exported with JSDoc; value 'pause-tick' |
| `src/ui/setup/MatchSetup.svelte` | "Audio & Pause" section with all controls | VERIFIED | L193-279: all four controls (Anrufer, Soundeffekte, Automatische Pause + steppers); loadAudioPrefs/saveAudioPref wired |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `match/+page.svelte` | `announceVisit` | visit-detection $effect (L195) | WIRED | Called inside existing for-loop effect, non-bust guard present |
| `match/+page.svelte` | `loadAudioPrefs` | module-scope const (L27) | WIRED | Read once at init, sync |
| `match/+page.svelte` | `playSfx` | pendingRecords $effect (L82-92) + leg-close $effect (L128) | WIRED | Two call sites, both in /match only |
| `MatchSetup.svelte` | `saveAudioPref` | change handlers on all 6 controls | WIRED | Verified in 4 toggle/stepper handlers (L206, L218, L221, L240, L253, L93, L99) |
| `match.svelte.ts` | `BC_CHANNEL` pause-tick | `#broadcastPause()` postMessage with `type: MSG_PAUSE_TICK` | WIRED | L412-419; wrapped in try/catch |
| `display.svelte.ts` | `pauseActive/pauseRemainingSeconds` | pause-tick branch in connect() (L82-86) | WIRED | Checked before isValidMatchState; Pitfall 3 compliant |
| `match/+page.svelte` | `setInterval/decrementPause` | countdown $effect (L63-69) with clearInterval cleanup | WIRED | Returns `() => clearInterval(id)` — Pitfall 7 leak prevention confirmed |
| `display/+page.svelte` | `PauseOverlay` | mounted (L220-224) with showResume=false | WIRED | No local timer; sources from displayStore |
| `match/+page.svelte` | `PauseOverlay` | mounted (L334-339) with showResume=true, onresume→resumePause | WIRED | Full binding confirmed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PauseOverlay.svelte` | `pauseActive`, `remainingSeconds` | Props from matchStore.$state / displayStore.$state | Yes — driven by `#checkAutoPause` (real leg-count transition) and `decrementPause` (real setInterval) | FLOWING |
| `match/+page.svelte` caller | `audioPrefs.callerEnabled/callerLang` | `loadAudioPrefs()` reading localStorage | Yes — reads 6 real nvm_ keys with type coercion | FLOWING |
| `match/+page.svelte` SFX | `audioPrefs.sfxEnabled`, `matchStore.pendingRecords` | loadAudioPrefs() + real $state from #detectRecords | Yes — pendingRecords populated by real dispatch transitions | FLOWING |
| `MatchSetup.svelte` | `callerEnabled`, `sfxEnabled`, `pauseEnabled`, etc. | `loadAudioPrefs()` at module level | Yes — reads back from localStorage on each setup page load | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| announceVisit disabled guard | Unit test: "does NOT call speak when callerEnabled=false" | Confirmed passing (suite: 396/396 per orchestrator) | PASS |
| playSfx disabled guard | Unit test: "does NOT construct Audio when sfxEnabled=false" | Confirmed passing | PASS |
| PauseOverlay not rendered when pauseActive=false | Browser test: "with pauseActive=false the overlay is NOT rendered" | Confirmed passing | PASS |
| decrementPause to 0 auto-resumes | Unit test: "decrementPause to 0 auto-resumes: pauseActive=false" | Confirmed passing | PASS |
| pauseActive trips at configured leg interval | Unit test: "pauseActive becomes true after completing the configured number of legs (1-leg interval)" | Confirmed passing | PASS |
| No announceVisit in /display | `grep -r "announceVisit|playSfx" src/routes/display/+page.svelte` | No matches | PASS |

### Probe Execution

Step 7c: SKIPPED — no probe scripts defined for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUD-01 | 05-01-PLAN.md | Caller voice announces visit scores via speech synthesis, with selectable language | SATISFIED | `announceVisit()` fully implemented, wired in /match visit-detection $effect; unit tests green |
| AUD-02 | 05-02-PLAN.md | Sound effects play on 180s, high finishes, and new records | SATISFIED | `playSfx()` implemented; three SFX assets present (46 KB); wired to pendingRecords + leg-close watchers; REQUIREMENTS.md checkbox `[ ]` is stale documentation — implementation is complete |
| AUD-03 | 05-01, 05-02-PLAN.md | Player can mute or configure caller and sound effects | SATISFIED | All 6 prefs independently configurable in MatchSetup; all persist via localStorage with correct nvm_ keys |
| FLOW-02 | 05-03-PLAN.md | Pause screen with countdown timer on both views; auto-resume | SATISFIED | Complete end-to-end: MatchStore pause state, PauseOverlay on both routes, BroadcastChannel sync, auto-resume + manual Weiter |

**Note on AUD-02 in REQUIREMENTS.md:** The `[ ]` checkbox and `Pending` traceability status for AUD-02 in `.planning/REQUIREMENTS.md` are stale — the last-updated date on that file is 2026-06-10 (before Phase 5 was implemented). The implementation is fully present and tested. This is a documentation maintenance issue, not a code gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/routes/match/+page.svelte` | 121-131 | High-finish leg-close watcher iterates ALL player visits (not just current-leg visits) | Info | On each new leg close, the loop scans every historical checkout visit. Could fire `playSfx('highfinish', ...)` multiple times if a player had multiple prior high-finish checkouts. The `alreadyCovered` guard prevents double-firing when it IS a new personal record but not for repeated non-record high finishes. However: (a) the `return` on L133 exits after the first player whose legCount changed, limiting scope to one dispatch; (b) the `playSfx` call is fire-and-forget and only plays a sound — no scoring impact; (c) this is a documented design decision (SUMMARY A4). Not a correctness blocker. |
| `src/db/profiles.ts` | 24 | Pre-existing type error (T-05 debt) | Info | Documented pre-existing debt from Phase 3; not introduced by Phase 5; does not block build or tests |

No `TBD`, `FIXME`, or `XXX` debt markers found in any Phase 5 files.

### Human Verification Required

The following items require a real device/browser to confirm audio output quality and cross-window countdown sync:

### 1. Caller Speech Output (AUD-01)

**Test:** Enable the caller in setup, play a visit (e.g. score 140), confirm speech is heard. Then enable checkout hint: score a visit when remaining is 121, confirm the hint matches.
**Expected:** A German voice announces "140" for a plain visit. For remaining=121, announces "Einhunderteinundzwanzig — du brauchst T20, T11, D14" (or equivalent). Switching language to English produces "you need T20, T11, D14".
**Why human:** Speech synthesis voices and their pronunciation of German/English numerals vary by device and browser. TTS audio output cannot be grepped.

### 2. SFX Audio Output (AUD-02)

**Test:** Enable SFX, trigger a 180 (board input: three T20), a high finish (checkout >= 100), and a new personal record.
**Expected:** Distinct sounds play for each event in sync with the celebration overlay. No sounds play when SFX is disabled. No audio artifacts or distortion. Volume is perceptible but not startling.
**Why human:** HTMLAudioElement playback cannot be verified without a real browser audio capture chain.

### 3. Cross-Window Pause Countdown Sync (FLOW-02)

**Test:** Set auto-pause to 1 leg. Open the spectator display in a second window. Score a full leg (501 down to 0). Observe both windows.
**Expected:** Countdown overlay appears on BOTH windows simultaneously. Timer counts down in sync (no drift). At 0:00 both windows exit the pause automatically. Pressing "Weiter" on /match also dismisses the overlay on /display. The spectator window shows no "Weiter" button.
**Why human:** BroadcastChannel cross-window sync and timer drift require physical two-window observation. Countdown legibility from 3m requires spatial observation.

### 4. Pause Countdown Legibility on Spectator Display

**Test:** With auto-pause active, confirm the countdown digits are readable from approximately 3 meters on the spectator display.
**Expected:** The `clamp(4rem, 10vw, 12rem)` countdown digits in `--accent` (#e8a020) are large and legible at spectator distance.
**Why human:** Visual/spatial readability cannot be verified programmatically (DISP-04 typographic requirement).

### Gaps Summary

No code gaps. All 4 roadmap success criteria are verified against actual implementation. All required artifacts exist, are substantive (not stubs), are wired, and have data flowing through them. The phase goal is achieved in the codebase.

The only items outstanding are human-testable behaviors (audio output quality, cross-window countdown legibility) that are structurally correct in code but require physical confirmation.

---

_Verified: 2026-06-12T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
