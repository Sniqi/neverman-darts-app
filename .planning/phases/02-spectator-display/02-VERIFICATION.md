---
phase: 02-spectator-display
verified: 2026-06-11T18:00:00Z
status: gaps_found
score: 3/4 roadmap success criteria verified
overrides_applied: 0
gaps:
  - truth: "Spectator window stays in sync live on every dart entry (DISP-05 live path)"
    status: failed
    reason: >
      ch.postMessage(this.state) in MatchStore.dispatch() posts a Svelte 5 $state proxy directly.
      The structured-clone algorithm throws DataCloneError on every dispatch. The surrounding
      try/catch swallows it silently. No message ever reaches the display page's BroadcastChannel
      listener. The e2e suite tests ONLY the localStorage snapshot hydration path (both tests
      open or reload the display page after the visit, never asserting a live update on an
      already-open window). Live sync has been dead since Plan 02 shipped.
    artifacts:
      - path: "src/stores/match.svelte.ts"
        issue: "Line 32: ch.postMessage(this.state) — this.state is a $state proxy; must be $state.snapshot(this.state)"
      - path: "e2e/spectator-sync.spec.ts"
        issue: "Neither test asserts live update without page navigation; broken live path cannot be caught by current suite"
    missing:
      - "Replace ch.postMessage(this.state) with ch.postMessage($state.snapshot(this.state)) in dispatch()"
      - "Add a live-sync e2e test: open /display, enter a dart on /match, assert updated score without reload"
  - truth: "Leg/set win banner and legWinMessage effect do not cause infinite update loop"
    status: failed
    reason: >
      src/routes/display/+page.svelte lines 34-35 declare prevLegsWon and prevSetsWon as $state([]).
      Lines 69-70 unconditionally reassign both with freshly created arrays at the end of every
      effect run. New array references always register as changed $state signals, which reschedule
      the same effect, which assigns new arrays again — an unbounded self-retriggering loop.
      Svelte 5 aborts with effect_update_depth_exceeded whenever matchState is non-null and not in
      'setup' phase, i.e. the normal operating state of the spectator display during any active match.
      After the effect errors the leg-win banner logic and all subsequent effect-driven updates stop.
      The e2e tests still pass because they assert static text after hydration, before effects fully
      flush into error state.
    artifacts:
      - path: "src/routes/display/+page.svelte"
        issue: "Lines 34-35: prevLegsWon and prevSetsWon declared as $state([]); lines 69-70 assign new arrays each run, causing infinite loop"
    missing:
      - "Change 'let prevLegsWon: number[] = $state([])' to 'let prevLegsWon: number[] = []' (plain variable, not reactive)"
      - "Change 'let prevSetsWon: number[] = $state([])' to 'let prevSetsWon: number[] = []' (plain variable, not reactive)"
human_verification:
  - test: "Verify live BroadcastChannel sync after fix"
    expected: "On /display (already open), entering a dart on /match updates the displayed remaining score within ~200ms without any page reload"
    why_human: "Requires two real browser windows or tabs open simultaneously; cannot verify without a running dev server"
  - test: "Verify leg-win banner appears without runtime crash"
    expected: "After winning a leg, a full-screen 'Leg für [Name]!' banner appears on /display; no console errors; banner dismisses on first dart of next leg"
    why_human: "effect_update_depth_exceeded is a runtime Svelte error visible in the browser console — requires running the app through a leg win"
  - test: "Verify SpectatorChooser popup-blocked behavior"
    expected: "Clicking 'Zweites Fenster öffnen' opens /display in a new window and the chooser menu closes; the 'Bitte Popups für diese Seite erlauben' message appears ONLY if the window was actually blocked, not on every successful open"
    why_human: "WR-02 from code review: window.open with noopener returns null even on success, so popupBlocked fires every time and close() is never called — requires human confirmation in a real browser (Chrome/Edge)"
  - test: "End-of-phase spectator display review (PLAN 02-04 Task 3)"
    expected: "All 8 verification steps from the plan's how-to-verify section pass: TV grid visible from 3m, active panel distinct, live dart-by-dart update, BUST flash, leg/match-win overlays, idle screen, tablet fullscreen, German copy"
    why_human: "Visual layout, readability at distance, touch behavior, fullscreen API, and font scale cannot be verified by static analysis"
---

# Phase 02: Spectator Display Verification Report

**Phase Goal:** A live spectator view shows all match state legibly on a 27" monitor from 3 m, opening as a second window on PC or as in-app fullscreen on tablet, and stays in sync automatically
**Verified:** 2026-06-11T18:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | On PC, player can click a button to open the spectator view as a second browser window | VERIFIED | SpectatorChooser.svelte mounted in match/+page.svelte (lines 15, 201); window.open(`${base}/display`, '_blank', 'noopener,noreferrer') in openSecondWindow(). NOTE: popup-blocked detection fires incorrectly on every successful open (WR-02 / see human verification) |
| SC-2 | On tablet, player can switch to fullscreen display view showing all match state | VERIFIED | display/+page.svelte has Vollbild aktivieren prompt + activateFullscreen() handler; SpectatorChooser "Anzeige hier im Vollbild" navigates to /display; Zurück zur Eingabe button exits and returns to /match |
| SC-3 | Spectator view is readable from 3 m, correct 1–4 player layouts | VERIFIED (automated) | PlayerPanel.svelte: remaining score clamp(4rem,8vw,12rem), player name clamp(1.5rem,3vw,4rem); panels-grid repeat(var(--player-count),1fr); dark background #111318; active panel accent border + glow; DISP-04 layout correct |
| SC-4 | Spectator window updates live on every dart and re-syncs on reload | FAILED — BLOCKER | Live BroadcastChannel path broken (CR-01). localStorage reload path works. See Gaps. |

**Score: 3/4 roadmap success criteria verified (1 FAILED — BLOCKER)**

### Requirement Coverage

| Requirement | Description | Status | Evidence / Gap |
|-------------|-------------|--------|----------------|
| DISP-01 | PC second window | VERIFIED with WARNING | SpectatorChooser.svelte present and mounted; window.open with noopener. WR-02: popup-blocked detection always fires (noopener returns null on success). Human verification required. |
| DISP-02 | Tablet fullscreen view | VERIFIED | requestFullscreen() from click handlers; Zurück zur Eingabe exit; tablet prompt on idle screen |
| DISP-03 | Display shows scores, legs/sets, names, active player, last visit, leg avg, match avg | VERIFIED | PlayerPanel: name, liveRemaining, legsWon/setsWon, legAvg, matchAvg, checkoutRoute, VisitLine; MatchHeader: mode/format/leg bar |
| DISP-04 | Readable from 3 m, 1–4 player layouts | VERIFIED (automated) | clamp() typography; dark mode; equal-fraction grid; active highlight. Full visual confirmation human-only. |
| DISP-05 | Live sync + auto re-sync on reload | FAILED — BLOCKER | Live BroadcastChannel path broken (CR-01 confirmed). Re-sync on reload/reopen works via localStorage. "Updates live on every dart" is not satisfied. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/averages.ts` | legAverage, matchAverage, computeAverage | VERIFIED | All three exports present; bust/numpad = 3 darts convention implemented (note WR-05: bust visits with 1-2 darts not counted as 3 — data accuracy gap, not a phase-goal blocker) |
| `src/engine/types.ts` | legStartVisitIndex on MatchState | VERIFIED | Field present at line 44 as `Record<string, number>` |
| `src/stores/display.svelte.ts` | DisplayStore with localStorage hydration + BroadcastChannel subscriber | VERIFIED (subscriber wired; publisher broken) | connect() hydrates from localStorage correctly; BroadcastChannel listener registered; publisher in match.svelte.ts posts a proxy (CR-01) |
| `src/stores/match.svelte.ts` | BroadcastChannel publisher + localStorage snapshot in dispatch() | STUB — broken | Publisher exists but posts Svelte $state proxy; DataCloneError silently swallowed; no messages delivered |
| `src/routes/display/+page.svelte` | Spectator route shell | VERIFIED with BLOCKER | Route exists; connects displayStore; renders TV grid; idle/active branch; BUT leg-win $effect has infinite loop (CR-02) |
| `src/ui/display/PlayerPanel.svelte` | One player column with all display data | VERIFIED | Props-driven; name, liveRemaining, legs/sets, averages, checkout, VisitLine, BUST flash |
| `src/ui/display/MatchHeader.svelte` | Slim header bar | VERIFIED | 40px bar; mode, out rule, format, current leg |
| `src/ui/display/IdleScreen.svelte` | Warte auf Match… waiting screen | VERIFIED | "Neverman Darts" + "Warte auf Match…" centered on dark background |
| `src/ui/display/VisitLine.svelte` | Live dart slots + completed visit line | VERIFIED | Three-slot live line; formatDart from VisitStrip; numpad total-only path |
| `src/ui/display/LegWinBanner.svelte` | Full-screen leg/set win banner | VERIFIED (component) | Prop-driven; message/subtitle; accent color; fixed overlay z-10. Infinite loop in parent effect (CR-02) prevents correct delivery during match. |
| `src/ui/display/MatchWinDisplay.svelte` | Persistent match winner display | VERIFIED (component) | Winner name, standing, per-player matchAverage |
| `src/ui/display/SpectatorChooser.svelte` | Monitor icon + chooser menu | VERIFIED with WARNING | Present; noopener/noreferrer; both options wired. WR-02: popup detection broken. |
| `e2e/spectator-sync.spec.ts` | DISP-05 e2e now green | PARTIAL | Both tests pass but only verify localStorage snapshot path; live BroadcastChannel path untested and broken |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/stores/match.svelte.ts` dispatch() | BroadcastChannel('neverman-match').postMessage | `ch.postMessage(this.state)` | BROKEN | Posts raw $state proxy; DataCloneError on every call; silently swallowed by try/catch |
| `src/stores/match.svelte.ts` dispatch() | localStorage('neverman-match-snapshot') | `localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state))` | WIRED | Works correctly; JSON.stringify serializes the proxy value |
| `src/routes/display/+page.svelte` | displayStore.connect() | `$effect(() => displayStore.connect())` | WIRED | Line 17; cleanup returned and used |
| `src/routes/display/+page.svelte` | leg-win $effect | `prevLegsWon = $state([])` + reassign | BROKEN | Infinite update loop (CR-02); effect_update_depth_exceeded |
| `src/ui/display/PlayerPanel.svelte` | averages.ts | legAverage / matchAverage | WIRED | Lines 31-38; correct slicing with legStartIndex |
| `src/ui/display/PlayerPanel.svelte` | checkout.ts getSuggestion() | line 45 | WIRED | getSuggestion(liveRemaining, config.outRule) |
| `src/ui/display/SpectatorChooser.svelte` | window.open | `window.open(..., 'noopener,noreferrer')` | WIRED (broken null check) | Opens window correctly; null-check always fires positive due to noopener spec behavior |
| `src/routes/match/+page.svelte` | SpectatorChooser | imported and rendered line 201 | WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `display/+page.svelte` | matchState | displayStore.state via localStorage hydration | Yes (on mount/reload) | FLOWING (snapshot path) |
| `display/+page.svelte` | matchState | displayStore.state via BroadcastChannel | No — DataCloneError swallowed | DISCONNECTED (live path) |
| `PlayerPanel.svelte` | liveRemaining | player.remaining from synced MatchState | Yes (from snapshot) | FLOWING (snapshot only) |

### Behavioral Spot-Checks

Step 7b skipped for the /display route rendering path — requires a running dev server with two open windows to observe BroadcastChannel behavior. Observable static checks performed instead:

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| postMessage posts serializable value | `grep -n "postMessage" src/stores/match.svelte.ts` | `ch.postMessage(this.state)` — raw proxy, no snapshot() | FAIL |
| prevLegsWon is plain variable | `grep -n "prevLegsWon.*state" src/routes/display/+page.svelte` | `let prevLegsWon: number[] = $state([])` — is $state | FAIL |
| No {@html} in display components | `grep -rn "{@html" src/ui/display/` | 0 matches | PASS |
| SpectatorChooser mounted | `grep -n "SpectatorChooser" src/routes/match/+page.svelte` | Lines 15 (import) and 201 (render) | PASS |
| requestFullscreen in display route | `grep -n "requestFullscreen" src/routes/display/+page.svelte` | Lines 93, 98 from click handlers | PASS |
| panels-grid equal-fraction layout | `grep -n "repeat(var(--player-count)" src/routes/display/+page.svelte` | Line 195 | PASS |
| legStartVisitIndex in reducer | `grep -n "legStartVisitIndex" src/engine/reducer.ts` | Lines 39, 102–116, 308, 345 — set at initialState, applyStartMatch, handleLegWin | PASS |

### Critical Findings from Code Review — Independent Verification

#### CR-01: BroadcastChannel live sync silently dead (CONFIRMED BLOCKER)

**Codebase evidence:**
- `src/stores/match.svelte.ts` line 32: `ch.postMessage(this.state)`
- `this.state` is declared as `state = $state<MatchState>(initialState())` (class field, Svelte 5 reactive proxy)
- No `$state.snapshot()` call anywhere in this file
- `try/catch` at lines 30-37 silently swallows the DataCloneError
- `e2e/spectator-sync.spec.ts` header comment (lines 8-14) explicitly documents the workaround: "the reliable path for DISP-05 is the localStorage snapshot handshake" — the test file itself documents the bug symptom
- Neither e2e test asserts live update without page navigation

**Verdict: CONFIRMED BLOCKER.** The phase goal states "stays in sync automatically" — the automatic live-sync path is dead. Only the snapshot-on-reload path works. DISP-05 "updates live on every dart entry" is not satisfied.

**Fix:** `ch.postMessage($state.snapshot(this.state))` — `$state.snapshot()` is the documented Svelte 5 escape hatch for passing runes state to structuredClone/postMessage.

#### CR-02: Infinite $effect update loop on leg-win watcher (CONFIRMED BLOCKER)

**Codebase evidence:**
- `src/routes/display/+page.svelte` lines 34-35: `let prevLegsWon: number[] = $state([])` and `let prevSetsWon: number[] = $state([])`
- Lines 69-70: `prevLegsWon = s.players.map(p => p.legsWon)` and `prevSetsWon = s.players.map(p => p.setsWon)` inside the same `$effect`
- `.map()` creates a new array reference on every call
- New array reference on a `$state` variable registers as changed and reschedules the effect
- The effect body accesses `prevLegsWon` (lines 49, 52, 58) — reading reactive state that the same effect writes
- Result: effect_update_depth_exceeded whenever matchState is non-null and phase is not 'setup'
- e2e tests assert text content after hydration; Svelte effects flush after DOM assertions in Playwright, so the loop does not affect test assertions but would crash a real browser session

**Verdict: CONFIRMED BLOCKER.** The leg-win banner (D-09) never fires correctly during a live match. After the error, all effect-driven updates on the display route stop.

**Fix:** Declare as plain variables: `let prevLegsWon: number[] = []` and `let prevSetsWon: number[] = []`.

#### WR-02: popup-blocked detection fires on every successful window.open (CONFIRMED WARNING)

**Codebase evidence:**
- `src/ui/display/SpectatorChooser.svelte` line 26: `window.open(\`${base}/display\`, '_blank', 'noopener,noreferrer')`
- Lines 27-31: `if (!win) { popupBlocked = true; } else { close(); }`
- Per HTML spec (and Chrome/Edge/Firefox): when `noopener` is in the features string, `window.open` returns `null` even when the window opens successfully
- The `else { close(); }` branch is therefore unreachable — the chooser menu never auto-closes after a successful open
- "Bitte Popups für diese Seite erlauben" message appears on every successful open

**Verdict: CONFIRMED WARNING.** DISP-01 functionality is degraded — the window opens but the UX is broken (false error message, menu stays open).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/stores/match.svelte.ts` | 32 | `ch.postMessage(this.state)` — posts Svelte $state proxy | BLOCKER | Live BroadcastChannel sync never delivers; DataCloneError silently swallowed |
| `src/routes/display/+page.svelte` | 34-35 | `prevLegsWon/prevSetsWon` declared as `$state` but written inside their own $effect | BLOCKER | Infinite effect_update_depth_exceeded loop whenever a match is active |
| `src/ui/display/SpectatorChooser.svelte` | 27 | `if (!win)` null-check after `window.open(..., 'noopener,...')` | WARNING | noopener always returns null; popup-blocked message fires on success; menu never closes |
| `src/engine/averages.ts` | 19 | `v.darts.length > 0 ? v.darts.length : 3` — bust with 1-2 darts counted as 1-2 | WARNING | Averages inflated for early-bust visits; not a phase-goal blocker (Phase 4 refines stats) |

### Human Verification Required

#### 1. Live BroadcastChannel sync after CR-01 fix

**Test:** After applying the $state.snapshot() fix, open /display in a second tab. Enter a dart on /match. Without reloading or reopening /display, observe whether the remaining score on /display updates within ~200ms.
**Expected:** Remaining score on /display decrements live without any page navigation.
**Why human:** Requires two live browser windows; the live-update path cannot be verified by static analysis or file checks.

#### 2. Leg-win banner after CR-02 fix

**Test:** Play a match to a leg win. Observe the /display tab.
**Expected:** Full-screen "Leg für [Name]!" banner appears; browser console shows no `effect_update_depth_exceeded` error; banner dismisses when the first dart of the next leg is thrown.
**Why human:** Runtime Svelte error requires a running browser session; cannot be caught by grep or type-check.

#### 3. SpectatorChooser popup-blocked behavior

**Test:** In Chrome, with popups allowed for localhost, click "Zweites Fenster öffnen" in the chooser.
**Expected:** A second window opens at /display, the chooser menu closes, and "Bitte Popups für diese Seite erlauben" does NOT appear.
**Why human:** WR-02 behavior is browser-spec-dependent (noopener + window.open return value); requires a real browser. Needs WR-02 fix before this step will pass.

#### 4. End-of-phase spectator display visual review (from Plan 02-04 Task 3)

**Test:** `npm run dev`. Walk through all 8 steps from Plan 02-04 Task 3:
1. Open scoring view, start a match; tap monitor icon, choose "Zweites Fenster öffnen"
2. Confirm TV grid: equal-split panels, active player clearly distinct (accent border + glow + brighter, others dimmed) from ~3 m
3. Enter darts: score counts down live mid-visit, darts fill "T20 · – · –" one by one, checkout route shows on a finish, BUST flashes red ~2 s then reverts
4. Win a leg: full-screen "Leg für [Name]!" banner holds until next dart; win match: persistent "[Name] gewinnt!" display
5. Reload /display mid-match: re-hydrates current scoreboard
6. Open /display before match: idle screen auto-switches when match starts
7. Touch device / emulation: "Anzeige hier im Vollbild" → tap "Vollbild aktivieren" → true fullscreen → tap → "Zurück zur Eingabe" appears, auto-hides 3s → tap returns to scoring
8. Confirm German copy and dark-mode legibility
**Expected:** All 8 steps pass.
**Why human:** Visual layout at distance, touch interaction, fullscreen API, animation timings, font scale legibility — none verifiable by static analysis.

### Gaps Summary

Two blockers prevent the phase goal from being fully achieved:

**Blocker 1 (CR-01) — Live BroadcastChannel sync broken:** `MatchStore.dispatch()` posts a Svelte 5 `$state` reactive proxy to `BroadcastChannel.postMessage()`. The structured-clone algorithm throws `DataCloneError` on every call. The `try/catch` swallows it silently. The spectator display receives no live updates — it only shows fresh state via the localStorage snapshot when the page is opened or reloaded. The phase goal "stays in sync automatically" and DISP-05 "updates live on every dart entry" are not met. The e2e test suite documented this workaround explicitly in the file header and tests only the snapshot path.

**Blocker 2 (CR-02) — Infinite effect loop on leg-win watcher:** `prevLegsWon` and `prevSetsWon` are declared as `$state` reactive variables but are unconditionally reassigned with new arrays at the end of every run of the `$effect` that reads them. Svelte 5 raises `effect_update_depth_exceeded` and aborts reactivity on the display route during any active match. The leg-win banner (D-09) cannot function.

Both fixes are surgical one-liners:
1. `ch.postMessage($state.snapshot(this.state))` in `match.svelte.ts`
2. `let prevLegsWon: number[] = []` and `let prevSetsWon: number[] = []` in `display/+page.svelte`

An additional warning (WR-02) requires the `SpectatorChooser` popup-blocked detection to be corrected: open without noopener in features string (null the opener reference manually), or keep noopener and remove the null-check with a different detection approach.

After fixes, all four human verification items above must be confirmed before the phase can be marked passed.

---

_Verified: 2026-06-11T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
