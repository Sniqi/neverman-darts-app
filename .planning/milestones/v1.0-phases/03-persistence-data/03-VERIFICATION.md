---
phase: 03-persistence-data
verified: 2026-06-12T04:15:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Each player's match 3-dart average is shown in history detail"
    addressed_in: "Phase 4"
    evidence: "Phase 4 SC 1: 'correct live 3-dart average and first-9 average for the current leg and the full match (busts counted as 3 darts; checkout legs count actual darts used)' — cross-leg accumulation needed for an accurate multi-leg match average"
human_verification:
  - test: "Reload mid-match and confirm resume prompt appears and Fortsetzen restores exact state"
    expected: "Start screen shows 'Laufendes Spiel fortsetzen?' with the correct info line; clicking Fortsetzen navigates to /match and the remaining score matches pre-reload"
    why_human: "E2E tests this path but UI/UX correctness (layout, copy legibility, touch target size) requires visual inspection"
  - test: "Finish a match and confirm it appears in Match-Verlauf"
    expected: "After the match-win overlay, navigating to /history shows the completed match at the top of the list with date, result (e.g. '3:1'), winner name highlighted in amber, and '501 Double Out' subtitle"
    why_human: "Verifies data flow from match-complete through Dexie persistence to the live-query history list; winner accent colour must be visually confirmed"
  - test: "Tap a history row and inspect the detail view"
    expected: "Match-Details screen shows the long German date, format line, winner name in amber with result score, per-player scoreboard with 'Ø Match:' line (shows a numeric average for single-leg matches, shows '—' for multi-leg matches)"
    why_human: "Per-player average display and winner/loser card distinction (background colour) require visual confirmation; the multi-leg '—' is honest but should be acceptable to the user"
  - test: "Delete a match from its detail view"
    expected: "Tapping 'Spiel löschen' shows a ConfirmDialog; cancelling returns to the detail unchanged; confirming navigates back to /history and the match is gone"
    why_human: "Confirmation dialog interaction (backdrop behaviour, button sizing, destructive colour) requires visual confirmation"
  - test: "Verify Verwerfen on the start screen clears the resume slot"
    expected: "Clicking Verwerfen hides the resume card immediately; a subsequent page reload of / shows no resume prompt"
    why_human: "Instant visual feedback (card disappears without reload) requires manual observation"
  - test: "Export a backup file from the Daten/Backup screen"
    expected: "Clicking 'Exportieren' triggers a download of 'neverman-backup-YYYY-MM-DD.json'; the file contains both profiles and match history; the loading state ('Exportiere…') is briefly visible"
    why_human: "File download and binary Blob content cannot be verified without a running app; cross-browser download reliability (especially on Android Chrome and Firefox) needs physical testing"
  - test: "Import a backup file — valid file path"
    expected: "Selecting a valid Neverman backup opens the 'Daten ersetzen?' ConfirmDialog; confirming shows 'Import abgeschlossen.' via aria-live; history and profiles now reflect the imported file"
    why_human: "Replace-all semantics (old data gone, imported data present) and the aria-live announcement require a running app"
  - test: "Import a non-Neverman JSON file (foreign file rejection)"
    expected: "Selecting a random .json file shows 'Diese Datei gehört nicht zu Neverman Darts.' inline in red below the 'Datei auswählen' button; no ConfirmDialog opens; no data is changed"
    why_human: "Inline error placement, colour (#c0392b), and absence of dialog must be confirmed visually"
  - test: "Storage warning banner on Daten screen (optional — requires >80% storage)"
    expected: "If storage usage exceeds 80%, the amber-tint banner appears at the bottom of the Daten screen with the German warning text"
    why_human: "Cannot trigger this condition programmatically in a normal test environment"
---

# Phase 3: Persistence & Data Verification Report

**Phase Goal:** A match survives a browser reload or crash and resumes exactly where it stopped; player profiles and match history are stored persistently; all data can be exported and imported
**Verified:** 2026-06-12T04:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths derived from ROADMAP.md Success Criteria and PLAN frontmatter must_haves.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Reloading the browser mid-match shows a resume prompt (Fortsetzen / Verwerfen) and restores the exact game state | ✓ VERIFIED | `loadUnfinishedMatch()` in `storage.ts` returns state for phase 'playing'/'leg-complete'; start screen calls it in `onMount`; `matchStore.restore(state)` on Fortsetzen. E2E `resume.spec.ts` 2/2 green. |
| 2 | Verwerfen discards the in-progress match and it is not restored | ✓ VERIFIED | `clearUnfinishedMatch()` calls `localStorage.removeItem(LS_SNAPSHOT)` in try/catch. E2E verifies localStorage key is null after Verwerfen and subsequent reload shows no prompt. |
| 3 | Starting a new match while an unfinished one is saved warns the user before replacing it | ✓ VERIFIED | `MatchSetup.svelte` `handleStart()` calls `loadUnfinishedMatch()` before proceeding; shows `ConfirmDialog("Es läuft noch ein Spiel")` with `backdropDismiss={false}` and destructive CTA "Verwerfen und neu starten". |
| 4 | The start screen at / shows Neues Spiel, Match-Verlauf, Daten/Backup (D-07) | ✓ VERIFIED | `+page.svelte` renders three 56px `<button>` elements with exact German labels; replaces the old `goto('/setup')` redirect. `onMount` replaces the earlier `$effect` (CR-02 fixed). |
| 5 | Completing a match writes it to persistent history and clears the active-match resume slot | ✓ VERIFIED | `#persistCompletedMatch` in `match.svelte.ts` uses two independent try/catch blocks — DB write, then unconditional `localStorage.removeItem`. Unit test confirms winnerId written and snapshot cleared. |
| 6 | The Match-Verlauf list shows past matches newest-first with date, leg/set result, winner highlighted, and format subtitle | ✓ VERIFIED | `matchesLive()` orders by `completedAt` descending; `HistoryRow.svelte` renders date (14px muted), winner name in `#e8a020`/600, other name in `#f0f0f0`/400, `›` chevron. |
| 7 | Tapping a history row opens a detail view with the final scoreboard | ✓ VERIFIED | `history/[id]/+page.ts` loader parses id with `parseInt + isNaN` guard; `+page.svelte` renders summary card + scoreboard section with `PlayerStatRow` per player. |
| 8 | A single match can be deleted from its detail view, guarded by a confirmation dialog | ✓ VERIFIED | "Spiel löschen" button opens `ConfirmDialog`; confirm calls `deleteMatch(record.id!)` inside try/catch (WR-01 fixed); navigates to /history on success. |
| 9 | Abandoned/discarded matches never appear in history (only match-complete is recorded) | ✓ VERIFIED | `#persistCompletedMatch` only fires when `this.state.phase === 'match-complete'`; `clearUnfinishedMatch()` on Verwerfen removes the snapshot without writing to DB. |
| 10 | Player can export all profiles and match history to a single JSON file via a download | ✓ VERIFIED | `exportAllData()` calls `exportDB(db)` (covers all Dexie tables), creates a named `<a download>` element appended to DOM, clicks it, then defers `revokeObjectURL` 10s (CR-02 fixed). |
| 11 | Player can select a backup file; a valid Neverman file opens a replace-all confirmation; an invalid/foreign file shows a clear German error and changes nothing | ✓ VERIFIED | `validateImportFile()` calls `peakImportFile` + checks `databaseName === 'NevermanDarts'`; returns exact German strings from UI-SPEC; `data/+page.svelte` shows error inline and opens no dialog on invalid; valid file opens `ConfirmDialog("Daten ersetzen?", backdropDismiss={false})`. |

**Score:** 11/11 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Per-player match 3-dart average in history detail shows "—" for multi-leg matches | Phase 4 | Phase 4 SC 1: "correct live 3-dart average and first-9 average for the current leg and the full match" — requires cross-leg visit accumulation not yet in the data model. The Phase 3 display shows "—" (honest) rather than a wrong number (CR-04 fix applied). Single-leg matches do display the correct average. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/storage.ts` | `loadUnfinishedMatch`, `clearUnfinishedMatch`, `requestPersistentStorage`, `getStorageWarning` | ✓ VERIFIED | All four functions exported; phase guard (playing/leg-complete only); try/catch wrappers; German storage warning string matches UI-SPEC copy |
| `src/routes/+page.svelte` | Start screen hub with resume prompt + 3-item menu | ✓ VERIFIED | 157 lines; conditional `ResumePrompt`; 3 nav buttons; `onMount` init; `ConfirmDialog` for new-match warning |
| `src/ui/dialogs/ConfirmDialog.svelte` | Reusable confirmation dialog | ✓ VERIFIED | 164 lines; typed props including `backdropDismiss`; Escape key gated on `backdropDismiss` (CR-03 fixed); `role="dialog" aria-modal` |
| `src/ui/start/ResumePrompt.svelte` | Resume prompt card: heading, match info, Fortsetzen + Verwerfen | ✓ VERIFIED | `$derived` info line; 52px buttons; all names via `{interpolation}` (T-03-03) |
| `src/db/db.ts` | Dexie version(2) matches table + MatchRecord interface | ✓ VERIFIED | `version(2).stores({ matches: '++id, completedAt, winnerId' })`; v1 block untouched |
| `src/db/matches.ts` | `matchesLive`, `getMatch`, `deleteMatch`, `toHistoryRow` | ✓ VERIFIED | All four exported; liveQuery wrapper newest-first; try/catch on read; correct German date format |
| `src/routes/history/+page.svelte` | History list (liveQuery) + empty state | ✓ VERIFIED | 122 lines; `{#each $matches as record}` → `HistoryRow`; empty state with German copy |
| `src/routes/history/[id]/+page.svelte` | Match detail view + delete + Phase-4 growth surface | ✓ VERIFIED | 274 lines; summary card; scoreboard section; `phase4-region` empty whitespace; outlined-destructive delete button |
| `src/lib/backup.ts` | `exportAllData`, `validateImportFile`, `importAllData` | ✓ VERIFIED | All three exported; `dexie-export-import` wired; CR-02 download fix applied |
| `src/routes/data/+page.svelte` | Daten/Backup screen | ✓ VERIFIED | 352 lines; export section with loading state; hidden file input; inline error; aria-live region; storage warning banner; `backdropDismiss={false}` on import confirm |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/routes/+page.svelte` | `src/lib/storage.ts` | `loadUnfinishedMatch()` in `onMount` | ✓ WIRED | Line 23: `unfinishedMatch = loadUnfinishedMatch()` inside `onMount` callback |
| `src/routes/+page.svelte` | `src/stores/match.svelte.ts` | `matchStore.restore(state)` on Fortsetzen | ✓ WIRED | Line 30: `matchStore.restore(unfinishedMatch)` in `handleResume` |
| `src/ui/setup/MatchSetup.svelte` | `src/ui/dialogs/ConfirmDialog.svelte` | new-match warning before Spiel starten | ✓ WIRED | `ConfirmDialog` imported and rendered conditionally on `showSavedMatchWarning`; `handleStart()` checks `loadUnfinishedMatch()` |
| `src/stores/match.svelte.ts` | `db.matches` | `#persistCompletedMatch` on `phase === match-complete` | ✓ WIRED | Line 62: `await db.matches.add(...)` inside async private method called from `dispatch()` |
| `src/routes/history/+page.svelte` | `src/db/matches.ts` | `matchesLive()` readable | ✓ WIRED | Line 9: import; line 12: `const matches = matchesLive()` at module scope |
| `src/routes/history/[id]/+page.ts` | `db.matches` | `db.matches.get(parseInt(params.id))` | ✓ WIRED | Line 14: `const record = await db.matches.get(id)` with isNaN guard |
| `src/routes/history/[id]/+page.svelte` | `src/engine/averages.ts` | `computeAverage` per player | ✓ WIRED | `PlayerStatRow.svelte` imports and calls `computeAverage`; guarded by `totalLegsPlayed > 1` check |
| `src/routes/data/+page.svelte` | `src/lib/backup.ts` | export/validate/import handlers | ✓ WIRED | All three functions imported (line 12) and called in their respective handlers |
| `src/routes/data/+page.svelte` | `src/ui/dialogs/ConfirmDialog.svelte` | import replace-all confirmation | ✓ WIRED | `ConfirmDialog` imported (line 14); rendered on `showImportConfirm`; `backdropDismiss={false}` per D-12 |
| `src/lib/backup.ts` | `dexie-export-import` | `exportDB / importInto / peakImportFile` | ✓ WIRED | Line 11: `import { exportDB, importInto, peakImportFile } from 'dexie-export-import'` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `routes/history/+page.svelte` | `$matches` | `matchesLive()` → `liveQuery(db.matches.orderBy('completedAt').reverse())` | Yes — Dexie IndexedDB query | ✓ FLOWING |
| `routes/history/[id]/+page.svelte` | `data.record` | `+page.ts` loader → `db.matches.get(id)` | Yes — Dexie IndexedDB lookup by PK | ✓ FLOWING |
| `ui/history/PlayerStatRow.svelte` | `avgDisplay` | `computeAverage(player.visits, ...)` from persisted MatchState | Real data for single-leg; "—" for multi-leg (deferred to Phase 4) | ✓ FLOWING (deferred partial) |
| `routes/data/+page.svelte` | export Blob | `exportDB(db)` → all Dexie tables | Yes — full DB export | ✓ FLOWING |
| `routes/data/+page.svelte` | import | `importAllData(blob)` → `importInto(db, blob, {clearTablesBeforeImport:true})` | Yes — replace-all write | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 202 unit tests pass | `npm run test:unit` | 202 passed (13 test files) | ✓ PASS |
| Resume E2E: Fortsetzen restores exact score | `npx playwright test e2e/resume.spec.ts` | 2/2 passed | ✓ PASS |
| svelte-check type errors | `npm run check` | 1 error in `profiles.ts:24` (pre-existing, Phase 1 commit `1dc6dd9`, out of scope); 0 new errors | ✓ PASS |
| `dexie-export-import` in package.json | `node -e "..."` | `^4.4.0` present | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FLOW-03 | 03-01-PLAN.md | An in-progress match survives a browser reload or crash and can be resumed exactly where it stopped | ✓ SATISFIED | `loadUnfinishedMatch` + `matchStore.restore()` + start screen + E2E 2/2 green |
| STAT-06 | 03-02-PLAN.md | Player can browse match history (past matches with results and key stats) | ✓ SATISFIED | Dexie v2 matches table; `matchesLive()` newest-first list; history detail with per-player stats |
| PROF-03 | 03-03-PLAN.md | Player can export all data as a JSON file and import it again (backup / device transfer) | ✓ SATISFIED | `exportAllData` + `validateImportFile` + `importAllData` + Daten screen wired |

No orphaned requirements — REQUIREMENTS.md traceability table maps all three IDs (FLOW-03, STAT-06, PROF-03) to Phase 3 with status Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `e2e/resume.spec.ts` | 12, 17 | `import from 'playwright/test'` and `import('playwright').Page` (IN-02: inconsistent import specifiers) | ℹ️ Info | Latent: tests pass with current config; may break if project migrates to `@playwright/test` consistently. Not a Phase 3 blocker. |
| `src/db/matches.ts` | 79 | `toLocaleDateString('de-DE', ...)` — ICU-dependent output (IN-03) | ℹ️ Info | Tests pass in current Node build; could differ in stripped-ICU environments. Not a Phase 3 blocker. |

No `TBD`, `FIXME`, or `XXX` markers found in any Phase 3 source files. No unreferenced debt markers.

Code review critical fixes applied in commits `cdf5c7d`, `c66408f`, `557a4aa`, `e4b5a23`, `19deeec`, `5dee03c`, `c3bc1d2`:
- CR-01: `#persistCompletedMatch` split into two independent try/catch blocks — DB write and localStorage remove are now both unconditionally attempted.
- CR-02: `exportAllData` appends anchor to DOM and defers `revokeObjectURL` by 10 seconds.
- CR-03: `ConfirmDialog` Escape key gated on `backdropDismiss` flag.
- CR-04: `PlayerStatRow.avgDisplay` shows "—" for `totalLegsPlayed > 1` (honest limitation, deferred to Phase 4).
- WR-01: `handleDeleteConfirm` wrapped in try/catch with inline error.
- WR-02: `$effect` replaced with `onMount` in start screen.
- WR-03: Dead `importing` label binding removed from ConfirmDialog CTA.
- WR-05: `navigate()` in `HistoryRow.svelte` guards `record.id == null`.

Info items IN-01 (LS_SNAPSHOT duplication), IN-02 (Playwright import), IN-03 (ICU date format) intentionally deferred — none block goal achievement.

### Human Verification Required

The following items require a running app and cannot be verified programmatically.

#### 1. Resume prompt UI and Fortsetzen UX

**Test:** Play a match partway (at least one visit), close the tab, reopen to /
**Expected:** "Laufendes Spiel fortsetzen?" card appears above the menu with the correct match info line; "Fortsetzen" navigates to /match with the exact remaining score; layout and touch target sizes are correct on a tablet viewport
**Why human:** Visual layout, card animation, and touch-target adequacy require physical inspection

#### 2. Match-Verlauf after completing a match

**Test:** Play a full match to completion, navigate to /history from the start screen
**Expected:** Completed match appears at the top, newest-first; row shows date, result score (e.g. "3:1"), winner name in amber (#e8a020), loser name in white, format subtitle; tapping the row opens the detail screen
**Why human:** Winner colour accent, row height, and tap-to-navigate require visual + interactive confirmation

#### 3. Match detail — scoreboard and average display

**Test:** Open any completed match from history; inspect the PlayerStatRow cards
**Expected:** Winner card has darker background (#22242d), non-winner has #1e2027; winner name is amber/600; correct singular/plural labels ("1 Leg" vs "2 Legs"); single-leg matches show a numeric average, multi-leg matches show "—"
**Why human:** Card background distinction, font weight differences, and "—" acceptability to users require visual review

#### 4. Delete a match from history

**Test:** Open a match detail; tap "Spiel löschen"; inspect the ConfirmDialog; confirm deletion
**Expected:** Dialog appears with heading "Spiel löschen?", destructive red CTA "Löschen"; cancel returns to detail unchanged; confirm navigates back to /history with the match removed; Escape key does NOT close the dialog (backdropDismiss=true for delete — Escape should close per spec; confirm this is correct)
**Why human:** Dialog visual appearance, button colours, and expected Escape-key behaviour in this context (backdropDismiss=true means Escape IS expected to close — this is intentionally different from the import dialog) require confirmation

#### 5. Export backup file download

**Test:** Navigate to Daten/Backup; tap "Exportieren"
**Expected:** Browser downloads "neverman-backup-YYYY-MM-DD.json"; file opens as valid JSON containing profiles and matches tables; "Exportiere…" disabled state is briefly visible during the download
**Why human:** File download initiation and file content cannot be verified from outside a real browser context

#### 6. Import: valid file → replace-all

**Test:** Select the previously exported backup file via "Datei auswählen"; confirm the dialog; observe result
**Expected:** "Daten ersetzen?" ConfirmDialog opens; confirming shows "Import abgeschlossen." in the status region; history and profiles now reflect the backup file content
**Why human:** Replace-all semantics and aria-live announcement require a running app

#### 7. Import: foreign/corrupt file → inline error, no dialog

**Test:** Select a random .json file (e.g., package.json or an empty JSON object)
**Expected:** Inline error appears in red below "Datei auswählen": "Diese Datei gehört nicht zu Neverman Darts." (or the corrupt-file variant); no ConfirmDialog is shown; no data is changed
**Why human:** Inline error placement, colour, and absence of dialog must be confirmed visually

#### 8. Storage warning banner (conditional)

**Test:** If available on a device with nearly full storage (>80%), visit the Daten screen
**Expected:** Amber-tint banner at the bottom: "Speicher fast voll ([n]% belegt). Bitte Daten exportieren und alte Matches löschen."
**Why human:** Cannot trigger the >80% condition programmatically in a standard test environment

### Gaps Summary

No gaps. All 11 must-have truths are VERIFIED in the codebase. The one item marked deferred (per-player multi-leg match average) is intentionally showing "—" rather than a wrong number, which is honest and correct given Phase 4's stated scope for cross-leg average accumulation.

The two Info-level code issues (IN-02 Playwright import inconsistency, IN-03 ICU date format in tests) do not affect goal achievement and are not blockers.

---

_Verified: 2026-06-12T04:15:00Z_
_Verifier: Claude (gsd-verifier)_
