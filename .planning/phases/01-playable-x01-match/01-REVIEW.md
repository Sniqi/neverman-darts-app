---
phase: 01-playable-x01-match
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 44
files_reviewed_list:
  - e2e/full-match-flow.spec.ts
  - src/app.css
  - src/app.html
  - src/db/db.ts
  - src/db/profiles.test.ts
  - src/db/profiles.ts
  - src/engine/board.test.ts
  - src/engine/board.ts
  - src/engine/bust.test.ts
  - src/engine/bust.ts
  - src/engine/checkout.test.ts
  - src/engine/checkout.ts
  - src/engine/impossible-scores.test.ts
  - src/engine/impossible-scores.ts
  - src/engine/reducer.test.ts
  - src/engine/reducer.ts
  - src/engine/rotation.test.ts
  - src/engine/rotation.ts
  - src/engine/types.ts
  - src/lib/wake-lock.svelte.ts
  - src/routes/+layout.svelte
  - src/routes/+layout.ts
  - src/routes/+page.svelte
  - src/routes/bulloff/+page.svelte
  - src/routes/match/+page.svelte
  - src/routes/setup/+page.svelte
  - src/stores/match.svelte.test.ts
  - src/stores/match.svelte.ts
  - src/ui/input/CheckoutSuggestion.svelte
  - src/ui/input/CorrectionWindow.svelte
  - src/ui/input/CorrectionWindow.test.ts
  - src/ui/input/Dartboard.svelte
  - src/ui/input/Dartboard.test.ts
  - src/ui/input/DartsAtDoubleDialog.svelte
  - src/ui/input/Numpad.svelte
  - src/ui/input/ScorePanel.svelte
  - src/ui/input/VisitStrip.svelte
  - src/ui/overlays/MatchWinOverlay.svelte
  - src/ui/setup/BullOffOrder.svelte
  - src/ui/setup/MatchSetup.svelte
  - src/ui/setup/PlayerPicker.svelte
  - src/ui/setup/ProfileManager.svelte
  - src/ui/setup/ProfileManager.test.ts
  - static/.nojekyll
findings:
  critical: 5
  warning: 8
  info: 10
  total: 23
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 44
**Status:** issues_found

## Summary

Re-review after gap-closure plans 01-05..01-09 (fixes for CR-01..CR-08 of the previous review). The engine core (reducer, bust, rotation, impossible-scores) is well-structured and well-tested, the event-log/UNDO semantics fixed in CR-07/WR-01 hold up, and no security issues were found (no `{@html}`, no injection surface, no secrets; sessionStorage parsing is guarded).

However, five Critical issues remain. The most severe is a domain-rule bug: the inner bull is encoded as `{multiplier: 2, segment: 50}` and all scoring computes `multiplier * segment`, so a bullseye tap scores **100 points instead of 50** — and following the app's own checkout suggestion ("Bull" on 50) produces a bust. The unit tests cement this wrong behavior rather than catch it. Additionally, the CorrectionWindow has two independent Critical defects (the deferred `$effect`/`elapsed` loop turns out to break auto-dismiss entirely, and the "Korrigieren" pause state is an inescapable dead end), the CR-06 live-remaining fix never reached the UI, and the bull-off screen can start a 0-player match that crashes the reducer.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Inner bull scores 100 points instead of 50

**File:** `src/engine/board.ts:44` (also `src/engine/bust.ts:31-34`, `src/engine/reducer.ts:119`, `src/engine/types.ts:9`)
**Issue:** `classifyHit` returns `{ multiplier: 2, segment: 50 }` for the inner bull. Every scoring site computes points as `multiplier * segment` (reducer line 119, bust.ts line 20, match store `remaining` getter), so a bullseye tap subtracts **100**, not 50. Consequences:
- All scores involving a bull tap are wrong by 50 points.
- The checkout table says `50: ['Bull']` and `170: ['T20','T20','Bull']` — a player on 50 who taps the bull as suggested busts (`50 - 100 = -50`).
- `isBust(50, {multiplier:2, segment:50}, 'double')` returns `true` (overshoot), so a legitimate bull finish is impossible from the board.

The tests encode the wrong rule instead of catching it: `src/engine/bust.test.ts:54-58` asserts "inner bull = 100 pts" and `src/engine/board.test.ts:9-13` locks in `{multiplier: 2, segment: 50}`. Note the conflicting representation already used in `bust.test.ts:48` (`d(2, 25)` = 50 pts), showing two incompatible encodings coexist.
**Fix:** Pick one canonical encoding whose `multiplier * segment` equals 50 and whose "is a double" semantics hold, e.g.:
```ts
// board.ts
if (r < 14.4) return { multiplier: 2, segment: 25 }; // inner bull = double bull = 50
```
Then in `bust.ts` the `multiplier === 2` check already validates the finish (the `segment === 50` branch becomes dead and should be removed or kept for numpad-path safety), and `types.ts` comment must be updated. Display code keying on `segment === 50` / `segment === 25` (`VisitStrip.formatDart`, `CorrectionWindow.formatDart`) must distinguish inner bull as `multiplier === 2 && segment === 25` → "Bull". Update `board.test.ts` and `bust.test.ts` to assert 50 points and a valid bull finish from remaining 50.

### CR-02: Active player's displayed score does not update mid-visit (CR-06 fix incomplete)

**File:** `src/ui/input/ScorePanel.svelte:16` (store getter: `src/stores/match.svelte.ts:35-42`)
**Issue:** The previous review's CR-06 added the live `matchStore.remaining` getter (committed remaining minus current-visit darts), but no UI component consumes it — a grep shows it is only used by tests and internally by `suggestion`. ScorePanel renders `{player.remaining}`, which holds the start-of-visit value until the third dart. Result: after tapping T20 from 100, the big score still shows **100** while the CheckoutSuggestion beside it (which uses the live getter) shows **"D20"** for 40 — the two main score elements contradict each other on screen during every board visit.
**Fix:**
```svelte
<span class="remaining" ...>
  {isActive ? matchStore.remaining : player.remaining}
</span>
```

### CR-03: "Korrigieren" is an inescapable dead end — overlay covers the undo button it tells the user to press

**File:** `src/ui/input/CorrectionWindow.svelte:64-72, 113-119` (layout: `src/routes/match/+page.svelte:134-157`)
**Issue:** Pressing "Korrigieren" sets `paused = true` and shows the hint "Verwende Rückgängig zum Bearbeiten". But:
1. The overlay (`position: absolute; inset: 0; z-index: 10`) is mounted inside `.panel-relative`, which **contains** the VisitStrip and the "Rückgängig" button — both are underneath the overlay and unclickable.
2. While paused, `handleOutsideClick` does nothing (`if (!paused) confirm()`), and no confirm/close/resume button is rendered.

There is no code path that ever clears `paused` or dismisses the window again (the parent only clears `pendingCorrection` via `ondismiss`, which only `confirm()` calls). The correction flow — the entire purpose of this component (D-05/INP-04) — soft-locks the panel area for the rest of the match; only the dartboard below remains usable.
**Fix:** While paused, render explicit controls inside the window, e.g. a "Rückgängig" button dispatching `{ type: 'UNDO' }` plus a "Fertig" button calling `confirm()`. Alternatively make outside-click while paused call `confirm()` and move the undo bar outside the overlay's bounding element.

### CR-04: Auto-dismiss timer never fires — `$effect` reads `elapsed` and restarts the timeout every animation frame

**File:** `src/ui/input/CorrectionWindow.svelte:40-44, 75-86`
**Issue:** Known deferred item from plan 01-07, but its impact is worse than "re-runs on every rAF tick": the `$effect` calls `startTimer()`, which reads the `$state` `elapsed` (lines 41 and 43), making `elapsed` a tracked dependency. Sequence in a real browser: effect runs → `setTimeout(confirm, 2500)` → rAF tick sets `elapsed ≈ 16` → effect re-runs → teardown calls `stopTimer()` which **cancels the pending 2.5 s timeout** → `elapsed = 0` → new 2500 ms timeout. This repeats every frame, so the timeout is perpetually reset and `confirm()` / `CONFIRM_VISIT` **never fires**; the progress bar stays at ~0 and the window only closes via manual outside-tap. Combined with the `pendingCorrection` gating in `+page.svelte`, subsequent visits get no correction window until someone taps the stuck overlay.

The component test (`CorrectionWindow.test.ts:49-65`) passes only because `vi.useFakeTimers()` + `advanceTimersByTime` runs timers synchronously without flushing Svelte's effect queue between rAF ticks — a false green that masks the production behavior.
**Fix:**
```ts
import { untrack } from 'svelte';
$effect(() => {
	if (visible) {
		elapsed = 0;
		paused = false;
		untrack(() => startTimer());
	} else { ... }
});
```
Also add a browser-mode test with real timers (or fake timers with effect flushing) asserting `CONFIRM_VISIT` after 2.5 s.

### CR-05: Bull-off screen can start a 0-player match; first board tap then crashes the reducer

**File:** `src/ui/setup/BullOffOrder.svelte:122-139` (also `src/engine/reducer.ts:80-81, 112-113`)
**Issue:** When `sessionStorage.pendingMatch` is absent (direct navigation to `/bulloff`, or browser-back after a match — the key is removed in `confirmOrder`), `order` is `[]` and the confirm button is still enabled. `confirmOrder` dispatches `START_MATCH` with `players: []`, the reducer happily sets `phase: 'playing'` with zero players, and the app navigates to `/match`. The first `DART_THROWN` then evaluates `state.players[0].remaining` on `undefined` → uncaught `TypeError`, crashing the scoring view. Related hardening gap: `applyStartMatch` uses `action.players.find(...)!` (reducer.ts:81), which produces the same class of crash if `order` contains an id not present in `players`.
**Fix:** In `BullOffOrder`, redirect to setup when there is nothing to order, and guard the dispatch:
```ts
if (order.length === 0) { goto(`${base}/setup`); return; }
```
In the reducer, make `applyStartMatch` ignore (or throw early on) `order` entries with no matching player and return the unchanged state when the resulting player list is empty.

## Warnings

### WR-01: dartsAtDouble is collected but never recorded anywhere — D-08/INP-03 is non-functional end-to-end

**File:** `src/routes/match/+page.svelte:105, 115-120` (also `src/ui/input/DartsAtDoubleDialog.svelte:22-24`, `src/engine/reducer.ts:127-131, 149, 163, 227`)
**Issue:** The winning `NUMPAD_VISIT` is dispatched **before** the dialog opens, with no `dartsAtDouble` — so the visit and the event-log entry both record `dartsAtDouble: 0`. `handleDartsAtDoubleConfirm` then discards both arguments ("Phase 3 persistence will use this value" — it cannot: the value exists nowhere after the dialog closes, and the event log is the replay source of truth). Compounding issues: `DartsAtDoubleDialog.select(darts)` calls `onconfirm(darts, darts)`, conflating darts-at-double with darts-used (a 3-dart visit with 1 dart at double would report `dartsUsed: 1`); the reducer hardcodes `dartsAtDouble: 0` for board-thrown win visits (line 149) even though the actual darts are known and it is computable; bust and non-finishing visits also hardcode 0 although failed double attempts are exactly what checkout-percentage stats need.
**Fix:** Defer the `NUMPAD_VISIT` dispatch until after the dialog confirms for finishing visits (dispatch with `{ total, dartsUsed, dartsAtDouble }`), and ask darts-used as a separate value. For board visits, derive `dartsAtDouble` from the thrown darts inside the reducer.

### WR-02: Correction window stops appearing after UNDO of a completed visit

**File:** `src/routes/match/+page.svelte:61-86`
**Issue:** The watcher fires when `player.visits.length > lastVisitCounts[player.id]` and only ever ratchets the count upward. UNDO replays the log and shrinks `visits`, but `lastVisitCounts` is never synced down. Example: player has 3 visits (recorded count 3), UNDO removes the visit (length 2), player re-throws the visit (length 3) → `3 > 3` is false → no correction window for the corrected visit, and the count stays permanently ahead.
**Fix:** In the effect, when `player.visits.length < prevCount`, write the lower value back into `lastVisitCounts` before the comparison.

### WR-03: Darts-at-double dialog shows on rejected numpad input (false win detection)

**File:** `src/routes/match/+page.svelte:101-113`
**Issue:** Win detection is the heuristic `prevRemaining === total && phase !== 'match-complete'`. If the visit is **rejected** by the reducer the state is unchanged and the heuristic still passes. Concrete case: remaining 166 (or 163/169), player enters 166 — `isValidVisitTotal` rejects it, nothing happens to the match, yet the "Wie viele Darts auf die Doppel?" dialog opens. Numpad-side validation does not cover this because the reducer rejects on different grounds than `isValidVisitTotal` alone.
**Fix:** Detect the win from actual state change, e.g. compare the active player's `legsWon`/`visits.length` before and after dispatch instead of comparing totals.

### WR-04: Numpad visits rejected by the reducer give zero user feedback, and busts cannot be entered

**File:** `src/engine/reducer.ts:197-207`, `src/ui/input/Numpad.svelte:30-41`
**Issue:** The reducer silently returns unchanged state for overshoot (`newRemaining < 0`) and leave-1 in double-out. The Numpad has already called `onconfirm` and cleared the input, so the score silently stays put with no shake/error — the scorer cannot tell whether the entry registered. There is also no way to record a bust via numpad: entering the actually-thrown (overshooting) total is rejected; the only workaround is entering 0, which records a normal 0-score visit without the `bust` flag (skewing future stats and the bust styling).
**Fix:** Have the parent detect a rejected dispatch (state unchanged) and surface the existing invalid/shake UI; longer term, accept an overshooting total as an explicit bust visit (score 0, `bust: true`) which matches real scoring practice.

### WR-05: Drag-to-reorder does not work on touch devices (implicit pointer capture)

**File:** `src/ui/setup/BullOffOrder.svelte:76-119`
**Issue:** Touch pointers are implicitly captured by the element that received `pointerdown` (Pointer Events spec), so `pointerenter` never fires on sibling `.player-card` elements during a touch drag — `dragOverId` stays `null` and the drop is a no-op. The app's primary platform is an Android tablet (touch-first per project constraints), so the advertised "ziehe zum Sortieren" affordance is dead on the main target device; mouse on PC is the only environment where it works at all.
**Fix:** Call `(e.target as Element).releasePointerCapture(e.pointerId)` in `onPointerDown` (or compute the drop target from `document.elementFromPoint(me.clientX, me.clientY)` in `onMove`).

### WR-06: Trailing click after a mouse drag rebuilds order from `initialPlayers`, destroying the drag result

**File:** `src/ui/setup/BullOffOrder.svelte:49-64, 92-109`
**Issue:** Two interacting defects: (1) with a mouse, a `click` event fires after `pointerup` even when the pointer moved (drag), and `onUp` resets `isDragging = false` before that click arrives, so `handleTap` runs after every mouse drag; (2) `handleTap` rebuilds `order` from `initialPlayers` (not from the current `order`), so the just-applied drag reorder is thrown away and replaced with `[clickedPlayer, ...initialOrder]`. Net effect: on PC, every drag-drop is immediately undone and the dragged player jumps to position 1 marked as "tapped". Independently, any tap after a drag silently discards the drag ordering.
**Fix:** Suppress the post-drag click (e.g. set a `justDragged` flag cleared on the next tick and early-return in `handleTap`), and rebuild the tap-sequenced order from the current `order` array instead of `initialPlayers`.

### WR-07: With sets enabled, every set starts with player 0 — set starter never rotates

**File:** `src/engine/reducer.ts:277-287`
**Issue:** After a set win the code hardcodes `const totalLegsCompleted = 0`, so `legStarterIndex(0, n)` always yields player 0 for the first leg of every new set, regardless of how many sets have been played. Standard darts rules alternate the set starter (and the previous within-set alternation also restarts at player 0). With sets enabled, player 0 gets a systematic first-throw advantage in every set.
**Fix:** Track total legs played across the match (e.g. count leg-conclusion events in the log, or keep a `legsPlayed` counter on state that is not reset on set boundaries) and feed that into `legStarterIndex`.

### WR-08: Bust highlight checks the wrong player; per-slot undo promise not implemented

**File:** `src/ui/input/VisitStrip.svelte:24-30, 36-43`
**Issue:** (a) `isBustVisit()` reads `matchStore.activePlayer` — but after a bust the reducer has already advanced `activePlayerIndex` to the **next** player. The red bust styling therefore never shows for the player who just busted; instead it shows (for the entire following turn) whenever the now-active player's previous visit happened to be a bust. (b) The header comment and each slot's `aria-label` ("Rückgängig: T20") promise that tapping a slot undoes back to that dart, but every slot dispatches exactly one `UNDO`, always removing only the most recent dart — screen-reader users are told a different action than the one performed.
**Fix:** (a) Derive the bust state from the most recently completed visit across all players (e.g. from the `pendingCorrection` data, which already carries `isBust`). (b) Either dispatch `UNDO` `currentVisit.length - slotIdx` times, or change the labels/comment to "Letzten Dart rückgängig".

## Info

### IN-01: `ensureDbOpen` is dead code

**File:** `src/db/db.ts:34-43`
**Issue:** Exported but never imported anywhere in `src/`. The defensive-open behavior it documents (T-01-02) is therefore not actually exercised; Dexie auto-opens on first query and the per-call try/catch in `profiles.ts` does the real work.
**Fix:** Remove it, or call it at app startup and gate profile UI on its result.

### IN-02: `NUMPAD_VISIT.dartsUsed` is accepted but never used — dart count of numpad visits is lost

**File:** `src/engine/reducer.ts:194, 211-215, 227`
**Issue:** `dartsUsed` is destructured with default 3 and then never referenced; numpad visits store `darts: []`, so the number of darts thrown is unrecoverable (needed for 3-dart averages in Phase 4). A `dartsUsed=1` visit of, say, 100 is also not validated (max for 1 dart is 60).
**Fix:** Persist `dartsUsed` on the `Visit` (new field) or validate/store it when Phase 3 needs it; remove the parameter if it stays unused.

### IN-03: `phase: 'leg-complete'` is declared but never produced

**File:** `src/engine/types.ts:42`
**Issue:** The reducer transitions directly `playing → playing` (next leg) or `playing → match-complete`; `'leg-complete'` is a dead union member that suggests a pause state that does not exist.
**Fix:** Remove the variant or implement the intended leg-pause.

### IN-04: Miss taps produce no visual flash

**File:** `src/ui/input/Dartboard.svelte:143-144, 209-215`
**Issue:** `flashKey = 'miss'` is set, but no element's fill depends on the `'miss'` key (the miss-zone path is hardcoded `fill="transparent"`), so tapping outside the double ring gives no visual acknowledgment even though a dart is recorded.
**Fix:** Bind the miss-zone fill to `flashKey === 'miss'` like the other regions.

### IN-05: `updateProfile` accepts an empty name; `createProfile` rejects it

**File:** `src/db/profiles.ts:31-42`
**Issue:** `updateProfile(id, { name: '   ' })` stores `name: ''`, `initial: ''` without error — inconsistent with `createProfile`, which throws. Currently only guarded at the UI layer (`ProfileManager.saveEdit`).
**Fix:** Throw (or no-op) in `updateProfile` when the trimmed name is empty.

### IN-06: `formatDart` labels a non-double segment-50 dart "Outer Bull"

**File:** `src/ui/input/VisitStrip.svelte:11`
**Issue:** `dart.segment === 50 && multiplier !== 2` falls through to `'Outer Bull'` — segment 50 is the inner bull; the label is wrong. Currently unreachable from `classifyHit`, but the encodings will shift when CR-01 is fixed.
**Fix:** Resolve together with the CR-01 bull re-encoding; keep one shared `formatDart` helper instead of two copies (also duplicated in `CorrectionWindow.svelte:32-38`).

### IN-07: Single-out mode gets no suggestion for finishable scores (1, 159, 162, …)

**File:** `src/engine/checkout.ts:196-205`
**Issue:** The bogey-`null` entries and missing `1` entry are double-out facts, but `getSuggestion` applies them to single-out too: remaining 159 in single-out (finishable T20 T20 T13) and remaining 1 (S1) return `null`. Per D-12 this only suppresses the hint, so impact is cosmetic.
**Fix:** For `outRule === 'single'`, skip the bogey nulls (and optionally add single-out routes) when single-out support is prioritized.

### IN-08: Fake-timer component test masks the CR-04 effect loop

**File:** `src/ui/input/CorrectionWindow.test.ts:16-24, 49-65`
**Issue:** `vi.useFakeTimers()` + `advanceTimersByTime(2600)` fires the original `setTimeout` without flushing Svelte's effect re-runs between rAF ticks, so the test passes while real browsers never auto-dismiss (see CR-04). Test reliability gap.
**Fix:** After fixing CR-04, add a real-timer browser test (or interleave `vi.advanceTimersToNextTimer()` with `await tick()`/`flushSync`) so the regression is detectable.

### IN-09: E2E dismisses the correction overlay via `evaluate()` DOM click, bypassing real hit-testing

**File:** `e2e/full-match-flow.spec.ts:66-81`
**Issue:** The comment admits Playwright's pointer-based click is "intercepted by .panel-area" — i.e. the overlay may not be the topmost hit-target where a real user would tap. Dispatching `element.click()` via `evaluate` sidesteps the very interaction being verified, so a real clickability regression would not fail this test.
**Fix:** Investigate why the pointer click is intercepted (z-index/stacking of `.panel-area` vs the overlay) and use a positioned `overlay.click({ position })` instead of `evaluate`.

### IN-10: `acquireWakeLock` does not guard against double acquisition

**File:** `src/lib/wake-lock.svelte.ts:12-20`
**Issue:** Each call overwrites `sentinel` without releasing the previous one; a still-active prior sentinel becomes unreleasable. In practice the browser auto-releases on visibility loss, so impact is minimal, but the visibilitychange handler in `match/+page.svelte` can call this repeatedly.
**Fix:** Early-return when `sentinel && !sentinel.released`, or release the old sentinel before requesting a new one.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
