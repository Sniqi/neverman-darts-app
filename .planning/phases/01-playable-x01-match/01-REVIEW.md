---
phase: 01-playable-x01-match
reviewed: 2026-06-11T12:01:36Z
depth: standard
files_reviewed: 43
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
  critical: 1
  warning: 7
  info: 11
  total: 19
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-11T12:01:36Z
**Depth:** standard
**Files Reviewed:** 43
**Status:** issues_found

## Summary

Full adversarial review of the Phase 01 playable-X01-match implementation (engine, store, routes, input UI, setup UI, Dexie profiles, e2e). The pure engine (bust rules, board polar math, impossible-total validation, checkout table arithmetic) is solid — all checkout-table sums were spot-verified and the three double-out bust conditions are correct, including the outer-bull pitfall. Security posture is clean: no `{@html}`, no `eval`, no hardcoded secrets, `JSON.parse` of sessionStorage is guarded, player names are rendered via interpolation only.

The two recently changed files (plan 01-13) hold up: the trial-reduce in `handleNumpadVisit` is genuinely side-effect-free (the reducer never mutates input state), and the multiplier-aware bull flash in `Dartboard.svelte` correctly distinguishes inner bull (`{2,25}`) from outer bull (`{1,25}`) before the generic prefix branch.

However, the review found one critical scoring-integrity gap in the numpad finish path, and a cluster of warnings around sets-mode rotation, the correction-window lifecycle after UNDO, mixed board/numpad input, and touch drag-reorder on the bull-off screen.

## Critical Issues

### CR-01: Numpad finish grants impossible double-out checkouts (bogey numbers and >170)

**File:** `src/engine/reducer.ts:195-232`
**Issue:** `applyNumpadVisit` validates the entered total only with `isValidVisitTotal` (is it a scoreable 3-dart total?) plus the overshoot/leaves-1 rules. When `newRemaining === 0` it unconditionally awards the leg. In double-out mode, the totals **159, 162, 165, 168, 171, 174, 177, 180** are scoreable in three darts (so they pass `isValidVisitTotal`) but are **impossible to finish on a double** (bogey numbers and anything above 170 — the max double-out finish is 170). A player on 159 who enters `159` is granted a leg — and possibly the match — that cannot exist under X01 rules. This silently corrupts match results in an app whose core value is accurate scoring. Note `checkout.ts` already encodes exactly this knowledge (bogeys map to `null`, `>170 → null`), so the engine is internally inconsistent.
**Fix:** In `applyNumpadVisit`, reject a finishing total under double-out when it is not a checkable score:
```typescript
// Leg win
if (newRemaining === 0) {
	if (state.config.outRule === 'double') {
		const BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);
		if (total > 170 || BOGEY.has(total)) return state; // impossible double-out finish
	}
	// ... existing win handling
}
```
(Or derive the check from the existing table — `total > 170 || CHECKOUT_TABLE[total] === null` — to avoid duplicating the bogey list.)

## Warnings

### WR-01: Sets mode — leg-starter rotation resets to player 0 at every set boundary

**File:** `src/engine/reducer.ts:285-291`
**Issue:** After a set win that does not end the match, the code does `const totalLegsCompleted = 0; // reset after set win` and then `legStarterIndex(0, numPlayers)`, which is always `0`. Player 0 therefore starts the first leg of **every** set regardless of how many legs/sets have been played, and the within-set alternation is re-anchored to player 0 each set. Standard darts convention (and the resolved RESEARCH decision "legStarterIndex(L, n) = L % n" with L the match-wide leg number) requires the rotation to continue across set boundaries. This cannot be recomputed from `legsWon` because those are zeroed at the set boundary.
**Fix:** Track total legs completed across the match (e.g., a `legsPlayed` counter on `MatchState`, incremented on every leg win and reset only by `START_MATCH`) and use `legStarterIndex(legsPlayed, numPlayers)` in both the set-win and leg-win branches.

### WR-02: Correction window permanently stops firing after any UNDO (high-water-mark counts)

**File:** `src/routes/match/+page.svelte:62-87`
**Issue:** `lastVisitCounts` is only ever increased (`player.visits.length > prevCount`). UNDO shrinks `player.visits`, but the recorded count is not lowered. After the canonical correction flow — visit completes, user taps "Korrigieren", presses "Rückgängig", re-enters the corrected dart(s) — the re-completed visit has `visits.length === lastVisitCounts[id]`, so the correction window never appears for the corrected visit (and stays suppressed until the count exceeds the stale high-water mark). This breaks INP-04/D-05 for every visit that follows an undo.
**Fix:** Synchronize the recorded count downward when visits shrink:
```typescript
for (const player of state.players) {
	const prevCount = lastVisitCounts[player.id] ?? 0;
	if (player.visits.length < prevCount) {
		lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
		continue;
	}
	// existing > prevCount detection ...
}
```

### WR-03: Mid-visit board darts are silently discarded by a numpad entry

**File:** `src/engine/reducer.ts:195-248` (and `src/routes/match/+page.svelte:161` — toggle always enabled)
**Issue:** The board/numpad toggle is available mid-visit. If a player throws one or two board darts (accumulated in `currentVisit`, already reflected in the live `remaining` display) and then switches to numpad and confirms a total, `applyNumpadVisit` applies the total against the **committed** start-of-visit remaining and resets `currentVisit: []`. The already-thrown darts vanish from the score without any feedback, and the displayed remaining jumps. The orphaned `DART_THROWN` events stay in the log (replay stays consistent, but the user-visible behavior is wrong).
**Fix:** Reject `NUMPAD_VISIT` while a board visit is in progress — `if (state.currentVisit.length > 0) return state;` in the reducer — and/or disable the mode toggle in `+page.svelte` while `matchStore.currentVisit.length > 0`.

### WR-04: Numpad silently swallows rejected entries (overshoot / leaves-1) — input cleared, no feedback, bust unrecordable

**File:** `src/ui/input/Numpad.svelte:30-41` and `src/engine/reducer.ts:211-215`
**Issue:** For an overshoot (`newRemaining < 0`) or a score leaving 1 in double-out, the reducer returns the unchanged state — but the Numpad has already called `onconfirm` and cleared `inputValue` with no error shown. To the user the entry looks accepted while nothing happened. Additionally, a genuine bust (player overshot at the board) cannot be recorded via numpad as a bust: entering the actual score is silently dropped, and entering `0` records a normal non-bust visit (`bust: false`), so bust data is wrong for numpad play.
**Fix:** Validate against `matchStore.remaining` in the parent before dispatching and signal rejection back to the Numpad (e.g., `onconfirm` returns boolean; on `false` reuse the existing shake/"Ungültige Punktzahl" path). Decide explicitly how a numpad bust is recorded (e.g., treat overshoot/leaves-1 entry as a bust visit: score reverts, `bust: true`, turn passes — matching the board path).

### WR-05: VisitStrip bust styling evaluates the wrong player's visit

**File:** `src/ui/input/VisitStrip.svelte:24-33`
**Issue:** `isBustVisit()` reads the **active** player's last completed visit. A bust immediately passes the turn (`applyDartThrown` advances `activePlayerIndex`), so right after a bust the active player is the *next* player and the red styling never shows for the bust itself. Conversely, when a player who busted earlier becomes active again, their last completed visit is still the bust, so the strip renders red for their **entire next turn** — a false "Überworfen" signal while they throw fresh darts.
**Fix:** Drive the bust styling from the pending-correction data (the just-completed visit passed to `CorrectionWindow`) — e.g., lift `pendingCorrection.isBust` into a prop for `VisitStrip` — or clear the styling once `currentVisit.length > 0`.

### WR-06: Darts-at-double dialog shown for single-out finishes; no cancel path

**File:** `src/routes/match/+page.svelte:108-129` and `src/ui/input/DartsAtDoubleDialog.svelte`
**Issue:** `handleNumpadVisit` defers every leg-winning numpad finish to the "Wie viele Darts auf die Doppel?" dialog without checking `config.outRule`. In single-out mode the question is meaningless (no double is required to finish) and the answer pollutes `dartsAtDouble`. Additionally, the dialog is modal with no cancel/back affordance: if the user mistyped a total that happens to equal the remaining score, they are forced to confirm a leg win and then undo it.
**Fix:** Dispatch immediately with `dartsAtDouble: 0` when `matchStore.state.config.outRule === 'single'`. Add an "Abbrechen" action to the sheet that clears `pendingNumpadTotal`/`showDartsAtDouble` without dispatching.

### WR-07: Bull-off drag-to-reorder is broken on touch devices (the primary platform)

**File:** `src/ui/setup/BullOffOrder.svelte:76-119,159-165`
**Issue:** Two compounding defects: (1) On touch, `pointerdown` triggers *implicit pointer capture* on the originating element, so all subsequent pointer events target that element — `onpointerenter` on sibling cards never fires, `dragOverId` stays `null`, and the drop in `onUp` does nothing. The card has `touch-action: none`, so the gesture is consumed with zero effect. (2) After a drag (mouse or touch), the browser still fires `click` on the card; by then `onUp` has already reset `isDragging = false`, so the `if (isDragging) return` guard in `handleTap` fails — the drag is followed by an unintended tap that enters tap-sequence mode and **rebuilds `order` from `initialPlayers`, discarding the drag result**. Net effect: drag-reorder does not work on Android tablets, and with a mouse the result is corrupted by the trailing click.
**Fix:** Call `(e.target as Element).releasePointerCapture(e.pointerId)` in `onPointerDown` (or compute the drag-over card from `pointermove` coordinates via `document.elementFromPoint`), and suppress the post-drag click — e.g., keep a `didDrag` flag that `handleTap` checks and that is cleared on the next tick rather than synchronously in `onUp`.

## Info

### IN-01: `dartsUsed` is accepted, logged, and never used; dialog conflates dartsUsed with dartsAtDouble

**File:** `src/engine/reducer.ts:202` / `src/ui/input/DartsAtDoubleDialog.svelte:22-27`
**Issue:** The reducer destructures `dartsUsed = 3` and never reads it — the finishing `Visit` does not record how many darts the finish took. Meanwhile `DartsAtDoubleDialog.select()` calls `onconfirm(darts, darts)`, writing the darts-at-double answer into the event log's `dartsUsed` field (a player finishing 60 with S20·S20·D10 answers "1" → log says `dartsUsed: 1`, which is false). Phase 4 averages computed from the log will be wrong if the field is trusted.
**Fix:** Either record `dartsUsed` on the finishing `Visit` and collect it separately, or drop the field from the action until Phase 4 defines it.

### IN-02: Phase value `'leg-complete'` is declared but never produced

**File:** `src/engine/types.ts:42`, `src/routes/match/+page.svelte:97`
**Issue:** No reducer path ever sets `phase: 'leg-complete'` (leg wins go straight back to `'playing'`). The comment in `+page.svelte` ("We detect this by watching for phase 'leg-complete'") describes a mechanism that does not exist — actual detection uses `prevRemaining === total`. Dead union member plus a misleading comment.
**Fix:** Remove `'leg-complete'` from the union (or implement it), and update the stale comment.

### IN-03: `ensureDbOpen` is exported but never called

**File:** `src/db/db.ts:34-43`
**Issue:** The defensive open helper (T-01-02 rationale) has no callers; the app relies on Dexie's implicit open plus the try/catch in `profiles.ts`. Dead code that claims a safety property nothing exercises.
**Fix:** Call it from layout/setup initialization (and surface a "Profile nicht verfügbar" hint on `false`), or delete it.

### IN-04: Dartboard miss tap has no visual flash; rapid taps cut the flash short

**File:** `src/ui/input/Dartboard.svelte:145-156,210-217`
**Issue:** `flashKey = 'miss'` has no corresponding element — neither the background circle nor the miss-zone path binds its fill to `flashKey === 'miss'`, so a registered miss gives zero visual feedback. Also, each tap schedules `setTimeout(() => flashKey = null, 300)` without cancelling the previous one; a second tap within 300 ms has its flash cleared early by the first tap's stale timer.
**Fix:** Bind the miss-zone fill to the flash state (e.g., faint white ring), and store the timeout id so a new tap clears the pending one before scheduling.

### IN-05: English labels "Bull"/"Outer Bull" in the German UI; stale CorrectionWindow comment

**File:** `src/ui/input/VisitStrip.svelte:11-12`, `src/ui/input/CorrectionWindow.svelte:6,35-36`
**Issue:** The project constraint is "German UI throughout"; dart labels render "Outer Bull". Additionally the CorrectionWindow header comment claims "turn does NOT pass before window dismisses (Pitfall 5)" — false: the reducer passes the turn immediately when the visit finalizes; `CONFIRM_VISIT` is a no-op and the dartboard stays interactive for the next player while the window is open.
**Fix:** Use German labels (e.g., "Bull" / "25" or "Außen-Bull") and correct the comment to describe the actual no-op semantics.

### IN-06: Checkout suggestions missing for several single-out scores

**File:** `src/engine/checkout.ts:196-205`
**Issue:** In single-out mode, `getSuggestion` returns `null` for 1 (S1 finish), for the bogey entries 159/162/165/168 (scoreable in single-out, e.g., 159 = T20 T19 T14), and for 171/174/177 (e.g., 174 = T20 T20 T18) — all real single-out finishes. D-12 says "single-out → any score with a route returns that route", which the double-out-shaped table cannot satisfy.
**Fix:** Add a small single-out override map consulted when `outRule === 'single'`, or document the accepted gap.

### IN-07: e2e helper has identical if/else branches — dead `assertOverlay` option

**File:** `e2e/full-match-flow.spec.ts:63-81`
**Issue:** Both branches of `if (opts.assertOverlay)` perform the same three steps (assert visible, JS-click, assert hidden). The option and the comment distinguishing "first visit" from "subsequent visits" are dead weight.
**Fix:** Collapse to a single unconditional block and drop the `opts` parameter.

### IN-08: Vacuous reducer test — "restores remaining after undoing a dart"

**File:** `src/engine/reducer.test.ts:324-331`
**Issue:** Comments claim `remaining` is 441 after one dart, but the reducer only commits `remaining` at visit end — it is 501 before and after, so the assertion (`501 === 501`) passes even if UNDO were a no-op. The test does not verify what its name claims (mid-visit dart undo is covered by the `currentVisit` test and committed undo by the store test, but this test guards nothing).
**Fix:** Assert on `currentVisit`/live total, or complete a 3-dart visit before undoing; fix the comments.

### IN-09: Bull-off cards announce "Position null" in tap mode

**File:** `src/ui/setup/BullOffOrder.svelte:153,164`
**Issue:** When `tapSequence` is non-empty, untapped players get `pos = tapPosition(id)` → `null`; the position badge renders empty and the template literal `aria-label` becomes the literal string "Spieler X, Position null".
**Fix:** Fall back to a placeholder: `tapPosition(player.id) ?? '–'` and omit the position from the aria-label when unsequenced.

### IN-10: `sessionStorage.setItem` unguarded in MatchSetup

**File:** `src/ui/setup/MatchSetup.svelte:36-40`
**Issue:** `loadPending` in BullOffOrder is wrapped in try/catch, but the corresponding write in `handleStart` is not. In storage-restricted contexts `setItem` throws, aborting `handleStart` before `goto` — the start button appears dead with no message.
**Fix:** Wrap the `setItem` in try/catch; on failure either still navigate (BullOffOrder's empty-state path redirects back) or show a hint.

### IN-11: `dartsAtDouble` always recorded as 0 for board-entered visits

**File:** `src/engine/reducer.ts:136-139,157,171`
**Issue:** Bust, winning, and normal board visits all hardcode `dartsAtDouble: 0` even though the dart sequence is fully recorded. Acceptable for Phase 1 (D-08 scopes the prompt to numpad, and the value is derivable from the event log by computing remaining-before-each-dart), but Phase 4 checkout-percentage stats must derive it rather than trust the stored field.
**Fix:** Add a comment on the `Visit` type / reducer noting `dartsAtDouble` is authoritative only for numpad finishing visits.

---

_Reviewed: 2026-06-11T12:01:36Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
