# Phase 3: Persistence & Data - Context

**Gathered:** 2026-06-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Make match data durable and portable. Three deliverables:

1. **Crash/reload resume (FLOW-03):** an in-progress match survives a browser reload or crash and resumes exactly where it stopped — scores, leg/set counts, whose turn it is.
2. **Match history (STAT-06):** completed matches are stored persistently and browsable in a history list with a per-match detail view.
3. **Export/import (PROF-03):** all data (profiles + match history) can be exported to a single JSON file and imported on another device or after clearing browser data.

This phase also introduces a real start screen at `/` to host these entry points.

**Not this phase:** the full statistics suite, charts, score bands, checkout %, lifetime aggregates (Phase 4) — only results/averages already derivable today appear in the history detail view; achievements/records (Phase 4); audio/auto-pause (Phase 5); PWA install/offline/deploy (Phase 6). No cloud sync / cross-device live sync (out of scope project-wide).

</domain>

<decisions>
## Implementation Decisions

### Resume an in-progress match
- **D-01:** On app load, if an unfinished match exists, show a **prompt** ("Laufendes Spiel fortsetzen?") with **Fortsetzen / Verwerfen** before entering the scoring view. Not a silent auto-resume. This prompt surfaces on the new start screen (see D-07).
- **D-02:** Only one match runs at a time. Starting a **new** match while an unfinished one is saved → **warn first** ("Es läuft noch ein Spiel — verwerfen und neues starten?"), then replace. No silent overwrite; no hard block.
- **D-03:** "Verwerfen" / replace discards the in-progress match — it is **not** kept (consistent with D-08: abandoned matches are not recorded).

### Match history list & detail
- **D-04:** History list rows show **date/time + final leg/set result (e.g. "3:1") + winner highlighted**, with the format (e.g. "501 Double Out") as a small subtitle. Not a minimal winner-only line; not the average-in-row dense variant.
- **D-05:** Tapping a row opens a **per-match detail view**: final scoreboard plus each player's match 3-dart average and other numbers derivable today. This same screen is the growth surface Phase 4 enriches (score bands, checkout %, charts) — design it to extend, not as a throwaway.
- **D-06:** History list default ordering: newest match first (most-recent on top). *(Claude discretion on exact sort controls.)*

### Navigation / entry points
- **D-07:** Turn `/` into a **real start screen** (small menu): **Neues Spiel · Match-Verlauf · Daten/Backup**. This replaces the current bare redirect-to-`/setup`. The resume prompt (D-01) appears here on load. "Neues Spiel" leads into the existing setup flow.

### What gets recorded
- **D-08:** **Only completed matches** (a player wins → phase `match-complete`) are written to history. Abandoned/discarded/replaced matches simply disappear — they never enter history. Keeps history meaningful and Phase 4 lifetime stats clean.
- **D-09:** The user can **delete a single match** from history (e.g. from its detail view), guarded by a **confirmation**. Phase 4 lifetime stats recompute from whatever matches remain. *(A bulk "gesamten Verlauf löschen" is not required this phase — Claude discretion whether to add a guarded one on the Daten screen.)*

### Export / import
- **D-10:** **Export** produces a **single JSON file** containing all profiles and all match history (stats are derived from matches, so they ride along; no separate stats store exists yet in Phase 3). *(File naming/format detail = Claude discretion.)*
- **D-11:** **Import = replace-all.** Wipe local data, then restore the file as the new truth. No merge, no de-duplication, no ID-collision logic. Optimised for the stated use cases: device transfer, and restore after clearing browser data.
- **D-12:** Replace-all import is guarded by a **single clear confirmation** dialog that names the consequence ("Ersetzt alle aktuellen Profile und den Verlauf"). No auto-backup-before-wipe required.

### Claude's Discretion
- Where the active in-progress match is persisted for crash-safety (localStorage vs IndexedDB) — see code_context; a full match snapshot is already written to `localStorage` on every dart. Durability vs simplicity trade-off is the researcher/planner's to make.
- Dexie schema design for matches (and whether an `events` table is needed) — DB **version 2** migration. STATE.md flagged this as needing a focused research pass.
- Export JSON file naming, schema/versioning field, and pretty-printing.
- Rejecting a malformed / non-Neverman import file with a clear German error and changing nothing (sensible engineering even though the simpler confirm-only guard was chosen for D-12).
- Exact start-screen layout/styling, history sort controls, confirmation dialog wording and styling, German labels throughout.
- Whether the in-progress unfinished match is included in the export (default assumption: export covers profiles + completed history only; the live match is device-local) — confirm during planning if it changes the schema.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/REQUIREMENTS.md` — FLOW-03, STAT-06, PROF-03 define this phase's scope with precise wording (survive reload/crash & resume exactly; browse history with results + key stats; export/import all data as JSON).
- `.planning/ROADMAP.md` — Phase 3 goal and the three success criteria.
- `.planning/PROJECT.md` — constraints (GitHub Pages static / on-device only, German UI, dark mode) and out-of-scope (no backend, no cross-device live sync, no cloud accounts).

### Prior phase context (stay consistent)
- `.planning/phases/01-playable-x01-match/01-CONTEXT.md` — D-16: Dexie used from day one; profiles table is v1; Phase 3 adds match history/state persistence onto the **existing** DB, no in-memory migration.
- `.planning/phases/02-spectator-display/02-CONTEXT.md` — the BroadcastChannel + localStorage snapshot handshake and the `/display` route; the live-match localStorage snapshot reused for resume must not break spectator hydration.

### Stack & code contracts
- `CLAUDE.md` (repo root) — locked stack (SvelteKit 2 + Svelte 5 runes, TS ~5.9, Dexie 4); "localStorage only for tiny prefs, Dexie for the data model"; `navigator.storage.persist()` / `.estimate()` guidance so data isn't evicted under storage pressure.
- `src/db/db.ts` — `AppDB` (Dexie `NevermanDarts`); **version(1) = profiles only; version(2)+ explicitly reserved for "Phase 3 (matches, events tables)"**. `ensureDbOpen()` already degrades gracefully in private/storage-restricted mode.
- `src/engine/types.ts` — `MatchState` is the serializable persisted shape; **fields are frozen ("DO NOT rename")**; it carries a replayable `eventLog: MatchAction[]`.
- `src/stores/match.svelte.ts` — `MatchStore` already writes a full `JSON.stringify(state)` snapshot to `localStorage` key `neverman-match-snapshot` on every dispatch (built for spectator hydration; reusable for resume). On reload the singleton currently resets to `initialState()` — **no restore-on-load exists yet**.
- `src/db/profiles.ts` — typed CRUD + `liveQuery`-backed Svelte readable; the pattern to mirror for a new matches table.
- `src/engine/averages.ts` — `legAverage` / `matchAverage`; supplies the numbers for history rows and the detail view.

No external ADRs/specs exist — greenfield repo; requirements fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/match.svelte.ts` — already serialises the full match to localStorage every dispatch; restore-on-load can read this back through the reducer/`MatchState`. Singleton `matchStore` is what `/match`, `/display` consume.
- `src/db/db.ts` + `src/db/profiles.ts` — established Dexie + typed-CRUD + `liveQuery` readable pattern to copy for a `matches` table; `ensureDbOpen()` failure-tolerant wrapper to reuse.
- `src/engine/averages.ts`, `src/engine/types.ts` — match results and averages for history rows/detail derive from the persisted `MatchState` / `PlayerState.visits`.
- `src/routes/+page.svelte` — currently just `goto('/setup')`; this is the file that becomes the real start screen (D-07).

### Established Patterns
- **Dexie schema versioning:** add `this.version(2).stores({...})` for the matches table — do NOT mutate the v1 block (db.ts comment is explicit).
- **Serializable event-log state:** `MatchState` + replayable `eventLog`; resume = persist snapshot and rehydrate (no bespoke serialization needed).
- **Graceful storage degradation:** all DB/localStorage access wrapped in try/catch so private mode / quota issues never crash play (T-01-02 / T-04-02 precedent).
- **liveQuery → Svelte readable** for reactive DB-backed lists (use for the history list).
- German UI + dark mode throughout (e.g. "Daneben", "Warte auf Match…").

### Integration Points
- New route(s): start screen at `/` (D-07), a history list route, a per-match detail route, and a Daten/Backup screen (export/import). All base-path aware (`$app/paths` `base`) per the GitHub Pages subpath requirement.
- The `/setup` → `/bulloff` → `/match` flow stays; "Neues Spiel" from the start screen enters it; the new-match warning (D-02) hooks in before START_MATCH overwrites a saved match.
- On `match-complete`, persist the finished match to the Dexie matches table (D-08) and clear the active-match resume slot.
- Resume slot vs spectator snapshot: both currently the same localStorage key — planner must decide if resume needs its own durable store (IndexedDB) without breaking `/display` hydration.

</code_context>

<specifics>
## Specific Ideas

- German labels surfaced in discussion: "Laufendes Spiel fortsetzen?", "Fortsetzen", "Verwerfen", "Es läuft noch ein Spiel — verwerfen und neues starten?", "Neues Spiel", "Match-Verlauf", "Daten/Backup", "Ersetzt alle aktuellen Profile und den Verlauf".
- History row mental model: "12.06. · Alex 3:1 Ben · 501 Double Out" with the winner emphasised.
- Detail view is explicitly the screen Phase 4 grows into — plan it as extensible, not throwaway.

</specifics>

<deferred>
## Deferred Ideas

- **Merge-on-import** (combine two devices' data with de-duplication) — deliberately rejected for Phase 3 in favour of replace-all (D-11). If real multi-device merging is ever wanted, it's its own scoped effort.
- **Bulk "gesamten Verlauf löschen"** — not required this phase; optional Claude-discretion add on the Daten screen (guarded).
- **Cross-device transfer of an *in-progress* match via the export file** — possible later; Phase 3 assumes export covers profiles + completed history.

</deferred>

---

*Phase: 3-Persistence & Data*
*Context gathered: 2026-06-12*
