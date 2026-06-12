---
phase: 03-persistence-data
plan: "02"
subsystem: persistence
tags: [match-history, dexie-v2, liveQuery, STAT-06, D-04, D-05, D-06, D-08, D-09]
dependency_graph:
  requires: [loadUnfinishedMatch, clearUnfinishedMatch, MatchStore.restore, ConfirmDialog]
  provides: [MatchRecord, db.matches, matchesLive, getMatch, deleteMatch, toHistoryRow, history-list, history-detail, PlayerStatRow, HistoryRow, persist-on-complete]
  affects: [src/stores/match.svelte.ts, src/db/db.ts, src/routes/history/+page.svelte]
tech_stack:
  added: []
  patterns: [dexie-version2-additive, liveQuery-readable, fire-and-forget-persist, parseInt-isNaN-guard, ConfirmDialog-reuse]
key_files:
  created:
    - src/db/matches.ts
    - src/db/matches.test.ts
    - src/routes/history/+page.ts
    - src/routes/history/[id]/+page.ts
    - src/routes/history/[id]/+page.svelte
    - src/ui/history/HistoryRow.svelte
    - src/ui/history/PlayerStatRow.svelte
  modified:
    - src/db/db.ts
    - src/stores/match.svelte.ts
    - src/stores/match.svelte.test.ts
    - src/routes/history/+page.svelte
decisions:
  - "Winner derived from state.players[state.activePlayerIndex] on match-complete — reducer leaves activePlayerIndex pointing at winner; simpler than reduce-max over legsWon/setsWon"
  - "localStorage stub in test uses arrow-function closures over a local Record<string,string> (not _store property) to satisfy svelte-check TypeScript strict mode"
  - "history/+page.ts (prerender=false, ssr=false) added as separate loader file — overrides layout-level prerender=true for the dynamic liveQuery route"
  - "Phase 4 growth region is empty whitespace (min-height: 32px), no placeholder text — per UI-SPEC extension contract"
metrics:
  duration: "7 min"
  completed_date: "2026-06-12"
  tasks: 3
  files: 11
---

# Phase 03 Plan 02: Match History Vertical Slice Summary

Match history vertical slice (STAT-06): Dexie v2 `matches` table with `MatchRecord`, persist-on-complete hook in MatchStore, `/history` liveQuery list with HistoryRow, `/history/[id]` detail with PlayerStatRow and guarded delete.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Dexie v2 matches table + CRUD + persist-on-complete | 3e9c2f0 | db.ts, matches.ts, matches.test.ts, match.svelte.ts, match.svelte.test.ts |
| 2 | History list route + HistoryRow + empty state | 43a1fd4 | history/+page.svelte, history/+page.ts, HistoryRow.svelte, match.svelte.test.ts |
| 3 | Match detail loader + view + delete with ConfirmDialog | 2c64df9 | history/[id]/+page.ts, history/[id]/+page.svelte, PlayerStatRow.svelte |

## What Was Built

- `src/db/db.ts`: `MatchRecord` interface + `version(2).stores({ matches: '++id, completedAt, winnerId' })` — additive, v1 block untouched
- `src/db/matches.ts`: `matchesLive()` (liveQuery→readable, newest-first), `getMatch(id)` (try/catch→undefined), `deleteMatch(id)` (no try/catch, consistent with profiles.ts), `toHistoryRow(record)` (German date, 2-player "n:m" / sets-enabled "n:m" / 3-4 player "n Legs", winner name, format string)
- `src/stores/match.svelte.ts`: `#persistCompletedMatch()` private async method — fire-and-forget on `phase === 'match-complete'`; try/catch (T-03-06); uses `state.players[state.activePlayerIndex].id` for winner; clears `LS_SNAPSHOT` from localStorage (D-08)
- `src/routes/history/+page.svelte`: full Surface 3 — liveQuery list via `matchesLive()`, `{#each $matches as record (record.id)}` → HistoryRow, conditional empty state ("Noch keine Spiele."), back chevron → `${base}/`
- `src/routes/history/+page.ts`: `prerender=false; ssr=false` override for dynamic liveQuery route
- `src/ui/history/HistoryRow.svelte`: 64px min-height row, Secondary `#1e2027`, date+result top row, winner name in accent `#e8a020`/600 + other name in `#f0f0f0`/400, format subtitle in `#888888`, trailing `›`, navigates to `/history/[id]`
- `src/routes/history/[id]/+page.ts`: `parseInt(params.id, 10)` + `isNaN` guard → 404 (T-03-04); `db.matches.get(id)` → 404 if undefined; returns `{ record }`
- `src/routes/history/[id]/+page.svelte`: summary card (long German date, format line, result headline with winner in accent), "Ergebnis" scoreboard section, Phase 4 empty growth region, outlined-destructive "Spiel löschen" button → ConfirmDialog (backdropDismiss=true), on confirm calls `deleteMatch` + navigates back
- `src/ui/history/PlayerStatRow.svelte`: winner surface `#22242d` / non-winner `#1e2027`, player name (600 accent for winner, 400 for others), legs/sets singular/plural ("1 Leg"/"n Legs"/"1 Satz"/"n Sätze"), "Ø Match: n.n" via `computeAverage` or "—"
- `src/db/matches.test.ts`: 14 tests — CRUD add/read/delete/getMatch, matchesLive() newest-first ordering, toHistoryRow() variants (2-player, sets-enabled, 3-player, singular leg)
- `src/stores/match.svelte.test.ts` extended: 2 new tests — persist-on-complete writes to `db.matches` with correct `winnerId`, localStorage resume slot removed after match-complete (198 total tests green)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] localStorage stub `_store` TypeScript error**
- **Found during:** Task 2 `npm run check`
- **Issue:** `vi.stubGlobal('localStorage', { _store: {} as Record<string,string>, ... })` caused svelte-check error "Property '_store' does not exist on type '{}'" because the global `localStorage` interface has no `_store` property
- **Fix:** Replaced with arrow-function closures over a local `const store: Record<string, string> = {}` variable — cleaner pattern, no property access on the global type, consistent with `display.svelte.ts` test pattern
- **Files modified:** `src/stores/match.svelte.test.ts`

**2. [Rule 3 - Blocking] history/+page.ts needed as separate loader file**
- **Found during:** Task 2 implementation
- **Issue:** Plan said to set `export const prerender = false; export const ssr = false;` in `+page.svelte`, but SvelteKit `svelte-check` requires a separate `+page.ts` loader for route-level SSR/prerender overrides on dynamic routes that need to coexist with a layout `prerender=true`
- **Fix:** Created `src/routes/history/+page.ts` with the two exports; `+page.svelte` imports remain clean
- **Files modified:** `src/routes/history/+page.ts` (created)

## Known Stubs

None. All plan objectives fully implemented:
- `matchesLive()` wired to the history list
- `toHistoryRow()` derives all display data
- `#persistCompletedMatch` fires on match-complete
- Detail view shows real scoreboard + computed averages
- Delete flow fully functional with ConfirmDialog

## Threat Flags

None. All threat mitigations from the plan's threat register implemented:
- T-03-04: `parseInt(params.id, 10)` + `isNaN` → 404 in `history/[id]/+page.ts`
- T-03-05: No `{@html}` in HistoryRow, PlayerStatRow, or detail page — all player names/dates/stats via `{interpolation}`
- T-03-06: `#persistCompletedMatch` wrapped in try/catch — failed add is atomic, match still played

## Verification Results

- `npm run test:unit -- src/db/matches.test.ts src/stores/match.svelte.test.ts`: 32/32 passed
- `npm run check`: 1 error (pre-existing `profiles.ts` type error, out of scope — documented in 03-01-SUMMARY.md), 0 new errors
- `npm run test:unit` (full): 198/198 passed (no regression)

## Self-Check: PASSED
