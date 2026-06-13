# Phase 3: Persistence & Data - Research

**Researched:** 2026-06-12
**Domain:** IndexedDB / Dexie 4 schema versioning, crash-resume persistence, match history, JSON export/import
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** On app load, if an unfinished match exists, show a prompt ("Laufendes Spiel fortsetzen?") with **Fortsetzen / Verwerfen**. Not silent auto-resume. Surfaces on the new start screen (D-07).
- **D-02:** Starting a new match while an unfinished one is saved → warn first ("Es läuft noch ein Spiel — verwerfen und neues starten?"), then replace. No silent overwrite; no hard block.
- **D-03:** "Verwerfen" discards the in-progress match — it is NOT kept (consistent with D-08).
- **D-04:** History list rows: date/time + final leg/set result (e.g. "3:1") + winner highlighted, with format as a small subtitle.
- **D-05:** Tapping a row opens a per-match detail view: final scoreboard plus each player's match 3-dart average and other derivable numbers. Extensible surface for Phase 4.
- **D-06:** History list default ordering: newest match first.
- **D-07:** Turn `/` into a real start screen: **Neues Spiel · Match-Verlauf · Daten/Backup**. Resume prompt (D-01) appears here on load. "Neues Spiel" enters the existing setup flow.
- **D-08:** Only completed matches (phase `match-complete`) are written to history. Abandoned/discarded matches disappear entirely.
- **D-09:** User can delete a single match from history, guarded by a confirmation.
- **D-10:** Export = single JSON file containing all profiles and all match history.
- **D-11:** Import = replace-all. Wipe local data, restore file as new truth. No merge, no de-duplication.
- **D-12:** Replace-all import guarded by a single confirmation dialog naming the consequence.

### Claude's Discretion
- Where to persist the active in-progress match (localStorage vs IndexedDB) without breaking `/display` spectator hydration of `neverman-match-snapshot`.
- Dexie schema design for `matches` table (and whether a separate `events` table is needed) via `version(2)` migration.
- Export JSON file naming, schema/versioning field, pretty-printing, and malformed-import rejection with German error.
- Whether the in-progress unfinished match is included in export (default assumption: completed history only; live match is device-local).
- Exact start-screen layout/styling, history sort controls, confirmation dialog wording and styling, German labels.
- Optional bulk "gesamten Verlauf löschen" on the Daten screen if guarded (not required).

### Deferred Ideas (OUT OF SCOPE)
- Merge-on-import (de-duplication of two devices' data) — rejected for Phase 3 in favour of replace-all (D-11).
- Bulk "gesamten Verlauf löschen" — optional only, not required.
- Cross-device transfer of an in-progress match via export file.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-03 | An in-progress match survives a browser reload or crash and can be resumed exactly where it stopped | localStorage snapshot already written on every dispatch; restore-on-load reads it back via reducer replay or direct assignment; resume prompt on start screen (D-01) |
| STAT-06 | Player can browse match history (past matches with results and key stats) | Dexie v2 `matches` table stores completed `MatchState` blobs; `liveQuery` → Svelte readable drives the list; `computeAverage` from averages.ts supplies the key stats |
| PROF-03 | Player can export all data (profiles, history, stats) as a JSON file and import it again | `dexie-export-import` 4.4.0 (official Dexie addon) handles the Blob, streaming, and `clearTablesBeforeImport`; custom wrapper adds schema version field + German error rejection |
</phase_requirements>

---

## Summary

Phase 3 adds three mutually independent deliverables onto Phases 1–2's already-working foundation: crash-resume, match history, and export/import.

The most important architectural finding is the **two-store strategy for the live match**. The existing `neverman-match-snapshot` localStorage key must be kept intact — the spectator display (`display.svelte.ts`) reads it for cold-start hydration. Crash-resume can reuse this same key: on reload, if the stored state's `phase !== 'match-complete'` and `players.length > 0`, an in-progress match exists and the start screen shows the D-01 prompt. This avoids any new localStorage key or IndexedDB slot for the resume use case, keeping complexity minimal. A separate IndexedDB slot for the live match offers no durability advantage (localStorage is synchronous-write, IndexedDB is async; both survive normal browser restarts; both can be lost in private mode — `ensureDbOpen()` already handles that).

Dexie's `version(2).stores()` pattern is additive — the v1 `profiles` block is untouched. A single `matches` table (storing the full serialized `MatchState` plus a few indexed fields for list queries) is sufficient; a separate `events` table is not needed for Phase 3 because `MatchState.eventLog` already carries the full replay log, and Phase 4 queries will be answered by the stored final state fields, not by event replay. The `dexie-export-import` addon (version 4.4.0, same major as Dexie 4.4.3, official Dexie org package) handles both export and replace-all import cleanly. A custom thin wrapper adds the schema-version field and German error messaging.

**Primary recommendation:** Reuse the existing `neverman-match-snapshot` localStorage key for crash-resume. Restore by parsing the snapshot, validating it is a non-complete `MatchState`, then assigning it directly to `matchStore.state` (Svelte 5 `$state` field is directly assignable). Add a Dexie `version(2)` block with a `matches` table. Use `dexie-export-import` for export/import.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Crash-resume detection | Browser / Client (start screen) | — | Reads localStorage on page load; decides whether to show prompt before any routing |
| Active match snapshot (crash-safe write) | Browser / Client (MatchStore dispatch) | — | Already written on every dispatch in match.svelte.ts; no architectural change needed |
| Match history persistence | Database / Storage (Dexie) | — | Completed MatchState → IndexedDB on match-complete; liveQuery drives list |
| History list + detail view | Frontend (SvelteKit route) | Database / Storage | Routes read from Dexie via liveQuery readable; no server needed |
| Export / import orchestration | Browser / Client (Daten screen) | Database / Storage | File download via Blob URL; file read via `<input type=file>`; dexie-export-import handles DB layer |
| Storage quota warnings | Browser / Client | — | `navigator.storage.persist()` + `.estimate()` called at app init |
| Start screen routing | Frontend (SvelteKit route `/`) | — | Replaces bare goto('/setup'); shows resume prompt; menu links to other routes |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| dexie | 4.4.3 | IndexedDB ORM — matches table v2, liveQuery | Already installed; v1 profiles table established in Phase 1 [VERIFIED: npm registry] |
| dexie-export-import | 4.4.0 | Full-DB export/import via Blob | Official Dexie org package; handles streaming, exotic types, clearTablesBeforeImport [VERIFIED: npm registry + dexie.org docs] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fake-indexeddb | 6.2.5 | In-process IndexedDB for Vitest node tests | Already installed; used for profiles.test.ts pattern; new matches.test.ts mirrors it [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `dexie-export-import` | Hand-rolled JSON export via `JSON.stringify(await db.profiles.toArray(), ...)` | Hand-roll is simpler but misses streaming, ArrayBuffer support, and schema metadata. For this app's data size hand-roll would work but the official addon is a 2-line change and the project CLAUDE.md already endorses Dexie as the data layer. |
| localStorage for resume slot | Separate IndexedDB `activeMatch` record | Both have equivalent durability for normal browser restarts. localStorage write is synchronous (no await, no try-chain); it never blocks dispatch. IndexedDB write is async and would need careful fire-and-forget. localStorage is already written — no new code path needed. |

**Installation (new package only):**
```bash
npm install dexie-export-import
```

**Version verification (run date 2026-06-12):**
```
dexie:                4.4.3   (last publish: 2026-05-27)  [VERIFIED: npm view]
dexie-export-import:  4.4.0   (last publish: 2026-03-26)  [VERIFIED: npm view]
fake-indexeddb:       6.2.5   (already installed)         [VERIFIED: npm view]
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| dexie | npm | ~10 yrs | Very high (100k+ sites per README) | github.com/dexie/Dexie.js | OK | Approved — already installed |
| dexie-export-import | npm | ~5 yrs | Part of dexie org | github.com/dexie/Dexie.js (monorepo) | OK | Approved |
| fake-indexeddb | npm | ~8 yrs | High | github.com/dumbmatter/fakeIndexedDB | OK | Approved — already installed |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious (SUS):** none

---

## Architecture Patterns

### System Architecture Diagram

```
Browser load
    │
    ▼
+---------------------+
|  / (start screen)   |  ←── reads localStorage["neverman-match-snapshot"]
|  Resume prompt?     |       if state.phase !== 'match-complete' && players > 0
|  Fortsetzen │ Verwerfen
+------+------+-------+
       │           │
  Fortsetzen    Verwerfen
       │           │
       │      clear snapshot
       │           │
       ▼           ▼
+------------------+     START_MATCH action
|  /setup → /match | ──────────────────────────────────────┐
+------------------+                                       │
       │                                                   │
  dispatch() any action                                    │
       │                                                   │
       ▼                                                   │
+-------------------+   JSON.stringify(state)              │
|   MatchStore      | ──────────────────────────────────►  localStorage["neverman-match-snapshot"]
|  (match.svelte)   |                                      │
+-------------------+                                      │  (also via BroadcastChannel)
       │                                                   │
  phase === 'match-complete'                               ▼
       │                                         +------------------+
       ▼                                         | /display         |
+-------------------+   db.matches.add(state)   | DisplayStore     |
|  match complete   | ────────────────────────►  | hydrates from LS |
|  handler          |                           +------------------+
+-------------------+
       │
  clear localStorage snapshot
       │
       ▼
+-------------------+
| /history (list)   |  ←── liveQuery(db.matches.orderBy('completedAt').reverse())
|                   |       → Svelte readable
+-------------------+
       │  tap row
       ▼
+-------------------+
| /history/:id      |  ←── db.matches.get(id) → detail view + averages
| (detail)          |
+-------------------+

+-------------------+
| /data (Daten)     |  export: exportDB(db) → Blob → <a download>
|                   |  import: <input file> → peakImportFile() → confirm → importInto(db, blob, {clearTablesBeforeImport: true})
+-------------------+
```

### Recommended Project Structure

```
src/
├── db/
│   ├── db.ts              # AppDB — add version(2) with matches table
│   ├── profiles.ts        # unchanged
│   └── matches.ts         # NEW: typed CRUD + liveQuery readable for matches
├── stores/
│   └── match.svelte.ts    # unchanged dispatch/snapshot logic; add restoreFromSnapshot() helper
├── routes/
│   ├── +page.svelte       # REPLACE: start screen with resume prompt + menu
│   ├── setup/             # unchanged
│   ├── bulloff/           # unchanged
│   ├── match/             # minor: hook match-complete → persist + clear snapshot
│   ├── display/           # unchanged
│   ├── history/
│   │   ├── +page.svelte   # NEW: match history list
│   │   └── [id]/
│   │       └── +page.svelte  # NEW: match detail view
│   └── data/
│       └── +page.svelte   # NEW: Daten/Backup — export + import
└── lib/
    └── storage.ts         # NEW: navigator.storage.persist() + estimate() helpers
```

### Pattern 1: Dexie version(2) — additive table addition

**What:** Add a `matches` table in a new version block without touching v1.
**When to use:** Whenever new tables or indexes are needed on an existing deployed DB.

```typescript
// Source: dexie.org/docs/Tutorial/Design#database-versioning
// src/db/db.ts

import { Dexie, type EntityTable } from 'dexie';

export interface Profile { /* unchanged — DO NOT rename fields */ }

export interface MatchRecord {
  id?: number;          // auto-increment primary key
  completedAt: number;  // Date.now() — indexed for orderBy
  winnerId: string;     // indexed for per-player history (Phase 4)
  state: MatchState;    // full serialized MatchState blob — NOT indexed
}

class AppDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  matches!: EntityTable<MatchRecord, 'id'>;

  constructor() {
    super('NevermanDarts');

    // Version 1: profiles only. DO NOT mutate this block.
    this.version(1).stores({
      profiles: '++id, name, createdAt'
    });

    // Version 2: match history. Phase 3.
    // Only declare the new table — Dexie carries profiles forward automatically.
    this.version(2).stores({
      matches: '++id, completedAt, winnerId'
    });
  }
}

export const db = new AppDB();
```

**Key notes:**
- `completedAt` index enables `orderBy('completedAt').reverse()` for newest-first list [VERIFIED: dexie.org/docs/Version/Version.stores()]
- `winnerId` index enables per-player history queries in Phase 4 [VERIFIED: dexie.org/docs/Version/Version.stores()]
- `state` field (the full `MatchState` blob) is NOT indexed — never index large objects [VERIFIED: dexie.org/docs/Version/Version.stores()]
- No `.upgrade()` needed because we're only adding a table, not transforming existing data

### Pattern 2: Crash-resume via localStorage snapshot

**What:** On start-screen load, parse the existing snapshot and check if it represents an unfinished match.
**When to use:** Any time the app initialises at `/`.

```typescript
// Source: existing match.svelte.ts + types.ts contracts

const LS_SNAPSHOT = 'neverman-match-snapshot'; // MUST match match.svelte.ts constant

function loadUnfinishedMatch(): MatchState | null {
  try {
    const raw = localStorage.getItem(LS_SNAPSHOT);
    if (!raw) return null;
    const state = JSON.parse(raw) as MatchState;
    // Guard: must be a real in-progress match, not a completed one or empty setup
    if (
      state.phase === 'playing' || state.phase === 'leg-complete'
    ) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

// On "Fortsetzen": assign directly to matchStore.state (Svelte 5 $state is assignable)
// and navigate to /match. The state carries the full eventLog, so undo works.
matchStore.state = unfinishedState;
goto(`${base}/match`);

// On "Verwerfen": clear the snapshot, then navigate to setup flow normally.
localStorage.removeItem(LS_SNAPSHOT);
goto(`${base}/setup`);
```

**Why direct assignment (not event replay):** `MatchState` is the complete serialized shape — all positions, scores, and `eventLog` are in the snapshot. Direct assignment to `matchStore.state` restores the exact mid-game position instantly. Replay via `reduce(initialState(), ...log)` also works (it is equivalent) but is unnecessary overhead and requires no additional code. [ASSUMED — both approaches valid; direct assignment is simpler]

**Critical constraint:** The `LS_SNAPSHOT` key constant must match both `match.svelte.ts` and `display.svelte.ts`. Do not introduce a second key for resume.

### Pattern 3: Match persist on match-complete

**What:** When the reducer transitions to `phase === 'match-complete'`, persist to Dexie and clear the resume slot.
**When to use:** Hook into `MatchStore.dispatch()` after the state update.

```typescript
// Source: existing match.svelte.ts pattern + db/profiles.ts CRUD pattern

// In MatchStore.dispatch(), after: this.state = reduce(this.state, action);
if (this.state.phase === 'match-complete') {
  // Persist to history (fire-and-forget — non-fatal)
  this.#persistCompletedMatch(this.state);
}

async #persistCompletedMatch(state: MatchState): Promise<void> {
  try {
    const winner = state.players.reduce((a, b) =>
      (b.setsEnabled ? b.setsWon : b.legsWon) > (b.setsEnabled ? a.setsWon : a.legsWon) ? b : a
    );
    await db.matches.add({
      completedAt: Date.now(),
      winnerId: winner.id,
      state
    });
    // Clear resume slot — match is complete, nothing to resume
    localStorage.removeItem('neverman-match-snapshot');
  } catch {
    // DB unavailable (private mode) — match still played, history just not saved
  }
}
```

### Pattern 4: liveQuery-backed Svelte readable for history list

**What:** Reactive list of matches ordered newest-first, mirroring the profiles.ts pattern exactly.
**When to use:** History list route component.

```typescript
// Source: dexie.org/docs/liveQuery() + existing profiles.ts pattern [VERIFIED: dexie.org]

import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type MatchRecord } from './db.js';

export function matchesLive(): Readable<MatchRecord[]> {
  return readable<MatchRecord[]>([], (set) => {
    const subscription = liveQuery(async () => {
      try {
        return await db.matches.orderBy('completedAt').reverse().toArray();
      } catch {
        return [];
      }
    }).subscribe({
      next: set,
      error: () => set([])
    });
    return () => subscription.unsubscribe();
  });
}

export async function deleteMatch(id: number): Promise<void> {
  await db.matches.delete(id);
}

export async function getMatch(id: number): Promise<MatchRecord | undefined> {
  return db.matches.get(id);
}
```

### Pattern 5: Export / import with dexie-export-import

**What:** Export all tables to a Blob, trigger browser download; import from file with replace-all.
**When to use:** Daten/Backup screen.

```typescript
// Source: dexie.org/docs/ExportImport/dexie-export-import [VERIFIED: dexie.org]
import { exportDB, importInto, peakImportFile } from 'dexie-export-import';

// ── Export ────────────────────────────────────────────────────────────────

export async function exportAllData(): Promise<void> {
  const blob = await exportDB(db);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10); // "2026-06-12"
  a.href = url;
  a.download = `neverman-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────────

// Step 1: validate the file is a Neverman backup before showing the D-12 confirm dialog
export async function validateImportFile(blob: Blob): Promise<{ valid: boolean; errorDe: string | null }> {
  try {
    const metadata = await peakImportFile(blob);
    if (metadata.data.databaseName !== 'NevermanDarts') {
      return { valid: false, errorDe: 'Diese Datei gehört nicht zu Neverman Darts.' };
    }
    return { valid: true, errorDe: null };
  } catch {
    return { valid: false, errorDe: 'Die Datei konnte nicht gelesen werden oder ist beschädigt.' };
  }
}

// Step 2: called only after user confirms the D-12 dialog
export async function importAllData(blob: Blob): Promise<void> {
  await importInto(db, blob, {
    clearTablesBeforeImport: true,
    acceptVersionDiff: true  // allow importing from same DB at older schema version
  });
}
```

**File naming convention:** `neverman-backup-YYYY-MM-DD.json` — date in filename, no time component (human-readable, no OS filename-illegal chars). [ASSUMED — no standard mandates this; consistent with common backup conventions]

### Pattern 6: Storage persistence guard

**What:** Request persistent storage on first app load; show a German warning if estimate > 80%.
**When to use:** Call once in the start-screen `$effect` or layout `$effect`.

```typescript
// Source: MDN StorageManager API [CITED: developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist]
// src/lib/storage.ts

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch { /* non-fatal */ }
}

export async function getStorageWarning(): Promise<string | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    const pct = (est.usage ?? 0) / (est.quota ?? 1);
    if (pct > 0.8) {
      return `Speicher fast voll (${Math.round(pct * 100)}% belegt). Bitte Daten exportieren und alte Matches löschen.`;
    }
    return null;
  } catch { return null; }
}
```

### Anti-Patterns to Avoid

- **Mutating the version(1) block in db.ts:** Dexie's "a version with an upgrader attached must never be altered" rule applies; but even without an upgrader, changing an existing version block can cause schema drift on already-deployed DBs. Always add `version(2)`. [VERIFIED: dexie.org/docs/Tutorial/Design#database-versioning]
- **Indexing the full `state` blob:** Only index fields you query against (`completedAt`, `winnerId`). Indexing a serialized `MatchState` (potentially 50–200 KB) would degrade IndexedDB performance substantially. [VERIFIED: dexie.org/docs/Version/Version.stores()]
- **Storing the in-progress match in IndexedDB:** The async write path introduces complexity (await in dispatch, error handling, cleanup on complete) with no meaningful durability benefit over the already-synchronous localStorage write that dispatch() already performs.
- **Using window.opener for spectator–scorer communication:** Already forbidden by CLAUDE.md.
- **A second localStorage key for resume:** Dual keys (one for spectator, one for resume) will diverge — they'd be written from different code paths. The single `neverman-match-snapshot` key serves both purposes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Export entire IndexedDB to file | Custom `JSON.stringify` of `db.profiles.toArray()` + `db.matches.toArray()` | `dexie-export-import` `exportDB()` | Handles streaming (large DBs don't crash tab), preserves schema metadata, handles ArrayBuffers/Dates, supports progress callbacks; official Dexie addon maintained alongside core library |
| Import with table clearing | Manual `db.profiles.clear()` + `db.profiles.bulkAdd(...)` loop | `dexie-export-import` `importInto(..., {clearTablesBeforeImport: true})` | Runs inside a single IndexedDB transaction; handles version differences; `peakImportFile()` for pre-validation |
| Reactive DB list | `onupgradeneeded` listener + manual re-query | `liveQuery()` + Svelte `readable` | Already established in profiles.ts; liveQuery re-fires on any write to the queried table |

**Key insight:** The data layer for this phase is almost entirely handled by Dexie 4's existing API surface and the official addon. The real implementation work is in the UI routes (start screen, history list, detail, data screen) and the match-complete hook in `MatchStore`.

---

## Common Pitfalls

### Pitfall 1: Breaking the spectator display by changing the snapshot key

**What goes wrong:** Renaming `neverman-match-snapshot` or writing a different shape to it causes `DisplayStore.connect()` (which hardcodes `SNAPSHOT_KEY = 'neverman-match-snapshot'`) to silently show the idle screen instead of the live match. The constant is duplicated in `match.svelte.ts` and `display.svelte.ts`.
**Why it happens:** Two files share the same constant string but are not imported from a single source of truth.
**How to avoid:** Never rename the key. If the constant needs to move, extract it to a shared `src/lib/sync-constants.ts` and import from both files.
**Warning signs:** Spectator window shows "Warte auf Match…" while a match is in progress.

### Pitfall 2: Restoring a `match-complete` state as "in-progress"

**What goes wrong:** The last snapshot written by `dispatch()` is written *after* `phase` transitions to `match-complete` (because `dispatch` writes after `reduce`). If the check on load only looks for `raw !== null`, it would show a "resume" prompt for an already-finished match.
**Why it happens:** The snapshot is updated on every dispatch including the match-winning dart.
**How to avoid:** The resume check must be `state.phase === 'playing' || state.phase === 'leg-complete'`. The match-complete hook in Pattern 3 also explicitly removes the snapshot, providing a second line of defense.
**Warning signs:** Resume prompt appears after a match has been completed.

### Pitfall 3: Dexie version(2) not seen by an already-open DB connection

**What goes wrong:** In development, hot-reload can leave a stale Dexie connection that does not see the new version block, causing the `matches` table to be `undefined` at runtime.
**Why it happens:** The singleton `db` object persists across hot reloads; Dexie's version negotiation happens at open-time.
**How to avoid:** In development, hard-reload (Ctrl+Shift+R) after adding a new version block. In tests using `fake-indexeddb/auto`, each test run starts fresh — no issue. In production (PWA), the service worker activates the new bundle atomically.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'add')` on `db.matches.add(...)`.

### Pitfall 4: Import with `acceptVersionDiff` missing on a re-installed device

**What goes wrong:** After clearing browser data and reinstalling the PWA, the IndexedDB starts at version 1 (no data). Importing a backup from a device at schema version 2 fails because `dexie-export-import` checks DB version by default.
**Why it happens:** `importInto` by default rejects files whose embedded `databaseVersion` does not match the open DB's version.
**How to avoid:** Always pass `acceptVersionDiff: true` to `importInto`. The tables are guaranteed to exist (Dexie `ensureDbOpen()` runs all version blocks before any operation).
**Warning signs:** Import fails silently or throws "Version mismatch" even though the file is valid.

### Pitfall 5: SvelteKit route ID collision for history detail

**What goes wrong:** Naming the detail route `/history/[id]` where `id` is a Dexie auto-increment integer — on page reload, `+page.ts` receives `id` as a string; calling `db.matches.get(id)` with a string key returns `undefined`.
**Why it happens:** URL parameters are always strings in SvelteKit.
**How to avoid:** Parse: `const id = parseInt(params.id, 10);` and guard with `if (isNaN(id))` before querying.
**Warning signs:** Detail view shows empty/undefined data on direct URL load or reload.

### Pitfall 6: Export of dexie-export-import format not human-readable

**What goes wrong:** `exportDB()` produces a Blob (likely Uint8Array chunks) — if the user opens the file in a text editor it looks like binary or tightly-packed JSON.
**Why it happens:** The library streams output as binary chunks for efficiency.
**How to avoid:** For this app's data volumes (a few hundred KB at most), readability is a nice-to-have but not critical. The import path reads the Blob directly back — no need to parse it manually. If human-readability is desired, a custom hand-rolled export (Pattern 5 alternative) could `JSON.stringify(..., null, 2)` but would lose the streaming and metadata features of the official addon. [ASSUMED — the streaming format works; human-readability is a cosmetic concern, not a correctness concern]

---

## Code Examples

### Deriving history row display data from a stored MatchRecord

```typescript
// Source: src/engine/averages.ts (computeAverage) + src/engine/types.ts (MatchState)
// No new utility needed — averages.ts already provides computeAverage.

import { computeAverage } from '../engine/averages.js';
import type { MatchRecord } from '../db/db.js';

interface HistoryRow {
  id: number;
  date: string;            // e.g. "12.06." (German short date)
  result: string;          // e.g. "3:1"
  winner: string;          // player name
  format: string;          // e.g. "501 Double Out"
  completedAt: number;
}

function toHistoryRow(record: MatchRecord): HistoryRow {
  const { state } = record;
  const winner = state.players.find(p => p.id === record.winnerId) ?? state.players[0];
  const d = new Date(record.completedAt);
  const date = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const outRule = state.config.outRule === 'double' ? 'Double Out' : 'Single Out';
  const format = `${state.config.startScore} ${outRule}`;

  // Result: legs (or sets) — e.g. "3:1" or "2:0"
  const scoreA = state.config.setsEnabled ? state.players[0].setsWon : state.players[0].legsWon;
  const scoreB = state.config.setsEnabled ? state.players[1].setsWon : state.players[1].legsWon;
  const result = state.players.length === 2 ? `${scoreA}:${scoreB}` : `${winner.legsWon} Legs`;

  return { id: record.id!, date, result, winner: winner.name, format, completedAt: record.completedAt };
}

// Per-player match average for the detail view:
function playerMatchAverage(player: PlayerState, startScore: number): number | null {
  return computeAverage(player.visits, startScore, player.remaining);
}
```

### SvelteKit route for history detail (id param handling)

```typescript
// src/routes/history/[id]/+page.ts
import type { PageLoad } from './$types.js';
import { db } from '../../../db/db.js';
import { error } from '@sveltejs/kit';

export const prerender = false;  // dynamic — do NOT prerender
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(404, 'Ungültige Match-ID');
  const record = await db.matches.get(id);
  if (!record) throw error(404, 'Match nicht gefunden');
  return { record };
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dexie-react-hooks` `useLiveQuery` for reactive queries | `liveQuery()` wrapped in Svelte `readable` (no extra package) | Phase 1 established | CLAUDE.md explicitly flags dexie-react-hooks as React-specific; the Svelte pattern is already in use for profiles |
| localStorage as primary data store | localStorage for tiny prefs + snapshots only; Dexie/IndexedDB for data | Phase 1 decision | CLAUDE.md mandates this split explicitly |

**Deprecated/outdated for this project:**
- `dexie-react-hooks`: React-specific, forbidden by CLAUDE.md
- `localStorage` for match history: ~5 MB string limit, no queries, CLAUDE.md forbidden

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Direct assignment `matchStore.state = parsedState` restores mid-match correctly; Svelte 5 runes `$state` field is directly assignable from outside the class | Code Examples / Pattern 2 | If Svelte 5 prevents external assignment to class `$state` fields (e.g., requires a setter), a `restore(state: MatchState)` method on `MatchStore` is needed — trivially added; logic is identical |
| A2 | `dexie-export-import` streaming format is not human-readable; a hand-rolled approach is needed if human-readability is required | Pitfall 6 | Low risk — the use case is backup/restore, not manual editing; the Blob approach is correct regardless |
| A3 | File naming `neverman-backup-YYYY-MM-DD.json` is appropriate | Pattern 5 | Cosmetic only; any `.json` name works |
| A4 | The `#persistCompletedMatch` winner detection logic (reduce to find max legsWon/setsWon) is correct for multi-player | Pattern 3 | The reducer already correctly increments legsWon/setsWon; the `match-complete` phase transition only occurs when a winner exists — so `winnerId` will always resolve |
| A5 | `acceptVersionDiff: true` is the correct option name for `importInto` in dexie-export-import 4.4.0 | Pattern 5 | If option name has changed, the import will throw a version error on clean-install devices — test with a version-2 backup file |

---

## Open Questions (RESOLVED)

1. **Should the in-progress match snapshot be included in export?**
   - What we know: CONTEXT.md says "default assumption: export covers profiles + completed history only; the live match is device-local"
   - What's unclear: If a user exports during a live match, the export won't include the unfinished match state
   - Recommendation: Exclude — `dexie-export-import` exports only the `matches` table (completed) and `profiles` table. The localStorage snapshot is intentionally not in the file. Document this in the Daten screen UI.
   - **RESOLVED:** No — the in-progress match is excluded. Plan 03's objective scopes export to `exportDB(db)` over the Dexie `profiles` + `matches` tables only; the live match lives in the `neverman-match-snapshot` localStorage key and is intentionally device-local (CONTEXT D-10 + the Claude's-discretion note: `export covers profiles + completed history only; the live match is device-local`). Plan 03 Task 3 surfaces this with the import description copy `Laufende Spiele sind nicht enthalten.` No schema change resulted, so the default assumption held.

2. **`phase === 'leg-complete'` — is this a real phase in the current engine?**
   - What we know: `src/engine/types.ts` shows `phase: 'setup' | 'playing' | 'leg-complete' | 'match-complete'`
   - What's unclear: Whether `leg-complete` is ever durably written to localStorage (it's likely transient, replaced by `playing` on the next dispatch)
   - Recommendation: Include `leg-complete` in the resume guard (safe), but note it is likely a UI-only transient phase — the snapshot written after a leg-win dart will have `phase: 'leg-complete'` until the next leg's first dart. The resume prompt showing for this state is correct behavior (the match is unfinished).
   - **RESOLVED:** Treated as resumable. Plan 01 Task 1's `loadUnfinishedMatch()` resume guard returns the parsed state when `state.phase === 'playing' || state.phase === 'leg-complete'` (and null for `setup` / `match-complete` / corrupt JSON). A reload during the inter-leg window (snapshot written after a leg-win dart, before the next leg's first dart) therefore still restores correctly and surfaces the resume prompt — the match is unfinished, so this is the intended behavior. The unit `<behavior>` block explicitly asserts `loadUnfinishedMatch()` returns the parsed state for `phase 'leg-complete'`.

3. **Multi-player result string format**
   - What we know: D-04 says "final leg/set result (e.g. '3:1')" — this implies 2-player phrasing
   - What's unclear: 3–4 player matches don't have a simple A:B format
   - Recommendation: For 2 players, use "A:B" (legsWon); for 3–4 players, show winner name + legs won (e.g. "Alex 3 Legs"). Keep this as a detail for the planner to decide on history row formatting.
   - **RESOLVED:** Per Plan 02 Task 1's `toHistoryRow()` / HistoryRow format decision. Two-player matches use a `"n:m"` result string (from `legsWon`, or from `setsWon` when the match is `setsEnabled`), rendered in the row as "[Winner] · n:m · [Loser]" with the winner name in accent. Three-to-four-player matches drop the `a:b` form and render "[Winner] gewinnt — n Legs" (winner name + legs won). Plan 02 Task 1's `<behavior>` block tests all three branches: the `"n:m"` result for a 2-player match, the sets-based result for a `setsEnabled` match, and the winner + legs (no `a:b`) form for a 3–4 player match.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build / test | ✓ | (existing project) | — |
| fake-indexeddb | Vitest node tests for matches | ✓ | 6.2.5 | — |
| dexie-export-import | export/import feature | ✗ (not yet installed) | 4.4.0 on npm | Hand-rolled JSON export (loses streaming + schema metadata) |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:**
- `dexie-export-import` — not installed; `npm install dexie-export-import` required before implementing Daten/Backup screen. Fallback (hand-rolled) is viable but the addon is preferred.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vite.config.ts` (root) — two projects: `unit` (node) and `browser` (chromium) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-03 | `loadUnfinishedMatch()` returns state for phase=playing, null for phase=match-complete, null for missing key | unit | `npm run test:unit -- src/lib/storage.test.ts` | ❌ Wave 0 |
| FLOW-03 | `loadUnfinishedMatch()` returns null for corrupt JSON in localStorage | unit | `npm run test:unit -- src/lib/storage.test.ts` | ❌ Wave 0 |
| FLOW-03 | MatchStore restores state correctly when `matchStore.state` is assigned a saved MatchState | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ✅ (extend) |
| FLOW-03 | After match-complete, localStorage snapshot is cleared | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ✅ (extend) |
| STAT-06 | `db.matches.add(record)` persists and `matchesLive()` emits it | unit | `npm run test:unit -- src/db/matches.test.ts` | ❌ Wave 0 |
| STAT-06 | `matchesLive()` orders records newest-first by completedAt | unit | `npm run test:unit -- src/db/matches.test.ts` | ❌ Wave 0 |
| STAT-06 | `deleteMatch(id)` removes a record and `matchesLive()` updates | unit | `npm run test:unit -- src/db/matches.test.ts` | ❌ Wave 0 |
| STAT-06 | `toHistoryRow()` derives correct date, result, winner, format from MatchRecord | unit | `npm run test:unit -- src/db/matches.test.ts` | ❌ Wave 0 |
| PROF-03 | `validateImportFile()` rejects a Blob with wrong `databaseName` with German error | unit | `npm run test:unit -- src/lib/backup.test.ts` | ❌ Wave 0 |
| PROF-03 | `validateImportFile()` returns valid for a correctly exported Blob | unit | `npm run test:unit -- src/lib/backup.test.ts` | ❌ Wave 0 |
| PROF-03 | `importAllData()` clears existing tables before inserting imported rows | unit | `npm run test:unit -- src/lib/backup.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test` (unit + browser)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/storage.ts` + `src/lib/storage.test.ts` — covers FLOW-03 resume detection logic
- [ ] `src/db/matches.ts` + `src/db/matches.test.ts` — covers STAT-06 CRUD + liveQuery
- [ ] `src/lib/backup.ts` + `src/lib/backup.test.ts` — covers PROF-03 export/import wrapper
- [ ] Extend `src/stores/match.svelte.test.ts` — covers FLOW-03 match-complete snapshot clear
- [ ] Install `dexie-export-import`: `npm install dexie-export-import`

---

## Security Domain

> `security_enforcement: true`, ASVS level 1

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this app |
| V3 Session Management | no | No session tokens |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | yes | `validateImportFile()` — reject non-Neverman blobs before any DB write; `peakImportFile()` catches malformed JSON; parseInt for route params |
| V6 Cryptography | no | No sensitive data; no encryption needed for a local darts scoring app |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed import file causing DB corruption | Tampering | `peakImportFile()` pre-validation + `databaseName` check before any DB write |
| Importing a file from a different app (wrong schema) | Tampering | `databaseName !== 'NevermanDarts'` guard returns German error, aborts |
| URL parameter injection in `/history/[id]` | Tampering | `parseInt(params.id, 10)` + `isNaN` guard; Dexie `.get()` returns `undefined` for non-existent keys |
| localStorage snapshot injection (BroadcastChannel is same-origin) | Spoofing | `DisplayStore.connect()` already parses inside try/catch; Phase 3 resume uses the same guard |
| Storage quota exhaustion causing silent data loss | Denial of Service | `navigator.storage.persist()` on app init; `navigator.storage.estimate()` warning at >80% [CITED: developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist] |

---

## Sources

### Primary (HIGH confidence)
- `dexie.org/docs/Tutorial/Design#database-versioning` — version(2) additive pattern, upgrader constraints [VERIFIED: fetched 2026-06-12]
- `dexie.org/docs/liveQuery()` — liveQuery Observable API, Svelte store pattern [VERIFIED: fetched 2026-06-12]
- `dexie.org/docs/ExportImport/dexie-export-import` — exportDB/importInto API, clearTablesBeforeImport, peakImportFile, JSON format [VERIFIED: fetched 2026-06-12]
- `dexie.org/docs/Version/Version.stores()` — index syntax (++, &, *, compound), what NOT to index [VERIFIED: fetched 2026-06-12]
- npm registry — dexie@4.4.3, dexie-export-import@4.4.0, fake-indexeddb@6.2.5 [VERIFIED: npm view 2026-06-12]
- `src/db/db.ts`, `src/db/profiles.ts`, `src/stores/match.svelte.ts`, `src/stores/display.svelte.ts`, `src/engine/types.ts`, `src/engine/averages.ts` — existing code contracts read directly [VERIFIED: codebase]
- `developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist` — navigator.storage.persist() / .estimate() [CITED: MDN fetched 2026-06-12]

### Secondary (MEDIUM confidence)
- Existing `src/db/profiles.test.ts` pattern — `fake-indexeddb/auto` import + `beforeEach(db.table.clear)` structure confirmed in codebase

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Dexie 4.4.3 already installed; dexie-export-import 4.4.0 verified on npm and official docs; patterns verified in existing codebase
- Architecture: HIGH — existing code contracts read directly; spectator handshake and localStorage key verified in source
- Pitfalls: HIGH — most derived from direct reading of existing source + verified Dexie docs

**Research date:** 2026-06-12
**Valid until:** 2026-09-12 (Dexie 4.x is stable; dexie-export-import 4.x tracks Dexie)
