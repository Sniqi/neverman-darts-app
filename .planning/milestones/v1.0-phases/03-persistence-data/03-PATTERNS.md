# Phase 3: Persistence & Data — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 12 new/modified files
**Analogs found:** 12 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/db.ts` | config/schema | CRUD | `src/db/db.ts` itself (extend) | self |
| `src/db/matches.ts` | service | CRUD | `src/db/profiles.ts` | exact |
| `src/db/matches.test.ts` | test | CRUD | `src/db/profiles.test.ts` | exact |
| `src/lib/storage.ts` | utility | request-response | `src/lib/wake-lock.svelte.ts` | role-match |
| `src/lib/backup.ts` | utility | file-I/O | `src/db/profiles.ts` (async pattern) | partial |
| `src/stores/match.svelte.ts` | store | event-driven | `src/stores/match.svelte.ts` itself (extend) | self |
| `src/routes/+page.svelte` | component/route | request-response | `src/routes/display/+page.svelte` | role-match |
| `src/routes/history/+page.svelte` | component/route | CRUD | `src/routes/display/+page.svelte` | role-match |
| `src/routes/history/[id]/+page.svelte` | component/route | CRUD | `src/routes/display/+page.svelte` | role-match |
| `src/routes/history/[id]/+page.ts` | loader | request-response | `src/routes/+layout.ts` | partial |
| `src/routes/data/+page.svelte` | component/route | file-I/O | `src/routes/display/+page.svelte` | role-match |
| `src/ui/dialogs/ConfirmDialog.svelte` | component | request-response | `src/ui/overlays/MatchWinOverlay.svelte` (closest overlay) | partial |

---

## Pattern Assignments

### `src/db/db.ts` (extend — add version 2)

**Analog:** `src/db/db.ts` (lines 1–43, full file)

**Existing schema pattern** (lines 12–25):
```typescript
class AppDB extends Dexie {
	profiles!: EntityTable<Profile, 'id'>;

	constructor() {
		super('NevermanDarts');
		// Version 1: profiles only.
		// version(2)+ reserved for Phase 3 (matches, events tables) — do not add tables here.
		this.version(1).stores({
			profiles: '++id, name, createdAt'
		});
	}
}
```

**Extension pattern — add after the v1 block:**
```typescript
// Add to AppDB class declaration:
matches!: EntityTable<MatchRecord, 'id'>;

// Add after this.version(1) block in constructor:
// Version 2: match history. Phase 3.
// Only declare new table — Dexie carries profiles forward automatically.
this.version(2).stores({
    matches: '++id, completedAt, winnerId'
});
```

**New interface to add to db.ts** (before the class):
```typescript
export interface MatchRecord {
    id?: number;         // auto-increment primary key
    completedAt: number; // Date.now() — indexed for orderBy
    winnerId: string;    // indexed for per-player history (Phase 4)
    state: MatchState;   // full serialized MatchState blob — NOT indexed
}
```

**Import addition needed at top of db.ts:**
```typescript
import type { MatchState } from '../engine/types.js';
```

**Critical rule from db.ts (line 18 comment):** "DO NOT add tables here" (in v1 block). Always add `version(2)`.

---

### `src/db/matches.ts` (new service, CRUD)

**Analog:** `src/db/profiles.ts` (lines 1–82, full file — exact mirror)

**Imports pattern** (profiles.ts lines 1–8):
```typescript
import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type Profile } from './db.js';
```
For matches.ts, replace with:
```typescript
import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type MatchRecord } from './db.js';
```

**liveQuery readable pattern** (profiles.ts lines 67–82):
```typescript
export function profilesLive(): Readable<Profile[]> {
    return readable<Profile[]>([], (set) => {
        const subscription = liveQuery(async () => {
            try {
                const all = await db.profiles.toArray();
                return all.sort((a, b) => a.name.localeCompare(b.name));
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
```
For matches, replace the inner query with `orderBy('completedAt').reverse().toArray()` — no sort needed (index handles it).

**Graceful failure pattern** (profiles.ts lines 53–60):
```typescript
export async function listProfiles(): Promise<Profile[]> {
    try {
        const all = await db.profiles.toArray();
        return all.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}
```
All DB operations wrapped in try/catch returning empty/undefined, never throwing. Mirror for `getMatch(id)`.

**Delete pattern** (profiles.ts line 46–47):
```typescript
export async function deleteProfile(id: number): Promise<void> {
    await db.profiles.delete(id);
}
```
Mirror as `deleteMatch(id: number)` — no try/catch here (callers handle; consistent with profiles.ts pattern).

---

### `src/db/matches.test.ts` (new test, CRUD)

**Analog:** `src/db/profiles.test.ts` (lines 1–67, full file — exact mirror)

**Test file header pattern** (profiles.test.ts lines 1–10):
```typescript
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { createProfile, updateProfile, deleteProfile, listProfiles } from './profiles';

describe('profiles CRUD (PROF-01)', () => {
    beforeEach(async () => {
        await db.profiles.clear();
    });
```
For matches.test.ts: `import { db } from './db'` + import matches helpers. `beforeEach` clears `db.matches`.

**Assertion pattern** (profiles.test.ts lines 13–22):
```typescript
const id = await createProfile('alex');
const all = await db.profiles.toArray();
expect(all).toHaveLength(1);
expect(all[0].id).toBe(id);
```
Mirror: `db.matches.add(record)` → verify via `db.matches.toArray()` or `matchesLive()` emission.

---

### `src/lib/storage.ts` (new utility, request-response)

**Analog:** `src/lib/wake-lock.svelte.ts` (lines 1–36, full file)

**Async utility wrapper pattern** (wake-lock.svelte.ts lines 12–19):
```typescript
export async function acquireWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return;
    try {
        sentinel = await navigator.wakeLock.request('screen');
    } catch {
        // Power-saver mode, permission denied, or other rejection — acceptable.
    }
}
```
Apply same shape to `requestPersistentStorage()` and `getStorageWarning()`:
- Guard `navigator.storage?.persist` before calling (capability check pattern from wake-lock)
- Wrap entire body in try/catch returning null/void on failure
- Non-fatal — never throws

**Key constant to reuse in storage.ts:**
```typescript
const LS_SNAPSHOT = 'neverman-match-snapshot'; // MUST match match.svelte.ts
```
This constant is defined in match.svelte.ts (line 21) and display.svelte.ts (line 15 as `SNAPSHOT_KEY`). The resume detection function `loadUnfinishedMatch()` must use this exact string.

**Resume detection pattern** (derives from match.svelte.ts lines 38–43 and display.svelte.ts lines 33–40):
```typescript
// display.svelte.ts lines 33-40 — localStorage parse pattern to mirror:
try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (raw) {
        this.state = JSON.parse(raw) as MatchState;
    }
} catch {
    // Corrupt or invalid JSON — leave state null
}
```
For `loadUnfinishedMatch()`: same parse-in-try/catch, then guard `state.phase === 'playing' || state.phase === 'leg-complete'` before returning non-null (see RESEARCH Pitfall 2).

---

### `src/lib/backup.ts` (new utility, file-I/O)

**Analog:** `src/db/profiles.ts` async CRUD pattern (try/catch, typed returns)

No exact analog for file export/import in the codebase. Closest structural pattern is the async try/catch wrappers in profiles.ts and wake-lock.svelte.ts.

**Async error-handling pattern to follow** (wake-lock.svelte.ts lines 22–30):
```typescript
export async function releaseWakeLock(): Promise<void> {
    if (sentinel) {
        try {
            await sentinel.release();
        } catch {
            // Ignore release errors
        } finally {
            sentinel = null;
        }
    }
}
```

**Import pattern for dexie-export-import** (new, no analog — use RESEARCH Pattern 5 verbatim):
```typescript
import { exportDB, importInto, peakImportFile } from 'dexie-export-import';
import { db } from '../db/db.js';
```

**Blob download pattern** (no analog — standard browser pattern, RESEARCH Pattern 5):
```typescript
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `neverman-backup-${date}.json`;
a.click();
URL.revokeObjectURL(url);
```

---

### `src/stores/match.svelte.ts` (modify — add persist-on-complete + restore method)

**Analog:** `src/stores/match.svelte.ts` (lines 1–85, full file — extend in place)

**Dispatch pattern to extend** (lines 26–44):
```typescript
dispatch(action: MatchAction): void {
    this.state = reduce(this.state, action);

    // Publish to spectator display — non-fatal
    try {
        const ch = new BroadcastChannel(BC_CHANNEL);
        ch.postMessage($state.snapshot(this.state));
        ch.close();
    } catch { }

    // Persist snapshot for cold-start hydration
    try {
        localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
    } catch { }
}
```
**Add after the existing try/catch blocks** — check `this.state.phase === 'match-complete'` and call `this.#persistCompletedMatch(this.state)` (fire-and-forget private method). Do NOT await inside dispatch().

**Private async method pattern** (no existing example — use `#` private field, TypeScript class pattern):
```typescript
async #persistCompletedMatch(state: MatchState): Promise<void> {
    try {
        // ... db.matches.add + localStorage.removeItem(LS_SNAPSHOT)
    } catch {
        // DB unavailable — match played, history not saved
    }
}
```

**Restore method to add** (assignment pattern from RESEARCH Pattern 2, assumption A1):
```typescript
restore(state: MatchState): void {
    this.state = state;
}
```
Direct assignment to `$state` field — same pattern as `this.state = reduce(...)` in dispatch().

**LS_SNAPSHOT constant** (line 21, do NOT change):
```typescript
const LS_SNAPSHOT = 'neverman-match-snapshot';
```

---

### `src/routes/+page.svelte` (replace — becomes start screen)

**Analog:** `src/routes/display/+page.svelte` (lines 1–127 script block, lines 199–290 style block)

**Existing file to replace** (lines 1–11, current content):
```svelte
<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    $effect(() => {
        goto(`${base}/setup`);
    });
</script>
<p>Weiterleitung …</p>
```

**Base-path navigation pattern** (display/+page.svelte lines 8, 125–126):
```typescript
import { base } from '$app/paths';
import { goto } from '$app/navigation';
// usage:
goto(`${base}/match`);
goto(`${base}/setup`);
```
All navigation in start screen uses `${base}/` prefix. Navigation links to `/history`, `/data`, `/setup` all follow this pattern.

**$effect for side effects on mount** (display/+page.svelte line 17):
```typescript
$effect(() => displayStore.connect());
```
Start screen uses `$effect(() => { ... })` to read localStorage and check for unfinished match on mount.

**$state for conditional render** (display/+page.svelte lines 77–88):
```typescript
let isFullscreen = $state(false);
let hasEnteredFullscreen = $state(false);
```
Start screen: `let unfinishedMatch = $state<MatchState | null>(null)` — drives `{#if unfinishedMatch}` resume prompt render.

**CSS variables and color tokens in style block** (display/+page.svelte lines 199–235 — exact tokens to reuse):
```css
background: #111318;         /* Dominant */
background: #1e2027;         /* Secondary — card/button bg */
background: #22242d;         /* Active surface */
color: #f0f0f0;
color: #e8a020;              /* Accent */
border: 1px solid #c0392b;   /* Destructive */
background: #c0392b;         /* Filled destructive */
border-radius: 6px;          /* Existing buttons use 6px — UI-SPEC says 8px for Phase 3; use 8px */
```

**Inline SVG icon pattern** (display/+page.svelte lines 169–178):
```svelte
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="..." />
</svg>
```
Use same pattern for chevron icons on menu buttons and back buttons.

---

### `src/routes/history/+page.svelte` (new route, CRUD)

**Analog:** `src/routes/display/+page.svelte` for route shell pattern; `src/db/profiles.ts` for liveQuery store consumption.

**Route shell pattern** (display/+page.svelte lines 1–17):
```svelte
<script lang="ts">
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { displayStore } from '../../stores/display.svelte.js';
    // ...
    $effect(() => displayStore.connect());
    let matchState = $derived(displayStore.state);
```
For history: import `matchesLive` from `../../db/matches.js`, call it at module level, subscribe via `$derived`.

**liveQuery store consumption pattern** (profiles.ts + display.svelte combined):
```svelte
<script lang="ts">
    import { matchesLive } from '../../db/matches.js';
    const matches = matchesLive(); // returns Readable<MatchRecord[]>
    // Use $matches in template for reactive list
</script>
{#each $matches as record (record.id)}
```

**Conditional render for empty state** (display/+page.svelte lines 129–131):
```svelte
{#if matchState === null || matchState.phase === 'setup'}
    <IdleScreen />
{:else}
```
For history: `{#if $matches.length === 0}` → empty state block; `{:else}` → list.

**Back navigation pattern** (display/+page.svelte line 125–126):
```svelte
goto(`${base}/`);
```
Back chevron on all Phase 3 sub-routes uses `goto(\`${base}/\`)` or `history.back()`.

**prerender = false for dynamic routes**: history list is reactive (liveQuery); set `export const prerender = false` at route level or via `+page.ts`. The layout already has `prerender = true` — individual routes can override with their own `+page.ts`.

---

### `src/routes/history/[id]/+page.svelte` (new route, CRUD)

**Analog:** `src/routes/display/+page.svelte` (route shell) + `src/routes/match/+page.svelte` (complex local state)

**Props from loader** (SvelteKit +page.ts pattern — no existing example; use standard `$props()`):
```svelte
<script lang="ts">
    import type { PageData } from './$types.js';
    let { data } = $props<{ data: PageData }>();
    // data.record is MatchRecord
</script>
```

**Destructive button pattern** (match/+page.svelte lines 161–169 — outlined destructive button):
```svelte
<button class="undo-btn" onclick={undo} aria-label="...">
    Rückgängig
</button>
```
```css
.undo-btn {
    border: 1px solid #e8a020;
    color: #e8a020;
    background: transparent;
}
```
For "Spiel löschen": same pattern but with `#c0392b` instead of `#e8a020`.

**computeAverage usage** (src/engine/averages.ts lines 37–42):
```typescript
export function computeAverage(visits: Visit[], startScore: number, remaining: number): number | null
```
In the detail view, call `computeAverage(player.visits, record.state.config.startScore, player.remaining)` per player to render "Ø Match".

---

### `src/routes/history/[id]/+page.ts` (new loader, request-response)

**Analog:** `src/routes/+layout.ts` (lines 1–2 — the only existing `.ts` route file)

**Layout.ts pattern** (lines 1–2):
```typescript
export const prerender = true;
export const ssr = false;
```

**Dynamic route loader pattern** (no existing `+page.ts` with load function — use RESEARCH Code Examples verbatim):
```typescript
// src/routes/history/[id]/+page.ts
import type { PageLoad } from './$types.js';
import { db } from '../../../db/db.js';
import { error } from '@sveltejs/kit';

export const prerender = false;
export const ssr = false;

export const load: PageLoad = async ({ params }) => {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) throw error(404, 'Ungültige Match-ID');
    const record = await db.matches.get(id);
    if (!record) throw error(404, 'Match nicht gefunden');
    return { record };
};
```
**Critical:** `parseInt(params.id, 10)` + `isNaN` guard (RESEARCH Pitfall 5 — URL params are always strings).

---

### `src/routes/data/+page.svelte` (new route, file-I/O)

**Analog:** `src/routes/display/+page.svelte` (route shell + $state + $effect pattern)

**$state for async feedback** (display/+page.svelte lines 77–90):
```typescript
let isFullscreen = $state(false);
let showExit = $state(false);
```
For data screen:
```typescript
let exporting = $state(false);
let importError = $state<string | null>(null);
let importSuccess = $state(false);
let showImportConfirm = $state(false);
let pendingImportBlob = $state<Blob | null>(null);
let storageWarning = $state<string | null>(null);
```

**$effect for mount-time async call** (display/+page.svelte line 17):
```typescript
$effect(() => displayStore.connect());
```
For data screen: `$effect(() => { getStorageWarning().then(w => storageWarning = w); });`

**Hidden file input pattern** (no codebase analog — standard browser pattern per UI-SPEC):
```svelte
<input
    type="file"
    accept=".json"
    style="display:none"
    bind:this={fileInput}
    onchange={handleFileSelected}
/>
<button onclick={() => fileInput.click()}>Datei auswählen</button>
```

**Button loading state pattern** (match/+page.svelte lines 161–170):
```svelte
<button class="undo-btn" onclick={undo}>Rückgängig</button>
```
Pattern: `disabled={exporting}` + label change to "Exportiere…" via `{exporting ? 'Exportiere…' : 'Exportieren'}`.

**aria-live for async feedback** (UI-SPEC accessibility contract — no codebase analog):
```svelte
<div role="status" aria-live="polite">
    {#if importSuccess}Import abgeschlossen.{/if}
</div>
```

---

### `src/ui/dialogs/ConfirmDialog.svelte` (new component, request-response)

**Analog:** Pattern derived from `src/routes/match/+page.svelte` overlay pattern (lines 193–200) and `src/routes/display/+page.svelte` fixed-position overlay (lines 161–190).

**Fixed overlay pattern** (display/+page.svelte lines 161–165):
```svelte
<button
    class="fullscreen-prompt"
    onclick={activateFullscreen}
>
    Vollbild aktivieren
</button>
```
```css
.fullscreen-prompt {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    background: #e8a020;
}
```

**Component props pattern** (Svelte 5 runes, derived from match/+page.svelte):
```svelte
<script lang="ts">
    interface Props {
        heading: string;
        body: string;
        ctaLabel: string;
        ctaStyle: 'destructive' | 'accent';
        backdropDismiss?: boolean;
        onconfirm: () => void;
        oncancel: () => void;
    }
    let { heading, body, ctaLabel, ctaStyle, backdropDismiss = false, onconfirm, oncancel }: Props = $props();
</script>
```

**Backdrop scrim CSS** (no codebase analog — use UI-SPEC value):
```css
.backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
}
.dialog {
    background: #1e2027;
    border-radius: 8px;
    padding: 24px;
    max-width: 360px;
    width: 100%;
}
```

**Accessibility attrs** (UI-SPEC contract):
```svelte
<div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="dialog-heading">
```

---

## Shared Patterns

### Base-path navigation
**Source:** `src/routes/+page.svelte` (line 3), `src/routes/display/+page.svelte` (line 8)
**Apply to:** All new route files
```typescript
import { base } from '$app/paths';
import { goto } from '$app/navigation';
// Always:
goto(`${base}/route-name`);
```

### SSR disabled + prerender config
**Source:** `src/routes/+layout.ts` (lines 1–2)
**Apply to:** `history/+page.ts`, `history/[id]/+page.ts`, `data/+page.svelte`
```typescript
export const prerender = false;
export const ssr = false;
```
Dynamic routes (liveQuery, file input) must set `prerender = false` to override the layout-level `prerender = true`.

### Graceful DB failure (non-fatal try/catch)
**Source:** `src/db/profiles.ts` (lines 53–60, 67–82), `src/lib/wake-lock.svelte.ts` (lines 12–35)
**Apply to:** `src/db/matches.ts`, `src/stores/match.svelte.ts` (#persistCompletedMatch), `src/lib/storage.ts`, `src/lib/backup.ts`
```typescript
try {
    // DB or storage operation
} catch {
    // return empty/null — never throw, never crash the app
}
```

### Svelte 5 runes $state + $derived pattern
**Source:** `src/stores/match.svelte.ts` (lines 24, 46–77), `src/routes/display/+page.svelte` (lines 20–21)
**Apply to:** All new `.svelte` route files
```typescript
// Reactive local state:
let someValue = $state<Type>(defaultValue);
// Derived from store:
let derivedValue = $derived(store.someField);
// Derived with computation:
let computed = $derived.by(() => { ... });
```

### localStorage snapshot key — do not change
**Source:** `src/stores/match.svelte.ts` (line 21), `src/stores/display.svelte.ts` (line 15)
**Apply to:** `src/lib/storage.ts` (loadUnfinishedMatch), `src/stores/match.svelte.ts` (#persistCompletedMatch)
```typescript
const LS_SNAPSHOT = 'neverman-match-snapshot'; // MUST match both files
```
**Never rename this key.** Both match.svelte.ts and display.svelte.ts hardcode it independently.

### Dark mode color tokens (Phase 1/2 established)
**Source:** `src/routes/match/+page.svelte` (lines 203–289), `src/routes/display/+page.svelte` (lines 199–290)
**Apply to:** All new route and component files
```css
background: #111318;    /* dominant — page background */
background: #1e2027;    /* secondary — cards, buttons */
background: #22242d;    /* active surface — winner highlight */
color: #f0f0f0;         /* primary text */
color: #e8a020;         /* accent — winner, CTAs */
color: #888888;         /* subdued — subtitles, labels */
border-color: #2d2d2d;  /* dividers, row separators */
color: #c0392b;         /* destructive */
background: #c0392b;    /* filled destructive button */
border-radius: 8px;     /* Phase 3 UI-SPEC mandates 8px for cards/buttons */
```
Note: existing buttons use `border-radius: 6px`; Phase 3 UI-SPEC mandates `8px` for new surfaces. Do not change existing components.

### Inline SVG icons (no icon library)
**Source:** `src/routes/display/+page.svelte` (lines 169–178, 173–179)
**Apply to:** Start screen chevrons, back buttons on history/data screens
```svelte
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="..." />
</svg>
```

### computeAverage call signature
**Source:** `src/engine/averages.ts` (lines 37–42)
**Apply to:** `src/routes/history/[id]/+page.svelte` (per-player averages in detail view)
```typescript
import { computeAverage } from '../../engine/averages.js';
// per player in detail view:
const avg = computeAverage(player.visits, record.state.config.startScore, player.remaining);
// render: avg !== null ? avg.toFixed(1) : '—'
```

---

## No Analog Found

All files have at least a partial analog in the codebase. Files below have no exact structural match but clear partial analogs:

| File | Role | Data Flow | Best Available Analog | Gap |
|---|---|---|---|---|
| `src/lib/backup.ts` | utility | file-I/O | `src/lib/wake-lock.svelte.ts` (async wrapper pattern) | File I/O (Blob, FileReader) has no existing example — use RESEARCH Pattern 5 verbatim |
| `src/routes/history/[id]/+page.ts` | loader | request-response | `src/routes/+layout.ts` | No existing `load()` function example — use RESEARCH Code Examples verbatim |
| `src/ui/dialogs/ConfirmDialog.svelte` | component | request-response | `src/routes/display/+page.svelte` fixed overlays | No existing reusable dialog component — use UI-SPEC Surface 2 spec as primary reference |

---

## Metadata

**Analog search scope:** `src/db/`, `src/stores/`, `src/routes/`, `src/lib/`, `src/engine/`
**Files scanned:** 14
**Pattern extraction date:** 2026-06-12
