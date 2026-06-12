# Phase 4: Statistics & Achievements — Research

**Researched:** 2026-06-12
**Domain:** Statistics computation over X01 match state; Dexie lifetime aggregation; BroadcastChannel record events; hand-rolled SVG charts; Svelte 5 runes patterns
**Confidence:** HIGH (primary findings from codebase audit of phases 1–3; MEDIUM for SVG chart patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Live stats on INPUT view live behind a tappable "Statistik" drawer/panel. The existing inline 3-dart average and checkout line stay as-is; the drawer holds the full live leg + match breakdown.
- **D-02:** SPECTATOR view stays minimal — averages remain as today. The only new spectator element is the record-celebration overlay (D-08).
- **D-03:** Records that trigger live celebration: new highest visit, new highest checkout, new best leg (fewest darts), new highest match 3-dart average (fires at match end). All other stats still tracked.
- **D-04:** A 180 always celebrates, even when only tying an existing personal best.
- **D-05:** Celebrate from first occurrence. First match sets AND celebrates the initial record.
- **D-06:** Celebration is a transient auto-dismiss overlay/animation (~2.5 s) on BOTH views. Play continues underneath — no tap required.
- **D-07:** Multiple milestones in one moment show as ONE combined card listing everything hit.
- **D-08:** When a record lands on a leg- or match-winning throw, the record folds into the existing win banner (a record badge/line) rather than stacking two overlays.
- **D-09:** Records and lifetime stats are recomputed from match history. NO separate stored records table. Deleting the match that holds a record lets the record recede to next-best. Consistent with Phase 3 D-09.
- **D-10:** Lifetime statistics dashboard lives behind a new "Statistik" entry on the start screen. Selecting a profile shows that profile's lifetime stats + charts.
- **D-11:** Lifetime stats are per-profile only. Guest players (`guest-N`) have no lifetime stats and cannot hold records.

### Claude's Discretion

- Cross-leg match-average implementation approach (see `## Architecture Patterns` — resolved below).
- Charting approach/library (resolved: hand-rolled SVG — see `## Don't Hand-Roll`).
- Checkout-% definition edge cases (resolved below under `## Architecture Patterns`).
- first-9 average mechanics (first 9 darts = first 3 visits of a leg; one decimal, consistent with Phase 2).
- Best/worst leg derivation (darts-per-leg from legStartVisitIndex + visits).
- How current records are made available live during play for real-time detection.
- Exact German labels, drawer layout, overlay animation styling, dashboard chart selection/order, stats-screen profile picker UX. (All locked in 04-UI-SPEC.md — see that file for complete copy.)

### Deferred Ideas (OUT OF SCOPE)

- Sound effects for 180s / records (Phase 5).
- Always-on / spectator stat panels.
- Independently-stored permanent records table.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAT-01 | Live 3-dart average for current leg and whole match (busts = 3 darts; checkout visits = actual darts used) | Cross-leg match average approach defined; `computeAverage` already handles busts. New `matchAverageCrossLeg()` function required. |
| STAT-02 | First-9 average per leg and match | `first9Average()` pure function: slice first 3 visits of a leg (or match). Exact mechanics defined below. |
| STAT-03 | Checkout percentage (doubles hit / darts at double) | `Visit.dartsAtDouble` already captured. "Doubles hit" = winning visits in double-out matches. Full formula defined below. |
| STAT-04 | Score bands per leg/match/lifetime: 180s, 140+, 100+, 60+ | `visitScore()` helper needed. Band thresholds and counting rules defined below. |
| STAT-05 | Highest visit score, highest checkout, best/worst leg (darts used) | Derivable from visits + legBoundaries. Per-leg darts function defined below. |
| STAT-07 | Lifetime statistics per profile | Aggregate by scanning `db.matches` for matching `player.id === String(profile.id)`. Recompute-from-history approach (D-09). |
| STAT-08 | Statistics dashboard with charts | New `/stats` route; hand-rolled SVG charts (no library). 3 chart types + win-rate KPI. |
| ACHV-01 | Detect new personal records during play | Load profile's recomputed records at match start; compare after each relevant dispatch. |
| ACHV-02 | Celebrate new records live on both views | BroadcastChannel: new message type `'record-event'`; both `/match` and `/display` mount `RecordOverlay`. |
| ACHV-03 | Records stored permanently in player statistics | Derived from match history (D-09) — records emerge automatically from `db.matches` queries. No extra table needed. |
</phase_requirements>

---

## Summary

Phase 4 layers statistics and achievement detection onto a complete, well-structured codebase. The engine's `Visit` type already captures everything needed: `darts`, `dartsAtDouble`, and `bust`. The core engineering challenge is **cross-leg match average**: `player.remaining` resets to `startScore` at each leg boundary, so the current `computeAverage(all_visits, startScore, remaining)` only reflects the current leg for multi-leg matches. The fix is adding a non-breaking `legCompleted: { dartsThrown: number; scored: number }[]` accumulator field to `PlayerState` and updating the reducer's leg-close path.

Lifetime statistics require no new Dexie table. Matches are already stored as full `MatchState` blobs; aggregation scans `db.matches` and applies the same pure stat functions. Records are the maximums/minimums of lifetime stats — they emerge from the aggregation, not from a separate record store.

Record detection during play requires loading the profile's current records at match start (a one-time Dexie read), then comparing after each visit close in `MatchStore.dispatch`. Record events are broadcast over the existing `BroadcastChannel` as a new message type.

Charts are hand-rolled SVG — no chart library. Three chart types (horizontal bar, line, bar) cover all STAT-08 requirements. The patterns are straightforward SVG `<rect>` and `<polyline>` scaled to a fixed viewBox.

**Primary recommendation:** Add `legCompleted` accumulator to `PlayerState` (non-breaking); write all stats as pure functions in `averages.ts`; hook record detection into `MatchStore.dispatch`; broadcast over existing `BroadcastChannel`; aggregate lifetime stats via `liveQuery` scan at the `/stats` route.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stats computation (avg, bands, checkout %) | Engine (`src/engine/`) | — | Pure functions over `MatchState`; must be unit-tested before UI |
| Cross-leg accumulation | Engine (reducer + PlayerState) | — | State must be carried in the serialized match blob so crashed/resumed matches retain it |
| Record detection | Store (`MatchStore.dispatch`) | — | Needs access to both live match state and pre-loaded profile records |
| Record broadcast | Store (BroadcastChannel in dispatch) | — | Already the broadcast point for all state changes |
| Live stat drawer | Input UI (`/match`) | — | Input-view only (D-01); drawer holds live computed stats |
| Record overlay (both views) | UI overlays + DisplayStore listener | — | Must appear on both `/match` and `/display` |
| Lifetime aggregation | DB layer (`src/db/`) | — | `liveQuery` → Svelte readable pattern already established |
| Charts | UI (`src/ui/stats/`) | — | SVG components; pure display, no logic |
| `/stats` route | Routes (`src/routes/stats/`) | — | New SvelteKit route with profile picker + ProfileStatDashboard |

---

## Standard Stack

### Core

No new runtime dependencies are required for this phase. All computation uses the existing engine. No charting library is introduced.

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| `dexie` | 4.4.3 (installed) | Lifetime aggregation via `db.matches` scan | Already in `package.json` |
| `svelte` | 5.56.3 (installed) | `$state`, `$derived`, `$effect` for drawer + overlay | Already in `package.json` |
| `@sveltejs/kit` | 2.64.0 (installed) | New `/stats` route | Already in `package.json` |

**No new npm packages.** The UI-SPEC explicitly prohibits chart libraries. Records and aggregation use only existing Dexie + engine primitives.

### Supporting (existing — no new installs)

| Pattern | File | Used For |
|---------|------|---------|
| `liveQuery` → Svelte `readable` | `src/db/matches.ts` pattern | Lifetime stats reactive query |
| `BroadcastChannel` | `src/stores/match.svelte.ts` | Record event broadcast |
| Pure reducer pattern | `src/engine/averages.ts` | All new stat functions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled SVG charts | Chart.js / D3 | Chart.js adds ~60 KB gzipped; D3 adds ~50 KB. Both contradict CLAUDE.md "smallest runtime" and UI-SPEC explicit prohibition. Hand-rolled SVG is idiomatic (same approach as the dartboard). |
| Recompute-from-history (D-09) | Stored aggregate table | Stored aggregates require a migration strategy and can go stale. Recompute is always consistent with visible history and requires no Dexie schema change. Acceptable: match counts per profile will remain small (home play). |
| `legCompleted` accumulator on PlayerState | `legBoundaries` index list | Boundaries list grows unboundedly; an accumulator of `{dartsThrown, scored}` per completed leg is O(1) to query and directly maps to the average formula. |

**Installation:** None required.

---

## Package Legitimacy Audit

> No new packages are introduced in Phase 4. This section is not applicable.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none

---

## Architecture Patterns

### System Architecture Diagram

```
MATCH INPUT VIEW                    SPECTATOR VIEW (/display)
─────────────────                   ─────────────────────────
User dart/numpad entry
  │
  ▼
MatchStore.dispatch(action)
  │
  ├─► pure reducer → new MatchState
  │     (PlayerState.legCompleted updated at leg close)
  │
  ├─► BroadcastChannel.postMessage(snapshot)  ──────────────────► DisplayStore.state updated
  │                                                                 RecordOverlay renders
  │
  ├─► [if record detected]:
  │     BroadcastChannel.postMessage({type:'record-event', records:[...]})
  │     RecordOverlay renders on /match
  │
  └─► [if match-complete]:
        #persistCompletedMatch → db.matches.add(matchRecord)
        → liveQuery fires on /stats → ProfileStatDashboard re-renders


/stats ROUTE (new)
──────────────────
onMount: db.profiles.toArray() → profile picker
profile selected → db.matches.where('winnerId'...).toArray() + scan all matches for player.id
  │
  ├─► computeLifetimeStats(matches, profileId) → LifetimeStats
  │     (pure function over MatchState blobs)
  └─► ProfileStatDashboard renders: KPI tiles + SVG charts


RECORD DETECTION (per dispatch)
────────────────────────────────
MatchStore loaded with preloadedRecords at match start:
  preloadedRecords = await computeLifetimeStats(priorMatches, profileId)

After each CONFIRM_VISIT / auto-finalize:
  currentStats = computeLiveStats(matchStore.state, playerIdx)
  compare currentStats vs preloadedRecords
  → if new record: collect, combine, broadcast
```

### Recommended Project Structure

```
src/
├── engine/
│   ├── averages.ts          (extend: matchAverageCrossLeg, first9Average, visitScore, scoreBands, checkoutPct, perLegDarts)
│   └── types.ts             (extend PlayerState: add legCompleted field)
├── db/
│   └── stats.ts             (new: computeLifetimeStats, liveStatsQuery)
├── stores/
│   └── match.svelte.ts      (extend: preloadedRecords, record detection hook, record broadcast)
├── ui/
│   ├── input/
│   │   └── StatDrawer.svelte        (new)
│   ├── overlays/
│   │   └── RecordOverlay.svelte     (new)
│   ├── stats/
│   │   ├── StatCard.svelte          (new)
│   │   ├── ScoreDistributionChart.svelte (new)
│   │   ├── AverageTrendChart.svelte (new)
│   │   ├── DartsPerLegChart.svelte  (new)
│   │   └── ProfileStatDashboard.svelte  (new)
│   ├── history/
│   │   └── MatchStatBreakdown.svelte    (new — fills .phase4-region)
│   └── display/
│       ├── LegWinBanner.svelte      (extend: add recordBadge? prop)
│       └── MatchWinDisplay.svelte   (extend: add recordBadge? prop)
└── routes/
    ├── stats/
    │   └── +page.svelte             (new: profile picker → ProfileStatDashboard)
    ├── match/
    │   └── +page.svelte             (extend: mount StatDrawer, RecordOverlay)
    └── display/
        └── +page.svelte             (extend: mount RecordOverlay)
```

---

### Pattern 1: Cross-Leg Match Average (STAT-01 core problem)

**What:** `player.remaining` resets to `startScore` at each leg boundary. The existing `matchAverage(all_visits, startScore, remaining)` computes `scored = startScore - remaining`, which only reflects the current leg. For a 3-leg match the prior two legs' scoring is invisible.

**Root cause confirmed in code:** `PlayerStatRow.svelte` line 38 already acknowledges this: `if (totalLegsPlayed > 1) return '—'`.

**Fix: Add `legCompleted` accumulator to `PlayerState`.**

Extend `src/engine/types.ts`:
```typescript
// Source: codebase audit — types.ts line comments say "DO NOT rename fields"
// This is an additive field; existing serialized blobs without it are treated as legCompleted=[]
export interface PlayerState {
  // ... existing fields unchanged ...
  /** Accumulated stats for each completed leg. Populated by reducer at leg close. Added Phase 4. */
  legCompleted?: Array<{ dartsThrown: number; scored: number }>;
}
```

Update `src/engine/reducer.ts` — in `handleLegWinFromPlayers`, before resetting `remaining`, compute and push to `legCompleted`:
```typescript
// Source: codebase audit — reducer.ts handleLegWinFromPlayers
// At leg close: compute darts thrown and scored for the closing leg
function buildLegCompleted(player: PlayerState, startScore: number): { dartsThrown: number; scored: number } {
  const legStart = /* legStartVisitIndex[player.id] from current state */ 0;
  const legVisits = player.visits.slice(legStart);
  const dartsThrown = legVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
  // scored = startScore - player.remaining (before reset)
  const scored = startScore - player.remaining;
  return { dartsThrown, scored };
}
```

New pure function in `averages.ts`:
```typescript
// Source: codebase audit — averages.ts pattern
export function matchAverageCrossLeg(player: PlayerState, config: MatchConfig): number | null {
  // Sum across all completed legs
  const completedDarts = (player.legCompleted ?? []).reduce((s, l) => s + l.dartsThrown, 0);
  const completedScored = (player.legCompleted ?? []).reduce((s, l) => s + l.scored, 0);
  // Add current leg
  const legStart = currentLegStartIndex; // passed as parameter
  const legVisits = player.visits.slice(legStart);
  const currentDarts = legVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
  const currentScored = config.startScore - player.remaining;
  const totalDarts = completedDarts + currentDarts;
  const totalScored = completedScored + currentScored;
  if (totalDarts === 0) return null;
  return (totalScored / totalDarts) * 3;
}
```

**Backward compatibility:** `legCompleted` is optional (`?`). Existing serialized `MatchState` blobs in `db.matches` that lack the field are treated as `[]` — the average correctly falls back to the current-leg approximation for historical matches. No Dexie migration required because `MatchState` is stored as a JSON blob, not indexed.

**The UNDO path:** UNDO replays the entire event log from scratch via `reduce(initialState(), ...log)`. The reducer re-populates `legCompleted` from scratch on replay — no stale state issue.

---

### Pattern 2: Visit Score Computation (for score bands, STAT-04)

**What:** Computing the numeric score of a visit for band classification.

**Key insight from codebase:** For `DART_THROWN` visits, `visit.darts` has 1–3 `DartScore` entries. For `NUMPAD_VISIT` visits, `visit.darts` is `[]` and the score must be inferred from the surrounding state. However, for stat purposes (score bands) we only care about non-bust visits with a known score.

**Approach:** For lifetime stats (processing completed `MatchState` blobs), reconstruct visit scores by replaying the score deltas. The simplest approach: for each player, walk `visits` in order tracking `running_remaining`, and for each visit compute `score = prev_remaining - new_remaining`.

```typescript
// Source: codebase audit — types.ts Visit interface
export function visitScore(visit: Visit): number {
  // Board entry: sum dart values
  if (visit.darts.length > 0) {
    return visit.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
  }
  // Numpad entry: 0 darts recorded — score is unavailable without context
  return -1; // sentinel: caller must derive from remaining delta
}
```

For lifetime processing, use the remaining-delta approach:

```typescript
// Source: codebase audit — averages.ts, reducer.ts
export function visitScoresFromState(player: PlayerState, startScore: number): number[] {
  const scores: number[] = [];
  let remaining = startScore;
  let legScoreBase = startScore;
  // legStartVisitIndex only captures the CURRENT leg — for lifetime processing we need all boundaries.
  // legCompleted[] gives us the boundary info: after each completed leg, remaining reset to startScore.
  let legIdx = 0;
  const completed = player.legCompleted ?? [];
  
  for (let i = 0; i < player.visits.length; i++) {
    const v = player.visits[i];
    if (v.bust) {
      scores.push(0); // bust: 0 scored
      continue;
    }
    let score: number;
    if (v.darts.length > 0) {
      score = v.darts.reduce((s, d) => s + d.multiplier * d.segment, 0);
    } else {
      // Numpad: must use remaining delta — but remaining is already committed at visit end
      // We track remaining ourselves here
      score = remaining - (remaining - /* next remaining */ 0); // placeholder
    }
    // Simplified: use darts where available, else mark as numpad
    scores.push(score);
  }
  return scores;
}
```

**Practical note for planner:** For score bands (counting 180s, 140+, 100+, 60+), board-entered visits have exact dart scores. Numpad-entered visits have `darts: []` — for these, the visit score must be reconstructed by tracking the remaining delta. The planner should use a `remainingTracker` that walks visits in leg order, resetting at each leg boundary (using `legCompleted` lengths to detect leg boundaries).

---

### Pattern 3: Checkout Percentage (STAT-03)

**Definition (locked in REQUIREMENTS.md STAT-03):** `doubles hit / darts at double`

**Darts at double:** Already captured in `Visit.dartsAtDouble` for both board (incremented per dart thrown at a double) and numpad (prompted via `DartsAtDoubleDialog` for finishing visits).

**Doubles hit:** A "double hit" is when a leg is won via a double finish. In the existing code, a leg win from a `DART_THROWN` path records `dartsAtDouble: 0` (no double tracking on the winning dart itself — confirmed in `reducer.ts` line 165: `const winVisit: Visit = { darts: newVisit, dartsAtDouble: 0, bust: false }`). For `NUMPAD_VISIT` finishing visits, `dartsAtDouble` is captured from the dialog.

**Edge case resolved:** For `outRule === 'single'`, checkout % is undefined (no double required). The planner should show "N/A" for single-out matches rather than computing a meaningless value.

**Detection of leg-winning visits:** A leg-winning visit is the last visit before `legCompleted` is appended — i.e., the visit at index `legCompleted[n].dartsThrown` is the boundary. Alternatively: scan `player.visits` for the visit where a leg boundary exists.

**Simpler approach for the planner:** Add a `wasCheckout: boolean` field to `Visit` (alongside `dartsAtDouble`), set to `true` when the visit closes a leg with `remaining === 0` and `outRule === 'double'`. This makes checkout detection O(1) per visit rather than requiring leg boundary math.

Actually — checking the reducer more carefully: this flag can be derived at leg close time without modifying `Visit`. The planner should add `wasCheckout?: boolean` to `Visit` in `types.ts` (additive, optional, backward-compatible).

**Checkout % formula:**
```typescript
// Source: codebase audit — types.ts, reducer.ts
export function checkoutPercent(visits: Visit[], outRule: OutRule): number | null {
  if (outRule === 'single') return null;
  const dartsAtDouble = visits.reduce((s, v) => s + v.dartsAtDouble, 0);
  if (dartsAtDouble === 0) return null;
  const doublesHit = visits.filter(v => v.wasCheckout === true).length;
  return (doublesHit / dartsAtDouble) * 100;
}
```

---

### Pattern 4: Score Bands (STAT-04)

**Thresholds from REQUIREMENTS.md:** 180s, 140+, 100+, 60+.

**What counts:** Per-visit score. Busts count as the score attempted, not 0 — WAIT, no. A bust means the score is not counted (the visit's score is effectively 0 for the player's progress). For score bands, should busts count? Standard darts convention: busts are ignored for average-purposes (0 scored, 3 darts charged) but for score bands (bragging rights), the typical convention is to count only non-bust visits. CONTEXT.md does not specify — use non-bust visits only (conservative, correct for spectator display).

```typescript
// Source: codebase audit — averages.ts pattern; standard darts stat conventions [ASSUMED]
export interface ScoreBands {
  count180: number;    // exactly 180
  count140plus: number; // 140-179
  count100plus: number; // 100-139
  count60plus: number;  // 60-99
}

export function computeScoreBands(visitScores: number[]): ScoreBands {
  const bands: ScoreBands = { count180: 0, count140plus: 0, count100plus: 0, count60plus: 0 };
  for (const score of visitScores) {
    if (score === 180) bands.count180++;
    else if (score >= 140) bands.count140plus++;
    else if (score >= 100) bands.count100plus++;
    else if (score >= 60) bands.count60plus++;
  }
  return bands;
}
```

**Scope:** Score bands apply to non-bust, non-zero visits. The input is `visitScores: number[]` derived from the remaining-delta tracker, filtering bust visits.

---

### Pattern 5: Per-Leg Darts (Best/Worst Leg — STAT-05)

**What:** The number of darts thrown in each leg. Best leg = fewest darts.

**Data available:** `legCompleted[i].dartsThrown` for completed legs. For the current leg (not yet in `legCompleted`): sum darts from `visits.slice(legStartVisitIndex[player.id])`.

```typescript
// Source: codebase audit — reducer.ts handleLegWinFromPlayers
export function dartsPerLeg(player: PlayerState, currentLegStart: number): number[] {
  const completed = (player.legCompleted ?? []).map(l => l.dartsThrown);
  // Add current leg
  const currentLegVisits = player.visits.slice(currentLegStart);
  const currentDarts = currentLegVisits.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
  if (currentDarts > 0) {
    return [...completed, currentDarts];
  }
  return completed;
}

export function bestLeg(player: PlayerState, currentLegStart: number): number | null {
  const legs = dartsPerLeg(player, currentLegStart);
  return legs.length > 0 ? Math.min(...legs) : null;
}

export function worstLeg(player: PlayerState, currentLegStart: number): number | null {
  const legs = dartsPerLeg(player, currentLegStart);
  return legs.length > 0 ? Math.max(...legs) : null;
}
```

---

### Pattern 6: First-9 Average (STAT-02)

**Definition:** 3-dart average over the first 9 darts (= first 3 visits) of a leg or match.

**Leg first-9:** Slice 3 visits from `legStartVisitIndex[player.id]`:
```typescript
// Source: codebase audit — averages.ts, standard darts stat convention [ASSUMED]
export function first9Average(player: PlayerState, legStartIdx: number, startScore: number): number | null {
  const legVisits = player.visits.slice(legStartIdx);
  const first3 = legVisits.slice(0, 3);
  if (first3.length === 0) return null;
  // Compute score of first 3 visits
  // Use remaining-delta approach if mixed board/numpad
  const darts = first3.reduce((s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0);
  // scored = startScore minus remaining after 3rd visit
  // For live computation, track running remaining
  // For simplicity: use visitScore sum for board visits only; numpad visits contribute exact delta
  // → This requires the remaining-delta tracker (same as visitScoresFromState)
  if (darts === 0) return null;
  const scored = first3.reduce((s, v) => {
    if (v.bust) return s;
    if (v.darts.length > 0) return s + v.darts.reduce((ds, d) => ds + d.multiplier * d.segment, 0);
    return s; // numpad: need external scoring — planner must handle
  }, 0);
  return (scored / darts) * 3;
}
```

**Practical note:** For match first-9, take the first 3 visits of the entire match (all-time visit slice from index 0). This is unambiguous. For leg first-9, the player may not have thrown 3 visits yet — return `null` until 3 visits are complete.

**The numpad-only-visit scoring problem for first-9:** If the first 3 visits are numpad entries (`darts: []`), the score per visit is not in `visit.darts`. The visit score must come from the remaining delta — which is tracked live in the match state. For live (in-match) computation, the planner should pass the live visit score array (computed from `remaining` deltas per visit). For lifetime computation (over blobs), the remaining-delta tracker handles this.

---

### Pattern 7: Record Detection Hook in MatchStore

**When to detect:**
- After each visit closes (`visits.length` increases): check highest visit score, 180 detection.
- After each leg closes (detected by `legCompleted.length` increasing): check best leg (darts), highest checkout.
- After match completes (`phase === 'match-complete'`): check highest match average.

**Pre-loading records at match start:**
```typescript
// Source: codebase audit — match.svelte.ts, db/matches.ts
// In match setup (before first DART_THROWN), load the profile's historical records:
async function loadProfileRecords(profileId: string): Promise<ProfileRecords> {
  const matches = await db.matches
    .filter(m => m.state.players.some(p => p.id === profileId))
    .toArray();
  return computeLifetimeStats(matches, profileId);
}
```

**Where to attach:** `MatchStore` gains a `preloadedRecords: Map<string, ProfileRecords>` (keyed by player.id, profile players only). Populated when the match starts (in a new `loadRecords(state: MatchState)` method called from the match route's `onMount`).

**Detection logic in `dispatch()`:**
```typescript
// Source: codebase audit — match.svelte.ts
// After this.state = reduce(...):
const records = this.#detectRecords(prevState, this.state);
if (records.length > 0) {
  this.#broadcastRecordEvent(records);
}
```

**BroadcastChannel record event:**
```typescript
// Source: codebase audit — match.svelte.ts
const RECORD_EVENT = 'neverman-record';

// New message type posted on the EXISTING channel (BC_CHANNEL = 'neverman-match'):
// { type: 'record-event', records: RecordItem[] }
// OR: use a separate BroadcastChannel named 'neverman-records' to avoid
// confusing the DisplayStore's MatchState message handler.
```

**Recommendation:** Use a **separate** `BroadcastChannel('neverman-record')` for record events so `DisplayStore`'s existing `message` handler (which casts `e.data` as `MatchState`) is not broken. The display route subscribes to both channels independently. [ASSUMED — architectural choice, either approach works]

---

### Pattern 8: Lifetime Stats Aggregation (STAT-07, D-09)

**Query:** All matches where the player participated (not necessarily winner):
```typescript
// Source: codebase audit — db/matches.ts, db.ts
// db.matches is indexed on completedAt and winnerId — NOT on all player ids.
// The winnerId index only finds matches where this profile won.
// For all matches: full scan with .filter()
const allMatches = await db.matches
  .filter(m => m.state.players.some(p => p.id === profileId))
  .toArray();
```

**Performance:** With small home-play match counts (tens to low hundreds), a full `db.matches` scan is acceptable. For future-proofing, adding a secondary index on player IDs would require a schema version bump — defer to Phase 6 if needed. [ASSUMED — performance acceptable for home-play scale]

**Reactive pattern:** Mirror `matchesLive()` from `src/db/matches.ts`:
```typescript
// Source: codebase audit — src/db/matches.ts lines 28-43
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

---

### Pattern 9: Hand-Rolled SVG Charts (STAT-08)

**Three chart types required per UI-SPEC:**

**Horizontal bar chart (ScoreDistributionChart, DartsPerLegChart):**
```svelte
<!-- Source: UI-SPEC chart contract; SVG standard [ASSUMED for exact viewBox values] -->
<svg role="img" aria-label="Score-Verteilung: {ariaDescription}" viewBox="0 0 300 160" width="100%">
  <!-- One <rect> per band, scaled to max count -->
  {#each bands as band, i}
    {@const barWidth = maxCount > 0 ? (band.count / maxCount) * 240 : 0}
    <rect x="55" y={i * 30 + 5} width={barWidth} height="20"
          fill={i === highlightIdx ? '#e8a020' : '#444'} />
    <text x="50" y={i * 30 + 19} text-anchor="end" font-size="12" fill="#888">{band.label}</text>
    <text x={60 + barWidth} y={i * 30 + 19} font-size="12" fill="#f0f0f0">{band.count}</text>
  {/each}
  <!-- Y axis line -->
  <line x1="55" y1="0" x2="55" y2="160" stroke="#444" stroke-width="1" />
</svg>
```

**Line chart (AverageTrendChart):**
```svelte
<!-- Source: UI-SPEC chart contract; SVG standard [ASSUMED for exact viewBox values] -->
<svg role="img" aria-label="Ø-Entwicklung: {ariaDescription}" viewBox="0 0 300 120" width="100%">
  <!-- Axes -->
  <line x1="30" y1="0" x2="30" y2="100" stroke="#444" />
  <line x1="30" y1="100" x2="300" y2="100" stroke="#444" />
  <!-- Data polyline — maps (matchIndex, average) to SVG coordinates -->
  {#if points.length >= 2}
    <polyline points={svgPoints} fill="none" stroke="#e8a020" stroke-width="2" />
  {:else}
    <text x="150" y="60" text-anchor="middle" font-size="14" fill="#888">Nicht genug Daten.</text>
  {/if}
  <!-- Tick labels -->
  {#each yTicks as tick}
    <text x="28" y={yScale(tick)} text-anchor="end" font-size="12" fill="#888">{tick}</text>
  {/each}
</svg>
```

**Win rate (not a chart — KPI display):**
```svelte
<!-- Source: UI-SPEC: "Single stat display, NOT a chart" -->
<div class="kpi-tile">
  <span class="kpi-value">{winRate}%</span>
  <span class="kpi-label">Gewinnrate</span>
</div>
```

**SVG chart coordinate math:**
- Horizontal bars: `barWidth = (value / maxValue) * availableWidth`
- Line chart Y: `y = chartHeight - ((value - minY) / (maxY - minY)) * chartHeight`
- Line chart X: `x = leftPad + (matchIndex / (count - 1)) * availableWidth`
- Edge case: if `maxY === minY`, render a flat horizontal line at midpoint.

---

### Pattern 10: RecordOverlay — Fold-Into-Win-Banner Logic (D-08)

**Decision tree (per UI-SPEC):**
1. Is a win banner currently showing (leg-win or match-win)? → YES: add `recordBadge` prop to win banner component; do NOT mount `RecordOverlay`.
2. Is this a standalone record (no coincident win)? → YES: mount `RecordOverlay` with auto-dismiss 2.5 s.
3. Is this a 180 with no new record? → show `RecordOverlay` with "180!" (D-04).
4. Is this a 180 AND a new record? → show combined: "180! · Neuer Rekord: Höchste Aufnahme".

**Detection of "coincident win":** The match route already tracks leg-win banners. Record detection runs after `dispatch()` in `MatchStore`. The route needs to know if the just-dispatched action caused a leg/match win. Check `matchStore.state.phase === 'leg-complete' || matchStore.state.phase === 'match-complete'` — if yes, pass record as `recordBadge` to the win banner instead of a standalone overlay.

**Note:** The reducer currently uses `phase: 'playing' | 'leg-complete' | 'match-complete'`. The `leg-complete` phase is transient — it exists briefly after a leg win. The match route already handles this (see `match/+page.svelte` `pendingCorrection` watch). The record detection system must similarly hook into this phase transition.

---

### Anti-Patterns to Avoid

- **Computing cross-leg average without legCompleted:** Using `computeAverage(all_visits, startScore, remaining)` for multi-leg matches produces wrong results because `remaining` resets. Always use `matchAverageCrossLeg()` with the accumulator. [VERIFIED: codebase audit — PlayerStatRow.svelte line 37 already shows "—" for this reason]
- **Adding a new Dexie stores() entry for records:** D-09 explicitly rejects this. Never add a `records` table. Records are always derived from `db.matches`.
- **Using `{@html}` for player names in stat displays:** T-03-05 security convention — all player names via `{interpolation}`. [VERIFIED: codebase audit — all existing components follow this]
- **BroadcastChannel channel leak:** The existing pattern opens a channel, posts, then immediately closes. Record broadcasts must follow this same one-shot pattern (not keep a persistent channel open from dispatch).
- **Forgetting UNDO invalidates current records:** After an UNDO dispatch, the live stats change. The record detection system must recompute after every dispatch, including UNDO. This is safe because UNDO replays the log and produces a new `MatchState` — comparing against `preloadedRecords` (which are history-only, unaffected by UNDO) is always correct.
- **Registering the record channel listener in display.svelte.ts without guard:** `DisplayStore.connect()` currently handles `MatchState` messages. Adding a second channel type must use a type discriminator or a separate channel to avoid casting errors.
- **Deriving checkout % for single-out matches:** `outRule === 'single'` → no double required → checkout % is meaningless. Return null and display "—".

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reactive lifetime query | Custom polling loop | `liveQuery` → Svelte `readable` | Already established pattern in `matchesLive()` / `profilesLive()`; handles Dexie failure gracefully |
| Cross-origin match sync | Custom protocol | Existing `BroadcastChannel('neverman-match')` + new `BroadcastChannel('neverman-record')` | Already deployed in match.svelte.ts; two channels avoids type collision with MatchState messages |
| SVG charts | `<canvas>` charts or D3 | Hand-rolled SVG `<rect>` / `<polyline>` | Consistent with dartboard approach; no dependency; smaller bundle; directly testable DOM |
| Dexie migration for records | New `records` table | Recompute from `db.matches` (D-09) | No migration code needed; always consistent with visible history |
| Custom animation library | CSS keyframe alternative | CSS `animation: fadeIn 250ms ease-out` + `max-height` transition | Already the pattern in LegWinBanner.svelte and all existing overlays |

**Key insight:** Every piece of infrastructure this phase needs already exists in the codebase. The phase is primarily about adding pure functions and connecting them to existing wiring — not about building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: legStartVisitIndex reflects ONLY the current leg

**What goes wrong:** Using `state.legStartVisitIndex[playerId]` to derive all leg boundaries. This field is updated at each leg close but only stores the SINGLE current value — not a history of all boundaries.

**Why it happens:** The reducer (line 336 in reducer.ts) overwrites `legStartVisitIndex` at each leg close with new values for the new leg. Prior leg start indices are not preserved.

**How to avoid:** Use `legCompleted[].dartsThrown` to reconstruct leg boundaries. The n-th leg's start visit index = sum of visits in legs 0..n-1. The reducer must populate `legCompleted` at each leg close (part of the Phase 4 reducer extension).

**Warning signs:** Match average displays correct value for single-leg matches but wrong (too low, or "—") value for multi-leg matches.

---

### Pitfall 2: NUMPAD_VISIT darts[] is empty — visit score not directly accessible

**What goes wrong:** Calling `visit.darts.reduce(...)` on a numpad visit returns 0 (empty array). Score bands and highest-visit tracking miss all numpad-entered visits.

**Why it happens:** `NUMPAD_VISIT` action stores `darts: []` in the `Visit` struct (reducer.ts line 231). The score is implicit from the player's `remaining` delta.

**How to avoid:** Always compute visit scores using the remaining-delta approach when processing a player's visit history. Walk visits in order, tracking `currentRemaining`, and for each visit: `score = prevRemaining - currentRemaining` (for non-bust visits). For bust visits, `score = 0` (remaining unchanged) and mark as excluded from band counts.

**Warning signs:** Score band counts are lower than expected; 180 detection misses numpad-entered 180s.

---

### Pitfall 3: Phase 'leg-complete' is transient — record detection timing

**What goes wrong:** Checking `state.phase === 'leg-complete'` to detect a leg close in a Svelte `$effect` may miss the transition if the correction window auto-advances phase quickly.

**Why it happens:** The CorrectionWindow auto-dismisses after 2.5 s and dispatches CONFIRM_VISIT. But CONFIRM_VISIT is a reducer no-op — the phase does not advance from `leg-complete` until a new `DART_THROWN` or `NUMPAD_VISIT` is dispatched. So the transition is less transient than it seems.

**How to avoid:** Detect leg close by watching `player.legCompleted.length` change (before vs after dispatch) inside `MatchStore.dispatch()`. This is synchronous and reliable regardless of phase timing.

**Warning signs:** Best-leg records never fire; checkout records never fire.

---

### Pitfall 4: Records preloaded at match start may be stale after profile deletion

**What goes wrong:** `preloadedRecords` loaded at match start may reference a profile that was deleted mid-match. (Unlikely in home play but not impossible.)

**Why it happens:** The preload is a snapshot at match start time.

**How to avoid:** Guard record comparison: only compare against preloaded records if `player.id` is still a profile player (not a guest). Guest players never trigger record detection (D-11). For robustness, catch errors in the record detection path and treat as "no records loaded" — play continues uninterrupted.

---

### Pitfall 5: BroadcastChannel type collision in DisplayStore

**What goes wrong:** Adding a record-event message to the existing `'neverman-match'` channel causes `DisplayStore` to cast it as `MatchState`, producing a corrupt state object or TypeScript error.

**Why it happens:** `display.svelte.ts` line 44 casts all messages as `MatchState`: `this.state = e.data as MatchState`. A record event message `{ type: 'record-event', records: [...] }` would be assigned to `displayStore.state`, breaking the spectator display.

**How to avoid:** Use a separate `BroadcastChannel('neverman-record')` for record events. The display route subscribes to this second channel independently. Document both channel names as constants in a shared `constants.ts` file.

---

### Pitfall 6: Omitting the 180-always-celebrates rule (D-04)

**What goes wrong:** Only broadcasting a record event when a new personal best is set. If a player's personal best is already 180, subsequent 180s never trigger the overlay.

**Why it happens:** Conflating "new record" detection with "180 detection". A 180 is a special case — it always celebrates (D-04) regardless of whether it's a personal best.

**How to avoid:** 180 detection is separate from record detection. After each visit close, check `visitScore === 180` independently of the record comparison. Always push "180!" to the current event list when a 180 occurs, then merge with any record items (D-07 combined card).

---

## Runtime State Inventory

> Included only if phase involves rename/refactor/migration. This is a greenfield feature addition phase — no runtime state migration required.

**Not applicable.** This phase adds new capabilities to existing data structures. The `legCompleted` field added to `PlayerState` is optional and defaults to `[]` for existing blobs — no migration needed. The `wasCheckout` field added to `Visit` is optional and defaults to `false` — no migration needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (2 projects: unit + browser) |
| Config file | `vite.config.ts` (root) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` (runs both unit + browser projects) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-01 | Cross-leg match average correct across 2+ legs | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 — extend averages.test.ts |
| STAT-01 | Live leg average for active player | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-02 | first-9 average for < 3, = 3, > 3 visits | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-03 | Checkout % formula: doubles hit / darts at double | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-03 | Checkout % returns null for single-out matches | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-04 | Score band counts for board visits | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-04 | Score band counts for numpad visits (remaining-delta approach) | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-05 | Best/worst leg from legCompleted | unit | `npm run test:unit -- --reporter=dot src/engine/averages.test.ts` | ❌ Wave 0 |
| STAT-07 | Lifetime aggregation: correct player.id filter | unit | `npm run test:unit -- --reporter=dot src/db/stats.test.ts` | ❌ Wave 0 |
| STAT-07 | Guest players excluded from lifetime stats | unit | `npm run test:unit -- --reporter=dot src/db/stats.test.ts` | ❌ Wave 0 |
| STAT-08 | Win rate calculation | unit | `npm run test:unit -- --reporter=dot src/db/stats.test.ts` | ❌ Wave 0 |
| ACHV-01 | New highest visit detected after dispatch | unit | `npm run test:unit -- --reporter=dot src/stores/match.svelte.test.ts` | ❌ Wave 0 — extend match.svelte.test.ts |
| ACHV-01 | 180 always celebrated even if not a new record | unit | `npm run test:unit -- --reporter=dot src/stores/match.svelte.test.ts` | ❌ Wave 0 |
| ACHV-02 | Record event posted on BroadcastChannel | unit | `npm run test:unit -- --reporter=dot src/stores/match.svelte.test.ts` | ❌ Wave 0 |
| STAT-01 | UNDO does not corrupt cross-leg average | unit | `npm run test:unit -- --reporter=dot src/engine/reducer.test.ts` | ❌ Wave 0 — extend reducer.test.ts |

### Sampling Rate

- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/engine/averages.test.ts` — extend with: `matchAverageCrossLeg`, `first9Average`, `checkoutPercent`, `computeScoreBands`, `bestLeg`, `worstLeg`
- [ ] `src/db/stats.test.ts` — new file; covers `computeLifetimeStats`, `profileStatsLive` with `fake-indexeddb`
- [ ] `src/stores/match.svelte.test.ts` — extend with: record detection hooks, 180 always-celebrate, BroadcastChannel record event (using `vi.stubGlobal` for BroadcastChannel, per existing test pattern in `display.svelte.test.ts`)
- [ ] `src/engine/reducer.test.ts` — extend with: `legCompleted` accumulator updated at leg close; UNDO replay preserves correct `legCompleted`; `wasCheckout` flag set on leg-winning visits

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Local single-user app |
| V5 Input Validation | Yes | All player names via `{interpolation}` only (no `{@html}`); stat values are numbers computed from trusted engine state — no string injection surface |
| V6 Cryptography | No | No secrets handled |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via player names in stat displays | Tampering | Svelte `{interpolation}` (T-03-05 convention, already established) — never use `{@html}` for names |
| IndexedDB data corruption via import | Tampering | Existing import validation (Phase 3) already validates JSON structure; stats are derived from trusted match blobs only |
| BroadcastChannel injection | Spoofing | Same-origin only — no cross-origin injection possible (same mitigation as Phase 2, T-02-01) |
| Infinite loop in record detection | Denial of Service | Record detection must not dispatch further actions from within `dispatch()` — only post to BroadcastChannel |

---

## Code Examples

### Cross-Leg Match Average (complete pattern)

```typescript
// Source: codebase audit — averages.ts pattern + reducer.ts leg-close path
// New field in types.ts (additive, optional):
// legCompleted?: Array<{ dartsThrown: number; scored: number }>;

// In reducer.ts handleLegWinFromPlayers — before resetting remaining:
function captureLegStats(
  player: PlayerState,
  legStartIdx: number,
  startScore: number
): { dartsThrown: number; scored: number } {
  const legVisits = player.visits.slice(legStartIdx);
  const dartsThrown = legVisits.reduce(
    (s, v) => s + (v.darts.length > 0 ? v.darts.length : 3), 0
  );
  const scored = startScore - player.remaining; // remaining not yet reset
  return { dartsThrown, scored };
}

// New pure function in averages.ts:
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

### Record Detection Skeleton

```typescript
// Source: codebase audit — match.svelte.ts dispatch pattern
// In MatchStore.dispatch():
dispatch(action: MatchAction): void {
  const prevState = this.state;
  this.state = reduce(this.state, action);
  
  // Existing: publish to spectator + localStorage
  this.#publish();
  
  // Phase 4: detect records
  const recordItems = this.#detectRecords(prevState, this.state);
  if (recordItems.length > 0) {
    this.#broadcastRecordEvent(recordItems);
    this.pendingRecords = recordItems; // reactive $state for RecordOverlay
  }
  
  if (this.state.phase === 'match-complete') {
    this.#persistCompletedMatch(this.state);
  }
}

#detectRecords(prev: MatchState, next: MatchState): RecordItem[] {
  const items: RecordItem[] = [];
  for (const player of next.players) {
    const profileRecords = this.preloadedRecords.get(player.id);
    if (!profileRecords || player.isGuest) continue;
    
    // 180 detection (D-04: always celebrate)
    const prevVisitCount = prev.players.find(p => p.id === player.id)?.visits.length ?? 0;
    if (player.visits.length > prevVisitCount) {
      const lastVisit = player.visits[player.visits.length - 1];
      if (!lastVisit.bust) {
        const score = computeVisitScore(lastVisit);
        if (score === 180) items.push({ playerId: player.id, type: '180' });
        // New highest visit check
        if (score > 0 && score > (profileRecords.highestVisit ?? 0) && score !== 180) {
          items.push({ playerId: player.id, type: 'highest-visit', value: score });
        }
      }
    }
    // ... leg-close and match-end checks similarly
  }
  return items;
}
```

### liveQuery → Readable (lifetime stats pattern)

```typescript
// Source: codebase audit — src/db/matches.ts lines 28-43 (exact mirror pattern)
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

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-leg match average (Phase 2 display) | Cross-leg accumulator in PlayerState | Phase 4 | PlayerStatRow.svelte and MatchWinDisplay.svelte can replace "—" with real value |
| No stats during play | Live stats in tappable drawer | Phase 4 | No layout change to scoring surface (D-01 drawer approach) |
| No record detection | Hook in MatchStore.dispatch | Phase 4 | Record events flow through existing BroadcastChannel infrastructure |

**Deprecated/outdated (within this codebase):**
- `PlayerStatRow.svelte` `avgDisplay` returning "—" for multi-leg matches: replaced once `matchAverageCrossLeg` is wired.
- `matchAverage()` called from `MatchWinDisplay.svelte`: replaced with `matchAverageCrossLeg()` so the final match average is correct.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Score bands exclude bust visits (score = 0 treated as not counted) | Pattern 4 — Score Bands | Low: bust-inclusive counting would inflate bands slightly; fix is a one-line filter change |
| A2 | A separate `BroadcastChannel('neverman-record')` is cleaner than adding a discriminated union to `'neverman-match'` | Pattern 7, Pitfall 5 | Low: either approach works; choosing one channel adds a type guard to DisplayStore; choosing two channels is architecturally cleaner |
| A3 | Home-play match count (tens to low hundreds) makes a full `db.matches` scan acceptable for lifetime aggregation | Pattern 8 | Low: if match count grows into thousands, add a secondary index in a future Dexie v3 bump |
| A4 | first-9 average uses first 3 VISITS (not first 9 individual darts for board mode) | Pattern 6 | Medium: if any visits are numpad visits with dartsUsed ≠ 3, "first 9 darts" ≠ "first 3 visits". Standard darts convention treats first-9 as first 3 visits regardless. Planner should note this edge case. |
| A5 | `wasCheckout: boolean` added to Visit is the cleanest way to detect leg-winning visits for checkout % | Pattern 3 | Low: alternatively derive from legCompleted boundaries — either works; wasCheckout is simpler |

**A4 requires user confirmation if first-9 should count actual darts rather than visits** — for a numpad visit with `dartsUsed: 1`, "first 9 darts" would span more than 3 visits. Standard tournament definition uses visits (3 × 3 = 9 darts, assuming 3 darts per visit). The planner should use visit-based first-9 for simplicity and note this is the standard convention.

---

## Open Questions

1. **first-9 average for mixed board/numpad input with dartsUsed ≠ 3**
   - What we know: `NUMPAD_VISIT` captures `dartsUsed?: 1 | 2 | 3`. A 2-dart or 1-dart numpad finish could be the 3rd visit of the first-9 window.
   - What's unclear: Should first-9 use the first 9 actual darts (spanning more than 3 visits if a finish visit uses fewer), or the first 3 visits?
   - Recommendation: Use first 3 VISITS for simplicity (standard tournament definition). The planner should document this choice in the plan.

2. **Highest visit: should bust visits count?**
   - What we know: A bust reverts score. A 180 bust (three T20s followed by a bust dart) still hit 180 before busting — but `Visit.bust = true` and the score is not counted.
   - What's unclear: Whether "highest visit" in D-03 refers to the intended score or the scored score.
   - Recommendation: Count only non-bust visit scores (scored = actual change in remaining). This is the conservative and correct statistical interpretation. A bust visit's "score" of e.g. 180+1 is not actually scored.

---

## Environment Availability

No external tool dependencies. All computation is in-process. No new CLI tools, build tools, or external services required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (for Vitest) | Test suite | ✓ | detected (project running) | — |
| Chromium (for browser tests) | `npm run test:browser` | ✓ | installed via Playwright | — |

---

## Sources

### Primary (HIGH confidence — codebase audit)

- `src/engine/types.ts` — `Visit`, `PlayerState`, `MatchState`, `legStartVisitIndex` shapes confirmed via Read tool
- `src/engine/averages.ts` — `computeAverage`, `legAverage`, `matchAverage`; cross-leg limitation documented in source code itself
- `src/engine/reducer.ts` — `handleLegWinFromPlayers`, `applyDartThrown`, `applyNumpadVisit`; `legStartVisitIndex` update logic confirmed
- `src/db/db.ts` — Dexie v1/v2 schema; `MatchRecord.state` is full JSON blob; v3 convention documented in comments
- `src/db/matches.ts` — `matchesLive()`, `liveQuery` → readable pattern; confirmed mirror target for `profileStatsLive()`
- `src/stores/match.svelte.ts` — `dispatch()`, `#persistCompletedMatch`, BroadcastChannel one-shot pattern; `BC_CHANNEL` and `LS_SNAPSHOT` constants
- `src/stores/display.svelte.ts` — `DisplayStore`, `connect()`, message handler; confirmed type-cast vulnerability to record events
- `src/ui/display/LegWinBanner.svelte` — animation keyframe, z-index, `recordBadge` insertion point
- `src/ui/display/MatchWinDisplay.svelte` — `matchAverage()` call site that will be updated to `matchAverageCrossLeg()`
- `src/ui/overlays/MatchWinOverlay.svelte` — z-index 100; record overlay must be z-index 50 per UI-SPEC
- `src/ui/history/PlayerStatRow.svelte` — "—" display for multi-leg matches confirmed at line 37
- `src/routes/history/[id]/+page.svelte` — `.phase4-region` div confirmed at line 112
- `src/routes/+page.svelte` — menu structure confirmed; 4th button slot available
- `src/routes/match/+page.svelte` — `pendingCorrection` pattern; stat drawer insertion point is between ScorePanel and VisitStrip/board area
- `package.json` — all installed packages; no chart library present; `fake-indexeddb` present for unit tests
- `vite.config.ts` — 2-project Vitest setup; `unit` project covers `src/**/*.test.ts` excluding `src/ui/**`; `browser` project covers `src/ui/**`
- `.planning/config.json` — `nyquist_validation: true`, `security_enforcement: true`

### Secondary (MEDIUM confidence — UI-SPEC and CONTEXT.md)

- `04-UI-SPEC.md` — component list, chart contract, animation timings, copywriting, z-index values, color tokens
- `04-CONTEXT.md` — all locked decisions (D-01..D-11) and discretion areas

### Tertiary (LOW confidence — standard conventions)

- Standard darts 3-dart average definition: `(totalScored / dartsThrown) * 3` [ASSUMED — widely accepted industry standard]
- Score band thresholds (180, 140+, 100+, 60+): from REQUIREMENTS.md STAT-04 [VERIFIED: codebase]
- first-9 average = first 3 visits [ASSUMED — standard tournament definition, confirmed by A4 note]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all existing confirmed via package.json
- Architecture: HIGH — grounded in actual codebase reading of all relevant files
- Engine patterns (cross-leg avg, score bands, checkout %): HIGH — derived from actual code; cross-leg limitation confirmed in PlayerStatRow.svelte source
- SVG chart patterns: MEDIUM — standard SVG knowledge, exact viewBox values are planner's choice
- Performance (db.matches scan): MEDIUM — acceptable assumption for home-play scale
- first-9 definition edge case: MEDIUM — standard convention, one open question flagged

**Research date:** 2026-06-12
**Valid until:** 2026-09-12 (stable stack; SvelteKit / Dexie / Svelte 5 APIs are stable)
