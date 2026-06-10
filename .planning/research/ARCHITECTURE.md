# Architecture Research

**Domain:** Offline-first touch darts-scoring PWA (X01) with a dual-window spectator display
**Researched:** 2026-06-10
**Confidence:** HIGH (game engine, dartboard geometry, cross-window sync, persistence patterns all map to well-established, verified techniques; MEDIUM only on exact checkout-table completeness, which is a data-population task, not an architecture risk)

## Standard Architecture

The dominant pattern for this class of app is a **layered, offline-first SPA** with a strict separation between a **pure domain core** (game rules + scoring) and the **UI / platform shell**. The domain core is framework-agnostic, synchronous, and exhaustively unit-testable; everything stateful, async, or browser-specific lives in adapter layers around it. State is held in a single in-memory store that is **mirrored to two sinks**: IndexedDB (durable, for recovery + history) and a cross-window broadcast channel (ephemeral, for the spectator view).

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                      PRESENTATION (Input Window)                    │
├───────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Dartboard  │  │ Scoreboard │  │  Checkout  │  │  Match Setup │  │
│  │ (SVG+touch)│  │  / Overlay │  │  Suggestion│  │   / Profiles │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  │
│        │ throw(seg,mul)│ render        │ query          │          │
├────────┴───────────────┴───────────────┴────────────────┴──────────┤
│                      APPLICATION / STATE STORE                      │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │  Match Store (single source of truth, in-memory)           │     │
│  │   dispatch(action) → engine.reduce(state, action) → state' │     │
│  └───────┬───────────────────────┬───────────────────┬────────┘     │
│          │ (pure call)           │ (persist)         │ (broadcast)  │
├──────────┼───────────────────────┼───────────────────┼──────────────┤
│  DOMAIN CORE (pure)   │   PERSISTENCE ADAPTER   │  SYNC ADAPTER      │
│  ┌─────────────────┐  │  ┌───────────────────┐  │  ┌──────────────┐  │
│  │ X01 Engine      │  │  │ IndexedDB         │  │  │ BroadcastCh. │  │
│  │ Checkout Engine │  │  │  (Dexie wrapper)  │  │  │ + last-state │  │
│  │ Stats/Achiev.   │  │  │  events/snapshots │  │  │   in storage │  │
│  └─────────────────┘  │  └───────────────────┘  │  └──────┬───────┘  │
└───────────────────────┴─────────────────────────┴─────────┼──────────┘
                                                             │ messages
                                              ┌──────────────▼───────────┐
                                              │ SPECTATOR WINDOW (read-   │
                                              │ only): rehydrate from     │
                                              │ storage on load, then     │
                                              │ live-update via channel   │
                                              └───────────────────────────┘
        ┌───────────────────────────────────────────────────────────────┐
        │  PWA SHELL: service worker (precache app shell), manifest,      │
        │  base-path handling for GitHub Pages subdirectory deploy        │
        └───────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **X01 Engine** | Pure scoring rules: bust detection, double-out / single-out validation, turn rotation (≤4 players), leg/set progression, bull-off result recording. No I/O. | Pure TS module: `reduce(state, action) → state`. No framework imports. |
| **Checkout Engine** | Given remaining score + darts left + out-mode, return finish path(s). | Precomputed lookup table (170→2 mapping), generated at build time or first run. |
| **Dartboard component** | Render SVG board; translate touch/click coords → `{segment, multiplier}`; provide visual press feedback. | SVG + math hit-test (polar coords), not per-path hit areas. |
| **Match Store** | Single in-memory source of truth; receives actions, calls engine, fans out to persistence + sync. | Framework store (Svelte store / Zustand / Pinia / signal). |
| **Persistence adapter** | Durable write of throw events + periodic snapshots; load on cold start for recovery. | IndexedDB via Dexie; profiles, matches, events, snapshots, achievements stores. |
| **Sync adapter** | Push current state to spectator window; let a reloaded spectator rehydrate. | BroadcastChannel for live + a single "latest state" key in localStorage for rehydration. |
| **Stats / Achievements** | Compute leg/match averages, records, achievements from throw history. | Materialized projections over the event log, incrementally updated. |
| **PWA shell** | Installability + offline; correct paths under `/<repo>/`. | vite-plugin-pwa with `base` set to repo subpath. |

## Recommended Project Structure

```
src/
├── domain/                  # PURE — no DOM, no async, 100% unit-testable
│   ├── x01/
│   │   ├── engine.ts        # reduce(state, action): bust/out/rotation/legs/sets
│   │   ├── rules.ts         # double-out & single-out validation, bust conditions
│   │   ├── types.ts         # MatchState, Player, Leg, Set, Throw, Turn
│   │   └── engine.test.ts   # the bulk of the test suite lives here
│   ├── checkout/
│   │   ├── table.ts         # generated lookup: score → finish path(s)
│   │   ├── suggest.ts       # suggest(remaining, dartsLeft, outMode)
│   │   └── generate.ts      # build-time generator (dev-only)
│   ├── board/
│   │   └── geometry.ts      # hitTest(x,y,center,scale) → {segment, multiplier}
│   └── stats/
│       ├── project.ts       # fold(events) → aggregates (averages, records)
│       └── achievements.ts  # detect new personal records from a completed turn
├── state/
│   ├── matchStore.ts        # in-memory store; dispatch → domain → persist + sync
│   └── actions.ts           # ThrowDart, UndoThrow, NextPlayer, StartLeg, ...
├── persistence/
│   ├── db.ts                # Dexie schema: profiles, matches, events, snapshots
│   ├── repository.ts        # save/load match, append event, write snapshot
│   └── recovery.ts          # on boot: detect in-progress match, rebuild state
├── sync/
│   ├── channel.ts           # BroadcastChannel wrapper (post / subscribe)
│   └── spectatorState.ts    # localStorage "latest" mirror for reload rehydrate
├── ui/
│   ├── input/               # Dartboard, score entry, undo, current-player panel
│   ├── spectator/           # large readable layout (own route/window)
│   ├── setup/               # match config, player profiles, bull-off result entry
│   └── overlays/            # achievement celebration, auto-pause countdown
├── pwa/
│   ├── manifest config      # via vite-plugin-pwa
│   └── sw registration
└── main.ts
```

### Structure Rationale

- **`domain/` is the crown jewel and must stay pure.** No imports from `ui/`, `state/`, `persistence/`, or any browser API. This is what makes X01 rules (busts, double-out, rotation, legs/sets) reliably testable without a DOM. Build it first; everything else depends on it.
- **`board/geometry.ts` sits in `domain/`** because hit-testing is pure math (`{x,y} → {segment,multiplier}`) and deserves the same test rigor as scoring — it is the #1 correctness/UX risk for touch input.
- **`state/` is the only place domain, persistence, and sync meet.** Keeping the fan-out in one store prevents the classic mess of UI components writing to IndexedDB or posting to the channel directly.
- **`spectator/` is a separate route/window that imports the same store in read-only mode.** It never dispatches actions; it only renders received state.

## Architectural Patterns

### Pattern 1: Pure reducer game engine (command → state)

**What:** The entire X01 ruleset is a pure function `reduce(state, action) → newState`. The UI dispatches semantic actions (`ThrowDart{segment, multiplier}`, `UndoThrow`, `NextPlayer`); the engine owns all rules — bust (score < 0, score == 1 in double-out, or finishing on a non-double in double-out), checkout validation, turn rotation, and leg/set advancement.

**When to use:** Always, for this project. The rules are intricate and edge-case-heavy; purity makes them exhaustively unit-testable and makes undo trivial.

**Trade-offs:** Slight ceremony (actions + reducer) vs. ad-hoc mutation. Worth it here. Undo becomes free if you keep the event log (replay-to-N) or store prior states.

**Example:**
```typescript
function reduce(s: MatchState, a: Action): MatchState {
  switch (a.type) {
    case 'THROW_DART': {
      const player = currentPlayer(s);
      const remaining = player.score - a.segment * a.multiplier;
      if (isBust(remaining, a.multiplier, s.outMode))
        return endTurnWithBust(s);          // score reverts to start-of-turn
      if (remaining === 0 && isValidCheckout(a.multiplier, s.outMode))
        return winLeg(s);
      return applyScore(s, remaining, a);    // also advances after 3rd dart
    }
    // UNDO_THROW, NEXT_PLAYER, START_LEG, RECORD_BULLOFF, ...
  }
}
```

### Pattern 2: Polar-coordinate hit-testing (not per-path SVG hit areas)

**What:** Map a touch point to a board region with math, not DOM hit-testing. Translate point to board-center-relative `(dx, dy)`, compute radius `r` and angle, then map angle → segment number via the fixed wheel order and `r` → multiplier via ring radii.

**When to use:** For the touch dartboard. The math approach is more reliable than per-`<path>` hit areas under scaling (browsers have documented SVG path hit-precision bugs under extreme scaling) and lets you add fat-finger tolerance.

**Trade-offs:** You maintain ring-radius constants instead of letting the DOM resolve hits; but you gain accuracy, testability, and easy "snap to nearest segment." Use `getScreenCTM().inverse()` with a `DOMPoint` for the coordinate transform, and set `touch-action: none` to stop scroll/zoom from stealing the gesture.

**Example:**
```typescript
const WHEEL = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
// radii normalized to board radius = 1.0 (multiply by rendered radius)
function hitTest(dx: number, dy: number, R: number) {
  const r = Math.hypot(dx, dy) / R;            // 0..1+
  if (r <= 0.037) return { segment: 25, multiplier: 2 }; // inner bull (50)
  if (r <= 0.094) return { segment: 25, multiplier: 1 }; // outer bull (25)
  if (r > 1.0)    return { segment: 0,  multiplier: 0 };  // miss
  let a = Math.atan2(dx, -dy) * 180 / Math.PI; // 0° at top, clockwise
  if (a < 0) a += 360;
  const seg = WHEEL[Math.floor(((a + 9) % 360) / 18)];   // +9° aligns boundaries
  if (r > 0.582 && r <= 0.629) return { segment: seg, multiplier: 3 }; // triple
  if (r > 0.953 && r <= 1.0)   return { segment: seg, multiplier: 2 }; // double
  return { segment: seg, multiplier: 1 };
}
```
*(Ring fractions are standard BDO/WDF proportions; tune the exact band edges against the rendered SVG. The angle math and wheel order are fixed and verified.)*

### Pattern 3: Persist-to-store + broadcast-the-signal (dual-window sync)

**What:** The input window is the only writer. On every committed state change it (a) appends to IndexedDB, (b) writes the latest renderable state to a single `localStorage` key, and (c) posts a lightweight message over `BroadcastChannel`. The spectator window, on load **or reload**, first reads the `localStorage` key to rehydrate, then subscribes to the channel for live updates.

**When to use:** This exact scenario — a same-origin second window that must survive reloads with no server.

**Trade-offs:** BroadcastChannel is a pipe, not a bucket: it delivers nothing to a window that wasn't open when the message was sent. So a channel-only spectator comes up blank after reload. Backing it with a persisted "latest state" snapshot is what makes reload/re-attach robust. localStorage caps ~5MB and is string-only — fine for a single current-match snapshot; keep history in IndexedDB. (Both APIs are same-origin only and baseline-supported since 2022.)

**Example:**
```typescript
const ch = new BroadcastChannel('darts-match');
function publish(view: SpectatorView) {
  localStorage.setItem('darts:latest', JSON.stringify(view)); // rehydrate source
  ch.postMessage({ type: 'STATE', view });                    // live update
}
// Spectator window:
function boot() {
  const cached = localStorage.getItem('darts:latest');
  if (cached) render(JSON.parse(cached));        // survive reload / re-attach
  ch.onmessage = (e) => { if (e.data.type === 'STATE') render(e.data.view); };
}
```

### Pattern 4: Event log + materialized projections for stats (with snapshots)

**What:** Treat each throw (and turn/leg/set outcome) as an immutable event appended to IndexedDB. Statistics, averages, and achievements are **projections** folded from those events; store them as incrementally-updated materialized views and periodically snapshot the match state so cold-start recovery doesn't replay the whole log.

**When to use:** Recommended here. The log gives free undo, exact in-progress recovery after reload, time-accurate stats, and the ability to add *new* statistics later by recomputing from history — without a server and at trivial storage cost.

**Trade-offs:** Slightly more code than bumping counters in place, and replay can be slow if you never snapshot. Mitigate with (1) incremental projection on each event for O(1) reads, and (2) a snapshot per leg/turn so recovery loads "latest snapshot + last few events." Pure counters-only is simpler but throws away history and makes new stat definitions impossible to backfill — a hard-to-reverse choice.

## Data Flow

### Throw / score flow (write path)

```
[Touch on board]
   → Dartboard.hitTest(x,y) → {segment, multiplier}
   → store.dispatch(ThrowDart)
   → engine.reduce(state, action)            (pure: bust/out/rotation/legs)
        ↓ newState
   ├─ persistence.appendEvent + maybe snapshot   (IndexedDB)
   ├─ stats.project(event)  → update averages/records; emit Achievement?
   ├─ sync.publish(spectatorView)               (localStorage + BroadcastChannel)
   └─ UI re-renders scoreboard + checkout suggestion
```

### Spectator flow (read path)

```
[Spectator window load/reload]
   → read localStorage 'darts:latest' → initial render   (survives reload)
   → BroadcastChannel.onmessage(STATE) → re-render        (live updates)
   (never dispatches actions; pure projection of received view)
```

### Recovery flow (cold start)

```
[App boot]
   → persistence.recovery: any in-progress match?
        yes → load latest snapshot + replay trailing events → rebuild MatchState
        no  → show setup
```

### State Management

```
            dispatch(action)
[UI] ─────────────────────────▶ [Match Store] ──reduce──▶ [Domain Engine]
  ▲                                  │  │  │                    │
  │ subscribe (render)               │  │  └─ sync ─▶ Spectator  │ pure
  └──────────────────────────────────┘  └─ persist ─▶ IndexedDB ◀┘
```

### Key Data Flows

1. **Single-writer, multi-sink:** only the input window mutates state; it fans out to IndexedDB (durable), localStorage+channel (spectator), and the UI. This avoids split-brain between windows.
2. **Derive, don't duplicate:** averages, records, and checkout suggestions are computed from canonical state/events, never stored as independent editable truth.
3. **Rehydrate-then-subscribe:** any window (spectator or a reloaded input window) first restores from a persisted snapshot, then attaches to live updates.

## Scaling Considerations

This is a single-device, single-user-at-a-time, offline app — "scale" means data volume over time and render performance, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single match / casual use | In-memory store + per-leg snapshot is plenty; replay is instant. |
| Years of match history, many profiles | Index IndexedDB stores by `playerId` + date; paginate history UI; keep aggregate stats as stored projections so the stats screen never scans the full event log. |
| Very large event log | Snapshot per leg/match and prune raw events to "archived" only if storage pressure appears (unlikely on tablets/PCs for this use case). |

### Scaling Priorities

1. **First bottleneck:** stats screen recomputing over the entire throw history → fix with stored, incrementally-updated projections + snapshots.
2. **Second bottleneck:** spectator render jank from large state messages → broadcast a slim `SpectatorView` (only what the big screen shows), not the full match object.

## Anti-Patterns

### Anti-Pattern 1: Rules logic inside UI components

**What people do:** Compute busts, double-out validity, and turn rotation inside button handlers / component code.
**Why it's wrong:** Untestable, duplicated across input + spectator, and the source of most scoring bugs in darts apps.
**Do this instead:** All rules live in the pure `domain/x01` engine; UI only dispatches actions and renders state.

### Anti-Pattern 2: Per-`<path>` SVG hit areas for the board

**What people do:** Draw each segment as a clickable path and rely on DOM hit-testing.
**Why it's wrong:** Documented browser precision bugs under scaling cause mis-hits; double/triple rings are thin and easy to miss; hard to add fat-finger tolerance; hard to unit-test.
**Do this instead:** Render the board however you like, but resolve hits with pure polar-coordinate math (`hitTest`), which is testable and tunable.

### Anti-Pattern 3: Spectator window relying on BroadcastChannel alone

**What people do:** Sync the second window purely via `postMessage`.
**Why it's wrong:** A reload (or a window opened mid-match) receives nothing and shows a blank/stale screen — the channel has no memory.
**Do this instead:** Persist a "latest state" snapshot (localStorage) and rehydrate on load, then subscribe to the channel.

### Anti-Pattern 4: Storing computed stats as the source of truth

**What people do:** Increment counters and discard throw events.
**Why it's wrong:** Can't recover an interrupted match precisely, can't add new statistics later, can't fix a mis-scored throw cleanly.
**Do this instead:** Keep the throw event log as truth; treat counters/averages as recomputable projections + snapshots.

### Anti-Pattern 5: Hardcoding root paths for SW / manifest / assets

**What people do:** Reference `/sw.js`, `/manifest.webmanifest`, `/icons/...` from root.
**Why it's wrong:** GitHub Pages serves the app from `/<repo>/`, so service worker scope, `start_url`, and assets 404, and the PWA won't install or work offline.
**Do this instead:** Set Vite `base: '/<repo>/'`; let vite-plugin-pwa derive `scope`/`start_url`; reference assets via `import.meta.env.BASE_URL`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages (static host) | Build + deploy `dist/` (GitHub Actions). | Subdirectory base path is the main gotcha; no backend/API. |
| Browser PWA install | manifest + service worker via vite-plugin-pwa, `registerType: 'autoUpdate'`. | Precache app shell for offline; ensure manifest icons/scope correct. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Match Store | dispatch(action) / subscribe(state) | UI never touches engine, DB, or channel directly. |
| Match Store ↔ Domain Engine | pure function call | Synchronous, no I/O; the testable heart. |
| Match Store ↔ Persistence | async append/snapshot/load | Dexie/IndexedDB; recovery on boot. |
| Input window ↔ Spectator window | BroadcastChannel + localStorage snapshot | Same-origin; single writer; rehydrate-then-subscribe. |
| App ↔ PWA shell | SW registration + manifest | Base-path aware. |

## Suggested Build Order (dependency-driven)

This ordering reflects the dependency graph and front-loads correctness risk. It is a recommendation for the roadmap, not a final phase list.

1. **Domain core — X01 engine + types + tests.** No dependencies; everything else builds on it. Highest correctness risk → do first, prove with tests (busts, double/single-out, rotation ≤4, legs/sets, bull-off result).
2. **Dartboard geometry (`hitTest`) + tests.** Pure, independent of engine; the other big correctness/UX risk.
3. **Match store + minimal input UI.** Wire dispatch → engine → render; play a full leg on screen (board → score). No persistence yet.
4. **Checkout suggestion engine.** Depends on remaining-score state; pure lookup; slot into the input UI.
5. **Persistence + recovery (IndexedDB/Dexie).** Event log + snapshots; reload mid-match and resume.
6. **Cross-window spectator sync.** Depends on a stable `SpectatorView` shape from the store; add localStorage snapshot + BroadcastChannel + spectator route.
7. **Stats + achievements projections.** Fold over the event log; live achievement overlay + persisted records.
8. **PWA shell + GitHub Pages deploy.** Manifest, service worker, base-path config; verify install + offline on tablet and PC.
9. **Polish:** auto-pause countdown, German strings, dark-mode readability tuning for the 27"/3 m spectator view.

**Ordering rationale:** Pure, high-risk logic (1, 2) before anything stateful. A playable end-to-end loop (3, 4) before durability (5). Sync (6) needs a settled view shape, so it follows persistence. Stats (7) depend on the event log existing. PWA packaging (8) is independent and can be parallelized but is placed late so there's something worth installing. Each step is independently demoable.

## Sources

- Dartboard polar hit-testing & wheel order — [Clickable SVG Dartboard (CodePen)](https://codepen.io/codeXD/pen/yLLodya), [SVG path hit-precision bug under scaling (Mozilla)](https://bugzilla.mozilla.org/show_bug.cgi?id=836768), [Image-based dart hit detection (IEEE)](https://ieeexplore.ieee.org/document/8883659) — MEDIUM (geometry/angle math is standard and cross-checked; exact ring-band fractions to be tuned against the rendered SVG)
- Cross-window sync — [Broadcast Channel API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API), [BroadcastChannel API (12 Days of Web)](https://12daysofweb.dev/2024/broadcastchannel-api/), [Sharing state between windows without a server (DEV)](https://dev.to/notachraf/sharing-a-state-between-windows-without-a-serve-23an), [BroadcastChannel + storage event (Medium)](https://mehmood-dev.medium.com/understanding-broadcastchannel-api-the-storage-event-in-the-browser-9c31a0424ba7) — HIGH
- Event sourcing vs aggregated counters — [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), [Martin Kleppmann: stream processing & event sourcing](https://martin.kleppmann.com/2015/01/29/stream-processing-event-sourcing-reactive-cep.html), [Event Sourcing Pattern (Microsoft Azure)](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing) — HIGH
- PWA on GitHub Pages base path — [vite-plugin-pwa base path issue #4](https://github.com/vite-pwa/vite-plugin-pwa/issues/4), [Manifest/SW in subdirectory issue #263](https://github.com/vite-pwa/vite-plugin-pwa/issues/263), [Vite PWA guide](https://vite-pwa-org.netlify.app/guide/development) — HIGH

---
*Architecture research for: offline-first touch darts-scoring PWA*
*Researched: 2026-06-10*
