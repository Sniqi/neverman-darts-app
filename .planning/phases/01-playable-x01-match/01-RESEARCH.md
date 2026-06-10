# Phase 1: Playable X01 Match - Research

**Researched:** 2026-06-10
**Domain:** SvelteKit 2 + Svelte 5 runes scaffolding, X01 darts engine (reducer pattern), SVG dartboard touch hit-detection, Dexie 4 IndexedDB, Wake Lock API
**Confidence:** MEDIUM (framework patterns from official docs; darts domain rules from authoritative web sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dartboard input ergonomics**
- D-01: Triple/double rings drawn enlarged (roughly 2-3x realistic width). The board is deliberately stylized so every segment is reliably finger-hittable.
- D-02: Scoring view is responsive for both orientations: portrait (scores on top, board below) and landscape (board beside score panel).
- D-03: Dart taps register instantly -- no confirm step. The hit segment flashes/highlights and the dart appears in a visit strip. Mistakes fixed via undo.
- D-04: Miss entry: tapping the outer area of the SVG (outside the double ring but inside the board area) counts as miss (0). No dedicated miss button.

**Visit flow, correction & undo**
- D-05: Correction window (INP-04): after a visit ends, the visit summary shows for ~2-3 seconds with darts still editable, then the turn passes automatically. Tapping the summary keeps it open for corrections.
- D-06: Undo is per dart and unlimited (ENG-05): each undo removes exactly one dart, stepping back through visits, legs, and sets without limit. The event-log reducer makes this the single mental model.
- D-07: Numpad coexistence (INP-02): a toggle on the scoring view flips between dartboard and numpad; the app remembers the last-used input mode per player within the match.
- D-08: Darts-at-double capture (INP-03): only when a numpad-entered visit wins a leg, a quick dialog asks darts used and darts thrown at a double. Non-finishing numpad visits assume 3 darts, 0 at double.

**Checkout suggestions**
- D-09: Compact suggestion line beside the active player's remaining score. Always visible when in finish range; never overlays the board.
- D-10: A single route is shown, recalculated live after every dart.
- D-11: Routes follow standard pro tournament checkout tables (T20-oriented setups, classic leaves like 32/40).
- D-12: Single Out mode also gets suggestions (any score <= 180 with a 3-dart route). In Double Out, bogey numbers (159, 162, 163, 165, 166, 168, 169) and scores > 170 show nothing.

**Match setup & bull-off**
- D-13: Setup is a single scrollable screen: player picker, mode chips (301/401/501), out-rule toggle, legs/sets steppers, start button.
- D-14: Format semantics: first-to legs (default: 501, Double Out, first to 3 legs, sets off). Sets can be enabled.
- D-15: Bull-off (ENG-06): user arranges ALL players into throwing order (tap in sequence or drag to sort).
- D-16: Profiles use Dexie/IndexedDB from day one (PROF-01): profile = name plus optional color/avatar initial. Guests are match-scoped, not persisted. Phase 3 extends the same DB.

### Claude's Discretion
- Exact correction-window duration (within the ~2-3 s band) and its visual treatment.
- Specific enlarged ring proportions -- tune for finger size on a typical 10" tablet.
- Which standard checkout table to encode (pick one consistent published table).
- Numpad layout details, invalid-total handling, undo button placement.
- Leg/set starter rotation (follow standard darts rules).

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENG-01 | X01 matches with 301/401/501 start scores, Single Out or Double Out finish rules | Pure reducer pattern; bust logic section |
| ENG-02 | Configurable legs and sets per match (first-to semantics) | Reducer state shape; match config type |
| ENG-03 | 1-4 players with correct turn rotation and alternating leg/set starters | Reducer action types; player rotation logic |
| ENG-04 | Bust (score<0, score=1 on double-out, score=0 on non-double) reverts visit | Bust detection patterns in reducer |
| ENG-05 | Unlimited undo per dart/visit including through leg/set wins | Event-log reducer; undo by popping log |
| ENG-06 | Bull-off result entry to set starting order | BullOffOrder component; drag-to-sort pattern |
| ENG-07 | Checkout suggestions; bogey numbers and >170 show nothing | Checkout table encoding; suggestion lookup |
| INP-01 | On-screen dartboard with all segments reliably hittable by finger | SVG + polar-math hit detection pattern |
| INP-02 | Numpad visit-total entry as alternative input | Numpad component; impossible-score validation |
| INP-03 | Track darts thrown at a double for checkout % | DartsAtDoubleDialog; per-dart event data |
| INP-04 | Visit auto-finalizes with correction window before turn passes | CorrectionWindow component; timer pattern |
| INP-05 | Screen stays awake during match (wake lock) | Wake Lock API pattern; visibilitychange re-acquire |
| FLOW-01 | Match setup: players/guests, mode, out rules, legs/sets, starting order | MatchSetup + BullOffOrder component flow |
| PROF-01 | Create/edit/delete persistent player profiles | Dexie profiles table; ProfileManager component |
| PROF-02 | Guest players: match-scoped, not persisted | Match state; guest player type without DB write |
</phase_requirements>

---

## Summary

Phase 1 scaffolds a complete greenfield SvelteKit 2 project and implements a fully playable X01 darts match. The stack is pre-decided by CLAUDE.md: SvelteKit 2.64.0 + Svelte 5.56.3 runes, TypeScript ~5.9.3, Dexie 4.4.3, and Vitest 4.1.8. No library selection decisions remain -- the research focus is on implementation patterns within the locked stack.

The engine is a pure reducer `reduce(state: MatchState, action: MatchAction) => MatchState` operating over an append-only event log. This is the single state model for the whole phase: bust handling, undo, leg/set counting, and dart tracking all flow through reducer actions. The reducer must be exhaustively unit-tested before any UI is built. The UI is Svelte 5 components that read from a class-based `.svelte.ts` store wrapping the reducer and dispatching actions.

The two technically complex sub-problems are: (1) the SVG dartboard with polar-coordinate hit detection, where visual SVG paths handle display but an invisible mathematical layer (getScreenCTM inverse + radius/angle) determines the scored segment -- and (2) the checkout suggestion table, which is a static 170-entry lookup object encoding the single recommended route per score. Both are well-understood patterns with no ambiguity on approach.

**Primary recommendation:** Build the reducer engine first (Wave 0-1), fully unit-tested. Then build the SVG dartboard component (Wave 2). Then wire the scoring view together (Wave 3). Then add profiles/DB and setup flow (Wave 4). This order maximizes early feedback on the hardest logic before investing in UI.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| X01 scoring rules, bust detection, leg/set counting | Pure TS module (engine) | -- | No DOM or framework dependency; pure functions; testable in Node |
| Undo / event log | Pure TS module (engine) | -- | Reducer pattern; state is an array of events |
| Checkout suggestion lookup | Pure TS module (engine) | -- | Static table; pure function; no side effects |
| SVG dartboard rendering + hit detection | Browser / Client (Svelte component) | -- | SVG DOM + Pointer Events; polar math runs in component |
| Match state (live game state) | Client store (.svelte.ts) | -- | Class-based $state; drives all components; serializable for Phase 2 BroadcastChannel |
| Player profiles (persistent) | Database / Storage (Dexie) | Client store | IndexedDB via Dexie; read into component state via liveQuery |
| Visit correction window timer | Browser / Client (Svelte component) | -- | setTimeout; component-local; no server involvement |
| Wake lock | Browser / Client (Svelte component or $effect) | -- | navigator.wakeLock; browser API; no server involvement |
| Routing (setup -> bull-off -> match) | Frontend (SvelteKit) | -- | SvelteKit file-based routing; adapter-static; client-side navigation |
| Numpad input + visit-total validation | Browser / Client (Svelte component) | -- | Pure client validation; impossible-score list is static |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sveltejs/kit` | 2.64.0 | App framework + file-based routing | Locked by CLAUDE.md; smallest runtime of mainstream options; static prerender via adapter-static [VERIFIED: npm registry] |
| `svelte` | 5.56.3 | UI components (runes) | Locked by CLAUDE.md; Svelte 5 runes give fine-grained reactivity without virtual DOM [VERIFIED: npm registry] |
| `@sveltejs/adapter-static` | 3.0.10 | Static export for GitHub Pages | Locked by CLAUDE.md; produces pure HTML/CSS/JS; no server runtime [VERIFIED: npm registry] |
| `typescript` | ~5.9.3 (NOT 6.0) | Type safety | Locked by CLAUDE.md; pin to ~5.9 -- TS 6.0.3 is on registry but svelte-check ecosystem compatibility unverified [VERIFIED: npm registry] |
| `dexie` | 4.4.3 | IndexedDB persistence for profiles | Locked by CLAUDE.md; typed schema versioning; liveQuery; promise API [VERIFIED: npm registry] |
| `vite` | (via SvelteKit) | Build tool | SvelteKit bundles Vite; no separate install needed [ASSUMED] |

### Supporting (Development)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.8 | Unit tests (engine, checkout tables) | All pure-logic tests; fast Node environment [VERIFIED: npm registry] |
| `@vitest/browser` | 4.1.8 | Browser-mode component tests | Dartboard hit-detection, pointer event tests; real browser behavior [VERIFIED: npm registry] |
| `vitest-browser-svelte` | 2.1.1 | Svelte component renderer for browser-mode tests | Renders .svelte components in browser test context [VERIFIED: npm registry] |
| `playwright` | 1.60.0 | Browser engine for Vitest browser mode + E2E | Required for vitest browser mode; run `npx playwright install` after install [VERIFIED: npm registry] |
| `svelte-check` | 4.6.0 | Type + template checking for .svelte files | Run in CI; catches Svelte template type errors [VERIFIED: npm registry] |
| `happy-dom` | 20.10.2 | Optional fast DOM for trivial render assertions | Only for simple markup checks; NOT for pointer/touch tests [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Class-based .svelte.ts store | Svelte 4 writable stores | Runes are the Svelte 5 way; class stores are cleaner for complex state with methods |
| Static checkout lookup table | Algorithmic checkout generator | Algorithm is complex to get right for all edge cases; static table is auditable and fast |
| Polar-math hit detection | SVG path `contains()` | Contains() has precision issues under scaling; polar math is deterministic and fast |
| Hand-rolled drag-to-reorder | SortableJS 1.15.7 (OK verdict) | Bull-off screen has 1-4 items max; hand-rolled pointer-event sort is ~30 lines and avoids a dependency |

**Installation:**
```bash
# Scaffold
npx sv create neverman-darts-app
# (select: SvelteKit minimal, TypeScript, Vitest, Playwright)

# Pin TypeScript to 5.9.x
npm install -D typescript@~5.9

# Core persistence
npm install dexie

# Testing (browser mode)
npm install -D @vitest/browser vitest-browser-svelte playwright
npx playwright install chromium
```

**Version verification:** All versions above confirmed against npm registry on 2026-06-10. [VERIFIED: npm registry]

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|--------------|-------------|---------|-------------|
| `@sveltejs/kit` | npm | 4+ yrs | 1,889,956 | github.com/sveltejs/kit | SUS (too-new patch) | Approved -- official Svelte org, massive downloads, "too-new" is latest patch release date |
| `svelte` | npm | 8+ yrs | 4,469,521 | github.com/sveltejs/svelte | SUS (too-new patch) | Approved -- core framework, official org |
| `@sveltejs/adapter-static` | npm | 3+ yrs | 587,163 | github.com/sveltejs/kit | OK | Approved |
| `dexie` | npm | 10+ yrs | 1,671,277 | github.com/dexie/Dexie.js | SUS (too-new patch) | Approved -- well-established IndexedDB wrapper, official org |
| `vitest` | npm | 3+ yrs | 64,617,933 | github.com/vitest-dev/vitest | SUS (too-new patch) | Approved -- official Vite ecosystem |
| `@vitest/browser` | npm | 2+ yrs | 6,269,538 | github.com/vitest-dev/vitest | SUS (too-new patch) | Approved -- same official vitest org |
| `vitest-browser-svelte` | npm | 1+ yr | 196,275 | github.com/vitest-community/vitest-browser-svelte | OK | Approved |
| `playwright` | npm | 5+ yrs | 57,637,599 | github.com/microsoft/playwright | SUS (too-new patch) | Approved -- Microsoft, massive adoption |
| `svelte-check` | npm | 4+ yrs | 1,705,458 | github.com/sveltejs/language-tools | SUS (too-new patch) | Approved -- official Svelte org |
| `typescript` | npm | 10+ yrs | 205,759,155 | github.com/microsoft/TypeScript | OK | Approved |
| `workbox-window` | npm | 6+ yrs | 7,735,337 | github.com/googlechrome/workbox | OK | Approved (Phase 6 -- not installed in Phase 1) |
| `happy-dom` | npm | 3+ yrs | 9,250,308 | github.com/capricorn86/happy-dom | SUS (too-new patch) | Approved -- widely used test DOM |
| `vite-plugin-pwa` | npm | 3+ yrs | 3,244,189 | github.com/vite-pwa/vite-plugin-pwa | OK | Approved (Phase 6 -- not installed in Phase 1) |

**Note on SUS verdicts:** All "SUS/too-new" flags are triggered by recent patch release dates for actively maintained packages from official organizations (sveltejs, vitest-dev, microsoft, googlechrome). These are authoritative packages, not suspicious ones. The flag reflects the legitimacy checker's recency heuristic, not actual risk.

**Packages removed due to SLOP verdict:** none
**Packages flagged as genuinely suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
User Input (tap/numpad)
        |
        v
[Dartboard.svelte / Numpad.svelte]
  pointerdown -> polar math -> DartSegment
        |
        v
[matchStore.dispatch(action)]   <-- .svelte.ts class store
  action: DART_THROWN | UNDO | VISIT_CONFIRMED | ...
        |
        v
[reduce(state, action) -> MatchState]   <-- pure TS, src/engine/
  bust detection, leg/set counting, turn rotation
        |
        v
[matchStore.$state updated]
        |
        +---> [ScorePanel.svelte]   reads remaining scores, legs/sets
        +---> [VisitStrip.svelte]   reads current visit darts
        +---> [CheckoutSuggestion]  reads remaining score -> lookup table
        +---> [CorrectionWindow]    reads just-completed visit
        |
        v (on profile operations)
[Dexie db.profiles]   <-- IndexedDB
  liveQuery -> reactive profile list in PlayerPicker
```

### Recommended Project Structure

```
src/
├── engine/
│   ├── types.ts             # MatchState, Player, Dart, MatchAction, MatchConfig
│   ├── reducer.ts           # reduce(state, action) -> state (pure, no imports from svelte)
│   ├── bust.ts              # isBust(remaining, dart, outRule) -> boolean
│   ├── checkout.ts          # CHECKOUT_TABLE: Record<number, string[]>; getSuggestion(n, outRule) -> string[]|null
│   ├── rotation.ts          # nextPlayer(), nextLegStarter() logic
│   └── impossible-scores.ts # IMPOSSIBLE_3DART: Set<number> for numpad validation
├── db/
│   └── db.ts                # Dexie AppDB class; profiles table; exported db singleton
├── stores/
│   └── match.svelte.ts      # class MatchStore { state=$state<MatchState>; dispatch(); } export const matchStore
├── routes/
│   ├── +layout.svelte        # Global CSS vars, dark mode body class
│   ├── +page.svelte          # Redirect to /setup or load match in progress (Phase 3)
│   ├── setup/
│   │   └── +page.svelte      # MatchSetup.svelte
│   ├── bulloff/
│   │   └── +page.svelte      # BullOffOrder.svelte
│   └── match/
│       └── +page.svelte      # Scoring view layout (portrait/landscape)
├── ui/
│   ├── input/
│   │   ├── Dartboard.svelte
│   │   ├── ScorePanel.svelte
│   │   ├── VisitStrip.svelte
│   │   ├── CheckoutSuggestion.svelte
│   │   ├── Numpad.svelte
│   │   ├── CorrectionWindow.svelte
│   │   └── DartsAtDoubleDialog.svelte
│   ├── setup/
│   │   ├── MatchSetup.svelte
│   │   ├── PlayerPicker.svelte
│   │   ├── BullOffOrder.svelte
│   │   └── ProfileManager.svelte
│   └── overlays/
│       └── MatchWinOverlay.svelte
├── lib/
│   └── wake-lock.svelte.ts  # wake lock acquire/release/re-acquire logic
└── app.html                  # SvelteKit app shell
static/
└── .nojekyll                # Prevents Jekyll on GitHub Pages
svelte.config.js             # adapter-static, paths.base
vite.config.ts               # sveltekit plugin, vitest config
```

### Pattern 1: Pure Reducer Engine

**What:** The match state machine is a pure function with zero framework dependencies. All X01 logic lives here.

**When to use:** All state transitions -- dart thrown, bust, undo, leg win, set win, match win.

```typescript
// Source: STATE.md decision + CLAUDE.md guidance
// src/engine/types.ts
export type OutRule = 'single' | 'double';

export interface DartScore {
  multiplier: 1 | 2 | 3;
  segment: number; // 0=miss, 1-20, 25=outer bull, 50=inner bull
}

export interface Visit {
  darts: DartScore[];
  dartsAtDouble: number;
  bust: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isGuest: boolean;
  remaining: number;
  legsWon: number;
  setsWon: number;
  visits: Visit[];
}

export interface MatchState {
  config: MatchConfig;
  players: PlayerState[];
  activePlayerIndex: number;
  legStarterIndex: number;
  currentVisit: DartScore[];
  phase: 'setup' | 'playing' | 'leg-complete' | 'match-complete';
  eventLog: MatchAction[];
}

// src/engine/reducer.ts
export function reduce(state: MatchState, action: MatchAction): MatchState {
  // Returns new state object -- never mutates
}
```

**Key insight:** The `eventLog` is appended to on every action. Undo = `reduce(initialState, ...log.slice(0, -1))`. Never reverse-engineer state -- replay.

### Pattern 2: Svelte 5 Class Store

**What:** A `.svelte.ts` class wraps the reducer and exposes typed dispatch, allowing any component to import `matchStore` and read reactive state.

**When to use:** All components that need to read or mutate match state.

```typescript
// Source: svelte.dev/docs/svelte/$state
// src/stores/match.svelte.ts
import { reduce, initialState } from '../engine/reducer.js';
import type { MatchAction, MatchState } from '../engine/types.js';

class MatchStore {
  state = $state<MatchState>(initialState());

  dispatch(action: MatchAction): void {
    this.state = reduce(this.state, action);
  }

  get activePlayer() {
    return $derived(this.state.players[this.state.activePlayerIndex]);
  }
}

export const matchStore = new MatchStore();
```

**Svelte component usage:**
```svelte
<!-- Any component -->
<script lang="ts">
  import { matchStore } from '$stores/match.svelte.js';
  const remaining = $derived(matchStore.state.players[matchStore.state.activePlayerIndex].remaining);
</script>
```

### Pattern 3: SVG Dartboard with Polar-Math Hit Detection

**What:** SVG renders visual board; `pointerdown` triggers polar-coordinate math to determine the scored segment.

**When to use:** All tap input on the dartboard.

```typescript
// Source: sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/
// and davidhamann.de/2023/01/13/svg-javascript-transform-viewport-to-element-coordinates/
function handlePointerDown(e: PointerEvent, svg: SVGSVGElement): DartScore {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());

  // Board center is (200, 200) in viewBox="0 0 400 400"
  const dx = svgP.x - 200;
  const dy = svgP.y - 200;
  const r = Math.sqrt(dx * dx + dy * dy);
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  return classifyHit(r, angle);
}

// Ring radii from UI-SPEC.md (D-01 enlarged rings)
function classifyHit(r: number, angleDeg: number): DartScore {
  if (r < 14.4)  return { multiplier: 2, segment: 50 }; // inner bull
  if (r < 36.5)  return { multiplier: 1, segment: 25 }; // outer bull
  const seg = angleToSegment(angleDeg);
  if (r < 186)   return { multiplier: 1, segment: seg }; // inner single
  if (r < 209)   return { multiplier: 3, segment: seg }; // triple
  if (r < 303)   return { multiplier: 1, segment: seg }; // outer single
  if (r < 325)   return { multiplier: 2, segment: seg }; // double
  return { multiplier: 1, segment: 0 }; // miss zone
}

// Standard dartboard segment order clockwise from top: 20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5
const SEGMENT_ORDER = [20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

function angleToSegment(angleDeg: number): number {
  // 0 degrees = right (3 o'clock). Segment 20 is at top (270 degrees = -90).
  // Rotate so that segment 20 is at index 0.
  // Each segment spans 18 degrees; segment 20 centered at 270 (top), so offset by 9 degrees.
  const adjusted = ((angleDeg - 270 + 9 + 360) % 360);
  const index = Math.floor(adjusted / 18) % 20;
  return SEGMENT_ORDER[index];
}
```

**SVG element attributes:**
```svelte
<!-- Apply to the SVG root -->
<svg
  viewBox="0 0 400 400"
  style="touch-action: none;"
  on:pointerdown={handlePointerDown}
>
  <!-- Decorative labels: pointer-events: none -->
  <text pointer-events="none" .../>
</svg>
```

### Pattern 4: Bust Detection

**What:** After each dart in double-out mode, check three bust conditions.

**When to use:** In the reducer, after every dart action.

```typescript
// Source: REQUIREMENTS.md ENG-04 + darts rules domain knowledge
// src/engine/bust.ts
export function isBust(
  remaining: number,
  dart: DartScore,
  outRule: OutRule
): boolean {
  const scored = dart.multiplier * dart.segment;
  const newRemaining = remaining - scored;

  if (outRule === 'single') {
    return newRemaining < 0;
  }

  // Double out bust conditions (ENG-04):
  if (newRemaining < 0) return true;                        // overshot
  if (newRemaining === 1) return true;                       // unreachable (no double for 1)
  if (newRemaining === 0) {
    // Must finish on double or bull (50)
    const isDouble = dart.multiplier === 2;
    const isBull = dart.segment === 50; // inner bull counts as double
    return !(isDouble || isBull);
  }
  return false;
}
```

### Pattern 5: Checkout Suggestion Table

**What:** A static 170-entry record encoding the single recommended route per score.

**When to use:** After every dart, look up remaining score.

```typescript
// Source: dartly.fun/pages/checkout-chart.html + darts domain knowledge
// src/engine/checkout.ts
// Routes follow T20-oriented tournament conventions (D-11)
// null = bogey number or > 170 (D-12)
export const CHECKOUT_TABLE: Record<number, string[] | null> = {
  170: ['T20', 'T20', 'Bull'],
  167: ['T20', 'T19', 'Bull'],
  164: ['T19', 'T19', 'Bull'],
  160: ['T20', 'T20', 'D20'],
  158: ['T20', 'T20', 'D19'],
  157: ['T20', 'T19', 'D20'],
  // ... continues for all 161 finishes
  // Bogey numbers map to null:
  169: null, 168: null, 166: null, 165: null, 163: null, 162: null, 159: null,
  // Two-dart finishes (score <= 110):
  110: ['T20', 'D-Bull'],
  // One-dart finishes (doubles):
  40: ['D20'], 38: ['D19'], 36: ['D18'], 32: ['D16'], 20: ['D10'], 2: ['D1'],
  50: ['D-Bull'],
};

export function getSuggestion(
  remaining: number,
  outRule: OutRule
): string[] | null {
  if (outRule === 'double' && remaining > 170) return null;
  if (outRule === 'double' && CHECKOUT_TABLE[remaining] === null) return null;
  return CHECKOUT_TABLE[remaining] ?? null;
}
```

**Note:** The full 161-entry table must be manually encoded from a published standard table (e.g., dartly.fun). The planner should create this as a Wave 0 data task. [ASSUMED] for exact routes beyond the representative samples shown -- use one consistent published table.

### Pattern 6: Dexie 4 Profile Schema

**What:** Typed IndexedDB schema for player profiles. Designed to be extended in Phase 3 with match/history tables.

**When to use:** Profile CRUD operations; liveQuery for reactive profile list.

```typescript
// Source: dexie.org/docs/Typescript (fetched 2026-06-10)
// src/db/db.ts
import { Dexie, type EntityTable } from 'dexie';

export interface Profile {
  id?: number;       // auto-increment
  name: string;
  color: string;     // hex color for avatar
  initial: string;   // first letter of name
  createdAt: number; // timestamp for Phase 4 stats
}

class AppDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;

  constructor() {
    super('NevermanDarts');
    // Version 1: profiles only
    // Version 2+ reserved for Phase 3 (matches, events tables)
    this.version(1).stores({
      profiles: '++id, name, createdAt',
    });
  }
}

export const db = new AppDB();
```

**Svelte liveQuery integration (no extra package):**
```svelte
<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from '$db/db.js';

  // Wrap in a readable store for Svelte compatibility
  import { readable } from 'svelte/store';
  const profiles$ = readable([], (set) => {
    const subscription = liveQuery(() => db.profiles.toArray())
      .subscribe({ next: set });
    return () => subscription.unsubscribe();
  });
</script>

{#each $profiles$ as profile}
  <div>{profile.name}</div>
{/each}
```

### Pattern 7: Wake Lock (INP-05)

**What:** Acquire screen wake lock on match start; re-acquire on visibility change.

**When to use:** Match page `$effect` or `onMount`; release on match end.

```typescript
// Source: MDN Screen Wake Lock API (developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
// src/lib/wake-lock.svelte.ts
let sentinel: WakeLockSentinel | null = null;

export async function acquireWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) return; // silently no-op if unsupported
  try {
    sentinel = await navigator.wakeLock.request('screen');
  } catch {
    // Power saver mode or other restriction -- acceptable
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (sentinel) {
    await sentinel.release();
    sentinel = null;
  }
}

// In match +page.svelte:
// $effect(() => {
//   acquireWakeLock();
//   document.addEventListener('visibilitychange', handleVisibility);
//   return () => { releaseWakeLock(); document.removeEventListener('visibilitychange', handleVisibility); };
// });
// async function handleVisibility() {
//   if (document.visibilityState === 'visible') await acquireWakeLock();
// }
```

### Pattern 8: Impossible Score Validation (Numpad)

**What:** Reject numpad-entered visit totals that cannot be scored in three darts.

**When to use:** Numpad confirm action.

```typescript
// Source: REQUIREMENTS.md INP-02 + darts rules (ASSUMED for exact set)
// src/engine/impossible-scores.ts
// Scores impossible in 3 darts (not just bogey checkouts -- all impossible visit totals):
export const IMPOSSIBLE_3DART = new Set([
  179, 178, 176, 175, 173, 172, 169,
  // Also: any score > 180 is impossible; 0 is a valid entry (3 misses)
]);

export function isValidVisitTotal(total: number): boolean {
  if (total < 0 || total > 180) return false;
  return !IMPOSSIBLE_3DART.has(total);
}
```

**Note:** The complete list of impossible 3-dart visit totals (not just checkout bogeys) needs verification. The canonical set is: 179, 178, 176, 175, 173, 172, 169 (scores between 163-180 that can't be reached). UI-SPEC.md lists exactly these seven. [ASSUMED] -- verify against a complete 3-dart reachability analysis.

### Anti-Patterns to Avoid

- **Mutable state in reducer:** The reducer must return a new object on every action. Never use `Object.assign` on the existing state in-place. Svelte 5 fine-grained reactivity depends on reference changes.
- **Svelte 4 stores (`writable`) for match state:** Use class-based `.svelte.ts` rune stores. Svelte 4 stores are still compatible but not idiomatic in Svelte 5.
- **`export let count = $state(0)` in .svelte.ts:** Cannot export a reassignable primitive from a module. Export an object: `export const state = $state({ count: 0 })` or use a class.
- **SVG `contains()` or `elementFromPoint()` for hit detection:** Both have precision issues on thin rings under scaling. Use polar math instead.
- **Scoring the outer bull (25) as a double-out finish:** Outer bull = 25 points, NOT a valid double-out. Only inner bull (50) counts as Bull (double 25). This is a very common implementation mistake.
- **BroadcastChannel in Phase 1:** Phase 2 dependency only. Do not add channel logic to the match store in this phase -- but keep MatchState serializable (no functions, no circular refs).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB wrapper | Custom IndexedDB API | Dexie 4 | Schema versioning, TypeScript types, promises, transaction handling are all non-trivial to get right; Dexie handles the `blocked`/`versionchange` events that corrupt data |
| SVG coordinate math | None -- DO hand-roll | Polar math (30 lines) | No mature, maintained dartboard npm package exists; the math is simple and the result is fully controllable |
| Drag-to-reorder (bull-off) | Custom pointer event sort | Hand-rolled ~30 lines OR SortableJS | For 4 items max, a custom pointer-event sort is simpler than a dependency; SortableJS (verdict OK) is a valid alternative if complexity grows |
| CSS animations | Web Animations API | CSS transitions/keyframes | All Phase 1 animations are simple; CSS transitions in Svelte are sufficient; `transition:` directive covers it |

**Key insight:** In this phase the only library that provides real protection against edge cases is Dexie for IndexedDB. Everything else (SVG math, visit logic, checkout table) is better hand-rolled because it is small, bespoke, and must be precisely controlled for correctness.

---

## Common Pitfalls

### Pitfall 1: Outer Bull Is Not a Valid Double-Out

**What goes wrong:** Scoring 25 (outer bull) as a valid double-out finish. The game marks a win when remaining reaches 0, but the finish was on single 25, which is not a double.

**Why it happens:** Bull looks like a double. Some charts label both bulls as "Bull". The rule is: outer bull = single 25; inner bull = double 25 (= 50 points). Double-out requires multiplier=2 OR the inner bull (segment=50).

**How to avoid:** In bust/win detection, check `dart.segment === 50` (inner bull) explicitly alongside `dart.multiplier === 2`. Do NOT check `dart.segment === 25`.

**Warning signs:** Test case: player on 25, hits outer bull -- should bust, not win.

### Pitfall 2: Bust on Exactly Remaining=1

**What goes wrong:** Player is on 2, hits single 1, leaving 1. In double-out, score 1 has no valid double, so this is a bust -- but code that only checks `newRemaining < 0` passes it.

**How to avoid:** Three separate bust conditions, checked in order: `< 0`, `=== 1` (double-out only), `=== 0 && !isDouble`.

**Warning signs:** Test case: player on 2 hits S1 -- should bust.

### Pitfall 3: Undo Through Leg Win Corrupts Counts

**What goes wrong:** Player wins a leg (remaining=0, valid double). Undo is pressed. The leg count is already incremented, but the code doesn't decrement it on undo.

**How to avoid:** Event-log reducer pattern. Never store derived counts that need manual decrement. Instead, recompute leg/set counts from the event log: `legsWon = eventLog.filter(e => e.type === 'LEG_WIN' && e.playerId === p.id).length`. On undo, replay `log.slice(0, -1)`.

**Warning signs:** Test case: win a leg, undo the winning dart -- leg count should revert.

### Pitfall 4: SVG Hit Detection Breaks Under Scaling/Resize

**What goes wrong:** Dartboard is inside a responsive container. The SVG scales via CSS. Pointer coordinates at `e.clientX/Y` no longer map to SVG user space without the CTM inverse.

**How to avoid:** Always use `svg.getScreenCTM().inverse()` + `createSVGPoint()`. Never use raw clientX/Y as SVG coordinates.

**Warning signs:** Hits register correctly on page load but drift after resize or orientation change.

### Pitfall 5: Visit Auto-Finalizes Before Bust Is Shown

**What goes wrong:** On the third dart, the code finalize the visit AND starts the correction window timer simultaneously. If the third dart was a bust, the correction window says "bust" but then timer fires and score changes before the player reads it.

**How to avoid:** Bust visits still go through the full correction window flow (2.5 s). The reducer marks the visit as bust and passes the turn only AFTER the correction window dismisses. Correction window receives `isBust: true` and shows "Ueberworfen!" -- but turn does not pass until window times out or is dismissed.

**Warning signs:** Bust clears instantly without the correction overlay.

### Pitfall 6: SvelteKit $app/environment in Tests

**What goes wrong:** A component imports `browser` from `$app/environment` or uses `goto` from `$app/navigation`. Vitest in node environment throws because SvelteKit module aliases aren't resolved.

**How to avoid:** Add `deps: { inline: ['@sveltejs/kit'] }` to vitest config test block. Or use the SvelteKit vitest config extension: `import { defineConfig } from 'vitest/config'; import { sveltekit } from '@sveltejs/kit/vite';`.

### Pitfall 7: Phase 3 DB Migration Requires Version Bump

**What goes wrong:** Phase 1 creates `db.version(1)`. Phase 3 adds `matches` and `events` tables. If the code tries to add a new table without calling `db.version(2).stores({...})`, Dexie throws a version error.

**How to avoid:** Reserve version 2+ in Phase 1 by commenting `// version(2) reserved for Phase 3: matches, events`. Do not put non-table data in `version(1).stores`. Dexie migrations are additive -- include ALL tables in each `version().stores()` call.

---

## Code Examples

### Verified Patterns

#### SvelteKit adapter-static for GitHub Pages

```javascript
// Source: svelte.dev/docs/kit/adapter-static (fetched 2026-06-10)
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    paths: {
      base: process.argv.includes('dev')
        ? ''
        : process.env.BASE_PATH  // set to '/neverman-darts-app' in CI
    }
  }
};

// src/routes/+layout.js
export const prerender = true;
```

#### Vitest config (SvelteKit + browser mode)

```typescript
// Source: svelte.dev/docs/svelte/testing + vitest.dev/guide/browser/ (fetched 2026-06-10)
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser/providers/playwright';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    projects: [
      {
        // Pure logic: engine, checkout, bust, impossible-scores
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/engine/**/*.test.ts', 'src/lib/**/*.test.ts'],
        },
      },
      {
        // Component tests: dartboard hit-detection, score panel
        extends: './vite.config.ts',
        test: {
          name: 'browser',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          include: ['src/ui/**/*.test.ts'],
        },
      },
    ],
  },
});
```

#### Component test (browser mode)

```typescript
// Source: vitest.dev/guide/browser/ (fetched 2026-06-10)
// src/ui/input/Dartboard.test.ts
import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Dartboard from './Dartboard.svelte';

test('hit at center scores inner bull (50)', async () => {
  const onDart = vi.fn();
  render(Dartboard, { ondart: onDart });
  // Simulate pointer at SVG center -- test the polar math function directly
  const result = classifyHit(10, 0); // r=10 < 14.4 -> inner bull
  expect(result).toEqual({ multiplier: 2, segment: 50 });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `npm create svelte@latest` | `npx sv create` | 2024 | Use `sv` CLI; same interactive prompts |
| Svelte 4 `export let` + `$:` | Svelte 5 `$props()` + `$derived()` | Svelte 5 (2024) | Runes are the idiomatic approach; Svelte 4 stores still work but not preferred |
| Svelte 4 `writable` stores | `.svelte.ts` class with `$state` | Svelte 5 (2024) | Cleaner API for complex state; works identically across .svelte and .ts files |
| `@testing-library/svelte` + jsdom | `vitest-browser-svelte` in real browser | 2025 | Eliminates jsdom imprecision for pointer/touch tests |
| `npm create vite@latest` with Svelte template | `npx sv create` | 2024 | SvelteKit is now the recommended starting point even for SPAs |

**Deprecated/outdated:**
- `create-svelte` npm package: Replaced by `sv` CLI. Do not use.
- `dexie-react-hooks`: React-specific. Do not install in a Svelte project. Use `liveQuery()` with a store wrapper.
- Svelte 4 `import { writable } from 'svelte/store'` as primary state: Still functional but not idiomatic in Svelte 5 projects. Use runes.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The complete checkout table (all 161 routes) follows dartly.fun/darts-oche conventions; specific routes for mid-range scores (51-139) need manual encoding from a consistent published source | Standard Stack / Code Examples | Wrong checkout routes displayed to players; annoying but not a game-breaking bug |
| A2 | Impossible 3-dart visit totals are exactly: 179, 178, 176, 175, 173, 172, 169 (and anything > 180) | Code Examples (impossible-scores) | Numpad accepts scores that are mathematically impossible (e.g. a score that needs 4 darts) |
| A3 | Dexie liveQuery works correctly wrapped in a Svelte `readable` store in Svelte 5 without special interop needed | Code Examples (Dexie pattern) | Profile list may not reactively update; would need alternative integration pattern |
| A4 | Standard leg-starter rotation is: each new leg starts with the player who did NOT start the previous leg (alternating for 2 players; cycling for 3-4) | Architecture Patterns (rotation) | Turn order bug; players would notice incorrect starter |
| A5 | `sortablejs` is not needed for 4-item drag-to-reorder in bull-off screen; hand-rolled pointer events are simpler | Don't Hand-Roll | If hand-rolled implementation is buggy on Android tablet touch, would need to swap to SortableJS 1.15.7 |

---

## Open Questions

1. **Complete checkout table source**
   - What we know: Routes for scores 140-170, scores as clean doubles (2-50), and a few key two-dart finishes. The full 51-139 range (non-trivial routes) is not yet encoded.
   - What's unclear: Which published table to use as the canonical source (dartly.fun, darts-oche.com, or darts501.com all differ marginally on 2-3 scores).
   - Recommendation: Pick darts501.com as the canonical source (referenced in REQUIREMENTS.md ENG-07); encode the full table as a Wave 0 data task. The specific choice is Claude's discretion per D-11.

2. **Leg starter rotation for 3-4 players**
   - What we know: For 2 players, it alternates. Standard darts rules for 3-4 players rotate each leg in the original playing order.
   - What's unclear: Whether the bull-off order is also the rotation order for subsequent legs.
   - Recommendation: Use the bull-off order as the cycle. Leg n starts with player at index `(legNumber % numPlayers)`.

3. **Dexie liveQuery in Svelte 5 compatibility**
   - What we know: Dexie's `liveQuery` returns an `Observable`-like that has a `.subscribe()` method. Svelte 4 stores are still present in Svelte 5.
   - What's unclear: Whether Dexie 4.4.3 has a native Svelte 5 rune integration or if the readable-store wrapper is the current recommended approach.
   - Recommendation: Use the `readable` store wrapper pattern shown above. If Dexie releases a `$effect`-based helper, migrate in Phase 3 when DB usage grows.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | SvelteKit build | Yes | v22.22.0 | -- |
| npm | Package management | Yes | 11.10.0 | -- |
| Git | Version control | Not checked | -- | Manual file management |
| Browser (Chrome/Edge) | App target | Yes (Windows) | Not checked | -- |
| Android device/emulator | Touch input testing | Not checked | -- | Test touch via Chrome DevTools device emulation |

**Missing dependencies with no fallback:** None identified.

**Note:** This is a static SPA. No database server, no Docker, no external services required for Phase 1.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vite.config.ts` (multi-project setup) |
| Quick run command | `npx vitest run --project=unit` |
| Full suite command | `npx vitest run` |
| Browser test command | `npx vitest run --project=browser` (requires `npx playwright install chromium` first) |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | 301/401/501 starts, single/double out | unit | `npx vitest run --project=unit src/engine/reducer.test.ts` | Wave 0 |
| ENG-02 | Leg/set counting, first-to semantics | unit | `npx vitest run --project=unit src/engine/reducer.test.ts` | Wave 0 |
| ENG-03 | Turn rotation, leg starter alternation | unit | `npx vitest run --project=unit src/engine/rotation.test.ts` | Wave 0 |
| ENG-04 | All 3 bust conditions (< 0, === 1, === 0 non-double) | unit | `npx vitest run --project=unit src/engine/bust.test.ts` | Wave 0 |
| ENG-05 | Undo through leg/set win without corrupting counts | unit | `npx vitest run --project=unit src/engine/reducer.test.ts -t "undo"` | Wave 0 |
| ENG-06 | Bull-off order sets first-leg starter | unit | `npx vitest run --project=unit src/engine/reducer.test.ts -t "bull-off"` | Wave 0 |
| ENG-07 | Checkout suggestion: bogey=null, >170=null, valid=route | unit | `npx vitest run --project=unit src/engine/checkout.test.ts` | Wave 0 |
| INP-01 | Polar math: all 82 regions return correct score | unit | `npx vitest run --project=unit src/engine/board.test.ts` | Wave 0 |
| INP-02 | Impossible scores rejected; valid totals accepted | unit | `npx vitest run --project=unit src/engine/impossible-scores.test.ts` | Wave 0 |
| INP-03 | Darts-at-double captured from dialog and stored on visit | unit | `npx vitest run --project=unit src/engine/reducer.test.ts -t "darts-at-double"` | Wave 0 |
| INP-04 | Correction window appears, times out, passes turn | browser | `npx vitest run --project=browser src/ui/input/CorrectionWindow.test.ts` | Wave 0 |
| INP-05 | Wake lock acquired/re-acquired on visibilitychange | manual | Not automatable (browser wake lock requires real device) | -- |
| FLOW-01 | Full flow: setup -> bull-off -> match | E2E | `npx playwright test e2e/full-match-flow.spec.ts` | Wave 0 |
| PROF-01 | Profile CRUD: create, read, update, delete | unit+browser | `npx vitest run src/db/profiles.test.ts` | Wave 0 |
| PROF-02 | Guest players: not written to DB, cleaned on match end | unit | `npx vitest run --project=unit src/engine/reducer.test.ts -t "guest"` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --project=unit`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + one manual wake-lock smoke test on real device before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/engine/reducer.test.ts` -- covers ENG-01..05, PROF-02
- [ ] `src/engine/bust.test.ts` -- covers ENG-04 exhaustively
- [ ] `src/engine/rotation.test.ts` -- covers ENG-03
- [ ] `src/engine/checkout.test.ts` -- covers ENG-07
- [ ] `src/engine/board.test.ts` -- covers INP-01 (polar math unit tests)
- [ ] `src/engine/impossible-scores.test.ts` -- covers INP-02
- [ ] `src/db/profiles.test.ts` -- covers PROF-01
- [ ] `src/ui/input/CorrectionWindow.test.ts` -- covers INP-04
- [ ] `e2e/full-match-flow.spec.ts` -- covers FLOW-01
- [ ] `npx playwright install chromium` -- if not already installed by scaffolder

---

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` per config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user accounts in Phase 1; profiles are local-only |
| V3 Session Management | No | No sessions; single-device local app |
| V4 Access Control | No | No multi-user server; single-device local app |
| V5 Input Validation | Yes | Numpad: reject impossible scores; reject negative totals; never eval user strings |
| V6 Cryptography | No | No secrets, no passwords, no data transmission in Phase 1 |
| V7 Error Handling | Yes | Silently handle wake lock rejection; handle Dexie open failure gracefully |
| V9 Communication | No | No network requests; fully offline in Phase 1 |

### Known Threat Patterns for Local SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid numpad input (e.g. NaN, negative, 9999) | Tampering | Validate in `isValidVisitTotal()`; reject non-integers; reject out-of-range values |
| Dexie open failure (private browsing, storage quota) | Denial of Service | Try/catch on db.open(); show inline error; app still works without profiles (guests) |
| XSS via player name input | Spoofing | Svelte auto-escapes template expressions; no innerHTML usage; profile names are display-only strings |
| IndexedDB data loss (private mode) | Information Disclosure | Warn user if `navigator.storage.persist()` is unavailable; document the limitation |

**Note:** This app has no network requests, no authentication, and no sensitive data in Phase 1. ASVS Level 1 is fully covered by input validation and graceful Dexie error handling.

---

## Sources

### Primary (MEDIUM confidence via official docs)
- [svelte.dev/docs/svelte/$state](https://svelte.dev/docs/svelte/$state) -- Svelte 5 runes $state, $derived, $effect, module-level shared state patterns
- [svelte.dev/docs/kit/adapter-static](https://svelte.dev/docs/kit/adapter-static) -- GitHub Pages adapter-static config, fallback, paths.base
- [svelte.dev/docs/kit/routing](https://svelte.dev/docs/kit/routing) -- file-based routing, +page.svelte, +layout.svelte
- [svelte.dev/docs/kit/creating-a-project](https://svelte.dev/docs/kit/creating-a-project) -- npx sv create scaffolding
- [dexie.org/docs/Typescript](https://dexie.org/docs/Typescript) -- TypeScript EntityTable, version().stores(), migration pattern
- [dexie.org/docs/Tutorial/Svelte](https://dexie.org/docs/Tutorial/Svelte) -- Dexie 4 + Svelte integration, liveQuery
- [vitest.dev/guide/browser/](https://vitest.dev/guide/browser/) -- browser mode config, playwright provider, vitest-browser-svelte render()
- [svelte.dev/docs/svelte/testing](https://svelte.dev/docs/svelte/testing) -- Svelte 5 + Vitest recommended patterns

### Secondary (LOW confidence via web search and web fetch)
- [developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) -- visibilitychange re-acquire pattern [CITED: MDN]
- [sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/](https://www.sitepoint.com/how-to-translate-from-dom-to-svg-coordinates-and-back-again/) -- getScreenCTM().inverse() + createSVGPoint() pattern [CITED: SitePoint]
- [davidhamann.de/2023/01/13/svg-javascript-transform-viewport-to-element-coordinates/](https://davidhamann.de/2023/01/13/svg-javascript-transform-viewport-to-element-coordinates/) -- SVG coordinate transform [CITED]
- [dartly.fun/pages/checkout-chart.html](https://www.dartly.fun/pages/checkout-chart.html) -- Checkout routes 2-170 [CITED: Dartly]
- [dartscheckoutassistant.com](https://dartscheckoutassistant.com/tag/bogey-numbers/) -- Bogey number confirmation [CITED]

### Tertiary (ASSUMED - training knowledge)
- X01 standard darts rules (bust conditions, leg/set rotation) -- widely documented but not fetched from a primary rules body
- Dartboard segment order (20,1,18,4,...) -- standard BDO/PDC layout, not fetched from official spec
- Impossible 3-dart visit totals list

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions confirmed against npm registry 2026-06-10
- Architecture patterns: MEDIUM -- reducer/runes patterns from official Svelte docs; polar math from SitePoint/MDN-adjacent sources
- Darts domain rules: MEDIUM -- confirmed across multiple authoritative darts sources
- Pitfalls: MEDIUM -- derived from official docs warnings + common SVG/Svelte implementation issues
- Checkout table: LOW -- key routes from dartly.fun; full 161-entry table must be manually encoded in Wave 0

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (30 days -- Svelte 5 and Dexie 4 are stable; fast-moving: Vitest 4.x point releases)
