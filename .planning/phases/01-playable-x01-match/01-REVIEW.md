---
phase: 01-playable-x01-match
reviewed: 2026-06-10T00:00:00Z
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
  critical: 9
  warning: 8
  info: 8
  total: 25
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-10
**Depth:** standard
**Files Reviewed:** 44
**Status:** issues_found

## Summary

The pure engine layer (bust rules, rotation, checkout table) is largely solid — the checkout table was programmatically verified (all 170 entries sum correctly, all end on a double/Bull, no duplicate keys, no gaps 2–170). However, the UI wiring layer contains several broken integrations that unit tests cannot catch and that the E2E test actively masks with conditional dismissals: the correction window never dismisses and only fires once per match, the darts-at-double dialog is dead code, the dartboard's double ring is clipped outside the SVG viewBox (doubles cannot be tapped), the impossible-score validation is missing two values (verified by brute force), and ProfileManager is never mounted in any route so profiles cannot be created at all. Several undo-correctness defects exist around `CONFIRM_VISIT` and the cross-match event log.

## Critical Issues

### CR-01: Dartboard geometry extends far beyond the SVG viewBox — double ring is invisible and untappable

**File:** `src/ui/input/Dartboard.svelte:163` (also documented inconsistently in `src/engine/board.ts:5`)
**Issue:** The SVG declares `viewBox="0 0 400 400"` with board centre at (200, 200), but the ring radii go to `R_DOUBLE_END = 325`, `R_MISS_OUTER = 390`, and number labels at `R_LABEL = 345`. The maximum radius that fits inside the viewBox is 200 on the axes (~283 in the corners). The entire double ring (r = 303–325), most of the outer single ring, the miss zone, and all 20 segment number labels lie outside the viewBox and are clipped (default `overflow: hidden` on the root `<svg>`). A user physically cannot tap a double — the pointer can never be over user-space coordinates beyond the viewBox mapping — which makes every double-out leg unfinishable via the board. The browser tests pass only because they dispatch synthetic `PointerEvent`s directly on the `<svg>` element with computed `clientX/clientY`, bypassing real hit-testing (see `Dartboard.test.ts:64-67`, whose own comment notes the target "exceeds the half-width").
**Fix:**
```svelte
<!-- Board extent is centre (200,200) ± 390 → user-space -190..590 -->
<svg viewBox="-190 -190 780 780" ...>
```
This keeps `board.ts` centre/radius math (`screenToBoard` centre 200,200) unchanged. Alternatively scale all radii so `R_MISS_OUTER ≤ 200` and keep the 400×400 viewBox — but then `board.ts`, `Dartboard.svelte`, and the tests must all change consistently.

### CR-02: `IMPOSSIBLE_3DART` is missing 163 and 166 — impossible visit totals are accepted

**File:** `src/engine/impossible-scores.ts:11-13`
**Issue:** The canonical set of 3-dart totals that cannot be scored is {163, 166, 169, 172, 173, 175, 176, 178, 179} (verified in this review by brute-forcing all dart-value triples). The implemented set omits **163** and **166**, so `isValidVisitTotal(163)` and `isValidVisitTotal(166)` return `true`. Both the Numpad UI (`Numpad.svelte:26`) and the reducer (`reducer.ts:193`) will accept a physically impossible visit, corrupting match state relative to reality. The unit tests (`impossible-scores.test.ts:74-80`) encode the same incomplete list, so they pass while wrong.
**Fix:**
```ts
export const IMPOSSIBLE_3DART = new Set<number>([
	163, 166, 169, 172, 173, 175, 176, 178, 179
]);
```
Update `impossible-scores.test.ts` to expect all 9 values.

### CR-03: CorrectionWindow never dismisses — no dismiss callback wired to parent

**File:** `src/ui/input/CorrectionWindow.svelte:54-57`, `src/routes/match/+page.svelte:95-98,153-160`
**Issue:** When the 2.5 s timer fires (or the user taps outside), `CorrectionWindow.confirm()` dispatches `CONFIRM_VISIT` but has no way to tell the parent to hide it. The parent renders it whenever `pendingCorrection !== null`, and the only function that clears `pendingCorrection` — `dismissCorrection()` at `match/+page.svelte:95` — is **never called by anything** (dead code; the component accepts no `ondismiss` prop). Once shown, the overlay permanently covers the visit strip, the undo button, and the board/numpad toggle for the rest of the match. The E2E test does not catch this because it only conditionally clicks the overlay and never asserts it disappears (`e2e/full-match-flow.spec.ts:63-66`).
**Fix:** Add an `ondismiss` callback prop to `CorrectionWindow` and invoke it in `confirm()`; pass `dismissCorrection` from the parent:
```svelte
let { visible, visitDarts, isBust, visitTotal, ondismiss }: Props = $props();
function confirm() {
	stopTimer();
	matchStore.dispatch({ type: 'CONFIRM_VISIT' });
	ondismiss();
}
```
```svelte
<CorrectionWindow ... ondismiss={dismissCorrection} />
```
(Then remove the duplicate `CONFIRM_VISIT` dispatch from `dismissCorrection`, see WR-01.)

### CR-04: Correction window appears only for the first visit of the match — counter compares per-player count to global count

**File:** `src/routes/match/+page.svelte:66-93`
**Issue:** The `$effect` compares each individual player's `visits.length` against a single `lastVisitCount` that is later updated to the **total across all players** (line 89-92). Trace with 2 players: P1's first visit → `1 > 0`, window shows, `lastVisitCount = 1`. P2's first visit → `1 > 1` is false; the fallback sets `lastVisitCount = 2` (total). From then on no individual player's count ever exceeds the cross-player total, so the window never opens again for the entire match. INP-04/D-05 (post-visit correction window) is therefore broken for every visit after the first.
**Fix:** Track per-player counts, or detect a new visit structurally:
```ts
let lastVisitCounts = $state<Record<string, number>>({});
$effect(() => {
	const state = matchStore.state;
	if (state.phase !== 'playing') return;
	for (const player of state.players) {
		const prev = lastVisitCounts[player.id] ?? 0;
		if (player.visits.length > prev) {
			lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
			if (pendingCorrection === null) {
				const lastVisit = player.visits[player.visits.length - 1];
				pendingCorrection = { darts: lastVisit.darts, isBust: lastVisit.bust,
					total: lastVisit.darts.reduce((s, d) => s + d.multiplier * d.segment, 0) };
			}
			return;
		}
	}
});
```
(Also reset the counters on `START_MATCH`/UNDO — counts can decrease after undo, see WR-01.)

### CR-05: DartsAtDoubleDialog can never appear — `handleNumpadVisit` is dead code, Numpad dispatches directly to the store

**File:** `src/routes/match/+page.svelte:107-118`, `src/ui/input/Numpad.svelte:32`
**Issue:** `Numpad.svelte` dispatches `NUMPAD_VISIT` straight to `matchStore` in `pressConfirm()`. The parent's `handleNumpadVisit()` — the only code that sets `showDartsAtDouble = true` — is never called by anything (`<Numpad />` is rendered with no props at `match/+page.svelte:169`). Consequently the darts-at-double dialog (D-08, INP-03) never opens, and `dartsAtDouble`/`dartsUsed` are never recorded in the event log for any finishing numpad visit (the reducer receives the action without those fields, defaulting to 0/3). Additionally, even if wired, `handleDartsAtDoubleConfirm` (line 120-125) discards both arguments without dispatching anything, so the user's answer would still be lost — the comment "Phase 3 persistence will use this value" is wrong because the value exists nowhere after the dialog closes. The E2E test masks this with `if (await dartsDialog.isVisible()...)` (`e2e/full-match-flow.spec.ts:84`).
**Fix:** Give Numpad an `onconfirm(total)` callback prop instead of dispatching directly; route it through `handleNumpadVisit`. For a finishing visit, defer the `NUMPAD_VISIT` dispatch until the dialog confirms, then dispatch `{ type: 'NUMPAD_VISIT', total, dartsUsed, dartsAtDouble }` so the values land in the event log. Also guard the win-detection: dispatch must actually have been accepted (`matchStore.state` changed), not just `prevRemaining === total` — otherwise an invalid total equal to remaining (e.g. 169) shows a false win dialog.

### CR-06: Remaining score and checkout suggestion are stale mid-visit (D-10 violation)

**File:** `src/stores/match.svelte.ts:30-47`, `src/ui/input/ScorePanel.svelte:16`
**Issue:** The reducer intentionally commits `player.remaining` only at visit end (`reducer.ts:8-11`), so during a visit the darts live in `currentVisit`. But `MatchStore.remaining` returns `activePlayer.remaining` (the start-of-visit value) and `suggestion` is computed from it. Result: after the 1st and 2nd dart of a board-input visit, the displayed remaining score does not change and the checkout suggestion is computed for the wrong score. Example: player on 100 hits T20 — the panel still shows 100 and suggests "T20 D20" instead of showing 40 / "D20". The store's own doc comment ("Recomputed on every read — updates after every dart dispatch") and the store test `suggestion recomputes live after each dispatch (D-10)` only exercise numpad visits, where the staleness is invisible.
**Fix:**
```ts
get remaining(): number {
	const base = this.activePlayer?.remaining ?? 0;
	const inVisit = this.state.currentVisit.reduce((s, d) => s + d.multiplier * d.segment, 0);
	return base - inVisit;
}
```
ScorePanel should likewise render the live value for the active player (e.g. use `matchStore.remaining` for the active card).

### CR-07: Event log is never reset on START_MATCH — UNDO at the start of a new match resurrects the previous match

**File:** `src/engine/reducer.ts:53,71-98`
**Issue:** `reduce()` builds `newLog = [...state.eventLog, action]` for `START_MATCH` too, so the log of match #2 begins with the full log of match #1 (the singleton `matchStore` survives navigation; `MatchWinOverlay.newGame()` just navigates to `/setup`). Two consequences: (1) pressing Rückgängig after starting match #2 but before any dart trims the new `START_MATCH` and replays the old log — the state snaps back to match #1's `match-complete` and the old win overlay reappears; (2) the log grows without bound across matches, making every UNDO replay progressively slower and breaking the "event log = one match" assumption Phase 3 persistence will rely on.
**Fix:** In `applyStartMatch`, start a fresh log:
```ts
return { ..., eventLog: [action] };
```

### CR-08: ProfileManager is not mounted anywhere — profiles cannot be created in the app (PROF-01 unreachable)

**File:** `src/ui/setup/ProfileManager.svelte` (entire component), `src/routes/setup/+page.svelte:6`, `src/ui/setup/MatchSetup.svelte`
**Issue:** Grep across `src/` shows `ProfileManager` is imported only by its own test file. No route or component renders it. `PlayerPicker` only lists existing profiles from Dexie — which will always be empty because there is no UI path to create one — so the only usable players are guests. The PROF-01 requirement (create/edit/delete persistent profiles) is implemented and tested but not integrated, making it dead code from the user's perspective.
**Fix:** Mount it in the setup flow, e.g. in `MatchSetup.svelte` below the player picker, or add a profiles section/route reachable from setup:
```svelte
import ProfileManager from './ProfileManager.svelte';
...
<section><ProfileManager /></section>
```

### CR-09: Reloading /bulloff lets the user start a 0-player match → TypeError crash on first dart

**File:** `src/ui/setup/BullOffOrder.svelte:32-43,122-139`, `src/engine/reducer.ts:108-116`
**Issue:** `confirmOrder()` removes `pendingMatch` from sessionStorage. If the user then navigates back to `/bulloff` (browser back button or reload — both normal on tablets), `loadPending()` returns `null`, `order` is `[]`, the screen renders zero player cards but the always-enabled "Spielreihenfolge bestätigen" button still dispatches `START_MATCH` with `players: []`. The match view then renders with `activePlayer === undefined`, and the first board tap crashes: `applyDartThrown` reads `player.remaining` of `undefined` (`reducer.ts:116`). The numpad path crashes identically at `reducer.ts:197`.
**Fix:** In `BullOffOrder`, redirect to setup when there is nothing to order, and disable confirm for empty lists:
```ts
$effect(() => { if (initialPlayers.length === 0) goto(`${base}/setup`); });
```
```svelte
<button class="confirm-btn" disabled={order.length === 0} onclick={confirmOrder}>
```
Defense-in-depth: `applyStartMatch` should return the unchanged state (without logging) when `action.order.length === 0`, and `applyDartThrown`/`applyNumpadVisit` should early-return when `state.players.length === 0`.

## Warnings

### WR-01: CONFIRM_VISIT entries pollute the undo log — first Rückgängig press after a confirmed visit does nothing

**File:** `src/engine/reducer.ts:62-63`, `src/routes/match/+page.svelte:96-97`, `src/ui/input/CorrectionWindow.svelte:54-57`
**Issue:** `CONFIRM_VISIT` is a pure no-op that is still appended to the event log. UNDO trims exactly one log entry, so after a visit is auto-confirmed the first undo press removes the `CONFIRM_VISIT` no-op and visibly changes nothing — the user must press twice to undo one dart. Worse, every outside-click on the (currently stuck, see CR-03) overlay dispatches an additional `CONFIRM_VISIT`, requiring N+1 presses. This silently breaks the D-06 "unlimited undo" contract from the user's point of view.
**Fix:** Either don't log `CONFIRM_VISIT` (`case 'CONFIRM_VISIT': return state;`), or make UNDO skip trailing no-op entries:
```ts
let end = state.eventLog.length - 1;
while (end >= 0 && state.eventLog[end].type === 'CONFIRM_VISIT') end--;
const trimmed = state.eventLog.slice(0, end);
```

### WR-02: Sets mode — every set starts with player 0; set starters never rotate

**File:** `src/engine/reducer.ts:272-283`
**Issue:** After a set win, `const totalLegsCompleted = 0; // reset after set win` hardcodes the next leg/set starter to `legStarterIndex(0, n) === 0`. Because all players' `legsWon` are zeroed at the set boundary, the information needed to alternate set starters is destroyed. Under standard darts rules (and the bull-off-order decision in `rotation.ts:13-16`) the starting player must continue rotating across set boundaries; here player 0 starts every set, a systematic first-throw advantage.
**Fix:** Track total legs played across the match (e.g. a `legsPlayed` counter on `MatchState`, incremented on every leg completion) and derive the starter from it: `legStarterIndex(state.legsPlayed + 1, numPlayers)`.

### WR-03: Numpad silently swallows overshoot and "leaves 1" entries — no feedback, and a bust-by-overshoot cannot be recorded

**File:** `src/engine/reducer.ts:199-203`, `src/ui/input/Numpad.svelte:24-35`
**Issue:** `applyNumpadVisit` returns the unchanged state when `newRemaining < 0` or `newRemaining === 1` (double-out). `Numpad.pressConfirm` only validates `isValidVisitTotal`; when the reducer rejects, the UI still clears the input and shows no error — to the operator it looks accepted, but the turn did not pass and the score did not change. The next entry then lands on the wrong player. Note also that in real X01 an overshoot entered via numpad IS a valid bust (score 0, turn passes); there is no way to record it except knowing to enter `0`.
**Fix:** Surface the rejection: have the UI compare remaining before dispatch (or have the store expose a dispatch result) and show "Überworfen — als Bust werten?" / an error state. Engine-side, consider treating numpad overshoot/leave-1 as a recorded bust visit (score 0, `bust: true`, turn passes) to match physical play.

### WR-04: VisitStrip bust highlight checks the wrong player — never shows at bust time, shows during the buster's next turn

**File:** `src/ui/input/VisitStrip.svelte:24-30,33`
**Issue:** `isBustVisit()` inspects `matchStore.activePlayer`'s last completed visit. But the reducer passes the turn immediately on bust, so at the moment a bust happens the active player is already the **next** player and the red styling does not appear. Instead, when the player who busted becomes active again on their following turn, their last visit is still the bust, so the strip shows red for their entire next visit — wrong time, wrong context.
**Fix:** Derive bust state from the pending correction data (the just-completed visit), e.g. pass `isBust` down from `match/+page.svelte`'s `pendingCorrection`, or check the **previous** player's last visit only while no new dart has been thrown.

### WR-05: Winning and busting board visits always record `dartsAtDouble: 0`, losing checkout statistics

**File:** `src/engine/reducer.ts:124-127,145`
**Issue:** For dartboard input the reducer hardcodes `dartsAtDouble: 0` on both the winning visit (line 145) and bust visits (line 126). A double-out leg win by definition ends with a dart at a double, so the winning visit should record at least 1; with full per-dart data the engine could compute the exact value (count trailing darts thrown while remaining was on a finishable double). Phase 4's checkout-percentage stats will be systematically wrong (0 attempts despite legs won) if this ships into the persisted event log.
**Fix:** Compute darts-at-double from the visit darts and the running remaining: for each dart, count it if the player's remaining before that dart was an even number ≤ 40 or 50 (a "double-able" score) under double-out. At minimum, record 1 for the finishing dart.

### WR-06: Correction window total is computed from `visit.darts` — shows "→ 0" for numpad visits

**File:** `src/routes/match/+page.svelte:74-77`
**Issue:** `pendingCorrection.total` is reduced from `lastVisit.darts`, but numpad visits store `darts: []` (`reducer.ts:223`), so the correction window for a numpad visit would show an empty dart list and a total of 0 instead of the entered score (e.g. 180). Currently hidden behind CR-04, but it becomes user-visible as soon as that is fixed.
**Fix:** Persist the visit total on the `Visit` itself (e.g. add a `score: number` field set by both handlers), or fall back to `player-remaining` delta when `darts` is empty.

### WR-07: BullOffOrder drag-release can be undone by the synthetic click that follows; `pointercancel` not handled

**File:** `src/ui/setup/BullOffOrder.svelte:49-119,154-156`
**Issue:** Two related defects in the hand-rolled drag: (1) `onUp` sets `isDragging = false` **before** the browser fires the `click` event on the same card, so `handleTap`'s `if (isDragging) return` guard never trips; if the user drags >8 px but releases over the original card, the tap handler runs, adds the card to `tapSequence`, and rebuilds `order` from `initialPlayers` — silently discarding any previous drag reordering. (2) `pointercancel` is never handled, so if the OS cancels the gesture (common on Android), `pointerup` may never fire: the `window` `pointermove`/`pointerup` listeners leak and `isDragging` stays `true`, blocking all subsequent taps.
**Fix:** Keep a `wasDragging` flag that `handleTap` checks and that is reset on the next `pointerdown` (or call `e.preventDefault()` + suppress the next click after a drag); register `window.addEventListener('pointercancel', onUp)` alongside `pointerup` and remove it in cleanup.

### WR-08: VisitStrip slot buttons are mislabeled and don't implement the documented multi-undo

**File:** `src/ui/input/VisitStrip.svelte:4,36-43`
**Issue:** The component comment promises "tapping an earlier slot undoes back to it", but every slot dispatches exactly one `UNDO`. Worse, the `aria-label` on each slot claims `Rückgängig: <that slot's dart>` — tapping the slot showing the *first* dart announces it will undo that dart but actually removes the *last* dart. Screen-reader and sighted users alike are told one thing and get another.
**Fix:** Either implement the documented behavior (dispatch `UNDO` `currentVisit.length - slotIdx` times) or label every slot honestly (`aria-label="Letzten Dart rückgängig machen"`) and update the comment.

## Info

### IN-01: E2E test conditionally dismisses overlays, masking CR-03 and CR-05

**File:** `e2e/full-match-flow.spec.ts:63-68,83-86`
**Issue:** `if (await overlay.isVisible()...)` and `if (await dartsDialog.isVisible()...)` make the test pass whether or not the correction window dismisses and whether or not the darts-at-double dialog appears. The happy path silently tolerates two broken features.
**Fix:** Assert the expected behavior: after a visit, `await expect(overlay).toBeVisible()` then `await expect(overlay).toBeHidden()` after dismissal; after the finishing numpad visit, `await expect(dartsDialog).toBeVisible()` unconditionally.

### IN-02: Dead/unused code in the match route

**File:** `src/routes/match/+page.svelte:63,95-98,103-125`
**Issue:** `lastActiveIdx` is written but never read; `dismissCorrection` is never called (CR-03); `handleNumpadVisit`, `pendingNumpadTotal`, `showDartsAtDouble`, and `handleDartsAtDoubleConfirm`'s parameters are dead until CR-05 wiring is fixed.
**Fix:** Remove `lastActiveIdx`; the rest is resolved by fixing CR-03/CR-05.

### IN-03: `dartsUsed` is destructured and discarded in `applyNumpadVisit`; `Visit` has no dart count

**File:** `src/engine/reducer.ts:190`, `src/engine/types.ts:12-16`
**Issue:** `dartsUsed` never influences the produced state, and `Visit` has no field for it, so a 1-dart finish and a 3-dart finish are indistinguishable in match data — Phase 4's 3-dart-average cannot be computed correctly for finishing numpad visits.
**Fix:** Add `dartsUsed?: number` (or `score`) to `Visit` and populate it from the action.

### IN-04: `phase: 'leg-complete'` is declared but never produced by the reducer

**File:** `src/engine/types.ts:42`, `src/engine/reducer.ts:241-314`
**Issue:** The reducer transitions straight from `playing` to `playing` (next leg) or `match-complete`; nothing ever sets `leg-complete`. The comment at `match/+page.svelte:102` ("watching for phase 'leg-complete'") references a state that cannot occur. Dead state value invites future logic written against it.
**Fix:** Remove the value from the union, or actually enter it between legs (which would also give the UI a natural hook for a leg-win interstitial).

### IN-05: Single-out checkout suggestions are wrong/missing for several finishable scores

**File:** `src/engine/checkout.ts:178-205`
**Issue:** In single-out mode, `getSuggestion` returns `null` for 159/162/163/165/166/168/169 (double-out bogeys, but trivially finishable single-out, e.g. 159 = T20 T20 T13), for 171–179, and for 1 (S1). Routes that are returned are double-out oriented (e.g. 2 → "D1" instead of "S2"). Cosmetic for the German home-play use case, but the D-12 comment "single-out → any score with a route returns that route" overpromises.
**Fix:** Either document the limitation or add a single-out branch that falls back to simple greedy routes.

### IN-06: English ring names in the German UI; dead format branch

**File:** `src/ui/input/VisitStrip.svelte:11-12`, `src/ui/input/CorrectionWindow.svelte:30-31`
**Issue:** Labels "Bull"/"Outer Bull" are English while the project mandates German UI throughout ("Daneben" is already German). Also `VisitStrip.formatDart` line 11 handles `segment === 50 && multiplier !== 2` with the label "Outer Bull" — a combination `classifyHit` can never produce, and the label would be wrong if it did.
**Fix:** Use consistent German labels (e.g. "Bull"/"25" are common German darts terms — pick one convention) and delete the impossible branch.

### IN-07: `createProfile` initial derivation breaks on surrogate-pair characters

**File:** `src/db/profiles.ts:21,39`
**Issue:** `trimmed[0]` takes a single UTF-16 code unit; a name starting with an emoji or other astral-plane character yields a broken half-surrogate as the avatar initial.
**Fix:** `Array.from(trimmed)[0].toUpperCase()` (or `trimmed.codePointAt`-based slicing).

### IN-08: Root redirect runs in `$effect` after first paint

**File:** `src/routes/+page.svelte:6-8`
**Issue:** The redirect to `/setup` happens post-mount inside `$effect`, briefly flashing "Weiterleitung …" and adding a history entry; SvelteKit's idiomatic mechanism is a `redirect(307, ...)` in a `+page.ts` `load` (works with `ssr=false` + prerender via client-side load), or at minimum `goto` with `{ replaceState: true }` so Back doesn't bounce.
**Fix:** Move the redirect into `src/routes/+page.ts` `load` using `redirect`, or pass `replaceState: true`.

---

_Reviewed: 2026-06-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
