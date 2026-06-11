---
status: complete
phase: 01-playable-x01-match
source: [01-VERIFICATION.md]
started: 2026-06-11T12:15:00Z
updated: 2026-06-11T12:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Multi-leg match through darts-at-double dialog
expected: Start a 2-player match with 2 legs to win. Score player 1 down to a finishing numpad value (e.g. 32 for D16) and enter it — the darts-at-double dialog appears (leg win, but match continues). Click a dialog option (e.g. '1 Dart'); the correction window briefly appears then auto-dismisses. Continue until one player wins both legs — the win overlay appears with player name and Neues Spiel button, with no dialog blocking it.
result: pass
note: Auto-verified via Playwright (real Chromium, port 4173). 2-player 501 double-out match, first to 2 legs. Leg-1 win (numpad 16 at remaining 16): darts-at-double dialog appeared; clicked '1 Dart'; correction window appeared and auto-dismissed without interaction. Leg-2 match-winning visit: dialog suppressed (not visible 800ms after Bestätigen), win overlay "Gast 1 gewinnt!" and Neues Spiel button visible directly.

### 2. CorrectionWindow paused escape in browser
expected: Start a match. Complete one 3-dart board visit. When the correction window appears, tap 'Korrigieren', then tap 'Fertig'. The correction window dismisses immediately; the next player's board is accessible. No overlay lock.
result: pass
note: Auto-verified via Playwright. After a 3-dart board visit (3× inner bull, 501→351) the correction window appeared; 'Korrigieren' paused it (still open 3s later, past the auto-dismiss window); 'Fertig' dismissed it immediately; board remained accessible (next bull tap moved live remaining 351→301).

### 3. Inner-bull flash visual confirmation
expected: Score a player down to exactly 50 remaining. Tap the inner bull (amber center circle). The amber center circle (inner-bull region) flashes briefly — not the green outer-bull ring. The score correctly deducts 50 and the win overlay appears (remaining was exactly 50).
result: pass
note: Auto-verified via Playwright. Scored to exactly 50 via numpad (180+180+91), switched to board mode, tapped inner bull. During the 300ms flash the inner-bull circle fill read rgba(255,255,255,0.35) while the outer-bull ring stayed #1a5c2e (green, did not flash); fill reset to amber #e8a020 afterwards. The Bull finish from 50 registered as a valid double-out win — win overlay appeared.

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
