---
status: testing
phase: 03-persistence-data
source: [03-VERIFICATION.md]
started: 2026-06-12T04:20:00Z
updated: 2026-06-12T04:20:00Z
---

## Current Test

number: 1
name: Resume prompt UI and Fortsetzen UX
expected: |
  Play a match partway, close the tab, reopen to /. "Laufendes Spiel fortsetzen?"
  card appears above the menu with the correct match info line; "Fortsetzen" navigates
  to /match with the exact remaining score; layout and touch-target sizes are correct
  on a tablet viewport.
awaiting: user response

## Tests

### 1. Resume prompt UI and Fortsetzen UX
expected: "Laufendes Spiel fortsetzen?" card with correct info line; Fortsetzen restores exact remaining score at /match; tablet layout + touch targets correct
result: [pending]

### 2. Match-Verlauf after completing a match
expected: Completed match at top of /history newest-first; date, result (e.g. "3:1"), winner name in amber (#e8a020), loser in white, format subtitle; row taps open detail
result: [pending]

### 3. Match detail — scoreboard and average display
expected: Winner card darker (#22242d), non-winner (#1e2027); winner name amber/600; singular/plural leg labels; single-leg shows numeric average, multi-leg shows "—"
result: [pending]

### 4. Delete a match from history
expected: "Spiel löschen" opens ConfirmDialog (heading "Spiel löschen?", red "Löschen"); cancel returns unchanged; confirm navigates to /history with match removed; Escape DOES close (backdropDismiss=true for delete — intentional, unlike import)
result: [pending]

### 5. Verwerfen on start screen clears the resume slot
expected: Clicking Verwerfen hides the resume card immediately; a subsequent reload of / shows no resume prompt
result: [pending]

### 6. Export backup file download
expected: "Exportieren" downloads "neverman-backup-YYYY-MM-DD.json" containing profiles + matches; "Exportiere…" disabled state briefly visible
result: [pending]

### 7. Import: valid file → replace-all
expected: Selecting a valid Neverman backup opens "Daten ersetzen?" ConfirmDialog; confirming shows "Import abgeschlossen." (aria-live); history + profiles reflect the imported file
result: [pending]

### 8. Import: foreign/corrupt file → inline error, no dialog
expected: Selecting a random .json shows "Diese Datei gehört nicht zu Neverman Darts." inline in red below "Datei auswählen"; no ConfirmDialog; no data changed
result: [pending]

### 9. Storage warning banner (conditional — requires >80% storage)
expected: Amber-tint banner at bottom of Daten screen: "Speicher fast voll ([n]% belegt). Bitte Daten exportieren und alte Matches löschen."
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps
