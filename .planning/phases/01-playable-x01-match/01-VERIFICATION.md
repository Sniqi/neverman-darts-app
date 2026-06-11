---
phase: 01-playable-x01-match
verified: 2026-06-11T14:10:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "handleNumpadVisit now uses a side-effect-free trial reduce to detect prospective.phase === 'match-complete'; match-winning numpad finish dispatches immediately with dartsAtDouble:0; MatchWinOverlay owns the screen unobstructed (CR-01 from 01-REVIEW.md)"
    - "Dartboard.svelte flash logic: dead dart.segment === 50 branch removed; inner-bull taps now set flashKey='inner-bull' (multiplier===2 && segment===25); outer-bull taps set flashKey='outer-bull' (multiplier===1 && segment===25) (WR-02 from 01-REVIEW.md)"
    - "E2E happy-path spec: npx playwright test e2e/full-match-flow.spec.ts exits 0 (1 passed, 1.4s); win overlay heading /gewinnt!/ and Neues Spiel button both visible without any dialog click"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Start a 2-player match with 2 legs to win. Score player 1 down to a finishing numpad value (e.g. 32 for D16) and enter it. Observe: the darts-at-double dialog appears (leg win, but match continues). Click a dialog option (e.g. '1 Dart'). Observe the correction window briefly appears then auto-dismisses. Continue until one player wins both legs."
    expected: "Full 2-leg match completes end-to-end. Darts-at-double dialog appears for each leg-winning numpad visit that does NOT end the match. Win overlay appears with player name and Neues Spiel button when the final leg is won. Correction window appears and auto-dismisses (~2.5s) after each non-winning visit."
    why_human: "The E2E spec covers a 1-leg game only. Multi-leg flow — dialog on a continuing leg win, then win overlay on the match-winning leg — requires live browser interaction. Unit tests cover INP-03 correctness; this test confirms the full UI flow end-to-end."
  - test: "Start a match. Complete one 3-dart board visit. When the correction window appears, tap 'Korrigieren'. Then tap 'Fertig'."
    expected: "Correction window dismisses immediately; the next player's board is accessible. No overlay lock."
    why_human: "Covered by unit tests (CR-03) but real-browser confirmation ensures the Svelte lifecycle behaves correctly in production. The paused-state 'Fertig' button path was added in plan 01-11."
  - test: "Score a player down to exactly 50 remaining. Tap the inner bull (amber center circle). Observe which region flashes."
    expected: "The amber center circle (inner-bull region) flashes briefly. The score correctly deducts 50. If remaining was exactly 50, the win overlay appears."
    why_human: "The Dartboard flash logic fix (WR-02, plan 01-13) can only be confirmed visually in a real browser. The source code change is verified (multiplier===2 && segment===25 gates flashKey='inner-bull') but the correct visual behavior requires observation."
---

# Phase 1: Playable X01 Match — Re-Verification Report (Round 4)

**Phase Goal:** A full X01 match can be played from setup to finish in-browser by 1–4 players with touch input, correct bust handling, undo, and checkout suggestions
**Verified:** 2026-06-11T14:10:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure plan 01-13 (match-win dialog suppression + inner-bull flash fix, commits 914d39f and 1d8fa46)

---

## Previous Verification Summary

Previous verification (2026-06-11T02:40:00Z): status `gaps_found`, score `4/5`. One blocker gap remained: `handleNumpadVisit` showed the darts-at-double dialog for ALL numpad finishing visits including match-winning ones; the E2E happy-path spec failed (exit code 1, win overlay assertion timed out). One warning remained: inner-bull taps flashed the outer-bull ring due to dead `segment===50` branch.

**Both the gap and the warning are now closed.** Plan 01-13 (commits 914d39f, 1d8fa46) restored match-win dialog suppression via a trial reduce and fixed the flash logic to key off multiplier. The E2E spec passes (exit code 0, 1.4s). All 5 must-have truths are now verified. Three human verification items remain for real-browser confirmation.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player can configure a 301/401/501 match with Single Out or Double Out, set legs/sets, add 1–4 named or guest players, and enter the bull-off result to set starting order | VERIFIED | BullOffOrder.svelte: empty-order guard redirects to /setup (lines 122-126); confirm button `disabled={order.length === 0}` (line 178). reducer.ts lines 94-99: returns initialState() for empty player list. MatchSetup, PlayerPicker, ProfileManager all wired and unit-tested. |
| 2 | Player can enter each dart by tapping the on-screen dartboard or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a correction window | VERIFIED | Board tap (polar-math hit detection), numpad, and CorrectionWindow correct. match/+page.svelte line 6: `import { reduce }` from reducer; lines 116-124: trial reduce detects match-complete and dispatches immediately (no dialog); leg-winning non-match-ending finish still defers to dialog. E2E spec: `npx playwright test e2e/full-match-flow.spec.ts` — 1 passed (1.4s, exit 0). Unit suite: 162/162 pass. |
| 3 | A bust (score < 0, reaching 1 on double-out, finishing on non-double) reverts the full visit and passes the turn immediately | VERIFIED | board.ts line 44: `{ multiplier: 2, segment: 25 }` — 2×25=50 pts. bust.ts line 32: `multiplier === 2` only check. isBust(50, {m:2,s:25}, 'double') returns false. bust.test.ts and board.test.ts updated and passing. |
| 4 | Player can undo any dart or completed visit, including a leg- or set-winning throw, without corrupting leg/set counts | VERIFIED | reducer.ts: UNDO = reduce(initialState(), ...log.slice(0,-1)). START_MATCH resets log to [action]. CONFIRM_VISIT not in log. reducer.test.ts: undo-through-leg-win test passes. 162-test suite green. |
| 5 | Checkout suggestions appear for the next 1–3 darts when a finish is possible; bogey numbers and scores above 170 show no suggestion; the screen stays awake throughout the match | VERIFIED | ScorePanel.svelte line 16: `{isActive ? matchStore.remaining : player.remaining}`. matchStore.remaining getter subtracts currentVisit running total. CheckoutSuggestion consumes matchStore.suggestion (live remaining). match/+page.svelte: acquireWakeLock on mount + visibilitychange handler. Bull-route checkout suggestions (170/167/164/161/50) correct. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/routes/match/+page.svelte` | VERIFIED | `import { reduce }` at line 6. `handleNumpadVisit` trial reduce at line 116; `prospective.phase === 'match-complete'` check at line 117; immediate dispatch with `dartsAtDouble:0` at line 119; leg-win deferral (`showDartsAtDouble = true`) retained at lines 122-123. No `segment===50` references. |
| `src/ui/input/Dartboard.svelte` | VERIFIED | Flash logic lines 147-150: `dart.multiplier === 2 && dart.segment === 25` → `'inner-bull'`; `dart.multiplier === 1 && dart.segment === 25` → `'outer-bull'`. Dead `dart.segment === 50` branch absent (confirmed by grep: no matches). |
| `e2e/full-match-flow.spec.ts` | VERIFIED | Passes: exit 0, 1 passed (1.4s). Lines 96-97 comment accurately describes the real suppression behavior. No dialog click added; assertions unchanged. |
| `src/engine/board.ts` | VERIFIED | classifyHit inner-bull: `{multiplier:2,segment:25}` (2×25=50 pts). |
| `src/engine/bust.ts` | VERIFIED | Double-out finish check is `multiplier===2` only; `isBust(50,{m:2,s:25},'double')` returns false. |
| `src/ui/input/CorrectionWindow.svelte` | VERIFIED | `untrack(() => startTimer())` at line 83; `handleOutsideClick` unconditional confirm at line 72; `Fertig` button in paused branch at line 123; 6 unit tests all passing. |
| `src/ui/input/ScorePanel.svelte` | VERIFIED | Line 16: `{isActive ? matchStore.remaining : player.remaining}`. |
| `src/ui/setup/BullOffOrder.svelte` | VERIFIED | Empty-order guard; confirm button disabled when empty. |
| `src/engine/reducer.ts` | VERIFIED | Pure; returns initialState() for empty player list; used as side-effect-free trial reduce source. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `match/+page.svelte` | `reducer.ts` | `reduce(matchStore.state, NUMPAD_VISIT)` trial reduce — prospective.phase check | VERIFIED | Line 6 import; line 116 call; line 117 condition — read-only, never mutates matchStore.state |
| `match/+page.svelte` | `DartsAtDoubleDialog.svelte` | `showDartsAtDouble` only for leg-win non-match-ending | VERIFIED | Match-complete path skips dialog; only the else-branch at line 122-123 sets `showDartsAtDouble = true` |
| `Dartboard.svelte` | `board.ts` | classifyHit({m:2,s:25}) → 50 pts → flash 'inner-bull' | VERIFIED | Lines 147-148: multiplier===2 && segment===25 → flashKey='inner-bull' |
| `CorrectionWindow.svelte` | `match.svelte.ts` | dispatch CONFIRM_VISIT after timer | VERIFIED | Line 61: matchStore.dispatch({type:'CONFIRM_VISIT'}); untrack fix confirmed |
| `ScorePanel.svelte` | `match.svelte.ts` | matchStore.remaining (live mid-visit) | VERIFIED | Line 16: isActive ? matchStore.remaining : player.remaining |
| `CheckoutSuggestion.svelte` | `match.svelte.ts` | matchStore.suggestion (live remaining) | VERIFIED | Same source as ScorePanel — score and suggestion agree |
| `e2e/full-match-flow.spec.ts` | `match/+page.svelte` | Full flow: setup → bulloff → match → numpad → win overlay | VERIFIED | exit 0, 1 passed (1.4s) — win overlay heading and Neues Spiel button visible without dialog click |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ScorePanel.svelte` | `matchStore.remaining` (active) / `player.remaining` (inactive) | matchStore getter subtracts currentVisit | Yes — live mid-visit and committed post-visit | VERIFIED |
| `CheckoutSuggestion.svelte` | `matchStore.suggestion` | getSuggestion(matchStore.remaining) | Yes — live remaining, bull routes correct | VERIFIED |
| `CorrectionWindow.svelte` | `visitDarts`, `visitTotal`, `isBust` | pendingCorrection from +page.svelte $effect | Yes — last committed visit data | VERIFIED |
| `ProfileManager.svelte` | `profiles` | profilesLive() Dexie liveQuery | Yes — real IndexedDB data | VERIFIED |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| `reduce` imported in match/+page.svelte | `import { reduce }` at line 6 | Found | PASS |
| Trial reduce present in handleNumpadVisit | `reduce(matchStore.state` at line 116 + `prospective.phase === 'match-complete'` at line 117 | Found | PASS |
| Match-win dispatches immediately with dartsAtDouble:0 | `matchStore.dispatch({ type: 'NUMPAD_VISIT', total, dartsAtDouble: 0 })` at line 119 | Found | PASS |
| Leg-win deferral retained | `showDartsAtDouble = true` at line 123 in the else-branch | Found | PASS |
| Dead `dart.segment === 50` flash branch absent | grep `segment === 50` in Dartboard.svelte | No matches | PASS |
| Inner-bull flash branch correct | `dart.multiplier === 2 && dart.segment === 25` at line 147 → `flashKey = 'inner-bull'` | Found | PASS |
| Outer-bull flash branch correct | `dart.multiplier === 1 && dart.segment === 25` at line 149 → `flashKey = 'outer-bull'` | Found | PASS |
| E2E happy-path spec | `npx playwright test e2e/full-match-flow.spec.ts` | 1 passed (1.4s), exit 0 | PASS |
| Unit suite | `npx vitest run` | 11 files, 162 tests, all passed | PASS |
| Production build | `npx vite build` | built in 2.36s, wrote site to build/ | PASS |
| svelte-check (no new errors) | `npx svelte-check --threshold error` | 1 error in `src/db/profiles.ts` (pre-existing, out-of-scope per 01-07-SUMMARY) | PASS |
| No debt markers (TBD/FIXME/XXX) in modified files | grep on +page.svelte, Dartboard.svelte, full-match-flow.spec.ts | No matches | PASS |

### Requirements Coverage

| Requirement | Plan(s) | Status | Evidence |
|-------------|---------|--------|---------|
| ENG-01 (301/401/501, Single/Double Out) | 01-02, 01-04 | VERIFIED | Setup chips and out-rule control; reducer handles all start scores and outRules |
| ENG-02 (legs/sets config) | 01-02, 01-04 | VERIFIED | Steppers in MatchSetup; reducer handles legsToWin/setsToWin |
| ENG-03 (1–4 players, turn rotation) | 01-02 | VERIFIED | nextPlayerIndex/legStarterIndex tested; reducer handles 1–4 players |
| ENG-04 (bust revert + pass turn) | 01-02, 01-10 | VERIFIED | Engine logic correct for all three bust conditions including Bull finish from remaining=50 |
| ENG-05 (unlimited undo) | 01-02, 01-05 | VERIFIED | Log reset on START_MATCH; CONFIRM_VISIT not in log; UNDO replays cleanly |
| ENG-06 (bull-off order) | 01-04 | VERIFIED | BullOffOrder dispatches START_MATCH; 0-player guard present |
| ENG-07 (checkout suggestions) | 01-02, 01-08, 01-12 | VERIFIED | matchStore.suggestion uses live remaining; bull routes correct |
| INP-01 (board tap, all segments hittable) | 01-03, 01-06, 01-13 | VERIFIED | viewBox="-190 -190 780 780"; polar-math hit detection; inner-bull flash fix applied |
| INP-02 (numpad validation) | 01-02, 01-03 | VERIFIED | IMPOSSIBLE_3DART includes 163, 166 etc; isValidVisitTotal correct |
| INP-03 (darts-at-double) | 01-03, 01-12, 01-13 | VERIFIED | Dialog deferred for continuing leg wins; match-winning finish dispatches immediately with dartsAtDouble:0 per locked 01-07 decision (win overlay owns screen, no stats consumer in Phase 1) |
| INP-04 (correction window) | 01-03, 01-07, 01-11 | VERIFIED | Auto-dismiss fires once (untrack fix); paused state escapable (Fertig + outside-click); 6 unit tests passing |
| INP-05 (wake lock) | 01-03 | VERIFIED | acquireWakeLock + visibilitychange wired in match route $effect |
| FLOW-01 (full setup flow) | 01-04, 01-12, 01-13 | VERIFIED | E2E happy-path spec passes end-to-end (exit 0); 0-player navigation crash path closed |
| PROF-01 (profile CRUD) | 01-04 | VERIFIED | ProfileManager mounted in MatchSetup; createProfile/updateProfile/deleteProfile tested |
| PROF-02 (guests not persisted) | 01-04 | VERIFIED | Guests use isGuest:true; no db.profiles write in guest path |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No debt markers (TBD/FIXME/XXX) found in any file modified by plan 01-13 | — | — |

No blockers. The Dartboard flash warning (WR-02) from the previous report is fully resolved — dead `segment===50` branch removed, multiplier-keyed flash logic in place.

### Human Verification Required

#### 1. Multi-leg match with darts-at-double dialog on continuing legs

**Test:** Start a 2-player match with 2 legs to win. Score player 1 down to a finishing numpad value (e.g. 32 for D16) and enter it on the numpad. Press Bestätigen.
**Expected:** The darts-at-double dialog appears (this leg win does not end the match). Click a dialog option (e.g. '1 Dart'). The correction window briefly appears then auto-dismisses. Continue scoring. When one player wins the second leg, the win overlay appears with the player name and Neues Spiel button — no dialog blocks it.
**Why human:** The E2E spec covers a 1-leg game. The multi-leg flow — dialog on a continuing leg win, then match-win suppression on the final leg — requires live browser interaction to confirm end-to-end.

#### 2. CorrectionWindow paused-state escape in a real browser

**Test:** Start a match. After the first 3-dart board visit, tap 'Korrigieren' in the correction window. Then tap 'Fertig'.
**Expected:** Correction window dismisses immediately; the board is accessible for the next player. No overlay lock.
**Why human:** Unit tests cover the CR-03 fix but real-browser confirmation ensures the Svelte lifecycle behaves correctly under actual pointer events and rAF scheduling.

#### 3. Inner-bull flash region visual confirmation

**Test:** Score a player down to exactly 50 remaining. Tap the inner bull (amber center circle).
**Expected:** The amber center circle flashes briefly (inner-bull region). The score deducts 50. If remaining was 50, the win overlay appears.
**Why human:** The source code change is verified (multiplier===2 && segment===25 gates 'inner-bull') but correct visual flash behavior can only be confirmed in a real browser.

---

### Gaps Summary

No gaps. All 5 must-have truths are verified. The two blockers from the previous round (match-win dialog suppression, inner-bull flash region) are fully resolved by plan 01-13. The phase goal is met: a full X01 match can be played from setup to finish with correct bust handling, undo, and checkout suggestions.

Three items require human testing before the phase can be fully signed off — they are visual/interactive behaviors that automated checks cannot confirm.

---

_Verified: 2026-06-11T14:10:00Z_
_Verifier: Claude (gsd-verifier)_
