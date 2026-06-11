---
status: complete
phase: 02-spectator-display
source: [02-VERIFICATION.md]
started: 2026-06-11T18:55:28Z
updated: 2026-06-11T19:40:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Live BroadcastChannel sync in two real browser windows (DISP-05)
expected: Open /display in a second tab or window (do not reload it). Enter a dart on /match. The remaining score on /display decrements live within ~200 ms with no page navigation.
result: pass
verified_by: automated (Playwright two-tab, same browser context)
evidence: "/display opened before any dart; showed 501. Entered 180 on /match. /display updated 501 → 321 live via BroadcastChannel with NO reload (tab-switch only). Visit line '180' and 'Ø Leg 180.0' also synced. Confirms CR-01 ($state.snapshot) fix."

### 2. Leg-win banner appears without runtime crash (CR-02 / D-09)
expected: Play a match to a leg win. On /display a full-screen "Leg für [Name]!" banner appears. Browser console shows NO `effect_update_depth_exceeded` error. Banner dismisses on the first dart of the next leg.
result: pass
verified_by: automated (Playwright — played Gast 1 from 501 to 0, double-out via 141 finish + darts-at-double dialog)
evidence: "Full-screen amber banner 'Leg für Gast 1!' / '1 : 0 Legs' appeared; header advanced to Leg 2; Gast 1 → L:1; scores reset to 501. /display console error count = 0 (NO effect_update_depth_exceeded). Banner dismissed immediately when the first board dart (T20) of Leg 2 was thrown (currentVisit.length > 0). Confirms CR-02 (plain prevLegsWon/prevSetsWon) fix."

### 3. SpectatorChooser popup behavior in a real browser (DISP-01 / WR-02)
expected: In Chrome/Edge with popups allowed for localhost, click "Zweites Fenster öffnen". /display opens in a new window, the chooser menu closes, and "Bitte Popups für diese Seite erlauben" does NOT appear. The message appears only if the browser genuinely blocks the popup.
result: pass
verified_by: automated (Playwright — Chromium, popups allowed). Blocked-path (warning SHOULD appear when popups are genuinely blocked) still needs a one-time manual check in browser settings.
evidence: "Clicked monitor icon → 'Anzeigemodus' dialog opened with both options. Clicked 'Zweites Fenster öffnen' → new /display tab opened AND hydrated live state (Gast 2 = 441, Leg 2). Chooser menu closed automatically. 'Bitte Popups für diese Seite erlauben' did NOT appear. Confirms WR-02 (no noopener / win.opener=null) false-positive fix on the success path."

### 4. Tablet fullscreen prompt shows during an active match (DISP-02 implementation gap)
expected: After navigating to /display via "Anzeige hier im Vollbild" while a match is in progress (matchState.phase === 'playing'), the "Vollbild aktivieren" prompt OR the PC toggle in the top-right is sufficient to enter fullscreen. Confirm the user can reach fullscreen without returning to the idle screen.
result: issue
reported: "User judgment: the dedicated 'Vollbild aktivieren' prompt should ALSO appear during an active match, not only in idle/setup. Currently a tablet user mid-match sees only the small top-right PC toggle icon."
severity: minor
dom_facts: "Confirmed via DOM inspection during an active match: bottom '.fullscreen-prompt' (text 'Vollbild aktivieren') is NOT rendered; top-right '.fullscreen-toggle' icon IS present (aria-label 'Vollbild aktivieren'). In idle/setup state the bottom prompt DOES render. Root cause is the render condition at display/+page.svelte line 170."

### 5. End-of-phase spectator display visual review (Plan 02-04 Task 3, all 8 steps)
expected: |
  1. Open scoring view, start a match; tap monitor icon, choose "Zweites Fenster öffnen".
  2. Confirm TV grid: equal-split panels, active player clearly distinct (accent border + glow + brighter, others dimmed) from ~3 m.
  3. Enter darts: score counts down live mid-visit, darts fill "T20 - - -" one by one, checkout route shows on a finish, BUST flashes red ~2 s then reverts.
  4. Win a leg: full-screen "Leg für [Name]!" banner holds until next dart; win match: persistent "[Name] gewinnt!" display.
  5. Reload /display mid-match: re-hydrates current scoreboard.
  6. Open /display before match: idle screen auto-switches when match starts.
  7. Touch device or emulation: "Anzeige hier im Vollbild" → tap "Vollbild aktivieren" → true fullscreen → tap → "Zurück zur Eingabe" appears, auto-hides 3 s → tap returns to scoring.
  8. Confirm German copy and dark-mode legibility.
result: pass
verified_by: automated (Playwright) for 6/8 steps; user accepted auto-verification for the remaining human-eye items.
evidence: "Step 1 (TV grid equal-split panels) ✓. Step 2 (active player distinct: amber top border + brighter name/score; other dimmed) ✓ structurally — 3 m legibility accepted. Step 3 (live mid-visit countdown ✓, darts fill 'T20 · T20 · –' one-by-one ✓; checkout route verified on scoring view 'T20 T19 D12' @141, display uses same getSuggestion()). Step 4 (leg banner holds-until-next-dart ✓). Step 5 (reload re-hydrates mid-match → Gast 2 = 441, in-progress visit persisted ✓). Step 6 (idle 'Warte auf Match…' → auto-switch to live scoreboard on dart ✓). Step 8 (German copy throughout ✓; dark-mode high-contrast ✓). Accepted by user: 3 m legibility, real-tablet fullscreen+touch (step 7), match-win '… gewinnt!' visual, BUST red flash (step 3)."

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "On tablet, navigating to /display during an active match presents a clear, prominent way to enter fullscreen (DISP-02)."
  status: failed
  reason: "User reported: the dedicated 'Vollbild aktivieren' prompt is hidden during an active match (only the small top-right PC toggle is available); per user judgment the prompt should also appear during an active match."
  severity: minor
  test: 4
  root_cause: "src/routes/display/+page.svelte line 170 gates the .fullscreen-prompt on `!isFullscreen && (matchState === null || matchState.phase === 'setup')`, so the prominent prompt never renders while phase === 'playing'."
  artifacts:
    - path: "src/routes/display/+page.svelte"
      issue: "Fullscreen prompt render condition excludes active match"
  missing:
    - "Widen the .fullscreen-prompt render condition so it also appears during an active match (e.g. gate on !isFullscreen), without regressing the PC second-window experience (prompt should not obstruct the live scoreboard on a desktop second window)."
  debug_session: ""
