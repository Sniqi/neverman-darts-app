---
phase: 05-audio-auto-pause
fixed_at: 2026-06-12T20:55:00Z
review_path: .planning/phases/05-audio-auto-pause/05-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-06-12
**Source review:** .planning/phases/05-audio-auto-pause/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, WR-01, WR-02, WR-03)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: High-finish SFX double-fires on multi-leg matches

**Files modified:** `src/routes/match/+page.svelte`
**Commit:** c9443dc
**Applied fix:** Added a second `$state` variable `lastLegEndVisitCounts` (parallel to `lastLegCounts`) that records each player's visit count at the moment their last leg ended. When a leg completion is detected, `legStartVisitIdx` is captured from this map before it is updated, then `player.visits.slice(legStartVisitIdx)` limits the checkout scan to only the just-completed leg's visits. Previously the code iterated the entire `player.visits` array (full match history), causing the SFX to re-fire for every prior high-finish leg on each subsequent leg completion.

### WR-01: `callerLang` unchecked `as` cast

**Files modified:** `src/lib/audio-prefs.ts`
**Commit:** 78e135e
**Applied fix:** Replaced the direct `as 'de' | 'en'` cast with an explicit allow-list check. The raw localStorage value is now read into `const rawLang` before the return object, and `callerLang` is set to `rawLang` only when it equals `'de'` or `'en'`, falling back to `'de'` for any other value (including null, empty string, or future locale codes).

### WR-02: Pause steppers have no upper bound

**Files modified:** `src/ui/setup/MatchSetup.svelte`
**Commit:** d1525ad
**Applied fix:** Added `next <= 20` to the `adjustPauseLegs` guard and `next <= 30` to the `adjustPauseMinutes` guard — matching the floor-check pattern already used by `adjustLegs` and `adjustSets`. Added `disabled={pauseLegs >= 20}` and `disabled={pauseMinutes >= 30}` to the respective increment buttons, matching the existing disabled-at-floor pattern on the decrement buttons.

### WR-03: `onvoiceschanged` guard tests value not presence

**Files modified:** `src/lib/audio-caller.ts`
**Commit:** 0a38133
**Applied fix:** Changed `speechSynthesis.onvoiceschanged !== undefined` to `'onvoiceschanged' in speechSynthesis`. The `in` operator tests property existence on the object/prototype rather than the property's current value, which correctly expresses the intent of "does this browser support onvoiceschanged".

## Skipped Issues

None.

---

**Test results:** `npm run test:unit` — 337 tests across 17 files, all passed.

---

_Fixed: 2026-06-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
