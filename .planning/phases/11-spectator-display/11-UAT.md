---
status: diagnosed
phase: 11-spectator-display
source: [11-VERIFICATION.md]
started: 2026-07-14T06:30:00Z
updated: 2026-07-14T13:12:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Receiver-Rendering (DISP-03)
expected: Panels/Header/Typo wie oben; History-Zeilen-Spacing intakt (CR-01-Fix); nichts unter ~34px; keine kaputten Klammern/Umbrüche bei 1280×720
result: pass

### 2. Live-Sync während des Spiels (DISP-04)
expected: Score-Updates erscheinen live auf dem TV nach jeder Aufnahme; aktiver Spieler wechselt korrekt (Amber-Treatment folgt)
result: pass

### 3. Idle-Screen (DISP-04)
expected: Vor Match-Start / nach Match-Ende zeigt der Receiver den Idle-Screen wie zuvor (dvh-Fix aus Phase 8 aktiv)
result: pass

### 4. Leg-/Set-Banner + Win-Overlay (DISP-04)
expected: Leg-Gewinn-Banner und Match-Win-Anzeige erscheinen und verschwinden wie vor dem Restyle
result: pass

### 5. Pause-Countdown (DISP-04)
expected: Auto-Pause zeigt den synchronisierten Countdown auf dem TV; „Weiter" beendet ihn beidseitig. ZUSATZ (Phase 12 WR-02): Der neue Blur-Scrim (backdrop-filter 12px) muss auf dem Receiver flüssig rendern (Chrome 90 unterstützt blur; prüfe Performance des Vollbild-Blurs)
result: issue
reported: "pass, aber der chromecast zeigt die Pause nicht an"
severity: major

### 6. Auto-Rejoin (DISP-04)
expected: Cast trennen/neu verbinden → Receiver stellt den Match-Stand wieder her (ORIGIN_SCOPED Rejoin)
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Auto-Pause zeigt den synchronisierten Countdown auf dem Chromecast-Receiver (Pause-Overlay + Blur-Scrim sichtbar)"
  status: failed
  reason: "User reported: pass, aber der chromecast zeigt die Pause nicht an"
  severity: major
  test: 5
  root_cause: "Pause-Statusänderungen (#checkAutoPause / decrementPause / resumePause in src/stores/match.svelte.ts) werden nur über #broadcastPause() → BroadcastChannel(BC_CHANNEL) verteilt (nur same-machine). Der einzige Cast-Publish-Pfad (#publishToCast() → castSenderManager.sendSnapshot() → sendMessage(CAST_NS)) wird ausschließlich aus dispatch() aufgerufen, das während einer Pause nie läuft — daher erhält der echte Receiver nie pauseActive:true. Zusätzlich läuft #publishToCast() (Z.126) in dispatch() VOR #checkAutoPause() (Z.146), sodass auch der auslösende Snapshot veraltet ist. Das Wire-Schema (CastDisplayState.pauseActive/pauseRemainingSeconds) ist bereits korrekt; nur der Cast-Trigger fehlt. Lokale PC-2-Fenster-Vorschau funktioniert, weil beide Fenster denselben BroadcastChannel teilen."
  artifacts:
    - path: "src/stores/match.svelte.ts"
      issue: "#broadcastPause() (aus #checkAutoPause/decrementPause/resumePause) ruft nie #publishToCast(); und #publishToCast() (Z.126) läuft in dispatch() vor #checkAutoPause() (Z.146)"
    - path: "src/lib/cast-sender.svelte.ts"
      issue: "sendSnapshot() ist korrekt, wird aber während der Pause nie aufgerufen"
    - path: "src/routes/match/+page.svelte"
      issue: "Pause-Countdown-$effect/setInterval (Z.~145-154) ruft nur matchStore.decrementPause(), ohne Cast-Pendant"
  missing:
    - "Die drei Pause-Mutatoren (#checkAutoPause, decrementPause, resumePause) müssen zusätzlich #publishToCast() aufrufen (oder ein gemeinsamer Helfer, der BroadcastChannel + Cast publisht)"
    - "dispatch() so umsortieren, dass #checkAutoPause() vor dem Cast-Publish läuft (oder expliziter Cast-Publish direkt nach der Pause-Mutation), damit auch der auslösende Snapshot nicht veraltet ist"
    - "Regressionstest: Pause-Publish über den Cast-Kanal abdecken (analog zu #publishToCast-Tests in match.svelte.test.ts)"
  debug_session: ".planning/debug/pause-not-shown-on-receiver.md"
