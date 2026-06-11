# Phase 2: Spectator Display - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 10 new/modified files
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/stores/display.svelte.ts` | store | event-driven | `src/stores/match.svelte.ts` | role-match |
| `src/stores/match.svelte.ts` (modify) | store | event-driven | self | exact |
| `src/routes/display/+page.svelte` | route/page | event-driven | `src/routes/match/+page.svelte` | role-match |
| `src/routes/match/+page.svelte` (modify) | route/page | request-response | self | exact |
| `src/ui/display/PlayerPanel.svelte` | component | request-response | `src/ui/input/ScorePanel.svelte` | exact |
| `src/ui/display/MatchHeader.svelte` | component | request-response | `src/ui/input/ScorePanel.svelte` | role-match |
| `src/ui/display/VisitLine.svelte` | component | request-response | `src/ui/input/VisitStrip.svelte` | exact |
| `src/ui/display/LegWinBanner.svelte` | component | event-driven | `src/ui/overlays/MatchWinOverlay.svelte` | role-match |
| `src/ui/display/MatchWinDisplay.svelte` | component | event-driven | `src/ui/overlays/MatchWinOverlay.svelte` | exact |
| `src/ui/display/SpectatorChooser.svelte` | component | request-response | `src/ui/input/CorrectionWindow.svelte` | partial |
| `src/engine/averages.ts` | utility | transform | `src/engine/checkout.ts` | role-match |

---

## Pattern Assignments

### `src/stores/display.svelte.ts` (store, event-driven)

**Analog:** `src/stores/match.svelte.ts`

**Imports pattern** (lines 1–16 of match.svelte.ts):
```typescript
import { reduce, initialState } from '../engine/reducer.js';
import { getSuggestion } from '../engine/checkout.js';
import type { MatchAction, MatchState, PlayerState } from '../engine/types.js';
```
Display store needs only the type:
```typescript
import type { MatchState } from '../engine/types.js';
```

**Core store class pattern** — follow the `$state` class + singleton export shape from match.svelte.ts (lines 18–64):
```typescript
export class MatchStore {
  state = $state<MatchState>(initialState());

  dispatch(action: MatchAction): void {
    this.state = reduce(this.state, action);
  }
  // getters…
}

export const matchStore = new MatchStore();
```

Display store adapts the same skeleton — `$state<MatchState | null>(null)`, a `connect()` method instead of `dispatch()`, and a singleton export:
```typescript
export class DisplayStore {
  state = $state<MatchState | null>(null);

  connect(): () => void {
    // hydrate from localStorage snapshot, then subscribe to BroadcastChannel
    // return cleanup fn for $effect teardown
  }
}

export const displayStore = new DisplayStore();
```

**Effect + cleanup pattern** — used throughout the match page (match/+page.svelte lines 18–33):
```typescript
$effect(() => {
  acquireWakeLock();
  document.addEventListener('visibilitychange', handleVisibility);
  return () => {
    releaseWakeLock();
    document.removeEventListener('visibilitychange', handleVisibility);
  };
});
```
`connect()` should return a cleanup function that closes the BroadcastChannel; the display page calls it inside `$effect(() => displayStore.connect())`.

---

### `src/stores/match.svelte.ts` (modify — add BroadcastChannel publisher)

**Analog:** self (lines 21–23)

**Existing dispatch pattern to extend** (lines 21–23):
```typescript
dispatch(action: MatchAction): void {
  this.state = reduce(this.state, action);
}
```

Add after the `reduce()` call — fire-and-forget BroadcastChannel post + localStorage snapshot write:
```typescript
// constants defined at module top (not inside class):
const BC_CHANNEL = 'neverman-match';
const LS_SNAPSHOT = 'neverman-match-snapshot';

// Inside dispatch(), after this.state = reduce(...):
try {
  const ch = new BroadcastChannel(BC_CHANNEL);
  ch.postMessage(this.state);
  ch.close();
} catch { /* non-fatal */ }
try {
  localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state));
} catch { /* quota / private mode — non-fatal */ }
```

**Key constraint from types.ts (lines 36–44):** `MatchState` is the wire format exactly as-is; all fields are serializable. Do not add wrapper objects — `ch.postMessage(this.state)` directly.

---

### `src/routes/display/+page.svelte` (route, event-driven)

**Analog:** `src/routes/match/+page.svelte`

**Route boilerplate + $effect pattern** (match/+page.svelte lines 1–33):
```svelte
<script lang="ts">
  import { matchStore } from '../../stores/match.svelte.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  $effect(() => {
    acquireWakeLock();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { /* cleanup */ };
  });
</script>
```

Display route follows the same shape; imports `displayStore` and sub-components:
```svelte
<script lang="ts">
  import { displayStore } from '../../stores/display.svelte.js';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import PlayerPanel from '../../ui/display/PlayerPanel.svelte';
  import MatchHeader from '../../ui/display/MatchHeader.svelte';
  import LegWinBanner from '../../ui/display/LegWinBanner.svelte';
  import MatchWinDisplay from '../../ui/display/MatchWinDisplay.svelte';

  $effect(() => displayStore.connect());  // returns cleanup

  let state = $derived(displayStore.state);
</script>
```

**Null-guard pattern** (critical — pitfall 4 from RESEARCH.md):
```svelte
{#if state === null || state.phase === 'setup'}
  <div class="idle-screen">Warte auf Match…</div>
{:else}
  <!-- render panels -->
{/if}
```

**Full-screen layout** (match/+page.svelte lines 201–210):
```css
.match-view {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: #111318;
  color: #f0f0f0;
}
```
Display page uses same full-bleed container but switches to a column (header + grid row) rather than the scoring view's responsive column/row layout.

**base path pattern** — copy exactly from MatchWinOverlay.svelte (lines 5–6):
```typescript
import { goto } from '$app/navigation';
import { base } from '$app/paths';
// usage: goto(`${base}/match`) or window.open(`${base}/display`, ...)
```

---

### `src/routes/match/+page.svelte` (modify — add spectator icon + chooser menu)

**Analog:** self

The SpectatorChooser component handles its own UI. The match page change is minimal: import `SpectatorChooser` and render it in the markup. Follow the same overlay pattern already established:

```svelte
import SpectatorChooser from '../../ui/display/SpectatorChooser.svelte';
// …in template, alongside MatchWinOverlay:
<SpectatorChooser />
```

No structural changes to the existing match page layout.

---

### `src/ui/display/PlayerPanel.svelte` (component, request-response)

**Analog:** `src/ui/input/ScorePanel.svelte`

**Prop-driven approach:** Unlike `ScorePanel` which reads `matchStore` directly, `PlayerPanel` receives `PlayerState` (and `isActive`, `config`) as props — since it must work from both `displayStore.state` (PC path) and `matchStore.state` (tablet path).

**Active player styling pattern** (ScorePanel.svelte lines 11–28):
```svelte
{#each matchStore.state.players as player, i (player.id)}
  {@const isActive = i === matchStore.state.activePlayerIndex}
  <div class="player-card" class:active={isActive}>
    <div class="player-name">{player.name}</div>
    <div class="score-row">
      <span class="remaining" class:remaining-active={isActive} class:remaining-inactive={!isActive}>
        {isActive ? matchStore.remaining : player.remaining}
      </span>
      {#if isActive}
        <CheckoutSuggestion />
      {/if}
    </div>
    <div class="legs-info">
      {#if matchStore.state.config.setsEnabled}
        <span>S: {player.setsWon}</span>
        <span> L: {player.legsWon}</span>
      {:else}
        <span>L: {player.legsWon}</span>
      {/if}
    </div>
  </div>
{/each}
```

**CSS active border pattern** (ScorePanel.svelte lines 50–53):
```css
.player-card {
  border-left: 2px solid transparent;
}
.player-card.active {
  border-left-color: #e8a020;
}
```

Spectator version upgrades this to a top border + glow (D-02 from CONTEXT.md). Inactive panels use `opacity: 0.55`. Use the design tokens from `app.css`:
- `--bg: #111318`, `--surface: #1e2027`, `--accent: #e8a020`, `--destructive: #c0392b`, `--text: #f0f0f0`

**TV typography scale** — not present in any existing component (all existing sizes are ≤48px for desktop scoring). Use fluid `clamp()` values per RESEARCH.md Pattern 5:
```css
.remaining-score { font-size: clamp(4rem, 8vw, 12rem); font-weight: 700; line-height: 1; }
.player-name     { font-size: clamp(1.5rem, 3vw, 4rem); font-weight: 600; }
.legs-sets       { font-size: clamp(1rem, 2vw, 2.5rem); }
.stats-line      { font-size: clamp(0.875rem, 1.5vw, 1.75rem); }
```

**BUST flash** (D-08): mirror the `VisitStrip` bust animation pattern (VisitStrip.svelte lines 56–59):
```css
.visit-strip.bust {
  background-color: rgba(192, 57, 43, 0.3);
}
```
For PlayerPanel, make it a temporary class (use `$state` + `setTimeout` for ~2s) that shows a prominent red overlay text "BUST" over the panel.

---

### `src/ui/display/MatchHeader.svelte` (component, request-response)

**Analog:** `src/ui/input/ScorePanel.svelte` (partial — same import/prop pattern, no direct analog for a header bar)

**setsEnabled branch pattern** to copy (ScorePanel.svelte lines 22–28):
```svelte
{#if matchStore.state.config.setsEnabled}
  <span>S: {player.setsWon}</span>
  <span> L: {player.legsWon}</span>
{:else}
  <span>L: {player.legsWon}</span>
{/if}
```

Header receives `config: MatchConfig` and `currentLeg: number` as props. No XSS risk since config values are typed numbers/strings from the engine, but follow the `{interpolation}` only rule (no `{@html}`).

---

### `src/ui/display/VisitLine.svelte` (component, request-response)

**Analog:** `src/ui/input/VisitStrip.svelte`

**formatDart() function** — copy verbatim from VisitStrip.svelte (lines 9–15):
```typescript
function formatDart(dart: DartScore): string {
  if (dart.segment === 0) return '0 (Daneben)';
  if (dart.multiplier === 2 && dart.segment === 25) return 'Bull';
  if (dart.multiplier === 1 && dart.segment === 25) return 'Outer Bull';
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return `${prefix}${dart.segment}`;
}
```

**Slot display pattern** (VisitStrip.svelte lines 34–44):
```svelte
{#each SLOTS as slotIdx (slotIdx)}
  {@const dart = matchStore.currentVisit[slotIdx]}
  <button class="dart-slot" …>
    {dart ? formatDart(dart) : '—'}
  </button>
{/each}
```

`VisitLine` is display-only (no undo buttons). It receives `currentVisit: DartScore[]` and `lastCompletedVisit: Visit | null` as props and renders the D-07 format:
- Live mid-visit: `"T20 · – · –"` (slots filled dart-by-dart, `'–'` for empty)
- Completed visit: `"100 — T20 · 20 · 20"` (total + individual darts)
- Numpad visit (`darts.length === 0`): show total only

**Imports needed:**
```typescript
import type { DartScore, Visit } from '../../engine/types.js';
```

---

### `src/ui/display/LegWinBanner.svelte` (component, event-driven)

**Analog:** `src/ui/overlays/MatchWinOverlay.svelte`

**Full-screen overlay pattern** (MatchWinOverlay.svelte lines 31–43):
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

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

**Conditional render pattern** (MatchWinOverlay.svelte lines 19–29):
```svelte
{#if matchStore.isMatchComplete}
  <div class="win-overlay" role="dialog" aria-modal="true" …>
    <div class="win-content">
      <h1 class="win-heading">{winnerName} gewinnt!</h1>
    </div>
  </div>
{/if}
```

`LegWinBanner` receives `message: string | null` as a prop (the parent `/display/+page.svelte` manages the `legWinMessage` state via `$effect` watching `legsWon` deltas). The banner shows when `message !== null`. Event-driven dismiss: parent clears the message when `currentVisit.length > 0` (first dart of next leg thrown).

**Heading color** — copy accent from MatchWinOverlay.svelte line 58:
```css
.win-heading { color: #e8a020; }  /* var(--accent) */
```

---

### `src/ui/display/MatchWinDisplay.svelte` (component, event-driven)

**Analog:** `src/ui/overlays/MatchWinOverlay.svelte` — closest match; spectator version stays persistent (no "Neues Spiel" button needed on display).

**Complete pattern to adapt** (MatchWinOverlay.svelte lines 1–88):

Imports pattern (lines 1–7):
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { matchStore } from '../../stores/match.svelte.js';
```

`MatchWinDisplay` receives `state: MatchState` as a prop instead of reading `matchStore` directly (pure display component). It shows winner name, final scores, and averages. No navigation button — the display stays up until a new match starts.

**Name interpolation safety** — copy the comment from MatchWinOverlay.svelte line 3:
```typescript
// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
```

---

### `src/ui/display/SpectatorChooser.svelte` (component, request-response)

**Analog:** `src/ui/input/CorrectionWindow.svelte` (partial — both are transient overlays triggered by user action)

**Props pattern** (CorrectionWindow.svelte lines 22–23):
```typescript
let { visible, visitDarts, isBust, visitTotal, ondismiss = () => {} }: Props = $props();
```

`SpectatorChooser` similarly takes no props — it manages its own `open` state:
```typescript
let open = $state(false);
```

**base path for window.open** — copy from MatchWinOverlay.svelte (lines 5–6):
```typescript
import { base } from '$app/paths';
// window.open(`${base}/display`, '_blank', 'noopener,noreferrer')
```

**goto for tablet navigation** — copy from MatchWinOverlay.svelte (line 14):
```typescript
import { goto } from '$app/navigation';
// goto(`${base}/display`)
```

**Popup blocked null-check** (no analog in codebase — new pattern per RESEARCH.md Pattern 6):
```typescript
function openSecondWindow() {
  const win = window.open(`${base}/display`, '_blank', 'noopener,noreferrer');
  if (!win) popupBlocked = true;
}
```

---

### `src/engine/averages.ts` (utility, transform)

**Analog:** `src/engine/checkout.ts` (same role: pure stateless engine utility)

**Checkout.ts import pattern** (verify with actual file — pure TS, no framework imports):
```typescript
import type { OutRule } from './types.js';
```

`averages.ts` imports:
```typescript
import type { Visit } from './types.js';
```

**Pure function export pattern** — follow checkout.ts convention of named exports, no class, no side effects. Functions receive all inputs as parameters and return computed values.

**Visit type shape** (types.ts lines 13–16):
```typescript
export interface Visit {
  darts: DartScore[];
  dartsAtDouble: number;
  bust: boolean;
}
```

Key facts for implementation (from RESEARCH.md Pitfall 5 + Open Questions):
- `player.visits` contains ALL visits across all legs (reducer does NOT reset visits at leg start — only `remaining` is reset)
- Match average = `computeAverage(player.visits, config.startScore, player.remaining)` — straightforward
- Leg average requires knowing where the current leg started — `legStartVisitIndex` must be added to `MatchState` as part of this phase (small reducer change)
- Bust visits count as 3 darts thrown, 0 scored
- Numpad visits have `darts.length === 0` — use `dartsUsed` field if present, otherwise default to 3

---

## Shared Patterns

### Design Token Usage
**Source:** `src/app.css` (lines 1–17)
**Apply to:** All display components
```css
/* Use these tokens exclusively — no raw hex values except where token doesn't exist */
--bg: #111318;        /* page background */
--surface: #1e2027;   /* panel/card background */
--accent: #e8a020;    /* active player highlight, headings */
--destructive: #c0392b; /* BUST flash */
--text: #f0f0f0;      /* all body text */
--space-xs: 4px; --space-sm: 8px; --space-md: 16px;
--space-lg: 24px; --space-xl: 32px; --space-2xl: 48px;
```

### XSS Safety (no {@html})
**Source:** `src/ui/overlays/MatchWinOverlay.svelte` line 3 + `src/ui/input/ScorePanel.svelte`
**Apply to:** All display components rendering player names or any user-supplied strings
```svelte
<!-- ALWAYS use {interpolation}, NEVER {@html} -->
<h1>{winnerName} gewinnt!</h1>  <!-- correct -->
```

### $effect + cleanup
**Source:** `src/routes/match/+page.svelte` (lines 18–33)
**Apply to:** `display/+page.svelte` (BroadcastChannel subscription), `display/+page.svelte` (fullscreen change listener)
```typescript
$effect(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
});
```

### base path for navigation
**Source:** `src/ui/overlays/MatchWinOverlay.svelte` (lines 5–6, 14)
**Apply to:** `SpectatorChooser.svelte`, `display/+page.svelte`
```typescript
import { goto } from '$app/navigation';
import { base } from '$app/paths';
// All goto() and window.open() calls MUST prefix with `${base}`
goto(`${base}/display`);
window.open(`${base}/display`, '_blank', 'noopener,noreferrer');
```

### Svelte 5 runes class store
**Source:** `src/stores/match.svelte.ts` (lines 18–64)
**Apply to:** `src/stores/display.svelte.ts`
```typescript
export class DisplayStore {
  state = $state<MatchState | null>(null);
  // methods…
}
export const displayStore = new DisplayStore();
```

### Test file structure
**Source:** `src/stores/match.svelte.test.ts`
**Apply to:** `src/engine/averages.test.ts`, `src/stores/display.svelte.test.ts`

Test file pattern (lines 1–8):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MatchStore } from './match.svelte.js';
import type { MatchConfig } from '../engine/types.js';
// describe → beforeEach (fresh instance) → it assertions
```

Vitest project assignment: `averages.test.ts` and `display.svelte.test.ts` belong in the `unit` project (pure logic, no DOM). `PlayerPanel.test.ts` and `LegWinBanner.test.ts` belong in the `browser` project (real DOM rendering).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/engine/averages.ts` | utility | transform | No statistics/average utility exists yet; nearest analog is `checkout.ts` (same pure-function role, different domain) |

---

## Metadata

**Analog search scope:** `src/stores/`, `src/ui/input/`, `src/ui/overlays/`, `src/routes/`, `src/engine/`, `src/app.css`
**Files scanned:** 11 source files read
**Pattern extraction date:** 2026-06-11
