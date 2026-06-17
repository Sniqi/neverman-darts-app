# Architecture Research

**Domain:** Google Cast integration into an existing BroadcastChannel-based PWA sync layer (v1.1)
**Researched:** 2026-06-18
**Confidence:** HIGH (grounded in the real MatchStore/DisplayStore source; Cast SDK patterns from official docs)

---

## Context: What the Existing Code Does

The v1.0 sync layer is two classes in `src/stores/`:

**`MatchStore`** (`src/stores/match.svelte.ts`)
- Wraps the pure reducer. `dispatch(action)` is the single mutation point.
- After every dispatch, two side effects run inline as `try/catch` blocks:
  1. Opens `BroadcastChannel('neverman-match')`, posts `$state.snapshot(this.state)`, closes it immediately.
  2. Writes `JSON.stringify(this.state)` to `localStorage['neverman-match-snapshot']`.
- A third channel `BroadcastChannel('neverman-record')` carries record-celebration events via `#broadcastRecordEvent()` — a separate private method, not inside `dispatch()`.
- Pause state (`pauseActive`, `pauseRemainingSeconds`) is broadcast via `#broadcastPause()` on the main channel as `{ type: 'pause-tick', pauseActive, pauseRemainingSeconds }` — not as MatchState.

**`DisplayStore`** (`src/stores/display.svelte.ts`)
- `connect()` hydrates `this.state` from `localStorage['neverman-match-snapshot']`, then opens a persistent `BroadcastChannel` listener that routes incoming messages: `pause-tick` → sets `pauseActive`/`pauseRemainingSeconds`; valid `MatchState` → sets `this.state`.
- Returns a cleanup function suitable for `$effect` teardown.

**The exact publish seam in `dispatch()`** (lines 107–120 of `match.svelte.ts` — this is where Cast publishing is added):
```typescript
// EXISTING — lines 107-120, dispatch():
try {
  const ch = new BroadcastChannel(BC_CHANNEL);
  ch.postMessage($state.snapshot(this.state));
  ch.close();
} catch { /* silent */ }

try {
  localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
} catch { /* silent */ }
```

The three private broadcast helpers (`#broadcastPause`, `#broadcastRecordEvent`, the inline blocks above) are the complete set of publish points in the store. Cast publishing hooks into each of them additively — no restructuring required.

---

## System Overview

```
SENDER SIDE (tablet / PC — /match)
┌────────────────────────────────────────────────────────────────────┐
│  match/+page.svelte                                                │
│       │ dispatch(action)                                           │
│       ▼                                                            │
│  MatchStore.dispatch()                                             │
│       │                                                            │
│       ├── reduce(state, action) → new state                        │
│       │                                                            │
│       ├── [EXISTING] BroadcastChannel('neverman-match').postMessage│
│       ├── [EXISTING] localStorage.setItem(LS_SNAPSHOT)            │
│       │                                                            │
│       └── [NEW] #publishToCast(snapshot)                          │
│                  │                                                 │
│                  └── castSession.sendMessage(CAST_NS, {           │
│                         type:'snapshot', state, pauseActive, ...  │
│                      })                                            │
│                                                                    │
│  MatchStore.#broadcastRecordEvent(items)                           │
│       ├── [EXISTING] BroadcastChannel('neverman-record').postMsg   │
│       └── [NEW] castSession.sendMessage(CAST_NS, {type:'record'}) │
│                                                                    │
│  [NEW] CastSenderManager (session lifecycle only)                  │
│       - SDK init, session open/close callbacks                     │
│       - exposes activeSession = $state<CastSession | null>         │
└────────────────────────────────────────────────────────────────────┘

TRANSPORT (Cast custom channel — LAN via Cast protocol)
┌──────────────────────────────────────┐
│  urn:x-cast:dev.neverman.match       │
│  JSON messages — see Message Schema  │
└──────────────────────────────────────┘

RECEIVER SIDE (Chromecast — /display as Custom Web Receiver)
┌────────────────────────────────────────────────────────────────────┐
│  CastReceiverContext.start()                                       │
│       │                                                            │
│  [NEW] CastReceiverBridge.init()                                   │
│       - registerNamespace(CAST_NS)                                 │
│       - onMessage: routes 'snapshot' → displayStore.receiveSnapshot│
│       - onMessage: routes 'record'   → onRecord callback           │
│                                                                    │
│  displayStore.receiveSnapshot(msg)  [NEW public method]            │
│       - isValidMatchState guard (reuse existing function)          │
│       - sets displayStore.state, pauseActive, pauseRemainingSeconds│
│                                                                    │
│  display/+page.svelte (UNCHANGED UI components)                    │
│       - reads displayStore.state, pauseActive, pauseRemainingSeconds│
│       - MatchHeader, PlayerPanel, LegWinBanner, PauseOverlay ...   │
└────────────────────────────────────────────────────────────────────┘

LOCAL PATHS (UNCHANGED — Cast is purely additive)
  PC second window  → BroadcastChannel + localStorage (current code, untouched)
  Tablet fullscreen → in-app /display route, same BroadcastChannel path
```

---

## Message Schema: Full Snapshot Per Dispatch

**Decision: send a full `MatchState` snapshot on every dispatch — not an action-replay stream.**

Rationale:

1. The existing `BroadcastChannel` already sends a full `MatchState` snapshot (`$state.snapshot(this.state)`) on every dispatch. The Cast channel mirrors this exact pattern. The same serialized value is reused — no second serialization path.

2. Action-replay on the receiver would require bundling `src/engine/reducer.ts` into the receiver HTML, handling reducer version mismatches across PWA updates, and replaying potentially hundreds of events on reconnect. The receiver is a dumb display — it does not need the engine.

3. Late-join and reconnect are trivial with snapshot: when the sender detects a new sender connection, it pushes the current state immediately. With action-replay, late join requires replaying the full `eventLog` (which can be long in a sets match).

4. `MatchState` is already JSON-serializable (no functions, no Dates — plain scalars and arrays). `$state.snapshot()` already produces a clean plain-object clone. A full snapshot for a 4-player 501 match with 30 visits is ~3–5 KB — well within Cast message limits.

**Why pause-ticks are NOT sent as separate Cast messages:**

`#broadcastPause()` fires every second during a countdown. Over Cast, a 1-Hz stream for a 5-minute pause is 300 messages. Cast channels have throughput limits and are designed for state-change events, not continuous streams. Instead, `pauseActive` and `pauseRemainingSeconds` are piggybacked on every `CastSnapshotMessage`. The receiver runs a locally-driven countdown once it receives `pauseActive: true`, then stops when it receives `pauseActive: false` in the next match snapshot (triggered by the user pressing "Weiter" or the sender's timer expiring). Seconds-level drift on the receiver countdown is acceptable for this use case.

**Message types on `urn:x-cast:dev.neverman.match`:**

```typescript
// src/lib/cast-types.ts  (NEW FILE)

export const CAST_NS = 'urn:x-cast:dev.neverman.match';

/**
 * Full match-state snapshot. Sent:
 *   - after every dispatch() (mirrors BroadcastChannel behavior)
 *   - proactively when a new sender connects mid-match
 * Pause state is piggybacked here rather than in a separate tick message.
 */
export interface CastSnapshotMessage {
  type: 'snapshot';
  state: MatchState;
  pauseActive: boolean;
  pauseRemainingSeconds: number;
}

/**
 * Record celebration event. Mirrors the BC_RECORD_CHANNEL payload shape.
 * Sent in addition to the snapshot when #broadcastRecordEvent() fires.
 */
export interface CastRecordMessage {
  type: 'record';
  seq: number;
  records: string[];
}

/**
 * Receiver → Sender fallback. Sent if the receiver needs to request
 * a snapshot explicitly (e.g. receiver reloaded while sender was backgrounded).
 * Primary flow is push-on-connect from sender; this is a fallback only.
 */
export interface CastRequestSnapshotMessage {
  type: 'request-snapshot';
}

export type CastMessage =
  | CastSnapshotMessage
  | CastRecordMessage
  | CastRequestSnapshotMessage;
```

---

## Component Boundaries

### New modules to create

| Module | Path | Responsibility |
|--------|------|----------------|
| `CastTypes` | `src/lib/cast-types.ts` | `CAST_NS` constant, `CastMessage` union type and sub-interfaces |
| `CastSenderManager` | `src/lib/cast-sender.svelte.ts` | SDK loading, session lifecycle; `activeSession = $state<CastSession \| null>` |
| `CastReceiverBridge` | `src/lib/cast-receiver.ts` | Receiver-side: `isCastReceiverContext()`, `init()`, namespace registration, message routing |
| `CastButton` | `src/ui/cast/CastButton.svelte` | `<google-cast-launcher>` wrapper + connection-status badge |

### Existing modules to modify (surgically)

| Module | Change | Exact location |
|--------|--------|----------------|
| `src/stores/match.svelte.ts` | Add `#castManager` private field, `setCastManager(m)` setter, `#publishToCast(snapshot)` private method; call `#publishToCast` after existing localStorage block in `dispatch()`; call Cast record publish inside `#broadcastRecordEvent()` | dispatch() lines 107-120; `#broadcastRecordEvent()` lines 345-360 |
| `src/stores/display.svelte.ts` | Add `receiveSnapshot(msg: CastSnapshotMessage)` public method; no change to `connect()` | New method after `connect()` |
| `src/routes/display/+page.svelte` | Add `<svelte:head>` receiver SDK script tag; add `onMount` call to `CastReceiverBridge.init()` (guarded by `isCastReceiverContext()`); register `onRecord` callback | `<svelte:head>`, around line 21 connect `$effect` |
| `src/routes/match/+page.svelte` | Instantiate `CastSenderManager` in `onMount`, call `matchStore.setCastManager(manager)`, mount `<CastButton>` in the control deck | `onMount` block; control deck HTML ~line 244 |

---

## Data-Flow Diagrams

### Sender dispatch → all transports

```
User taps dartboard segment
        │
        ▼
match/+page.svelte → matchStore.dispatch({ type: 'DART_THROWN', dart })
        │
        ▼
reduce(this.state, action) → newState
        │
        ├─── [EXISTING] BroadcastChannel('neverman-match').postMessage(snapshot)
        │           └── DisplayStore.channel.onmessage → displayStore.state = snapshot
        │                (PC second window / tablet fullscreen — UNCHANGED)
        │
        ├─── [EXISTING] localStorage.setItem('neverman-match-snapshot', JSON)
        │           └── DisplayStore.connect() hydration on cold start (UNCHANGED)
        │
        └─── [NEW] #publishToCast($state.snapshot(this.state))
                    │
                    └── castSession.sendMessage(CAST_NS, {
                            type: 'snapshot',
                            state: snapshot,
                            pauseActive: this.pauseActive,
                            pauseRemainingSeconds: this.pauseRemainingSeconds
                        })
                            │ Cast LAN channel
                            ▼
                        CastReceiverBridge.onMessage(event)
                            │
                            └── displayStore.receiveSnapshot(event.data)
                                    ├── isValidMatchState(msg.state) → displayStore.state
                                    ├── displayStore.pauseActive = msg.pauseActive
                                    └── displayStore.pauseRemainingSeconds = msg.pauseRemainingSeconds
```

### Record event flow (sender → Cast receiver)

```
MatchStore.#broadcastRecordEvent(items)
        │
        ├─── [EXISTING] BroadcastChannel('neverman-record').postMessage(...)
        │           └── display/+page.svelte record channel listener (UNCHANGED)
        │
        └─── [NEW] castSession?.sendMessage(CAST_NS, {
                       type: 'record',
                       seq: this.#recordSeq,
                       records: items.map(i => i.text)
                   })
                       │
                       └── CastReceiverBridge.onMessage(event)
                               └── this.onRecord?.(event.data)
                                       └── display/+page.svelte recordStrings $state
                                           (same append/deduplicate logic as the BC path)
```

`CastReceiverBridge` exposes an `onRecord` callback registered by `display/+page.svelte` in `onMount`. This avoids re-opening a `BroadcastChannel('neverman-record')` on the receiver where nothing would be posting.

### Receiver bootstrap order

```
Chromecast loads https://<pages-url>/display
        │
        ▼
display/+page.svelte onMount
        │
        ├── 1. isCastReceiverContext()?
        │       NO  → skip all Cast init; fall through to BroadcastChannel path (normal browser)
        │       YES → continue:
        │
        ├── 2. CastReceiverBridge.init({
        │           onSnapshot: (msg) => displayStore.receiveSnapshot(msg),
        │           onRecord:   (msg) => { /* append to recordStrings */ }
        │       })
        │       - addCustomMessageListener(CAST_NS, handler)
        │
        ├── 3. CastReceiverContext.getInstance().start()
        │       MUST be called after all namespace listeners are registered
        │       SDK notifies sender "receiver ready" → sender pushes snapshot immediately
        │
        └── 4. $effect(() => displayStore.connect())  [runs regardless of Cast context]
                displayStore.connect():
                  - localStorage read: empty on Chromecast (different device) → state stays null
                  - opens BroadcastChannel: silent on Chromecast → harmless
                  - First content arrives via receiveSnapshot() from Cast
```

### Late-join / reconnect handshake

```
Sender already mid-match; receiver reloads OR Cast session reconnects
        │
        ▼
CastSenderManager receives SESSION_STARTED or senderConnected event
        │
        └── immediately call matchStore.#publishToCast($state.snapshot(matchStore.state))
            (no request-snapshot round-trip needed in the primary flow)
```

The sender pushes a snapshot proactively when `SESSION_STARTED` fires. The `CastRequestSnapshotMessage` type is defined as a fallback for edge cases — e.g. the receiver reloads while the sender app is backgrounded on Android and the session already exists but no `SESSION_STARTED` fires. In that case the receiver sends `{ type: 'request-snapshot' }` and the sender's `onMessage` handler on the session replies with the current snapshot.

---

## Architectural Patterns

### Pattern 1: Additive publish blocks — extend dispatch() without restructuring

**What:** The existing `dispatch()` has two inline `try/catch` publish blocks (BroadcastChannel, localStorage). Add a third block for Cast by calling a new private method `#publishToCast()`. Same pattern — self-contained, non-fatal.

**Why not a `Transport[]` abstraction:** A `Transport` interface makes sense when three or more publishers share an identical signature. Here the three publishers have different payloads: localStorage takes a string, BroadcastChannel takes `MatchState`, Cast takes `CastSnapshotMessage` (MatchState + pauseActive + pauseRemainingSeconds). A single `publish(state)` signature would either lose the pause fields on Cast or smuggle them into all transports unnecessarily. Three explicit blocks are more honest about the differences and easier to delete if Cast is removed.

**Implementation:**
```typescript
// Add to MatchStore (after existing localStorage block in dispatch()):
this.#publishToCast($state.snapshot(this.state));

// New private method:
#publishToCast(snapshot: MatchState): void {
  const session = this.#castManager?.activeSession;
  if (!session) return;
  try {
    session.sendMessage(CAST_NS, {
      type: 'snapshot',
      state: snapshot,
      pauseActive: this.pauseActive,
      pauseRemainingSeconds: this.pauseRemainingSeconds,
    } satisfies CastSnapshotMessage);
  } catch {
    // Cast session may have dropped — non-fatal; match play continues
  }
}
```

**When to use:** Whenever an existing publish seam must be extended by addition without changing behavior of existing paths.

### Pattern 2: CastSenderManager as a separate Svelte 5 class

**What:** A dedicated `CastSenderManager` class holds SDK lifecycle state: `activeSession = $state<cast.framework.CastSession | null>(null)`. It is instantiated in `match/+page.svelte`'s `onMount` and passed to `matchStore` via `matchStore.setCastManager(manager)`. The `MatchStore` holds a `#castManager` private field; `#publishToCast` reads `this.#castManager?.activeSession`.

**Why separate:** Cast SDK initialization (`window.__onGCastApiAvailable`, `cast.framework.CastContext.getInstance().setOptions(...)`) is browser-global boilerplate that does not belong in the pure-reducer-wrapping `MatchStore`. The manager owns SDK lifecycle; the store only calls `sendMessage`. The `activeSession = $state(null)` field lets `CastButton.svelte` show connection status reactively.

**Session lifecycle events to handle in CastSenderManager:**
- `SESSION_STARTED` → `this.activeSession = session`; call `matchStore.#publishToCast(current)` immediately.
- `SESSION_ENDED` → `this.activeSession = null`.
- `senderConnected` (mid-session new tab) → push snapshot immediately.

### Pattern 3: DisplayStore.receiveSnapshot() as the receiver ingress

**What:** Add one public method to `DisplayStore`:

```typescript
// In DisplayStore (src/stores/display.svelte.ts) — add after connect():
receiveSnapshot(msg: CastSnapshotMessage): void {
  if (isValidMatchState(msg.state)) {
    this.state = msg.state;
  }
  this.pauseActive = msg.pauseActive;
  this.pauseRemainingSeconds = msg.pauseRemainingSeconds;
}
```

`CastReceiverBridge` calls this. The existing `connect()` BroadcastChannel listener is untouched. `isValidMatchState()` is already defined as a module-level function in `display.svelte.ts` — reused directly, no duplication.

**Why not have CastReceiverBridge mutate displayStore fields directly:** Routing all external state mutations through `receiveSnapshot()` keeps the shape guard in one place. If the Cast message schema changes, only this method needs updating — not the bridge.

### Pattern 4: Receiver-context detection gate

**What:** `/display` runs in two contexts: (a) normal browser (PC/tablet), (b) Chromecast Cast receiver. Detect by checking `window.cast.framework.CastReceiverContext`. If absent, skip all Cast receiver init and use the existing BroadcastChannel path normally.

```typescript
// src/lib/cast-receiver.ts
export function isCastReceiverContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    'cast' in window &&
    'framework' in (window as any).cast &&
    typeof (window as any).cast.framework?.CastReceiverContext !== 'undefined'
  );
}
```

The Cast Receiver SDK (`www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js`) is loaded via a `<script>` tag in `/display`'s `<svelte:head>`. In a normal browser, the SDK loads and self-initializes, but `CastReceiverContext.start()` is never called, so it is completely inert. This avoids dynamic script injection complexity.

The Cast Sender SDK (`www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js`) is loaded separately in `/match`'s `<svelte:head>`. The two SDKs must never be loaded on the same page — they conflict.

---

## Receiver Entry Point: Reuse /display Route Unchanged

The `/display` route and all its existing child components (`MatchHeader`, `PlayerPanel`, `LegWinBanner`, `PauseOverlay`, `MatchWinDisplay`, `RecordOverlay`) require zero changes to render correctly on Chromecast. They read from `displayStore` — the data source is irrelevant to them.

The only changes in `display/+page.svelte` are:
1. Add receiver SDK `<script>` tag in `<svelte:head>`.
2. Add `onMount` call to `CastReceiverBridge.init()` (guarded by `isCastReceiverContext()`).
3. Register the `onRecord` callback from the bridge to append to the existing `recordStrings = $state<string[]>([])` variable (already present in the file — the same dedup/append logic used for the BroadcastChannel record path applies here too).

No new route. No second build target. No HTML template duplication.

---

## Recommended File Structure (new files only)

```
src/
├── lib/
│   ├── cast-types.ts           # CAST_NS constant, CastMessage union type
│   ├── cast-sender.svelte.ts   # CastSenderManager class ($state activeSession)
│   └── cast-receiver.ts        # isCastReceiverContext(), CastReceiverBridge.init()
│
└── ui/
    └── cast/
        └── CastButton.svelte   # <google-cast-launcher> wrapper + status indicator
```

Existing files modified (surgical changes only):
- `src/stores/match.svelte.ts` — `#castManager`, `setCastManager()`, `#publishToCast()`, two call sites
- `src/stores/display.svelte.ts` — `receiveSnapshot()` public method (5 lines)
- `src/routes/display/+page.svelte` — SDK script tag, `onMount` bridge init, `onRecord` callback registration
- `src/routes/match/+page.svelte` — `CastSenderManager` instantiation, `setCastManager()`, `<CastButton>` mount
- `src/lib/sync-constants.ts` — optionally add `CAST_NS` here for consistency, or keep it in `cast-types.ts`

---

## Build Order (respects dependencies, keeps local sync working at every step)

**1. `src/lib/cast-types.ts`**
No dependencies. Defines the message contract that all other Cast modules import. Write and verify the type shapes against the Cast SDK docs. Local sync continues working unchanged throughout.

**2. `src/stores/display.svelte.ts` — add `receiveSnapshot()`**
Depends only on existing `isValidMatchState()` and `MatchState`. Can be written and unit-tested in isolation before any Cast SDK is wired. Local sync still works — `connect()` is untouched.

**3. `src/lib/cast-receiver.ts`**
Depends on `cast-types.ts` and `displayStore.receiveSnapshot()`. Implements `isCastReceiverContext()` and `CastReceiverBridge`. Test the routing logic with mock `displayStore` and mock Cast event objects (no SDK needed for unit tests).

**4. `src/routes/display/+page.svelte` — receiver bootstrap**
Wire `CastReceiverBridge.init()` in `onMount`, add SDK script tag, register `onRecord` callback. At this point `/display` is deployable to a Chromecast via GitHub Pages (with the receiver SDK present) and the receiver-side is testable. Local BroadcastChannel path continues to work on normal browsers — the bridge is gated behind `isCastReceiverContext()`.

**5. `src/lib/cast-sender.svelte.ts`**
`CastSenderManager` class. Depends on `cast-types.ts`. Handles `__onGCastApiAvailable`, `CastContext.setOptions({ receiverApplicationId })`, `SESSION_STARTED`/`SESSION_ENDED` events. The `activeSession` `$state` field drives `CastButton` reactivity.

**6. `src/stores/match.svelte.ts` — add Cast publish**
Add `#castManager`, `setCastManager()`, `#publishToCast()`, and the two call sites (in `dispatch()` and `#broadcastRecordEvent()`). Depends on `CastSenderManager` and `cast-types.ts`. No existing behavior changes — only additive try/catch blocks. All existing local sync tests continue to pass.

**7. `src/ui/cast/CastButton.svelte`**
Wraps `<google-cast-launcher>` and shows a connection-status badge using `castSenderManager.activeSession`. Depends on `CastSenderManager`.

**8. `src/routes/match/+page.svelte` — wire sender**
Instantiate `CastSenderManager` in `onMount`, call `matchStore.setCastManager(manager)`, mount `<CastButton>` in the control deck. Expose `VITE_CAST_APP_ID` via Vite env for the receiver application ID.

**9. End-to-end validation**
Open `/match` on tablet, tap Cast button, confirm `/display` on Chromecast shows live scores. Throw darts and confirm real-time update. Disconnect Cast session and confirm PC BroadcastChannel path still works. Reload the Chromecast mid-match and confirm snapshot hydration on reconnect.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Refactoring BroadcastChannel into a Transport abstraction

**What people do:** Extract all three publishers (BroadcastChannel, localStorage, Cast) into a `Transport[]` array with a single `publish(state)` interface.

**Why it's wrong:** The three publishers have different payload shapes. localStorage takes a string, BroadcastChannel takes `MatchState`, Cast takes `CastSnapshotMessage` (MatchState + pauseActive + pauseRemainingSeconds). Forcing a uniform interface either loses pause state on Cast or requires adding Cast-specific fields to every transport. The abstraction adds indirection for three callers without reducing duplication.

**Do this instead:** Three explicit `try/catch` blocks in `dispatch()`. Add a fourth only if a genuine fourth transport appears.

### Anti-Pattern 2: Action-replay on the receiver

**What people do:** Send each `MatchAction` over Cast so the receiver replays the `eventLog` via a local reducer instance.

**Why it's wrong:** Requires bundling `src/engine/reducer.ts` into the receiver, handling reducer version drift across PWA updates, and replaying potentially hundreds of actions on reconnect. The receiver is a display, not a game engine.

**Do this instead:** Send full `MatchState` snapshots. The sender is the single source of truth. Reconnect is a single snapshot push.

### Anti-Pattern 3: Loading the Cast Receiver SDK in the sender (or both SDKs on the same page)

**What people do:** Include the receiver SDK in `app.html` or `+layout.svelte` so it is "always available."

**Why it's wrong:** The receiver SDK and sender SDK are different scripts with different global `cast.*` APIs. Loading both on the same page causes API conflicts. `CastReceiverContext` calling `start()` on a non-Chromecast browser hangs indefinitely — the SDK is waiting for a sender to connect.

**Do this instead:** Receiver SDK only in `/display`'s `<svelte:head>`. Sender SDK only in `/match`'s `<svelte:head>`. Gate `CastReceiverContext.start()` behind `isCastReceiverContext()`.

### Anti-Pattern 4: Sending pause-tick over Cast every second

**What people do:** Mirror `#broadcastPause()` → Cast channel, posting a message every second during the countdown.

**Why it's wrong:** Cast channels have throughput limits and are designed for state-change events, not continuous streams. A 5-minute countdown at 1 message/second is 300 Cast messages for a cosmetic UI detail.

**Do this instead:** Piggyback `pauseActive` and `pauseRemainingSeconds` on every `CastSnapshotMessage`. The receiver runs a local countdown from the value it last received. The next match dispatch (e.g. user presses "Weiter") sends `pauseActive: false` and the receiver stops its countdown. Seconds-level drift is acceptable.

### Anti-Pattern 5: Relying on localStorage for receiver hydration

**What people do:** On the Chromecast, call `displayStore.connect()` expecting to find `localStorage['neverman-match-snapshot']` populated.

**Why it's wrong:** The Chromecast is a different device with isolated browser storage. The key is always empty on the receiver. `connect()` is harmless (it finds nothing and opens a silent BroadcastChannel), but it cannot provide initial state.

**Do this instead:** The receiver hydrates exclusively from the first `CastSnapshotMessage`. `connect()` still runs for compatibility, but `receiveSnapshot()` is the actual hydration source on the Cast receiver.

---

## Integration Points

### Cast Sender SDK

| Point | Detail |
|-------|--------|
| Script location | `<script src="https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js">` in `/match`'s `<svelte:head>` |
| Init callback | `window.__onGCastApiAvailable = (isAvailable) => { if (isAvailable) castSenderManager.init(); }` |
| App ID | `import.meta.env.VITE_CAST_APP_ID` — set per environment in `.env` files, injected at Vite build time |
| Session start | `cast.framework.CastContext.getInstance().requestSession()` triggered by user tapping the Cast button |
| Send message | `session.sendMessage(CAST_NS, payload)` returns a Promise; wrap in try/catch |
| Session events | `CastContext.addEventListener(SESSION_STATE_CHANGED, ...)` to update `activeSession` |

### Cast Receiver SDK

| Point | Detail |
|-------|--------|
| Script location | `<script src="https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js">` in `/display`'s `<svelte:head>` |
| Namespace registration | `CastReceiverContext.getInstance().addCustomMessageListener(CAST_NS, handler)` — BEFORE `start()` |
| `start()` timing | Must be called after all namespace listeners are registered; calling first causes messages to be missed |
| Message handler | `handler(customEvent)` — `customEvent.data` is already parsed JSON; `customEvent.senderId` identifies the connected sender for reply |
| Reply to request-snapshot | `CastReceiverContext.getInstance().sendCustomMessage(CAST_NS, senderId, payload)` |

### BroadcastChannel and localStorage (existing — no changes)

| Constant | Value | Owner |
|----------|-------|-------|
| `BC_CHANNEL` | `'neverman-match'` | `src/lib/sync-constants.ts` |
| `BC_RECORD_CHANNEL` | `'neverman-record'` | `src/lib/sync-constants.ts` |
| `LS_SNAPSHOT` | `'neverman-match-snapshot'` | `src/lib/sync-constants.ts` |
| `MSG_PAUSE_TICK` | `'pause-tick'` | `src/lib/sync-constants.ts` |

All four remain unchanged. Cast is a third path added alongside them, not a replacement.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| MatchStore publish seam | HIGH | Read actual dispatch() source; the two inline blocks are the complete publish surface |
| DisplayStore ingress seam | HIGH | Read actual connect() source; receiveSnapshot() is a clean addition that reuses isValidMatchState() |
| Message schema (snapshot vs replay) | HIGH | Mirrors existing BC pattern; Cast custom message JSON support is well-documented in CAF v3 |
| Receiver bootstrap order (start() after listeners) | HIGH | Explicit requirement in CAF v3 official documentation |
| Pause sync via snapshot piggyback (not 1-Hz ticks) | HIGH | Cast message rate limits documented; local countdown pattern is standard for Cast receivers |
| CastSenderManager session lifecycle (Android background/foreground) | MEDIUM | Standard sender pattern; edge cases (Android Chrome backgrounding kills Cast session) need real-device testing |
| Receiver SDK behavior on normal browser (inert without start()) | MEDIUM | Documented behavior but worth verifying — some SDK versions log warnings that pollute the console |

---

## Sources

- Google Cast Application Framework (CAF) v3 Receiver — `developers.google.com/cast/docs/reference/caf_receiver` — custom namespace registration, `start()` order, `sendCustomMessage`. HIGH (official)
- Google Cast Sender SDK — `developers.google.com/cast/docs/reference/chrome/cast.framework` — `CastContext`, `SESSION_STATE_CHANGED`, `sendMessage`. HIGH (official)
- Cast Custom Channel documentation — `developers.google.com/cast/docs/web_sender/custom_messages`. HIGH (official)
- Cast receiver unpublished / self-registration — Cast SDK console at `cast.google.com/u/0/publish/#/signup`. HIGH (official)
- Existing codebase: `src/stores/match.svelte.ts`, `src/stores/display.svelte.ts`, `src/lib/sync-constants.ts`, `src/routes/display/+page.svelte`, `src/routes/match/+page.svelte` — read directly. HIGH (ground truth)

---

*Architecture research for: Google Cast integration — Neverman Darts App v1.1*
*Researched: 2026-06-18*
