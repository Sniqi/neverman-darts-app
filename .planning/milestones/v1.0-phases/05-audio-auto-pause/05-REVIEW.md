---
phase: 05-audio-auto-pause
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/lib/audio-prefs.ts
  - src/lib/audio-prefs.test.ts
  - src/lib/audio-caller.ts
  - src/lib/audio-caller.test.ts
  - src/lib/audio-sfx.ts
  - src/lib/audio-sfx.test.ts
  - src/lib/sync-constants.ts
  - src/stores/match.svelte.ts
  - src/stores/match.svelte.test.ts
  - src/stores/display.svelte.ts
  - src/ui/overlays/PauseOverlay.svelte
  - src/ui/overlays/PauseOverlay.test.ts
  - src/ui/setup/MatchSetup.svelte
  - src/routes/match/+page.svelte
  - src/routes/display/+page.svelte
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed all 15 Phase 5 files covering audio preferences, Web Speech API caller, SFX, BroadcastChannel sync constants, the match and display stores, the pause overlay, match setup UI, and both route pages.

The architecture is sound: BroadcastChannel envelope handling is correct (pause-tick discriminant routes before `isValidMatchState`, preventing Pitfall 3), the auto-pause countdown lifecycle is clean (setInterval managed by a `$effect` that returns a `clearInterval` cleanup), the `decrementPause` boundary at 1 → 0 is correct, and the record-detection mutation-only contract (T-04-14) holds. Security surface is minimal and handled appropriately.

One blocker is confirmed: the high-finish SFX `$effect` scans the player's entire visit history on every leg completion, causing the sound to fire once per prior high-finish checkout per new leg. Three warnings cover a localStorage type-cast that bypasses validation, unbounded stepper inputs whose overflow breaks the countdown display, and a semantically-incorrect guard for `onvoiceschanged`. Two info items note a test gap and a borderline SSR risk.

---

## Critical Issues

### CR-01: High-finish SFX fires once per prior high-finish checkout on every subsequent leg

**File:** `src/routes/match/+page.svelte:121-131`

**Issue:** When a leg is completed the `$effect` sets `lastLegCounts[player.id]` to the new count and then iterates `player.visits` — the **full** match-history array. On leg 2+, visits from previous legs are still in the array. Every `wasCheckout === true` visit with `darts.length > 0` and `score >= 100` triggers `playSfx('highfinish', ...)`. A match where the player scores a high-finish in leg 1 and then again in leg 2 will fire the SFX twice on the leg-2 completion, three times on leg-3 completion, and so on.

The comment says "Inspect visits added since the previous leg count" but the code does not honour that intent — it never slices the visit array to only the new leg's visits.

**Fix:** Determine the visit index range for the just-completed leg. The `legStartVisitIndex` map in `MatchState` already tracks where each leg started (it is the same structure used by `PlayerPanel`). Use it to slice only the new leg's visits:

```typescript
// Inside the $effect, after updating lastLegCounts:
const legStartIdx = state.legStartVisitIndex[player.id] ?? 0;
// legStartVisitIndex points to the first visit of the CURRENT (next) leg at
// the time of this dispatch, which is also the visit AFTER the completed leg's
// checkout. To get the completed leg's visits, slice [legStartIdx, visits.length).
// Note: after a leg win the reducer updates legStartVisitIndex to visits.length,
// so the completed leg's visits are player.visits.slice(legStartIdx).
// Use prevLegStartIdx captured before the dispatch for precision, or simply:
const completedLegVisits = player.visits.slice(legStartIdx);
for (const v of completedLegVisits) {
    if (v.wasCheckout === true) {
        // ... existing score computation and playSfx call
    }
}
```

If `legStartVisitIndex` indexing is uncertain, a safer minimal fix is to find only the LAST `wasCheckout === true` visit (the most recent checkout of the just-completed leg is always the final visit of that leg):

```typescript
const visits = player.visits;
// Work backwards from the end — the checkout of the just-completed leg is
// the last visit with wasCheckout === true at or after the previous visit count.
// Since lastLegCounts was just set to nextLegCount, use the prior value
// (tracked as prevLegCount above) to bound the search.
const newVisits = visits.slice(/* startIndex of the just-completed leg */);
```

The safest minimal change: replace `const visits = player.visits;` with a slice from the index stored before the update:

```typescript
// Capture prevVisitCount BEFORE updating lastLegCounts, then use it here.
// (Requires hoisting the previous-count read above the lastLegCounts assignment.)
const legVisits = player.visits.slice(prevVisitCountForThisPlayer);
for (const v of legVisits) { ... }
```

---

## Warnings

### WR-01: `callerLang` read from localStorage without validity check — unchecked type cast

**File:** `src/lib/audio-prefs.ts:42`

**Issue:** `loadAudioPrefs()` reads `nvm_caller_lang` from localStorage and casts it directly to `'de' | 'en'` with `as`. The `?? 'de'` null-coalescing guard only fires when the stored value is `null` (key absent). Any non-null string — including user-edited or future locale values like `'fr'`, `'auto'`, or an empty string — is returned as-is with a false type. The value flows into `announceVisit()` which passes it to `findVoice()` where it silently finds no match (acceptable degradation), but the language tag set on `SpeechSynthesisUtterance.lang` will be invalid and the utterance may be rejected or mispronounced on some engines.

**Fix:** Add an explicit allow-list check before the null-coalescing fallback:

```typescript
const rawLang = localStorage.getItem(KEY_MAP.callerLang);
callerLang: (rawLang === 'de' || rawLang === 'en') ? rawLang : 'de',
```

---

### WR-02: `pauseLegs` and `pauseMinutes` steppers have no upper bound — countdown display overflows

**File:** `src/ui/setup/MatchSetup.svelte:89-103`

**Issue:** `adjustPauseLegs` enforces a minimum of 1 but no maximum. `adjustPauseMinutes` has the same gap. A user can increment either value to an arbitrarily large integer. When `pauseMinutes` is set to a value where `pauseMinutes * 60 > 5999` (i.e., `pauseMinutes >= 100`), the `mm` derived value in `PauseOverlay.svelte` computes to a 3+-digit string. `padStart(2, '0')` does not truncate — it only pads — so the countdown displays as e.g. `100:00`, breaking the fixed-width layout designed for `MM:SS`.

The increment button for `pauseLegs` also lacks a `disabled` attribute for the upper bound, unlike the decrement button (line 165: `disabled={legsToWin <= 1}`).

**Fix:** Add an upper bound to both functions and disable the increment button when the cap is reached:

```typescript
function adjustPauseLegs(delta: number) {
    const next = pauseLegs + delta;
    if (next >= 1 && next <= 20) {   // 20 legs is a reasonable ceiling
        pauseLegs = next;
        saveAudioPref('pauseLegs', next);
    }
}

function adjustPauseMinutes(delta: number) {
    const next = pauseMinutes + delta;
    if (next >= 1 && next <= 30) {   // 30 minutes keeps MM:SS valid (<=99:59)
        pauseMinutes = next;
        saveAudioPref('pauseMinutes', next);
    }
}
```

And add `disabled={pauseLegs >= 20}` / `disabled={pauseMinutes >= 30}` to the respective increment buttons.

---

### WR-03: `onvoiceschanged` guard uses value-equality instead of property presence

**File:** `src/lib/audio-caller.ts:18`

**Issue:** The guard `speechSynthesis.onvoiceschanged !== undefined` tests the property's current value, not whether the property exists. In Chrome and Firefox, `onvoiceschanged` is present on the `SpeechSynthesis` prototype with an initial value of `null`. The check evaluates `null !== undefined` → `true`, which happens to produce the correct behavior on all target browsers. However, the semantic intent ("does this browser support `onvoiceschanged`?") is expressed wrongly: a browser that intentionally sets the property to `undefined` would be mishandled, and a future engine change that initialises the property to `0` or `false` would also pass the check without the assignment being meaningful.

**Fix:** Use the `in` operator to test property existence:

```typescript
if ('onvoiceschanged' in speechSynthesis) {
    speechSynthesis.onvoiceschanged = () => {
        cachedVoices = speechSynthesis.getVoices();
    };
}
```

---

## Info

### IN-01: `pauseEnabled = 'true'` path has no test coverage

**File:** `src/lib/audio-prefs.test.ts`

**Issue:** The test suite covers two of the three observable states for `pauseEnabled`: absent (→ `true`) and `'false'` (→ `false`). The third state — key present and set to `'true'` — is not explicitly tested. The implementation `localStorage.getItem(...) !== 'false'` correctly returns `true` for `'true'`, but the absence of a test means the inverted encoding is only half-verified. A refactor that accidentally swaps the polarity (e.g. to `=== 'true'`) would break the default-true behaviour and pass only the absent-key test.

**Fix:** Add one test:

```typescript
it('pauseEnabled is true when key is explicitly "true"', () => {
    localStorage.setItem('nvm_pause_enabled', 'true');
    expect(loadAudioPrefs().pauseEnabled).toBe(true);
});
```

---

### IN-02: `loadAudioPrefs()` called at module (script) level in MatchSetup — no SSR guard

**File:** `src/ui/setup/MatchSetup.svelte:15`

**Issue:** `const audioPrefs = loadAudioPrefs();` executes at module evaluation time (the top-level `<script>` block), not inside a lifecycle hook or `$effect`. `localStorage` is not available in SSR. The project uses `adapter-static` with `fallback: 'index.html'`; in that configuration pages are not server-rendered by default, so this is unlikely to cause a runtime error today. However, the pattern is fragile: if `ssr` is ever re-enabled for the setup route, or if a test environment imports this component without a browser context, `loadAudioPrefs()` will throw (caught internally by its own try/catch → returns defaults), silently losing any saved preferences.

The comment "localStorage is sync" justifies the placement but not the SSR risk. The established project pattern (`loadAudioPrefs` in `match/+page.svelte:27` is also at module level for the same reason) makes this consistent, but worth flagging.

**Fix:** Wrap in `onMount` if SSR is ever enabled for this route, or add a `export const ssr = false;` to `+page.ts` if not already present.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
