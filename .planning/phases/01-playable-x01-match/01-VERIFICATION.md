---
phase: 01-playable-x01-match
verified: 2026-06-10T12:00:00Z
status: gaps_found
score: 2/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Player can enter each dart by tapping the on-screen dartboard (all segments reliably hittable by finger) or by typing a visit total on the numeric keypad; the visit auto-finalizes after 3 darts, a bust, or a leg win with a brief correction window"
    status: failed
    reason: "Three compounding defects make this truth false: (CR-01) the SVG viewBox is 0 0 400 400 with centre at (200,200) but the double ring extends to r=303–325 and the miss zone to r=390 — all of which lie outside the 400px box and are clipped/invisible, making every double segment physically untappable; (CR-03) CorrectionWindow has no ondismiss prop wired — the component dispatches CONFIRM_VISIT internally but has no way to tell the parent to clear pendingCorrection, so the overlay permanently covers the board/numpad after the first visit; (CR-04) the correction window's visit-detection $effect compares per-player visit count against a cross-player lastVisitCount, causing the window to appear only for the first visit of the entire match and never again."
    artifacts:
      - path: "src/ui/input/Dartboard.svelte"
        issue: "viewBox='0 0 400 400' clips the double ring (r=303-325), outer single, miss zone, and all segment labels. R_DOUBLE_END=325 > viewBox half-width=200."
      - path: "src/routes/match/+page.svelte"
        issue: "CorrectionWindow rendered at line 154-159 with no ondismiss prop. dismissCorrection() at line 95 is dead code — never called. The $effect at lines 66-93 updates lastVisitCount to a single player's count on first detection, then overwrites it to cross-player total, causing all subsequent visits to fail the > check."
      - path: "src/ui/input/CorrectionWindow.svelte"
        issue: "Props interface has no ondismiss callback. confirm() at line 54-57 dispatches CONFIRM_VISIT but cannot signal parent to hide itself."
    missing:
      - "Fix SVG viewBox to '-190 -190 780 780' (or scale all radii to fit within 400px)"
      - "Add ondismiss callback prop to CorrectionWindow and call it from confirm()"
      - "Pass dismissCorrection as ondismiss to <CorrectionWindow ondismiss={dismissCorrection} />"
      - "Fix per-player visit tracking in the $effect (use a Record<string, number> of per-player counts)"

  - truth: "A bust (all three conditions: score < 0, reaching 1 on double-out, finishing on non-double) reverts the full visit and passes the turn immediately"
    status: failed
    reason: "The bust engine logic itself is correct (isBust covers all three conditions). However the correction window defects (CR-03/CR-04) mean the turn does not visually pass: the stuck correction overlay permanently covers the scoring UI after the first bust. A player cannot see the next player's score or interact with the board. The experience is broken even if the underlying state machine handles bust correctly."
    artifacts:
      - path: "src/routes/match/+page.svelte"
        issue: "pendingCorrection is set correctly on bust (isBust: true) but is never cleared because dismissCorrection is never called, permanently covering the UI."
    missing:
      - "Resolved by the same CorrectionWindow ondismiss fix as above"

  - truth: "Player can undo any dart or completed visit, including a leg- or set-winning throw, without corrupting leg/set counts"
    status: failed
    reason: "Three issues: (CR-07) START_MATCH appends to the existing event log rather than starting a fresh one (reducer.ts line 53: const newLog = [...state.eventLog, action]), so UNDO at the start of match #2 replays match #1 and resurfaces the match-complete overlay. (WR-01) CONFIRM_VISIT is appended to the log, so the first UNDO press after a confirmed visit is a silent no-op (removes only the CONFIRM_VISIT no-op). The user must press twice to undo one dart. (CR-04) Correction window does not appear for visit 2+ so the user has no way to initiate undo mid-correction for those visits."
    artifacts:
      - path: "src/engine/reducer.ts"
        issue: "Line 53: const newLog = [...state.eventLog, action] applies to START_MATCH, carrying forward previous match log. Line 62-63: case 'CONFIRM_VISIT': return { ...state, eventLog: newLog } — CONFIRM_VISIT is a no-op appended to log, consuming one UNDO press."
    missing:
      - "In applyStartMatch, reset log: return { ..., eventLog: [action] }"
      - "For CONFIRM_VISIT, do not append to log: case 'CONFIRM_VISIT': return state"

  - truth: "Checkout suggestions appear for the next 1–3 darts when a finish is possible; bogey numbers and scores above 170 show no suggestion; the screen stays awake throughout the match"
    status: failed
    reason: "The checkout suggestion is computed from matchStore.remaining which returns the start-of-visit remaining (CR-06). During a dartboard visit after dart 1 or 2, the displayed score and suggestion both still reflect the pre-visit remaining. Example: player on 100 hits T20 — the panel still shows 100 and suggests 'T20 D20' rather than showing 40 and 'D20'. This violates the D-10 live-recalculation requirement. Additionally, IMPOSSIBLE_3DART is missing values 163 and 166 (CR-02), so those invalid totals are accepted by the numpad, corrupting match state."
    artifacts:
      - path: "src/stores/match.svelte.ts"
        issue: "get remaining() returns this.activePlayer?.remaining which is start-of-visit value, not live mid-visit remaining."
      - path: "src/engine/impossible-scores.ts"
        issue: "IMPOSSIBLE_3DART = new Set([169, 172, 173, 175, 176, 178, 179]) — missing 163 and 166. isValidVisitTotal(163) and isValidVisitTotal(166) both return true."
    missing:
      - "Fix MatchStore.remaining getter to subtract currentVisit scored total: base - currentVisit.reduce((s,d)=>s+d.multiplier*d.segment,0)"
      - "Add 163 and 166 to IMPOSSIBLE_3DART; update impossible-scores.test.ts accordingly"

  - truth: "Player can configure a 301/401/501 match with Single Out or Double Out, set the number of legs/sets, add 1–4 named or guest players, and enter the bull-off result to set starting order"
    status: failed
    reason: "Setup configuration (mode chips, out rule, legs/sets, guests) works. However, named player creation is impossible from the UI: ProfileManager is built and unit-tested but is not mounted in any route or component (CR-08). PlayerPicker reads from profilesLive() — a Dexie table that starts empty and can never be populated because there is no UI path to create a profile. The only usable player type is a guest. PROF-01 (create/edit/delete persistent profiles) is therefore unreachable in the running app."
    artifacts:
      - path: "src/ui/setup/ProfileManager.svelte"
        issue: "Grep shows this component is imported ONLY by ProfileManager.test.ts. Not mounted in MatchSetup.svelte, setup/+page.svelte, or any other route."
      - path: "src/ui/setup/MatchSetup.svelte"
        issue: "Imports only PlayerPicker, not ProfileManager. No mechanism for creating persistent profiles exists in setup flow."
    missing:
      - "Mount ProfileManager in MatchSetup.svelte or add a reachable profiles management section/route"

human_verification:
  - test: "On a real tablet (Chrome/Android) or Chrome DevTools touch emulation: tap the double ring of any segment and confirm the scored dart is recorded as a double."
    expected: "The double ring segments are visible and respond to touch — a tap on D20 records multiplier:2 segment:20. Currently the double ring is clipped outside the viewBox and physically unreachable."
    why_human: "ViewBox clipping is a rendering issue; verifying touch hit-detection in the double ring requires a real browser viewport."
  - test: "Play a 2-player match via the dartboard. Throw 3 darts for player 1, observe the correction window, wait 2.5s. Confirm the correction window disappears and player 2's turn becomes active."
    expected: "Correction window auto-dismisses after 2.5s and reveals the board for player 2. Currently the window never dismisses."
    why_human: "The dismissal defect is a timing and DOM-state issue; grep confirms no ondismiss wiring but the actual user experience needs human observation."
  - test: "After reaching the win overlay, click 'Neues Spiel', set up a second match, start it, and immediately press 'Rückgängig' once."
    expected: "Nothing visible happens (no pending darts to undo). Currently UNDO at the start of match #2 replays match #1's event log and restores the previous match-complete state."
    why_human: "Cross-match undo regression requires human interaction across multiple match lifecycles."
  - test: "Create a named player profile (not a guest) via the setup screen and add that named player to a match."
    expected: "A form or section exists in the setup flow to create, name, and save a persistent player profile. Currently no such UI exists in the running app — only guests can be added."
    why_human: "Requires interaction with the live app to confirm no profile-creation path exists in the UI."
---

# Phase 1: Playable X01 Match — Verification Report

**Phase Goal:** A full X01 match can be played from setup to finish in-browser by 1–4 players with touch input, correct bust handling, undo, and checkout suggestions
**Verified:** 2026-06-10T12:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Player can configure a match, add 1–4 named/guest players, enter bull-off order | FAILED | ProfileManager not mounted anywhere in src/ (CR-08). Named player creation is dead code. |
| 2 | Player can tap the board (all segments hittable) or use numpad; auto-finalize with correction window | FAILED | Double ring clipped outside SVG viewBox (CR-01). Correction window never dismisses (CR-03/CR-04). |
| 3 | Bust reverts full visit and passes turn | PARTIAL | Engine logic correct but correction window blocks UI access after first visit (CR-03/CR-04 compound). |
| 4 | Player can undo any dart/visit including leg-winning throws | FAILED | Event log not reset on START_MATCH (CR-07); CONFIRM_VISIT pollutes log eating one undo (WR-01). |
| 5 | Checkout suggestions update live; bogey/170+ show nothing; screen stays awake | FAILED | matchStore.remaining returns start-of-visit value not live mid-visit (CR-06). IMPOSSIBLE_3DART missing 163/166 (CR-02). |

**Score:** 0/5 truths fully verified (2 partial — engine logic correct but UI broken)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/ui/input/Dartboard.svelte` | STUB (rendered broken) | Exists, substantial, wired — but SVG viewBox clips the entire double ring and miss zone outside visible area. Double-out leg is physically unfinishable via board. |
| `src/ui/input/CorrectionWindow.svelte` | ORPHANED (missing wiring) | Exists, substantial — but parent passes no `ondismiss` prop. CONFIRM_VISIT fires but overlay is never cleared. Permanently covers UI after visit 1. |
| `src/ui/setup/ProfileManager.svelte` | ORPHANED | Exists (194 lines), tests pass — but not mounted in any route. Dead code from user's perspective. |
| `src/engine/impossible-scores.ts` | STUB (incorrect data) | Exists but IMPOSSIBLE_3DART missing values 163 and 166. Tests encode same incorrect set so pass. |
| `src/stores/match.svelte.ts` | STUB (stale getter) | Exists, wired — but `remaining` getter does not account for in-progress visit darts. |
| `src/engine/reducer.ts` | STUB (log not reset) | START_MATCH appends to existing log; CONFIRM_VISIT appended to log. Both break undo semantics. |
| `src/ui/input/Numpad.svelte` | ORPHANED (handleNumpadVisit) | Dispatches directly to matchStore, bypassing parent's handleNumpadVisit. DartsAtDoubleDialog can never appear. |
| `src/engine/bust.ts` | VERIFIED | All three bust conditions correctly implemented and tested. |
| `src/engine/checkout.ts` | VERIFIED | 170-entry table verified in code review; getSuggestion returns null for bogey numbers and >170. |
| `src/engine/rotation.ts` | VERIFIED | nextPlayerIndex and legStarterIndex correct. |
| `src/db/profiles.ts` | VERIFIED | createProfile/updateProfile/deleteProfile/listProfiles all implemented and tested. |
| `src/routes/bulloff/+page.svelte` | VERIFIED | Mounts BullOffOrder, dispatches START_MATCH. |
| `src/lib/wake-lock.svelte.ts` | VERIFIED | acquireWakeLock/releaseWakeLock exported; match route $effect wires visibilitychange. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Dartboard.svelte` | `match.svelte.ts` | dispatch DART_THROWN | WIRED | handlePointerDown calls matchStore.dispatch({type:'DART_THROWN',dart}) |
| `Dartboard.svelte` | `board.ts` | classifyHit + screenToBoard | WIRED | Line 139-140: classifyHit(r, angleDeg) called after screenToBoard |
| `match/+page.svelte` | `wake-lock.svelte.ts` | $effect acquire/release | WIRED | Lines 17-32: acquireWakeLock() on mount, visibilitychange handler |
| `CheckoutSuggestion.svelte` | `match.svelte.ts` | matchStore.suggestion | WIRED | Pattern confirmed by code review |
| `CorrectionWindow.svelte` | `match.svelte.ts` | dispatch CONFIRM_VISIT | PARTIAL | Dispatches internally — but no ondismiss to parent. Stuck overlay. |
| `Numpad.svelte` | `match/+page.svelte` | onconfirm callback | NOT_WIRED | Numpad dispatches directly to matchStore; handleNumpadVisit never called; DartsAtDoubleDialog dead code. |
| `ProfileManager.svelte` | `MatchSetup.svelte` | component mount | NOT_WIRED | ProfileManager not imported or rendered anywhere in production code. |
| `match.svelte.ts` | `reducer.ts` | reduce(this.state, action) | WIRED | Line 22: this.state = reduce(this.state, action) |
| `reducer.ts` | `bust.ts` | isBust() | WIRED | Lines 119: isBust(prevRemaining, dart, config.outRule) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `ScorePanel.svelte` | remaining per player | matchStore.state.players[].remaining | Yes — but stale mid-visit | HOLLOW: start-of-visit value shown during 3-dart visit |
| `CheckoutSuggestion.svelte` | matchStore.suggestion | getSuggestion(matchStore.remaining) | Stale input | HOLLOW: computed from stale remaining |
| `CorrectionWindow.svelte` | visitDarts, visitTotal | pendingCorrection.darts | Yes for board visits; empty array for numpad visits (CR-06 secondary) | PARTIAL |
| `ProfileManager.svelte` | profiles | profilesLive() Dexie liveQuery | Yes — real DB data | DISCONNECTED: component never rendered |

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| IMPOSSIBLE_3DART contains 163 | `grep -n "163" src/engine/impossible-scores.ts` | Not present in set | FAIL |
| IMPOSSIBLE_3DART contains 166 | `grep -n "166" src/engine/impossible-scores.ts` | Not present in set | FAIL |
| SVG viewBox fits double ring (r=325) | viewBox="0 0 400 400", CX=200, R_DOUBLE_END=325 | 325 > 200 — double ring clipped | FAIL |
| CorrectionWindow ondismiss prop | `grep "ondismiss" src/ui/input/CorrectionWindow.svelte` | No ondismiss in Props interface | FAIL |
| ProfileManager mounted in route/component | `grep -r "ProfileManager" src/` (production code) | Only in test file | FAIL |
| matchStore.remaining accounts for currentVisit | `get remaining()` in match.svelte.ts | Returns `this.activePlayer?.remaining` only | FAIL |
| START_MATCH resets event log | reducer.ts line 53 + applyStartMatch | newLog = [...state.eventLog, action] — log grows across matches | FAIL |
| Engine bust logic: isBust(0, {m:1,seg:25}, 'double') | bust.ts (from code review — not re-run) | Returns true (outer bull not a double) | PASS |
| Engine checkout: getSuggestion(169, 'double') === null | checkout.ts (from code review) | Returns null | PASS |

### Requirements Coverage

| Requirement | Plan | Status | Evidence |
|-------------|------|--------|---------|
| ENG-01 (301/401/501, Single/Double Out) | 01-02, 01-04 | PARTIAL | Engine logic correct; setup UI correct. Cannot verify for named players (ProfileManager dead). |
| ENG-02 (legs/sets config) | 01-02, 01-04 | VERIFIED | MatchSetup exposes legs/sets steppers; reducer handles correctly. |
| ENG-03 (1–4 players, turn rotation) | 01-02 | VERIFIED | nextPlayerIndex/legStarterIndex tested; reducer handles 1–4 players. |
| ENG-04 (bust revert + pass turn) | 01-02, 01-03 | PARTIAL | Engine correctly reverts state; UI blocked by stuck correction window. |
| ENG-05 (unlimited undo) | 01-02, 01-03 | FAILED | CONFIRM_VISIT pollutes log (WR-01); START_MATCH does not reset log (CR-07). |
| ENG-06 (bull-off order) | 01-04 | VERIFIED | BullOffOrder dispatches START_MATCH with order array. |
| ENG-07 (checkout suggestions) | 01-02, 01-03 | FAILED | matchStore.remaining stale mid-visit; suggestion computed from wrong value (CR-06). |
| INP-01 (board tap, all segments hittable) | 01-03 | FAILED | Double ring clipped outside SVG viewBox (CR-01). |
| INP-02 (numpad validation) | 01-02, 01-03 | FAILED | IMPOSSIBLE_3DART missing 163 and 166 (CR-02). |
| INP-03 (darts-at-double) | 01-03 | FAILED | Numpad dispatches directly; DartsAtDoubleDialog never shown (CR-05). |
| INP-04 (correction window) | 01-03 | FAILED | Window never dismisses (CR-03); appears only for first visit of match (CR-04). |
| INP-05 (wake lock) | 01-03 | VERIFIED | acquireWakeLock + visibilitychange wired in match route $effect. |
| FLOW-01 (full setup flow) | 01-04 | PARTIAL | Flow works for guests; named player creation is unreachable (CR-08). |
| PROF-01 (profile CRUD) | 01-04 | FAILED | ProfileManager implemented and tested but not mounted in any route (CR-08). |
| PROF-02 (guests not persisted) | 01-04 | VERIFIED | Guests use isGuest:true; no db.profiles write in guest path. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/impossible-scores.ts` | 11-13 | IMPOSSIBLE_3DART missing 163, 166 | BLOCKER | numpad accepts physically impossible totals, corrupting match state |
| `src/ui/input/Dartboard.svelte` | 163 | viewBox="0 0 400 400" with R_DOUBLE_END=325 | BLOCKER | Double ring clipped/invisible; double-out leg unfinishable via board |
| `src/routes/match/+page.svelte` | 154-159 | CorrectionWindow rendered without ondismiss | BLOCKER | Overlay permanently stuck after first visit |
| `src/routes/match/+page.svelte` | 66-93 | lastVisitCount cross-player tracking bug | BLOCKER | Correction window fires only for first match visit |
| `src/engine/reducer.ts` | 53 | START_MATCH appends to existing log | BLOCKER | UNDO at match start resurrects previous match |
| `src/ui/input/Numpad.svelte` | 32 | matchStore.dispatch called directly (no onconfirm callback) | BLOCKER | DartsAtDoubleDialog (INP-03) can never appear |
| `src/ui/setup/ProfileManager.svelte` | entire | Component not mounted in any route | BLOCKER | PROF-01 profile creation unreachable from UI |
| `src/stores/match.svelte.ts` | 30-32 | remaining getter omits currentVisit | WARNING | Checkout suggestions stale mid-visit; D-10 violated |
| `src/engine/reducer.ts` | 62-63 | CONFIRM_VISIT appended to log | WARNING | First UNDO after confirmed visit is a no-op |

No `TBD`, `FIXME`, or `XXX` markers found in phase files.

### Human Verification Required

#### 1. Double ring touch-hittability

**Test:** On a tablet or Chrome DevTools touch emulation, navigate to /match with a match started, tap the double ring of segment 20 (outermost ring), and observe whether a D20 is recorded.
**Expected:** D20 is recorded (multiplier:2, segment:20). Currently the double ring is rendered outside the SVG viewBox and is physically invisible and untappable.
**Why human:** ViewBox clipping must be confirmed in a live browser — a pointer event on a clipped SVG path may still fire at the SVG element level, but the scorecard review confirms the paths extend outside viewBox user space.

#### 2. Correction window auto-dismiss

**Test:** Play a 2-player match, throw 3 darts for player 1 (via numpad), observe the correction window, wait 3+ seconds without interacting.
**Expected:** Correction window disappears automatically and the board/numpad becomes available for player 2. Currently the window dispatches CONFIRM_VISIT but pendingCorrection is never cleared, so the overlay is permanent.
**Why human:** DOM state post-timeout dismissal is not verifiable by grep; the stuck state requires observing the rendered app.

#### 3. Named player creation

**Test:** Open the app at /setup and attempt to create a named (non-guest) persistent player profile.
**Expected:** A form or section exists to enter a name and save a profile to the database. Currently no such UI exists — PlayerPicker shows persisted profiles (always empty) and a guest button only.
**Why human:** UI path reachability requires a human to navigate the live app.

#### 4. Undo cross-match regression

**Test:** Complete a 1-leg match, navigate to 'Neues Spiel', set up a fresh match, and immediately press 'Rückgängig' once before throwing any dart.
**Expected:** Nothing happens (no darts to undo). Currently UNDO replays the previous match's event log, snapping back to match-complete state and re-showing the win overlay.
**Why human:** Cross-match state regression requires interacting across two full match lifecycles.

### Gaps Summary

Nine critical defects prevent the phase goal from being achieved. They fall into four root-cause groups:

**Group 1 — SVG Geometry (CR-01):** The dartboard `viewBox` is 400x400 with board centre at (200,200), but ring radii extend to 325 (double) and 390 (miss zone). Every coordinate with r > 200 is outside the viewBox and clipped. The double ring — required for Double Out, the default finish rule — is invisible and untappable by any real finger. The E2E test avoids this entirely by using numpad input.

**Group 2 — Correction Window (CR-03, CR-04):** CorrectionWindow has no `ondismiss` callback prop. After its 2.5s timer fires, it dispatches `CONFIRM_VISIT` to the reducer (which is correct) but cannot tell the parent to clear `pendingCorrection`, so the overlay is permanent. A separate `$effect` bug means the window only opens for the first visit of the match anyway. The E2E test masks both defects with `if (await overlay.isVisible()...)` conditional code.

**Group 3 — Undo reliability (CR-07, WR-01):** `START_MATCH` does not reset the event log — it appends to the existing log from the previous match. The first undo press in a new match replays the old match. Separately, `CONFIRM_VISIT` is a no-op that is appended to the log, making the first UNDO after any confirmed visit a silent no-op requiring a second press.

**Group 4 — Dead or missing features (CR-02, CR-05, CR-06, CR-08):** `IMPOSSIBLE_3DART` is missing values 163 and 166. The `Numpad` component dispatches directly to `matchStore` bypassing the parent's `handleNumpadVisit`, making the `DartsAtDoubleDialog` permanently dead code. `matchStore.remaining` returns the start-of-visit value rather than the live remaining, making checkout suggestions stale after dart 1 or 2 in a board visit. `ProfileManager` is fully implemented and tested but not mounted in any route — named player creation is unreachable.

---

_Verified: 2026-06-10T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
