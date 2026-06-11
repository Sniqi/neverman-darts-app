---
phase: 01-playable-x01-match
reviewed: 2026-06-11T00:15:47Z
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
  critical: 1
  warning: 11
  info: 10
  total: 22
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-06-11T00:15:47Z
**Depth:** standard
**Files Reviewed:** 44
**Status:** issues_found

## Summary

Second-round review of the complete Phase 01 implementation (X01 engine, runes store, scoring UI, setup flow, profiles/Dexie layer, tests, E2E spec), with specific attention to regressions from gap plans 01-10..01-12. The pure engine (bust detection, checkout table arithmetic, impossible totals, rotation, reducer immutability/undo) is solid — checkout-table sums were spot-verified and are correct, and the inner-bull `{multiplier:2, segment:25}` encoding is consistently applied in `bust.ts`, `board.ts`, `VisitStrip`, and `CorrectionWindow`.

However, two of the recent gap fixes introduced regressions: (1) the numpad-finish deferral breaks the E2E happy path — the test never confirms the now-mandatory darts-at-double dialog, so the match never completes and the win-overlay assertion cannot pass; (2) the inner-bull re-encoding left dead `segment === 50` flash logic in `Dartboard.svelte`, so inner-bull taps flash the outer bull. Additional defects cluster around sets-mode leg-starter logic, the hand-rolled drag reorder (non-functional on touch, corrupted by the post-drag click on desktop), silent rejection of invalid numpad input, and stale per-player visit counters after UNDO.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: E2E happy path cannot pass — finishing numpad visit is deferred behind the darts-at-double dialog, which the test never confirms

**File:** `e2e/full-match-flow.spec.ts:89-101`, `src/routes/match/+page.svelte:103-130`
**Issue:** `handleNumpadVisit` treats every `prevRemaining === total` entry as a finish and defers the `NUMPAD_VISIT` dispatch until `DartsAtDoubleDialog` is confirmed — with no distinction between leg-winning and match-winning visits. The E2E test enters the final `16`, never clicks a dialog option, then asserts `getByRole('heading', { name: /gewinnt!/ })`. Since the deferred dispatch never happens, `matchStore.isMatchComplete` stays false, `MatchWinOverlay` never renders, and the assertion times out. The test comment ("The darts-at-double dialog is suppressed for match-winning visits (win overlay takes over)") describes behavior that does not exist anywhere in the code. This is a regression introduced by the gap fix that moved the finish dispatch behind the dialog: either the E2E suite is currently red, or it was never re-run after that fix.
**Fix:** Make the test confirm the dialog after the final `Bestätigen`:
```ts
// Darts-at-double dialog appears for the finishing visit — confirm it
await page.getByRole('button', { name: '1 Dart' }).click();
// Now the win overlay appears
await expect(page.getByRole('heading', { name: /gewinnt!/ })).toBeVisible();
```
Alternatively, if the suppression described in the comment is the intended UX, implement it in `handleNumpadVisit` — but the dialog is the only place `dartsAtDouble` is captured, so confirming in the test is the better fix. Either way, run the E2E suite and remove the stale comment.

## Warnings

### WR-01: Sets mode — leg starter resets to player 0 after every set win

**File:** `src/engine/reducer.ts:284-295`
**Issue:** In `handleLegWinFromPlayers`, after a set win (but not match win) the code hardcodes `const totalLegsCompleted = 0;`, so `legStarterIndex(0, n)` always returns 0. Player 0 (the bull-off winner) starts the first leg of every set, regardless of how many legs have been played. Standard darts rules continue the starter rotation across set boundaries. Additionally, because `legsWon` is reset to 0 for all players on a set win, leg counting within the next set (derived from `players.reduce(sum of legsWon)` at line 311) also restarts from 0 — and that same derivation undercounts whenever any reset has occurred. Player 0 gets a systematic first-throw advantage in every set.
**Fix:** Track total legs completed across the whole match instead of deriving it from per-set `legsWon` — e.g. add a `legsCompleted` counter to `MatchState`, incremented on every leg win and never reset:
```ts
const nextLegStarter = legStarterIndex(state.legsCompleted + 1, numPlayers);
```

### WR-02: Inner-bull tap flashes the outer bull — dead `segment === 50` branch left behind by the encoding fix

**File:** `src/ui/input/Dartboard.svelte:143-152`
**Issue:** `classifyHit` now returns `{ multiplier: 2, segment: 25 }` for the inner bull (gap fix 01-10), but the flash logic still checks `dart.segment === 50` first — which can never be true — and then `dart.segment === 25` sets `flashKey = 'outer-bull'` for both bulls. Tapping the inner bull visually highlights the outer bull ring; the `'inner-bull'` flash branch is unreachable dead code. Scoring is unaffected (the regression is visual feedback only), but flash confirmation of the hit region is the primary input-accuracy affordance on a touch board.
**Fix:**
```ts
if (dart.segment === 0) {
	flashKey = 'miss';
} else if (dart.segment === 25 && dart.multiplier === 2) {
	flashKey = 'inner-bull';
} else if (dart.segment === 25) {
	flashKey = 'outer-bull';
} else { /* unchanged */ }
```

### WR-03: BullOffOrder drag-to-reorder is broken on touch and corrupted by the post-drag click on desktop

**File:** `src/ui/setup/BullOffOrder.svelte:76-119, 159-165`
**Issue:** Two related defects in the hand-rolled drag:
1. **Touch (the primary platform):** `pointerdown` from touch implicitly captures the pointer to the originating element, so `pointerenter` never fires on sibling cards during the drag — `dragOverId` stays `null` and `onUp` performs no reorder. Drag-to-reorder is non-functional on Android tablets.
2. **Desktop:** after a completed mouse drag, the browser still fires `click` on the source card. `onUp` has already set `isDragging = false`, so `handleTap`'s `if (isDragging) return` guard does not trip. The tap handler adds the dragged player to `tapSequence` and rebuilds `order` from `initialPlayers`, silently discarding the reorder the user just performed (and marking the card as tap position 1).
**Fix:** (1) Call `(e.target as Element).releasePointerCapture(e.pointerId)` in `onPointerDown`, or compute `dragOverId` via `document.elementFromPoint` in `onMove`. (2) Suppress the click that follows a drag:
```ts
let suppressClick = false;
function onUp() {
	if (isDragging) { suppressClick = true; setTimeout(() => (suppressClick = false), 0); }
	// ...existing logic
}
function handleTap(id: string) {
	if (isDragging || suppressClick) return;
	// ...
}
```

### WR-04: Invalid numpad visits (overshoot / leaving 1 in double-out) are silently swallowed — input clears with no feedback

**File:** `src/ui/input/Numpad.svelte:30-41`, `src/engine/reducer.ts:209-215`, `src/routes/match/+page.svelte:113-116`
**Issue:** `Numpad.pressConfirm` only validates `isValidVisitTotal`. Overshoot (`total > remaining`) and "leaves 1 in double-out" pass that check, get dispatched, and the reducer rejects them by returning the unchanged state. The numpad then clears `inputValue` and shows no error. To the scorer it looks exactly like a successfully recorded visit — the score simply doesn't change, which during fast play will cause missed or doubled entries.
**Fix:** Validate against the active player's remaining before dispatching (pass `remaining`/`outRule` into Numpad as props, or do the check in `handleNumpadVisit` with an error callback), reusing the existing shake/error UI:
```ts
const newRemaining = remaining - total;
if (newRemaining < 0 || (newRemaining === 1 && outRule === 'double')) {
	isInvalid = true; shaking = true; setTimeout(() => (shaking = false), 400);
	return;
}
```

### WR-05: VisitStrip bust highlight evaluates the wrong player

**File:** `src/ui/input/VisitStrip.svelte:24-33`
**Issue:** `isBustVisit()` checks the last visit of `matchStore.activePlayer`. But when a bust occurs, the reducer immediately passes the turn — so by the time the UI renders, the active player is the *next* player. Consequences: (a) the red bust flash never shows for the player who just busted; (b) it *does* show whenever a player whose own previous visit (one full rotation ago) was a bust becomes active — a misleading red strip at the start of an unrelated turn.
**Fix:** Drive bust styling from the just-completed visit the parent already tracks (`pendingCorrection.isBust` in `match/+page.svelte`) by passing it as a prop, or check the previous player: `state.players[(activePlayerIndex + n - 1) % n]`.

### WR-06: Toggling board → numpad mid-visit silently discards thrown darts

**File:** `src/routes/match/+page.svelte:42-47, 103-117`, `src/engine/reducer.ts:195-249`
**Issue:** The input-mode toggle is always enabled. If a player has 1–2 darts in `currentVisit` (board mode) and the scorer switches to numpad and confirms a total, `applyNumpadVisit` ignores `currentVisit` entirely: it subtracts `total` from the start-of-visit `remaining` and resets `currentVisit: []`. The darts already entered vanish without a trace, and the live remaining (which had been showing the mid-visit subtraction) jumps. `handleNumpadVisit`'s `isFinish` check likewise uses the committed remaining, ignoring pending board darts.
**Fix:** Disable the toggle while a board visit is in progress:
```svelte
<button class="toggle-btn" disabled={matchStore.currentVisit.length > 0} ...>
```

### WR-07: Correction window stops appearing after UNDO — `lastVisitCounts` is never decremented

**File:** `src/routes/match/+page.svelte:61-86`
**Issue:** The completed-visit detector compares `player.visits.length > lastVisitCounts[player.id]`. UNDO replays the log and *reduces* `visits.length`, but `lastVisitCounts` keeps the stale higher value. When the player re-completes the visit, `visits.length` equals (does not exceed) the stale count, so the correction window never fires for the corrected visit — precisely the visit the scorer most wants to verify (D-05 degraded for every post-undo visit).
**Fix:** Clamp stale counts inside the effect:
```ts
if (player.visits.length < prevCount) {
	lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
}
```

### WR-08: CorrectionWindow paused flow — the "Rückgängig" button it points to is covered by the overlay, and the first tap dismisses instead of undoing

**File:** `src/ui/input/CorrectionWindow.svelte:71-73, 117-126`, `src/routes/match/+page.svelte:144-167`
**Issue:** When paused, the window shows "Verwende Rückgängig zum Bearbeiten" — but the overlay (`inset: 0` over `.panel-relative`, which contains the undo bar) sits on top of the Rückgängig button. Tapping the button hits the overlay instead, triggering `handleOutsideClick()` → `confirm()` → window dismissed without undoing; the user's first tap is silently consumed and they must tap again after the window closes. Additionally, the header comment "turn does NOT pass before window dismisses (Pitfall 5)" is false — the reducer already advanced `activePlayerIndex` when the visit completed; `CONFIRM_VISIT` is a no-op.
**Fix:** Render a "Rückgängig" button inside the correction window's `.window` element (dispatching `UNDO` and dismissing), or exclude the undo bar from the overlay's covered area. Update or remove the stale Pitfall-5 comment.

### WR-09: Board-input visits always record `dartsAtDouble: 0` — checkout-statistics data is permanently wrong for board-entered legs

**File:** `src/engine/reducer.ts:135-139, 157, 171`
**Issue:** All three `applyDartThrown` visit-construction sites hardcode `dartsAtDouble: 0`, including the leg-winning visit. A double-out finish by definition includes at least one dart at a double (the finishing dart), so every board-entered winning visit stores provably false data in the `Visit` record that Phase 4 stats (checkout percentage) will consume. Unlike the numpad path there is no dialog — but for board input the value is *computable*: a dart was "at double" iff the remaining before it was an even number ≤ 40 or exactly 50.
**Fix:** Compute it in `applyDartThrown` (double-out only):
```ts
function countDartsAtDouble(startRemaining: number, darts: DartScore[]): number {
	let rem = startRemaining, count = 0;
	for (const d of darts) {
		if ((rem <= 40 && rem % 2 === 0) || rem === 50) count++;
		rem -= d.multiplier * d.segment;
	}
	return count;
}
```

### WR-10: Numpad path accepts impossible double-out finishes (159, 162, 165, 168) as leg wins

**File:** `src/engine/reducer.ts:204-232`
**Issue:** `applyNumpadVisit` enforces "leaves 1 is invalid" in double-out but accepts any `newRemaining === 0` as a win. Totals 159, 162, 165 and 168 are scoreable in 3 darts (so they pass `isValidVisitTotal`) but cannot be finished ending on a double — the checkout table itself marks them `null` as bogey numbers. A player on 162 whose scorer enters 162 is awarded a leg that is impossible under double-out rules. This is inconsistent with the leaves-1 enforcement a few lines above.
**Fix:** Reject bogey finishes in the double-out finish path:
```ts
const DOUBLE_OUT_BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);
if (newRemaining === 0 && state.config.outRule === 'double' && DOUBLE_OUT_BOGEY.has(total)) return state;
```
(163/166/169 are already caught by `isValidVisitTotal`; including them keeps the rule self-documenting.)

### WR-11: `updateProfile` accepts an empty/whitespace name, unlike `createProfile`

**File:** `src/db/profiles.ts:31-42`
**Issue:** `createProfile` throws on empty names, but `updateProfile` writes `name: ''` and `initial: ''` when passed whitespace (`trimmed[0]?.toUpperCase() ?? ''`). The UI (`ProfileManager.saveEdit`) guards this today, but this module is explicitly the defensive wrapper layer ("Wraps all DB access…") and Phases 3-4 will reuse it. A nameless profile breaks `PlayerPicker` rendering (empty `initial`) and name-based sorting.
**Fix:** Mirror the create validation:
```ts
if (patch.name !== undefined) {
	const trimmed = patch.name.trim();
	if (!trimmed) throw new Error('Profile name cannot be empty');
	update.name = trimmed;
	update.initial = trimmed[0].toUpperCase();
}
```

## Info

### IN-01: `phase: 'leg-complete'` is declared but never produced — dead state, plus stale comment referencing it

**File:** `src/engine/types.ts:42`, `src/routes/match/+page.svelte:94-96`
**Issue:** The reducer never enters `'leg-complete'` (leg wins go straight back to `'playing'` or to `'match-complete'`). The match-page comment "We detect this by watching for phase 'leg-complete' after a NUMPAD_VISIT" describes a mechanism that does not exist (actual detection is `prevRemaining === total`).
**Fix:** Remove the unused phase value or document it as reserved; correct the comment.

### IN-02: `dartsUsed` is destructured but never used in the reducer — finishing visits lose their dart count

**File:** `src/engine/reducer.ts:202`
**Issue:** `dartsUsed` is accepted in the action and supplied by the dialog, but the `Visit` record stores `darts: []` with no count. Phase 4 per-dart averages for numpad legs must re-derive it from the event log. At minimum it is an unused variable today.
**Fix:** Persist it on the `Visit` (or remove it from the destructure and document that stats replay the event log).

### IN-03: DartsAtDoubleDialog shown for single-out finishes; `pendingTotal` prop unused; no cancel affordance

**File:** `src/ui/input/DartsAtDoubleDialog.svelte`, `src/routes/match/+page.svelte:107-117`
**Issue:** (a) `handleNumpadVisit` defers every finish behind the dialog even when `outRule === 'single'`, where "Wie viele Darts auf die Doppel?" is meaningless and records bogus `dartsAtDouble > 0`. (b) The `pendingTotal` prop is accepted but never rendered. (c) The dialog cannot be cancelled — a mis-entered finishing total forces the scorer to pick an option and then undo.
**Fix:** Skip the dialog for single-out (dispatch immediately with `dartsAtDouble: 0`); drop or display `pendingTotal`; consider an "Abbrechen" action that clears `pendingNumpadTotal` without dispatching.

### IN-04: Unguarded non-null assertion `pendingNumpadTotal!` in the dialog confirm handler

**File:** `src/routes/match/+page.svelte:122-127`
**Issue:** A double-fired confirm (fast double-tap before the dialog unmounts) would dispatch `total: null` on the second call; `isValidVisitTotal(null)` evaluates to `true` (`null < 0` and `null > 180` are both false, `Set.has(null)` is false) and `remaining - null` coerces to `remaining - 0`, recording a spurious 0-score visit and passing the turn.
**Fix:** `if (pendingNumpadTotal === null) return;` at the top of `handleDartsAtDoubleConfirm`.

### IN-05: No visual feedback for miss taps; entire SVG box (including corners beyond the board edge) registers a miss

**File:** `src/ui/input/Dartboard.svelte:143-156, 161-172`
**Issue:** `flashKey = 'miss'` matches no rendered element, so miss taps give zero visual confirmation. Also, because `onpointerdown` is on the `<svg>` root, taps anywhere in the element's CSS box — including corners outside the drawn 390-radius board background — dispatch a miss dart. Accidental edge touches while handling the tablet will score misses.
**Fix:** Flash the background circle for misses; optionally ignore taps with `r > R_MISS_OUTER`.

### IN-06: `acquireWakeLock` can orphan a previously held sentinel

**File:** `src/lib/wake-lock.svelte.ts:12-20`
**Issue:** Calling `acquireWakeLock` while a sentinel is already held overwrites `sentinel` without releasing the old one, losing the only reference. In practice the visibility handler only re-acquires after the UA auto-released the old lock, so impact is minimal.
**Fix:** `if (sentinel && !sentinel.released) return;` at the top.

### IN-07: Duplicated sort logic between `listProfiles` and `profilesLive`

**File:** `src/db/profiles.ts:53-60, 67-82`
**Issue:** The `toArray()` + `localeCompare` sort + empty-array fallback block is copy-pasted in both functions.
**Fix:** Extract a shared `async function fetchSorted(): Promise<Profile[]>`.

### IN-08: `enterNumpadVisit` E2E helper has identical if/else branches

**File:** `e2e/full-match-flow.spec.ts:63-81`
**Issue:** The `opts.assertOverlay` true and false branches execute the exact same statements (modulo comments); the option is dead weight.
**Fix:** Delete the branch and the `opts` parameter.

### IN-09: BullOffOrder aria-label reads "Position null" for unsequenced players during tap mode

**File:** `src/ui/setup/BullOffOrder.svelte:153, 164-167`
**Issue:** When `tapSequence` is non-empty, `tapPosition` returns `null` for untapped players; the template-literal aria-label stringifies it as "Position null" and the visible `{pos}` badge renders empty.
**Fix:** `{@const pos = tapSequence.length > 0 ? (tapPosition(player.id) ?? '–') : i + 1}` and adjust the label accordingly.

### IN-10: Single-out checkout suggestions reuse the double-out table

**File:** `src/engine/checkout.ts:196-205`
**Issue:** In single-out mode, `getSuggestion(1, 'single')` returns `null` although S1 finishes; 2 suggests `D1` rather than the simpler S2; scoreable totals 171–179 (e.g. 171 = T20 T20 T17) return null. Behavior is safe (no suggestion is never a wrong suggestion) but underserves single-out games.
**Fix:** Acceptable for v1; consider a single-out lookup (e.g. `['S' + remaining]` for remaining ≤ 20) in a later phase.

---

_Reviewed: 2026-06-11T00:15:47Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
