---
phase: 07-chromecast-integration
fixed_at: 2026-06-18T22:15:00Z
review_path: .planning/phases/07-chromecast-integration/07-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-06-18T22:15:00Z
**Source review:** .planning/phases/07-chromecast-integration/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (2 Critical, 4 Warning)
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: receiveSnapshot assigns CastDisplayState to MatchState slot — missing required fields

**Files modified:** `src/stores/display.svelte.ts`, `src/stores/display.svelte.test.ts`
**Commit:** 7ebd63f (fix), d53d958 (test assertions updated in WR-01 commit)
**Applied fix:** Replaced the `msg as unknown as MatchState` double cast with an explicit mapping step that builds a proper `MatchState`-shaped object. `CastDisplayState.players` elements are spread with `isGuest: false` and `legCompleted: []` added; `legStarterIndex: 0` and `eventLog: []` are padded at the state level. The `isValidCastState()` guard and BroadcastChannel path are untouched. Existing test assertions updated to use `expect.objectContaining` to match the padded shape.

---

### CR-02: cast-receiver-mock.ts CastReceiverBridge.init() accepts no arguments — onSnapshot silently dropped

**Files modified:** `src/test-mocks/cast-receiver-mock.ts`
**Commit:** 01b8737
**Applied fix:** Added `import type { ReceiverCallbacks } from '../lib/cast-receiver.js'` and changed `static init(): void` to `static init(_callbacks: ReceiverCallbacks): void`. The body remains a no-op; the signature now matches the real implementation so TypeScript can catch future drift.

---

### WR-01: cast-receiver.test.ts ordering test does not verify addEventListener(SENDER_DISCONNECTED) before start()

**Files modified:** `src/lib/cast-receiver.test.ts`
**Commit:** d53d958
**Applied fix:** Extended the ordering test to also mock `ctx.addEventListener` with `callOrder.push('addEventListener:' + eventType)` and added two new assertions: `disconnectIdx >= 0` and `disconnectIdx < startIdx`. The test title was updated to document both RECV-03 halves being verified. All 434 unit tests pass.

---

### WR-02: Stale inline comment in +page.svelte incorrectly states "ssr:false"

**Files modified:** `src/routes/display/+page.svelte`
**Commit:** a5df06f
**Applied fix:** Updated the two-line comment at line 139–140 from "the route has ssr:false but fullscreen API must only be called in browser context inside $effect / click handlers" to "ssr=true for this route (Chromecast prerender, D-04), so all DOM/fullscreen API calls must be inside $effect / click handlers (browser-only)." Code behavior is unchanged.

---

### WR-03: cast-sender.svelte.ts calls ctx.getCurrentSession() twice in SESSION_RESUMED handler

**Files modified:** `src/lib/cast-sender.svelte.ts`
**Commit:** b331c56
**Applied fix:** Cached `ctx.getCurrentSession()` result into a local `const session` variable, assigned `this.activeSession = session`, and replaced the second call `ctx.getCurrentSession()?.getCastDevice().friendlyName` with `session?.getCastDevice().friendlyName`. The `const deviceName` intermediate variable was also removed as it was no longer needed (direct assignment to `this.resumeDeviceName`).

---

### WR-04: ResumeToast.svelte directly writes castSenderManager.resumeDeviceName = null

**Files modified:** `src/ui/cast/ResumeToast.svelte`
**Commit:** 5adbfa4
**Applied fix:** Replaced `castSenderManager.resumeDeviceName = null` with `castSenderManager.consumeResumeSignal()` inside the `$effect`. The reactive dependency on `resumeDeviceName` is preserved (the read at the top of the effect still creates the dependency). The direct `$state` field write from an external component is eliminated.

---

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-06-18T22:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
