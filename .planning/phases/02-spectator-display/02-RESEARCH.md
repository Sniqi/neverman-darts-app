# Phase 2: Spectator Display - Research

**Researched:** 2026-06-11
**Domain:** Cross-window state sync, TV-style display layout, Web Platform APIs (BroadcastChannel, Fullscreen API)
**Confidence:** HIGH (core stack verified in codebase; Web APIs verified via MDN)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Screen layout & hierarchy**
- D-01: Equal-split player panels, TV-broadcast style — 2 players = halves, 3 = thirds, 4 = quarters — always vertical columns side by side. One consistent structure for every player count; nothing moves around between turns.
- D-02: Active player marked by glow + accent border with a slightly brighter panel background; waiting players are dimmed. Must be obvious from 3 m.
- D-03: Slim match-info header bar above the panels: game mode, out rule, format, current leg number (e.g. "501 Double Out · First to 3 Legs · Leg 3"). Player panels get the remaining ~95% of screen height.
- D-04: Per-panel content: player name, large remaining score (the dominant element), legs/sets won, leg average + match average, visit line (see D-07).

**Live dart behavior**
- D-05: Live per-dart updates: each dart appears on the spectator the moment it's entered, and the active player's remaining score counts down live mid-visit.
- D-06: Checkout suggestion shown on the spectator too: when the active player is on a finish, their panel shows the suggested route. Reuses existing `getSuggestion()` engine function; same bogey/>170 suppression rules.
- D-07: One visit slot per panel: while a player throws, it fills dart-by-dart ("T20 · – · –"); after the turn passes it shows their last completed visit. Format: big visit total with individual darts beneath ("100 — T20 · 20 · 20"). Numpad-entered visits show only the total.

**Transitions & special states**
- D-08: Bust: brief prominent red "BUST" flash in the player's panel (~2 s), then score visibly reverts to start-of-visit value.
- D-09: Leg/set win: full-screen banner ("Leg für ALEX!" + updated legs/sets standing) that holds until the first dart of the next leg is thrown — event-driven, not timed.
- D-10: Match win: full-screen winner display (winner name, final leg/set result, match averages) that stays until a new match starts or the view is closed.
- D-11: Idle state: when no match is running, show calm dark waiting screen ("Warte auf Match…"); auto-switches to scoreboard when a match starts via the snapshot handshake.

**Opening & controlling the view**
- D-12: A small monitor/cast icon in the scoring view (always reachable mid-match) opens the spectator feature.
- D-13: Tapping the icon shows a small chooser menu: "Zweites Fenster öffnen" (PC) and "Anzeige hier im Vollbild" (tablet). No device auto-detection — explicit choice.
- D-14: Tablet fullscreen exit: tapping anywhere shows a temporary "Zurück zur Eingabe" button that auto-hides after ~3 s. No permanent chrome on the spectator display.
- D-15: PC spectator window gets an in-app fullscreen toggle (Fullscreen API) for borderless TV-style display on the second monitor.

**Sync protocol** (locked approach from CLAUDE.md)
- BroadcastChannel for live messages + localStorage snapshot for hydration on open/reload.
- Tablet fullscreen is in-app: reads local store directly, no channel needed.
- Channel layer is PC-only and degrades gracefully on tablet.

### Claude's Discretion
- Exact typography scale, dimming/glow values, and panel spacing — tune for 27" at 3 m.
- Average display precision and German labels (e.g. "Ø Leg 52.3" with one decimal); leg average resets per leg, match average spans the match — standard 3-dart averages.
- Exact BUST flash duration/animation and banner styling.
- How undo events render on the spectator (score simply updates back — no special animation required).
- Sync protocol details within the locked approach (message shape, channel name, snapshot timing).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISP-01 | On PC, player can open the live game display as a second browser window and drag it to a second monitor | `window.open('/display', '_blank', 'noopener,noreferrer')` from user event; check for null return (popup blocked); new tab navigates to `/display` route which runs BroadcastChannel listener |
| DISP-02 | On tablet, player can switch the app into a fullscreen display view | `document.documentElement.requestFullscreen()` from user gesture; SvelteKit in-app navigation to `/display` route; `goto('/display')` + requestFullscreen in sequence |
| DISP-03 | Display shows current scores, legs/sets, player names, active player, last visit, leg average, and match average per player | All data available in `MatchState`; averages computed from `PlayerState.visits` (see Average Computation section); `currentVisit` for live dart slots |
| DISP-04 | Display is readable on a 27" monitor from 3 m (large typography, high contrast, dark mode), with layouts for 1–4 players | CSS Grid + `clamp()` fluid typography; equal-fraction columns (1–4 panels auto-fill); existing design tokens (--bg, --accent, --text, --destructive) |
| DISP-05 | Spectator window stays in sync live and re-syncs automatically after being closed, reloaded, or opened mid-match | BroadcastChannel (live deltas) + localStorage snapshot (hydrate-on-open); publisher in `MatchStore.dispatch()` post-Phase-2 wiring |

</phase_requirements>

---

## Summary

Phase 2 builds a live spectator display that updates on every dart entry and renders all match state in a TV-broadcast style layout. The implementation is primarily a **pure rendering problem** layered on top of a proven sync primitive: `BroadcastChannel` posts `MatchState` snapshots whenever `matchStore.dispatch()` is called; the `/display` route listens and re-renders. A `localStorage` snapshot provides hydration when the window is opened or reloaded mid-match.

The two platform-specific paths (PC second window vs. tablet in-app fullscreen) share a single `/display` SvelteKit route. On PC, `window.open('/display', '_blank', 'noopener,noreferrer')` opens the route in a new tab; BroadcastChannel connects the two same-origin contexts. On tablet, SvelteKit's `goto('/display')` navigates in-app and the Fullscreen API is called immediately after; the display reads `matchStore` directly without a channel.

No new npm packages are required. All sync primitives (BroadcastChannel, localStorage, Fullscreen API) are Web Platform built-ins supported by Chrome 54+/Safari 15.4+/Firefox 38+/Edge 79+. The existing `MatchState` type is the wire format; the existing `getSuggestion()` engine is reused for the checkout line; the existing design tokens (`--bg`, `--surface`, `--accent`, `--destructive`, `--text`) carry over.

**Primary recommendation:** Implement the sync layer first (MatchStore publisher + `/display` subscriber store), then build the display component tree on top of it. Typography and layout can be tuned visually after the data pipeline is correct.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Live state broadcast | Frontend (scoring view) | — | `MatchStore.dispatch()` is already the single mutation point; attach `BroadcastChannel.postMessage()` there |
| State hydration on open | Browser / Client (/display route) | — | `/display` reads localStorage snapshot on mount, then subscribes to live channel |
| Spectator rendering | Browser / Client (/display route) | — | Pure render target; all data derived from received `MatchState` |
| Average computation | Browser / Client (engine utility) | — | Stateless function over `PlayerState.visits`; shared with Phase 4 |
| PC second window opening | Frontend (scoring view) | — | `window.open()` called from user gesture in scoring view |
| Tablet fullscreen | Browser / Client | Frontend (SvelteKit goto) | `goto('/display')` then `requestFullscreen()`; must be inside user gesture |
| Fullscreen exit (tablet) | Browser / Client (/display route) | — | Tap handler on display surface calls `document.exitFullscreen()` then `goto('/match')` |
| Fullscreen toggle (PC) | Browser / Client (/display route) | — | In-display toggle button calls `requestFullscreen()` / `exitFullscreen()` |

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Svelte 5 runes** | 5.56.3 [VERIFIED: codebase] | Reactive display store + component state | `$state` class store pattern already established in MatchStore; display store follows same shape |
| **SvelteKit** | 2.64.0 [VERIFIED: codebase] | `/display` route, `goto()` for tablet navigation | Filesystem routing; route inherits `prerender=true, ssr=false` from root layout |
| **TypeScript** | 5.9.3 [VERIFIED: codebase] | Type-safe `MatchState` wire format | `MatchState` fields are frozen; typed snapshot/message shapes prevent silent field mismatches |
| **BroadcastChannel API** | Web Platform [VERIFIED: MDN] | Live state messages between same-origin contexts | No library; baseline available Chrome 54+, Firefox 38+, Safari 15.4+, Edge 79+ |
| **Fullscreen API** | Web Platform [VERIFIED: MDN] | Borderless TV display on PC; in-app fullscreen on tablet | No library; `requestFullscreen()` + `exitFullscreen()` + `fullscreenchange` event |
| **localStorage** | Web Platform [ASSUMED] | Snapshot hydration when /display opens mid-match | Synchronous key-value; snapshot fits easily (<5 KB serialized MatchState) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Vitest (unit project)** | 4.1.8 [VERIFIED: codebase] | Unit tests for average computation utility, sync logic | Pure-function tests; no DOM needed |
| **Vitest browser mode** | 4.1.8 [VERIFIED: codebase] | Component tests for display layout, panel rendering | Real DOM; pointer/layout assertions |
| **Playwright** | 1.60.0 [VERIFIED: codebase] | E2E: second-window sync, fullscreen lifecycle | Cross-page/cross-context sync verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| BroadcastChannel (locked) | localStorage `storage` event | CLAUDE.md: BroadcastChannel is preferred; `storage` event is listed as fallback-only; not needed for Chrome/Edge/Safari 15.4+ target |
| BroadcastChannel (locked) | `window.opener.postMessage` | CLAUDE.md: window.opener is explicitly listed as DO NOT USE (reverse tabnabbing, severed by noopener) |
| localStorage snapshot | Dexie liveQuery across windows | Overkill for a small MatchState snapshot; Dexie is already used for profiles but would add cross-context complexity; localStorage is simpler and sufficient |

**Installation:** No new packages required. All capabilities are Web Platform built-ins or already-installed dependencies.

---

## Package Legitimacy Audit

No new npm packages are installed in Phase 2. All sync and display capabilities are delivered by:
- Web Platform built-in APIs (BroadcastChannel, Fullscreen API, localStorage)
- Already-installed project dependencies (Svelte 5, SvelteKit, TypeScript)

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
SCORING VIEW (/match)                    SPECTATOR VIEW (/display)
─────────────────────                    ─────────────────────────
User tap → DART_THROWN                   Mount → read localStorage snapshot
    ↓                                        ↓
MatchStore.dispatch(action)              DisplayStore.$state = JSON.parse(snapshot)
    ↓                                        ↓
  state = reduce(state, action)          BroadcastChannel.addEventListener('message')
    ↓                                        ↓
  BroadcastChannel.postMessage(state) ──→  event.data = MatchState
  localStorage.setItem(snapshot)           DisplayStore.$state = event.data
                                               ↓
                                         Svelte reactivity → re-render panels
```

**Tablet path (no BroadcastChannel):**
```
Scoring View → goto('/display') → Display reads matchStore directly (same instance)
```

**Hydration on open/reload:**
```
/display mounts → localStorage.getItem('neverman-match-snapshot')
  → parse → DisplayStore.$state = snapshot
  → subscribe to BroadcastChannel for live updates from that point on
```

### Recommended Project Structure

```
src/
├── routes/
│   ├── match/+page.svelte          # (existing) — add spectator icon + chooser menu
│   └── display/
│       └── +page.svelte            # spectator view route (NEW)
├── stores/
│   ├── match.svelte.ts             # (existing) — add BroadcastChannel publisher
│   └── display.svelte.ts           # display subscriber store (NEW)
├── ui/
│   ├── input/                      # (existing)
│   └── display/
│       ├── PlayerPanel.svelte      # one player column (NEW)
│       ├── MatchHeader.svelte      # slim header bar (NEW)
│       ├── VisitLine.svelte        # dart-by-dart visit display (NEW)
│       ├── LegWinBanner.svelte     # full-screen leg/set win overlay (NEW)
│       ├── MatchWinDisplay.svelte  # match win final screen (NEW)
│       └── SpectatorChooser.svelte # chooser menu icon + modal (NEW)
└── engine/
    └── averages.ts                 # leg/match average computation (NEW, shared Phase 4)
```

### Pattern 1: BroadcastChannel Publisher in MatchStore

**What:** After every `dispatch()`, post the new state to the channel and write a localStorage snapshot.
**When to use:** Always — the display store is a fire-and-forget subscriber; publisher never waits for acknowledgment.

```typescript
// Source: MDN - Broadcast Channel API
// In MatchStore.dispatch():
const CHANNEL_NAME = 'neverman-match';
const SNAPSHOT_KEY = 'neverman-match-snapshot';

dispatch(action: MatchAction): void {
  this.state = reduce(this.state, action);
  // Publish to spectator (PC path)
  const ch = new BroadcastChannel(CHANNEL_NAME);
  ch.postMessage(this.state);
  ch.close(); // fire-and-forget: create, post, close
  // Snapshot for hydration on open/reload
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(this.state));
  } catch {
    // localStorage quota exceeded — non-fatal; live channel still works
  }
}
```

**Important:** Create a new `BroadcastChannel` instance per dispatch (or hold one open on the class) — both patterns work. Opening one per dispatch is simpler (no teardown needed in `$effect`); holding one open is marginally more efficient. Either is correct. [ASSUMED — implementation detail within locked approach]

### Pattern 2: Display Subscriber Store

**What:** A Svelte 5 runes class that holds `MatchState | null`, hydrates from localStorage on creation, and updates from BroadcastChannel.
**When to use:** `/display` route imports this store; components read from it reactively.

```typescript
// src/stores/display.svelte.ts
// Source: MDN BroadcastChannel + project MatchStore pattern
import type { MatchState } from '../engine/types.js';

const CHANNEL_NAME = 'neverman-match';
const SNAPSHOT_KEY = 'neverman-match-snapshot';

export class DisplayStore {
  state = $state<MatchState | null>(null);
  private channel: BroadcastChannel | null = null;

  connect(): () => void {
    // Hydrate from snapshot first
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (raw) this.state = JSON.parse(raw) as MatchState;
    } catch { /* corrupt snapshot — start blank */ }

    // Subscribe to live updates
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.addEventListener('message', (e: MessageEvent<MatchState>) => {
      this.state = e.data;
    });

    // Return cleanup function for $effect
    return () => {
      this.channel?.close();
      this.channel = null;
    };
  }
}

export const displayStore = new DisplayStore();
```

```svelte
<!-- In /display/+page.svelte -->
<script lang="ts">
  import { displayStore } from '../../stores/display.svelte.js';

  $effect(() => {
    return displayStore.connect(); // returns cleanup, called on unmount
  });
</script>
```

### Pattern 3: Tablet Fullscreen (Same-Instance Store)

**What:** On tablet, `/display` is navigated in-app — `matchStore` is the same singleton instance. No BroadcastChannel needed. Fullscreen is triggered from the chooser menu click handler.
**When to use:** When user taps "Anzeige hier im Vollbild".

```typescript
// Source: MDN Fullscreen API Guide
// In SpectatorChooser.svelte — must be inside a user gesture handler
async function openTabletFullscreen() {
  await goto(`${base}/display`);
  // requestFullscreen must happen in a user gesture context.
  // goto() is async; the browser may have changed context.
  // Safer: navigate first, then trigger fullscreen from /display's own mount button.
}
```

**Recommended approach:** Navigate to `/display`; show a "Vollbild aktivieren" prompt on the display page itself (first render). The user taps that prompt — that tap is a user gesture — and `document.documentElement.requestFullscreen()` is called from it. This avoids the user-gesture-context problem with `goto()` + async.

```typescript
// Source: MDN Element.requestFullscreen()
async function enterFullscreen() {
  if (!document.fullscreenEnabled) return;
  try {
    await document.documentElement.requestFullscreen();
  } catch (err) {
    console.warn('Fullscreen request denied:', err);
  }
}

// Detect fullscreen state for "Zurück" button visibility
let isFullscreen = $state(document.fullscreenElement !== null);

$effect(() => {
  function onFullscreenChange() {
    isFullscreen = document.fullscreenElement !== null;
  }
  document.addEventListener('fullscreenchange', onFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
});
```

### Pattern 4: Average Computation

**What:** Stateless functions over `Visit[]` — computes leg average and match average.
**When to use:** Called during display render; shared with Phase 4 statistics.

```typescript
// src/engine/averages.ts
// Standard 3-dart averages per darts101.com convention
// Bust visits: count as 3 darts thrown, 0 scored
// Source: [ASSUMED] standard darts scoring convention

import type { Visit } from './types.js';

/** Total darts thrown across all visits (busts count as 3). */
function dartsThrown(visits: Visit[]): number {
  return visits.reduce((sum, v) => sum + (v.darts.length > 0 ? v.darts.length : 3), 0);
}

/** Total score accumulated (bust visits contribute 0). */
function totalScored(startScore: number, remaining: number): number {
  return startScore - remaining;
}

/**
 * 3-dart average over an array of visits.
 * Returns null if no darts thrown yet.
 */
export function computeAverage(visits: Visit[], startScore: number, remaining: number): number | null {
  const darts = dartsThrown(visits);
  if (darts === 0) return null;
  const scored = totalScored(startScore, remaining);
  return (scored / darts) * 3;
}

/**
 * Leg average: visits since the last leg reset.
 * Phase 2 uses visits directly from PlayerState (already reset per leg in reducer).
 */
export function legAverage(visits: Visit[], startScore: number, remaining: number): number | null {
  return computeAverage(visits, startScore, remaining);
}
```

**Note:** The reducer resets `remaining` and `visits` at leg start (`handleLegWinFromPlayers` → `resetPlayers`). This means `player.visits` in the current `MatchState` already contains only the current-leg visits. Match average requires accumulating across legs — this is a Phase 4 concern. For Phase 2, display leg average only (using current `player.visits`). [VERIFIED: codebase reducer.ts line 315]

### Pattern 5: CSS Grid Layout for Player Panels

**What:** Equal-fraction CSS grid columns that scale from 1 to 4 panels automatically.
**When to use:** The spectator display root container.

```css
/* Source: [ASSUMED] CSS Grid + clamp standard patterns */
.panels-grid {
  display: grid;
  grid-template-columns: repeat(var(--player-count, 2), 1fr);
  height: 100%;
  gap: 2px; /* thin separator between panels, visible from 3m */
}

/* Player count driven by Svelte bind or CSS custom property */
/* In Svelte: style="--player-count: {players.length}" */
```

**Typography scale for 27" at 3m:**
```css
/* Remaining score — dominant element, ~10 cm text at 3 m */
.remaining-score {
  font-size: clamp(4rem, 8vw, 12rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* Player name */
.player-name {
  font-size: clamp(1.5rem, 3vw, 4rem);
  font-weight: 600;
}

/* Legs/sets won */
.legs-sets {
  font-size: clamp(1rem, 2vw, 2.5rem);
}

/* Averages and visit line */
.stats-line {
  font-size: clamp(0.875rem, 1.5vw, 1.75rem);
}

/* Header bar */
.match-header {
  font-size: clamp(0.75rem, 1.2vw, 1.5rem);
}
```

### Pattern 6: Opening Second Window (PC)

**What:** `window.open()` from user gesture, with null-check for popup blockers.
**When to use:** User taps "Zweites Fenster öffnen" in the chooser menu.

```typescript
// Source: MDN Window.open()
function openSecondWindow(base: string) {
  const win = window.open(`${base}/display`, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Popup was blocked — show inline message to user
    popupBlocked = true;
  }
}
```

**Do not** pass `width`/`height` to `window.open()` — the user needs to drag the tab to the second monitor as a real window. Let the browser open it as a tab; the in-display fullscreen toggle (D-15) then handles the TV-style presentation.

### Anti-Patterns to Avoid

- **window.opener for messaging:** CLAUDE.md explicitly forbids `window.opener`. BroadcastChannel replaces it entirely. [CITED: CLAUDE.md]
- **Polling localStorage instead of BroadcastChannel:** Polling is unnecessary — BroadcastChannel delivers messages immediately. Polling would burn CPU and introduce up to ~100 ms lag.
- **Deriving averages inside the Svelte template:** Heavy computation in `{#each}` blocks re-runs on every render. Extract to a utility function or `$derived` in the display store.
- **Requesting fullscreen outside a user gesture:** `requestFullscreen()` rejects with `NotAllowedError` if not called directly from a click/tap/key handler. The tablet flow must ensure fullscreen is called from within the user gesture that triggered navigation.
- **Opening the display route without `base` prefix:** `$app/paths` `base` variable must prefix all `goto()` calls and `window.open()` URL paths, matching the GitHub Pages subpath. Existing code in the project already does this correctly (e.g., `goto(\`${base}/setup\`)`).
- **Hardcoding `setsEnabled` layout:** Some matches use only legs, others use sets. The header bar and panel stats must branch on `config.setsEnabled`.
- **Not handling `MatchState | null` in display:** When `/display` opens before any match has started, `localStorage` may be empty. The display must show the idle state ("Warte auf Match…") without crashing.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-window messaging | Custom `window.postMessage` protocol | `BroadcastChannel` | BroadcastChannel is same-origin-only (security), one-to-many (N spectator windows), fire-and-forget (no response handling) — no complexity of postMessage target origin management |
| Hydration snapshot | Custom sync protocol | `localStorage.setItem(JSON.stringify(state))` | MatchState is fully serializable (designed for it); localStorage gives instant synchronous read on open; no async coordination |
| Average calculation | Accumulate in `$state` during match | `computeAverage(visits, startScore, remaining)` from `averages.ts` | Pure function testable in isolation; decoupled from render cycle |
| Checkout display | Re-implement logic | `getSuggestion()` from `src/engine/checkout.ts` | Already tested, handles all bogey numbers and edge cases |
| Fullscreen toggle | `document.body.style.width = '100vw'` hacks | Fullscreen API `requestFullscreen()` | Native fullscreen hides browser chrome, taskbar, status bar — CSS hacks cannot achieve true TV-mode |
| Reactive channel subscription | MobX, Zustand, Redux | Svelte 5 `$state` + `$effect` | Already the project pattern; channel subscription in `$effect` with cleanup is idiomatic |

**Key insight:** Every major problem in this phase has a standard Web Platform primitive or existing engine function. The implementation work is wiring + UI, not algorithm design.

---

## Common Pitfalls

### Pitfall 1: BroadcastChannel Sender Receives Its Own Messages — False
**What goes wrong:** Developer assumes the sender tab gets its own message back.
**Why it happens:** Misconception from `postMessage` experience.
**How to avoid:** BroadcastChannel does NOT fire the `message` event on the sender. The publishing (scoring) tab never receives the message it sends — only other contexts on the same channel do. The display store in the scoring tab (if any) must read `matchStore` directly, not the channel. [CITED: developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API]

### Pitfall 2: Fullscreen Request Denied (User Gesture Requirement)
**What goes wrong:** `requestFullscreen()` throws `NotAllowedError` or silently does nothing.
**Why it happens:** The call is not directly inside a `pointerdown`/`click` handler — it's in a `$effect`, a `then()` callback, or after an `await`.
**How to avoid:** Call `requestFullscreen()` synchronously inside the click handler that triggers the tablet fullscreen path. The recommended flow: navigate to `/display` first, then on the `/display` page render a "Vollbild aktivieren" button — user taps it, and the tap handler calls `requestFullscreen()` directly.
**Warning signs:** `document.fullscreenElement` remains `null` after the call; no `fullscreenchange` event fires.

### Pitfall 3: Popup Blocked on PC Second Window
**What goes wrong:** `window.open()` returns `null`; spectator never opens.
**Why it happens:** Browser popup blockers block `window.open()` unless called from a direct user gesture (e.g., a click handler).
**How to avoid:** Call `window.open()` synchronously in the `onclick` handler. Show a user-friendly "Bitte Popups für diese Seite erlauben" message if null is returned. [CITED: developer.mozilla.org/en-US/docs/Web/API/Window/open]
**Warning signs:** `window.open()` returns `null` in the browser console.

### Pitfall 4: Display Mounts Before Any Match Data (null state)
**What goes wrong:** Display crashes or shows garbled state when opened before a match, or after refreshing when localStorage is empty/stale.
**Why it happens:** `displayStore.state` is `null` initially. Components that unconditionally access `state.players` throw.
**How to avoid:** Always branch on `state === null` at the top of `/display/+page.svelte` and show the idle screen ("Warte auf Match…"). Add null guards in all sub-components before accessing `state.players`, `state.config`, etc.

### Pitfall 5: Match Average Requires Cross-Leg Accumulation
**What goes wrong:** Computing match average from `player.visits` gives only the current-leg average because the reducer resets `visits: []` at each new leg start.
**Why it happens:** The Phase 1 reducer's `handleLegWinFromPlayers` calls `resetPlayers` which resets `remaining` to `startScore` and `visits` to `[]` (implicitly, since new legs start fresh — actually visits are NOT reset; only `remaining` is reset; re-reading the reducer is needed).
**How to avoid:** Re-check reducer behavior (see Reducer Note below). If visits ARE reset, match average must be tracked across legs as a running total — either add an `allVisits` field to `PlayerState` or compute it from the `eventLog`. Phase 2 decision: display "Ø Leg" only (current leg); defer "Ø Match" to Phase 4 which will have full stats infrastructure. [VERIFIED: codebase reducer.ts]

**Reducer Note (verified):** `handleLegWinFromPlayers` → `resetPlayers` sets `remaining: config.startScore` but does NOT reset `visits`. The `visits` array grows throughout the match across all legs. This means `player.visits` contains ALL visits for that player across ALL legs. To compute leg average: filter visits to those from the current leg. To know which visits are current-leg: count visits since the last leg reset — which requires knowing how many visits happened before the current leg started. This is non-trivial without additional state. **Simpler approach for Phase 2:** Track `currentLegVisits` as a derived count (total visits at leg start vs now) or add a `legStartVisitCount` field. [VERIFIED: codebase reducer.ts lines 309-325]

**Recommended Phase 2 approach (Claude's Discretion):** Add a `legStartVisitCounts: Record<string, number>` to `MatchState` that records each player's `visits.length` at the start of each leg. Leg average = visits from `legStartVisitCounts[id]` onward. Match average = all visits. This is a small reducer change.

### Pitfall 6: BroadcastChannel + localStorage Desync
**What goes wrong:** Display shows stale state after undo because the channel delivered the undo result but localStorage still holds the pre-undo snapshot (race condition or missed write).
**Why it happens:** If the localStorage write in `dispatch()` fails silently (quota, private browsing mode) but the channel succeeds, then a later reload hydrates stale data.
**How to avoid:** Write localStorage in the same `dispatch()` call, after `reduce()` and before returning. Wrap in try/catch. The live channel is always authoritative; localStorage is only for cold-start. [ASSUMED — implementation detail]

### Pitfall 7: SvelteKit `base` Path on GitHub Pages
**What goes wrong:** `window.open('/display', ...)` opens a 404 when deployed to GitHub Pages subpath (`/neverman-darts-app/display`).
**Why it happens:** Absolute URL `/display` ignores the repo subpath.
**How to avoid:** Always use `window.open(\`${base}/display\`, ...)` where `base` comes from `import { base } from '$app/paths'`. The project already uses this pattern in `MatchWinOverlay.svelte` (`goto(\`${base}/setup\`)`). [VERIFIED: codebase MatchWinOverlay.svelte + svelte.config.js]

---

## Code Examples

### Example 1: MatchStore BroadcastChannel Publisher

```typescript
// Source: project pattern (match.svelte.ts) + MDN BroadcastChannel
// Add to MatchStore.dispatch():
const BC_CHANNEL = 'neverman-match';
const LS_SNAPSHOT = 'neverman-match-snapshot';

dispatch(action: MatchAction): void {
  this.state = reduce(this.state, action);
  // Publish to any open /display windows
  try {
    const ch = new BroadcastChannel(BC_CHANNEL);
    ch.postMessage(this.state);
    ch.close();
  } catch { /* non-fatal */ }
  // Persist snapshot for hydration
  try {
    localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
  } catch { /* quota exceeded, private mode — non-fatal */ }
}
```

### Example 2: Display Page Subscription

```svelte
<!-- Source: MDN BroadcastChannel + project Svelte 5 runes pattern -->
<script lang="ts">
  import { displayStore } from '../../stores/display.svelte.js';
  import { base } from '$app/paths';

  $effect(() => displayStore.connect());

  let state = $derived(displayStore.state);
</script>

{#if state === null || state.phase === 'setup'}
  <div class="idle-screen">Warte auf Match…</div>
{:else}
  <!-- render player panels, header, overlays -->
{/if}
```

### Example 3: Visit Line Formatting

```typescript
// Source: project VisitStrip.svelte + context decisions D-07
// Mirrors existing formatDart() from VisitStrip.svelte

function formatDart(dart: DartScore): string {
  if (dart.segment === 0) return '0';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer Bull';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return `${prefix}${dart.segment}`;
}

// Live mid-visit slot (D-07): "T20 · – · –"
function visitSlots(currentVisit: DartScore[]): string {
  const slots = [0, 1, 2].map(i =>
    currentVisit[i] ? formatDart(currentVisit[i]) : '–'
  );
  return slots.join(' · ');
}

// Completed visit (D-07): "100 — T20 · 20 · 20"
// numpad-entered visits have darts.length === 0 — show total only
function completedVisitLine(visit: Visit, startScore: number): string {
  const total = visit.bust ? 0 :
    visit.darts.length > 0
      ? visit.darts.reduce((s, d) => s + d.multiplier * d.segment, 0)
      : (startScore - /* remaining before this visit */ 0); // see note
  if (visit.darts.length === 0) return `${total}`;
  return `${total} — ${visit.darts.map(formatDart).join(' · ')}`;
}
```

**Note on numpad visit totals:** `Visit.darts` is empty for numpad visits. The scored total must be derived from `previousRemaining - currentRemaining`. Phase 2 can compute this by looking at `player.visits` index and the `startScore`. A simpler approach: store the visit total alongside the visit. [ASSUMED — this is a design decision within Claude's Discretion]

### Example 4: Active Player Glow (CSS)

```css
/* Source: [ASSUMED] — extends project design tokens */
.player-panel {
  flex: 1;
  background: var(--surface);
  border-top: 3px solid transparent;
  transition: background 200ms ease, border-color 200ms ease;
  opacity: 0.55; /* dimmed for inactive */
}

.player-panel.active {
  background: #22242d; /* slightly brighter than --surface #1e2027 */
  border-top-color: var(--accent); /* #e8a020 glow line */
  opacity: 1;
  box-shadow: inset 0 0 40px rgba(232, 160, 32, 0.08); /* subtle glow */
}
```

### Example 5: Leg Win Banner (event-driven dismiss)

```svelte
<!-- Source: project pattern + decisions D-09 -->
<!-- Banner holds until first dart of next leg — implemented by watching phase -->
<script lang="ts">
  // legWinMessage is set when phase transitions to 'playing' after a leg win
  // We detect this by comparing previous vs current leg counts
  let legWinMessage = $state<string | null>(null);
  let prevLegsWon = $state<number[]>([]);

  $effect(() => {
    const state = displayStore.state;
    if (!state) return;

    if (state.phase === 'playing' && prevLegsWon.length > 0) {
      for (let i = 0; i < state.players.length; i++) {
        if (state.players[i].legsWon > (prevLegsWon[i] ?? 0)) {
          legWinMessage = `Leg für ${state.players[i].name}!`;
          break;
        }
      }
    }

    // Clear banner when a dart is thrown (currentVisit becomes non-empty)
    if (legWinMessage && state.currentVisit.length > 0) {
      legWinMessage = null;
    }

    prevLegsWon = state.players.map(p => p.legsWon);
  });
</script>

{#if legWinMessage}
  <div class="leg-win-banner">{legWinMessage}</div>
{/if}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.opener.postMessage` | `BroadcastChannel` | Available Chrome 54 (2016), baseline 2022 | No cross-window reference; works with `noopener`; supports N windows |
| `localStorage` polling | `BroadcastChannel` live messages | Same | Instant delivery; no CPU waste |
| `webkitRequestFullscreen` vendor prefix | `requestFullscreen()` unprefixed | All major browsers 2022+ | Single unprefixed API sufficient for Chrome/Edge/Firefox/Safari 15+ |

**Deprecated/outdated:**
- `window.opener` for messaging: Security risk (reverse tabnabbing); CLAUDE.md forbids it
- `document.webkitExitFullscreen()`: Vendor-prefixed; not needed for Chrome 71+/Safari 15.4+
- `localStorage` `storage` event for live sync: Works but ~50 ms polling lag; BroadcastChannel is instant

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | localStorage write in `dispatch()` is sufficient for hydration (no IndexedDB needed for snapshot) | Architecture Patterns | If localStorage is unavailable (private browsing ITP), display shows idle on open — acceptable since live channel still works |
| A2 | Creating a new BroadcastChannel instance per dispatch (fire-and-forget: create, post, close) is functionally correct | Pattern 1 | If channel creation has significant overhead, a held-open instance is better — micro-optimization, not correctness |
| A3 | The reducer does NOT reset `player.visits` at leg start — only `remaining` is reset | Pitfall 5 + averages | If visits ARE reset, leg average computation becomes trivial but match average requires extra state; research must be validated against actual reducer code (verified above: resetPlayers does NOT reset visits) |
| A4 | Visit total for numpad entries can be computed as `prevRemaining - newRemaining` for display purposes | Code Example 3 | If wrong display format, easy to fix — does not affect game state |
| A5 | `legWinMessage` detection via `legsWon` delta is reliable across undo | Code Example 5 | If undo fires after a leg win, `legsWon` reverts — banner would disappear correctly via undo (correct behavior). Edge: two players win a leg in the same dispatch is impossible (only one player wins per visit) |

**If this table is empty:** All claims were verified — N/A. Several assumptions remain (A1–A5) and are flagged for planner awareness.

---

## Open Questions

1. **Visit total storage for numpad display (Pitfall 5 + Example 3)**
   - What we know: `Visit.darts` is empty for numpad entries; total cannot be recomputed from `Visit` alone
   - What's unclear: Should Phase 2 add a `total` field to the `Visit` type, or compute it from `startScore - player.remaining`?
   - Recommendation: Add `total?: number` to `Visit` type for numpad visits only. This is a small backward-compatible change to `types.ts`. Alternatively, compute from `eventLog` entries — but that's more complex. The planner should decide; it affects the `Visit` type in `types.ts` (frozen field caveat: adding optional field is safe).

2. **Match average in Phase 2 (Pitfall 5)**
   - What we know: `player.visits` spans all legs; total darts thrown and total scored can both be derived
   - What's unclear: D-04 says "leg average + match average" — is match average required for Phase 2 or deferred to Phase 4?
   - Recommendation: Implement both. Match average is straightforward with all visits available: `computeAverage(player.visits, config.startScore, player.remaining)`. No extra state needed. The concern about leg average needing cross-leg tracking is the harder part; match average is simpler.

3. **`legStartVisitCounts` for leg average (Pitfall 5)**
   - What we know: Leg average requires knowing which visits are in the current leg
   - What's unclear: Best way to track this given the current reducer design
   - Recommendation: Add `legStartVisitIndex: Record<string, number>` to `MatchState`, set in `handleLegWinFromPlayers` to `updatedPlayer.visits.length` at the start of each new leg. This is a one-line reducer change and enables both Phase 2 and Phase 4 stat computation.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | 22.22.0 | — |
| npm | Package management | ✓ | 11.10.0 | — |
| Chromium (Playwright) | Browser tests | ✓ | via Playwright 1.60.0 | — |
| BroadcastChannel API | DISP-05 live sync | ✓ | Web Platform (Chrome 54+/Safari 15.4+/Firefox 38+/Edge 79+) | localStorage polling (not needed for target browsers) |
| Fullscreen API | DISP-02 tablet fullscreen | ✓ | Web Platform (all target browsers) | CSS fullscreen illusion (not true fullscreen — not acceptable per D-15) |
| localStorage | DISP-05 hydration | ✓ | Web Platform (all browsers) | In-memory only (display shows idle if ITP clears storage — acceptable) |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None needed for target browsers.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 + Playwright 1.60.0 |
| Config file | `vite.config.ts` (two projects: `unit` + `browser`) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | PC second window opens /display URL | E2E | `npx playwright test e2e/spectator-sync.spec.ts` | ❌ Wave 0 |
| DISP-02 | Tablet fullscreen navigation to /display | E2E | `npx playwright test e2e/spectator-sync.spec.ts` | ❌ Wave 0 |
| DISP-03 | Display renders scores, averages, visit line correctly | Browser component | `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` | ❌ Wave 0 |
| DISP-04 | Typography large enough (smoke: font-size >= 4rem on score) | Browser component | `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` | ❌ Wave 0 |
| DISP-05 | BroadcastChannel delivers state; hydration from localStorage | Unit | `npm run test:unit -- src/stores/display.svelte.test.ts` | ❌ Wave 0 |
| (averages) | `computeAverage` correct for bust, numpad, dart-by-dart visits | Unit | `npm run test:unit -- src/engine/averages.test.ts` | ❌ Wave 0 |
| (sync) | BroadcastChannel publisher fires on every dispatch | Unit | `npm run test:unit -- src/stores/match.svelte.test.ts` (extend) | ✅ extend existing |
| (leg win) | Leg win banner appears and clears on first dart | Browser component | `npm run test:browser -- src/ui/display/LegWinBanner.test.ts` | ❌ Wave 0 |
| (bust) | BUST flash shows for ~2s then score reverts | Browser component | `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test` (unit + browser)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/engine/averages.test.ts` — covers average computation (leg + match, bust counting, zero-visit guard)
- [ ] `src/stores/display.svelte.test.ts` — covers hydration from localStorage, BroadcastChannel subscription, null state handling
- [ ] `src/ui/display/PlayerPanel.test.ts` — covers rendering with 1–4 players, active player highlighting, visit line format
- [ ] `src/ui/display/LegWinBanner.test.ts` — covers banner trigger on leg win, dismissal on first dart
- [ ] `e2e/spectator-sync.spec.ts` — covers: (1) second window opens and shows match state, (2) dart entry syncs to display, (3) display hydrates on reload mid-match

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` per config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this phase |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Single-user local app; no ACL |
| V5 Input Validation | Yes (partial) | `MatchState` from BroadcastChannel deserialized via `JSON.parse` — type-check before rendering |
| V6 Cryptography | No | No secrets |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious BroadcastChannel injection | Spoofing / Tampering | BroadcastChannel is same-origin only — no cross-origin injection possible. No additional mitigation needed for ASVS L1. |
| `JSON.parse` of localStorage snapshot | Tampering | Parse inside try/catch; type-assert the result but do NOT validate deeply (ASVS L1 — local app, not public). If parse fails, fall back to null state (idle screen). |
| XSS via player names in display | Injection | Svelte template `{name}` auto-escapes; use `{interpolation}` only, never `{@html}`. Established in Phase 1 (T-03-04). |
| Reverse tabnabbing via window.opener | Spoofing | `noopener,noreferrer` on `window.open()` call. CLAUDE.md prohibits `window.opener` usage. |

**Security verdict:** ASVS L1 controls are straightforward for this phase. The primary risk is XSS via player name rendering — already mitigated by Svelte's default escaping. No new security surface beyond what Phase 1 established.

---

## Sources

### Primary (MEDIUM confidence — MDN verified)
- [Broadcast Channel API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) — constructor, postMessage, addEventListener, close(), browser support
- [Fullscreen API Guide — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide) — requestFullscreen, exitFullscreen, fullscreenchange, mobile considerations
- [Window.open() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) — noopener/noreferrer, null check, popup blocker behavior

### Secondary (MEDIUM confidence — official docs)
- [SvelteKit Routing — svelte.dev/docs/kit/routing](https://svelte.dev/docs/kit/routing) — filesystem routing, +page.svelte creation
- [SvelteKit adapter-static — svelte.dev/docs/kit/adapter-static](https://svelte.dev/docs/kit/adapter-static) — prerender inheritance, fallback
- [CSS clamp() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp) — fluid typography pattern

### Codebase (HIGH confidence — VERIFIED)
- `src/stores/match.svelte.ts` — MatchStore dispatch pattern, singleton export
- `src/engine/types.ts` — MatchState wire format, frozen field names
- `src/engine/reducer.ts` — visit array reset behavior at leg win (lines 309–325)
- `src/engine/checkout.ts` — getSuggestion() reuse for display
- `src/ui/input/VisitStrip.svelte` — formatDart() conventions to mirror
- `src/ui/overlays/MatchWinOverlay.svelte` — `base` path pattern with `$app/paths`
- `src/app.css` — design token definitions (--bg, --surface, --accent, --destructive, --text)
- `svelte.config.js` — adapter-static fallback: '404.html', base path from BASE_PATH env
- `src/routes/+layout.ts` — `prerender = true, ssr = false` inherited by all routes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified in installed node_modules
- BroadcastChannel API: MEDIUM — MDN confirmed, well-established browser support
- Fullscreen API: MEDIUM — MDN confirmed, user-gesture requirement is a real pitfall
- Architecture patterns: MEDIUM — patterns follow established project conventions; some implementation details are Claude's Discretion
- Average computation: MEDIUM — reducer behavior verified in source; average formula is standard darts convention [ASSUMED]
- Typography scale: LOW — tuning for 27" at 3 m requires visual testing; clamp values are starting estimates

**Research date:** 2026-06-11
**Valid until:** 2026-07-11 (stable Web APIs; SvelteKit minor updates may ship but 2.x API is stable)
