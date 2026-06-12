# Phase 4: Statistics & Achievements — Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 19 (8 new, 11 modified/extended)
**Analogs found:** 19 / 19

---

## File Classification

| New / Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------------|------|-----------|----------------|---------------|
| `src/engine/types.ts` (extend) | model | — | self | exact |
| `src/engine/averages.ts` (extend) | utility | transform | `src/engine/checkout.ts` | exact |
| `src/engine/reducer.ts` (extend) | utility | transform | self (existing leg-close path) | exact |
| `src/db/stats.ts` (new) | service | CRUD / batch | `src/db/matches.ts` | exact |
| `src/stores/match.svelte.ts` (extend) | store | event-driven | self | exact |
| `src/ui/input/StatDrawer.svelte` (new) | component | request-response | `src/ui/input/CorrectionWindow.svelte` | role-match |
| `src/ui/overlays/RecordOverlay.svelte` (new) | component | event-driven | `src/ui/display/LegWinBanner.svelte` | exact |
| `src/ui/stats/StatCard.svelte` (new) | component | request-response | `src/ui/history/PlayerStatRow.svelte` | role-match |
| `src/ui/stats/ScoreDistributionChart.svelte` (new) | component | transform | `src/ui/input/Dartboard.svelte` (SVG) | partial |
| `src/ui/stats/AverageTrendChart.svelte` (new) | component | transform | `src/ui/input/Dartboard.svelte` (SVG) | partial |
| `src/ui/stats/DartsPerLegChart.svelte` (new) | component | transform | `src/ui/input/Dartboard.svelte` (SVG) | partial |
| `src/ui/stats/ProfileStatDashboard.svelte` (new) | component | CRUD | `src/routes/history/[id]/+page.svelte` | role-match |
| `src/ui/history/MatchStatBreakdown.svelte` (new) | component | transform | `src/ui/history/PlayerStatRow.svelte` | role-match |
| `src/ui/history/PlayerStatRow.svelte` (extend) | component | transform | self | exact |
| `src/ui/display/LegWinBanner.svelte` (extend) | component | event-driven | self | exact |
| `src/ui/display/MatchWinDisplay.svelte` (extend) | component | event-driven | `src/ui/display/LegWinBanner.svelte` | exact |
| `src/ui/overlays/MatchWinOverlay.svelte` (extend) | component | event-driven | self | exact |
| `src/routes/stats/+page.svelte` (new) | route | CRUD | `src/routes/history/+page.svelte` | exact |
| `src/routes/+page.svelte` (extend) | route | request-response | self | exact |

---

## Pattern Assignments

### `src/engine/types.ts` — extend

**Analog:** self — the DO-NOT-RENAME contract means the extension pattern is additive optional fields only.

**Existing `Visit` interface** (lines 12–16):
```typescript
export interface Visit {
  darts: DartScore[];
  dartsAtDouble: number;
  bust: boolean;
}
```

**New optional fields to add to `Visit`** (additive, backward-compatible):
```typescript
export interface Visit {
  darts: DartScore[];
  dartsAtDouble: number;
  bust: boolean;
  wasCheckout?: boolean;   // Phase 4: true when this visit closes a leg (double-out)
}
```

**Existing `PlayerState` interface** (lines 18–26):
```typescript
export interface PlayerState {
  id: string;
  name: string;
  isGuest: boolean;
  remaining: number;
  legsWon: number;
  setsWon: number;
  visits: Visit[];
}
```

**New optional field to add to `PlayerState`** (additive — existing blobs without it default to `[]`):
```typescript
export interface PlayerState {
  // ... all existing fields unchanged ...
  /** Completed-leg accumulator for cross-leg average. Populated by reducer at leg close. Added Phase 4. */
  legCompleted?: Array<{ dartsThrown: number; scored: number }>;
}
```

**Rule:** Never rename existing fields. All Phase 4 additions are optional (`?`) so historical `MatchState` blobs in `db.matches` (stored as JSON) remain valid without migration.

---

### `src/engine/averages.ts` — extend

**Analog:** `src/engine/averages.ts` itself (lines 1–74). All new stat functions follow the exact same pattern:
- Named export, no class, no side effects
- Return `null` for zero-data cases (avoids division by zero)
- No formatting — one-decimal display is the caller's responsibility
- Parameter style: typed inputs derived from `PlayerState` / `Visit[]`

**Existing pattern to mirror** (lines 37–42):
```typescript
export function computeAverage(visits: Visit[], startScore: number, remaining: number): number | null {
  const darts = totalDartsThrown(visits);
  if (darts === 0) return null;
  const scored = startScore - remaining;
  return (scored / darts) * 3;
}
```

**Import pattern** (line 12):
```typescript
import type { Visit } from './types.js';
```

**New functions to add** — each follows the same named-export, null-on-zero-data pattern:

`matchAverageCrossLeg(player, currentLegStartIdx, startScore)` — sums `legCompleted[]` + current leg:
```typescript
export function matchAverageCrossLeg(
  player: PlayerState,
  currentLegStartIdx: number,
  startScore: number
): number | null {
  const completed = player.legCompleted ?? [];
  const prevDarts = completed.reduce((s, l) => s + l.dartsThrown, 0);
  const prevScored = completed.reduce((s, l) => s + l.scored, 0);
  const curVisits = player.visits.slice(currentLegStartIdx);
  const curDarts = curVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
  const curScored = startScore - player.remaining;
  const totalDarts = prevDarts + curDarts;
  const totalScored = prevScored + curScored;
  if (totalDarts === 0) return null;
  return (totalScored / totalDarts) * 3;
}
```

`first9Average(legVisits, startScore)` — first 3 visits of a leg, board-mode score sum:
Returns `null` until 3 visits complete.

`checkoutPercent(visits, outRule)` — `doublesHit / dartsAtDouble * 100`; returns `null` for single-out or no darts at double.

`computeScoreBands(visitScores)` — counts 180s, 140+, 100+, 60+ from a pre-computed `number[]` of non-bust visit scores.

`dartsPerLeg(player, currentLegStart)` / `bestLeg(...)` / `worstLeg(...)` — derive from `legCompleted[].dartsThrown`.

**Import extension** (add to existing import):
```typescript
import type { Visit, PlayerState, OutRule } from './types.js';
```

---

### `src/engine/reducer.ts` — extend

**Analog:** existing `handleLegWinFromPlayers` path (leg-close logic). The exact line numbers shift per edit but the pattern is: before resetting `remaining`, capture and push to `legCompleted`.

**Pattern to copy** from reducer's existing leg-close path (look for `legStartVisitIndex` update and `remaining = startScore` reset):
```typescript
// Existing pattern (leg close): player.remaining is reset here
// BEFORE the reset, capture legCompleted entry:
const legStart = state.legStartVisitIndex[player.id] ?? 0;
const legVisits = player.visits.slice(legStart);
const dartsThrown = legVisits.reduce(
  (s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0
);
const scored = state.config.startScore - player.remaining;
// push { dartsThrown, scored } to player.legCompleted

// Also set wasCheckout: true on the last visit when outRule === 'double'
```

**UNDO safety:** the event-log replay pattern (`reduce(initialState(), ...log)`) means `legCompleted` is rebuilt from scratch on every UNDO replay — no stale state.

---

### `src/db/stats.ts` — new

**Analog:** `src/db/matches.ts` (lines 1–43) — mirror exactly.

**Import pattern** (lines 1–9 of matches.ts):
```typescript
import { readable, type Readable } from 'svelte/store';
import { liveQuery } from 'dexie';
import { db, type MatchRecord } from './db.js';
```

**liveQuery → Readable pattern** (lines 28–42 of matches.ts — copy verbatim, adjust query):
```typescript
export function profileStatsLive(profileId: string): Readable<LifetimeStats | null> {
  return readable<LifetimeStats | null>(null, (set) => {
    const subscription = liveQuery(async () => {
      try {
        const matches = await db.matches
          .filter(m => m.state.players.some(p => p.id === profileId))
          .toArray();
        return computeLifetimeStats(matches, profileId);
      } catch {
        return null;
      }
    }).subscribe({ next: set, error: () => set(null) });
    return () => subscription.unsubscribe();
  });
}
```

**Error handling pattern** (matches.ts line 50–53):
```typescript
export async function getMatch(id: number): Promise<MatchRecord | undefined> {
  try {
    return await db.matches.get(id);
  } catch {
    return undefined;
  }
}
```

**Security note** (matches.ts header): "Security T-03-05: all strings are plain data — no HTML injection possible; callers must render via Svelte {interpolation}."

**New exports to add:**
- `computeLifetimeStats(matches: MatchRecord[], profileId: string): LifetimeStats` — pure function over blobs, no DB access; accepts output of the liveQuery scan.
- `profileStatsLive(profileId: string): Readable<LifetimeStats | null>` — reactive wrapper following matchesLive() pattern.

**D-09 rule:** No new Dexie `stores()` entry. All stats derive from `db.matches`. No `records` table. If adding a Dexie version bump is ever needed (it should NOT be for Phase 4), use `this.version(3).stores({...})` — never mutate v1/v2 blocks.

---

### `src/stores/match.svelte.ts` — extend

**Analog:** self (lines 1–126) — the extension adds fields and a new private method following the established class pattern.

**Class structure to follow** (lines 24–125):
```typescript
export class MatchStore {
  state = $state<MatchState>(initialState());

  dispatch(action: MatchAction): void {
    this.state = reduce(this.state, action);
    // ... BroadcastChannel publish (try/catch) ...
    // ... localStorage publish (try/catch) ...
    // Phase 4: add record detection here (AFTER publish, BEFORE match-complete check)
    if (this.state.phase === 'match-complete') {
      this.#persistCompletedMatch(this.state);
    }
  }

  async #persistCompletedMatch(state: MatchState): Promise<void> { ... }
}
```

**BroadcastChannel one-shot pattern** (lines 32–37 of match.svelte.ts — copy for record broadcast):
```typescript
try {
  const ch = new BroadcastChannel(BC_CHANNEL);
  ch.postMessage($state.snapshot(this.state));
  ch.close();
} catch {
  // Silently ignore
}
```

**New additions to `MatchStore`:**

1. New constant (alongside `BC_CHANNEL` at top of file):
```typescript
const BC_RECORD_CHANNEL = 'neverman-record'; // separate channel avoids DisplayStore type collision
```

2. New `$state` field:
```typescript
preloadedRecords = $state<Map<string, LifetimeStats>>(new Map());
pendingRecords = $state<RecordItem[]>([]);
```

3. New public method for match-start preload:
```typescript
async loadRecords(state: MatchState): Promise<void> {
  // For each profile player (not guest), load lifetime stats from db
  // store in preloadedRecords map keyed by player.id
}
```

4. New private methods:
```typescript
#detectRecords(prev: MatchState, next: MatchState): RecordItem[] { ... }
#broadcastRecordEvent(items: RecordItem[]): void { /* one-shot BC_RECORD_CHANNEL */ }
```

5. `dispatch()` extension — insert after `this.#publish()`:
```typescript
const recordItems = this.#detectRecords(prevState, this.state);
if (recordItems.length > 0) {
  this.pendingRecords = recordItems;
  this.#broadcastRecordEvent(recordItems);
}
```

**Anti-pattern:** Never dispatch further actions from within `dispatch()` — only post to BroadcastChannel.

---

### `src/ui/input/StatDrawer.svelte` — new

**Analog:** `src/ui/input/CorrectionWindow.svelte` (lines 1–211) — tappable overlay panel within the match input view.

**Script pattern** (CorrectionWindow lines 1–93):
```svelte
<script lang="ts">
  import { matchStore } from '../../stores/match.svelte.js';
  // Props interface
  interface Props { ... }
  let { ... }: Props = $props();
  // Local $state for open/close
  let open = $state(false);
</script>
```

**Toggle interaction pattern** — use `$state` boolean with CSS `max-height` transition (no JS animation library). From UI-SPEC:
```css
.drawer-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease;
}
.drawer-panel.open {
  max-height: 60dvh;
  overflow-y: auto;
}
```

**Surface pattern** (matches `section-card` in history/[id]/+page.svelte):
```css
.drawer {
  background: #1e2027;
  border-top: 1px solid #2d2d2d;
  padding: var(--space-md, 16px);
}
```

**Toggle button pattern** (matches `.back-btn` 44px touch target):
```css
.drawer-toggle {
  width: 100%;
  min-height: 44px;
  background: transparent;
  border: none;
  color: #f0f0f0;
  cursor: pointer;
  text-align: left;
  padding: 0 var(--space-md, 16px);
}
```

**Accessibility** (from CorrectionWindow and UI-SPEC):
```svelte
<button aria-expanded={open} aria-controls="stat-drawer">
  Statistik {open ? '▴' : '▾'}
</button>
<div id="stat-drawer" role="region">
  <!-- StatCard grid -->
</div>
```

**Content:** Two columns of `StatCard` tiles — left column leg stats, right column match stats. Uses `matchAverageCrossLeg` / leg stat functions imported from `../../engine/averages.js`.

---

### `src/ui/overlays/RecordOverlay.svelte` — new

**Analog:** `src/ui/display/LegWinBanner.svelte` (lines 1–70) — exact same overlay pattern, same animation, same z-index layer philosophy.

**Props interface** (mirror LegWinBanner's prop style, lines 9–14):
```svelte
<script lang="ts">
  interface Props {
    records: string[];         // display strings, pre-formatted by caller
    autoDismissMs?: number;    // default 2500
  }
  let { records, autoDismissMs = 2500 }: Props = $props();
</script>
```

**Auto-dismiss pattern** (from CorrectionWindow lines 41–63, simplified):
```svelte
$effect(() => {
  if (records.length === 0) return;
  const timer = setTimeout(() => { /* clear records */ }, autoDismissMs);
  return () => clearTimeout(timer);
});
```

**Template pattern** (copy LegWinBanner lines 17–28, adjust classes):
```svelte
{#if records.length > 0}
  <div class="record-overlay" role="status" aria-live="assertive">
    <div class="record-content">
      <p class="record-headline">{records.join(' · ')}</p>
    </div>
  </div>
{/if}
```

**CSS — copy LegWinBanner animation exactly** (lines 31–70):
```css
.record-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;                        /* above z-10/z-20 banners, below z-100 MatchWinOverlay */
  background: rgba(17, 19, 24, 0.88); /* matches LegWinBanner exactly */
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bannerFadeIn 250ms ease-out; /* reuse same keyframe name */
}

@keyframes bannerFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

.record-headline {
  font-size: clamp(2.5rem, 6vw, 8rem); /* matches LegWinBanner .banner-message */
  font-weight: 600;
  color: #e8a020;
  line-height: 1.1;
  text-align: center;
}
```

**Display route wiring:** `src/routes/display/+page.svelte` must subscribe to `BroadcastChannel('neverman-record')` separately from the existing match-state channel, then pass events to `RecordOverlay`. Pattern mirrors `displayStore.connect()` in `src/stores/display.svelte.ts` (lines 31–53).

---

### `src/ui/stats/StatCard.svelte` — new

**Analog:** `src/ui/history/PlayerStatRow.svelte` (lines 43–109) — KPI label/value pair display.

**Props pattern** (simple, prop-driven — mirrors PlayerStatRow lines 9–17):
```svelte
<script lang="ts">
  interface Props {
    label: string;
    value: string;   // pre-formatted by caller (e.g. "42.3", "67%", "—")
  }
  let { label, value }: Props = $props();
</script>
```

**Template and CSS** — copy the `.avg-line` / `.avg-label` / `.avg-value` pattern from PlayerStatRow (lines 47–52, 96–108):
```svelte
<div class="stat-card">
  <span class="stat-value">{value}</span>
  <span class="stat-label">{label}</span>
</div>
```
```css
.stat-card { background: #1e2027; border-radius: 8px; padding: var(--space-md, 16px); }
.stat-value { font-size: 20px; font-weight: 600; color: #f0f0f0; }
.stat-label { font-size: 14px; font-weight: 400; color: #888888; }
```

---

### `src/ui/stats/ScoreDistributionChart.svelte` — new
### `src/ui/stats/AverageTrendChart.svelte` — new
### `src/ui/stats/DartsPerLegChart.svelte` — new

**Analog:** `src/ui/input/Dartboard.svelte` — hand-rolled SVG component, no library, `viewBox` + `width="100%"`. Same approach: SVG for display, coordinates computed in script.

**SVG component shell** (copy Dartboard's SVG top-level pattern):
```svelte
<script lang="ts">
  interface Props {
    // chart-specific data props
  }
  let { ... }: Props = $props();
  // Coordinate math: $derived from data props
</script>

<svg role="img" aria-label="{chartLabel}: {ariaDescription}"
     viewBox="0 0 300 160" width="100%">
  <!-- chart elements -->
</svg>
```

**Horizontal bar chart pattern** (ScoreDistributionChart, DartsPerLegChart):
```svelte
{#each bands as band, i}
  {@const barWidth = maxCount > 0 ? (band.count / maxCount) * 240 : 0}
  <rect x="55" y={i * 30 + 5} width={barWidth} height="20"
        fill={band.count === maxCount ? '#e8a020' : '#444'} />
  <text x="50" y={i * 30 + 19} text-anchor="end" font-size="12" fill="#888">{band.label}</text>
  <text x={60 + barWidth} y={i * 30 + 19} font-size="12" fill="#f0f0f0">{band.count}</text>
{/each}
<line x1="55" y1="0" x2="55" y2="160" stroke="#444" stroke-width="1" />
```

**Line chart pattern** (AverageTrendChart):
```svelte
<!-- axes -->
<line x1="30" y1="0" x2="30" y2="100" stroke="#444" />
<line x1="30" y1="100" x2="300" y2="100" stroke="#444" />
{#if points.length >= 2}
  <polyline points={svgPoints} fill="none" stroke="#e8a020" stroke-width="2" />
{:else}
  <text x="150" y="60" text-anchor="middle" font-size="14" fill="#888">Nicht genug Daten.</text>
{/if}
```

**Coordinate math** (all $derived):
- Bar width: `(value / maxValue) * availableWidth`
- Line Y: `chartHeight - ((v - minY) / (maxY - minY)) * chartHeight` (flat line at midpoint when maxY === minY)
- Line X: `leftPad + (i / (count - 1)) * availableWidth`

**Wrap in section card** (from history/[id]/+page.svelte `.summary-card` pattern):
```css
.chart-card {
  background: #1e2027;
  border-radius: 8px;
  padding: var(--space-md, 16px);
}
```

---

### `src/ui/stats/ProfileStatDashboard.svelte` — new

**Analog:** `src/routes/history/[id]/+page.svelte` (lines 85–127) — section-card layout, player name heading, multiple sub-sections with `<h2 class="section-heading">`.

**Layout pattern** (history/[id] lines 85–127 condensed):
```svelte
<div class="content">
  <!-- KPI tiles: 2-column grid of StatCard -->
  <section class="stats-section">
    <h2 class="section-heading">Übersicht</h2>
    <div class="kpi-grid">
      <StatCard label="Matches gespielt" value={stats.matchesPlayed.toString()} />
      <StatCard label="Gewinnrate" value="{winRate}%" />
      <StatCard label="3-Dart Ø (Lifetime)" value={avg} />
      <StatCard label="Finish %" value={checkoutPct} />
    </div>
  </section>
  <section class="stats-section">
    <h2 class="section-heading">Score-Verteilung</h2>
    <ScoreDistributionChart bands={stats.scoreBands} />
  </section>
  <!-- ... more sections ... -->
</div>
```

**CSS from history/[id]** (lines 220–240):
```css
.section-heading { font-size: 20px; font-weight: 600; color: #f0f0f0; margin: 0; }
.content { padding: var(--space-md, 16px); display: flex; flex-direction: column; gap: var(--space-md, 16px); }
```

**Data source:** receives `stats: LifetimeStats` as prop OR calls `profileStatsLive(profileId)` — prefer prop-driven for testability.

**Empty state** (from history/+page.svelte lines 27–33):
```svelte
{#if !stats || stats.matchesPlayed === 0}
  <div class="empty-state" role="status">
    <p class="empty-heading">Noch keine Spiele.</p>
    <p class="empty-body">Spiele ein Match mit diesem Profil, um Statistiken zu sehen.</p>
  </div>
{/if}
```

---

### `src/ui/history/MatchStatBreakdown.svelte` — new

**Analog:** `src/ui/history/PlayerStatRow.svelte` (lines 43–109) — sits inside the history detail, same section-card visual style, prop-driven from `record.state`.

**Props:**
```svelte
<script lang="ts">
  import type { PlayerState, MatchConfig } from '../../engine/types.js';
  interface Props {
    players: PlayerState[];
    config: MatchConfig;
    winnerId: string;
  }
  let { players, config, winnerId }: Props = $props();
</script>
```

**Template — copy PlayerStatRow layout** with a StatCard grid per player:
```svelte
<section class="stat-breakdown">
  <h2 class="section-heading">Statistiken</h2>
  {#each players as player (player.id)}
    <div class="player-stat-block">
      <h3 class="player-name" class:winner={player.id === winnerId}>{player.name}</h3>
      <div class="kpi-grid">
        <!-- StatCard per metric -->
      </div>
    </div>
  {/each}
</section>
```

**CSS** — reuse `.player-row` pattern from PlayerStatRow (lines 54–109):
```css
.player-name { font-size: 16px; font-weight: 600; color: #f0f0f0; }
.player-name.winner { color: #e8a020; }
```

---

### `src/ui/history/PlayerStatRow.svelte` — extend

**Analog:** self (lines 1–109).

**Current `avgDisplay` derived** (lines 36–40) that shows "—" for multi-leg:
```typescript
const avgDisplay = $derived.by(() => {
  if (totalLegsPlayed > 1) return '—';
  const avg = computeAverage(player.visits, config.startScore, player.remaining);
  return avg !== null ? avg.toFixed(1) : '—';
});
```

**Replace with** (once `matchAverageCrossLeg` exists):
```typescript
import { matchAverageCrossLeg } from '../../engine/averages.js';

const avgDisplay = $derived.by(() => {
  const legStart = /* state.legStartVisitIndex[player.id] — must be passed as prop */ 0;
  const avg = matchAverageCrossLeg(player, legStart, config.startScore);
  return avg !== null ? avg.toFixed(1) : '—';
});
```

**New props to add** (additive to existing `Props` interface):
- `legStartVisitIndex: number` — for correct average slicing

**New score-band display** — append below `.avg-line` using same label/value pattern:
```svelte
<div class="bands-line">
  <span class="avg-label">180er:</span>
  <span class="avg-value">{bands.count180}</span>
  <!-- etc -->
</div>
```

---

### `src/ui/display/LegWinBanner.svelte` — extend
### `src/ui/display/MatchWinDisplay.svelte` — extend
### `src/ui/overlays/MatchWinOverlay.svelte` — extend

**Analog:** LegWinBanner self (lines 1–70).

**Existing Props interface** (lines 9–13):
```svelte
interface Props {
  message: string | null;
  subtitle?: string | null;
}
```

**Extend to** (additive prop, default null):
```svelte
interface Props {
  message: string | null;
  subtitle?: string | null;
  recordBadge?: string | null;  // Phase 4: D-08 fold-into-banner record text
}
let { message, subtitle = null, recordBadge = null }: Props = $props();
```

**Insert record badge in template** (after `.banner-subtitle`, lines 23–26):
```svelte
{#if recordBadge}
  <p class="record-badge">{recordBadge}</p>
{/if}
```

**CSS for badge** (UI-SPEC: 16px / 400 / `#e8a020`):
```css
.record-badge {
  margin: var(--space-sm, 8px) 0 0;
  font-size: 16px;
  font-weight: 400;
  color: #e8a020;
}
```

---

### `src/routes/stats/+page.svelte` — new

**Analog:** `src/routes/history/+page.svelte` (lines 1–122) — list screen with heading-bar, back button, empty state, liveQuery reactive data.

**Script pattern** (history/+page.svelte lines 1–12):
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { profilesLive } from '../../db/profiles.js';
  import ProfileStatDashboard from '../../ui/stats/ProfileStatDashboard.svelte';

  const profiles = profilesLive();
  let selectedProfileId = $state<string | null>(null);
</script>
```

**Heading bar pattern** (history/+page.svelte lines 15–23 — copy verbatim, change title):
```svelte
<header class="heading-bar">
  <button class="back-btn" onclick={() => goto(`${base}/`)} aria-label="Zurück">
    <!-- back SVG -->
  </button>
  <h1 class="screen-title">Statistik</h1>
</header>
```

**Profile picker** — button rows matching start-screen `.menu-btn` (src/routes/+page.svelte lines 132–146):
```svelte
{#each $profiles as profile (profile.id)}
  <button
    class="menu-btn"
    aria-label="Statistik für {profile.name} anzeigen"
    onclick={() => selectedProfileId = String(profile.id)}
  >
    {profile.name}
    <!-- chevron SVG -->
  </button>
{/each}
```

**Empty state** (copy history/+page.svelte lines 27–33, adjust copy):
```svelte
{#if $profiles.length === 0}
  <div class="empty-state" role="status">
    <p class="empty-heading">Noch keine Profile.</p>
    <p class="empty-body">Erstelle ein Profil beim nächsten Spiel.</p>
  </div>
{/if}
```

**CSS** — copy `.screen`, `.heading-bar`, `.back-btn`, `.screen-title`, `.content`, `.empty-state` from history/+page.svelte lines 42–122. `.menu-btn` from src/routes/+page.svelte lines 132–155.

---

### `src/routes/+page.svelte` — extend

**Analog:** self (lines 71–93 — the `<nav class="menu">` block).

**Existing pattern** (lines 79–92 — copy button style exactly):
```svelte
<button class="menu-btn" onclick={() => goto(`${base}/history`)}>
  Match-Verlauf
  <svg ...>...</svg>
</button>
```

**Add as fourth item** (after "Daten / Backup" button):
```svelte
<button class="menu-btn" onclick={() => goto(`${base}/stats`)}>
  Statistik
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 18l6-6-6-6" />
  </svg>
</button>
```

No other changes to this file.

---

## Shared Patterns

### Error Handling (all DB + localStorage access)
**Source:** `src/db/matches.ts` lines 29–41 and `src/stores/match.svelte.ts` lines 31–37
**Apply to:** `src/db/stats.ts`, all `$effect` blocks touching Dexie, BroadcastChannel in MatchStore
```typescript
try {
  // DB or BroadcastChannel operation
} catch {
  // Silently degrade — match play / display must continue uninterrupted
}
```

### Player Name Rendering (XSS prevention)
**Source:** All existing components — never `{@html}`
**Apply to:** All new components displaying `player.name`, `profile.name`
```svelte
<!-- ALWAYS: -->
<span>{player.name}</span>
<!-- NEVER: -->
<span>{@html player.name}</span>
```

### `$derived.by()` for computed display values
**Source:** `src/ui/history/PlayerStatRow.svelte` lines 20–40, `src/routes/history/[id]/+page.svelte` lines 20–62
**Apply to:** All new components with multi-step derived computations
```typescript
const displayValue = $derived.by(() => {
  // multi-step logic
  return someValue !== null ? someValue.toFixed(1) : '—';
});
```

### CSS variable spacing tokens
**Source:** `src/app.css` (used in every component)
**Apply to:** All new CSS — never hardcode spacing, always use `var(--space-xs/sm/md/lg/xl/2xl, fallback)`
```css
padding: var(--space-md, 16px);
gap: var(--space-sm, 8px);
```

### Accessibility: `role` + `aria-live`
**Source:** `src/ui/display/LegWinBanner.svelte` line 18
**Apply to:** `RecordOverlay` (assertive), empty states (status), error states (alert)
```svelte
<!-- Record overlay -->
<div role="status" aria-live="assertive">
<!-- Empty state -->
<div role="status">
<!-- Error -->
<p role="alert">
```

### Focus ring
**Source:** Implicit project convention (UI-SPEC)
**Apply to:** All new focusable elements (drawer toggle, profile picker buttons, stats navigation)
```css
:focus-visible {
  outline: 2px solid #e8a020;
  outline-offset: 2px;
}
```

### Screen container
**Source:** `src/routes/history/+page.svelte` lines 42–50 and `src/routes/history/[id]/+page.svelte` lines 141–148
**Apply to:** `src/routes/stats/+page.svelte`
```css
.screen {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  background: #111318;
  color: #f0f0f0;
}
```

### Heading bar
**Source:** `src/routes/history/+page.svelte` lines 52–68 and `src/routes/history/[id]/+page.svelte` lines 150–172
**Apply to:** `src/routes/stats/+page.svelte`
```css
.heading-bar {
  display: flex; align-items: center; gap: var(--space-sm, 8px);
  height: 40px; padding: 0 var(--space-md, 16px);
  background: #111318; border-bottom: 1px solid #2d2d2d;
}
.back-btn { width: 44px; height: 44px; background: transparent; border: none; color: #f0f0f0; }
.screen-title { font-size: 20px; font-weight: 600; margin: 0; color: #f0f0f0; }
```

---

## No Analog Found

All files have analogs. No file in Phase 4 requires completely novel infrastructure.

The SVG chart components (ScoreDistributionChart, AverageTrendChart, DartsPerLegChart) have only a partial analog in Dartboard.svelte (same SVG-in-Svelte technique, different coordinate geometry). The RESEARCH.md Pattern 9 code examples are the primary reference for the coordinate math.

---

## Metadata

**Analog search scope:** `src/engine/`, `src/db/`, `src/stores/`, `src/ui/`, `src/routes/`
**Files scanned:** 19 source files read in full
**Pattern extraction date:** 2026-06-12
