---
phase: 11-spectator-display
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/stores/match.svelte.ts
  - src/stores/match.svelte.test.ts
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 11: Code Review Report (gap-closure — Plan 04)

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the diff between `2531eed^` and `HEAD` for `src/stores/match.svelte.ts` and
`src/stores/match.svelte.test.ts` — the single-line addition of `this.#publishToCast()` at
the end of `#broadcastPause()`, plus 4 new "Gap Test 5" regression tests and a local
`makeFakeCastManager()` helper.

Verified against the three correctness questions in the review scope:

- **No-op with no active Cast session (SYNC-04):** Confirmed correct. `#publishToCast()`
  guards on `!this.#castManager?.activeSession` and returns early; `#broadcastPause()`
  calling it unconditionally does not violate the additive/non-fatal contract. The new
  "pause cycle does not throw when no Cast manager is set" test exercises this path.
- **No re-entrancy / publish loop:** Confirmed. Neither `#broadcastPause()` nor
  `#publishToCast()` calls `dispatch()` or `reduce()` — the T-04-14 anti-infinite-loop
  contract holds.
- **Tests assert fresh, not stale, pause values:** Confirmed for the 4 new tests — the
  "trigger" test correctly reads the *last* `sendSnapshot` call (not the first), and the
  `decrementPause`/`resumePause` tests correctly `mockClear()` before invoking the method
  under test, isolating exactly one fresh call each.

One real defect was found: the fix, as wired into `dispatch()`, causes a **duplicate Cast
publish with a stale intermediate payload** on the exact dispatch that crosses the
auto-pause threshold. This is a direct, provable consequence of the added line interacting
with the pre-existing unconditional `#publishToCast()` call in `dispatch()`. See CR-01/WR-01
below.

## Warnings

### WR-01: Auto-pause-triggering dispatch sends two Cast snapshots — the first carries stale pause state

**File:** `src/stores/match.svelte.ts:100-147` (`dispatch()`), interacting with
`src/stores/match.svelte.ts:450-463` (`#broadcastPause()`)

**Issue:**
`dispatch()` unconditionally calls `this.#publishToCast()` once per dispatch (line 126,
pre-existing), *before* `this.#checkAutoPause(prevState, this.state)` runs (line 146). When
a dispatch also crosses the auto-pause threshold, `#checkAutoPause()` sets
`this.pauseActive = true` / `this.pauseRemainingSeconds = ...` and then calls
`this.#broadcastPause()`, which — after this change — *also* calls `this.#publishToCast()`
(line 462).

Net effect: on the specific dispatch that triggers a pause, `sendSnapshot()` fires **twice**
in the same synchronous tick:

1. The dispatch()-level call (line 126) — sent with `pauseActive` still `false` /
   `pauseRemainingSeconds` still `0` (stale — `#checkAutoPause` hasn't run yet).
2. The `#checkAutoPause` → `#broadcastPause` → `#publishToCast` call (line 462) — sent with
   the fresh, correct `pauseActive: true` / `pauseRemainingSeconds: <minutes*60>`.

Both messages are sent over the same real Cast session (`cast.framework.CastSession
.sendMessage`), which involves actual network transmission to a physical Chromecast device —
unlike the synchronous in-process assertions in the new unit tests, arrival on the receiver
is not guaranteed to coincide with the synchronous JS tick that produced them. This means the
TV can legitimately render an intermediate frame — "leg/set just won, no pause overlay" —
immediately followed by the corrected "pause overlay showing" frame. This is the same class
of symptom (pause not immediately visible on the receiver) that this gap-closure change set
out to fix, reintroduced transiently at the exact moment it matters most (leg win → pause
trigger).

The new tests do not catch this because the "trigger" test intentionally reads the *last*
`sendSnapshot` call rather than asserting a call count, which papers over the duplicate/stale
first send rather than exercising it.

**Fix:** Reorder `dispatch()` so pause state is finalized before the (single) unconditional
Cast publish runs, eliminating the stale intermediate message:

```ts
// dispatch(): move #checkAutoPause before the unconditional #publishToCast call
const recordItems = this.#detectRecords(prevState, this.state);
if (recordItems.length > 0) {
    this.pendingRecords = recordItems;
    this.#broadcastRecordEvent(recordItems);
}
if (this.state.phase === 'match-complete') {
    this.#persistCompletedMatch(this.state);
}

// Finalize pause state BEFORE publishing to Cast, so the single unconditional
// publish below (and the BC/LS blocks above it) always carry fresh pause values.
this.#checkAutoPause(prevState, this.state);

this.#publishToCast();
```

Note this still leaves a harmless *duplicate-but-fresh* send on the trigger dispatch (since
`#checkAutoPause` → `#broadcastPause` also calls `#publishToCast()` internally) — that
residual redundancy is out of scope per the v1 performance exclusion, but it no longer
transmits incorrect/stale state to the receiver. If eliminating the duplicate entirely is
desired, thread a `skipCastPublish` flag or return a "pause just triggered" signal from
`#checkAutoPause()` that the caller uses to skip the redundant call — but that is optional
polish beyond fixing the stale-message defect.

## Info

### IN-01: Near-duplicate test helper for fake CastSenderManager

**File:** `src/stores/match.svelte.test.ts:611-617` (`makeFakeCastManager`) vs.
`src/stores/match.svelte.test.ts:869-874` (`makeFakeManager`, pre-existing, same file)

**Issue:** The new `makeFakeCastManager()` (no-arg, always-active session) duplicates the
shape of the pre-existing `makeFakeManager(sessionActive: boolean)` a few hundred lines
later in the same file. The new helper's own comment ("mirrors makeFakeManager below")
acknowledges this. Two near-identical mock factories for the same fake type increase the
chance the two drift out of sync (e.g., if `CastSenderManager`'s public shape changes, one
helper could be updated and the other missed).

**Fix:** Either hoist a single shared `makeFakeCastManager(sessionActive = true)` to
module scope and reuse it in both `describe('matchStore.pause', ...)` and
`describe('#publishToCast (SYNC-02 / SYNC-04)', ...)`, or have the local helper delegate:

```ts
function makeFakeCastManager() {
    return { activeSession: {} as cast.framework.CastSession, sendSnapshot: vi.fn() };
}
```
→
```ts
function makeFakeCastManager() {
    return makeFakeManager(true); // defined later in the file — would need hoisting
}
```
Simplest fix given `makeFakeManager` is defined later in the file: move `makeFakeManager`
to a shared module-level helper above both describe blocks and delete the newly added
`makeFakeCastManager`, calling `makeFakeManager(true)` at the 3 new Gap Test 5 call sites.

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
