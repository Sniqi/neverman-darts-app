---
phase: 03-persistence-data
plan: "03"
subsystem: persistence
tags: [backup, export-import, daten-screen, PROF-03, D-10, D-11, D-12]
dependency_graph:
  requires: [exportDB, importInto, peakImportFile, getStorageWarning, ConfirmDialog, db.profiles, db.matches]
  provides: [exportAllData, validateImportFile, importAllData, daten-backup-screen]
  affects: [src/routes/data/+page.svelte, src/lib/backup.ts]
tech_stack:
  added: [dexie-export-import@4.4.0]
  patterns: [dexie-export-import-exportDB, dexie-export-import-importInto-clearTablesBeforeImport, peakImportFile-validation-gate, FileReader-node-polyfill, vitest-setupFiles, aria-live-polite]
key_files:
  created:
    - src/lib/backup.ts
    - src/lib/backup.test.ts
    - src/test-setup-node.ts
  modified:
    - src/routes/data/+page.svelte
    - vite.config.ts
    - package.json
    - package-lock.json
decisions:
  - "FileReader polyfill in src/test-setup-node.ts (vitest setupFiles) — dexie-export-import calls FileReader + self at module load time; polyfill provides minimal readAsArrayBuffer contract matching dexie-export-import readBlobAsync expectations (ev.target.result/ev.target.error)"
  - "Separate +page.ts loader not needed for data route — data/+page.svelte sets prerender=false; ssr=false inline (unlike history which had a liveQuery requiring loader separation)"
  - "importAllData throws on failure (not returns status) — lets Daten screen show inline error without extra return type; consistent with exportAllData throw pattern"
metrics:
  duration: "6 min"
  completed_date: "2026-06-12"
  tasks: 3
  files: 7
---

# Phase 03 Plan 03: Export/Import Backup Slice Summary

Export/import vertical slice (PROF-03): `dexie-export-import` installed, `backup.ts` providing `exportAllData()` / `validateImportFile()` / `importAllData()`, and the `/data` Daten/Backup screen fully wired with export loading state, guarded replace-all import (D-10/D-11/D-12), inline German error feedback for foreign/corrupt files, and storage-near-full warning banner.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install dexie-export-import (legitimacy gate auto-approved) | 8c7ad93 | package.json, package-lock.json |
| 2 | backup.ts export/validate/import wrapper (RED→GREEN TDD) | 4f5cca5 | backup.ts, backup.test.ts, test-setup-node.ts, vite.config.ts |
| 3 | Daten/Backup screen — export, import, confirm, storage warning | 1b754a2 | data/+page.svelte |

## What Was Built

- `src/lib/backup.ts`: three exported async functions:
  - `exportAllData()`: `exportDB(db)` → Blob URL → `<a download="neverman-backup-YYYY-MM-DD.json">` click → `revokeObjectURL`; throws on failure
  - `validateImportFile(blob)`: `peakImportFile(blob)` + `databaseName === 'NevermanDarts'` check; returns `{ valid: false, errorDe: 'Diese Datei gehört nicht zu Neverman Darts.' }` for foreign file; `{ valid: false, errorDe: 'Die Datei konnte nicht gelesen werden oder ist beschädigt.' }` for corrupt/unreadable; `{ valid: true, errorDe: null }` for valid Neverman backup
  - `importAllData(blob)`: `importInto(db, blob, { clearTablesBeforeImport: true, acceptVersionDiff: true })`; throws on failure
- `src/lib/backup.test.ts`: 4 unit tests — validateImportFile valid/foreign/corrupt + importAllData replace-all (only PlayerB present after import replaces PlayerA)
- `src/test-setup-node.ts`: Node polyfills for `self` (dexie-export-import tson.ts module load) and `FileReader` (readAsArrayBuffer with `ev.target.result`/`ev.target.error` contract matching dexie-export-import readBlobAsync)
- `vite.config.ts`: `setupFiles: ['src/test-setup-node.ts']` added to unit project
- `src/routes/data/+page.svelte`: full Surface 5 Daten/Backup screen:
  - Heading bar with back chevron → `goto(\`${base}/\`)`
  - Export section: description card + "Exportieren" button (Secondary bg, 52px, full width); `disabled={exporting}`; label toggles "Exportiere…"; inline "Export fehlgeschlagen." on error
  - Section divider (1px `#2d2d2d`)
  - Import section: description card + "Datei auswählen" button triggering hidden `<input type="file" accept=".json">`; `validateImportFile` on select; inline German error (color `#c0392b`) if invalid — no dialog, no DB change; valid → `ConfirmDialog` (heading "Daten ersetzen?", body two-sentence consequence wording, ctaLabel "Importieren", ctaStyle destructive, `backdropDismiss={false}` per D-12); on confirm: `importAllData`; `role="status" aria-live="polite"` region shows "Import abgeschlossen." on success or "Import fehlgeschlagen. Bitte erneut versuchen." on error
  - Storage warning banner (`rgba(232,160,32,0.12)` bg, `rgba(232,160,32,0.35)` border, `#e8a020` text, 8px radius) at bottom when `getStorageWarning()` returns non-null
  - All strings via `{interpolation}` — no `{@html}` anywhere (T-03-08/T-03-09)
  - `prerender=false; ssr=false` (dynamic route override)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] dexie-export-import requires browser globals in node unit env**
- **Found during:** Task 2 RED phase — `ReferenceError: self is not defined` at module load, then `ReferenceError: FileReader is not defined` during test execution
- **Issue:** `dexie-export-import` references `self` at module evaluation time (tson.ts:11) and calls `new FileReader()` inside `readBlobAsync` to read Blob contents. Node's unit environment has neither.
- **Fix:** Created `src/test-setup-node.ts` with (a) `globalThis.self = globalThis` polyfill loaded before imports via Vitest `setupFiles`, and (b) a minimal `FileReader` class polyfill implementing `readAsArrayBuffer` with the `{ target: this }` event shape matching dexie-export-import's `reader.onerror = ev => reject(ev.target.error)` pattern. Added `setupFiles: ['src/test-setup-node.ts']` to the unit project in `vite.config.ts`.
- **Files modified:** `src/test-setup-node.ts` (created), `vite.config.ts`

## Known Stubs

None. All plan objectives fully implemented:
- `exportAllData()` wired and functional
- `validateImportFile()` rejects foreign/corrupt files with exact German copy
- `importAllData()` performs replace-all (clearTablesBeforeImport)
- Daten screen wires all three functions with loading states, inline feedback, and confirmation dialog
- Storage warning banner conditionally rendered from `getStorageWarning()`

## Threat Flags

None. All threat mitigations from the plan's threat register implemented:
- T-03-07: `validateImportFile()` (peakImportFile + databaseName gate) runs BEFORE any DB write; foreign/corrupt file returns German error, opens no dialog, changes nothing
- T-03-08: import uses official `dexie-export-import` addon writing into typed Dexie tables; no `eval`/`Function`/`{@html}` anywhere; databaseName structural gate rejects non-Neverman payloads
- T-03-09: no `{@html}` in Daten screen — all player names, dates, error strings via `{interpolation}`
- T-03-10: `getStorageWarning()` called on mount; storage warning banner shown >80%; all storage ops in try/catch
- T-03-SC: dexie-export-import legitimacy verified (official Dexie org monorepo package); Task 1 gate auto-approved per orchestrator directive (RESEARCH Package Legitimacy Audit: APPROVED)

## Verification Results

- `npm run test:unit -- src/lib/backup.test.ts`: 4/4 passed
- `npm run test:unit` (full): 202/202 passed (no regression; 4 new from backup.test.ts vs 198 prior)
- `npm run check`: 1 error (pre-existing `profiles.ts` type error, out of scope — documented in 03-01-SUMMARY.md), 0 new errors

## Self-Check: PASSED
