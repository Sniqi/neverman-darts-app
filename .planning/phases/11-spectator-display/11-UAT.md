---
status: testing
phase: 11-spectator-display
source: [11-VERIFICATION.md]
started: 2026-07-14T06:30:00Z
updated: 2026-07-14T06:30:00Z
---

## Current Test

number: 1
name: Restyled Display rendert korrekt auf dem echten Chromecast (Chrome 90 @ 1280×720)
expected: |
  Cast von /match starten. Auf dem TV: Player-Panels mit DS-Gradients, Amber-Edge/Glow beim aktiven Spieler,
  inaktive Panels gedimmt (55%), Header mit Amber-Rule + Bloom + ●-Separatoren, History-Zeilen mit korrektem
  Spacing (kein kollabiertes Layout), Riesen-Score lesbar. Kein Layout-Bruch.
awaiting: user response

## Tests

### 1. Receiver-Rendering (DISP-03)
expected: Panels/Header/Typo wie oben; History-Zeilen-Spacing intakt (CR-01-Fix); nichts unter ~34px; keine kaputten Klammern/Umbrüche bei 1280×720
result: [pending]

### 2. Live-Sync während des Spiels (DISP-04)
expected: Score-Updates erscheinen live auf dem TV nach jeder Aufnahme; aktiver Spieler wechselt korrekt (Amber-Treatment folgt)
result: [pending]

### 3. Idle-Screen (DISP-04)
expected: Vor Match-Start / nach Match-Ende zeigt der Receiver den Idle-Screen wie zuvor (dvh-Fix aus Phase 8 aktiv)
result: [pending]

### 4. Leg-/Set-Banner + Win-Overlay (DISP-04)
expected: Leg-Gewinn-Banner und Match-Win-Anzeige erscheinen und verschwinden wie vor dem Restyle
result: [pending]

### 5. Pause-Countdown (DISP-04)
expected: Auto-Pause zeigt den synchronisierten Countdown auf dem TV; „Weiter" beendet ihn beidseitig
result: [pending]

### 6. Auto-Rejoin (DISP-04)
expected: Cast trennen/neu verbinden → Receiver stellt den Match-Stand wieder her (ORIGIN_SCOPED Rejoin)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
