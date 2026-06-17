# Project Research Summary

**Project:** Neverman Darts App — v1.1 Chromecast Integration
**Domain:** Google Cast (CAF) sender + Custom Web Receiver in a deployed SvelteKit static PWA
**Researched:** 2026-06-18
**Confidence:** MEDIUM (all four files grounded in official Google Cast docs; SDK edge cases and PWA-Cast interaction gaps require real-device validation)

---

## Executive Summary

Adding Google Cast to the Neverman Darts App is a well-scoped, additive integration: the tablet (`/match`) becomes a Cast sender, and the existing scoreboard (`/display`) is extended to also function as a Custom Web Receiver on the Chromecast. The entire sync model mirrors the existing BroadcastChannel pattern — a full state snapshot on connect, then per-throw updates — so no new state-management concepts are introduced. Both Cast SDKs load at runtime from `gstatic.com` with no npm runtime packages; only two `@types` dev-dependencies are added. The sender layer hooks into the existing `MatchStore.dispatch()` publish seam additively, leaving the BroadcastChannel and localStorage paths completely unchanged.

The recommended approach is to wire Cast as a third transport alongside the two that already exist, with clear separation of concerns: `CastSenderManager` owns SDK lifecycle, `MatchStore` adds one private publish method, and the receiver page (`/display`) detects its execution context on mount and activates the CAF receiver bridge only when running on a Chromecast. ARCHITECTURE.md maps exact line numbers in the existing codebase for every surgical change and specifies an eight-step build order that keeps local sync working at every step.

The primary risk is not code complexity — it is the external dependency on the Google Cast Developer Console: the $5 one-time registration, the Chromecast serial number registration, and the 15-minute propagation + device reboot cycle mean that no end-to-end test on a real Chromecast is possible until those human steps are completed. Two genuine design tensions identified across the research files (receiver entry point strategy and message payload schema) must be decided before implementation begins — they are mutually exclusive choices with real tradeoffs, detailed in the Open Decisions section.

---

## Key Findings

### Recommended Stack

No npm runtime packages are added for Cast. Both the CAF Sender SDK and the CAF Receiver SDK are CDN-only (`gstatic.com`) by Google's design. The only new installs are `@types/chromecast-caf-sender@1.0.11` and `@types/chromecast-caf-receiver@6.0.26` as dev-dependencies. The receiver types must be scoped to a separate `tsconfig.receiver.json` to prevent their globals from polluting the sender namespace. CAF v3 (Receiver SDK version 3.0.0151, May 2026) is current; do not use v2. The sender SDK requires `?loadCastFramework=1` in its URL — without it only the legacy low-level API loads, not `cast.framework.*`. Two Workbox configuration additions (`globIgnores` and `navigateFallbackDenylist`) in `vite.config.ts` are required to prevent the service worker from intercepting or precaching the receiver page.

**Core technologies (new for v1.1):**
- Cast Sender SDK (gstatic CDN): sender session management, device picker, custom channel — Chrome/Chromium only; gracefully degrade on other browsers
- CAF Web Receiver SDK v3 (gstatic CDN): receiver lifecycle, custom message listener, `disableIdleTimeout` — loaded in `/display` only
- `@types/chromecast-caf-sender@1.0.11`: TypeScript types for sender globals (devDep only)
- `@types/chromecast-caf-receiver@6.0.26`: TypeScript types for receiver globals (devDep only, must be scoped)
- Workbox `navigateFallbackDenylist` + `globIgnores`: prevent SW from intercepting receiver URL (existing vite-plugin-pwa config extension)

### Expected Features

The Cast UX has clear table-stakes expectations from the Google Cast Design Checklist. This is not a media app, so several standard Cast requirements (mini controller, expanded controller, volume integration) are explicitly N/A and should be omitted.

**Must have (table stakes — Cast MVP):**
- `<google-cast-launcher>` web component in `/match` toolbar with all three states (available / connecting / connected)
- `CastContext` initialization with registered App ID and `autoJoinPolicy: ORIGIN_SCOPED`
- Full state snapshot sent immediately on session start (receiver hydration)
- Per-throw delta over Cast channel after every `dispatch()` (alongside existing BroadcastChannel)
- Custom Web Receiver: CAF SDK + custom-channel listener + `disableIdleTimeout: true` + `maxInactivity: 3600`
- Receiver loading screen (logo + spinner before first snapshot arrives)
- Receiver idle screen (logo + "Kein aktives Spiel" when no sender connected or match over)
- Session-end handler: sender clears status indicator; receiver shows idle screen on disconnect
- "Überträgt auf: [Gerätename]" status toast on session start in `/match`
- Overscan-safe receiver layout: 10% edge margins verified at 1920x1080

**Should have (differentiators — low cost, high polish):**
- Smooth score-update CSS transition (fade on remaining-score field)
- Session-resume toast ("Verbindung wiederhergestellt") on `SESSION_RESUMED`

**Defer (v2+):**
- Idle-screen match summary (last result shown between games)
- Receiver UI theme customization

**Explicitly skip (not applicable for this non-media single-page scoring app):**
- Mini controller — N/A: `/match` is always foreground; no background content browsing
- Expanded controller — N/A: no media playback controls
- Volume control integration — N/A: audio plays from sender only (v1.0 decision)
- Cast Introduction overlay — N/A: private home app, one developer-user
- Multiple-sender authority model — N/A: one scoring tablet, one Chromecast

### Architecture Approach

The architecture is purely additive. The existing `MatchStore.dispatch()` has two inline `try/catch` publish blocks (BroadcastChannel, localStorage). A third block is added for Cast by calling a new private method `#publishToCast()`. A separate `CastSenderManager` class owns SDK lifecycle and exposes `activeSession = $state<CastSession | null>(null)`; `MatchStore` holds a private reference and guards all `sendMessage` calls. On the receiver side, `/display` adds a `CastReceiverBridge` init call in `onMount`, gated behind `isCastReceiverContext()`. When running in a normal browser the receiver SDK is inert; on a Chromecast the bridge registers the custom-channel listener, routes incoming messages to `DisplayStore.receiveSnapshot()`, and calls `context.start()` after all listeners are registered (required ordering per CAF v3 docs). Pause ticks are NOT sent as separate Cast messages — `pauseActive` and `pauseRemainingSeconds` are piggybacked on every `CastSnapshotMessage`; the receiver runs a locally-driven countdown.

**Major components:**
1. `src/lib/cast-types.ts` — `CAST_NS` constant, `CastMessage` union type
2. `src/lib/cast-sender.svelte.ts` — `CastSenderManager`: SDK init, session lifecycle, `activeSession = $state(null)`
3. `src/lib/cast-receiver.ts` — `isCastReceiverContext()` guard, `CastReceiverBridge.init()` for namespace registration and message routing
4. `src/ui/cast/CastButton.svelte` — `<google-cast-launcher>` wrapper + connection-status badge
5. `MatchStore` (modified) — `#castManager` field, `setCastManager()` setter, `#publishToCast()` private method added at dispatch() lines 107-120
6. `DisplayStore` (modified) — `receiveSnapshot(msg: CastSnapshotMessage)` public method (5 lines, reuses existing `isValidMatchState()`)

### Critical Pitfalls

1. **Receiver page swallowed by SPA fallback** — Set `prerender = true; ssr = true` in `display/+page.js`; add `navigateFallbackDenylist` entry in vite.config.ts. Verify `curl` of deployed URL returns receiver HTML, not the SPA shell, before registering in Cast Console.

2. **`__onGCastApiAvailable` callback missed due to script load order** — Assign `window['__onGCastApiAvailable']` first in the same synchronous `onMount` block before appending the script tag. Never assign after `appendChild`.

3. **Missing `?loadCastFramework=1` on sender SDK URL** — Without this query param, `cast.framework.*` is undefined and all CAF API calls throw silently. Store as a named constant; never use the raw URL string.

4. **Receiver idle timeout kills session mid-match** — Set `options.disableIdleTimeout = true; options.maxInactivity = 3600` in `CastReceiverOptions` before `context.start()`. Required for any non-media app; a darts match with auto-pause breaks easily exceeds the default ~5-minute threshold.

5. **Custom namespace mismatch silently drops all messages** — Single exported constant `CAST_NS = 'urn:x-cast:dev.neverman.match'` in `cast-types.ts`; imported in both sender and receiver; no string literals elsewhere. One character difference = silent message loss, no error.

6. **15-minute propagation + device reboot blocks all end-to-end testing** — Cast Console registration is a non-code human prerequisite. Register the device and receiver URL once before writing integration code; do not change Console settings during active development.

---

## Open Decisions for Planning

The research files contain two genuine, mutually exclusive design tensions. These must be decided before implementation begins — they cannot be deferred to execution.

### Decision 1: Receiver Entry Point

**Option A — Standalone `static/receiver.html` (STACK.md recommendation)**

A plain HTML file in `static/` is copied verbatim to `build/receiver.html` by adapter-static, with no SvelteKit processing: no SPA shell, no PWA virtual modules, no `@vite-pwa/sveltekit` SW registration.

Tradeoffs:
- Pro: Clean isolation from the SPA and service worker. The Chromecast never risks registering a service worker. The URL (`/receiver.html`) is clearly distinct from the `/display` SPA route.
- Pro: No `navigateFallbackDenylist` complexity — `receiver.html` is excluded from the precache via `globIgnores` only.
- Con: Existing `/display` Svelte components (MatchHeader, PlayerPanel, LegWinBanner, PauseOverlay, RecordOverlay) cannot be imported — the receiver must re-implement or duplicate scoreboard markup and styles. Two sources of truth for the visual layout.

**Option B — Reuse existing `/display` route (ARCHITECTURE.md and PITFALLS.md approach)**

Extend `/display/+page.svelte` to detect Chromecast context (`isCastReceiverContext()`) and activate the CAF receiver bridge in that path. The route is prerendered (`prerender = true; ssr = true`).

Tradeoffs:
- Pro: Zero UI duplication. All existing display components (MatchHeader, PlayerPanel, PauseOverlay, RecordOverlay, etc.) work on the Chromecast with no extra receiver work. Future display features are automatically available on the TV.
- Pro: Single source of truth for the scoreboard layout.
- Con: The CAF receiver SDK script loads on `/display` in all browsers (inert but present; may log console warnings in some SDK versions).
- Con: Requires `prerender = true; ssr = true` and `navigateFallbackDenylist` to prevent the SPA fallback from intercepting the Chromecast's initial page fetch (Pitfalls 1 and 7). Additional build validation step needed.
- Con: The SDK isolation rule (receiver SDK only on `/display`; sender SDK only on `/match`) must be actively enforced — loading both on the same page causes API conflicts.

**Research lean:** Option B is architecturally simpler and eliminates UI duplication. The isolation concern is mitigated by `navigateFallbackDenylist` and the fact that the Chromecast fetches `/display` from a clean Chromium context with no previously installed service worker. Option A is the safer choice if SW isolation is a hard requirement or if the receiver SDK's inertness on normal browsers is unacceptable.

---

### Decision 2: Cast Message Payload Schema

**Option A — Full `MatchState` snapshot per dispatch (ARCHITECTURE.md proposal)**

Reuse the same `$state.snapshot(this.state)` already posted to BroadcastChannel. No separate `CastDisplayState` type.

Tradeoffs:
- Pro: Zero additional serialization code; same snapshot, different transport.
- Pro: No schema divergence between BroadcastChannel and Cast payloads.
- Con: `MatchState` grows over a long match (full throw history, cumulative stats, all legs). A 4-player sets match with 30+ visits could approach or exceed the hard 64 KB Cast message size limit. At or above the limit, messages are silently dropped or cause a send error — failure manifests only in long games.
- Con: Sends match history and accumulated statistics to the Chromecast, which only needs current scores.

**Option B — Trimmed `CastDisplayState` projection (PITFALLS.md recommendation)**

Define a `CastDisplayState` type containing only what `/display` renders: current scores, active-leg throws, player names, who is throwing, legs/sets tallies, match average, pause state.

Tradeoffs:
- Pro: Payload stays well under 32 KB (safe margin below 64 KB limit) regardless of match length.
- Pro: Explicit contract; the receiver type does not depend on internal `MatchState` shape changes.
- Con: Requires defining `CastDisplayState` and a `toDisplayState(state: MatchState): CastDisplayState` projection function.
- Con: BroadcastChannel continues to send full `MatchState`; Cast sends a different shape — two payload formats to reason about.
- Con: Future extensions to `/display` that need history or stats require updating the projection.

**Research lean:** Option B (trimmed `CastDisplayState`) is safer for long matches. The 64 KB limit is real, silent, and failure-only-in-production. Validate during development with `new TextEncoder().encode(JSON.stringify(castDisplayState)).length` — must stay under 32 768 bytes.

---

### Open Questions (resolve before phase planning, not design decisions)

**Q1: Single vs. dev/prod Cast App IDs**

`VITE_CAST_APP_ID` can be one value or split across `.env.development` / `.env.production`. For a private home app, a single App ID pointing to the GitHub Pages production URL is simplest — dev testing uses the CaC tool against the deployed receiver, or a local dev server on the same LAN with the Chromecast serial registered. Decide this before writing the env var wiring.

**Q2: Cast Developer Console Registration (non-code prerequisite)**

This must happen before any end-to-end Cast testing is possible. It is a human task, not a code task, and gates all Phase 1 E2E verification:
1. Pay $5 at `cast.google.com/publish` (non-refundable; use same Google account as other project assets; email cannot be changed after registration).
2. Register a Custom Web Receiver with the exact deployed URL (depends on Decision 1 outcome).
3. Register the Chromecast device serial number under "Add New Device."
4. Wait 15 minutes, then reboot the Chromecast.
5. Verify Cast Console shows "Ready for Testing" before writing any sender code.

The App ID assigned in step 2 must be in hand before the sender `CastContext.setOptions()` call can be written. Plan the phase schedule so registration happens before or in parallel with sender coding, not after.

---

## Implications for Roadmap

### Phase 1: Cast Integration (complete v1.1 milestone)

**Rationale:** All Cast work is tightly coupled around the App ID. The receiver entry point decision determines the file structure. The message schema determines the types. All 12 pitfalls cluster in this phase. There is no value in splitting — the external Console prerequisite gates everything, and the build order within the phase already enforces a safe internal sequence.

**Delivers:** Working end-to-end Cast session — tap Cast button on tablet, Chromecast TV shows live scoreboard, every dart throw updates in real time, session stop returns TV to idle screen. BroadcastChannel and tablet fullscreen paths remain working throughout (Cast is additive only).

**Addresses (from FEATURES.md):**
- All P1 MVP features (Cast button, CastContext init, snapshot on session start, per-throw delta, receiver with disableIdleTimeout, loading + idle screens, session-end handling, status toast, overscan verification)
- `autoJoinPolicy: ORIGIN_SCOPED` (one-line config, prevents re-cast frustration on tablet refresh)

**Avoids (from PITFALLS.md):**
- All 12 documented pitfalls, specifically: SPA fallback (prerender + denylist), callback ordering, missing SDK param, idle timeout, namespace mismatch, 64 KB limit, Workbox interception, SSR crash, graceful degradation on non-Chrome

**Build order within Phase 1** (respects dependencies, keeps local sync working at every step):
1. `cast-types.ts` — namespace constant + message types (no deps)
2. `DisplayStore.receiveSnapshot()` — receiver ingress method (reuses existing `isValidMatchState()`)
3. `cast-receiver.ts` — `isCastReceiverContext()` + `CastReceiverBridge`
4. `display/+page.svelte` — receiver SDK script tag, `onMount` bridge init, `onRecord` callback; plus `prerender = true; ssr = true` in `display/+page.js` and Workbox denylist in `vite.config.ts`
5. `cast-sender.svelte.ts` — `CastSenderManager` class
6. `match.svelte.ts` — `#castManager`, `setCastManager()`, `#publishToCast()`, two call sites
7. `CastButton.svelte` — `<google-cast-launcher>` wrapper + status badge
8. `match/+page.svelte` — `CastSenderManager` instantiation, `setCastManager()`, `<CastButton>` mount, `VITE_CAST_APP_ID` env var wiring

### Phase Ordering Rationale

- Single phase because the App ID is needed before E2E testing; splitting phases creates a cliff where Phase 2 cannot be verified without Phase 1's registration being complete.
- Workbox config and prerender changes land in step 4 (same commit as the receiver page scaffold) — they are correctness requirements, not polish.
- Cast Console registration (Q2) must be confirmed complete before the phase plan schedules any E2E test steps.

### Research Flags

**Phase 1 — items requiring decisions before planning begins:**
- Decision 1 (receiver entry point: `static/receiver.html` vs. `/display` route reuse) — determines file structure, Workbox config, and prerender requirements
- Decision 2 (message schema: full `MatchState` vs. trimmed `CastDisplayState`) — determines `cast-types.ts` shape and serialization path
- Open Question 1 (`VITE_CAST_APP_ID` single vs. split env vars) — minor but must be resolved before env var setup
- Open Question 2 (Cast Console registration status) — non-code prerequisite, blocks all E2E testing

**Phase 1 — areas with standard documented patterns (no additional research needed):**
- `<google-cast-launcher>` web component styling — Cast Design Checklist is complete
- `disableIdleTimeout` + `maxInactivity` — explicitly documented in CastReceiverOptions reference
- `autoJoinPolicy: ORIGIN_SCOPED` — documented in Cast sender integration guide
- Workbox `navigateFallbackDenylist` — standard vite-plugin-pwa option, fully supported in current setup
- SvelteKit adapter-static `static/` directory passthrough — documented behavior for adapter-static 3.x

**Phase 1 — areas needing real-device validation (not resolvable from docs alone):**
- `CastSenderManager` behavior when Android Chrome is backgrounded mid-match (ARCHITECTURE.md flags MEDIUM confidence)
- Receiver SDK inertness on normal browsers — verify no errors or observable side effects when `/display` loads the receiver SDK in Chrome desktop without calling `start()`

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | SDK CDN URLs and API shapes verified from official docs; `@types` package versions from libraries.io / websearch, not directly verified against npm registry |
| Features | HIGH | All P1/P2 features grounded in official Google Cast Design Checklist and CAF docs; N/A determinations clearly rationale-supported |
| Architecture | HIGH | Grounded in actual codebase source (match.svelte.ts and display.svelte.ts read directly); seam locations and line numbers are real ground truth |
| Pitfalls | MEDIUM | Critical pitfalls well-documented from official sources; Cast-Android lifecycle edge cases and receiver SDK inertness on normal browsers are LOW confidence without real-device testing |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Android Chrome backgrounding behavior during Cast session:** Not fully documented. `CastSenderManager` session lifecycle when the tablet screen locks or the app is backgrounded needs a dedicated UAT step.
- **Receiver SDK on normal browsers:** Documented as inert when `start()` is not called, but some SDK versions log warnings. Verify on Chrome desktop before the final PWA release.
- **`@types` package versions:** Confirm `npm info @types/chromecast-caf-sender` and `npm info @types/chromecast-caf-receiver` match the researched versions (1.0.11 and 6.0.26) before installing.
- **CaC tool integration:** The Google Cast Command and Control tool can test a receiver independently of the sender. Incorporate into the phase testing strategy as a way to validate receiver behavior before sender code is written.

---

## Sources

### Primary — HIGH confidence
- Google Cast CAF v3 Receiver reference (`developers.google.com/cast/docs/reference/caf_receiver`) — custom namespace, `start()` order, `sendCustomMessage`
- Google Cast Sender SDK reference (`developers.google.com/cast/docs/reference/chrome/cast.framework`) — `CastContext`, `SESSION_STATE_CHANGED`, `sendMessage`
- Google Cast Custom Channel docs (`developers.google.com/cast/docs/web_sender/custom_messages`) — channel semantics, message routing
- Google Cast Design Checklist (`developers.google.com/cast/docs/design_checklist/`) — button states, receiver screen states, N/A determinations for non-media apps
- Existing codebase (read directly for ARCHITECTURE.md): `src/stores/match.svelte.ts`, `src/stores/display.svelte.ts`, `src/lib/sync-constants.ts`, `src/routes/display/+page.svelte`, `src/routes/match/+page.svelte`

### Secondary — MEDIUM confidence
- Google Cast Web Sender integration guide — `__onGCastApiAvailable`, `?loadCastFramework=1`, `setOptions` ordering, `autoJoinPolicy`
- Google Cast Web Receiver core features — `addCustomMessageListener`, `SENDER_DISCONNECTED`, late-join, `disableIdleTimeout`
- `CastReceiverOptions` reference — `disableIdleTimeout`, `maxInactivity`, `customNamespaces`
- Google Cast registration docs — unpublished receiver, serial number device registration, $5 fee, 15-minute propagation
- SvelteKit adapter-static docs — `static/` passthrough, prerender behavior
- Vite PWA docs — `navigateFallbackDenylist`, `globIgnores`
- Google Cast Media Messages reference — 64 KB message size limit

### Tertiary — LOW confidence
- `chromecast-device-emulator` npm package — local Chromecast emulation without physical device; community-maintained, not independently verified
- `@types/chromecast-caf-sender@1.0.11` and `@types/chromecast-caf-receiver@6.0.26` version numbers — sourced from libraries.io / web search, not directly verified against npm registry

---

*Research completed: 2026-06-18*
*Ready for roadmap: yes — pending resolution of Decision 1 (receiver entry point) and Decision 2 (message schema) in the discuss/planning phase*
