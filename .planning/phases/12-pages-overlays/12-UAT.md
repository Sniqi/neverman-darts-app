---
status: complete
phase: 12-pages-overlays
source: [12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md, 12-04-SUMMARY.md, 12-05-SUMMARY.md]
started: 2026-07-14T16:00:29Z
updated: 2026-07-14T16:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Start-Hub — "Profile verwalten" Listenbox
expected: Route /: Der Bereich "Profile verwalten" rendert als abgesetzte Box mit sichtbarem 1px-Rahmen, abgerundeten Ecken (radius-16) und surface-Hintergrund — nicht als rahmenloser Inhalt.
result: pass

### 2. Setup — PlayerPicker Spieler-Zeilen
expected: Im Setup ("Neues Spiel"): Jede Spieler-Auswahlzeile hat eine feine 1px-Haarlinie als Rahmen, gleichmäßige Zeilenhöhe (~64px) und abgerundete Ecken (radius-12). Zeilen wirken als saubere, gleich hohe Kacheln.
result: pass

### 3. Match-Historie — Listen-Container als Box
expected: Route /history: Die Liste der gespielten Matches sitzt in einer umrandeten, abgerundeten Box (radius-16) mit dezentem Kantenlicht/Schatten — nicht als schmucklose Liste ohne Rahmen.
result: pass

### 4. Historie-Zeile — Chevron & Ergebnis
expected: In der Historienliste zeigt jede Zeile rechts einen fein gezeichneten SVG-Pfeil (Chevron ›, gestrichenes Icon, kein Text-Zeichen) und bei 2-Spieler-Matches das Ergebnis in schmaler, tabellarischer Ziffern-Schrift (Barlow Semi Condensed, gleichmäßig ausgerichtete Zahlen).
result: pass

### 5. Historie-Detail — Typo-Skala
expected: Route /history/{id}: Titel groß (~26px), Abschnittsüberschriften ~22px, Fließtext ~19px, Bildunterschriften/Captions ~15px. Konsistente DS-Typo-Stufen, keine willkürlich wirkenden Schriftgrößen.
result: pass

### 6. Daten/Backup-Seite — Spalte & Typo
expected: Route /data: Inhalt in einer zentrierten 520px-Spalte, DS-Typo-Skala auf Titel/Überschriften/Text. Export-/Import-/Speicherwarnungs-Funktionen arbeiten unverändert.
result: pass

### 7. Cast Resume-Toast — surface-2 Hintergrund
expected: Der Cast-"Weiterspielen?"-Toast (erscheint beim Fortsetzen einer unterbrochenen Cast-Sitzung) hat jetzt den DS surface-2 Hintergrund; Radius, Schatten, Akzentstreifen und Einblend-Animation unverändert. (Falls kein Cast/Chromecast greifbar: skip.)
result: pass

### 8. Start-Hub — 520px-Spalte & Titel-Typo
expected: Route /: zentrierte 520px-Spalte, DS-Abstände, Titel in DS-Typo-Skala.
result: pass
source: automated
coverage_id: 12-01-D1

### 9. Setup — Titel "Neues Spiel" & Abschnittsüberschriften
expected: Setup-Titel liest "Neues Spiel" in DS-Typo-Skala; Abschnittsüberschriften in DS-lg-Skala.
result: pass
source: automated
coverage_id: 12-01-D3

### 10. Stats — Seite & Dashboard Typo-Skala
expected: Stats-Route + Dashboard in DS-Typo-Skala (520px-Spalte, 26px Titel, 15px Caption, 22px Abschnittsüberschriften ×5).
result: pass
source: automated
coverage_id: 12-03-D1

### 11. Charts — Balken-Recolor
expected: ScoreDistributionChart & DartsPerLegChart: nicht-hervorgehobene Balkenfüllung von var(--line-strong) auf var(--surface-3) geändert (1 Zeile je Datei), Rebuild-Verbot eingehalten.
result: pass
source: automated
coverage_id: 12-03-D2

### 12. Overlays — Scrim-Blur & Panel-Treatment
expected: PauseOverlay, RecordOverlay, MatchWinOverlay: Scrims blurren den Hintergrund; Panels mit surface-2/radius-lg/line-strong-Rahmen/shadow-panel.
result: pass
source: automated
coverage_id: 12-04-D1

### 13. Overlays — CTA-Buttons als .btn--cta
expected: "Weiter" (Pause) und "Neues Spiel" (MatchWin) nutzen die geteilte .btn--cta-Primitive; bespoke .weiter-btn/.new-game-btn CSS entfernt.
result: pass
source: automated
coverage_id: 12-04-D2

### 14. Overlays — Logik unverändert
expected: Countdown/Auto-Dismiss/Win-Ableitung byte-identisch — keine <script>-Änderungen in den 3 Overlays.
result: pass
source: automated
coverage_id: 12-04-D3

### 15. ReloadPrompt — PWA-Update-Toast
expected: ReloadPrompt: surface-2 Hintergrund, --line-strong Rahmen, token-basiertes Padding/Text, geteilte .btn--cta/.btn--ghost Buttons; onclick-Handler und Button-Text unverändert.
result: pass
source: automated
coverage_id: 12-05-D1

## Summary

total: 15
passed: 15
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
