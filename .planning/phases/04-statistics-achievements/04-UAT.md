---
status: testing
phase: 04-statistics-achievements
source: [04-VERIFICATION.md]
started: 2026-06-12T17:20:00Z
updated: 2026-06-12T17:20:00Z
---

## Current Test

number: 1
name: Cross-window record overlay (180 on both views)
expected: |
  Both /match and /display show the "180!" overlay simultaneously; it disappears
  after ~2.5 s with no tap required; scoring continues normally underneath.
awaiting: user response

## Tests

### 1. Cross-window record overlay (180 on both views)
expected: Open /match in one window and /display in a second window. Score a 180. Both views show the "180!" overlay simultaneously; it auto-dismisses after ~2.5 s with no tap; play continues underneath.
result: [pending]

### 2. Record fold into win banner (D-08)
expected: Open /match + /display in two windows. Score a record on a leg-winning throw. The record folds into the LegWinBanner (badge below the subtitle) on both views; no separate RecordOverlay stacks on top.
result: [pending]

### 3. Lifetime dashboard chart legibility
expected: Open /stats, select a profile with >= 2 completed matches. The Score-Verteilung, Ø-Entwicklung, and Darts-pro-Leg charts render with correct German labels, amber accent, and are legible; < 2 data points shows the "Nicht genug Daten." empty state.
result: [pending]

### 4. Cross-leg average + breakdown in history
expected: Play a multi-leg match (e.g. best-of-3) to completion. Open History → that match. PlayerStatRow shows a real numeric cross-leg average (not "—"); MatchStatBreakdown shows per-player tiles (180er, 140+, 100+, 60+, Finish %, Höchste Aufnahme, Höchstes Finish, Bestes Leg).
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
