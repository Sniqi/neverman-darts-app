---
phase: 07-chromecast-integration
reviewed: 2026-06-18T00:00:00Z
depth: standard
iteration: 2
files_reviewed: 15
files_reviewed_list:
  - src/lib/cast-receiver.ts
  - src/lib/cast-sender.svelte.ts
  - src/lib/cast-types.ts
  - src/lib/sync-constants.ts
  - src/routes/display/+page.js
  - src/routes/display/+page.svelte
  - src/routes/match/+page.svelte
  - src/stores/display.svelte.ts
  - src/stores/match.svelte.ts
  - src/test-mocks/cast-receiver-mock.ts
  - src/ui/cast/ResumeToast.svelte
  - src/ui/display/PlayerPanel.svelte
  - src/ui/display/SpectatorChooser.svelte
  - src/lib/cast-receiver.test.ts
  - src/stores/display.svelte.test.ts
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 07: Code Review Report (Iteration 2)

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This is iteration 2 of the fix-and-review loop. Both prior critical issues have been correctly resolved. No new critical issues were introduced by the fixes. One pre-existing warning (the `ResumeToast` reactive self-cancellation hazard, formerly WR-04) was not fixed in iteration 1 and is carried forward. One new info item identifies a misleading test description in `display.svelte.test.ts`.

## Verification of Prior Critical Fixes

**CR-01 (`receiveSnapshot` double-cast) — FIXED.**
`display.svelte.ts` lines 126–135 now construct a genuine `MatchState` by spreading `msg` and explicitly padding all four omitted fields: `isGuest: false`, `legCompleted: []`, `legStarterIndex: 0`, `eventLog: []`. The result is assigned as `const state: MatchState = { ... }` — no `as unknown as` anywhere. All four padded fields map to real `MatchState` / `PlayerState` fields in `engine/types.ts` (lines 23, 29, 44, 47). The `isValidCastState(msg)` guard at line 120 is still called before the spread, preserving the validation discipline.

The `legCompleted` field on `PlayerState` is typed `optional` (`legCompleted?: Array<...>`) in `types.ts`, so padded `[]` is assignment-compatible even without casting. `legStarterIndex` and `eventLog` are required and padded with `0` and `[]` respectively — both correct. This is sound.

**CR-02 (mock `init` signature) — FIXED.**
`cast-receiver-mock.ts` line 39 now reads `static init(_callbacks: ReceiverCallbacks): void`. The `ReceiverCallbacks` type is imported at line 18 and matches the real `cast-receiver.ts` interface. The signatures are structurally identical.

**SYNC-04 regression check — none.**
`match.svelte.ts` `dispatch()` BC block (lines 109–115), localStorage block (117–121), and Cast publish block (123–126) are unchanged and additive. `display.svelte.ts` `connect()` BroadcastChannel handler is unchanged.

**CAST_NS single-source — intact.**
The literal `urn:x-cast:dev.neverman.match` appears only in `sync-constants.ts` line 38. Both `cast-sender.svelte.ts` and `cast-receiver.ts` import `CAST_NS` from there.

---

## Warnings

### WR-01: `ResumeToast.svelte` reads `resumeDeviceName` then calls `consumeResumeSignal()` inside the same `$effect` — self-triggering re-run on every resume event

**File:** `src/ui/cast/ResumeToast.svelte:29–35`

**Issue:** The `$effect` at line 29 reads `castSenderManager.resumeDeviceName`, establishing a reactive dependency on that `$state` field. When `name !== null`, the effect calls `castSenderManager.consumeResumeSignal()` at line 35, which executes `this.resumeDeviceName = null` inside `cast-sender.svelte.ts:132`. Writing to a `$state` field that is already tracked by the running effect triggers a second execution of the same effect in Svelte 5's scheduler. On the re-run `name` is `null`, the `if` branch is skipped, and no visible harm occurs — the self-triggering loop terminates after one extra run.

The risk is fragility, not a crash: if any statement is ever added outside the `if (name !== null)` block — such as a `clearTimer()` at the top for defensive guard — the second invocation will execute it with a null signal, potentially clearing a valid pending timer or causing double-logging. The pattern is structurally wrong even though the current output is incidentally correct.

This finding existed as WR-04 in iteration 1 and was not addressed by the fix pass.

**Fix:** Wrap the `consumeResumeSignal()` call with Svelte's `untrack()` so the write does not feed back into the effect's dependency set:

```typescript
import { untrack } from 'svelte';

$effect(() => {
    const name = castSenderManager.resumeDeviceName;
    if (name !== null) {
        clearTimer();
        deviceName = name;
        visible = true;
        // Write through untrack so setting resumeDeviceName=null does not re-run this effect
        untrack(() => castSenderManager.consumeResumeSignal());
        dismissTimer = setTimeout(() => {
            visible = false;
            dismissTimer = null;
        }, 3500);
    }
});
```

---

## Info

### IN-01: `display.svelte.test.ts` "non-object invalid payload" test body exercises valid ingress, not invalid ingress

**File:** `src/stores/display.svelte.test.ts:295–313`

**Issue:** The test titled "leaves state unchanged on a non-object invalid payload (T-07-IV)" (line 295) passes `null` at line 300, immediately notes in a comment that `null` triggers the RECV-03 idle-reset path (state becomes `null`, not "unchanged"), then calls `receiveSnapshot(sampleCastState)` to restore valid state, and finally asserts the restored state. The test never exercises the case the title claims — it re-exercises valid ingress. The separate test at line 316 ("sets state to null ... on null (RECV-03)") already covers the null path correctly.

This means `isValidCastState`'s rejection of truly malformed non-null payloads (e.g., a string, a number, or an object without `players`) is not covered by any test in the file.

**Fix:** Replace the body with an actual non-object and non-null-but-invalid payload:

```typescript
it('leaves state unchanged on a non-object invalid payload (T-07-IV)', () => {
    const store = new DisplayStore();
    store.receiveSnapshot(sampleCastState);
    const stateBefore = store.state;

    store.receiveSnapshot('not-an-object' as unknown as CastDisplayState);
    expect(store.state).toEqual(stateBefore);

    store.receiveSnapshot({ config: sampleCastState.config } as unknown as CastDisplayState);
    expect(store.state).toEqual(stateBefore);
});
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
