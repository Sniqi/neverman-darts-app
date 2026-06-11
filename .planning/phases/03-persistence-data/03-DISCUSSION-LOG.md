# Phase 3: Persistence & Data - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-12
**Phase:** 3-Persistence & Data
**Areas discussed:** Wiederaufnahme (resume), Match-Verlauf (history list), Was wird gespeichert, Export / Import

---

## Wiederaufnahme (resume)

### Q: On app load with an unfinished match, what happens?

| Option | Description | Selected |
|--------|-------------|----------|
| Direkt fortsetzen | Land straight back in the scoring view; abandon path lives elsewhere | |
| Erst fragen (prompt) | "Laufendes Spiel fortsetzen?" with Fortsetzen / Verwerfen before entering | ✓ |
| Auf dem Home-Screen anbieten | Load to home; show a prominent "Spiel fortsetzen" card | |

**User's choice:** Erst fragen (prompt)

### Q: Starting a NEW match while an unfinished one is saved?

| Option | Description | Selected |
|--------|-------------|----------|
| Warnen, dann ersetzen | Warn ("Es läuft noch ein Spiel — verwerfen und neues starten?"), then replace | ✓ |
| Stillschweigend ersetzen | New match overwrites the old saved one, no warning | |
| Neues blockieren bis erledigt | Can't start new until current is finished or discarded | |

**User's choice:** Warnen, dann ersetzen

---

## Match-Verlauf (history list)

### Q: What does each history row show?

| Option | Description | Selected |
|--------|-------------|----------|
| Datum + Ergebnis + Sieger | Date/time, players, final leg/set result, winner highlighted; format as subtitle | ✓ |
| Kompakt: nur Sieger + Datum | Minimal winner + date one-liner | |
| Reich: Ergebnis + 3-Dart-Schnitt | Result plus each player's match average in the row | |

**User's choice:** Datum + Ergebnis + Sieger

### Q: What opens when tapping a match row?

| Option | Description | Selected |
|--------|-------------|----------|
| Detailansicht pro Spiel | Per-match detail: final scoreboard + averages now; Phase 4 enriches same screen | ✓ |
| Nur flache Liste | No detail view; row is all there is | |
| Detailansicht, aber minimal | Detail with only result + averages; richer stats explicitly deferred | |

**User's choice:** Detailansicht pro Spiel

### Q: Where are history + data reached from?

| Option | Description | Selected |
|--------|-------------|----------|
| Echter Startbildschirm | "/" becomes a start menu: Neues Spiel · Verlauf · Daten/Backup; resume prompt here | ✓ |
| Setup bleibt Startseite | Keep setup as landing; add Verlauf/Daten buttons onto it | |
| Verlauf eigenständig, Daten separat | History its own entry; export/import elsewhere (settings corner) | |

**User's choice:** Echter Startbildschirm

---

## Was wird gespeichert

### Q: Which matches end up in the history list?

| Option | Description | Selected |
|--------|-------------|----------|
| Nur beendete Spiele | Only naturally-finished matches recorded; abandoned ones disappear | ✓ |
| Beendete + abgebrochene | Abandoned matches also filed (flagged "Abgebrochen") | |
| Beendete + abgebrochene fragen | Auto-save on finish; ask "Spiel im Verlauf behalten?" on discard | |

**User's choice:** Nur beendete Spiele

### Q: Can the user delete matches from history?

| Option | Description | Selected |
|--------|-------------|----------|
| Einzeln löschen, mit Bestätigung | Delete single match (detail view / long-press) with confirm | ✓ |
| Keine Löschung in dieser Phase | History append-only for now | |
| Einzeln + "Alles löschen" | Per-match delete plus bulk wipe on Daten screen | |

**User's choice:** Einzeln löschen, mit Bestätigung

---

## Export / Import

### Q: Importing a backup onto a device that already has data?

| Option | Description | Selected |
|--------|-------------|----------|
| Alles ersetzen | Wipe local, restore file as new truth; clear confirm; no collision logic | ✓ |
| Zusammenführen (merge) | Keep existing + add imported, de-duplicate | |
| Beim Import fragen | Ask Ersetzen oder Zusammenführen at import time | |

**User's choice:** Alles ersetzen

### Q: How much of a guard before replace-all wipes data?

| Option | Description | Selected |
|--------|-------------|----------|
| Klare Bestätigung | Single clear confirm naming the consequence | ✓ |
| Bestätigung + Auto-Backup | Auto-export current data before wiping, then replace | |
| Auch ungültige Dateien klar abweisen | Confirm + lock in that malformed files are rejected cleanly | |

**User's choice:** Klare Bestätigung

---

## Claude's Discretion

- Active-match storage location for crash-safety (localStorage vs IndexedDB) — researcher/planner decides.
- Dexie schema for the matches table (and whether an `events` table is needed) — DB version 2 migration; flagged by STATE.md for a research pass.
- Export JSON file naming, schema/versioning field, pretty-printing.
- Rejecting malformed/non-Neverman import files with a clear German error (sensible even though confirm-only guard was chosen).
- Start-screen layout/styling, history sort controls, dialog wording, German labels.
- Whether the export includes an in-progress match (default: profiles + completed history only).

## Deferred Ideas

- Merge-on-import (multi-device combine + de-dup) — rejected for Phase 3 in favour of replace-all.
- Bulk "gesamten Verlauf löschen" — optional discretion add, not required this phase.
- Cross-device transfer of an in-progress match via the export file — possible later.
