# Phase 01: Playable X01 Match - Pattern Map

**Mapped:** 2026-06-11
**Files analyzed:** 10 (gap-closure targets from VERIFICATION.md)
**Analogs found:** 10 / 10 (all files exist in codebase — this is gap closure, not greenfield)

---

## File Classification

| File to Modify | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|----------------|---------------|
| `src/engine/board.ts` | utility (pure) | transform | `src/engine/bust.ts` | exact — same module shape, typed DartScore input/output |
| `src/engine/bust.ts` | utility (pure) | transform | `src/engine/board.ts` | exact — same module shape |
| `src/engine/bust.test.ts` | test | — | `src/engine/board.test.ts` | exact — same Vitest describe/it/expect structure |
| `src/engine/board.test.ts` | test | — | `src/engine/bust.test.ts` | exact — same Vitest describe/it/expect structure |
| `src/engine/checkout.ts` | utility (pure) | transform | `src/engine/bust.ts` | role-match — pure engine module |
| `src/ui/input/CorrectionWindow.svelte` | component | event-driven | `src/routes/match/+page.svelte` | role-match — same $effect + $state + $derived patterns |
| `src/ui/input/ScorePanel.svelte` | component | request-response | `src/routes/match/+page.svelte` | exact — reads matchStore.state and matchStore getters |
| `src/ui/setup/BullOffOrder.svelte` | component | request-response | `src/routes/match/+page.svelte` | role-match — dispatches to matchStore, navigates via goto |
| `src/engine/reducer.ts` | service (pure) | CRUD | self | self-analog — already verified; partial changes only |
| `src/routes/match/+page.svelte` | route | event-driven | self | self-analog — already verified; no changes required |

---

## Pattern Assignments

### `src/engine/board.ts` (utility, transform)

**Issue (CR-01):** `classifyHit` returns `{ multiplier: 2, segment: 50 }` for inner bull. The formula `2 * 50 = 100` scores 100 points. Bull must score 50 points.

**Fix:** Change the inner bull encoding so that `multiplier * segment = 50`. The canonical approach used by `bust.ts` is to check `dart.segment === 50` as a valid double-out finish. Two consistent choices exist — pick one and update bust.ts to match:

**Option A (chosen — aligns with bust.ts isInnerBull check at line 33):**
```typescript
// board.ts line 44 — change from:
if (r < 14.4) return { multiplier: 2, segment: 50 };   // inner bull
// to:
if (r < 14.4) return { multiplier: 1, segment: 50 };   // inner bull = 50 pts; bust.ts checks segment===50
```

**Option B (alternative):**
```typescript
// board.ts line 44 — change to:
if (r < 14.4) return { multiplier: 2, segment: 25 };   // double-bull = 50 pts; passes multiplier===2 check
```

**Analog — existing pattern in `bust.ts` lines 31–34:**
```typescript
if (newRemaining === 0) {
    const isDouble = dart.multiplier === 2;
    const isInnerBull = dart.segment === 50;
    return !(isDouble || isInnerBull);
}
```
The `isInnerBull` branch checks `dart.segment === 50`. Option A produces `{ multiplier: 1, segment: 50 }` — this hits the `isInnerBull` guard correctly. Option B produces `{ multiplier: 2, segment: 25 }` — this hits the `isDouble` guard. Either is consistent; Option A keeps `segment: 50` as the inner-bull sentinel (consistent with `CorrectionWindow.formatDart` line 35 which checks `dart.segment === 50`).

**Analog — existing imports pattern (`bust.ts` lines 1–5):**
```typescript
// src/engine/bust.ts
import type { DartScore, OutRule } from './types.js';
```
Follow same `.js` extension on type imports; no runtime imports needed in board.ts (already correct).

---

### `src/engine/bust.ts` (utility, transform)

**Issue (CR-01 downstream):** With `board.ts` changed to `{ multiplier: 1, segment: 50 }`, the `isInnerBull` check at line 33 (`dart.segment === 50`) is already correct and no code change is needed in `bust.ts` itself. If Option B is chosen instead, `bust.ts` line 33 must change to `const isInnerBull = dart.multiplier === 2 && dart.segment === 25;`.

**Core pattern — existing (lines 19–37, already correct for Option A):**
```typescript
export function isBust(remaining: number, dart: DartScore, outRule: OutRule): boolean {
    const scored = dart.multiplier * dart.segment;
    const newRemaining = remaining - scored;

    if (outRule === 'single') {
        return newRemaining < 0;
    }

    // Double-out rules
    if (newRemaining < 0) return true;
    if (newRemaining === 1) return true;
    if (newRemaining === 0) {
        const isDouble = dart.multiplier === 2;
        const isInnerBull = dart.segment === 50;   // valid if Option A: {m:1,s:50}
        return !(isDouble || isInnerBull);
    }
    return false;
}
```

**No structural change needed for Option A.** The `isInnerBull = dart.segment === 50` guard already handles `{ multiplier: 1, segment: 50 }` correctly because the `newRemaining < 0` branch will no longer fire first (`1 * 50 = 50`, so `remaining=50 - 50 = 0`, not negative).

---

### `src/engine/bust.test.ts` (test)

**Issue:** Lines 54–58 assert `isBust(100, d(2, 50), rule) === false`, encoding the wrong 100-point rule. After the board.ts fix these tests must be updated to assert 50-point bull behavior.

**Analog — existing test structure (`board.test.ts` lines 1–13):**
```typescript
import { describe, it, expect } from 'vitest';
import { classifyHit, angleToSegment, SEGMENT_ORDER } from './board.js';

describe('classifyHit - ring zones', () => {
    it('r < 14.4 → inner bull (multiplier 2, segment 50)', () => {
        expect(classifyHit(0, 0)).toEqual({ multiplier: 2, segment: 50 });
```

**Pattern to add/replace in bust.test.ts** — replace the wrong test block (lines 46–58) with:
```typescript
it('newRemaining === 0 AND segment === 50 (inner bull) → valid finish (not bust)', () => {
    // After board.ts fix: inner bull encodes as { multiplier: 1, segment: 50 } = 50 pts
    // remaining=50, dart scores 1*50=50 → newRemaining=0, segment=50 → isInnerBull → valid
    expect(isBust(50, d(1, 50), rule)).toBe(false);
});

it('inner bull from 50 remaining does NOT cause spurious overshoot', () => {
    // Before fix: d(2,50) scored 100, overshoot → bust (wrong). After fix: d(1,50) scores 50.
    expect(isBust(50, d(1, 50), rule)).toBe(false);
    // Overshoot from 40 remaining is still a bust
    expect(isBust(40, d(1, 50), rule)).toBe(true);
});
```

**Test helper pattern from bust.test.ts line 9:**
```typescript
const d = (multiplier: 1 | 2 | 3, segment: number): DartScore => ({ multiplier, segment });
```
Reuse this helper — it already exists in the file.

---

### `src/engine/board.test.ts` (test)

**Issue:** Tests at lines 9–13 assert `classifyHit(0, 0)` returns `{ multiplier: 2, segment: 50 }`. After the fix this must be updated.

**Analog — test structure pattern (lines 1–13 of board.test.ts itself):**
```typescript
import { describe, it, expect } from 'vitest';
import { classifyHit, angleToSegment, SEGMENT_ORDER } from './board.js';

describe('classifyHit - ring zones', () => {
    it('r < 14.4 → inner bull (multiplier 1, segment 50)', () => {
        // After fix: { multiplier: 1, segment: 50 } = 50 pts
        expect(classifyHit(0, 0)).toEqual({ multiplier: 1, segment: 50 });
        expect(classifyHit(10, 0)).toEqual({ multiplier: 1, segment: 50 });
        expect(classifyHit(14.3, 0)).toEqual({ multiplier: 1, segment: 50 });
    });
```

Also update the acceptance-criteria test at line 52–54:
```typescript
it('classifyHit(10, 0) returns inner bull', () => {
    expect(classifyHit(10, 0)).toEqual({ multiplier: 1, segment: 50 });
});
```

No other tests in board.test.ts are affected by this change.

---

### `src/engine/checkout.ts` (utility, transform)

**Issue (CR-01 downstream):** The entry `50: ['Bull']` is correct as a route label. After the board.ts fix, a player on 50 tapping inner bull scores 50 points (`1 * 50 = 50`) and `isBust(50, {m:1,s:50}, 'double')` returns false (valid finish via isInnerBull). No change needed to checkout.ts itself — the bug was upstream in board.ts.

**Verify only:** `checkout.ts` line 128:
```typescript
50:  ['Bull'],
```
This is correct and requires no edit.

---

### `src/ui/input/CorrectionWindow.svelte` (component, event-driven)

**Two defects — CR-04 (timer loop) and CR-03 (inescapable paused state).**

**Defect CR-04:** The `$effect` at lines 75–86 calls `startTimer()`. Inside `startTimer()` (line 41), `elapsed` is read: `progressStartTime = Date.now() - elapsed`. Because `elapsed` is a `$state`, Svelte tracks it as a reactive dependency of the `$effect`. Every `tick()` call writes `elapsed`, which re-runs the effect, which calls `stopTimer()` (the cleanup), then restarts the 2500ms timer from scratch. Auto-dismiss never fires.

**Fix — wrap `startTimer()` in `untrack()`:**

Pattern from Svelte 5 docs: `untrack(() => expr)` reads reactive values without registering them as dependencies.

```typescript
// Add to imports at top of <script>:
import { untrack } from 'svelte';

// Replace $effect (lines 75–86) with:
$effect(() => {
    if (visible) {
        elapsed = 0;
        paused = false;
        untrack(() => startTimer());   // startTimer reads elapsed; untrack prevents tracking
    } else {
        stopTimer();
        elapsed = 0;
        paused = false;
    }
    return () => stopTimer();
});
```

**Analog — `$effect` pattern in `match/+page.svelte` lines 17–32:**
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
Cleanup is returned from `$effect` as a function — same pattern already in CorrectionWindow.

**Defect CR-03:** When `paused = true`, `handleOutsideClick` is a no-op (`if (!paused) confirm()`) and the template (lines 113–119) renders only a hint text with no dismiss control:
```svelte
{:else}
    <div class="paused-hint">Verwende Rückgängig zum Bearbeiten</div>
{/if}
```

**Fix — add a dismiss button in the paused branch:**
```svelte
{:else}
    <div class="paused-hint">Verwende Rückgängig zum Bearbeiten</div>
    <button class="fertig-btn" onclick={(e) => { e.stopPropagation(); confirm(); }}>
        Fertig
    </button>
{/if}
```

**Analog — button pattern from CorrectionWindow.svelte lines 114–116 (Korrigieren button):**
```svelte
<button class="korrigieren-btn" onclick={(e) => { e.stopPropagation(); pause(); }}>
    Korrigieren
</button>
```
Mirror the same `e.stopPropagation()` + action call pattern for the Fertig button.

**Style pattern to add** (follows `.korrigieren-btn` pattern at lines 180–187):
```css
.fertig-btn {
    font-size: 14px;
    color: #e8a020;
    background: none;
    border: 1px solid #e8a020;
    border-radius: 4px;
    cursor: pointer;
    padding: 6px 16px;
}
```

---

### `src/ui/input/ScorePanel.svelte` (component, request-response)

**Issue (CR-02):** Line 16 renders `{player.remaining}` — the start-of-visit committed value. The active player's live mid-visit remaining is available via `matchStore.remaining` (the getter). After dart 1 or dart 2 on the board, the large score shows the old value while `CheckoutSuggestion` shows the updated route, contradicting each other.

**Existing file — full context (lines 9–31):**
```svelte
{#each matchStore.state.players as player, i (player.id)}
    {@const isActive = i === matchStore.state.activePlayerIndex}
    <div class="player-card" class:active={isActive}>
        <div class="player-name">{player.name}</div>
        <div class="score-row">
            <span class="remaining" class:remaining-active={isActive} class:remaining-inactive={!isActive}>
                {player.remaining}           <!-- line 16: BUG — stale for active player -->
            </span>
            {#if isActive}
                <CheckoutSuggestion />
            {/if}
        </div>
```

**Fix — one-line change at line 16:**
```svelte
{isActive ? matchStore.remaining : player.remaining}
```

**Analog — `matchStore.remaining` getter usage pattern from `match/+page.svelte` line 103:**
```typescript
const prevRemaining = matchStore.activePlayer?.remaining ?? 0;
```
And in `stores/match.svelte.ts` (the getter exists and is verified correct per VERIFICATION.md).

**The import of `matchStore` is already present at line 5** of ScorePanel.svelte — no import change needed.

---

### `src/ui/setup/BullOffOrder.svelte` (component, request-response)

**Issue (CR-05):** `confirmOrder()` (lines 122–139) dispatches `START_MATCH` with no guard for `order.length === 0`. Direct browser navigation to `/bulloff` with no `pendingMatch` in sessionStorage results in `initialPlayers = []`, `order = []`, and `confirmOrder()` dispatching `START_MATCH` with `players: []`, `order: []`. The reducer creates a match with zero players. The first `DART_THROWN` action evaluates `state.players[0].remaining` on `undefined`, throwing `TypeError`.

The confirm button (line 173) is always enabled regardless of `order.length`.

**Fix 1 — guard in `confirmOrder()` (after line 122):**
```typescript
function confirmOrder() {
    if (order.length === 0) {
        goto(`${base}/setup`);
        return;
    }
    // ... rest of existing code unchanged
```

**Fix 2 — disable button when no players (line 173):**
```svelte
<button class="confirm-btn" onclick={confirmOrder} disabled={order.length === 0}>
    Spielreihenfolge bestätigen
</button>
```

**Analog — `goto` navigation pattern from BullOffOrder.svelte line 138 (existing):**
```typescript
goto(`${base}/match`);
```
Same pattern, same import (`import { goto } from '$app/navigation'` at line 5 and `import { base } from '$app/paths'` at line 6 — both already imported).

**Analog — disabled button pattern** does not yet appear in codebase. Standard HTML attribute: `disabled={condition}` in Svelte. No additional import needed.

**Fix 3 — reducer guard (defensive):** In `reducer.ts`, `applyStartMatch` should return unchanged state when `orderedPlayers` is empty. After line 80:
```typescript
const orderedPlayers: PlayerState[] = action.order.map(id => { ... });

if (orderedPlayers.length === 0) return state;   // add after line 91
```

**Analog — early return pattern from `reducer.ts` line 109:**
```typescript
if (state.phase !== 'playing') return state;
```
Same guard pattern — return state unchanged when precondition fails.

---

## Shared Patterns

### Svelte 5 `untrack()` for timer effects
**Source:** Svelte 5 runes API  
**Apply to:** `CorrectionWindow.svelte`
```typescript
import { untrack } from 'svelte';
// Inside $effect: wrap reads of $state inside callbacks that shouldn't be tracked:
untrack(() => startTimer());
```

### `$effect` with cleanup return
**Source:** `src/routes/match/+page.svelte` lines 17–32
```typescript
$effect(() => {
    // setup
    return () => {
        // teardown
    };
});
```
Apply to any component that sets up timers, event listeners, or subscriptions.

### Store getter access in templates
**Source:** `src/routes/match/+page.svelte` lines 38–40
```typescript
let inputMode = $derived(
    inputModeByPlayer[matchStore.state.activePlayerIndex] ?? 'board'
);
```
For computed values derived from matchStore, use `$derived()` or inline ternary in template. `matchStore.remaining` is a getter that returns the live mid-visit remaining — always use it for the active player's displayed score.

### Early-return guard in pure functions
**Source:** `src/engine/reducer.ts` line 109
```typescript
if (state.phase !== 'playing') return state;
```
Use in reducer action handlers and component event handlers to bail out early on invalid preconditions.

### Navigation with base path
**Source:** `src/ui/setup/BullOffOrder.svelte` lines 5–6, 138
```typescript
import { goto } from '$app/navigation';
import { base } from '$app/paths';
// ...
goto(`${base}/setup`);
```
All `goto()` calls must prepend `base` for GitHub Pages subpath compatibility.

---

## No Analog Found

None — all files exist in the codebase. This is a gap-closure run.

---

## Summary of Changes Required

| File | Change Type | Root Cause |
|------|-------------|------------|
| `src/engine/board.ts` | 1-line edit line 44 | CR-01: inner bull encodes as 100 pts instead of 50 |
| `src/engine/bust.ts` | No change (Option A) or 1-line edit (Option B) | CR-01 downstream; Option A requires no bust.ts edit |
| `src/engine/bust.test.ts` | Replace lines 46–58 (wrong 100-pt test) | CR-01: tests encode the wrong rule |
| `src/engine/board.test.ts` | Update lines 9–13, 52–54 | CR-01: assertions must match new encoding |
| `src/engine/checkout.ts` | No change | CR-01 downstream; route label 'Bull' is correct |
| `src/ui/input/CorrectionWindow.svelte` | Add `untrack` import + wrap startTimer call; add Fertig button | CR-04 + CR-03 |
| `src/ui/input/ScorePanel.svelte` | 1-word edit line 16 | CR-02: active player score stale mid-visit |
| `src/ui/setup/BullOffOrder.svelte` | Add 0-player guard in confirmOrder; disable button | CR-05: 0-player match crash |
| `src/engine/reducer.ts` | Add 1-line guard in applyStartMatch | CR-05 defensive |
| `src/routes/match/+page.svelte` | No change (verified) | — |

---

## Metadata

**Analog search scope:** `src/engine/`, `src/ui/input/`, `src/ui/setup/`, `src/routes/match/`  
**Files read:** 10 source files + 3 planning documents  
**Pattern extraction date:** 2026-06-11
