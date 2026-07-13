# Phase 7: Chromecast Integration - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 13 new/modified files
**Analogs found:** 12 / 13

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/routes/display/+page.js` | config | request-response | `src/routes/history/+page.ts` | exact |
| `src/lib/cast-sender.svelte.ts` | service | event-driven | `src/stores/match.svelte.ts` (class + `$state` fields) | role-match |
| `src/lib/cast-receiver.ts` | utility | event-driven | `src/stores/display.svelte.ts` (context-gated subscription) | role-match |
| `src/lib/sync-constants.ts` (modify) | config | — | itself (additive constant export) | exact |
| `src/stores/match.svelte.ts` (modify) | store | event-driven | itself — existing `#broadcastPause()` / BroadcastChannel blocks | exact |
| `src/stores/display.svelte.ts` (modify) | store | request-response | itself — existing `connect()` / `isValidMatchState()` | exact |
| `src/routes/match/+page.svelte` (modify) | route | request-response | itself — existing `onMount` wiring + `SpectatorChooser` import | exact |
| `src/routes/display/+page.svelte` (modify) | route | event-driven | itself — existing `$effect(() => displayStore.connect())` onMount pattern | exact |
| `src/ui/display/SpectatorChooser.svelte` (modify) | component | request-response | itself — existing `.chooser-action-btn` pattern | exact |
| `vite.config.ts` (modify) | config | — | itself — existing `workbox:` block | exact |
| `tsconfig.receiver.json` | config | — | no analog (new pattern) | none |
| `src/test-mocks/cast-receiver-mock.ts` | test mock | — | `src/test-mocks/pwa-register-mock.ts` | role-match |
| New test files (cast-sender, cast-receiver, store extensions, PlayerPanel) | test | — | existing `*.test.ts` files | role-match |

---

## Pattern Assignments

### `src/routes/display/+page.js` (config — prerender/SSR override)

**Analog:** `src/routes/history/+page.ts` (lines 1–4)

This is the exact pattern for per-route opt-out of the global `+layout.ts` settings. The history route opts **out** of prerender; the display route must opt **in** to SSR while keeping prerender.

**Per-route override pattern** (`src/routes/history/+page.ts`, lines 1–4):
```typescript
// src/routes/history/+page.ts
// Override layout-level prerender=true — this route uses liveQuery (dynamic).
export const prerender = false;
export const ssr = false;
```

**Apply the inverse for `/display`** — same structure, opposite values:
```javascript
// src/routes/display/+page.js
// D-04: Force prerendering of /display so adapter-static emits
// build/display/index.html — required for the Chromecast to fetch
// the receiver page as a real HTML file, not the SPA 404 shell.
export const prerender = true;
export const ssr = true;
```

Note: use `.js` not `.ts` — the existing per-route overrides use `.ts` but `.js` is valid and avoids TypeScript typing the SvelteKit module conventions file. Either works; use `.js` to match the research spec exactly.

---

### `src/lib/sync-constants.ts` (modify — additive constant)

**Analog:** itself (lines 1–31)

The file's own comment block states the design rule: every sync protocol identifier is a single exported constant, imported by all consumers, so a typo in any one place is a compile error, not a silent sync failure. `CAST_NS` follows the identical pattern as `BC_CHANNEL`, `BC_RECORD_CHANNEL`, `LS_SNAPSHOT`, and `MSG_PAUSE_TICK`.

**Existing constant pattern** (lines 14–30):
```typescript
/** BroadcastChannel name for live match-state sync to the spectator display. */
export const BC_CHANNEL = 'neverman-match';

/** BroadcastChannel name for record-celebration events (ACHV-02). ... */
export const BC_RECORD_CHANNEL = 'neverman-record';

/** localStorage key for the cold-start snapshot used by DisplayStore.connect(). */
export const LS_SNAPSHOT = 'neverman-match-snapshot';

/** Message type discriminant for auto-pause tick messages sent on BC_CHANNEL (D-09). ... */
export const MSG_PAUSE_TICK = 'pause-tick';
```

**New constant to add** — same format, same JSDoc style, after the existing block:
```typescript
/** Cast custom channel namespace for live match-state sync to the Chromecast receiver.
 *  The `urn:x-cast:` prefix is required by the Cast SDK — any other prefix is rejected.
 *  Single source shared by cast-sender.svelte.ts and cast-receiver.ts to prevent
 *  namespace mismatch (Pitfall 5 — one character difference silently drops all messages). */
export const CAST_NS = 'urn:x-cast:dev.neverman.match';
```

---

### `src/lib/cast-sender.svelte.ts` (service — Cast session lifecycle)

**Analog:** `src/stores/match.svelte.ts` (class-based `$state` store with private fields and public getters)

The `CastSenderManager` follows the same class-based Svelte 5 runes pattern. Private `#` fields hold internal state; public `$state` fields are reactive. The `init()` method is the equivalent of the store constructor.

**Class + `$state` field pattern** (`src/stores/match.svelte.ts`, lines 45–84):
```typescript
export class MatchStore {
    state = $state<MatchState>(initialState());
    preloadedRecords = $state<Map<string, LifetimeStats>>(new Map());
    pendingRecords = $state<RecordItem[]>([]);
    pauseActive = $state(false);
    pauseRemainingSeconds = $state(0);

    #pauseEnabled: boolean;  // private non-reactive config
    // ...
    constructor() {
        const prefs = loadAudioPrefs();
        this.#pauseEnabled = prefs.pauseEnabled;
    }
```

**Fire-and-forget private method pattern** (`src/stores/match.svelte.ts`, lines 433–445 `#broadcastPause()`):
```typescript
#broadcastPause(): void {
    try {
        const ch = new BroadcastChannel(BC_CHANNEL);
        ch.postMessage({
            type: MSG_PAUSE_TICK,
            pauseActive: this.pauseActive,
            pauseRemainingSeconds: this.pauseRemainingSeconds,
        });
        ch.close();
    } catch {
        // Silently ignore — pause sync is best-effort; play continues
    }
}
```

**`CastSenderManager` mirrors this structure:**
```typescript
// src/lib/cast-sender.svelte.ts
import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

export class CastSenderManager {
    activeSession = $state<chrome.cast.Session | null>(null);
    #castAvailable = $state(false);

    get castAvailable(): boolean { return this.#castAvailable; }

    init(appId: string): void {
        // CRITICAL: assign BEFORE script injection — Pitfall 2 (load-order race)
        (window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
            this.#castAvailable = isAvailable;
            if (isAvailable) this.#initCastContext(appId);
            // D-13: cast row hidden via {#if castAvailable} — no action needed here
        };
        const s = document.createElement('script');
        s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
        document.head.appendChild(s);
    }

    sendSnapshot(payload: CastDisplayState): void {
        if (!this.activeSession) return;
        try {
            this.activeSession.sendMessage(CAST_NS, payload);
        } catch {
            // Non-fatal — match play continues uninterrupted
        }
    }
}

export const castSenderManager = new CastSenderManager();
```

Export both class (for test instantiation) and singleton — mirrors `MatchStore` / `matchStore` pattern.

---

### `src/lib/cast-receiver.ts` (utility — context-gated subscription)

**Analog:** `src/stores/display.svelte.ts` (context-gated `connect()` method + `isValidMatchState()` guard pattern)

The `isCastReceiverContext()` guard is the receiver's analog of `isValidMatchState()` — a narrow predicate called at the ingress point to gate all Cast-specific code. `CastReceiverBridge.init()` is the receiver analog of `DisplayStore.connect()`.

**Guard predicate pattern** (`src/stores/display.svelte.ts`, lines 25–35):
```typescript
function isValidMatchState(parsed: unknown): parsed is MatchState {
    const p = parsed as MatchState | null;
    return (
        !!p &&
        Array.isArray(p.players) &&
        p.players.length > 0 &&
        typeof p.activePlayerIndex === 'number' &&
        p.activePlayerIndex >= 0 &&
        p.activePlayerIndex < p.players.length
    );
}
```

**Context subscription + cleanup pattern** (`src/stores/display.svelte.ts`, lines 56–97 `connect()`):
```typescript
connect(): () => void {
    // ... setup ...
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.addEventListener('message', (e: MessageEvent<unknown>) => {
        const data = e.data as { type?: string; ... };
        if (data?.type === MSG_PAUSE_TICK) {
            // route by discriminant before isValidMatchState
            this.pauseActive = data.pauseActive ?? false;
            return;
        }
        if (isValidMatchState(e.data)) {
            this.state = e.data;
        }
    });
    return () => {
        this.channel?.close();
        this.channel = null;
    };
}
```

**`cast-receiver.ts` mirrors the guard + routing pattern:**
```typescript
// src/lib/cast-receiver.ts
/// <reference types="@types/chromecast-caf-receiver" />
import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

export function isCastReceiverContext(): boolean {
    return (
        typeof window !== 'undefined' &&
        'cast' in window &&
        typeof (window as any).cast?.framework?.CastReceiverContext !== 'undefined'
    );
}

export class CastReceiverBridge {
    static init(callbacks: {
        onSnapshot: (msg: CastDisplayState) => void;
        onRecord: (msg: unknown) => void;
    }): void {
        const ctx = cast.framework.CastReceiverContext.getInstance();
        // REGISTER BEFORE start() — CAF v3 requirement (Pitfall 2 analog)
        ctx.addCustomMessageListener(CAST_NS, (event) => {
            const msg = event.data as { type: string } & CastDisplayState;
            if (msg.type === 'snapshot') callbacks.onSnapshot(msg);
            else if (msg.type === 'record') callbacks.onRecord(msg);
        });
        const options = new cast.framework.CastReceiverOptions();
        options.disableIdleTimeout = true;
        options.maxInactivity = 3600;
        // start() ALWAYS LAST
        ctx.start(options);
    }
}
```

---

### `src/stores/match.svelte.ts` (modify — `#publishToCast()` + `setCastManager()`)

**Analog:** itself — the two existing additive `try/catch` publish blocks in `dispatch()` (lines 107–120)

The Cast publish block is a **third block** in the exact same style: wrapped in `try/catch`, non-fatal, called after the `localStorage` block. This is the canonical pattern for the additive transport layer (SYNC-04 — existing two blocks are untouched).

**Existing two publish blocks** (lines 107–120):
```typescript
// Publish to spectator display — non-fatal; BroadcastChannel unavailable in SSR/private mode
try {
    const ch = new BroadcastChannel(BC_CHANNEL);
    ch.postMessage($state.snapshot(this.state));
    ch.close();
} catch {
    // Silently ignore — match play must continue uninterrupted
}

// Persist snapshot for cold-start hydration of spectator display
try {
    localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
} catch {
    // Silently ignore — localStorage may be unavailable in private mode or quota exceeded
}
```

**New third block to add immediately after the localStorage block:**
```typescript
// Publish trimmed snapshot to Chromecast — non-fatal (SYNC-02, SYNC-04)
this.#publishToCast();
```

**New private method** — mirrors `#broadcastPause()` structure (lines 433–445):
```typescript
#castManager: import('../lib/cast-sender.svelte.js').CastSenderManager | null = null;

setCastManager(mgr: import('../lib/cast-sender.svelte.js').CastSenderManager): void {
    this.#castManager = mgr;
}

#publishToCast(): void {
    if (!this.#castManager?.activeSession) return;
    try {
        const payload = toDisplayState(this.state, this.pauseActive, this.pauseRemainingSeconds);
        if (import.meta.env.DEV) {
            const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
            if (bytes > 32768) console.warn('[Cast] payload exceeded 32 KB:', bytes);
        }
        this.#castManager.sendSnapshot(payload);
    } catch {
        // Non-fatal — match play continues uninterrupted
    }
}
```

The `$state.snapshot(this.state)` call in the BroadcastChannel block is the starting point for the `toDisplayState()` projection (D-05) — it produces the same deep snapshot that the trimming function will receive.

---

### `src/stores/display.svelte.ts` (modify — `receiveSnapshot()` method)

**Analog:** itself — the `connect()` BroadcastChannel message handler (lines 76–90)

`receiveSnapshot()` is a new public ingress method that mirrors exactly what the `BroadcastChannel` `'message'` handler does, but called directly from the Cast receiver bridge instead of from an event listener. The `isValidMatchState()` guard must be adapted (or a parallel `isValidCastState()` written) because `CastDisplayState` has a different shape.

**Existing ingress pattern** (lines 76–90 inside `connect()`):
```typescript
this.channel.addEventListener('message', (e: MessageEvent<unknown>) => {
    const data = e.data as { type?: string; pauseActive?: boolean; pauseRemainingSeconds?: number };
    if (data?.type === MSG_PAUSE_TICK) {
        this.pauseActive = data.pauseActive ?? false;
        this.pauseRemainingSeconds = data.pauseRemainingSeconds ?? 0;
        return;
    }
    if (isValidMatchState(e.data)) {
        this.state = e.data;
    }
});
```

**New public method to add to `DisplayStore`:**
```typescript
// Cast receiver ingress — called by CastReceiverBridge.onSnapshot callback.
// Mirrors the BroadcastChannel handler but accepts CastDisplayState directly.
// Must apply the same shape-guard discipline as connect() (WR-07).
receiveSnapshot(msg: CastDisplayState | null): void {
    if (msg === null) {
        // RECV-03: sender disconnected — show idle screen
        this.state = null;
        this.pauseActive = false;
        this.pauseRemainingSeconds = 0;
        return;
    }
    // Adapt isValidMatchState or write isValidCastState — same guard discipline
    if (!isValidCastState(msg)) return;
    // Map CastDisplayState fields onto DisplayStore state
    // pauseActive and pauseRemainingSeconds are piggybacked on every snapshot (SYNC-03)
    this.state = msg as unknown as MatchState; // or map fields explicitly
    this.pauseActive = msg.pauseActive;
    this.pauseRemainingSeconds = msg.pauseRemainingSeconds;
}
```

---

### `src/routes/display/+page.svelte` (modify — receiver bridge init + overscan class)

**Analog:** itself — the existing `$effect(() => displayStore.connect())` pattern (line 21) and the fullscreen state detection pattern (lines 133–136)

The receiver bridge init goes in `onMount` (not `$effect`) because it must run exactly once and the Cast SDK is loaded via `<svelte:head>`. This is the same reason `matchStore.loadRecords()` and `initVoices()` live in `onMount` in `/match/+page.svelte` (lines 36–53).

**Existing `onMount`-scoped one-time init pattern** (`src/routes/match/+page.svelte`, lines 36–53):
```typescript
onMount(() => {
    if (matchStore.state.players.length > 0) {
        matchStore.loadRecords(matchStore.state);
    }
    initVoices();
    // ... other one-time setup ...
});
```

**Context-detection-then-class pattern** (`src/routes/display/+page.svelte`, lines 133–136):
```typescript
const tabletFullscreenIntent =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('fullscreen') === '1';
```

**Additions to `display/+page.svelte`:**
```svelte
<svelte:head>
  <!-- CAF Receiver SDK — inert on normal browsers; activated only via
       CastReceiverBridge.init() + context.start() when isCastReceiverContext() = true.
       In <svelte:head> so it is NOT executed during SSR (Node.js has no window). -->
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { isCastReceiverContext, CastReceiverBridge } from '../../lib/cast-receiver.js';

  // D-11: .cast-receiver class gates overscan CSS — only true on Chromecast
  let isReceiver = $state(false);

  onMount(() => {
      if (!isCastReceiverContext()) return;
      isReceiver = true;
      CastReceiverBridge.init({
          onSnapshot: (msg) => displayStore.receiveSnapshot(msg),
          onRecord: (msg) => { /* append to recordStrings (same pattern as BC_RECORD_CHANNEL handler) */ }
      });
      // Note: context.start() is called inside CastReceiverBridge.init() after listeners
  });
</script>

<!-- Apply .cast-receiver class to root element for overscan CSS scoping (D-11) -->
<div class="display-root" class:cast-receiver={isReceiver} onclick={handleDisplayTap}>
```

The `recordStrings` append inside `onRecord` follows the identical pattern as the existing `BC_RECORD_CHANNEL` `'message'` handler (lines 36–62 of `+page.svelte`) — same `recordStrings = recordStrings.length > 0 ? [...recordStrings, ...data.records] : data.records` logic.

---

### `src/routes/match/+page.svelte` (modify — `CastSenderManager` wiring)

**Analog:** itself — `onMount` block (lines 36–53) and `SpectatorChooser` import (line 22)

**Pattern for wiring a new manager in `onMount`** (lines 36–41):
```typescript
onMount(() => {
    if (matchStore.state.players.length > 0) {
        matchStore.loadRecords(matchStore.state);
    }
    initVoices();
    // ...
});
```

**New additions to `onMount`** — append after existing setup:
```typescript
import { castSenderManager } from '../../lib/cast-sender.svelte.js';

onMount(() => {
    // ... existing code unchanged ...

    // CAST-01/SETUP-02: init Cast sender with App ID from env (D-08)
    const appId = import.meta.env.VITE_CAST_APP_ID;
    if (appId) {
        castSenderManager.init(appId);
        matchStore.setCastManager(castSenderManager);
    }
    // D-13: if VITE_CAST_APP_ID is absent (local dev without .env.local),
    // castSenderManager is never init'd and cast controls stay hidden.
});
```

**`SpectatorChooser` is already imported (line 22) and rendered in the template** — the Cast button and `<google-cast-launcher>` live inside `SpectatorChooser.svelte`, not directly in the match page.

---

### `src/ui/display/SpectatorChooser.svelte` (modify — Cast row)

**Analog:** itself — the existing `.chooser-action-btn` buttons (lines 99–159) and the `$state` / `$effect` pattern for `open`/`popupBlocked`

The Cast row is a third `<button class="chooser-action-btn">` inside `{#if open}`. Per D-13, it is wrapped in `{#if castSenderManager.castAvailable}` so it is fully hidden on non-Chrome.

**Existing button pattern** (lines 99–119):
```svelte
<button class="chooser-action-btn" onclick={openSecondWindow}>
    <svg width="20" height="20" ... class="action-icon">
        ...
    </svg>
    Zweites Fenster öffnen
</button>
```

**New Cast row to add after the second existing button:**
```svelte
<script lang="ts">
    import { castSenderManager } from '../../lib/cast-sender.svelte.js';

    function startCasting() {
        // <google-cast-launcher> manages its own click; this function is for
        // programmatic trigger if needed. Normally the web component handles it.
        close();
    }
</script>

{#if castSenderManager.castAvailable}
    <!-- D-13: fully hidden when Cast API unavailable (non-Chrome) -->
    <div class="chooser-action-btn cast-row">
        <google-cast-launcher></google-cast-launcher>
        {#if castSenderManager.activeSession}
            <span>Überträgt auf: {castSenderManager.activeSession.getCastDevice().friendlyName}</span>
        {:else}
            <span>Auf Chromecast übertragen</span>
        {/if}
    </div>
{/if}
```

Note: `<google-cast-launcher>` is a custom element registered by the Cast Sender SDK — it is not a Svelte component. Style it with the `.cast-row` variant of `.chooser-action-btn` per `07-UI-SPEC.md`.

---

### `vite.config.ts` (modify — `navigateFallbackDenylist`)

**Analog:** itself — the `workbox:` block (lines 52–58)

**Existing workbox block** (lines 52–58):
```typescript
workbox: {
    // client/** prefix matches .svelte-kit/output/client/ (Pitfall 7)
    // mp3 explicitly included so SFX are precached for offline play (Pitfall 4)
    // prerendered/** omitted — pure SPA, no prerendered pages (Anti-Pattern)
    globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
    navigateFallback: base + '/404.html',
},
```

**Modified workbox block** — add `navigateFallbackDenylist` after `navigateFallback`:
```typescript
workbox: {
    globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
    navigateFallback: base + '/404.html',
    // D-03/D-04: Prevent SW navigation fallback from intercepting /display.
    // The Chromecast fetches from a clean context with no installed SW, but
    // this also protects normal browser users after the SW installs.
    navigateFallbackDenylist: [/\/display(\/|$)/],
},
```

The existing comment style (Pitfall references) is the pattern — match it.

---

### `tsconfig.receiver.json` (new — type isolation)

**Analog:** none in codebase. This is a standard TypeScript tsconfig extension pattern with no existing project analog.

Use the pattern from `07-RESEARCH.md` Pattern 6 directly:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": []
  },
  "include": [
    "src/lib/cast-receiver.ts",
    "src/lib/cast-types.ts"
  ],
  "references": []
}
```

And add `/// <reference types="@types/chromecast-caf-receiver" />` at the top of `cast-receiver.ts` to scope receiver globals to that file only.

---

### `src/test-mocks/cast-receiver-mock.ts` (new test mock)

**Analog:** `src/test-mocks/pwa-register-mock.ts` (lines 1–32)

The PWA mock is the established pattern for a module-level mock with an exported control handle (no `vi.spyOn` in browser mode).

**Mock module pattern** (`src/test-mocks/pwa-register-mock.ts`, lines 1–32):
```typescript
// Module-level design: test and component share the SAME store instances
// because ESM modules are singletons. vi.spyOn cannot redefine ESM exports
// in browser mode (ESM namespace is not configurable), so instead this mock
// tracks calls in exported arrays the test can inspect and reset.
import { writable } from 'svelte/store';

export const needRefresh = writable(false);
export const updateSWCalls: Array<boolean | undefined> = [];

export function useRegisterSW(_options?: ...) {
    return {
        needRefresh,
        updateServiceWorker: async (reloadPage?: boolean) => {
            updateSWCalls.push(reloadPage);
        },
    };
}
```

**`cast-receiver-mock.ts` mirrors this pattern:**
```typescript
// src/test-mocks/cast-receiver-mock.ts
// Controls isCastReceiverContext() return value for browser-mode tests.
// Import this mock via vite.config.ts test.alias in the browser project.

let _mockReceiverContext = false;

/** Set to true to simulate the Chromecast environment in tests. */
export function setMockReceiverContext(value: boolean): void {
    _mockReceiverContext = value;
}

export function isCastReceiverContext(): boolean {
    return _mockReceiverContext;
}

export class CastReceiverBridge {
    static init(_callbacks: unknown): void {
        // no-op in tests — context.start() is not called
    }
}
```

Wire it in `vite.config.ts` browser project's `test.alias` — same pattern as the PWA mocks (lines 94–103 of `vite.config.ts`).

---

### New test files (`cast-sender.test.ts`, `cast-receiver.test.ts`, store extensions, `PlayerPanel.test.ts` extension)

**Analog:** existing `*.test.ts` files in the project — check `src/stores/` and `src/lib/` for the test structure pattern.

The unit test project (`name: 'unit'`, `environment: 'node'`) covers `cast-sender.test.ts` and `cast-receiver.test.ts`. The browser project covers `PlayerPanel.test.ts`.

Unit tests mock the Cast SDK by assigning to `(global as any).cast` before importing the module under test — same pattern as any other global mock in a Node vitest environment.

---

## Shared Patterns

### Additive fire-and-forget transport (apply to `#publishToCast()`)

**Source:** `src/stores/match.svelte.ts`, lines 107–120 (both existing publish blocks)

Every transport block in `dispatch()` follows: wrapped in `try/catch`, non-fatal with a comment, no `await`, no return value. **Never alter or merge with existing blocks.** The Cast block is appended as a third independent block.

```typescript
try {
    // ... transport-specific publish ...
} catch {
    // Silently ignore — [description]; play continues uninterrupted
}
```

### `$state`-based conditional rendering (apply to `castAvailable` in `SpectatorChooser`)

**Source:** `src/ui/display/SpectatorChooser.svelte`, lines 12–13

```typescript
let open = $state(false);
let popupBlocked = $state(false);
```

Public `$state` fields on a class (not local `$state`) are used when the reactive value must be read from multiple components. `castSenderManager.castAvailable` (a getter over `#castAvailable = $state(false)`) follows the same pattern as `displayStore.state` — store owns the `$state`, template reads it reactively.

### `onMount` for browser-only one-time init (apply to Cast sender and receiver init)

**Source:** `src/routes/match/+page.svelte`, lines 36–53

One-time init that requires `window` or DOM APIs always goes in `onMount`, never at module top-level, never in `$effect` (which can re-run). This is the SSR-safety pattern (Pitfall 8 analog).

### German UI strings (apply to all user-visible text)

**Source:** `src/ui/display/SpectatorChooser.svelte` throughout; `src/routes/display/+page.svelte` labels

All user-visible strings are German. Follow the exact capitalization and phrasing established in the existing UI:
- "Zweites Fenster öffnen" → Cast equivalent: "Auf Chromecast übertragen"
- "Überträgt auf: `<Gerät>`" (CAST-03 indicator)
- "Verbindung wiederhergestellt" (CAST-06 toast)
- "Warte auf Spielstand…" (RECV-02 loading text for `IdleScreen`)
- "Kein aktives Spiel" (RECV-03 idle text — already used by `IdleScreen`)

### Context-gated CSS class (apply to `.cast-receiver` overscan scoping — D-11)

**Source:** `src/routes/display/+page.svelte`, lines 133–136 (URL param → class pattern) and `src/ui/display/PlayerPanel.svelte` lines 111, 205–211 (`.player-panel.active` pattern)

```svelte
<!-- URL param gates a class, class gates CSS — same principle for .cast-receiver -->
<div class="player-panel" class:active={isActive}>
```

The `.cast-receiver` class is applied the same way to the `.display-root` div: `class:cast-receiver={isReceiver}`. Overscan CSS is inside the `.cast-receiver` scope and does not affect any other `.display-root` instance.

### BUST-flash `$effect` + `setTimeout` cleanup (analog for RECV-05 `.updating` class on `PlayerPanel`)

**Source:** `src/ui/display/PlayerPanel.svelte`, lines 87–108

```typescript
let showBust = $state(false);
let bustTimer: ReturnType<typeof setTimeout> | null = null;
let prevVisitCount: number | null = null;

$effect(() => {
    const count = player.visits.length;
    if (prevVisitCount !== null && count > prevVisitCount && lastCompletedVisit?.bust === true) {
        showBust = true;
        if (bustTimer !== null) clearTimeout(bustTimer);
        bustTimer = setTimeout(() => {
            showBust = false;
            bustTimer = null;
        }, 2000);
    }
    prevVisitCount = count;
});

onDestroy(() => {
    if (bustTimer !== null) clearTimeout(bustTimer);
});
```

**RECV-05 `.updating` class follows the same `$state` + `$effect` + `setTimeout` pattern:**
```typescript
let showUpdating = $state(false);
let updatingTimer: ReturnType<typeof setTimeout> | null = null;
let prevRemaining: number | null = null;

$effect(() => {
    const r = liveRemaining;
    if (prevRemaining !== null && r !== prevRemaining) {
        showUpdating = true;
        if (updatingTimer !== null) clearTimeout(updatingTimer);
        updatingTimer = setTimeout(() => { showUpdating = false; }, 300);
    }
    prevRemaining = r;
});

onDestroy(() => {
    if (updatingTimer !== null) clearTimeout(updatingTimer);
});
```

And in the template: `class:updating={showUpdating}` on `.remaining-score`, with CSS `transition: color 300ms ease-out` already on the element (add `.updating` tint via the CSS class).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tsconfig.receiver.json` | config | — | No existing multi-tsconfig setup in this project; use RESEARCH.md Pattern 6 directly |

---

## Metadata

**Analog search scope:** `src/routes/`, `src/stores/`, `src/lib/`, `src/ui/`, `src/test-mocks/`, `vite.config.ts`
**Files read:** 12
**Pattern extraction date:** 2026-06-18
