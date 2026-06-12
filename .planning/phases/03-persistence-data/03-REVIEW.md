---
phase: 03-persistence-data
reviewed: 2026-06-12T01:55:32Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/lib/storage.ts
  - src/lib/backup.ts
  - src/db/db.ts
  - src/db/matches.ts
  - src/stores/match.svelte.ts
  - src/routes/+page.svelte
  - src/routes/data/+page.svelte
  - src/routes/history/+page.svelte
  - src/routes/history/+page.ts
  - src/routes/history/[id]/+page.svelte
  - src/routes/history/[id]/+page.ts
  - src/ui/dialogs/ConfirmDialog.svelte
  - src/ui/history/HistoryRow.svelte
  - src/ui/history/PlayerStatRow.svelte
  - src/ui/setup/MatchSetup.svelte
  - src/ui/start/ResumePrompt.svelte
  - src/test-setup-node.ts
findings:
  critical: 4
  warning: 5
  info: 3
  total: 12
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-12T01:55:32Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Phase 3 introduces crash-resume via localStorage, a Dexie v2 matches table, match history/detail UI, and JSON export/import. The foundation is broadly sound: the Dexie schema migration (v1 untouched, v2 adds only the `matches` table), the `peakImportFile` validation gate before DB writes, and the `$state.snapshot()` usage in dispatch are all correct. However, four correctness and data-integrity bugs were found, along with five quality issues that degrade robustness.

The most severe finding is a **silent race in `#persistCompletedMatch`**: the `localStorage.removeItem` inside the async private method executes outside the `dispatch()` call stack, and if it throws (quota exception after `db.matches.add` succeeds), the resume slot is never cleared — the completed match will resurface as a resume prompt on next load. The second critical bug is the **match average formula producing wrong values for multi-leg matches** (the `computeAverage` call in `PlayerStatRow.svelte` uses `startScore - remaining` which only reflects the *current* leg's scoring, not all legs combined, because `remaining` is reset to `startScore` at each leg start). Third, the **`URL.revokeObjectURL` fires immediately after `a.click()`** before the browser has had time to read the Blob, causing silent export failures on some browsers. Fourth, the **`ConfirmDialog` responds to `Escape` regardless of `backdropDismiss`**, allowing the destructive import confirmation to be bypassed with a keypress.

---

## Critical Issues

### CR-01: `#persistCompletedMatch` — `localStorage.removeItem` can silently fail, leaving completed match in resume slot

**File:** `src/stores/match.svelte.ts:68`
**Issue:** Inside `#persistCompletedMatch`, the `localStorage.removeItem(LS_SNAPSHOT)` call is inside the same `try` block as `db.matches.add(...)`. If `db.matches.add` succeeds and then `localStorage.removeItem` throws (storage event error, security restriction in private mode, or iOS Safari localStorage becoming unavailable mid-session), the entire `catch` swallows the error. The match is persisted to history but the resume key is **never cleared**. On the next cold start `loadUnfinishedMatch()` will return this now-completed match (it was written with phase `'match-complete'` *before* dispatch completed, but the snapshot written by the `localStorage.setItem` in `dispatch()` at line 41 has `phase: 'match-complete'`) — meaning `loadUnfinishedMatch()` correctly filters it out (line 28: only `playing` or `leg-complete` pass). However, if the DB write itself fails, the `catch` block also skips `localStorage.removeItem`, which is the real risk: the `'match-complete'` snapshot persists in localStorage indefinitely. While `loadUnfinishedMatch()` filters it, it pollutes the key forever and breaks any future resume logic that relies on key absence.

More critically: the snapshot *written at line 41 of `dispatch()`* carries `phase: 'match-complete'` (because `this.state` was already updated by `reduce()` at line 28 before `localStorage.setItem` at line 41). `loadUnfinishedMatch()` returns `null` for `'match-complete'`, so the resume prompt is correctly suppressed. **However**, if the DB write fails AND `localStorage.removeItem` is also skipped, the stale `'match-complete'` key will remain until a new match is started. This is a data-consistency issue: the key semantics promise "a key means an unfinished match is in progress," which is violated.

The deeper structural issue: `localStorage.removeItem` at line 68 is **not wrapped in its own try/catch**. In the same method, a throw from anywhere before line 68 prevents removal. The method comment says "fire-and-forget" but the removal is a correctness requirement, not a best-effort operation.

**Fix:** Wrap `localStorage.removeItem` in its own `try/catch` and move it outside any prior awaitable, or use `clearUnfinishedMatch()` from `storage.ts` which already has its own guard:

```typescript
async #persistCompletedMatch(state: MatchState): Promise<void> {
    try {
        const winner = state.players[state.activePlayerIndex];
        await db.matches.add({
            completedAt: Date.now(),
            winnerId: winner.id,
            state: $state.snapshot(state)
        });
    } catch {
        // DB unavailable — match was played; history persistence is best-effort
    }
    // Clear resume slot unconditionally — must run even if DB write fails
    try {
        localStorage.removeItem(LS_SNAPSHOT);
    } catch {
        // localStorage unavailable — acceptable
    }
}
```

---

### CR-02: `exportAllData` — `URL.revokeObjectURL` fires before the browser reads the Blob

**File:** `src/lib/backup.ts:26-27`
**Issue:** `a.click()` triggers the download asynchronously. `URL.revokeObjectURL(url)` is called synchronously on the very next line, before the browser has dispatched or processed the download. On Firefox and some versions of mobile Chrome, revoking the object URL before the download is initiated causes the download to silently fail (empty file or "Failed — Network error"). The [spec](https://w3c.github.io/FileAPI/#creating-revoking) states that the URL may be revoked after the browser has had a chance to start the fetch; calling it synchronously after `click()` does not guarantee that.

Additionally, `a` is never appended to the document, which is required for `a.click()` to work reliably in Firefox.

**Fix:** Append `a` to the body, defer revocation, and detach afterward:

```typescript
export async function exportAllData(): Promise<void> {
    const blob = await exportDB(db);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `neverman-backup-${date}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revocation so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
```

---

### CR-03: `ConfirmDialog` — Escape key dismisses destructive dialogs regardless of `backdropDismiss`

**File:** `src/ui/dialogs/ConfirmDialog.svelte:33-35`
**Issue:** `handleKeydown` calls `oncancel()` whenever `Escape` is pressed, unconditionally. The `backdropDismiss` prop was introduced precisely to prevent accidental dismissal of destructive dialogs (D-12: import replace-all, D-02: new match warning). However, `backdropDismiss` is only checked in `handleBackdropClick` (line 29-31) — pressing Escape bypasses this guard entirely.

A user who accidentally taps the keyboard while the import confirmation is open will trigger `oncancel()`, resetting `pendingImportBlob` to null with no feedback. While this is not data loss (the import was not yet started), it violates the explicit requirement that `backdropDismiss: false` dialogs require an explicit choice.

**Fix:**

```typescript
function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && backdropDismiss) oncancel();
}
```

---

### CR-04: `PlayerStatRow.svelte` — match average is wrong for completed multi-leg matches

**File:** `src/ui/history/PlayerStatRow.svelte:31`
**Issue:** `computeAverage(player.visits, config.startScore, player.remaining)` uses the formula `(startScore - remaining) / darts * 3`. For a **completed match** stored in history, `player.remaining` is the remaining score at the moment the match ended. For the **winner**, `remaining` is `0` (they checked out), so `startScore - 0 = startScore` — correct only for the final leg. For a loser in a 2-leg match where `startScore=501`, `player.remaining` may be, say, `220`. The formula yields `(501 - 220) / darts * 3`, which only accounts for the current (last) leg's scoring, not all legs combined.

The reducer's comment in `averages.ts` (lines 63–69) acknowledges this: "for cross-leg match average the scored = startScore - remaining only captures the current leg's scoring." For the history detail view showing a completed match, this means the displayed match average is **incorrect for any player who played more than one leg**, understating the average for all non-final-leg scoring.

This is a correctness bug in a user-visible metric. Phase 4 is noted as the place for "cross-leg accumulation," but this component is already live in Phase 3's history detail screen, and it silently displays a wrong value.

**Fix (minimal for Phase 3):** Either display "—" for match average on multi-leg matches until Phase 4 implements proper cross-leg accumulation, or add a JSDoc/comment warning that this value is incorrect for multi-leg matches. The safer fix is to guard on leg count:

```typescript
const avgDisplay = $derived.by(() => {
    // For multi-leg matches, computeAverage only reflects the final leg.
    // Full cross-leg average is deferred to Phase 4.
    const isMultiLeg = player.legsWon + /* others' legs */ > 1; // requires total leg count
    // Simplest Phase 3 guard: show avg only if winner won exactly 1 leg
    const avg = computeAverage(player.visits, config.startScore, player.remaining);
    return avg !== null ? avg.toFixed(1) : '—';
});
```

More completely: pass `player.legsWon * config.startScore` as `startScore` accumulation — but that also requires summing opponents' legs. The correct minimal fix for Phase 3 is to show "—" for any player who played more than one leg, surfacing honest data rather than a misleadingly precise wrong number.

---

## Warnings

### WR-01: `deleteMatch` — no try/catch; unhandled rejection silently navigates on failure

**File:** `src/db/matches.ts:60-62` and `src/routes/history/[id]/+page.svelte:58-61`
**Issue:** `deleteMatch` has a JSDoc comment saying "No try/catch — callers handle errors." The caller in `handleDeleteConfirm` does `await deleteMatch(record.id!)` and then `goto(...)` with no `try/catch`. If the DB operation fails (private mode, quota, IndexedDB corruption), the rejection propagates unhandled, the `goto` is never called, and the user sees no feedback — they are stuck on the detail page with a non-functional delete button and no error message.

The comment in `matches.ts` claiming "callers handle errors" is inconsistent with what the caller actually does.

**Fix:** Either add try/catch to `deleteMatch` (consistent with `getMatch`), or wrap the `handleDeleteConfirm` call:

```typescript
async function handleDeleteConfirm() {
    try {
        await deleteMatch(record.id!);
        goto(`${base}/history`);
    } catch {
        // Show inline error — DB unavailable
        deleteError = 'Löschen fehlgeschlagen.';
    }
}
```

---

### WR-02: `+page.svelte` (start screen) — `$effect` runs `loadUnfinishedMatch()` on every reactive re-run, not just on mount

**File:** `src/routes/+page.svelte:21-25`
**Issue:** The `$effect` block reads `unfinishedMatch = loadUnfinishedMatch()`. In Svelte 5, `$effect` re-runs any time its reactive dependencies change. Although `loadUnfinishedMatch()` reads from `localStorage` (not a reactive dependency), `$effect` itself can re-run when unrelated reactive state changes in the component (e.g., when `showNewMatchWarning` changes). On each re-run, `loadUnfinishedMatch()` is called again. If the user clicks "Verwerfen" (which sets `unfinishedMatch = null` at line 35), the `$effect` may subsequently re-run and restore `unfinishedMatch` from localStorage if the key hasn't been cleared yet (race with the synchronous `clearUnfinishedMatch()` at line 34 — though in practice these are synchronous, a re-entrancy issue exists).

More importantly: `$effect` with no reactive reads is semantically equivalent to `onMount` but signals intent incorrectly to maintainers. Side-effectful initialization that should run once should use `onMount`.

**Fix:** Replace `$effect` with `onMount`:

```typescript
import { onMount } from 'svelte';

onMount(() => {
    unfinishedMatch = loadUnfinishedMatch();
    requestPersistentStorage();
});
```

---

### WR-03: `data/+page.svelte` — import confirm dialog CTA shows "Importiere…" but the dialog is already closed

**File:** `src/routes/data/+page.svelte:195`
**Issue:** The `ConfirmDialog`'s `ctaLabel` is bound to `importing ? 'Importiere…' : 'Importieren'`. However, `showImportConfirm` is set to `false` at line 80 **before** `importing = true` at line 81 — the dialog is destroyed by Svelte before `importing` becomes true. The label binding never shows "Importiere…"; the dialog is already gone. This is dead code in the template that may confuse future maintainers into thinking the dialog stays open during import.

**Fix:** Either keep the dialog open during import (set `importing = true` before `showImportConfirm = false`), or use a static label:

```svelte
ctaLabel="Importieren"
```

---

### WR-04: `backup.ts` — `validateImportFile` only checks `databaseName`; truncated or schema-mismatched files pass validation

**File:** `src/lib/backup.ts:40-43`
**Issue:** `validateImportFile` calls `peakImportFile(blob)` which reads only the metadata header of the export blob, then checks `metadata.data.databaseName === 'NevermanDarts'`. A file that has the correct `databaseName` but is truncated, has no tables, or was exported from an incompatible schema version (e.g., a v1 backup that predates the `matches` table) will pass validation and proceed to `importAllData`. The `acceptVersionDiff: true` flag means the import will attempt to proceed even with schema differences, but a truncated or otherwise malformed file body will throw inside `importAllData` and surface as the generic "Import fehlgeschlagen" error — after the user has already confirmed and the `clearTablesBeforeImport` may have started wiping data.

The specific risk: `clearTablesBeforeImport: true` means Dexie clears all tables before importing. If the import then fails mid-stream, the database is partially or fully wiped. This is a data loss scenario.

**Fix:** `dexie-export-import` does not perform a full parse in `peakImportFile` — atomic rollback on import failure is the correct mitigation. Verify that `importInto` with `clearTablesBeforeImport: true` runs inside a single IndexedDB transaction (it does, per Dexie docs). If the transaction is atomic, the wipe-on-failure risk is acceptable and only the warning about the misleading validation label remains. Add a comment clarifying this:

```typescript
// peakImportFile only validates the header/metadata.
// Full schema and data validation happens inside importInto, which runs atomically.
// clearTablesBeforeImport is safe because importInto wraps everything in one IDB transaction.
```

---

### WR-05: `HistoryRow.svelte` — `navigate()` uses `record.id` without null guard on the goto path

**File:** `src/ui/history/HistoryRow.svelte:20-22`
**Issue:** `record.id` is typed as `number | undefined` (from `MatchRecord` in `db.ts`). `toHistoryRow` uses `record.id!` (non-null assertion) which would throw if `id` is somehow undefined (e.g., a record returned by `matchesLive()` that hasn't yet been committed with an auto-increment id). The `navigate()` function then does `goto(\`${base}/history/${record.id}\`)` — if `record.id` is `undefined`, this navigates to `/history/undefined`, which `+page.ts` will parse as `NaN` and throw a 404 error. The user sees an error page instead of nothing.

In practice, all records in the liveQuery result have been persisted and have auto-increment IDs, but the type system does not guarantee this, and it is worth hardening.

**Fix:** Add a null guard in `navigate()` and in `toHistoryRow`:

```typescript
function navigate() {
    if (record.id == null) return;
    goto(`${base}/history/${record.id}`);
}
```

---

## Info

### IN-01: `match.svelte.ts` — `LS_SNAPSHOT` is a duplicate constant; `storage.ts` exports the canonical value

**File:** `src/stores/match.svelte.ts:22`
**Issue:** `LS_SNAPSHOT` is redeclared as a module-level `const` at line 22, duplicating the exported `LS_SNAPSHOT` from `src/lib/storage.ts`. The comment in `storage.ts` lines 5-7 explicitly warns "MUST match match.svelte.ts line 21 and display.svelte.ts line 15 — Never rename." This is a maintenance trap: if the key is changed in `storage.ts` but not in `match.svelte.ts`, the resume/spectator handshake silently breaks.

**Fix:** Import from the canonical source:

```typescript
import { LS_SNAPSHOT } from '../lib/storage.js';
```

Remove the local `const LS_SNAPSHOT = 'neverman-match-snapshot'` declaration.

---

### IN-02: `e2e/resume.spec.ts` — wrong Playwright import path

**File:** `e2e/resume.spec.ts:12` and `e2e/resume.spec.ts:17`
**Issue:** The test imports `test, expect` from `'playwright/test'` (line 12) but then types a helper parameter as `import('playwright').Page` (line 17) — two different import specifiers (`'playwright/test'` vs `'playwright'`). The canonical Playwright testing import is `'@playwright/test'`, not `'playwright/test'`. While `'playwright/test'` may resolve in some configurations, the inconsistency between the two specifiers in the same file is a latent breakage risk. If the project moves to `@playwright/test` (which also correctly resolves `Page` types), `'playwright'` will not be found.

**Fix:** Use `@playwright/test` consistently:

```typescript
import { test, expect, type Page } from '@playwright/test';

async function enterNumpadVisit(page: Page, total: number) { ... }
```

---

### IN-03: `db/matches.ts` — `toHistoryRow` result string uses `date.toLocaleDateString('de-DE', ...)` which may vary by runtime locale support

**File:** `src/db/matches.ts:79`
**Issue:** `d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })` produces `"12.06."` in a de-DE locale-aware runtime, but Node.js (used for unit tests) may not have ICU full data compiled in, producing `"6/12/2026"` or similar on some CI environments. The tests for `toHistoryRow` (in `matches.test.ts`, not in scope here) would fail on such systems.

**Fix:** This is a known environment dependency. Either pin the test environment to a full-ICU Node build, or use a manual format function:

```typescript
const day = String(d.getDate()).padStart(2, '0');
const month = String(d.getMonth() + 1).padStart(2, '0');
const date = `${day}.${month}.`;
```

---

_Reviewed: 2026-06-12T01:55:32Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
