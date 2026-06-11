---
phase: 02-spectator-display
reviewed: 2026-06-11T17:05:53Z
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
  critical: 2
  warning: 10
  info: 6
  total: 18
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-11T17:05:53Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the Phase 2 spectator-display implementation: sync stores (publisher/subscriber), display route, six display UI components, the SpectatorChooser entry point, engine additions (averages, legStartVisitIndex), and the associated unit/component/e2e tests.

Two critical defects undermine the phase's core deliverable. First, the BroadcastChannel publisher posts a Svelte 5 `$state` proxy, which structured clone cannot serialize — the resulting `DataCloneError` is silently swallowed, so **live sync (DISP-05) never functions**; the spectator only updates on reload/reopen. The e2e suite happens to test only the reload path, which is exactly why this slipped through. Second, the leg-win watcher effect on the display route reads and reassigns `$state` arrays on every run, producing an infinite effect-update loop (`effect_update_depth_exceeded`) whenever a match is active.

Beyond those, there is a cluster of correctness defects in displayed statistics (match average wrong for every multi-leg match, bust visits undercounting darts, numpad finishes always counted as 3 darts, numpad visit totals shown wrong after leg 1 and for consecutive numpad visits), a guaranteed false-positive "popup blocked" message caused by `noopener` semantics, and a BUST flash that fires at the wrong time. The pure reducer and the static presentation components (IdleScreen, LegWinBanner, MatchHeader, VisitLine) are otherwise solid; no security issues found (no `{@html}`, no injection surfaces, same-origin-only channels).

## Critical Issues

### CR-01: BroadcastChannel live sync is silently dead — `postMessage` is called with a Svelte `$state` proxy

**File:** `src/stores/match.svelte.ts:29-36`
**Issue:** `MatchStore.state` is a class-field `$state` in Svelte 5, which wraps the state object in a deeply reactive `Proxy`. `ch.postMessage(this.state)` runs the structured clone algorithm on that proxy. Per the HTML spec, structured clone throws `DataCloneError` for Proxy exotic objects (they carry `[[ProxyHandler]]`/`[[ProxyTarget]]` internal slots) — the same well-known failure as posting a Vue `reactive()` object. The surrounding `try/catch` then swallows the error on **every dispatch**, so no message is ever delivered and the failure is invisible. The spectator display therefore never receives live updates; it only shows fresh state via the localStorage snapshot on connect/reload. This is the primary DISP-05 requirement.

Neither test layer can catch this: the unit tests replace `BroadcastChannel` with a mock that passes the object by reference (no structured clone), and both e2e tests reload the display page instead of asserting a live update (see WR-09). The e2e file's own header comment ("the reliable path for DISP-05 is the localStorage snapshot handshake") documents the symptom of this bug.

**Fix:**
```ts
// dispatch():
try {
	const ch = new BroadcastChannel(BC_CHANNEL);
	ch.postMessage($state.snapshot(this.state)); // unwrap the reactive proxy
	ch.close();
} catch {
	// ...
}
```
`$state.snapshot()` is exactly the documented escape hatch for passing runes state to `structuredClone`/`postMessage`. Then add a real live-sync assertion to the e2e suite (update display without reloading it) so a regression cannot hide behind the catch block again.

### CR-02: Infinite `$effect` update loop on the display route — `prevLegsWon`/`prevSetsWon` are `$state` that the effect reads and reassigns every run

**File:** `src/routes/display/+page.svelte:34-71`
**Issue:** The leg-win watcher effect reads `prevLegsWon` / `prevSetsWon` (lines 49, 52, 58) and unconditionally reassigns both with **freshly created arrays** at the end of every run (lines 69-70). Because the new arrays are new references, the `$state` signals always register as changed, which reschedules the same effect, which assigns new arrays again — an unbounded self-retriggering loop. Svelte 5 aborts this with the `effect_update_depth_exceeded` runtime error as soon as the effect body gets past the early return, i.e. whenever `matchState` is non-null and not in `setup` — the normal operating condition of the display. After the root effect errors, the page's reactivity is broken (banner logic and any subsequent effect-driven updates stop). The e2e tests still pass because the initial DOM (with the hydrated score) renders before effects flush and the tests only assert static text after a reload.

**Fix:** These trackers are only ever used inside the effect — they need no reactivity at all. Declare them as plain variables:
```ts
let prevLegsWon: number[] = [];
let prevSetsWon: number[] = [];
```
(Alternatively wrap the reads/writes in `untrack`, but plain `let` is simpler and correct.) Same pattern note for `legWinMessage`: it is read (line 42) and written (lines 43, 55) in the same effect, which is acceptable only because the writes converge — keep that in mind when editing.

## Warnings

### WR-01: "Ø Match" is mathematically wrong for every multi-leg match; shows 0.0 on the sets match-win screen

**File:** `src/engine/averages.ts:58-74`, `src/ui/display/PlayerPanel.svelte:36-39`, `src/ui/display/MatchWinDisplay.svelte:35-40`
**Issue:** `matchAverage(visits, startScore, remaining)` computes `scored = startScore - remaining`, which only captures the **current leg's** scoring, while `visits` (the denominator) spans **all legs** (the reducer never resets `visits`, only `remaining`). From leg 2 onward the displayed match average is severely understated. Example: a player wins a 501 leg in 15 darts three times (legsToWin=3). At match-complete: scored = 501−0 = 501, darts = 45 → shown average 33.4 instead of ~100.2. Worse, in sets mode the match-complete path resets every player's `remaining` to `startScore` (reducer.ts:276-281), so `scored = 0` and the match-win screen shows **0.0** for everyone. The doc comment in `averages.ts` acknowledges the limitation ("handled in Phase 4"), but `MatchWinDisplay` ships this number under the label "Ø Match" today, and the match-win screen is by definition shown only after multiple legs — i.e., the displayed value is wrong in essentially every real match.
**Fix:** Compute total scored from the visits themselves instead of `startScore - remaining`, e.g. accumulate per-visit scored amounts (dart visits: sum of darts unless bust; numpad visits need their total persisted — see WR-06), or track a cumulative `totalScored` per player in `PlayerState`. At minimum, do not render "Ø Match" from this formula on the match-win screen until the cross-leg accumulation exists.

### WR-02: `window.open(..., 'noopener,noreferrer')` returns `null` on success — popup-blocked message fires every time

**File:** `src/ui/display/SpectatorChooser.svelte:25-32`
**Issue:** Per spec (and in Chrome/Edge/Firefox), when `noopener` is in the features string, `window.open` returns `null` **even when the window opens successfully**. So `if (!win) popupBlocked = true` triggers the "Bitte Popups für diese Seite erlauben" warning on every successful open of the second window, and the chooser menu never closes (the `else close()` branch is unreachable). The popup-blocked detection (T-02-07) is fundamentally incompatible with `noopener`. The component test masks this by stubbing `window.open` to return an object (`SpectatorChooser.test.ts:18`), encoding the wrong assumption.
**Fix:** `/display` is same-origin app content, so the practical options are: (a) open without `noopener` in the features string and immediately null the opener reference is not needed since you keep the return value only for the null check — i.e. `const win = window.open(url, '_blank'); if (win) { win.opener = null; close(); } else { popupBlocked = true; }` — this preserves the no-reverse-tabnabbing guarantee AND a working popup-block check; or (b) keep `noopener` and remove the unreliable null check entirely. Update the test stub to match real browser behavior.

### WR-03: BUST flash never appears at bust time in multi-player games; instead it strobes during the player's next turn

**File:** `src/ui/display/PlayerPanel.svelte:88-109`
**Issue:** The flash is gated on `isActive && lastCompletedVisit?.bust === true`. But the reducer passes the turn immediately on a bust (reducer.ts:157), so by the time the display receives the state, the busted player has `isActive === false` — the flash never shows when the bust happens (except in 1-player games). One full rotation later, when that player becomes active again and their last completed visit is still the bust, `isBust` turns true and BUST appears — at the start of their **next** turn. Additionally, when the 2s timer clears `showBust`, the effect re-runs (it reads `showBust`), finds `isBust && !showBust` true again, and re-shows the overlay — so BUST flashes on/off every 2 seconds for the entire duration of that next turn until a new visit is recorded.
**Fix:** Detect a *new* bust visit rather than deriving from `isActive`: track the previous `player.visits.length` (plain variable), and trigger the flash once when the length increases and the newest visit has `bust === true`, independent of `isActive`. Guard re-triggering with that count, not with `showBust`.

### WR-04: Numpad visit total in the visit line is wrong for consecutive numpad visits and after the first leg

**File:** `src/ui/display/PlayerPanel.svelte:61-81`
**Issue:** Two independent defects in `completedTotal`:
1. Prior numpad visits contribute 0 to `priorScored` (admitted "degenerate case" fallback), so for a player using numpad mode — which the app deliberately remembers per player (D-07), making consecutive numpad visits the *normal* case — the line shows the cumulative leg total, not the visit total. E.g. two 60-visits: displays "120" after the second visit instead of "60".
2. `priorVisits` spans **all legs** (`player.visits.slice(0, -1)`) while `totalScored = startScore - remaining` covers only the current leg. From leg 2 onward, prior-leg dart scores are subtracted from a current-leg-only figure, driving the result negative and clamping to `Math.max(0, …)` — the line shows "0" for numpad visits.
**Fix:** The root cause is that numpad visit totals are not persisted on the `Visit` (darts is `[]`). Add `total?: number` (or persist synthetic darts) to numpad visits in the reducer; then this fragile reconstruction disappears entirely. As an interim fix, at minimum slice from `legStartIndex` instead of 0.

### WR-05: Bust visits with 1 or 2 darts are not counted as 3 darts thrown — violates the module's own documented rule

**File:** `src/engine/averages.ts:18-20`
**Issue:** The file header states "Bust visits: count as 3 darts thrown, 0 scored" (standard darts convention), but `totalDartsThrown` computes `v.darts.length > 0 ? v.darts.length : 3`. A board-mode bust on dart 1 or dart 2 (entirely possible: overshoot or reach 1 on the first dart) stores a visit with 1-2 darts, which counts as 1-2 — undercounting the denominator and inflating the average. The test suite's `bustVisit()` helper always uses exactly 3 darts, so this gap is untested.
**Fix:**
```ts
return visits.reduce(
	(sum, v) => sum + (v.bust || v.darts.length === 0 ? 3 : v.darts.length),
	0
);
```
Add a test with a 1-dart bust visit.

### WR-06: `dartsUsed` is collected, logged, then dropped — numpad finishes always count as 3 darts in averages

**File:** `src/engine/reducer.ts:210, 226-239`, `src/engine/types.ts:12-16`
**Issue:** `applyNumpadVisit` destructures `dartsUsed = 3` and never uses it (dead variable). The finishing visit is stored as `darts: []`, and `totalDartsThrown` treats empty-dart visits as 3 darts. So a 1- or 2-dart numpad finish — the entire point of the `DartsAtDoubleDialog` asking "wie viele Darts?" — is counted as 3 darts, understating leg and match averages on every short finish. The data survives only in the event log, where nothing reads it. The `Visit` interface has no field to carry it.
**Fix:** Add `dartsUsed?: number` to `Visit`, store it in the finishing numpad visit, and make `totalDartsThrown` prefer `v.dartsUsed ?? (v.darts.length || 3)`. Remove the unused destructuring otherwise.

### WR-07: Set-win path hardcodes `totalLegsCompleted = 0` — player 0 starts the first leg of every set

**File:** `src/engine/reducer.ts:292-294`
**Issue:** After a set win (match continues), `const totalLegsCompleted = 0` forces `nextLegStarter = 0`. Combined with within-set starter computation summing `legsWon` (which is reset to 0 at each set start), the starter sequence is identical every set: player 0, player 1, … Player 0 systematically throws first in every set's first leg — a material advantage. Standard darts alternates the thrower continuously across legs (and alternates set starters).
**Fix:** Track a cumulative leg counter on `MatchState` (e.g. `legsCompleted: number`, incremented on every leg win, never reset), and derive `legStarterIndex(legsCompleted, numPlayers)` from it in both the set-win and leg-win paths.

### WR-08: Snapshot/channel payloads are trusted without shape validation — schema drift crashes the display route

**File:** `src/stores/display.svelte.ts:33-46`, `src/routes/display/+page.svelte:25, 133`
**Issue:** `JSON.parse(raw) as MatchState` only guards against *syntactically* invalid JSON. Valid JSON of the wrong shape (a snapshot persisted by an older/newer app version after a schema change — e.g. one without `legStartVisitIndex`, or with `players` missing) passes the cast, and the route then dereferences `matchState.players.reduce(...)` and `matchState.legStartVisitIndex[player.id]`, throwing a TypeError that takes down the spectator page until localStorage is manually cleared. `MatchState` *will* evolve (Phase 4 adds stats). The same applies to `e.data` from the BroadcastChannel listener (line 44-46). The store's security comment claims T-02-01 is satisfied by the try/catch, which is misleadingly incomplete.
**Fix:** Add a minimal structural guard before accepting either source, e.g.:
```ts
function isMatchState(v: unknown): v is MatchState {
	return !!v && typeof v === 'object'
		&& Array.isArray((v as MatchState).players)
		&& typeof (v as MatchState).phase === 'string'
		&& typeof (v as MatchState).legStartVisitIndex === 'object';
}
```
Optionally version the snapshot key (`neverman-match-snapshot-v1`) so schema changes invalidate old data automatically.

### WR-09: e2e suite never exercises the live BroadcastChannel path; Test 1 is a strict subset of Test 2

**File:** `e2e/spectator-sync.spec.ts:60-110`
**Issue:** Both tests verify only the localStorage-hydration path (open or reload the display page after a visit). No test asserts that an already-open display updates **without** a reload — the actual "live sync" half of DISP-05. This is precisely the gap that lets CR-01 (broken `postMessage`) ship undetected. Additionally, lines 60-79 (Test 1) are a verbatim subset of lines 84-99 (Test 2's first half) — Test 1 adds no coverage.
**Fix:** Replace Test 1 with a live-sync test: open `/display`, assert 501 visible, enter a visit on the scoring page, then assert 321 appears on the display **without** calling `reload()`.

### WR-10: Correction window silently skipped after UNDO — visit counts never sync downward

**File:** `src/routes/match/+page.svelte:66-88`
**Issue:** `lastVisitCounts[player.id]` only ever increases. After an UNDO that removes a completed visit, `player.visits.length` drops below the recorded count, but the record is not corrected. The player's next completed visit then satisfies `visits.length > prevCount === false` (e.g. 1 > 1), so no correction window appears for that visit — the 2.5s review/undo affordance silently disappears exactly after a correction was made, the moment it matters most.
**Fix:** In the watcher effect, when `player.visits.length < prevCount`, write the lower value back: `lastVisitCounts = { ...lastVisitCounts, [player.id]: player.visits.length }`.

## Info

### IN-01: `'leg-complete'` phase is dead — never produced by the reducer; comment references it misleadingly

**File:** `src/engine/types.ts:42`, `src/routes/match/+page.svelte:98`
**Issue:** The reducer transitions leg wins directly to `'playing'` or `'match-complete'`; no code path ever sets `'leg-complete'`. The comment in `match/+page.svelte` ("We detect this by watching for phase 'leg-complete'") describes a mechanism that does not exist (the code actually uses `prevRemaining === total`).
**Fix:** Either remove `'leg-complete'` from the union or document it as reserved; fix the stale comment.

### IN-02: Board-mode winning and bust visits hardcode `dartsAtDouble: 0`

**File:** `src/engine/reducer.ts:143-147, 165`
**Issue:** A board-entered winning dart is by definition a dart at a double (double-out), and busts at ≤50 often involve double attempts, yet both visit records store `dartsAtDouble: 0`. Phase 4 checkout statistics computed from visits will be wrong for board-mode play.
**Fix:** For the winning visit, record at least `dartsAtDouble: 1` (the finishing dart); consider deriving attempts from darts thrown while remaining ≤ 50 with an even score.

### IN-03: A new BroadcastChannel is constructed and torn down on every dispatch; snapshot serializes the full event log

**File:** `src/stores/match.svelte.ts:31-33, 40`
**Issue:** Channel churn per dart is unnecessary; a single lazily-created module-level channel suffices and removes any risk of a queued message being dropped by an immediate `close()`. The localStorage snapshot also includes `eventLog`, which grows with every dart over a long match — harmless today but worth noting before Phase 4 piles stats on.
**Fix:** Create the channel once (guarded by try/catch) and reuse it.

### IN-04: SpectatorChooser outside-click handler queries its own elements via global `document.querySelector`

**File:** `src/ui/display/SpectatorChooser.svelte:45-52`
**Issue:** `.chooser-menu`/`.chooser-icon-btn` are looked up document-wide; any other element with those classes (or a second component instance) breaks the dismissal logic.
**Fix:** Use `bind:this` element references and `element.contains(target)`.

### IN-05: Display-route exit timer not cleared on unmount; leg-win banner can leak into a new match

**File:** `src/routes/display/+page.svelte:79-108, 37-45`
**Issue:** (a) `exitTimerId` is only cleared via `exitToMatch`; navigating away by other means leaves the timeout pending and writing `$state` after destroy. (b) `legWinMessage` is cleared only on `currentVisit.length > 0`; if a *new* match is started while the banner is up, the banner persists over the fresh 501 board until the first dart.
**Fix:** Add an `$effect` teardown (or `onDestroy`) clearing the timer; also clear `legWinMessage` when `eventLog.length <= 1` / players reset (new match detected).

### IN-06: Invalid finishing total opens the darts-at-double dialog, then the visit is silently dropped

**File:** `src/routes/match/+page.svelte:109-130`
**Issue:** If `remaining` equals an impossible total (e.g. 179) and the player enters exactly that, `isFinish` is true, the trial reduce returns unchanged state (`phase` still `'playing'`), so the code takes the "leg win that continues the match" branch and shows the dialog; on confirm, the reducer rejects the visit and nothing happens — confusing dead-end UX.
**Fix:** After the trial reduce, also verify the visit was accepted (e.g. `prospective !== matchStore.state` or `prospective.players[idx].remaining === 0`) before showing the dialog; otherwise treat as invalid input.

---

_Reviewed: 2026-06-11T17:05:53Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
