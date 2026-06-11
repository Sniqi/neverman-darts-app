---
phase: 01-playable-x01-match
verified: 2026-06-11T02:40:00Z
status: gaps_found
score: 4/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed:
    - "Inner bull encoding fixed to {multiplier:2, segment:25} = 50 pts; bust on Bull finish from remaining=50 eliminated (CR-01)"
    - "CorrectionWindow auto-dismiss fires once via untrack(() => startTimer()); effect runs only on visibility change, not every rAF frame (CR-04)"
    - "CorrectionWindow paused state escapable via 'Fertig' button and unconditional outside-click handler (CR-03)"
    - "ScorePanel active player remaining bound to isActive ? matchStore.remaining : player.remaining; live mid-visit updates agree with CheckoutSuggestion (CR-02)"
    - "BullOffOrder confirmOrder guards order.length === 0 with redirect to /setup; confirm button disabled when empty; reducer returns initialState() for empty player list (CR-05)"
  gaps_remaining:
    - "E2E happy-path spec fails: handleNumpadVisit shows darts-at-double dialog for ALL finishing visits including match-winning; spec never answers dialog; win-overlay assertion times out (CR-01 from 01-REVIEW.md)"
  regressions:
    - "Dartboard.svelte flash logic: dead segment===50 branch left behind by 01-10 encoding fix; inner-bull taps flash outer bull instead of inner bull (WR-02 from 01-REVIEW.md)"
gaps:
  - truth: "Player can enter each dart by tapping the on-screen dartboard (all segments reliably hittable by finger) or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a correction window"
    status: partial
    reason: >
      The E2E happy-path spec (e2e/full-match-flow.spec.ts) is RED. handleNumpadVisit
      in match/+page.svelte shows the darts-at-double dialog for ANY finishing visit where
      prevRemaining === total — there is no distinction between leg-winning and
      match-winning visits. The spec enters the final 16 (D8, match-winning in a 1-leg
      game) and then asserts the win overlay without ever clicking a dialog option. Because
      the NUMPAD_VISIT dispatch is deferred until the dialog confirms, the win overlay
      never renders and the assertion times out (confirmed by running the spec:
      'getByRole heading /gewinnt!/ — element(s) not found', exit code 1).
      The spec comment on line 96-97 claims 'The darts-at-double dialog is suppressed for
      match-winning visits (win overlay takes over)' — this behavior does NOT exist in the
      codebase. The dialog is never suppressed for any finishing visit.
      Unit tests and unit-test-covered functionality are unaffected — the scoring engine
      and CorrectionWindow are correct. This gap is isolated to the E2E spec and the
      dialog suppression missing from match/+page.svelte.
    artifacts:
      - path: "e2e/full-match-flow.spec.ts"
        issue: >
          Line 96-97: stale comment claiming dialog is suppressed for match-winning visits.
          Lines 94-100: enters '16', presses Bestätigen, then immediately asserts win overlay
          without clicking a dialog option. The dialog intercepts and blocks the win overlay.
      - path: "src/routes/match/+page.svelte"
        issue: >
          handleNumpadVisit (lines 103-117): isFinish = prevRemaining === total regardless of
          whether the win is a leg-win or match-win. showDartsAtDouble = true for all finishes.
          No suppression logic for match-winning visits exists anywhere in the file.
    missing:
      - "Option A (preferred): update the E2E spec to click a dialog option after the final Bestätigen before asserting the win overlay — e.g. await page.getByRole('button', { name: '1 Dart' }).click()"
      - "Option B (alternative): add match-win suppression to handleNumpadVisit — detect that dispatch would produce phase=match-complete and skip the dialog (dispatch immediately with dartsAtDouble:0), then remove the stale comment"
human_verification:
  - test: "Start a 2-player match with 2 legs to win. Score down to 16 remaining for player 1. Enter 16 on the numpad and press Bestätigen. Observe: darts-at-double dialog appears. Press '1 Dart'. Observe: correction window appears briefly then dismisses. Score player 2 down similarly. Repeat until someone reaches 2 legs."
    expected: "Full 2-leg 2-player match completes end-to-end — match win overlay appears with player name and Neues Spiel button. Correction window appears and auto-dismisses after each visit. Mid-visit ScorePanel score updates live after each board dart."
    why_human: "Multi-leg match flow through the darts-at-double dialog requires live browser interaction. The E2E spec only covers a 1-leg game and currently fails."
  - test: "Start a match with any player. After the first 3-dart board visit, tap 'Korrigieren' in the correction window. Then tap 'Fertig'. Observe the window dismisses and the next player's board is reachable."
    expected: "Correction window dismisses and the board is accessible for the next player. (Unit tests cover this but real browser test confirms the interaction post-plan-11 fix.)"
    why_human: "Paused-state escape path in a real browser interaction; covered by unit tests but human confirmation needed after the CR-03 fix."
  - test: "Start a solo 501 match. Switch to board mode. Score down to exactly 50. Tap the inner bull (center circle). Observe the outcome."
    expected: "Win overlay appears (leg won). Score must reach 0, not -50. Inner bull must flash the inner-bull region (amber circle), not the outer bull ring. (Unit tests confirm the 50-point scoring; visual flash requires browser observation.)"
    why_human: "WR-02 (Dartboard flash): inner-bull taps produce flashKey='outer-bull' because the dead segment===50 branch precedes the segment===25 check. The score is correct (50 pts, valid finish) but the visual feedback is wrong. Requires browser observation to confirm the flash region."
---

# Phase 1: Playable X01 Match — Re-Verification Report (Round 3)

**Phase Goal:** A full X01 match can be played from setup to finish in-browser by 1–4 players with touch input, correct bust handling, undo, and checkout suggestions
**Verified:** 2026-06-11T02:40:00Z
**Status:** gaps_found
**Re-verification:** Yes — after gap closure plans 01-10 (inner-bull encoding), 01-11 (CorrectionWindow timer + paused escape), 01-12 (live score, 0-player guard, darts-at-double)

---

## Previous Verification Summary

Previous verification (2026-06-11T00:00:00Z): status `gaps_found`, score `2/5`. Five new critical defects were identified from the wave 5 gap-closure plans.

**Four of the five previous gaps were resolved.** One new gap surfaced from the code review (01-REVIEW.md CR-01): the darts-at-double dialog now intercepts all numpad finishes including match-winning ones, and the E2E spec was never updated to handle the dialog — it fails at the win-overlay assertion.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player can configure a 301/401/501 match with Single Out or Double Out, set the number of legs/sets, add 1–4 named or guest players, and enter the bull-off result to set starting order | VERIFIED | BullOffOrder.svelte line 122-126: empty-order guard redirects to /setup. Confirm button `disabled={order.length === 0}` at line 178. reducer.ts lines 94-99: applyStartMatch returns initialState() for empty player list. reducer.test.ts lines 122-155: three CR-05 tests pass. MatchSetup, PlayerPicker, ProfileManager all wired and tested. |
| 2 | Player can enter each dart by tapping the on-screen dartboard (all segments reliably hittable by finger) or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a correction window | PARTIAL | Board tap, polar-math hit detection, numpad, and CorrectionWindow are all correct in isolation. Unit tests: 162/162 pass including 6 real-timer CorrectionWindow tests. HOWEVER: E2E spec fails (confirmed, exit code 1). handleNumpadVisit defers all finishing NUMPAD_VISITs behind the darts-at-double dialog with no match-win suppression; the spec never clicks the dialog; win overlay assertion times out. This is the only gap blocking goal achievement. |
| 3 | A bust (all three conditions: score < 0, reaching 1 on double-out, finishing on non-double) reverts the full visit and passes the turn immediately | VERIFIED | board.ts line 44: `{ multiplier: 2, segment: 25 }` — 2×25=50 pts. bust.ts line 32: `multiplier === 2` only, no dead segment===50 branch. isBust(50, {m:2,s:25}, 'double') returns false (valid finish). bust.test.ts and board.test.ts both updated and passing. Checkout routes 50/161/164/167/170 via 'Bull' now terminate correctly. |
| 4 | Player can undo any dart or completed visit, including a leg- or set-winning throw, without corrupting leg/set counts | VERIFIED | reducer.ts: UNDO = reduce(initialState(), ...log.slice(0,-1)). START_MATCH resets log to [action] (eventLog: [action] at line 108). CONFIRM_VISIT returns state unchanged (line 58). reducer.test.ts: undo-through-leg-win test passes. Full 162-test suite green. |
| 5 | Checkout suggestions appear for the next 1–3 darts when a finish is possible; bogey numbers and scores above 170 show no suggestion; the screen stays awake throughout the match | VERIFIED | ScorePanel.svelte line 16: `{isActive ? matchStore.remaining : player.remaining}`. matchStore.remaining getter subtracts currentVisit running total. CheckoutSuggestion consumes matchStore.suggestion (which uses live remaining). match/+page.svelte: acquireWakeLock on mount + visibilitychange handler. Bull-route checkout suggestions (170/167/164/161/50) no longer cause busts. |

**Score:** 4/5 truths verified (Truth 2 partially verified — code is correct, E2E spec is red)

---

### Gaps Closed Since Previous Verification

| Gap (Previous) | Resolution |
|----------------|-----------|
| Inner bull scores 100 instead of 50 (CR-01 new) | FIXED: board.ts line 44 returns `{multiplier:2,segment:25}`; 2×25=50 at every scoring site |
| CorrectionWindow $effect reads elapsed making auto-dismiss never fire (CR-04 new) | FIXED: `untrack(() => startTimer())` at line 83; effect runs once per visibility change |
| CorrectionWindow 'Korrigieren' paused state is inescapable (CR-03 new) | FIXED: `handleOutsideClick` unconditional at line 72; 'Fertig' button in paused branch at line 123 |
| ScorePanel renders player.remaining not matchStore.remaining — stale mid-visit (CR-02 new) | FIXED: line 16 reads `{isActive ? matchStore.remaining : player.remaining}` |
| BullOffOrder has no 0-player guard (CR-05 new) | FIXED: confirmOrder redirects to /setup on empty order; button disabled; reducer returns initialState() |

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/engine/board.ts` | VERIFIED | classifyHit inner-bull returns `{multiplier:2,segment:25}`; ring-boundary comment updated |
| `src/engine/bust.ts` | VERIFIED | Double-out finish check is `multiplier===2` only; no dead segment===50 branch; isBust(50,{m:2,s:25},'double') = false |
| `src/engine/board.test.ts` | VERIFIED | Assertions updated to `{multiplier:2,segment:25}` |
| `src/engine/bust.test.ts` | VERIFIED | 50-point bull test present; 100-point bug test removed |
| `src/ui/input/VisitStrip.svelte` | VERIFIED | formatDart: `multiplier===2 && segment===25` → 'Bull'; `multiplier===1 && segment===25` → 'Outer Bull'; no segment===50 branch |
| `src/ui/input/CorrectionWindow.svelte` | VERIFIED | `untrack` imported; `$effect` calls `untrack(() => startTimer())`; `handleOutsideClick` unconditional; 'Fertig' button in paused branch; formatDart updated for 01-10 encoding |
| `src/ui/input/CorrectionWindow.test.ts` | VERIFIED | 6 tests pass: render, real-timer auto-dismiss (2503ms, exactly 1 call), bust label, not-visible, Fertig button, outside-click while paused |
| `src/ui/input/ScorePanel.svelte` | VERIFIED | Line 16: `{isActive ? matchStore.remaining : player.remaining}` |
| `src/ui/setup/BullOffOrder.svelte` | VERIFIED | confirmOrder: `if (order.length === 0) { goto(...setup); return; }` at lines 122-126; `disabled={order.length === 0}` at line 178 |
| `src/engine/reducer.ts` | VERIFIED | applyStartMatch: filter-safe lookup, returns initialState() for empty player list (lines 94-99) |
| `src/engine/reducer.test.ts` | VERIFIED | CR-05 guard tests (3 tests): empty order, all-unmatched, partial-match. 42 tests total, all passing |
| `src/routes/match/+page.svelte` | PARTIAL | handleNumpadVisit defers finish dispatch until dialog confirms — correct for INP-03. BUT: no match-win suppression; dialog shown for all finishes including match-winning, breaking the E2E spec |
| `src/ui/input/DartsAtDoubleDialog.svelte` | VERIFIED | select() calls onconfirm(darts, darts); Phase 1 comment added; no UI change |
| `src/ui/input/Dartboard.svelte` | STUB (flash only) | viewBox="-190 -190 780 780" correct; polar math correct; score dispatch correct. BUT: flash logic at lines 144-148 checks `dart.segment === 50` first (dead code since classifyHit never returns segment:50), then `dart.segment === 25` triggers 'outer-bull' for both bulls. Inner-bull taps score correctly but flash the wrong region (WR-02, visual feedback only) |
| `e2e/full-match-flow.spec.ts` | FAILED | Spec fails (confirmed). Line 96-97 comment is false. Final visit defers behind dialog which spec never answers. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Dartboard.svelte` | `board.ts` | classifyHit({m:2,s:25}) → 50 pts | VERIFIED | Line 7 import + lines 139-140 usage; inner-bull encoding correct |
| `Dartboard.svelte` | `match.svelte.ts` | dispatch DART_THROWN | VERIFIED | Line 156: matchStore.dispatch({type:'DART_THROWN',dart}) |
| `bust.ts` | `board.ts` | multiplier*segment scoring | VERIFIED | bust.ts line 20: `const scored = dart.multiplier * dart.segment` — 2*25=50 |
| `CorrectionWindow.svelte` | `match.svelte.ts` | dispatch CONFIRM_VISIT after timer | VERIFIED | Line 61: matchStore.dispatch({type:'CONFIRM_VISIT'}); untrack fix confirmed |
| `CorrectionWindow.svelte` | `match/+page.svelte` | ondismiss clears pendingCorrection | VERIFIED | ondismiss=dismissCorrection at +page.svelte line 164; dismissCorrection sets pendingCorrection=null |
| `ScorePanel.svelte` | `match.svelte.ts` | matchStore.remaining (live) | VERIFIED | Line 16: `isActive ? matchStore.remaining : player.remaining` |
| `CheckoutSuggestion.svelte` | `match.svelte.ts` | matchStore.suggestion | VERIFIED | Same live remaining source — score and suggestion now agree |
| `BullOffOrder.svelte` | `reducer.ts` | START_MATCH guarded against empty order | VERIFIED | UI guard + reducer defense-in-depth both present |
| `match/+page.svelte` | `DartsAtDoubleDialog.svelte` | showDartsAtDouble for ALL finishes | BROKEN | No match-win suppression; dialog shown for leg-win and match-win alike |
| `e2e/full-match-flow.spec.ts` | `DartsAtDoubleDialog.svelte` | Dialog interaction after match-winning visit | NOT_WIRED | Spec never clicks dialog; match-win assertion fails |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ScorePanel.svelte` | `matchStore.remaining` (active) / `player.remaining` (inactive) | matchStore getter subtracts currentVisit | Yes — live mid-visit and committed post-visit | VERIFIED (fixed by plan 01-12) |
| `CheckoutSuggestion.svelte` | `matchStore.suggestion` | getSuggestion(matchStore.remaining) | Yes — live remaining, bull routes now correct | VERIFIED |
| `CorrectionWindow.svelte` | `visitDarts`, `visitTotal`, `isBust` | pendingCorrection from +page.svelte effect | Yes — last committed visit | VERIFIED |
| `ProfileManager.svelte` | `profiles` | profilesLive() Dexie liveQuery | Yes — real IndexedDB data | VERIFIED |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Inner bull classifyHit returns 50-point encoding | `board.ts line 44: { multiplier: 2, segment: 25 }` → 2×25=50 | Returns 50 pts | PASS |
| isBust(50, {m:2,s:25}, 'double') — bull finish valid | `bust.ts line 32: multiplier===2 only` → returns false | Valid finish | PASS |
| CorrectionWindow auto-dismiss fires exactly once after 2.5s | CorrectionWindow.test.ts real-timer test: `toHaveBeenCalledTimes(1)` after 2503ms | 1 call | PASS |
| CorrectionWindow paused state has Fertig button | `CorrectionWindow.svelte line 123: <button class="fertig-btn">Fertig</button>` in {:else} | Button rendered | PASS |
| handleOutsideClick unconditional | `CorrectionWindow.svelte line 72: confirm()` with no paused guard | Unconditional | PASS |
| ScorePanel uses matchStore.remaining for active player | `ScorePanel.svelte line 16: isActive ? matchStore.remaining : player.remaining` | Correct | PASS |
| BullOffOrder guards empty order | `BullOffOrder.svelte lines 122-126: if (order.length === 0) { goto; return; }` | Guard present | PASS |
| BullOffOrder confirm button disabled when empty | `BullOffOrder.svelte line 178: disabled={order.length === 0}` | Disabled | PASS |
| Reducer returns initialState() for empty player list | `reducer.ts lines 94-99: if (orderedPlayers.length === 0) return initialState()` | Safe return | PASS |
| Dartboard.svelte inner-bull FLASH logic correct | `Dartboard.svelte lines 144-148: dart.segment === 50 check (dead) precedes dart.segment === 25 (fires 'outer-bull')` | Wrong: inner-bull taps flash outer bull | FAIL (WR-02, visual only) |
| E2E happy-path spec passes | `npx playwright test e2e/full-match-flow.spec.ts` | exit code 1, toBeVisible /gewinnt!/ timed out | FAIL |
| Unit suite passes (162 tests) | `npx vitest run` | 11 files, 162 tests, all passed | PASS |
| Production build succeeds | `npx vite build` | ✓ built in 2.58s, wrote site to build/ | PASS |

### Requirements Coverage

| Requirement | Plan(s) | Status | Evidence |
|-------------|---------|--------|---------|
| ENG-01 (301/401/501, Single/Double Out) | 01-02, 01-04 | VERIFIED | Setup chips and out-rule control; reducer handles all start scores and outRules |
| ENG-02 (legs/sets config) | 01-02, 01-04 | VERIFIED | Steppers in MatchSetup; reducer handles legsToWin/setsToWin |
| ENG-03 (1–4 players, turn rotation) | 01-02 | VERIFIED | nextPlayerIndex/legStarterIndex tested; reducer handles 1–4 players |
| ENG-04 (bust revert + pass turn) | 01-02, 01-10 | VERIFIED | Engine logic correct for all three conditions including Bull finish from remaining=50 |
| ENG-05 (unlimited undo) | 01-02, 01-05 | VERIFIED | Log reset on START_MATCH; CONFIRM_VISIT not in log; UNDO replays cleanly |
| ENG-06 (bull-off order) | 01-04 | VERIFIED | BullOffOrder dispatches START_MATCH with ordered player list; 0-player guard added |
| ENG-07 (checkout suggestions) | 01-02, 01-08, 01-12 | VERIFIED | matchStore.suggestion uses live remaining; ScorePanel reads live remaining; bull routes correct |
| INP-01 (board tap, all segments hittable) | 01-03, 01-06 | VERIFIED | viewBox="-190 -190 780 780"; double ring visible and hittable; polar-math hit detection correct |
| INP-02 (numpad validation) | 01-02, 01-03 | VERIFIED | IMPOSSIBLE_3DART includes 163, 166 and all others; isValidVisitTotal correct |
| INP-03 (darts-at-double) | 01-03, 01-12 | VERIFIED | DartsAtDoubleDialog wired; handleDartsAtDoubleConfirm dispatches NUMPAD_VISIT with dartsAtDouble; reducer records value. E2E gap is a spec problem, not an INP-03 correctness problem |
| INP-04 (correction window) | 01-03, 01-07, 01-11 | VERIFIED | Auto-dismiss fires once (untrack fix); paused state escapable (Fertig + outside-click); per-player visit tracking correct; 6 unit tests all passing |
| INP-05 (wake lock) | 01-03 | VERIFIED | acquireWakeLock + visibilitychange wired in match route $effect |
| FLOW-01 (full setup flow) | 01-04, 01-12 | VERIFIED | Happy path works end-to-end; 0-player direct-navigation crash path closed at both UI and reducer level |
| PROF-01 (profile CRUD) | 01-04 | VERIFIED | ProfileManager mounted in MatchSetup; createProfile/updateProfile/deleteProfile tested |
| PROF-02 (guests not persisted) | 01-04 | VERIFIED | Guests use isGuest:true; no db.profiles write in guest path |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/ui/input/Dartboard.svelte` | 144-148 | `dart.segment === 50` flash check precedes `dart.segment === 25` — dead branch (segment 50 is never produced by classifyHit after plan 01-10 fix); inner-bull taps always take the `dart.segment === 25` path and set `flashKey = 'outer-bull'` | WARNING | Visual feedback only — score is correct (50 pts, valid finish). But the amber inner circle never flashes; the outer bull ring flashes instead. Touch confirmation UX is degraded for inner-bull taps. No debt marker; fix is 2 lines. |
| `e2e/full-match-flow.spec.ts` | 96-97 | Comment "The darts-at-double dialog is suppressed for match-winning visits (win overlay takes over)" describes behavior that does not exist | WARNING | Stale comment; misleads future developers. The real issue is the missing dialog click in the test. |
| `src/routes/match/+page.svelte` | 96-97, 107 | `handleNumpadVisit` sets `showDartsAtDouble = true` for all finishing visits (leg-win and match-win alike); no match-win suppression path | BLOCKER (E2E red) | E2E spec fails. Scorer must answer the dialog even when the match has ended; the win overlay is blocked until the dialog is confirmed, but the spec never confirms it. |

No `TBD`, `FIXME`, or `XXX` markers found in files modified by plans 01-10, 01-11, or 01-12.

### Human Verification Required

#### 1. Full 2-leg match through the darts-at-double dialog

**Test:** Start a 2-player match with 2 legs to win. Play through scoring down to a numpad-entered finish for each leg win and match win. Answer the darts-at-double dialog when it appears. Observe the correction window and win overlay.
**Expected:** Match completes end-to-end. Darts-at-double dialog appears after each numpad leg-winning visit. Correction window auto-dismisses after each non-winning visit. Win overlay appears when the match ends.
**Why human:** The E2E spec currently fails because it never answers the dialog for the match-winning visit. A multi-leg human test covers the full flow the spec misses, and confirms the CorrectionWindow corrections from plans 01-11 are working end-to-end.

#### 2. CorrectionWindow paused escape in a real browser

**Test:** Start a match, complete a board-input visit. When the correction window appears, tap 'Korrigieren'. Then tap 'Fertig'.
**Expected:** Window dismisses; the next player's board is immediately accessible. No permanent overlay lock.
**Why human:** Covered by unit tests but real-browser interaction confirms the CR-03 fix is effective under real Svelte lifecycle conditions.

#### 3. Inner-bull flash region (WR-02 — visual only)

**Test:** Score a player down to 50. Tap the inner bull (center amber circle). Observe which region flashes.
**Expected (before fix):** Outer bull ring flashes (wrong). The score correctly deducts 50 (correct); win overlay should appear if remaining was exactly 50.
**Why human:** The Dartboard flash logic has a dead segment===50 branch; inner-bull taps produce flashKey='outer-bull'. Scoring is correct; this is a visual feedback defect that requires browser observation to confirm. Listed as WARNING — does not block goal achievement, but the fix is trivial and should be done before Phase 2.

---

### Gaps Summary

One gap blocks the E2E acceptance test. One warning requires trivial remediation before Phase 2.

**Gap — E2E spec fails (match-winning numpad finish):** `handleNumpadVisit` in `match/+page.svelte` shows the darts-at-double dialog for every finishing visit — there is no distinction between a leg-winning and a match-winning finish. Plan 01-12 (Task 3) correctly deferred the NUMPAD_VISIT dispatch until after the dialog to record `dartsAtDouble` (INP-03), but did not add match-win suppression (described in the spec comment as if it exists). The E2E spec comment on line 96-97 claims the dialog is suppressed for match-winning visits — this is false and the test fails as a result. Confirmed by running the spec: exit code 1, `getByRole('heading', { name: /gewinnt!/ })` — element(s) not found.

**Fix options:**
- Option A (2 lines, minimal): add one click in the E2E spec after the final `Bestätigen` — `await page.getByRole('button', { name: '1 Dart' }).click()` — then assert the win overlay. Remove the stale comment.
- Option B (behavioral): implement match-win suppression in `handleNumpadVisit` by checking if the dispatch would produce `phase=match-complete` and dispatching immediately with `dartsAtDouble:0` in that case.

Option A is the lower-risk fix for Phase 1 close; Option B produces better UX (no dialog on the winning dart) and should be considered for a cleanup plan.

**Warning — Dartboard inner-bull flash (WR-02):** `Dartboard.svelte` lines 144-148 check `dart.segment === 50` before `dart.segment === 25`. Since `classifyHit` never produces `segment:50`, the `'inner-bull'` flash branch is unreachable dead code. Inner-bull taps trigger the `segment===25` branch and set `flashKey='outer-bull'`. The score is correct; only the visual flash is wrong. Fix: check `dart.segment === 25 && dart.multiplier === 2` for inner bull before the bare `dart.segment === 25` check. Two lines in `Dartboard.svelte`.

---

_Verified: 2026-06-11T02:40:00Z_
_Verifier: Claude (gsd-verifier)_
