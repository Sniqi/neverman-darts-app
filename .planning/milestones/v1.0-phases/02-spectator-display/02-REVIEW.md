---
phase: 02-spectator-display
reviewed: 2026-06-11T18:43:23Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - e2e/spectator-sync.spec.ts
  - src/engine/averages.test.ts
  - src/engine/averages.ts
  - src/engine/reducer.test.ts
  - src/engine/reducer.ts
  - src/engine/types.ts
  - src/routes/display/+page.svelte
  - src/routes/match/+page.svelte
  - src/stores/display.svelte.test.ts
  - src/stores/display.svelte.ts
  - src/stores/match.svelte.ts
  - src/ui/display/IdleScreen.svelte
  - src/ui/display/LegWinBanner.svelte
  - src/ui/display/LegWinBanner.test.ts
  - src/ui/display/MatchHeader.svelte
  - src/ui/display/MatchWinDisplay.svelte
  - src/ui/display/PlayerPanel.svelte
  - src/ui/display/PlayerPanel.test.ts
  - src/ui/display/SpectatorChooser.svelte
  - src/ui/display/SpectatorChooser.test.ts
  - src/ui/display/VisitLine.svelte
  - src/ui/display/VisitLine.test.ts
findings:
  critical: 1
  warning: 9
  info: 6
  total: 16
status: issues_found
---

# Phase 02: Code Review Report (Post-Gap-Closure 02-05)

**Reviewed:** 2026-06-11T18:43:23Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Re-review after gap-closure plan 02-05. Verdict on the four targeted changes:

1. **`match.svelte.ts` → `$state.snapshot(this.state)` on `postMessage`** — Verified correct. The proxy is now unwrapped to a plain object, eliminating the swallowed `DataCloneError`. Prior CR-01 is **resolved**. One residual asymmetry remains: the adjacent `localStorage.setItem(..., JSON.stringify(this.state))` still serializes the raw proxy (see WR-08).
2. **`display/+page.svelte` `prevLegsWon`/`prevSetsWon` → plain `let`** — Verified correct. The trackers are read and reassigned only inside the effect; as non-reactive `let`s they no longer self-retrigger the effect. Prior CR-02 (infinite loop) is **resolved**. A latent baseline-desync remains in the same logic (see CR-01 below).
3. **`SpectatorChooser.openSecondWindow()` → drop `noopener`, manual `win.opener = null`** — The popup-block false-positive (prior WR-02) is **resolved**: `window.open(url, '_blank')` now returns a usable window handle. The manual opener-null is best-effort and unguarded against a non-writable `opener` (see WR-02).
4. **`e2e/spectator-sync.spec.ts` live no-reload test (Test 3)** — Added and genuinely exercises the live BroadcastChannel path. Prior WR-09 is **resolved**. One assertion-strength gap remains (see WR-09).

The three gap-closure fixes land correctly and introduced no regressions I can identify. The single remaining Critical (CR-01) is the leg-win banner detection that survived 02-05 untouched: it infers leg/set wins by diffing reconstructed counts on the receiver, which is timing-dependent under fire-and-forget BroadcastChannel and can miss or spuriously fire the D-09 banner. The remaining warnings are pre-existing correctness defects in displayed statistics (match average wrong across legs, bust/numpad dart counts, set-starter rotation, numpad visit-total reconstruction) and input robustness (undo desync, snapshot shape validation) that 02-05 did not scope. No security issues found: same-origin channels only, all user text rendered via `{interpolation}` (no `{@html}`), no injection surfaces.

## Critical Issues

### CR-01: Leg-win banner baseline desyncs under live BroadcastChannel sync

**File:** `src/routes/display/+page.svelte:34-71`
**Issue:**
The banner watcher seeds `prevLegsWon`/`prevSetsWon` to `[]` and only populates them at the end of the effect (lines 69-70). The guard at line 49 (`prevLegsWon.length === s.players.length`) suppresses detection until the second observed state. This interacts badly with fire-and-forget BroadcastChannel delivery (now that live sync actually works post-02-05):

- The display hydrates from the localStorage snapshot on `connect()` — which may already be a post-leg-win state — then receives live deltas. The publisher (`match.svelte.ts:30-36`) fires exactly one message per `dispatch()` and `close()`s immediately; there is no buffering or replay. Only display tabs open at fire time receive it.
- If the display is opened *after* a leg win, `prevLegsWon` is seeded from the already-incremented snapshot, so the banner for that leg **never shows**.
- If the display reloads (re-seeding `prevLegsWon` to length 0), the next live message re-runs the diff against a zero-length baseline; once seeded, a subsequent identical-count message will not re-fire — but a state that arrives between seed and the next leg can leave the baseline pointing at the wrong leg, so a banner can fire for a leg that was already decided, or be skipped.

The banner is the headline D-09 spectator feature, and its visibility is timing-dependent rather than deterministic. 02-05 fixed the loop in this block but left the detection mechanism unchanged, so this is now the dominant correctness risk in the live path it just enabled.

**Fix:** Drive the banner from an explicit serialized signal instead of receiver-side count inference. Preferred — have the publisher tag leg/set transitions with a monotonic id the display reacts to idempotently:
```ts
// match.svelte.ts: on a leg/set win, include e.g.
//   state.lastWin = { playerId, kind: 'leg' | 'set', seq }
// display: show the banner whenever `seq` changes — replay-safe, skip-safe.
```
If inference must stay on the receiver, seed the baseline once from the hydrated snapshot *without* showing a banner, so "already won at connect" cannot be confused with "won just now":
```ts
$effect(() => {
  const s = matchState;
  if (!s || s.phase === 'setup') return;
  if (prevLegsWon.length === 0) {                 // first observation: seed only
    prevLegsWon = s.players.map(p => p.legsWon);
    prevSetsWon = s.players.map(p => p.setsWon);
    return;
  }
  // ...existing diff + dismiss logic...
});
```

## Warnings

### WR-01: "Ø Match" is mathematically wrong for every multi-leg match; shows 0.0 on the sets match-win screen

**File:** `src/engine/averages.ts:58-74`, `src/ui/display/PlayerPanel.svelte:36-39`, `src/ui/display/MatchWinDisplay.svelte:35-40`
**Issue:** `matchAverage(visits, startScore, remaining)` computes `scored = startScore - remaining`, which captures only the **current leg's** scoring, while `visits` (the denominator) spans **all legs** (the reducer resets `remaining` but not `visits`). From leg 2 onward the displayed match average is severely understated. Worse, in sets mode the set-win path resets every player's `remaining` to `startScore` (reducer.ts:276-281), so at match-complete `scored = startScore - startScore = 0` and `MatchWinDisplay` shows **0.0** for every player under the "Ø Match" label — the most prominent stat on the final screen. The `averages.ts` comment admits this ("handled in Phase 4"), but the wrong value is rendered to users in Phase 2.
**Fix:** Compute total scored from the visits themselves (sum per-visit points across all legs; numpad visits need their total persisted — see WR-04), or carry a cumulative `totalScored` per player. At minimum, return `null` (rendered `—`) from `matchAverage` once any leg is complete rather than render a confidently-wrong figure.

### WR-02: `win.opener = null` is unguarded and may throw on a non-writable opener

**File:** `src/ui/display/SpectatorChooser.svelte:26-32`
**Issue:** The 02-05 change relies on `win.opener = null` to preserve reverse-tabnabbing protection after dropping `noopener`. For `/display` (same-origin) this is usually writable, but `opener` can be a read-only accessor depending on browser/context; the assignment would then throw, and because it sits before `close()` with no try/catch, the chooser menu would stay open after a successful open. The test (`SpectatorChooser.test.ts:88`) uses a plain object with a writable `opener`, so it cannot detect this. Note also that nulling `opener` after the fact does not retract access the opened document already had during its initial script execution — for same-origin content this is acceptable defense-in-depth, but the guarantee is weaker than `noopener` provided.
**Fix:**
```ts
if (win) {
  try { win.opener = null; } catch { /* opener not writable — non-fatal */ }
  close();
} else {
  popupBlocked = true;
}
```

### WR-03: BUST flash never appears at bust time in multi-player games; strobes during the player's next turn

**File:** `src/ui/display/PlayerPanel.svelte:88-109`
**Issue:** The flash is gated on `isActive && lastCompletedVisit?.bust === true`. The reducer passes the turn immediately on a bust (reducer.ts:157), so when the display receives the state the busted player is no longer active — the flash never shows at bust time (except in 1-player games). One full rotation later, when that player is active again with the bust still as their last visit, `isBust` becomes true and BUST appears at the start of their **next** turn. When the 2s timer clears `showBust`, the effect re-runs (it reads `showBust`), finds `isBust && !showBust` true again, and re-shows — so BUST strobes every 2s for the whole next turn.
**Fix:** Detect a *new* bust visit independent of `isActive`: track previous `player.visits.length` (plain variable), trigger once when the count increases and the newest visit has `bust === true`. Guard re-triggering with the count, not with `showBust`.

### WR-04: Numpad visit total in the visit line is wrong for consecutive numpad visits and after the first leg

**File:** `src/ui/display/PlayerPanel.svelte:61-81`
**Issue:** Two defects in `completedTotal`:
1. Prior numpad visits contribute 0 to `priorScored` (the admitted "degenerate case" fallback, lines 75-77). Since the app deliberately remembers numpad mode per player (D-07), consecutive numpad visits are the *normal* case — so e.g. two 60-visits display "120" after the second instead of "60".
2. `priorVisits` spans **all legs** (`player.visits.slice(0, -1)`) while `totalScored = startScore - remaining` covers only the current leg. From leg 2 onward, prior-leg dart scores are subtracted from a current-leg-only figure, driving the result negative and clamping to `Math.max(0, …)` → the line shows "0".
**Fix:** Persist the numpad visit total on the `Visit` in the reducer (add `total?: number`), then `completedTotal = lastCompletedVisit?.total ?? null` removes all reconstruction. Interim: slice from `legStartIndex` instead of 0.

### WR-05: Bust visits with 1 or 2 darts are not counted as 3 darts thrown — violates the module's own rule

**File:** `src/engine/averages.ts:18-20`
**Issue:** The header states "Bust visits: count as 3 darts thrown, 0 scored," but `totalDartsThrown` computes `v.darts.length > 0 ? v.darts.length : 3`. A board-mode bust on dart 1 or 2 (overshoot/reach-1 on the first dart is possible) stores a 1-2 dart visit, counted as 1-2 — undercounting the denominator and inflating the average. The test helper `bustVisit()` always uses 3 darts, so this is untested.
**Fix:**
```ts
return visits.reduce((sum, v) => sum + (v.bust || v.darts.length === 0 ? 3 : v.darts.length), 0);
```
Add a 1-dart bust test.

### WR-06: `dartsUsed` is collected, logged, then dropped — numpad finishes always count as 3 darts

**File:** `src/engine/reducer.ts:210, 226-239`, `src/engine/types.ts:12-16`
**Issue:** `applyNumpadVisit` destructures `dartsUsed = 3` (line 210) but never uses it — dead variable. The finishing visit is stored as `darts: []`, and `totalDartsThrown` treats empty-dart visits as 3 darts. So a 1- or 2-dart numpad finish — the entire purpose of `DartsAtDoubleDialog` asking how many darts — is counted as 3, understating leg/match averages on every short finish. The value survives only in the event log, which nothing reads. `Visit` has no field to carry it.
**Fix:** Add `dartsUsed?: number` to `Visit`, store it on the finishing numpad visit, and make `totalDartsThrown` prefer `v.dartsUsed ?? (v.darts.length || 3)`. Otherwise remove the dead destructuring.

### WR-07: Set-win path hardcodes `totalLegsCompleted = 0` — player 0 starts the first leg of every set

**File:** `src/engine/reducer.ts:292-294`
**Issue:** After a set win that continues the match, `const totalLegsCompleted = 0` forces `nextLegStarter = legStarterIndex(0, n) = 0`. Combined with the within-set starter being derived from summed `legsWon` (reset to 0 each set), the starter sequence repeats identically every set: player 0 always throws first in each set's opening leg — a material advantage. Standard darts alternates the thrower continuously.
**Fix:** Track a cumulative leg counter on `MatchState` (e.g. `legsCompleted`, incremented on every leg win, never reset) and derive the starter from it in both the set-win and leg-win paths.

### WR-08: localStorage publish still serializes the raw reactive proxy (asymmetric with the 02-05 snapshot fix)

**File:** `src/stores/match.svelte.ts:40`
**Issue:** 02-05 changed the BroadcastChannel publish to `$state.snapshot(this.state)` but left `localStorage.setItem(LS_SNAPSHOT, JSON.stringify(this.state))` serializing the raw proxy. `JSON.stringify` tolerates the Svelte proxy today, so it does not throw — but the two sync paths now produce payloads differently, and the persistence path relies on the exact proxy→JSON coercion the team just stopped trusting for `postMessage`. If a future field holds a non-plain value, this fails silently in the `catch` and the cold-start snapshot stops updating with no signal.
**Fix:** Snapshot once, reuse for both sinks:
```ts
const snap = $state.snapshot(this.state);
try { const ch = new BroadcastChannel(BC_CHANNEL); ch.postMessage(snap); ch.close(); } catch {}
try { localStorage.setItem(LS_SNAPSHOT, JSON.stringify(snap)); } catch {}
```

### WR-09: Live-sync e2e (Test 3) can pass even if the BroadcastChannel path is broken

**File:** `e2e/spectator-sync.spec.ts:118-143`
**Issue:** Test 3 is intended to guard against `DataCloneError` regressions on the live path, but the display also hydrates from the **localStorage snapshot** written synchronously by every `dispatch()` (`match.svelte.ts:40`). Opening before the dart registers the BroadcastChannel listener, but the final `getByText('321')` assertion does not prove the update arrived *via* the channel — if live sync silently regressed, an incidental re-read of localStorage or a future `storage`-event fallback could still surface 321 and the test stays green. The test's stated purpose is not actually pinned.
**Fix:** Make the path-specific: after the display hydrates, clear/block the localStorage snapshot in the display tab (or spy on the channel) so the only route to 321 is a received message. Alternatively assert on a value reachable only via a delta the snapshot never held at open time.

### WR-10: Correction window silently skipped after UNDO — visit counts never sync downward

**File:** `src/routes/match/+page.svelte:66-88`
**Issue:** `lastVisitCounts[player.id]` only ever increases (line 79). After an UNDO that removes a completed visit, `player.visits.length` drops below the recorded count, but the record is not corrected. The player's next completed visit then fails `visits.length > prevCount` (e.g. 1 > 1 is false), so no correction window appears for that visit — the 2.5s review/undo affordance vanishes exactly after a correction was made, when it matters most.
**Fix:** In the watcher, when `player.visits.length < prevCount`, write the lower value back:
```ts
if (player.visits.length < prevCount) {
  lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length };
}
```

## Info

### IN-01: `'leg-complete'` phase is dead code; two comments describe a transition the reducer never makes

**File:** `src/engine/types.ts:42`, `src/routes/display/+page.svelte:48`, `src/routes/match/+page.svelte:97-98`
**Issue:** The reducer transitions leg wins directly to `'playing'` or `'match-complete'`; no path sets `'leg-complete'`. The display comment ("transitioning back to 'playing' (leg-complete → playing)") and the match-page comment ("watching for phase 'leg-complete' after a NUMPAD_VISIT") both describe a mechanism that does not exist — the match page actually uses a trial `reduce()` checking `match-complete`, and the display uses count-diffing. Stale comments actively mislead.
**Fix:** Remove `'leg-complete'` from the union (or mark reserved), and correct both comments to describe the real mechanisms.

### IN-02: Board-mode winning and bust visits hardcode `dartsAtDouble: 0`

**File:** `src/engine/reducer.ts:143-147, 165`
**Issue:** A board-entered winning dart is by definition a dart at a double (double-out), and busts at low scores often involve double attempts, yet both visit records store `dartsAtDouble: 0`. Phase 4 checkout statistics derived from visits will be wrong for board-mode play.
**Fix:** Record at least `dartsAtDouble: 1` on the winning visit; consider deriving attempts from darts thrown while remaining ≤ 50.

### IN-03: A new BroadcastChannel is constructed and torn down on every dispatch; snapshot includes the full event log

**File:** `src/stores/match.svelte.ts:30-33, 40`
**Issue:** Channel churn per dart is unnecessary; a single lazily-created module-level channel suffices and removes any risk of an immediate `close()` dropping a just-queued message. The localStorage snapshot also serializes `eventLog`, which grows with every dart — harmless now but worth noting before Phase 4.
**Fix:** Create the channel once (guarded by try/catch) and reuse it.

### IN-04: SpectatorChooser outside-click handler queries its own elements via global `document.querySelector`

**File:** `src/ui/display/SpectatorChooser.svelte:46-52`
**Issue:** `.chooser-menu` / `.chooser-icon-btn` are looked up document-wide; another element with those classes (or a second instance) would break dismissal.
**Fix:** Use `bind:this` element references with `element.contains(target)`.

### IN-05: Display-route exit timer not cleared on unmount; leg-win banner can leak into a new match

**File:** `src/routes/display/+page.svelte:79-108, 37-45`
**Issue:** (a) `exitTimerId` is cleared only via `exitToMatch`; navigating away by other means leaves the timeout pending and writing `$state` after destroy. (b) `legWinMessage` is cleared only on `currentVisit.length > 0`; if a *new* match starts while the banner is up, it persists over the fresh 501 board until the first dart.
**Fix:** Add an `$effect` teardown clearing the timer; also clear `legWinMessage` when a new match is detected (e.g. `eventLog.length <= 1` or all `remaining === startScore`).

### IN-06: Invalid finishing total opens the darts-at-double dialog, then the visit is silently dropped

**File:** `src/routes/match/+page.svelte:109-130`
**Issue:** If `remaining` equals an impossible total (e.g. 179) and the player enters it, `isFinish` is true, the trial `reduce()` returns unchanged state (`phase` still `'playing'`), so the "leg win that continues the match" branch shows the dialog; on confirm, the reducer rejects the visit and nothing happens — a confusing dead end.
**Fix:** After the trial reduce, verify the visit was accepted (e.g. `prospective.players[idx].remaining === 0`) before showing the dialog; otherwise treat as invalid input.

---

_Reviewed: 2026-06-11T18:43:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
