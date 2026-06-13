---
status: passed
phase: 04-statistics-achievements
source: [04-VERIFICATION.md]
started: 2026-06-12T17:20:00Z
updated: 2026-06-12T19:15:00Z
---

## Current Test

All tests passed — user approved on 2026-06-12.

During UAT the user found a record-celebration defect ("Neuer Rekord: Höchste Aufnahme"
re-fired on every visit above the START-of-match best). Fixed in commit ca5b7ff: the
in-match record baseline now advances, so a record celebrates only once per genuine new
best (the "180!" milestone per D-04 is unchanged). Re-tested and approved.

## Tests

### 1. Cross-window record overlay (180 on both views)
expected: Open /match in one window and /display in a second window. Score a 180. Both views show the "180!" overlay simultaneously; it auto-dismisses after ~2.5 s with no tap; play continues underneath.
result: pass

### 2. Record fold into win banner (D-08)
expected: Open /match + /display in two windows. Score a record on a leg-winning throw. The record folds into the LegWinBanner (badge below the subtitle) on both views; no separate RecordOverlay stacks on top.
result: pass

### 3. Lifetime dashboard chart legibility
expected: Open /stats, select a profile with >= 2 completed matches. The Score-Verteilung, Ø-Entwicklung, and Darts-pro-Leg charts render with correct German labels, amber accent, and are legible; < 2 data points shows the "Nicht genug Daten." empty state.
result: pass

### 4. Cross-leg average + breakdown in history
expected: Play a multi-leg match (e.g. best-of-3) to completion. Open History → that match. PlayerStatRow shows a real numeric cross-leg average (not "—"); MatchStatBreakdown shows per-player tiles (180er, 140+, 100+, 60+, Finish %, Höchste Aufnahme, Höchstes Finish, Bestes Leg).
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
