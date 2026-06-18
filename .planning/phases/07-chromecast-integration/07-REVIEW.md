---
phase: 07-chromecast-integration
reviewed: 2026-06-18T00:00:00Z
depth: standard
files_reviewed: 23
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
  - src/lib/cast-sender.test.ts
  - src/lib/cast-types.test.ts
  - src/stores/display.svelte.test.ts
  - src/stores/match.svelte.test.ts
  - src/ui/display/PlayerPanel.test.ts
  - vite.config.ts
  - tsconfig.receiver.json
  - .github/workflows/deploy.yml
  - .env.example
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-06-18
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

Phase 07 delivers the Chromecast receiver bridge, sender state machine, snapshot projection, and wiring into the match/display stores. The overall architecture is solid: the namespace constant is centralized in `sync-constants.ts`, CAF v3 listener ordering is correct, the third publish block in `dispatch()` is genuinely additive (BC and LS blocks are untouched), and input validation via `isValidCastState()` is applied at the receiver ingress.

Two blockers are present: a structural type mismatch that silently assigns an incomplete `CastDisplayState` object where a full `MatchState` is required (crashing any consumer that reads absent fields), and a test-mock signature mismatch that silently drops the receiver callback in all browser-mode tests that alias `cast-receiver.js`.

Four warnings cover a test gap in the CAF ordering verification, a stale inline comment that contradicts the actual SSR config, a double `getCurrentSession()` call under SESSION_RESUMED, and a direct `$state` field write from `ResumeToast` that bypasses the provided encapsulation method.

## Critical Issues

### CR-01: `receiveSnapshot` assigns `CastDisplayState` to `MatchState` slot — missing required fields cause silent undefined reads

**File:** `src/stores/display.svelte.ts:123`

**Issue:**
`receiveSnapshot()` performs `this.state = msg as unknown as MatchState`. The double type-cast forces TypeScript to accept the assignment, but `CastDisplayState` is structurally incompatible with `MatchState` in several ways:

- `CastDisplayState.players` elements are `CastPlayerState`, which lacks `isGuest` (a required field on `PlayerState`). Any consumer that reads `player.isGuest` will get `undefined`.
- `CastDisplayState` has no `eventLog` field (`MatchState` requires it). Any consumer reading `state.eventLog` will get `undefined`.
- `CastDisplayState` has no `legStarterIndex` field (`MatchState` requires it). Any consumer reading `state.legStarterIndex` will get `undefined`.
- `CastPlayerState` has no `legCompleted` field. Code paths that reach `matchAverageCrossLeg()` — which reads `player.legCompleted ?? []` — will degrade silently (treating it as `[]` is actually safe due to the `?? []` guard), but more dangerous is that `PlayerPanel.svelte` uses `matchAverage()` (the simpler, non-cross-leg version) which is fine, but if any future display component uses `matchAverageCrossLeg()` the absent field is invisible.

The immediate risk is `eventLog` and `legStarterIndex`. In the current `+page.svelte` those fields are not accessed directly — but the type system provides no protection against future code doing so, and the cast already hides a real structural mismatch that should be addressed by design.

**Fix:** Define a union type or introduce a dedicated `DisplayState` type that `DisplayStore.state` holds, rather than re-using `MatchState`. Alternatively, extend `CastDisplayState` to include the missing required fields (carrying them as stubs), or add a mapping step that pads the missing fields:

```typescript
// Option A: map to a minimal MatchState-compatible shape
receiveSnapshot(msg: CastDisplayState | null): void {
  if (msg === null) { /* ... */ return; }
  if (!isValidCastState(msg)) return;

  // Pad fields that MatchState requires but CastDisplayState omits
  const state: MatchState = {
    ...msg,
    players: msg.players.map(p => ({
      ...p,
      isGuest: false,        // Cast receiver has no guest concept
      legCompleted: [],      // Not transmitted; safe default
    })),
    legStarterIndex: 0,      // Not transmitted; safe default
    eventLog: [],            // Not transmitted; safe default
  };
  this.state = state;
  this.pauseActive = msg.pauseActive;
  this.pauseRemainingSeconds = msg.pauseRemainingSeconds;
}
```

---

### CR-02: `cast-receiver-mock.ts` `CastReceiverBridge.init()` accepts no arguments — the `onSnapshot` callback is silently dropped in all browser-mode component tests

**File:** `src/test-mocks/cast-receiver-mock.ts:37`

**Issue:**
The mock exports:
```typescript
export class CastReceiverBridge {
  static init(): void {
    // no-op
  }
}
```

The real `cast-receiver.ts` exports:
```typescript
export const CastReceiverBridge = {
  init(callbacks: ReceiverCallbacks): void { ... }
};
```

The `vite.config.ts` browser alias redirects `../../lib/cast-receiver.js` to this mock. When `+page.svelte` calls `CastReceiverBridge.init({ onSnapshot: (msg) => displayStore.receiveSnapshot(msg) })`, the argument is passed but the mock ignores it (zero-parameter function). TypeScript does not catch this because the alias replaces the module entirely at build time — the mock is not type-checked against the real interface.

Any browser-mode component test that exercises the Cast receiver path (e.g. a test that calls `setMockReceiverContext(true)` and then triggers the `onMount` that calls `CastReceiverBridge.init`) will silently have no working `onSnapshot` callback. The receiver ingress (`displayStore.receiveSnapshot`) will never be called, making such tests vacuously pass without testing the integration path.

**Fix:** Add the `callbacks` parameter to the mock's `init()` so the signature matches, even if the body remains a no-op:

```typescript
// src/test-mocks/cast-receiver-mock.ts
import type { ReceiverCallbacks } from '../lib/cast-receiver.js';

export class CastReceiverBridge {
  static init(_callbacks: ReceiverCallbacks): void {
    // no-op in test environment — prevents context.start() outside Cast device
  }
}
```

This also lets TypeScript enforce that callers pass a valid `ReceiverCallbacks` object, surfacing signature drift early.

---

## Warnings

### WR-01: `cast-receiver.test.ts` ordering test does NOT verify `addEventListener(SENDER_DISCONNECTED)` is registered before `start()`

**File:** `src/lib/cast-receiver.test.ts:101-133`

**Issue:**
The "calls addCustomMessageListener(CAST_NS, ...) BEFORE start()" test records `addCustomMessageListener` and `start()` in `callOrder`, but never pushes `'addEventListener'` into `callOrder`. The CAF v3 requirement documented in `cast-receiver.ts` (and in the phase brief) is that ALL listeners — both the custom message listener AND the `SENDER_DISCONNECTED` system event listener — are registered before `ctx.start()`. The test currently only verifies half of this constraint, and the `SENDER_DISCONNECTED` ordering is untested.

If a future refactor moves the `addEventListener` call to after `start()`, this test will not catch the regression.

**Fix:** Add `callOrder.push('addEventListener')` inside the mock's `addEventListener` implementation and assert it appears before `start()`:

```typescript
ctx.addEventListener.mockImplementation((eventType: string) => {
  callOrder.push(`addEventListener:${eventType}`);
});
ctx.start.mockImplementation(() => {
  callOrder.push('start');
});

// After calling CastReceiverBridge.init(...)
const startIdx = callOrder.indexOf('start');
const disconnectIdx = callOrder.indexOf('addEventListener:senderdisconnected');
expect(disconnectIdx).toBeGreaterThanOrEqual(0);
expect(disconnectIdx).toBeLessThan(startIdx);
```

---

### WR-02: Stale inline comment in `+page.svelte` incorrectly states `"ssr:false"` when the route actually exports `ssr = true`

**File:** `src/routes/display/+page.svelte:139`

**Issue:**
Line 139 reads:
```
// Guard document access — the route has ssr:false but fullscreen API must
```

`src/routes/display/+page.js` exports `export const ssr = true` (explicitly set to support Chromecast prerendering). The comment is a leftover from before Phase 07 changed the SSR setting. A future developer reading this comment may incorrectly assume `document` is always available in the script block, leading to unguarded DOM access being added without the `$effect` wrapper.

The current code is correct — `document` is only accessed inside `$effect` blocks (which are browser-only in Svelte 5) and inside event handlers. The comment is merely misleading.

**Fix:** Update the comment to reflect the current setting:
```typescript
// Guard document access — ssr=true for this route (Chromecast prerender, D-04), so
// all DOM/fullscreen API calls must be inside $effect / click handlers (browser-only).
```

---

### WR-03: `cast-sender.svelte.ts` calls `ctx.getCurrentSession()` twice in the `SESSION_RESUMED` handler — second call may return null

**File:** `src/lib/cast-sender.svelte.ts:109-115`

**Issue:**
On `SESSION_RESUMED`, the handler executes:
```typescript
this.activeSession = ctx.getCurrentSession();          // line 109 — may return a session

if (event.sessionState === SessionState.SESSION_RESUMED) {
  const deviceName =
    ctx.getCurrentSession()?.getCastDevice().friendlyName ?? null;  // line 115 — second call
  this.resumeDeviceName = deviceName;
}
```

`ctx.getCurrentSession()` is called twice. If the session is torn down between the two calls (possible if the SDK fires a rapid `SESSION_ENDED` event during the resume path — unlikely but documented as a known edge case in CAF v3), the second call returns null and `resumeDeviceName` is set to null. The toast then never shows, even though `activeSession` was successfully set from the first call. The user sees "Chromecast resumed" in the session state but gets no toast.

A related issue: `this.activeSession` is set from the first `getCurrentSession()` call, then `friendlyName` is read from a second separate call. A defensive implementation would read the session once and reuse it.

**Fix:** Cache the session result from the first call and reuse it:
```typescript
if (
  event.sessionState === SessionState.SESSION_STARTED ||
  event.sessionState === SessionState.SESSION_RESUMED
) {
  const session = ctx.getCurrentSession();
  this.activeSession = session;

  if (event.sessionState === SessionState.SESSION_RESUMED) {
    this.resumeDeviceName = session?.getCastDevice().friendlyName ?? null;
  }
}
```

---

### WR-04: `ResumeToast.svelte` directly writes `castSenderManager.resumeDeviceName = null` instead of calling `consumeResumeSignal()`

**File:** `src/ui/cast/ResumeToast.svelte:34`

**Issue:**
`castSenderManager` provides `consumeResumeSignal()` specifically to atomically read and clear `resumeDeviceName` (CAST-06). `ResumeToast.svelte` instead reads `resumeDeviceName` directly in `$effect` and then clears it by directly assigning `castSenderManager.resumeDeviceName = null`.

This bypasses the encapsulation pattern. `consumeResumeSignal()` is designed to be the single safe consumption point — if the signal handling logic becomes more complex (e.g., logging, metrics), direct field writes will not benefit from those changes. Additionally, writing directly to a `$state` field of a class from an external component `$effect` is a reactive coupling anti-pattern in Svelte 5: the `$effect` reads `resumeDeviceName` (creating a reactive dependency) and then writes it back, which creates a re-entry risk if Svelte's scheduler re-runs the effect before the write settles.

In practice the current code works because the `resumeDeviceName = null` write immediately terminates the condition `if (name !== null)`, preventing infinite re-triggering. But it is fragile.

**Fix:** Use the provided `consumeResumeSignal()` method:
```typescript
$effect(() => {
  // Reading resumeDeviceName creates the reactive dependency that re-runs
  // this effect when it changes.
  const name = castSenderManager.resumeDeviceName;
  if (name !== null) {
    clearTimer();
    deviceName = name;
    visible = true;
    castSenderManager.consumeResumeSignal(); // atomic read+clear, not a direct field write
    dismissTimer = setTimeout(() => {
      visible = false;
      dismissTimer = null;
    }, 3500);
  }
});
```

---

## Info

### IN-01: `tsconfig.receiver.json` includes `cast-types.ts` but that file has no receiver SDK types — inclusion is over-broad

**File:** `tsconfig.receiver.json:7`

**Issue:**
`tsconfig.receiver.json` includes both `src/lib/cast-receiver.ts` (which requires `@types/chromecast-caf-receiver`) and `src/lib/cast-types.ts` (a pure types module with no receiver SDK dependencies). The purpose of this separate tsconfig is to scope CAF receiver globals to the minimum set of files (as documented in the `cast-receiver.ts` file header). Including `cast-types.ts` is harmless but unnecessarily widens the scope.

**Fix:** Remove `src/lib/cast-types.ts` from the `include` array unless it ever gains receiver-SDK references:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["chromecast-caf-receiver"]
  },
  "include": [
    "src/lib/cast-receiver.ts"
  ]
}
```

---

### IN-02: `vite.config.ts` browser test alias key is a relative path — will fail for any test file not exactly two directories below `src/lib/`

**File:** `vite.config.ts:113-115`

**Issue:**
```typescript
alias: {
  '../../lib/cast-receiver.js': resolve(import.meta.dirname, 'src/test-mocks/cast-receiver-mock.ts')
}
```

Vite resolves module aliases against the import string literally. The key `'../../lib/cast-receiver.js'` matches only when the importing file is exactly two directory levels below `src/lib/`. `src/routes/display/+page.svelte` imports from `../../lib/cast-receiver.js` (two levels up from `src/routes/display/`) — this works. However, a test file at `src/ui/display/PlayerPanel.test.ts` that might import the component which imports cast-receiver at a different relative path would not be caught by this alias.

As long as the alias is only needed for `PlayerPanel.test.ts` (which tests `PlayerPanel.svelte`, which does NOT directly import cast-receiver), this is currently safe. The risk is that any new test file outside `src/routes/display/` that imports cast-receiver directly would bypass the mock.

**Fix:** Use the resolved absolute module path as the alias key, or use a module name alias (e.g., `$cast-receiver`), or use a Vite `resolve.alias` with a regex pattern:
```typescript
alias: [
  {
    find: /.*\/lib\/cast-receiver\.js$/,
    replacement: resolve(import.meta.dirname, 'src/test-mocks/cast-receiver-mock.ts')
  }
]
```

---

### IN-03: `deploy.yml` — `permissions: contents: read` at workflow level does not grant `pages: write` to the `build` job; this relies on the implicit `deploy` job permission inheritance

**File:** `.github/workflows/deploy.yml:10-11`

**Issue:**
The top-level `permissions` block grants only `contents: read`. The `deploy` job correctly overrides this with `pages: write` and `id-token: write`. However, the `build` job inherits only `contents: read`, which is correct for checkout — but the `actions/configure-pages@v4` step (line 31) may require `pages: write` or `id-token: write` to enable Pages on first run. If it does not have those permissions the first deployment may silently fail or partially configure.

This is a low-severity issue because in practice `actions/configure-pages` only reads configuration on non-first runs. The risk is limited to first-deploy scenarios.

**Fix:** Confirm that `actions/configure-pages@v4` does not require write permissions in the `build` job, or add explicit per-job permissions:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: read   # only if configure-pages needs it
```

---

_Reviewed: 2026-06-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
