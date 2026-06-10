---
phase: 01-playable-x01-match
verified: 2026-06-11T00:00:00Z
status: gaps_found
score: 2/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 0/5
  gaps_closed:
    - "SVG viewBox now '-190 -190 780 780', double ring no longer clipped"
    - "CorrectionWindow now has ondismiss prop wired in match/+page.svelte"
    - "Per-player visit tracking fixed (Record<string,number> keyed by player.id)"
    - "START_MATCH resets event log to [action] (CR-07)"
    - "CONFIRM_VISIT returns state unchanged — not appended to log (WR-01)"
    - "ProfileManager mounted in MatchSetup.svelte under collapsible 'Profile verwalten' section"
    - "matchStore.remaining getter subtracts currentVisit scored total (live mid-visit)"
    - "IMPOSSIBLE_3DART now includes 163 and 166"
    - "Numpad now accepts onconfirm prop; dispatches through parent handleNumpadVisit"
  gaps_remaining:
    - "Inner bull scores 100 instead of 50 (board.ts CR-01 new)"
    - "ScorePanel renders player.remaining not matchStore.remaining — stale mid-visit (CR-02 new)"
    - "CorrectionWindow $effect reads elapsed making auto-dismiss never fire (CR-04 new)"
    - "CorrectionWindow 'Korrigieren' paused state is inescapable — overlay blocks undo button (CR-03 new)"
    - "BullOffOrder has no 0-player guard — direct /bulloff navigation starts a 0-player match (CR-05 new)"
  regressions: []
gaps:
  - truth: "Player can enter each dart by tapping the on-screen dartboard (all segments reliably hittable by finger) or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a brief correction window"
    status: failed
    reason: >
      Two compounding defects break this truth.
      (CR-03) 'Korrigieren' sets paused=true and renders a hint overlay that covers the
      VisitStrip and the Rückgängig button — both are inside .panel-relative which the
      overlay fills with position:absolute inset:0 z-index:10. While paused,
      handleOutsideClick does nothing (if (!paused) confirm()), and no dismiss or resume
      button is rendered. The match UI is permanently inaccessible until the window
      auto-dismisses — which it never does because of CR-04.
      (CR-04) CorrectionWindow.$effect calls startTimer(), which reads the $state
      variable elapsed on lines 41 and 43, making elapsed a tracked dependency. Svelte
      re-runs the effect on every rAF tick (~60fps), which calls stopTimer() in the
      cleanup, cancelling the pending setTimeout before it fires, then starts a fresh
      2500ms timer. Auto-dismiss never fires; the progress bar never advances past ~16ms.
      The correction window becomes a permanent blocker after the first 'Korrigieren' press.
    artifacts:
      - path: "src/ui/input/CorrectionWindow.svelte"
        issue: >
          $effect at line 75-86 calls startTimer() at line 79 without untrack().
          startTimer() reads elapsed (lines 41, 43). Svelte tracks elapsed as a
          dependency, re-runs effect every rAF tick, calls stopTimer() in cleanup
          (cancels the timeout), restarts from scratch. Auto-dismiss never fires.
          Additionally, when paused=true, handleOutsideClick is a no-op and no
          dismiss/resume controls are rendered — inescapable dead end.
    missing:
      - "Wrap startTimer() call in $effect with untrack(): untrack(() => startTimer())"
      - "When paused, render an explicit 'Fertig' button calling confirm(), or make outside-click dismiss regardless of paused state"

  - truth: "A bust (all three conditions: score < 0, reaching 1 on double-out, finishing on non-double) reverts the full visit and passes the turn immediately"
    status: failed
    reason: >
      The bust engine logic itself is correct (isBust covers all three conditions, tests
      pass). However inner bull scoring is broken by CR-01: classifyHit returns
      {multiplier:2, segment:50}, so a bull tap subtracts 100 points. isBust(50,
      {m:2,s:50}, 'double') evaluates newRemaining = 50 - 100 = -50, returning true
      (overshoot). A player on 50 following the checkout suggestion 'Bull' causes a
      spurious bust — the visit is reverted and the turn passes even though the player
      legitimately finished. The 'bust' truth is violated: a valid double-out on Bull is
      treated as a bust.
    artifacts:
      - path: "src/engine/board.ts"
        issue: >
          Line 44: classifyHit returns { multiplier: 2, segment: 50 } for inner bull.
          multiplier * segment = 2 * 50 = 100. Should be 50 (Bull = 50 pts).
          Fix: return { multiplier: 2, segment: 25 } (double-bull = 50pts, passes the
          isDouble check in bust.ts). Alternatively { multiplier: 1, segment: 50 } with
          a dedicated bust.ts check for segment===50 as a valid double-out finish.
      - path: "src/engine/bust.ts"
        issue: >
          Line 33-34: isInnerBull = dart.segment === 50. With the current board.ts
          encoding (segment:50), isBust(50, {m:2,s:50}, 'double') computes newRemaining
          = 50 - 100 = -50, hits the newRemaining < 0 branch at line 28 and returns true
          before reaching the isInnerBull check. The isInnerBull guard never fires from
          a classifyHit-generated bull.
      - path: "src/engine/bust.test.ts"
        issue: >
          Lines 54-58: test asserts isBust(100, {m:2,s:50}, 'double') = false, encoding
          the wrong 100-point rule instead of catching it as a domain bug.
    missing:
      - "Fix classifyHit inner bull encoding so multiplier*segment = 50 (e.g. { multiplier:2, segment:25 } or { multiplier:1, segment:50 } with bust.ts update)"
      - "Update bust.test.ts to assert 50-point bull and valid bull finish from remaining=50"
      - "Update board.test.ts to assert correct 50-point encoding"
      - "Remove dead segment===50 branch in bust.ts once encoding is canonical"

  - truth: "Checkout suggestions appear for the next 1-3 darts when a finish is possible; bogey numbers and scores above 170 show no suggestion; the screen stays awake throughout the match"
    status: failed
    reason: >
      Two issues compound: (1) ScorePanel renders {player.remaining} (the committed
      start-of-visit value, not updated until the visit finalizes after dart 3 or bust).
      matchStore.remaining (the live getter that subtracts currentVisit) was correctly
      implemented but ScorePanel.svelte line 16 still reads player.remaining from the
      loop variable. After dart 1 or 2 in a board visit, the large score display and the
      CheckoutSuggestion are inconsistent: CheckoutSuggestion reads matchStore.suggestion
      which uses the live remaining, but the big number above it shows the old value.
      Example: player on 100 hits T20 — ScorePanel shows 100, CheckoutSuggestion shows
      D20 (for 40), contradicting each other.
      (2) CR-01 bull encoding: the checkout table entry '50: [Bull]' will cause a bust
      when followed. Checkout suggestions for any route ending in 'Bull' (170, 167, 164,
      161, 50) are technically wrong — following them crashes the score.
    artifacts:
      - path: "src/ui/input/ScorePanel.svelte"
        issue: >
          Line 16: renders {player.remaining} from the #each loop variable. Should render
          {isActive ? matchStore.remaining : player.remaining} to show live mid-visit
          remaining for the active player.
    missing:
      - "In ScorePanel.svelte line 16: change {player.remaining} to {isActive ? matchStore.remaining : player.remaining}"
      - "Fix CR-01 bull encoding first, so checkout routes ending in 'Bull' produce correct finishes"

  - truth: "Player can configure a 301/401/501 match with Single Out or Double Out, set the number of legs/sets, add 1-4 named or guest players, and enter the bull-off result to set starting order"
    status: failed
    reason: >
      The setup and bull-off flow itself is implemented and reachable. However BullOffOrder
      has no guard when order is empty (CR-05). Direct navigation to /bulloff (browser-back
      after a match removes sessionStorage.pendingMatch in confirmOrder) produces order=[],
      the confirm button is still enabled and not disabled, and dispatching START_MATCH with
      players:[] and order:[] sets phase:'playing' with zero players. The first DART_THROWN
      then evaluates state.players[0].remaining on undefined, producing an uncaught
      TypeError that crashes the scoring view. This means the setup-to-match flow is
      breakable via a common browser gesture.
    artifacts:
      - path: "src/ui/setup/BullOffOrder.svelte"
        issue: >
          confirmOrder() (line 122) dispatches START_MATCH unconditionally. No check for
          order.length === 0 or for initialPlayers being empty. Confirm button (line 173)
          is always enabled regardless of whether any players are present.
    missing:
      - "In BullOffOrder confirmOrder(): guard with 'if (order.length === 0) { goto(base+'/setup'); return; }'"
      - "Disable the confirm button when order.length === 0"
      - "In reducer.ts applyStartMatch: return unchanged state (or throw) when orderedPlayers is empty"

human_verification:
  - test: "Navigate directly to /bulloff (or browser-back after completing a match) and tap 'Spielreihenfolge bestätigen' with no players shown."
    expected: "App redirects to /setup rather than starting a 0-player match. Currently dispatches START_MATCH with empty players, navigates to /match, and crashes on first dart tap."
    why_human: "The crash path requires real browser navigation across routes; grep confirms no guard exists but human must confirm the crash reproduces."
  - test: "Start a 2-player match. After player 1's first 3-dart visit, observe the correction window appear, then press 'Korrigieren', then wait 5 seconds."
    expected: "The correction window does not auto-dismiss while paused, but pressing outside the window (or a 'Fertig' button) closes it and reveals the board for player 2. Currently the window never auto-dismisses and no outside-click handler runs while paused — permanent lock."
    why_human: "CorrectionWindow timer behavior and paused-state escape require real browser observation; both defects are confirmed in code but user-visible impact needs live testing."
  - test: "Start a match with a player at exactly 50 remaining. Tap the inner bull (center circle). Observe the outcome."
    expected: "Player wins the leg (remaining reaches 0 via a valid Bull finish). Currently inner bull scores 100 points, causing an overshoot bust instead."
    why_human: "Bull encoding produces wrong score — requires real board tap to confirm the bust overlay appears instead of the win overlay."
  - test: "Start a match. Throw dart 1 (e.g. T20 = 60 from 501). Observe the large remaining score on the ScorePanel."
    expected: "ScorePanel shows 441 (501 - 60) after the first dart. Currently it shows 501 until all 3 darts are thrown."
    why_human: "Live remaining display during a board visit requires real browser interaction to observe the score discrepancy."
---

# Phase 1: Playable X01 Match — Re-Verification Report

**Phase Goal:** A full X01 match can be played from setup to finish in-browser by 1–4 players with touch input, correct bust handling, undo, and checkout suggestions
**Verified:** 2026-06-11T00:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure (plans 01-05 through 01-09)

## Previous Verification Summary

Previous verification (2026-06-10): status `gaps_found`, score `0/5`. Nine critical defects were identified across four root-cause groups.

**All nine original defects were resolved in plans 01-05 through 01-09.** However the fresh code review (01-REVIEW.md, 2026-06-11) identifies five new Critical issues introduced or surfaced by those fixes. Four of the five are in scope for this verification's must-have truths.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player can configure match (301/401/501, Single/Double Out, legs/sets, 1–4 named/guest players, bull-off order) | FAILED | BullOffOrder has no 0-player guard (CR-05). Direct /bulloff navigation or browser-back starts a 0-player match that crashes on first dart. Setup and bull-off flow work for the happy path. |
| 2 | Player can tap board (all segments hittable) or use numpad; visit auto-finalizes after 3 darts/bust/win with correction window | FAILED | CorrectionWindow auto-dismiss never fires ($effect reads elapsed, restarting timer every rAF frame — CR-04). 'Korrigieren' enters an inescapable paused state that blocks the undo button with no exit path (CR-03). |
| 3 | Bust reverts full visit and passes turn immediately | FAILED | Inner bull scores 100 instead of 50 (board.ts: {multiplier:2, segment:50} = 2*50 = 100). A player on 50 following the checkout suggestion 'Bull' gets a spurious overshoot bust — a legitimate double-out finish is rejected. All routes ending in 'Bull' (170, 167, 164, 161, 50) are broken. |
| 4 | Player can undo any dart or completed visit including leg-winning throws without corrupting leg/set counts | VERIFIED | reducer.ts: START_MATCH resets log to [action] (CR-07 fixed). CONFIRM_VISIT returns state unchanged (WR-01 fixed). UNDO = reduce(initialState(), ...log.slice(0,-1)) — verified correct. |
| 5 | Checkout suggestions appear for next 1–3 darts; bogey/170+ show nothing; screen stays awake | FAILED | ScorePanel.svelte line 16 renders {player.remaining} (start-of-visit) not matchStore.remaining (live). After dart 1 or 2 on the board, CheckoutSuggestion shows the updated route but the large score still shows the old value — they contradict each other. Also: checkout routes ending in 'Bull' are factually wrong due to CR-01. |

**Score:** 2/5 truths verified (Truth 4 — undo — fully verified; the original gap for wake lock is also verified: INP-05 confirmed wired in match/+page.svelte)

---

### Gaps Closed Since Previous Verification

| Gap (Previous) | Resolution |
|----------------|-----------|
| SVG viewBox clipped double ring (CR-01 orig) | FIXED: viewBox changed to "-190 -190 780 780"; double ring visible and hittable |
| CorrectionWindow missing ondismiss prop (CR-03 orig) | FIXED: ondismiss prop added; dismissCorrection() wired as ondismiss in match/+page.svelte |
| Cross-player visit tracking bug ($effect) (CR-04 orig) | FIXED: lastVisitCounts is now Record<string,number> keyed by player.id |
| START_MATCH appends to existing event log (CR-07) | FIXED: applyStartMatch returns eventLog: [action] |
| CONFIRM_VISIT appended to log (WR-01) | FIXED: CONFIRM_VISIT case returns state unchanged |
| ProfileManager not mounted in any route (CR-08) | FIXED: MatchSetup.svelte renders ProfileManager in collapsible section |
| matchStore.remaining stale mid-visit (CR-06) | FIXED: getter subtracts currentVisit.reduce sum |
| IMPOSSIBLE_3DART missing 163, 166 (CR-02 orig) | FIXED: both values present in the Set |
| Numpad dispatches directly to matchStore (CR-05 orig) | FIXED: Numpad accepts onconfirm prop; handleNumpadVisit in match/+page.svelte dispatches |

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/ui/input/Dartboard.svelte` | VERIFIED | viewBox="-190 -190 780 780" — double ring (r=303–325) visible and inside viewBox. Polar math hit detection correct. |
| `src/ui/input/CorrectionWindow.svelte` | STUB (timer broken) | ondismiss wired, per-player tracking fixed. But $effect reads elapsed making auto-dismiss never fire (CR-04). Paused state blocks undo button with no exit (CR-03). |
| `src/ui/setup/ProfileManager.svelte` | VERIFIED | Mounted in MatchSetup.svelte under collapsible toggle. CRUD operations wired. |
| `src/engine/impossible-scores.ts` | VERIFIED | IMPOSSIBLE_3DART includes 163, 166, and all others. |
| `src/stores/match.svelte.ts` | VERIFIED | remaining getter subtracts currentVisit; suggestion uses live remaining. |
| `src/engine/reducer.ts` | VERIFIED | START_MATCH resets log; CONFIRM_VISIT no-op; UNDO replays log from initialState. |
| `src/ui/input/Numpad.svelte` | VERIFIED | onconfirm prop accepted; dispatches through parent's handleNumpadVisit. |
| `src/engine/board.ts` | STUB (wrong bull encoding) | classifyHit returns {multiplier:2, segment:50} for inner bull. 2*50=100 — scores 100 points. All bull-involved checkout routes produce busts. |
| `src/ui/input/ScorePanel.svelte` | STUB (stale score display) | Renders {player.remaining} not {isActive ? matchStore.remaining : player.remaining}. Large score contradicts live CheckoutSuggestion after dart 1 or 2. |
| `src/ui/setup/BullOffOrder.svelte` | STUB (missing guard) | No guard for order.length === 0. Empty-player match start crashes reducer on first DART_THROWN. |
| `src/engine/bust.ts` | PARTIAL | Logic correct for all three conditions. But inner bull path unreachable from board: {m:2,s:50} hits newRemaining<0 branch before isInnerBull check when remaining=50. |
| `src/engine/checkout.ts` | PARTIAL | 170-entry table correct structure; bogey numbers present. But entry '50: [Bull]' produces a bust when followed (CR-01 downstream). |
| `src/engine/rotation.ts` | VERIFIED | nextPlayerIndex and legStarterIndex correct and tested. |
| `src/db/profiles.ts` | VERIFIED | createProfile/updateProfile/deleteProfile/listProfiles all implemented and tested. |
| `src/routes/bulloff/+page.svelte` | VERIFIED | Mounts BullOffOrder, dispatches START_MATCH. |
| `src/lib/wake-lock.svelte.ts` | VERIFIED | acquireWakeLock/releaseWakeLock; visibilitychange handler in match route. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Dartboard.svelte` | `match.svelte.ts` | dispatch DART_THROWN | VERIFIED | handlePointerDown calls matchStore.dispatch({type:'DART_THROWN',dart}) |
| `Dartboard.svelte` | `board.ts` | classifyHit + screenToBoard | VERIFIED | Lines 139-140: classifyHit(r, angleDeg) called after screenToBoard |
| `match/+page.svelte` | `wake-lock.svelte.ts` | $effect acquire/release | VERIFIED | Lines 17-32: acquireWakeLock() on mount, visibilitychange handler |
| `CheckoutSuggestion.svelte` | `match.svelte.ts` | matchStore.suggestion | VERIFIED | matchStore.suggestion uses live matchStore.remaining |
| `CorrectionWindow.svelte` | `match/+page.svelte` | ondismiss callback | VERIFIED (wiring) / FAILED (behavior) | ondismiss=dismissCorrection wired; dismissCorrection clears pendingCorrection. But auto-dismiss never fires due to $effect/elapsed loop. |
| `Numpad.svelte` | `match/+page.svelte` | onconfirm callback | VERIFIED | Numpad calls onconfirm(total); parent's handleNumpadVisit handles dispatch + DartsAtDoubleDialog |
| `ProfileManager.svelte` | `MatchSetup.svelte` | component mount | VERIFIED | Imported and rendered in collapsible section at lines 68-70 |
| `match.svelte.ts` | `reducer.ts` | reduce(this.state, action) | VERIFIED | Line 22: this.state = reduce(this.state, action) |
| `reducer.ts` | `bust.ts` | isBust() | VERIFIED (wired) / PARTIAL (correctness) | isBust called correctly; but bull encoding in board.ts produces wrong inputs |
| `BullOffOrder.svelte` | `reducer.ts` | START_MATCH dispatch | BROKEN (no 0-player guard) | confirmOrder dispatches without checking order.length — 0-player crash path |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ScorePanel.svelte` | `player.remaining` | matchStore.state.players[].remaining | Start-of-visit value only | HOLLOW — active player score stale mid-visit; matchStore.remaining exists but not consumed here |
| `CheckoutSuggestion.svelte` | `matchStore.suggestion` | getSuggestion(matchStore.remaining) | Live remaining (correct) | PARTIAL — live data used, but bull-route suggestions are factually wrong (CR-01) |
| `CorrectionWindow.svelte` | `visitDarts`, `visitTotal` | pendingCorrection.darts | Real board-visit darts | FLOWING (data correct, behavioral defect is in timer, not data) |
| `ProfileManager.svelte` | `profiles` | profilesLive() Dexie liveQuery | Real DB data | VERIFIED — component now mounted and connected |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Inner bull classifyHit returns 50-point encoding | `board.ts line 44: { multiplier: 2, segment: 50 }` → 2*50=100 | Returns 100 pts | FAIL |
| isBust(50, {m:2,s:50}, 'double') — bull finish valid? | `bust.ts line 28: newRemaining = 50 - 100 = -50 < 0` → returns true | Bust (wrong) | FAIL |
| Checkout table '50: [Bull]' entry present | `checkout.ts line 128` | Present | PASS (but route produces bust) |
| ScorePanel uses matchStore.remaining for active player | `ScorePanel.svelte line 16: {player.remaining}` | Uses loop variable, not live getter | FAIL |
| CorrectionWindow $effect calls startTimer without untrack | `CorrectionWindow.svelte line 79: startTimer()` inside $effect that reads elapsed | No untrack(); elapsed is tracked dep | FAIL |
| CorrectionWindow paused=true has dismiss path | Lines 113-119: only renders hint text; handleOutsideClick does nothing when paused | No dismiss button; no outside-click exit | FAIL |
| BullOffOrder guards 0-player confirm | `BullOffOrder.svelte confirmOrder()`: no order.length check | No guard | FAIL |
| IMPOSSIBLE_3DART contains 163 and 166 | `impossible-scores.ts line 11-13` | Both present | PASS |
| START_MATCH resets event log | `reducer.ts line 100: eventLog: [action]` | Reset to single-entry log | PASS |
| CONFIRM_VISIT not appended to log | `reducer.ts lines 57-59: return state` | Not appended | PASS |
| matchStore.remaining subtracts currentVisit | `match.svelte.ts lines 35-41` | Subtracts correctly | PASS |
| ProfileManager mounted in MatchSetup | `MatchSetup.svelte line 69` | Rendered in collapsible section | PASS |
| Numpad routes through onconfirm callback | `Numpad.svelte line 38: onconfirm(total)` | Uses prop callback | PASS |
| SVG viewBox fits double ring | `Dartboard.svelte line 163: viewBox="-190 -190 780 780"` | Double ring at r=325, board center at (200,200): 200+325=525 < 590 (half of 780+190) | PASS |

### Requirements Coverage

| Requirement | Plan | Status | Evidence |
|-------------|------|--------|---------|
| ENG-01 (301/401/501, Single/Double Out) | 01-02, 01-04 | VERIFIED | Setup chips and out-rule control; reducer handles all start scores and outRules |
| ENG-02 (legs/sets config) | 01-02, 01-04 | VERIFIED | Steppers in MatchSetup; reducer handles legsToWin/setsToWin |
| ENG-03 (1–4 players, turn rotation) | 01-02 | VERIFIED | nextPlayerIndex/legStarterIndex tested; reducer handles 1–4 players |
| ENG-04 (bust revert + pass turn) | 01-02, 01-03 | FAILED | Engine logic correct for all three conditions, but inner bull (CR-01) causes a spurious overshoot bust on a legitimate Bull finish from remaining=50. |
| ENG-05 (unlimited undo) | 01-02, 01-03 | VERIFIED | log reset on START_MATCH; CONFIRM_VISIT not in log; UNDO replays cleanly |
| ENG-06 (bull-off order) | 01-04 | VERIFIED | BullOffOrder dispatches START_MATCH with ordered player list |
| ENG-07 (checkout suggestions) | 01-02, 01-03 | FAILED | matchStore.suggestion uses live remaining — correct. But ScorePanel displays stale score beside the suggestion, creating on-screen contradiction. Bull-route suggestions (170, 167, 164, 161, 50) cause busts due to CR-01. |
| INP-01 (board tap, all segments hittable) | 01-03 | VERIFIED | viewBox fixed; double ring visible and polar-math hit detection correct |
| INP-02 (numpad validation) | 01-02, 01-03 | VERIFIED | IMPOSSIBLE_3DART includes 163, 166 and all others; isValidVisitTotal correct |
| INP-03 (darts-at-double) | 01-03 | PARTIAL | DartsAtDoubleDialog wired for numpad finish. But dispatch is recorded with dartsAtDouble:0 — dialog confirmation is discarded (WR-01 from new review). Stats will be wrong but the dialog appears. |
| INP-04 (correction window) | 01-03 | FAILED | Window appears for every visit (per-player tracking fixed). But auto-dismiss never fires (CR-04) and paused state is an inescapable dead end (CR-03). |
| INP-05 (wake lock) | 01-03 | VERIFIED | acquireWakeLock + visibilitychange wired in match route $effect |
| FLOW-01 (full setup flow) | 01-04 | PARTIAL | Happy path works. Direct /bulloff navigation (0-player state) crashes (CR-05). |
| PROF-01 (profile CRUD) | 01-04 | VERIFIED | ProfileManager mounted in MatchSetup; createProfile/updateProfile/deleteProfile tested |
| PROF-02 (guests not persisted) | 01-04 | VERIFIED | Guests use isGuest:true; no db.profiles write in guest path |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/board.ts` | 44 | `{ multiplier: 2, segment: 50 }` — inner bull encodes to 100 pts | BLOCKER | All bull-route checkout suggestions produce busts; isBust(50, bull, 'double') returns true (wrong); checkout table entry 50:[Bull] is misleading |
| `src/ui/input/CorrectionWindow.svelte` | 75-86 | `$effect` calls `startTimer()` which reads `elapsed` ($state) without `untrack` | BLOCKER | Timer is reset every rAF tick; auto-dismiss never fires; correction window is permanent after 'Korrigieren' |
| `src/ui/input/CorrectionWindow.svelte` | 113-119 | paused=true: no dismiss button, no outside-click exit | BLOCKER | 'Korrigieren' results in inescapable overlay covering undo button |
| `src/ui/input/ScorePanel.svelte` | 16 | `{player.remaining}` instead of `{isActive ? matchStore.remaining : player.remaining}` | WARNING | Active player score stale mid-visit; contradicts live CheckoutSuggestion |
| `src/ui/setup/BullOffOrder.svelte` | 122-138 | No `order.length === 0` guard in `confirmOrder()` | BLOCKER | Direct /bulloff navigation → 0-player match → crash on first dart tap |

No `TBD`, `FIXME`, or `XXX` markers found in phase files.

### Human Verification Required

#### 1. 0-player crash path (BullOffOrder CR-05)

**Test:** Complete a match (win overlay appears), press 'Neues Spiel' or use browser-back to reach /setup, then navigate directly to /bulloff in the address bar, and tap 'Spielreihenfolge bestätigen'.
**Expected:** App redirects to /setup (or shows an error) rather than starting a 0-player match that crashes on first dart tap.
**Why human:** The crash path requires real browser navigation. Confirmed no guard exists in code, but the crash itself needs live verification.

#### 2. Inner bull scoring produces bust on 50 remaining (CR-01)

**Test:** Start a solo 501 match. Use the numpad to score down to exactly 50 remaining. Switch to board input. Tap the inner bull (small center circle). Observe whether a win overlay appears or a bust is recorded.
**Expected:** Win overlay appears (leg won on Bull). Currently inner bull scores 100 points, producing an overshoot bust.
**Why human:** Requires real board interaction to confirm the wrong outcome in the live app.

#### 3. CorrectionWindow auto-dismiss and paused state

**Test:** Start a 2-player match, throw 3 darts for player 1 via board input. When the correction window appears, tap 'Korrigieren'. Then wait 10 seconds without touching anything. Then tap anywhere outside the window.
**Expected:** Either the window auto-dismisses after ~2.5s, or tapping outside while paused dismisses it and reveals the board for player 2. Currently neither happens — the window is permanent after 'Korrigieren'.
**Why human:** Timer behavior and paused-state escape require real browser observation.

#### 4. ScorePanel score updates mid-visit

**Test:** Start a match from 501. Tap T20 on the board (first dart). Observe the large remaining score in the ScorePanel immediately after the tap.
**Expected:** Score shows 441 (501 - 60). Currently shows 501 until all 3 darts are thrown.
**Why human:** Mid-visit display state requires real browser interaction.

### Gaps Summary

Four critical defects block goal achievement. They fall into three root-cause groups:

**Group 1 — Inner bull encoding (CR-01 new):** `classifyHit` returns `{multiplier:2, segment:50}`, so the scoring formula `2*50=100` scores 100 points for a bull tap. This is the single highest-impact defect: it makes Double Out on Bull impossible (a player on 50 cannot finish via the board), it causes isBust to return true for a legitimate finish, and it makes all checkout routes ending in 'Bull' (170, 167, 164, 161, 50) factually wrong. The fix is one line in board.ts, but requires updating bust.test.ts, board.test.ts, and the bust.ts isInnerBull check.

**Group 2 — CorrectionWindow timer + paused state (CR-03, CR-04 new):** The `$effect` auto-dismiss loop is broken because `elapsed` (a `$state`) is read inside `startTimer()`, which is called from the effect, making `elapsed` a tracked dependency. Svelte re-runs the effect on every rAF tick, cancelling the timer before it fires. Separately, pressing 'Korrigieren' sets `paused=true` and renders a hint overlay that blocks the undo button with no dismiss path. Both defects compound: the window never auto-dismisses, and if the user presses 'Korrigieren', the match UI is permanently inaccessible. The fix requires `untrack()` around `startTimer()` and an explicit dismiss control when paused.

**Group 3 — Missing guards and stale display (CR-05, ScorePanel):** BullOffOrder lacks a 0-player guard, allowing a browser-back gesture to start a crashed match. ScorePanel renders the start-of-visit remaining instead of `matchStore.remaining`, creating a visible contradiction between the score and the checkout suggestion after dart 1 or 2. Both are one-line fixes.

---

_Verified: 2026-06-11T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
