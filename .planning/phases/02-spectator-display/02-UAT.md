---
status: testing
phase: 02-spectator-display
source: [02-VERIFICATION.md]
started: 2026-06-11T18:55:28Z
updated: 2026-06-11T18:55:28Z
---

## Current Test

number: 1
name: Live BroadcastChannel sync in two real browser windows (DISP-05)
expected: |
  Run `npm run dev`. Open /match, start a match, open /display in a second tab/window
  (do NOT reload it). Enter a dart on /match. The remaining score on /display decrements
  live within ~200 ms with no page navigation.
awaiting: user response

## Tests

### 1. Live BroadcastChannel sync in two real browser windows (DISP-05)
expected: Open /display in a second tab or window (do not reload it). Enter a dart on /match. The remaining score on /display decrements live within ~200 ms with no page navigation.
result: [pending]

### 2. Leg-win banner appears without runtime crash (CR-02 / D-09)
expected: Play a match to a leg win. On /display a full-screen "Leg für [Name]!" banner appears. Browser console shows NO `effect_update_depth_exceeded` error. Banner dismisses on the first dart of the next leg.
result: [pending]

### 3. SpectatorChooser popup behavior in a real browser (DISP-01 / WR-02)
expected: In Chrome/Edge with popups allowed for localhost, click "Zweites Fenster öffnen". /display opens in a new window, the chooser menu closes, and "Bitte Popups für diese Seite erlauben" does NOT appear. The message appears only if the browser genuinely blocks the popup.
result: [pending]

### 4. Tablet fullscreen prompt shows during an active match (DISP-02 implementation gap)
expected: After navigating to /display via "Anzeige hier im Vollbild" while a match is in progress (matchState.phase === 'playing'), the "Vollbild aktivieren" prompt OR the PC toggle in the top-right is sufficient to enter fullscreen. Confirm the user can reach fullscreen without returning to the idle screen. (The "Vollbild aktivieren" prompt is conditionally rendered only when matchState is null or phase === 'setup' — display/+page.svelte ~line 170; judge whether the PC toggle fallback meets DISP-02's intent.)
result: [pending]

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
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
