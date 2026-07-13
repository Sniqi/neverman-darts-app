# Phase 7: Chromecast Integration — Research

**Researched:** 2026-06-18
**Domain:** Google Cast (CAF v3) sender + Custom Web Receiver in a SvelteKit 2 adapter-static PWA on GitHub Pages
**Confidence:** MEDIUM (official Google Cast docs; codebase read directly; @types versions confirmed via npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Reuse the existing `/display` route as the Cast receiver (research Option B). No standalone `static/receiver.html` — zero scoreboard-UI duplication, one source of truth for the layout. Affects RECV-01, SETUP-01.

**D-02:** Load the CAF Receiver SDK script only when in Cast context — inject it in `onMount` gated by `isCastReceiverContext()`. On tablet/PC the receiver SDK is never loaded.

**D-03:** Add a Workbox `navigateFallbackDenylist` entry so the service worker / SPA `404.html` fallback never intercepts the Chromecast's initial fetch of the receiver page.

**D-04:** Verify the prerender/SSR mechanics early, before writing receiver code. The app is currently a pure SPA (`src/routes/+layout.ts`: `prerender = true; ssr = false`) and `/display` has no `+page.js`. Planner/executor must confirm what the Chromecast actually needs by `curl`-ing the built output and testing with the Google CaC tool. This is the highest-uncertainty structural point.

**D-05:** Send a bounded/trimmed `CastDisplayState` projection over the Cast channel (not the full `MatchState`). Receiver only needs current scores, active-leg throws, player names, who is throwing, legs/sets tallies, match average, and pause state.

**D-06:** Reason: Cast has a hard, silent 64 KB message cap. A full `MatchState` for a long 4-player/sets match can exceed it.

**D-07:** The trimmed shape must contain exactly what the `/display` components read. Verify real byte size during dev — `new TextEncoder().encode(JSON.stringify(castDisplayState)).length` must stay well under 32 768 bytes.

**D-08:** Single `VITE_CAST_APP_ID`, not a dev/prod split. Supplied at build time per SETUP-02 — never hard-coded in source.

**D-09:** Wiring: deployed build reads the App ID from a GitHub Actions repo variable (plain variable, not a secret); local dev reads it from a gitignored `.env.local`.

**D-10:** Dev workflow: develop and test the receiver UI as a normal `/display` page in a browser (feed `DisplayStore` mock snapshots); reserve the real Chromecast only for actual Cast-channel integration tests.

**D-11:** Apply overscan-safe edge margins (~10% at 1920×1080) only in receiver context, scoped via a `.cast-receiver` class set when `isCastReceiverContext()` is true. The PC second-window and tablet fullscreen `/display` stay visually unchanged.

**D-12:** Persistent connection indicator: the `<google-cast-launcher>` web component plus a compact "Überträgt auf: `<Gerät>`" indicator in the match header (away from the dartboard), satisfying CAST-02/CAST-03. Stop casting via the standard Cast dialog.

**D-13:** Fully hide the Cast control when the Cast API can't initialize — not a visible-but-disabled button.

**D-14:** Include both polish items in Phase 7: CAST-06 ("Verbindung wiederhergestellt" resume toast on `SESSION_RESUMED`) and RECV-05 (smooth CSS transition on the remaining-score field).

### Claude's Discretion

- Exact `CastDisplayState` field list and the `toDisplayState(state)` projection function — planner designs it to match the `/display` read-surface (within D-05/D-07).
- Detailed Cast status-UI visuals — deferred to `/gsd-ui-phase` per D-12 (UI-SPEC.md already exists).
- Internal build/wiring order — follow the research's 8-step build order (SUMMARY.md → "Build order within Phase 1").

### Deferred Ideas (OUT OF SCOPE)

None from the discuss session. RECV-06 idle-screen match summary and RECV-07 receiver theme customization are already tracked as v2 in `REQUIREMENTS.md` / STATE.md Deferred Items.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAST-01 | User can start casting via Cast button from `/match` | `<google-cast-launcher>` in SpectatorChooser; `CastSenderManager.init()` in `onMount` |
| CAST-02 | Cast button reflects connection state (verfügbar / verbindet / verbunden) | Web component drives its own visual state; `activeSession = $state(null)` in `CastSenderManager` |
| CAST-03 | User sees which device is casting; can stop from `/match` | `CastSession.getCastDevice().friendlyName` → "Überträgt auf:" line; stop via Cast dialog |
| CAST-04 | Non-Chrome browsers: `/match` works normally, Cast control hidden | `castAvailable = $state(false)`; `{#if castAvailable}` guard; scoring features are Cast-independent |
| CAST-05 | After tablet reload during active cast, session auto-rejoins | `autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED` in `CastContext.setOptions()` |
| CAST-06 | "Verbindung wiederhergestellt" toast on `SESSION_RESUMED` | New `ResumeToast.svelte`; listen for `SESSION_STATE_CHANGED` event with `SESSION_RESUMED` value |
| RECV-01 | Chromecast runs `/display` as Custom Web Receiver (not screen-mirroring) | D-01 locked; `/display` + `isCastReceiverContext()` + `CastReceiverBridge.init()` + `context.start()` |
| RECV-02 | Before first state arrives, receiver shows loading screen | Reuse `IdleScreen.svelte` with "Warte auf Spielstand…" text while `displayStore.state === null` in Cast context |
| RECV-03 | On disconnect, receiver shows idle screen ("Kein aktives Spiel") | `SENDER_DISCONNECTED` event → set state to null; `IdleScreen` renders automatically |
| RECV-04 | Receiver stays connected through long pauses | `options.disableIdleTimeout = true; options.maxInactivity = 3600` before `context.start()` |
| RECV-05 | Remaining-score field animates smoothly on update | CSS `transition: color 300ms ease-out` + `.updating` class flash via `$effect` on `liveRemaining` change in `PlayerPanel.svelte` |
| SYNC-01 | On connect / late join / reconnect, receiver hydrates full current match state | `SESSION_STARTED` / `senderConnected` → `#publishToCast(current snapshot)` immediately |
| SYNC-02 | Every dart/visit updates Chromecast scoreboard live | `#publishToCast()` called after existing localStorage block in `dispatch()` |
| SYNC-03 | Auto-pause countdown stays in sync on Chromecast | `pauseActive + pauseRemainingSeconds` piggybacked on every `CastSnapshotMessage`; receiver runs local countdown |
| SYNC-04 | Existing PC second-window (BroadcastChannel) and tablet fullscreen keep working unchanged | Cast is additive — three `try/catch` blocks in `dispatch()`, existing two untouched |
| SETUP-01 | Receiver served at stable HTTPS URL on GitHub Pages, not intercepted by PWA SW | `prerender = true; ssr = true` in new `display/+page.js` + `navigateFallbackDenylist` in `vite.config.ts` |
| SETUP-02 | Cast App ID supplied at build time (no hardcode in source) | `VITE_CAST_APP_ID` env var; `.env.local` gitignored; GitHub Actions repo variable |
| SETUP-03 | Written setup guide for one-time Cast Console registration | SETUP.md covering $5 fee, unpublished receiver, serial number registration, 15-min propagation + reboot |
</phase_requirements>

---

## Summary

Phase 7 adds a third spectator transport — Google Cast — to an app that already has BroadcastChannel (PC second window) and in-app fullscreen (/display). The architecture is purely additive: `MatchStore.dispatch()` gains a third `try/catch` publish block calling `#publishToCast()`, and `/display` gains a receiver SDK init path gated on `isCastReceiverContext()`. Every existing behaviour continues to work unchanged.

The critical structural question (D-04) is now resolved by codebase inspection: `/display` has **no `+page.js` file**. The current SPA global (`ssr = false`) means adapter-static does NOT emit a standalone `build/display/index.html` — it only produces the SPA shell `404.html`. The Chromecast would receive that shell and fail. The fix is to create `src/routes/display/+page.js` with `export const prerender = true; export const ssr = true`. This forces adapter-static to emit a real `build/display/index.html` that the Chromecast fetches directly. Combined with `navigateFallbackDenylist`, the SW never intercepts it. This must be the first code change in the phase.

The only new npm packages are two `@types` dev-dependencies. Both are confirmed present at the research-specified versions (1.0.11 and 6.0.26) and both pass the package legitimacy gate. No runtime npm packages are added — both Cast SDKs are CDN-only from `gstatic.com` by Google's design.

**Primary recommendation:** Implement in the 8-step build order from ARCHITECTURE.md. Step 4 (receiver page scaffold + `+page.js` + `vite.config.ts` denylist) is the correctness gate — nothing else can be E2E tested until `curl` of the deployed URL returns real receiver HTML, not the SPA shell.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cast sender session lifecycle | Frontend Server (SvelteKit `/match`) | — | Cast Sender SDK runs browser-side only; `CastSenderManager` lives in the scoring window |
| State publication to Cast | API / Backend layer analogue (`MatchStore`) | — | `dispatch()` is the single mutation point; all publishes originate there |
| Cast receiver display | Browser / Client (`/display` route on Chromecast) | — | Chromecast runs a browser; `/display` is the UI layer |
| PWA SW exclusion | CDN / Static (Workbox config) | — | `navigateFallbackDenylist` prevents SW from intercepting the receiver URL |
| Prerender of `/display` | Frontend Server (adapter-static) | — | New `+page.js` forces a real HTML file at `build/display/index.html` |
| Cross-window state sync | Browser / Client (BroadcastChannel) | — | Existing paths unchanged; Cast is third transport at same tier |
| App ID injection | CDN / Static (Vite build) | — | `VITE_CAST_APP_ID` baked in at build time; GitHub Actions repo variable |

---

## Standard Stack

### Core (new for v1.1)

| Technology | Source | Purpose | Provenance |
|------------|--------|---------|------------|
| Cast Sender SDK (CAF) | `https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1` | Sender session management, device picker, custom channel | [VERIFIED: npm registry + official Google Cast docs] |
| CAF Web Receiver SDK v3 | `//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js` | Receiver lifecycle, namespace registration, `context.start()` | [VERIFIED: npm registry + official Google Cast docs] |
| `@types/chromecast-caf-sender` | `1.0.11` (latest) | TypeScript types for `window.cast`, `cast.framework.*`, `window.__onGCastApiAvailable` | [VERIFIED: npm registry] — `npm view` confirms 1.0.11, ~44k weekly downloads, DefinitelyTyped |
| `@types/chromecast-caf-receiver` | `6.0.26` (latest) | TypeScript types for `cast.framework.CastReceiverContext`, `CastReceiverOptions`, `addCustomMessageListener` | [VERIFIED: npm registry] — `npm view` confirms 6.0.26, ~20k weekly downloads, DefinitelyTyped |

### Supporting (changes to existing config)

| File | Change | Purpose |
|------|--------|---------|
| `src/routes/display/+page.js` | **New file** — `export const prerender = true; export const ssr = true` | Forces adapter-static to emit `build/display/index.html` (D-04 fix) |
| `vite.config.ts` Workbox config | Add `navigateFallbackDenylist` + `globIgnores` | Prevents SW intercepting receiver URL; prevents precaching of `/display` as SPA fallback |
| `tsconfig.json` / new `tsconfig.receiver.json` | Scope receiver types separately | Prevents `@types/chromecast-caf-receiver` globals from leaking into sender tsconfig |
| `src/lib/sync-constants.ts` | Add `CAST_NS` export | Mirrors established pattern — single constant prevents namespace mismatch (Pitfall 5) |

**Installation:**
```bash
npm install -D @types/chromecast-caf-sender @types/chromecast-caf-receiver
```

No runtime npm packages. Both Cast SDKs load from Google's CDN via `<script>` tags.

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@types/chromecast-caf-sender` | npm | ~1.5 yrs (Nov 2024) | ~44k/wk | DefinitelyTyped | OK | Approved |
| `@types/chromecast-caf-receiver` | npm | ~3 mo (Apr 2026) | ~20k/wk | DefinitelyTyped | OK | Approved |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious SUS:** none

Both packages are DefinitelyTyped-published Microsoft-maintained type stubs with no postinstall scripts. `@types/chromecast-caf-sender` depends on `@types/chrome` — add it if not already in the project (`@types/node` is present; verify `@types/chrome` is available or install it).

---

## D-04: Prerender/SSR Mechanics — Concrete Resolution

This is the highest-uncertainty structural point from CONTEXT.md. The codebase inspection resolves it:

**Current state (confirmed by file read):**
- `src/routes/+layout.ts` sets `prerender = true; ssr = false` globally
- `src/routes/display/` contains **only `+page.svelte` — no `+page.js`**
- `vite.config.ts` Workbox config: `navigateFallback: base + '/404.html'` with no `navigateFallbackDenylist`

**What this means for the Chromecast:**
With the global `ssr = false`, adapter-static does NOT generate a standalone `build/display/index.html`. It generates only `build/404.html` (the SPA shell). When the Chromecast fetches the registered receiver URL (`https://sniqi.github.io/neverman-darts-app/display`), GitHub Pages serves `404.html` (the SPA shell). The SPA boots, the client router navigates to `/display`, but the receiver SDK scripts are never loaded via the correct prerendered path — causing the session to fail silently.

**The fix (concrete, testable):**

Step 1 — Create `src/routes/display/+page.js`:
```js
// src/routes/display/+page.js
// D-04: Force prerendering of /display so adapter-static emits
// build/display/index.html — required for the Chromecast to fetch
// the receiver page as a real HTML file, not the SPA 404 shell.
export const prerender = true;
export const ssr = true;
```

`ssr = true` is required alongside `prerender = true` — prerendering needs SSR enabled to produce static HTML. The global `ssr = false` in `+layout.ts` applies to routes that don't specify their own value; the per-route override takes precedence. [ASSUMED — SvelteKit per-route override semantics verified by behavior described in existing PITFALLS.md Pitfall 1 + adapter-static docs]

Step 2 — Update `vite.config.ts` Workbox block:
```typescript
workbox: {
  globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
  navigateFallback: base + '/404.html',
  // D-03/D-04: Prevent SW from intercepting the receiver URL.
  // The Chromecast fetches /display from a clean Chromium context
  // with no installed SW — but be defensive.
  navigateFallbackDenylist: [/\/display(\/|$)/],
}
```

Note: no `globIgnores` entry is needed for the `/display` route because it IS a prerendered SvelteKit route (not a file in `static/`) — adapter-static will include it in the build output and the SW precache by default. The `navigateFallbackDenylist` is sufficient to prevent the SW navigation fallback from intercepting it.

**Verification procedure (D-04 gate — must pass before any receiver code is written):**

1. Run `npm run build` locally with `BASE_PATH=/neverman-darts-app`.
2. Check `build/display/index.html` exists and contains receiver `<script>` tag (not the SPA bootstrap script).
3. Serve the `build/` directory locally (`npx serve build`) and `curl http://localhost:PORT/neverman-darts-app/display` — response must be receiver HTML, not the SPA shell.
4. Deploy to GitHub Pages and repeat with the real URL.
5. Optional: use the Google CaC tool (`developers.google.com/cast/docs/debugging/cac_tool`) to fetch the receiver URL and confirm the Cast receiver SDK boots correctly before writing any sender code.

**SSR side-effect to guard (Pitfall 8):** With `ssr = true`, SvelteKit's prerender phase runs the route in Node.js where `window`, `document`, and `chrome` are undefined. The receiver SDK script tag must be in `<svelte:head>` (inert during SSR), not at module top level. All `cast.framework.*` calls must be inside `onMount` behind the `isCastReceiverContext()` guard. The existing `displayStore.connect()` BroadcastChannel call inside `$effect` is already SSR-safe.

---

## Architecture Patterns

### System Architecture Diagram

```
TABLET (/match)
  User taps dartboard segment
      │
      ▼
  MatchStore.dispatch(action)
      │
      ├── [EXISTING] BroadcastChannel('neverman-match').postMessage(snapshot)
      │       └── DisplayStore (PC second window / tablet /display) — UNCHANGED
      │
      ├── [EXISTING] localStorage.setItem('neverman-match-snapshot', JSON)
      │       └── DisplayStore.connect() cold-start hydration — UNCHANGED
      │
      └── [NEW] #publishToCast(trimmedSnapshot: CastDisplayState)
              │   via CastSenderManager.activeSession.sendMessage(CAST_NS, payload)
              │
              ▼  (LAN via Cast protocol)
  CHROMECAST (/display as Custom Web Receiver)
      │
      CastReceiverBridge.onMessage(event)
          └── displayStore.receiveSnapshot(event.data)
                  ├── isValidMatchState(msg.state) guard
                  └── displayStore.state, pauseActive, pauseRemainingSeconds = msg.*
                          └── /display components re-render (unchanged)
```

### Recommended Project Structure (new files only)

```
src/
├── lib/
│   ├── cast-types.ts           # CAST_NS constant; CastDisplayState type; CastMessage union
│   ├── cast-sender.svelte.ts   # CastSenderManager ($state activeSession; SDK lifecycle)
│   └── cast-receiver.ts        # isCastReceiverContext(); CastReceiverBridge.init()
│
└── ui/
    └── cast/
        ├── CastButton.svelte   # <google-cast-launcher> wrapper + status row (in SpectatorChooser)
        └── ResumeToast.svelte  # "Verbindung wiederhergestellt" toast (CAST-06)

src/routes/display/
└── +page.js                    # NEW: export const prerender = true; export const ssr = true

tsconfig.receiver.json          # NEW: scopes @types/chromecast-caf-receiver away from app tsconfig
```

Existing files modified (surgically):

```
src/lib/sync-constants.ts           # Add: export const CAST_NS = 'urn:x-cast:dev.neverman.match'
src/stores/match.svelte.ts          # Add: #castManager; setCastManager(); #publishToCast(); 2 call sites
src/stores/display.svelte.ts        # Add: receiveSnapshot(msg: CastDisplayState) public method
src/routes/display/+page.svelte     # Add: <svelte:head> receiver SDK script; onMount bridge init; onRecord; .cast-receiver class
src/routes/match/+page.svelte       # Add: CastSenderManager init; setCastManager(); <CastButton> in SpectatorChooser
src/ui/display/PlayerPanel.svelte   # Add: RECV-05 CSS transition + .updating class effect
vite.config.ts                      # Add: navigateFallbackDenylist to Workbox config
```

### Pattern 1: CAS Receiver SDK Loading (D-02 — onMount injection, gated)

The receiver SDK must be in `<svelte:head>` (inert during SSR) but only actually useful in a Cast context. Two approaches are valid; ARCHITECTURE.md chose "always load in `<svelte:head>`, gate `start()` in `onMount`":

```svelte
<!-- src/routes/display/+page.svelte additions -->
<svelte:head>
  <!-- Only loads on Chromecast (Cast context); on normal browsers SDK is inert
       because CastReceiverContext.start() is never called (isCastReceiverContext() = false) -->
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { isCastReceiverContext, CastReceiverBridge } from '../../lib/cast-receiver.js';

  onMount(() => {
    if (!isCastReceiverContext()) return; // normal browser — skip all Cast init
    // 1. Register namespace BEFORE context.start() (CAF v3 requirement — Pitfall 2 analog)
    CastReceiverBridge.init({
      onSnapshot: (msg) => displayStore.receiveSnapshot(msg),
      onRecord: (msg) => { /* append to recordStrings */ }
    });
    // 2. start() AFTER all listeners registered
    const options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true;
    options.maxInactivity = 3600;
    cast.framework.CastReceiverContext.getInstance().start(options);
  });
</script>
```

Source: [CITED: developers.google.com/cast/docs/web_receiver/core_features — start() timing requirement]

### Pattern 2: CAF v3 Init Ordering (Sender)

The `__onGCastApiAvailable` assignment MUST precede the `<script>` tag injection. In `CastSenderManager`:

```typescript
// src/lib/cast-sender.svelte.ts — init() method
// Called from match/+page.svelte onMount
init(appId: string): void {
  // CRITICAL: assign callback BEFORE script appends (Pitfall 2 — load-order race)
  (window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
    if (!isAvailable) return; // Cast not available (non-Chrome) — D-13
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: appId,
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED, // D-06 / CAST-05
    });
    // Register session state listener
    cast.framework.CastContext.getInstance().addEventListener(
      cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      (e) => this.#handleSessionStateChange(e)
    );
    this.#castAvailable = true;
  };
  // Inject SDK script AFTER callback assigned
  const s = document.createElement('script');
  s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
  document.head.appendChild(s);
}
```

Key details:
- `?loadCastFramework=1` is **required** on the URL — without it `cast.framework.*` is undefined (Pitfall 3)
- `autoJoinPolicy: ORIGIN_SCOPED` delivers CAST-05 auto-rejoin with a single line
- `SESSION_RESUMED` event (for CAST-06 toast) fires on the `SESSION_STATE_CHANGED` listener when `e.sessionState === cast.framework.SessionState.SESSION_RESUMED`

Source: [CITED: developers.google.com/cast/docs/web_sender/integrate]

### Pattern 3: Custom Channel Namespace Constant

```typescript
// src/lib/cast-types.ts (or add to sync-constants.ts)
// Single exported constant — imported by both sender and receiver.
// A one-character difference silently drops all messages (Pitfall 5).
export const CAST_NS = 'urn:x-cast:dev.neverman.match';
```

The `urn:x-cast:` prefix is required by the Cast SDK — any other prefix is rejected.

### Pattern 4: CastDisplayState Projection (D-05/D-07)

The planner must define the exact field list, but the structure should contain exactly what `/display` components read. Based on reading `+page.svelte` and `PlayerPanel.svelte`:

```typescript
// src/lib/cast-types.ts
export interface CastDisplayState {
  // From MatchState — only display-relevant fields
  phase: 'setup' | 'playing' | 'leg-complete' | 'match-complete';
  config: {
    startScore: number;
    legsToWin: number;
    setsEnabled: boolean;
    setsToWin: number;
    checkoutHint: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    legsWon: number;
    setsWon: number;
    visits: DartScore[][];         // current leg only — NOT full history
    legCompleted: DartScore[][];   // needed for leg-average display
    legStartVisitIndex: Record<string, number>;
  }>;
  activePlayerIndex: number;
  currentVisit: DartScore[];
  legStartVisitIndex: Record<string, number>;
  // Pause state piggybacked (SYNC-03) — not in MatchState, added here
  pauseActive: boolean;
  pauseRemainingSeconds: number;
}
```

The planner must verify that `visits: DartScore[][]` is scoped to the current leg only (not all historical legs) to keep the payload small. Measure with `new TextEncoder().encode(JSON.stringify(castDisplayState)).length` during a long test match — must stay under 32 768 bytes (D-07).

The `receiveSnapshot()` method in `DisplayStore` must accept `CastDisplayState` and map it onto the fields `displayStore.state` and `displayStore.pauseActive`. Since `CastDisplayState` is not identical to `MatchState`, `isValidMatchState()` must be adapted or a new guard written for the Cast shape.

### Pattern 5: Additive Publish in dispatch()

```typescript
// src/stores/match.svelte.ts — add after existing localStorage block
// New private method #publishToCast():
#publishToCast(): void {
  const session = this.#castManager?.activeSession;
  if (!session) return;
  try {
    const payload: CastDisplayState = toDisplayState(this.state, this.pauseActive, this.pauseRemainingSeconds);
    // D-07: validate size in development
    if (import.meta.env.DEV) {
      const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      if (bytes > 32768) console.warn('[Cast] payload exceeded 32 KB:', bytes);
    }
    session.sendMessage(CAST_NS, payload);
  } catch {
    // Non-fatal — match play continues uninterrupted
  }
}
```

### Pattern 6: tsconfig.receiver.json (type isolation)

Receiver types declare many globals that conflict with sender types:

```json
// tsconfig.receiver.json (new file at project root)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": []  // exclude all auto-includes
  },
  "include": [
    "src/lib/cast-receiver.ts",
    "src/lib/cast-types.ts"
  ],
  "references": []
}
```

Add `/// <reference types="@types/chromecast-caf-receiver" />` at the top of `cast-receiver.ts` to scope the globals. This prevents the receiver's `cast.*` globals from appearing in `/match` sender code (which uses the sender SDK's different `cast.*` API). [ASSUMED — standard tsconfig scoping pattern; no official Cast doc specifies the exact tsconfig approach]

### Pattern 7: Receiver Context Detection

```typescript
// src/lib/cast-receiver.ts
export function isCastReceiverContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    'cast' in window &&
    typeof (window as any).cast?.framework?.CastReceiverContext !== 'undefined'
  );
}
```

Note: this check only works after the receiver SDK script has loaded. In `onMount`, the SDK is guaranteed to have loaded (synchronous load from `<svelte:head>` completes before `onMount` fires). On normal browsers where the SDK is absent, `'cast' in window` is false.

### Anti-Patterns to Avoid

- **Sending `MatchState` directly over Cast:** Silent 64 KB failure on long matches. Use `CastDisplayState` projection (D-05).
- **Calling `context.start()` before `addCustomMessageListener()`:** Messages missed on session connect. Listeners must be registered first (CAF v3 requirement).
- **Assigning `__onGCastApiAvailable` after `appendChild(script)`:** Callback fires before assignment on cache-hot loads. Always assign first.
- **Loading receiver SDK in `/match` or sender SDK in `/display`:** The two SDKs conflict on the `cast.*` global. Keep them strictly separated.
- **Sending pause-tick messages over Cast every second:** Cast channels have throughput limits. Piggyback `pauseActive + pauseRemainingSeconds` on every `CastSnapshotMessage`; receiver runs a local countdown.
- **Using `localStorage` for receiver hydration on Chromecast:** Chromecast has no localStorage key — different device. Hydration is always the first Cast snapshot from the sender.
- **Shipping `VITE_CAST_APP_ID` as a GitHub Actions secret:** The App ID ships in the client bundle regardless (it's not secret). Use a plain Actions variable, not a secret. [CITED: CONTEXT.md D-09]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Device picker for Chromecast | Custom device list UI | `<google-cast-launcher>` + built-in Cast dialog | SDK manages device discovery, rendering, and "stop casting" button |
| Cast session management | Custom session tracking | `CastContext.SESSION_STATE_CHANGED` event + `CastContext.getCurrentSession()` | SDK handles reconnect, timeout, multi-state transitions |
| Receiver idle timeout prevention | Custom heartbeat timer | `options.disableIdleTimeout = true; options.maxInactivity = 3600` | CAF's own option; documented for non-media apps |
| Auto-rejoin after page reload | Manual re-cast flow | `autoJoinPolicy: ORIGIN_SCOPED` | One-line config; SDK handles the rejoins |
| Namespace string typed in two files | Both sender/receiver hardcode the URN | Single `CAST_NS` export from `cast-types.ts` | Namespace mismatch is silent — no error, just no messages |
| SW exclusion for receiver URL | Custom service worker logic | `navigateFallbackDenylist` in vite.config.ts | Standard vite-plugin-pwa Workbox option |

---

## Common Pitfalls

### Pitfall 1: `/display` Serves SPA Shell to Chromecast

**What goes wrong:** No `+page.js` exists — adapter-static does NOT emit `build/display/index.html`. Chromecast gets `404.html` (SPA shell). Receiver SDK never loads correctly.

**Confirmed by:** Codebase inspection — `src/routes/display/` contains only `+page.svelte`. [VERIFIED: codebase read]

**How to avoid:** Create `src/routes/display/+page.js` with `prerender = true; ssr = true`. This is the FIRST code change in the phase — nothing works until the prerendered file exists.

**Verification:** After `npm run build`, confirm `build/display/index.html` exists and does not contain the SPA bootstrap JS bundle references.

### Pitfall 2: `__onGCastApiAvailable` Missed (Script Load Order Race)

**What goes wrong:** Callback assigned after `appendChild(script)`. SDK fires callback immediately on cached script load before assignment completes. Cast button never appears. No error thrown.

**How to avoid:** Assign `window['__onGCastApiAvailable']` on the FIRST LINE of the init block, before any script injection.

**Warning signs:** `typeof cast === 'undefined'` in Chrome console after load; Cast button absent.

### Pitfall 3: Missing `?loadCastFramework=1`

**What goes wrong:** Without the query param, only the legacy `chrome.cast.*` Base API loads. `cast.framework.*` is `undefined`. All CAF calls throw silently.

**How to avoid:** Use the full URL `https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1`. Store as a named constant.

**Warning signs:** `cast.framework` is `undefined`; CastContext throws TypeError on access.

### Pitfall 4: Receiver Killed by Idle Timeout Mid-Match

**What goes wrong:** Default CAF idle timeout (~5 minutes) terminates the receiver during a darts break. TV shows Chromecast home screen mid-game.

**How to avoid:** `options.disableIdleTimeout = true; options.maxInactivity = 3600` BEFORE `context.start()`. These must be set in `CastReceiverOptions` before `start()` is called — they cannot be changed after.

### Pitfall 5: Namespace Mismatch Silently Drops Messages

**What goes wrong:** Sender and receiver use different namespace strings. All messages silently discarded. No error.

**How to avoid:** Single `CAST_NS` export. Zero string literals elsewhere. Grep the codebase for `urn:x-cast:` — it must appear exactly once (the constant definition).

### Pitfall 6: 64 KB Message Cap on Long Matches

**What goes wrong:** Full `MatchState` with throw history exceeds 64 KB on long matches. Messages silently dropped. Score stops updating on TV.

**How to avoid:** `CastDisplayState` projection (D-05). Validate in dev: `new TextEncoder().encode(JSON.stringify(payload)).length < 32768`. Already decided by D-05/D-07.

### Pitfall 7: Workbox `navigateFallback` Intercepts Receiver URL

**What goes wrong:** Even after prerendering, the SW's navigation fallback intercepts `/display` navigation and returns the SPA shell instead of the prerendered file. The Chromecast (different device, no installed SW) is not affected, but users opening `/display` in a normal browser after the SW installs may hit this.

**How to avoid:** `navigateFallbackDenylist: [/\/display(\/|$)/]` in the Workbox config. This is a same-commit change with creating `+page.js` — they address the same problem from two angles.

### Pitfall 8: SSR Crashes on `window`/`chrome` Access

**What goes wrong:** With `ssr = true` on `/display`, the prerender phase runs in Node.js. Any module-level access to `window`, `document`, or `cast.*` throws `ReferenceError: window is not defined` and the build fails.

**How to avoid:** All Cast receiver SDK access must be inside `onMount`. The SDK `<script>` tag in `<svelte:head>` is inert during SSR. Never call `cast.framework.*` at module top level or in a `$effect` that can run during SSR.

**Verification:** `npm run build` must pass without `ReferenceError`.

### Pitfall 9: Cast Console Registration Account Email is Permanent

**What goes wrong:** Email used to register cannot be changed after paying the $5 fee.

**How to avoid:** Use the same Google account as other project assets. [CITED: Cast Developer Help docs]

### Pitfall 10: Receiver URL Registered Before Prerendered File Exists

**What goes wrong:** Register the URL in Cast Console before deploying the prerendered receiver. Chromecast gets 404. Session fails with `LAUNCH_ERROR`.

**How to avoid:** Deploy to GitHub Pages, verify `curl` returns real receiver HTML, then register the URL in Cast Console.

---

## Runtime State Inventory

Not applicable — this is a greenfield feature addition, not a rename/refactor/migration phase. No stored data, service config, OS-registered state, secrets, or build artifacts reference a string that this phase renames or changes. The Cast App ID is a new env var, not a rename of an existing one.

---

## Code Examples

### Verified Pattern: CastReceiverBridge.init() (receiver namespace registration + start ordering)

```typescript
// src/lib/cast-receiver.ts
// Source: developers.google.com/cast/docs/web_receiver/core_features

export class CastReceiverBridge {
  static init(callbacks: {
    onSnapshot: (msg: CastDisplayState) => void;
    onRecord: (msg: CastRecordMessage) => void;
    onRequestSnapshot: () => CastDisplayState;
  }): void {
    const ctx = cast.framework.CastReceiverContext.getInstance();

    // REGISTER LISTENERS BEFORE start() — CAF v3 requirement
    ctx.addCustomMessageListener(CAST_NS, (event: cast.framework.system.Event) => {
      const msg = event.data as CastMessage;
      if (msg.type === 'snapshot') callbacks.onSnapshot(msg);
      else if (msg.type === 'record') callbacks.onRecord(msg);
      else if (msg.type === 'request-snapshot') {
        // Receiver → Sender fallback: receiver reloaded while sender backgrounded
        ctx.sendCustomMessage(CAST_NS, (event as any).senderId, {
          type: 'snapshot',
          ...callbacks.onRequestSnapshot(),
        });
      }
    });

    const options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true;    // RECV-04 — non-media app
    options.maxInactivity = 3600;         // 1-hour heartbeat window
    // context.start() ALWAYS LAST — after all namespace listeners are registered
    ctx.start(options);
  }
}
```

### Verified Pattern: CastDisplayState Size Check (D-07)

```typescript
// In #publishToCast(), called from dispatch()
if (import.meta.env.DEV) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  console.debug('[Cast] payload size:', bytes, 'bytes');
  if (bytes > 32768) {
    console.warn('[Cast] payload exceeds 32 KB safety margin:', bytes);
  }
}
```

### Verified Pattern: Graceful Degradation (CAST-04)

```typescript
// CastSenderManager — track Cast availability as $state
#castAvailable = $state(false);

get castAvailable(): boolean { return this.#castAvailable; }

// In init():
(window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
  this.#castAvailable = isAvailable;
  if (isAvailable) this.#initCastContext();
  // else: Cast unavailable (non-Chrome) — D-13: Cast row hidden via {#if castAvailable}
};
```

### Verified Pattern: SESSION_RESUMED Toast (CAST-06, D-14)

```typescript
// In CastSenderManager #handleSessionStateChange():
#handleSessionStateChange(e: cast.framework.SessionStateEventData): void {
  const S = cast.framework.SessionState;
  if (e.sessionState === S.SESSION_STARTED || e.sessionState === S.SESSION_RESUMED) {
    this.activeSession = cast.framework.CastContext.getInstance().getCurrentSession();
    if (e.sessionState === S.SESSION_RESUMED) {
      // Trigger CAST-06 toast — set $state flag consumed by ResumeToast.svelte
      this.#sessionJustResumed = true;
    }
  } else if (e.sessionState === S.SESSION_ENDED) {
    this.activeSession = null;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CAF v2 Receiver SDK | CAF v3 (3.0.0151, May 2026) | 2022 | v2 deprecated; all new receivers must use v3 URL |
| `static/receiver.html` standalone file | Reuse prerendered SvelteKit route (D-01) | Design decision this phase | Eliminates UI duplication; requires `+page.js` prerender override |
| Full `MatchState` over Cast channel | Trimmed `CastDisplayState` projection (D-05) | Design decision this phase | Prevents silent 64 KB message drops on long matches |
| `chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED` | `ORIGIN_SCOPED` | Best-practice recommendation | Enables auto-rejoin across tab reloads (CAST-05) |

**Deprecated/outdated:**
- `cast.framework.RemotePlayerController`: Only needed for media-playback UIs (expanded controller). N/A for a custom data channel scoreboard.
- `<cast-media-player>` element: Media playback only. Not used — this is a data-cast, not a media cast.
- `setInactivityTimeout()`: Debug-only API; unsupported in production. Use `maxInactivity` in `CastReceiverOptions`.

---

## Validation Architecture

Nyquist validation is enabled (no `workflow.nyquist_validation: false` in config).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (node) + Vitest browser mode (Playwright/Chromium) |
| Config file | `vite.config.ts` (dual projects: `unit` and `browser`) |
| Quick run command | `npm run test:unit` or `npx vitest run --project unit` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| CAST-01 | Cast button appears in Chrome | Browser manual | Open `/match` in Chrome, verify cast-row visible | Automated is possible via Playwright if Cast SDK can be mocked |
| CAST-02 | Button states reflect connection | Unit | `npx vitest run --project unit src/lib/cast-sender.test.ts` | Test `CastSenderManager` state machine with mock CastContext |
| CAST-03 | Device name shown; stop works | Browser manual | Connect session, verify "Überträgt auf: X" text | Requires physical Chromecast |
| CAST-04 | Non-Chrome: no Cast control, scoring works | Browser manual | Open `/match` in Firefox; verify no cast row, scoring intact | Playwright can run Firefox |
| CAST-05 | Auto-rejoin on tablet reload | Manual/on-device | Reload `/match` during active session; verify no re-cast needed | Requires physical Chromecast |
| CAST-06 | Resume toast on `SESSION_RESUMED` | Unit | Test `CastSenderManager` fires `sessionJustResumed` on resume event | Mock `SESSION_RESUMED` event |
| RECV-01 | Chromecast shows /display scoreboard | Manual/on-device | Cast to device; verify scoreboard renders | External gate — requires device |
| RECV-02 | Loading screen before first snapshot | Browser mock | Load `/display` with `isCastReceiverContext` mocked to true, no snapshot; verify `IdleScreen` with loading text | [Wave 0 gap: cast-context mock] |
| RECV-03 | Idle screen on sender disconnect | Browser mock | Mock `SENDER_DISCONNECTED`; verify `IdleScreen` with "Kein aktives Spiel" | |
| RECV-04 | Session survives 6-minute pause | Manual/on-device | Leave session idle 6+ min; verify receiver still shows on TV | Requires device + time |
| RECV-05 | Remaining-score CSS transition | Browser | `npx vitest run --project browser src/ui/display/PlayerPanel.test.ts` | Test `.updating` class applied/removed on score change |
| SYNC-01 | Hydration on connect/late-join | Unit | Test `#publishToCast` called on `SESSION_STARTED`; test `receiveSnapshot` updates state | |
| SYNC-02 | Per-throw Cast update | Unit | Test `#publishToCast` called in `dispatch()` after localStorage block | Extend existing dispatch tests |
| SYNC-03 | Pause countdown stays in sync | Unit | Test `pauseActive + pauseRemainingSeconds` in `CastDisplayState` payload matches MatchStore values | |
| SYNC-04 | BroadcastChannel path unchanged | Unit | Existing dispatch tests must still pass unchanged | No new test needed |
| SETUP-01 | Prerendered `build/display/index.html` exists | Build artifact | `npm run build && test -f build/display/index.html` (shell assertion) | [Wave 0 gap: CI build check] |
| SETUP-02 | App ID from env var | Unit | Test `CastSenderManager.init()` reads `import.meta.env.VITE_CAST_APP_ID` | Mock env in test |
| SETUP-03 | Setup guide exists | Manual | Read `SETUP.md` | Not a code test |

### Validations Requiring Physical Chromecast + Cast Developer Console

The following validations **cannot be automated** and require:
1. Cast Developer Console registration ($5, one-time, serial number registered)
2. Physical Chromecast device on the same LAN
3. Cast Console showing "Ready for Testing"

- CAST-01 (actual Cast button functionality in Chrome)
- CAST-03 (device name display, stop casting)
- CAST-05 (auto-rejoin after reload)
- RECV-01 (receiver renders on real Chromecast)
- RECV-04 (idle timeout survival)
- RECV-05 perception on TV (CSS transition visible at 3 m)

### Validations Possible in Normal Browser Without Chromecast

All of these can be executed locally using mock state — **D-10 workflow**:

- Receiver UI for all screen states: mock `isCastReceiverContext()` to return true, feed `DisplayStore` with mock `CastDisplayState` snapshots directly
- Loading state: mock receiver context, delay snapshot injection
- Disconnect state: mock receiver context, call `displayStore.receiveSnapshot(null)` or set `state = null`
- Payload size validation: `new TextEncoder().encode(JSON.stringify(testState)).length`
- BroadcastChannel coexistence (SYNC-04): open `/display` in second window while Cast mock is active

### Sampling Rate

- **Per task commit:** `npx vitest run --project unit` (pure logic tests only — fast)
- **Per wave merge:** `npx vitest run` (unit + browser mode)
- **Phase gate:** Full suite green + manual D-10 browser validation + physical Chromecast E2E (gated on Cast Console registration being complete)

### Wave 0 Gaps

- [ ] `src/lib/cast-sender.test.ts` — unit tests for `CastSenderManager` state machine
- [ ] `src/lib/cast-receiver.test.ts` — unit tests for `isCastReceiverContext()` and `CastReceiverBridge` routing
- [ ] `src/stores/display.test.ts` extension — tests for `receiveSnapshot()` method
- [ ] `src/stores/match.test.ts` extension — test `#publishToCast()` called in dispatch, not called when no cast session
- [ ] `src/ui/display/PlayerPanel.test.ts` extension — RECV-05 `.updating` class applied/removed
- [ ] Cast receiver context mock: `src/test-mocks/cast-receiver-mock.ts` — mock `isCastReceiverContext()` return value for browser-mode tests
- [ ] CI build check for `build/display/index.html` existence (SETUP-01)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Cast layer; all traffic is LAN-local |
| V3 Session Management | Partial | SDK manages Cast session lifecycle; no custom session tokens |
| V4 Access Control | No | Private unpublished receiver; device registered by serial number |
| V5 Input Validation | Yes | `isValidMatchState()` guard on `receiveSnapshot()` — validate Cast message schema before applying to UI state |
| V6 Cryptography | No | Cast protocol uses TLS; no app-level crypto needed |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious Cast sender on same LAN sends crafted state | Tampering | Validate `CastDisplayState` schema on receiver before applying; home-use risk is low but the guard is cheap |
| VITE_CAST_APP_ID committed to source | Information Disclosure | Use env var; `.env.local` in `.gitignore`; GitHub Actions repo variable (not secret) — App ID is not a cryptographic secret but scoping it prevents confusion |
| Receiver SDK loading on non-Chromecast (inertness concern) | Tampering | SDK is inert without `context.start()`; gated by `isCastReceiverContext()` — no risk |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + npm | Build | Yes | (project already builds) | — |
| Chrome/Chromium | CAST-01, sender testing | Yes | Desktop Chrome on dev machine | Firefox for non-Cast scoring tests |
| Physical Chromecast | RECV-01, CAST-03, CAST-05, RECV-04 | External gate | Chromecast 3rd gen or Chromecast with Google TV | D-10: mock snapshots in browser for UI dev |
| Cast Developer Console registration | E2E testing | External gate (not yet done) | $5 one-time fee, 15-min propagation | D-10: unit + browser tests cover most logic |
| GitHub Actions repo variable (`VITE_CAST_APP_ID`) | SETUP-02 CI builds | Not yet set | — | `.env.local` for local builds |

**Missing dependencies with no fallback:**
- Physical Chromecast + Cast Console registration — blocks RECV-01, CAST-01, CAST-03, CAST-05, RECV-04 E2E. Must be complete before the phase plan schedules any on-device test step.

**Missing dependencies with fallback:**
- Cast Console registration — D-10 workflow covers all UI development and unit testing before the device is registered.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | SvelteKit per-route `+page.js` with `prerender = true; ssr = true` overrides the global `ssr = false` from `+layout.ts` | D-04 Resolution | `/display` would not prerender; D-04 fix would not work — executor must verify with actual build output before proceeding |
| A2 | `tsconfig.receiver.json` with `/// <reference types="@types/chromecast-caf-receiver" />` in receiver files is sufficient to scope receiver globals away from sender tsconfig | Pattern 6 | Type conflicts between receiver and sender globals — may need a different isolation approach |
| A3 | `CastDisplayState` with `visits` scoped to current leg only stays well under 32 KB even for 4-player sets matches | CastDisplayState Projection | If wrong, message size check fails and planner must further trim the payload |
| A4 | The receiver SDK is truly inert (no console warnings) when loaded via `<svelte:head>` on a normal browser without `context.start()` | Pattern 1 | Console warning pollution in normal browser use; acceptable but worth verifying (SUMMARY.md MEDIUM confidence note) |

**If this table is empty:** it is not empty — A1 is the critical assumption; confirm by building.

---

## Open Questions

1. **Does `ssr = true` on `/display` conflict with the `displayStore.connect()` BroadcastChannel code?**
   - What we know: `displayStore.connect()` is called inside `$effect(() => displayStore.connect())`. `$effect` does not run during SSR. `BroadcastChannel` is not referenced at module top level.
   - What's unclear: Whether `$effect` in Svelte 5 with `ssr = true` on a prerendered page can ever fire during prerender in Node.js.
   - Recommendation: Confirm by running `npm run build` — if the build passes without `BroadcastChannel is not defined`, the effect is safely deferred. If it fails, add a `if (browser)` guard from `$app/environment`.

2. **Which `SpectatorChooser.svelte` insertion point for the Cast row?**
   - What we know: UI-SPEC.md specifies "add Cast row below existing two options in the chooser menu." The existing `SpectatorChooser.svelte` structure was not inspected in this research.
   - What's unclear: Exact component structure and prop interface.
   - Recommendation: Executor reads `SpectatorChooser.svelte` at task time; follows the existing button pattern (matching `.chooser-action-btn` styling per UI-SPEC.md).

3. **`@types/chrome` transitive dependency: is it already present?**
   - What we know: `@types/chromecast-caf-sender` depends on `@types/chrome`. Current `package.json` does not list it explicitly.
   - What's unclear: Whether it is already installed as a transitive dep of something else.
   - Recommendation: Check `node_modules/@types/chrome` after `npm install -D @types/chromecast-caf-sender`. If absent, add `npm install -D @types/chrome` to the install task.

---

## Sources

### Primary (HIGH confidence)
- `src/routes/+layout.ts` — confirmed `prerender = true; ssr = false` [VERIFIED: codebase read]
- `src/routes/display/+page.svelte` — confirmed no `+page.js` file exists; receiver SDK not yet loaded [VERIFIED: codebase read]
- `src/lib/sync-constants.ts` — confirmed constants `BC_CHANNEL`, `BC_RECORD_CHANNEL`, `LS_SNAPSHOT`, `MSG_PAUSE_TICK`; `CAST_NS` must be added [VERIFIED: codebase read]
- `src/stores/match.svelte.ts` dispatch() seam (lines 107–120) — confirmed two existing `try/catch` publish blocks [VERIFIED: codebase read]
- `src/stores/display.svelte.ts` — confirmed `isValidMatchState()` and `connect()` structure; `receiveSnapshot()` does not yet exist [VERIFIED: codebase read]
- `vite.config.ts` — confirmed `navigateFallback: base + '/404.html'` with no `navigateFallbackDenylist`; confirmed Workbox `globPatterns` [VERIFIED: codebase read]
- `npm view @types/chromecast-caf-sender` — `1.0.11` latest, DefinitelyTyped, ~44k weekly downloads, published Nov 2024 [VERIFIED: npm registry]
- `npm view @types/chromecast-caf-receiver` — `6.0.26` latest, DefinitelyTyped, ~20k weekly downloads, published Apr 2026 [VERIFIED: npm registry]
- Package legitimacy gate via gsd-tools — both `@types` packages verdict: OK [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` — exact seams, 8-step build order, message schema, patterns — grounded in actual codebase source (read during prior research session)
- `.planning/research/PITFALLS.md` — 12 documented pitfalls from official Google Cast docs + community cross-check
- `.planning/research/STACK.md` — CDN SDK URLs, tsconfig scoping approach
- `.planning/research/FEATURES.md` — Cast Design Checklist mapping, receiver screen states, N/A determinations
- `.planning/phases/07-chromecast-integration/07-UI-SPEC.md` — Cast status UI placement, overscan margins, resume toast contract, RECV-05 transition details
- Google Cast CAF v3 docs — `developers.google.com/cast/docs/web_receiver/core_features` — `start()` ordering, `disableIdleTimeout`, custom message listener
- Google Cast Sender integration guide — `developers.google.com/cast/docs/web_sender/integrate` — `__onGCastApiAvailable`, `?loadCastFramework=1`, `autoJoinPolicy`

### Tertiary (LOW confidence)
- `tsconfig.receiver.json` scoping approach — standard pattern, not officially documented by Google Cast for this specific use case

---

## Metadata

**Confidence breakdown:**
- D-04 resolution (prerender mechanics): HIGH — confirmed by codebase file inspection; ASSUMED on per-route override semantics (A1)
- Standard stack (@types versions): HIGH — confirmed via npm registry
- Architecture patterns: HIGH — grounded in ARCHITECTURE.md which read the actual codebase
- Pitfalls: MEDIUM — official Google Cast docs; real-device edge cases (Android background) remain LOW
- Validation architecture: HIGH — maps to actual existing test framework in vite.config.ts

**Research date:** 2026-06-18
**Valid until:** 2026-08-18 (30 days — Google Cast docs are stable; CAF SDK versioning changes infrequently)
