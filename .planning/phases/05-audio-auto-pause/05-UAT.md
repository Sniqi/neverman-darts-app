---
status: testing
phase: 05-audio-auto-pause
source: [05-VERIFICATION.md]
started: 2026-06-12
updated: 2026-06-12
---

## Current Test

number: 1
name: Caller speaks visit score in selected language
expected: |
  The visit score is spoken aloud after each non-bust visit; a checkout hint is appended
  when a finish is on (e.g. "Einhunderteinundzwanzig — du brauchst T20, T11, D14").
awaiting: user response

## Tests

### 1. Caller speaks visit score in selected language
expected: Enable the caller in setup, play a visit — the visit score is spoken aloud after each non-bust visit; a checkout hint is appended when a finish is on.
result: [pending]

### 2. SFX play on 180 / high finish / record, synced to overlay
expected: Enable SFX, score a 180, trigger a high finish (checkout ≥ 100), and a new personal record — each event plays a distinct sound in sync with the celebration overlay; no sounds play when SFX is disabled.
result: [pending]

### 3. Auto-pause countdown syncs across both windows and resumes
expected: Set auto-pause to every 1 leg, finish a leg, check both the /match scoring window and the /display spectator window — the countdown overlay appears on both windows simultaneously, ticks down in sync, auto-resumes at 0:00, and resumes immediately when "Weiter" is pressed on /match; /display shows no "Weiter" button.
result: [pending]

### 4. Caller language switching (English)
expected: Enable caller, set language to English, score a visit — the announcement uses English phrasing ("you need T20, D20") instead of German ("du brauchst").
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

Three design decisions were revised during UAT (committed in feat(05) a42f851):

**1. Audio source moved to /display (Observer) only**
- Original: audio (caller + SFX) fired from /match scoring window ("Pitfall 6" decision).
- Changed: /match is now fully silent. All audio plays from /display.
- Why: User validated that the spectator window is always open during play; having
  audio from the scoring tablet (face-down or across the table) is less useful than
  audio from the TV-connected display PC. Reverses the Pitfall 6 rationale intentionally.
- Implementation: removed announceVisit/playSfx/initVoices from match/+page.svelte;
  added caller $effect, SFX via record-channel types/values, and high-finish leg-close
  $effect to display/+page.svelte. Storage-event listener keeps prefs in sync with Setup.

**2. Volume slider added (default 50%), controls both caller and SFX**
- New audioVolume pref (nvm_audio_volume, 0..1, default 0.5).
- Slider shown in both MatchSetup "Audio & Pause" section and /display top-left corner.
- playSfx and announceVisit both accept a volume param (clamped 0..1).

**3. Caller checkout hint speaks remaining number, not dart route**
- Original: "121 — du brauchst T20, T11, D14" (route from getSuggestion()).
- Changed: "121 — du brauchst 100" (the remaining checkout number).
- Why: User found the route pronunciation confusing (T20 sounds like "T zwanzig").
  The number is cleaner and unambiguous for all languages.
- Applied to both DE and EN. announceVisit signature changed from
  suggestion:string[]|null to checkoutNumber:number|null.
