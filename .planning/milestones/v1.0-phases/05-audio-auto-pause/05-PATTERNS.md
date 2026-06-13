# Phase 5: Audio & Auto-Pause — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 8 new/modified files
**Analogs found:** 7 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/audio-caller.ts` | utility | request-response | `src/lib/storage.ts` | role-match (try/catch, no-throw pattern) |
| `src/lib/audio-sfx.ts` | utility | event-driven | `src/lib/storage.ts` | role-match (fire-and-forget, no-throw) |
| `src/lib/audio-prefs.ts` | utility | request-response | `src/lib/storage.ts` | exact (localStorage try/catch read/write) |
| `src/ui/overlays/PauseOverlay.svelte` | component | event-driven | `src/ui/overlays/MatchWinOverlay.svelte` | exact (full-screen overlay, dialog role, CTA button) |
| `src/ui/setup/MatchSetup.svelte` (modified) | component | request-response | self (existing toggle/stepper/seg-control patterns) | exact |
| `src/stores/match.svelte.ts` (modified) | store | CRUD + event-driven | self (existing `$state` fields, dispatch pattern) | exact |
| `src/stores/display.svelte.ts` (modified) | store | request-response | self (existing `connect()`, `isValidMatchState`) | exact |
| `src/routes/match/+page.svelte` (modified) | route | event-driven | self (existing `$effect` visit-watcher, overlay mounting) | exact |
| `src/routes/display/+page.svelte` (modified) | route | event-driven | self (existing `$effect` BC_RECORD_CHANNEL subscription pattern) | exact |

---

## Pattern Assignments

### `src/lib/audio-prefs.ts` (utility, request-response)

**Analog:** `src/lib/storage.ts`

**Imports pattern** (`src/lib/storage.ts` lines 1–9 — no imports; pure localStorage):
```typescript
// No imports required — only localStorage (browser built-in)
// Follow the same module structure: brief comment header, exported functions only
```

**Core localStorage read pattern** (`src/lib/storage.ts` lines 22–36):
```typescript
export function loadUnfinishedMatch(): MatchState | null {
    try {
        const raw = localStorage.getItem(LS_SNAPSHOT);
        if (!raw) return null;
        const state = JSON.parse(raw) as MatchState;
        // ...validate then return
        return state;
    } catch {
        // Corrupt or invalid JSON — treat as no saved match
        return null;
    }
}
```

Apply the same pattern in `loadAudioPrefs()`:
- Wrap the entire read in `try { ... } catch { return { ...DEFAULTS }; }`
- Each `localStorage.getItem()` call returns `string | null`; coerce with `=== 'true'`, `Number()`, or `?? 'de'`
- Never throw; return defaults on any failure

**Core localStorage write pattern** (`src/lib/storage.ts` lines 42–48):
```typescript
export function clearUnfinishedMatch(): void {
    try {
        localStorage.removeItem(LS_SNAPSHOT);
    } catch {
        // localStorage unavailable — acceptable
    }
}
```

Apply same `try { localStorage.setItem(...) } catch { /* ignore */ }` pattern in `saveAudioPref()`.

**Key naming:** All existing keys use a flat string (`'neverman-match-snapshot'`). New keys use `nvm_` prefix per RESEARCH.md: `nvm_caller_enabled`, `nvm_caller_lang`, `nvm_sfx_enabled`, `nvm_pause_enabled`, `nvm_pause_legs`, `nvm_pause_minutes`.

---

### `src/lib/audio-caller.ts` (utility, request-response)

**Analog:** `src/lib/storage.ts` (structural pattern); no closer analog — first Web Speech API file in codebase

**Structural pattern to copy** — module-level cache + exported functions, no class:
```typescript
// src/lib/storage.ts structure:
// [comment header]
// [imports]
// [exported functions only — no default export, no class]
export function loadUnfinishedMatch(): MatchState | null { ... }
export function clearUnfinishedMatch(): void { ... }
```

**No-throw / fire-and-forget pattern** (`src/lib/storage.ts` lines 55–62):
```typescript
export async function requestPersistentStorage(): Promise<void> {
    if (!navigator.storage?.persist) return;
    try {
        await navigator.storage.persist();
    } catch {
        // Permission denied or API unavailable — acceptable
    }
}
```

Apply to `announceVisit()`:
- Guard with `if (typeof speechSynthesis === 'undefined') return;` before any call
- Wrap `speechSynthesis.speak()` in `try { ... } catch { /* never block scoring */ }`
- Return void, never throw

**Capability-check guard pattern** — used in `src/lib/wake-lock.svelte.ts` and `src/lib/storage.ts`:
```typescript
if (!navigator.storage?.persist) return;
// equivalent for speech: if (typeof speechSynthesis === 'undefined') return;
```

---

### `src/lib/audio-sfx.ts` (utility, event-driven)

**Analog:** `src/lib/storage.ts` (no-throw fire-and-forget pattern)

**Pattern:** Same module structure as `audio-caller.ts` above. Key specifics:
- Exported path constants as `const` object — follow the `BC_CHANNEL` / `LS_SNAPSHOT` constant style from `src/lib/sync-constants.ts` (lines 14–23)
- `playSfx(event, sfxEnabled)` returns `void`, never throws
- `new Audio(path).play().catch(() => {})` — the `.catch(() => {})` is mandatory (autoplay policy returns a rejected Promise on Chrome)

**Constant naming** (`src/lib/sync-constants.ts` lines 14–23):
```typescript
/** BroadcastChannel name for live match-state sync to the spectator display. */
export const BC_CHANNEL = 'neverman-match';
/** BroadcastChannel name for record-celebration events (ACHV-02). */
export const BC_RECORD_CHANNEL = 'neverman-record';
/** localStorage key for the cold-start snapshot used by DisplayStore.connect(). */
export const LS_SNAPSHOT = 'neverman-match-snapshot';
```

Follow same JSDoc-per-constant pattern for `SFX_PATHS`.

---

### `src/ui/overlays/PauseOverlay.svelte` (component, event-driven)

**Analog:** `src/ui/overlays/MatchWinOverlay.svelte` (exact — full-screen overlay, dialog ARIA, accent CTA button, fadeIn animation)

**Full component structure to copy** (`src/ui/overlays/MatchWinOverlay.svelte` lines 1–124):

**Imports pattern** (lines 1–8):
```typescript
<script lang="ts">
    // src/ui/overlays/PauseOverlay.svelte
    // [brief purpose comment]

    interface Props {
        pauseActive: boolean;
        remainingSeconds: number;
        showResume?: boolean;   // false on /display, true on /match
        onresume?: () => void;
    }

    let { pauseActive, remainingSeconds, showResume = true, onresume = () => {} }: Props = $props();
</script>
```

**Conditional render pattern** (MatchWinOverlay lines 45–58):
```svelte
{#if matchStore.isMatchComplete}
    <div class="win-overlay" role="dialog" aria-modal="true" aria-label="{winnerName} gewinnt">
```

Apply:
```svelte
{#if pauseActive}
    <div class="pause-overlay" role="dialog" aria-modal="true" aria-label="Pause">
```

**CTA button pattern** (MatchWinOverlay lines 53–55, 107–123):
```typescript
<button class="new-game-btn" onclick={newGame}>Neues Spiel</button>

// CSS:
.new-game-btn {
    height: 56px;
    padding: 0 var(--space-xl, 32px);
    background: #e8a020;
    border: none;
    border-radius: 6px;
    color: #111318;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    min-width: 200px;
    transition: opacity 150ms ease;
}
.new-game-btn:active { opacity: 0.85; }
```

Copy this exactly for the "Weiter" button — same dimensions, same colors.

**Overlay backdrop pattern** (MatchWinOverlay lines 61–70):
```css
.win-overlay {
    position: fixed;
    inset: 0;
    background: rgba(17, 19, 24, 0.96);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 300ms ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

PauseOverlay diff from MatchWinOverlay:
- `z-index: 60` (not 100 — per UI-SPEC z-index table)
- Same `rgba(17, 19, 24, 0.96)` backdrop (most opaque, matching MatchWinOverlay)
- Same `fadeIn 300ms ease-out` entrance animation
- Add `animation: fadeOut 200ms ease-in` on exit (via conditional class or `{#if}` re-render)

**Countdown display pattern** — adapt from `src/ui/overlays/RecordOverlay.svelte` (lines 62–67):
```css
.record-headline {
    font-size: clamp(2.5rem, 6vw, 8rem);
    font-weight: 600;
    color: #e8a020;
}
```

Scale up for 3m readability: `font-size: clamp(4rem, 10vw, 12rem)` per UI-SPEC Display typography row.

**`aria-live` on countdown** (no existing analog — new pattern):
```svelte
<p class="countdown-digits" aria-live="polite">{mm}:{ss}</p>
```

---

### `src/stores/match.svelte.ts` — pause state additions (store, CRUD + event-driven)

**Analog:** Self — existing `$state` fields + `dispatch()` pattern

**New `$state` fields pattern** (match.svelte.ts lines 44–59 — copy the same `$state` declaration style):
```typescript
export class MatchStore {
    state = $state<MatchState>(initialState());
    preloadedRecords = $state<Map<string, LifetimeStats>>(new Map());
    pendingRecords = $state<RecordItem[]>([]);
    // ADD:
    pauseActive = $state(false);
    pauseRemainingSeconds = $state(0);
    pauseLegCount = $state(0);
}
```

**No class decorators, no `$derived` at class level** — plain `$state(initialValue)` fields only.

**Post-dispatch side-effect pattern** (match.svelte.ts lines 62–95) — after the existing BroadcastChannel publish and record detection, add `#checkAutoPause(prevState, nextState)` in the same position:
```typescript
dispatch(action: MatchAction): void {
    const prevState = this.state;
    this.state = reduce(this.state, action);

    // [existing] BroadcastChannel publish
    try {
        const ch = new BroadcastChannel(BC_CHANNEL);
        ch.postMessage($state.snapshot(this.state));
        ch.close();
    } catch { }

    // [existing] localStorage persist
    // [existing] #detectRecords
    // [NEW] #checkAutoPause — same pattern, same placement
    this.#checkAutoPause(prevState, this.state);
}
```

**BroadcastChannel publish pattern** (match.svelte.ts lines 65–70):
```typescript
try {
    const ch = new BroadcastChannel(BC_CHANNEL);
    ch.postMessage($state.snapshot(this.state));
    ch.close();
} catch {
    // Silently ignore — match play must continue uninterrupted
}
```

For pause tick broadcasts: reuse this exact pattern. When publishing pause state, extend the message with a type discriminant per RESEARCH.md Pitfall 3 recommendation:
```typescript
ch.postMessage({ type: 'pause-tick', pauseActive: this.pauseActive, pauseRemainingSeconds: this.pauseRemainingSeconds });
```

---

### `src/stores/display.svelte.ts` — broadcast envelope update (store, request-response)

**Analog:** Self — existing `connect()` and `isValidMatchState` pattern

**Current message handler** (display.svelte.ts lines 71–76):
```typescript
this.channel.addEventListener('message', (e: MessageEvent<unknown>) => {
    if (isValidMatchState(e.data)) {
        this.state = e.data;
    }
});
```

**Updated pattern** — add a second branch for the new `type: 'pause-tick'` discriminant:
```typescript
this.channel.addEventListener('message', (e: MessageEvent<unknown>) => {
    const data = e.data as { type?: string };
    if (data?.type === 'pause-tick') {
        // handle pause state — update new $state fields on displayStore
        // (pauseActive, pauseRemainingSeconds)
    } else if (isValidMatchState(e.data)) {
        this.state = e.data;
    }
});
```

Follow the same `e.data as { type: string; ... }` cast pattern already used in `display/+page.svelte` lines 37–38:
```typescript
const data = e.data as { type: string; seq?: number; records: string[] };
if (data?.type === 'record-event' && Array.isArray(data.records)) { ... }
```

---

### `src/routes/match/+page.svelte` — countdown `$effect` + overlay mount + audio hooks (route, event-driven)

**Analog:** Self — existing `$effect` patterns in this file

**`$effect` with cleanup pattern** (match/+page.svelte lines 31–46):
```typescript
$effect(() => {
    acquireWakeLock();

    function handleVisibility() {
        if (document.visibilityState === 'visible') {
            acquireWakeLock();
        }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
        releaseWakeLock();
        document.removeEventListener('visibilitychange', handleVisibility);
    };
});
```

Copy `return () => cleanup()` pattern for the countdown `setInterval`:
```typescript
$effect(() => {
    if (!matchStore.pauseActive) return;
    const id = setInterval(() => {
        matchStore.decrementPause();
    }, 1000);
    return () => clearInterval(id);
});
```

**Visit detection `$effect` pattern** (match/+page.svelte lines 78–100) — add audio caller call inside the existing effect (do NOT create a new effect that re-reads the same `matchStore.state`):
```typescript
$effect(() => {
    const state = matchStore.state;
    if (state.phase !== 'playing') return;

    for (const player of state.players) {
        const prevCount = lastVisitCounts[player.id] ?? 0;
        if (player.visits.length > prevCount && pendingCorrection === null) {
            const lastVisit = player.visits[player.visits.length - 1];
            const total = lastVisit.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
            lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
            pendingCorrection = { darts: lastVisit.darts, isBust: lastVisit.bust, total };
            // [ADD] announceVisit here, using total and audioPrefs
            return;
        }
    }
});
```

**Record `$effect` for SFX** (display/+page.svelte lines 31–56 — BroadcastChannel subscription as model):
```typescript
$effect(() => {
    const records = matchStore.pendingRecords;
    if (records.length === 0) return;
    // playSfx calls here
});
```

**Overlay mounting pattern** (match/+page.svelte template — MatchWinOverlay and RecordOverlay already mounted):
```svelte
<MatchWinOverlay recordBadge={...} />
<RecordOverlay records={...} ondismiss={...} />
<!-- ADD: -->
<PauseOverlay pauseActive={matchStore.pauseActive} remainingSeconds={matchStore.pauseRemainingSeconds} showResume={true} onresume={() => matchStore.resumePause()} />
```

---

### `src/routes/display/+page.svelte` — PauseOverlay mount + pause state subscription (route, event-driven)

**Analog:** Self — existing `BC_RECORD_CHANNEL` subscription and `RecordOverlay` mount

**BroadcastChannel subscription `$effect`** (display/+page.svelte lines 31–56) — pattern to follow for the pause state from `displayStore`:
```typescript
// Existing: RecordOverlay is mounted as:
<RecordOverlay records={recordStrings} ondismiss={() => (recordStrings = [])} />

// New: PauseOverlay mounted as (read-only, no resume button):
<PauseOverlay pauseActive={displayStore.pauseActive} remainingSeconds={displayStore.pauseRemainingSeconds} showResume={false} />
```

No new BroadcastChannel subscription needed on the display route for pause — pause state arrives via the existing `displayStore.connect()` subscription (the updated `DisplayStore` handles `type: 'pause-tick'` messages internally). Only the overlay mount is new on this route.

---

### `src/ui/setup/MatchSetup.svelte` — AudioSettings section addition (component, request-response)

**Analog:** Self — existing toggle-row, stepper-row, seg-control, and conditional-section patterns

**Toggle row pattern** (MatchSetup.svelte lines 143–152):
```svelte
<div class="toggle-row">
    <label class="toggle-label" for="sets-toggle">Sätze</label>
    <input
        id="sets-toggle"
        type="checkbox"
        bind:checked={setsEnabled}
        role="switch"
    />
</div>
```

Copy exactly for each audio toggle: `for="caller-toggle"`, `for="sfx-toggle"`, `for="pause-toggle"`.

**Conditional stepper pattern** (MatchSetup.svelte lines 153–163):
```svelte
{#if setsEnabled}
    <div class="stepper-row">
        <span class="stepper-label">Sätze</span>
        <div class="stepper">
            <button class="stepper-btn" onclick={() => adjustSets(-1)} disabled={setsToWin <= 1} aria-label="Sätze verringern">−</button>
            <span class="stepper-value">{setsToWin}</span>
            <button class="stepper-btn" onclick={() => adjustSets(1)} disabled={setsToWin >= 9} aria-label="Sätze erhöhen">+</button>
        </div>
    </div>
{/if}
```

Copy this pattern for `{#if pauseEnabled}` pause-legs and pause-minutes steppers. Copy `{#if callerEnabled}` for the DE/EN segmented control.

**Segmented control pattern** (MatchSetup.svelte lines 115–129):
```svelte
<div class="seg-control" role="group" aria-label="Abwurfregel">
    <button
        class="seg-btn"
        class:active={outRule === 'single'}
        onclick={() => (outRule = 'single')}
        aria-pressed={outRule === 'single'}
    >Single Out</button>
    <button
        class="seg-btn"
        class:active={outRule === 'double'}
        onclick={() => (outRule = 'double')}
        aria-pressed={outRule === 'double'}
    >Double Out</button>
</div>
```

Copy for `callerLang` DE/EN toggle — replace `outRule` with `callerLang`, values `'de'`/`'en'`, labels `Deutsch`/`Englisch`.

**Section heading pattern** (MatchSetup.svelte lines 99, 114, 133):
```svelte
<section>
    <h2>Audio & Pause</h2>
    <!-- toggle rows and steppers -->
</section>
```

No new CSS classes needed — all existing `.toggle-row`, `.stepper-row`, `.stepper-btn`, `.seg-control`, `.seg-btn` styles are reused.

**State initialization** — follow the existing `$state` pattern (lines 20–24):
```typescript
let callerEnabled = $state(audioPrefs.callerEnabled);
let callerLang = $state<'de' | 'en'>(audioPrefs.callerLang);
let sfxEnabled = $state(audioPrefs.sfxEnabled);
let pauseEnabled = $state(audioPrefs.pauseEnabled);
let pauseLegs = $state(audioPrefs.pauseLegs);
let pauseMinutes = $state(audioPrefs.pauseMinutes);
```

Load `audioPrefs` via `loadAudioPrefs()` at module level (no `onMount` needed — localStorage is sync). Write via `saveAudioPref()` in each `onclick`/`bind:checked` handler.

---

## Shared Patterns

### Try/catch no-throw (all lib utilities)
**Source:** `src/lib/storage.ts` lines 22–36, 42–48, 55–62
**Apply to:** `audio-prefs.ts`, `audio-caller.ts`, `audio-sfx.ts`
```typescript
try {
    // operation
} catch {
    // Silently ignore — never block the caller
}
```

### `$effect` with cleanup return (all new reactive side effects)
**Source:** `src/routes/match/+page.svelte` lines 31–46
**Apply to:** countdown `setInterval` in `/match`, `displayStore.connect()` already uses this
```typescript
$effect(() => {
    // setup
    return () => {
        // cleanup (clearInterval, channel.close, removeEventListener)
    };
});
```

### BroadcastChannel open-use-close pattern (all channel posts)
**Source:** `src/stores/match.svelte.ts` lines 65–70
**Apply to:** pause-tick broadcast in `MatchStore.dispatch()`, `MatchStore.decrementPause()`
```typescript
try {
    const ch = new BroadcastChannel(BC_CHANNEL);
    ch.postMessage(payload);
    ch.close();
} catch { }
```

### Type-discriminated message handler
**Source:** `src/routes/display/+page.svelte` lines 36–47
**Apply to:** updated `DisplayStore.connect()` message handler
```typescript
const data = e.data as { type: string; seq?: number; records: string[] };
if (data?.type === 'record-event' && Array.isArray(data.records)) { ... }
```

### Full-screen overlay structure
**Source:** `src/ui/overlays/MatchWinOverlay.svelte` lines 45–124
**Apply to:** `PauseOverlay.svelte`
- `position: fixed; inset: 0` backdrop
- `role="dialog" aria-modal="true" aria-label="..."`
- `animation: fadeIn 300ms ease-out`
- Accent CTA button: `height: 56px; background: #e8a020; color: #111318; border-radius: 6px; min-width: 200px`
- Button active: `opacity: 0.85`

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `static/sfx/180.mp3`, `static/sfx/highfinish.mp3`, `static/sfx/record.mp3` | static asset | — | No audio assets exist yet; these are binary files, not code |

---

## Metadata

**Analog search scope:** `src/lib/`, `src/stores/`, `src/ui/overlays/`, `src/ui/setup/`, `src/routes/match/`, `src/routes/display/`
**Files read:** 9 source files
**Pattern extraction date:** 2026-06-12
