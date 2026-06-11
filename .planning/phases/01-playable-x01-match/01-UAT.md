---
status: testing
phase: 01-playable-x01-match
source: [01-VERIFICATION.md]
started: 2026-06-11T12:15:00Z
updated: 2026-06-11T12:15:00Z
---

## Current Test

number: 1
name: Multi-leg match through darts-at-double dialog
expected: |
  Full 2-leg match completes end-to-end. Darts-at-double dialog appears for each leg-winning numpad visit that does NOT end the match. Win overlay appears with player name and Neues Spiel button when the final leg is won. Correction window appears and auto-dismisses (~2.5s) after each non-winning visit.
awaiting: user response

## Tests

### 1. Multi-leg match through darts-at-double dialog
expected: Start a 2-player match with 2 legs to win. Score player 1 down to a finishing numpad value (e.g. 32 for D16) and enter it — the darts-at-double dialog appears (leg win, but match continues). Click a dialog option (e.g. '1 Dart'); the correction window briefly appears then auto-dismisses. Continue until one player wins both legs — the win overlay appears with player name and Neues Spiel button, with no dialog blocking it.
result: [pending]

### 2. CorrectionWindow paused escape in browser
expected: Start a match. Complete one 3-dart board visit. When the correction window appears, tap 'Korrigieren', then tap 'Fertig'. The correction window dismisses immediately; the next player's board is accessible. No overlay lock.
result: [pending]

### 3. Inner-bull flash visual confirmation
expected: Score a player down to exactly 50 remaining. Tap the inner bull (amber center circle). The amber center circle (inner-bull region) flashes briefly — not the green outer-bull ring. The score correctly deducts 50 and the win overlay appears (remaining was exactly 50).
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
