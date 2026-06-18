# Phase 7: Chromecast Integration - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the scoring tablet (`/match`) as a **Google Cast sender** and the existing `/display` scoreboard as a **Custom Web Receiver** on a Chromecast, so the live darts scoreboard appears on a Chromecast-connected TV while the tablet stays free for touch scoring. State syncs over a Cast custom channel: a full snapshot on connect (hydration / late-join) plus per-throw deltas.

The Cast layer is **additive**. The existing spectator paths — PC second window (BroadcastChannel) and tablet fullscreen `/display` — must keep working unchanged. Cast is a third transport, never a replacement.

Requirements (locked in `REQUIREMENTS.md`, 18 total): CAST-01..06, RECV-01..05, SYNC-01..04, SETUP-01..03. This phase resolves the 3 open design decisions those requirements left open, plus 4 UX/polish decisions surfaced during discussion.

</domain>

<decisions>
## Implementation Decisions

### Receiver entry point
- **D-01:** Reuse the existing `/display` route as the Cast receiver (research Option B). No standalone `static/receiver.html` — zero scoreboard-UI duplication, one source of truth for the layout. Affects RECV-01, SETUP-01.
- **D-02:** Load the CAF Receiver SDK script **only when in Cast context** — inject it in `onMount` gated by `isCastReceiverContext()`. On tablet/PC the receiver SDK is never loaded (no inertness/console-warning concern, no SDK conflict with the sender).
- **D-03:** Add a Workbox `navigateFallbackDenylist` entry so the service worker / SPA `404.html` fallback never intercepts the Chromecast's initial fetch of the receiver page (research Pitfall 1 & 7).
- **D-04:** **Verify the prerender/SSR mechanics early**, before writing receiver code. The app is currently a pure SPA (`src/routes/+layout.ts`: `prerender = true; ssr = false`) and `/display` has no `+page.js`. Planner/executor must confirm what the Chromecast actually needs (prerendered SPA shell that hydrates client-side vs. real `ssr = true`) by `curl`-ing the built output and testing with the Google **CaC tool**. Do not assume — this is the highest-uncertainty structural point.

### Cast message payload
- **D-05:** Send a **bounded/trimmed `CastDisplayState` projection** over the Cast channel (research Option B), not the full `MatchState` snapshot. The receiver only ever needs the current scoreboard: current scores, active-leg throws, player names, who is throwing, legs/sets tallies, match average, and pause state — never the full throw history.
- **D-06:** **Reason:** Cast has a hard, **silent 64 KB** message cap; a full `MatchState` for a long 4-player/sets match can exceed it and messages are dropped with no error — failing exactly the long matches this app exists to score. (BroadcastChannel keeps sending full `MatchState`; it has no size limit. Two payload shapes is the accepted cost.)
- **D-07:** **Constraints:** the trimmed shape must contain exactly what the `/display` components read, so it drops into the existing components without a refactor (keeps D-01 clean). Verify real byte size during dev — `new TextEncoder().encode(JSON.stringify(castDisplayState)).length` must stay well under 32 768 bytes.

### App ID env strategy
- **D-08:** **Single `VITE_CAST_APP_ID`** (research lean), not a dev/prod split. One developer, one Chromecast, one private receiver. Supplied at build time per SETUP-02 — never hard-coded in source.
- **D-09:** **Wiring:** deployed build reads the App ID from a **GitHub Actions repo variable** (it is *not* secret — it ships in the client bundle either way, so a plain Actions *variable*, not a secret); local dev reads it from a **gitignored `.env.local`**.
- **D-10:** **Dev workflow that makes a single App ID painless:** develop and test the receiver UI as a normal `/display` page in a browser (feed `DisplayStore` mock snapshots); reserve the real Chromecast only for the actual Cast-channel integration tests. Adding a dev App ID later is a non-breaking change if iteration ever feels slow.

### TV layout / overscan
- **D-11:** Apply overscan-safe edge margins (~10% at 1920×1080) **only in receiver context**, scoped via a `.cast-receiver` class set when `isCastReceiverContext()` is true. The PC second-window and tablet fullscreen `/display` stay visually unchanged — this also protects SYNC-04. `/display` is already large-type/high-contrast (built for 27" @ 3 m), so only TV overscan needs handling, nothing else.

### Cast status UI in /match
- **D-12:** Persistent connection indicator: the `<google-cast-launcher>` web component (states: verfügbar / verbindet / verbunden) plus a compact **"Überträgt auf: <Gerät>"** indicator in the match header (away from the dartboard), satisfying CAST-02/CAST-03. Stop casting via the **standard Cast dialog** (tap the launcher) — least custom code, familiar UX. Detailed visuals (placement, sizing, exact treatment) are deferred to `/gsd-ui-phase` (roadmap flags a UI hint for this phase).

### Non-Chrome / no-device degradation
- **D-13:** **Fully hide** the Cast control when the Cast API can't initialize (non-Chrome) or casting isn't possible — not a visible-but-disabled button. Standard Cast pattern (control appears only when castable); keeps `/match` clean on unsupported browsers and satisfies success-criterion 4 (no errors, no broken layout). Covers CAST-04.

### Polish scope
- **D-14:** Include **both** polish items in Phase 7: CAST-06 ("Verbindung wiederhergestellt" resume toast on `SESSION_RESUMED`) and RECV-05 (smooth CSS transition on the remaining-score field). Both are small; RECV-05 directly serves the core value (a smooth update draws the eye across the room).

### Claude's Discretion
- Exact `CastDisplayState` field list and the `toDisplayState(state)` projection function — planner designs it to match the `/display` read-surface (within D-05/D-07).
- Detailed Cast status-UI visuals — deferred to `/gsd-ui-phase` per D-12.
- Internal build/wiring order — follow the research's 8-step build order (SUMMARY.md → "Build order within Phase 1").

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### v1.1 Cast research (read directly from the codebase — HIGH confidence on architecture)
- `.planning/research/SUMMARY.md` — synthesis: stack, features (P1/P2/N-A), architecture, the 6 critical pitfalls, the 8-step build order, and the open-decision write-ups this CONTEXT resolves
- `.planning/research/ARCHITECTURE.md` — exact seams & line numbers in the existing code: `MatchStore.dispatch()` publish blocks, `#publishToCast()`, `CastSenderManager`, `CastReceiverBridge`, `DisplayStore.receiveSnapshot()`
- `.planning/research/PITFALLS.md` — 12 documented pitfalls (SPA fallback, `__onGCastApiAvailable` ordering, `?loadCastFramework=1`, idle timeout, namespace mismatch, 64 KB cap, Workbox interception, graceful degradation)
- `.planning/research/STACK.md` — CDN SDKs (no npm runtime deps), `@types/chromecast-caf-sender@1.0.11`, `@types/chromecast-caf-receiver@6.0.26` (scope receiver types in a separate `tsconfig.receiver.json`), CAF v3, Workbox `globIgnores`/`navigateFallbackDenylist`
- `.planning/research/FEATURES.md` — Cast Design Checklist mapping; which standard Cast features are N/A for this non-media app

### Phase scope & requirements
- `.planning/ROADMAP.md` § "Phase 7: Chromecast Integration" — goal, success criteria, open decisions
- `.planning/REQUIREMENTS.md` § v1.1 — CAST/RECV/SYNC/SETUP requirement IDs + out-of-scope table
- `.planning/PROJECT.md` § Current Milestone + Key Decisions — Custom Receiver (not screen-mirroring); local-Cast sync reverses the "cross-device = out of scope" exclusion

### Existing code touch points
- `src/lib/sync-constants.ts` — current BroadcastChannel/localStorage protocol; add `CAST_NS` alongside (single exported constant, imported by both sender and receiver)
- `src/stores/match.svelte.ts` — `dispatch()` publish seam (additive Cast publish); `setCastManager()`
- `src/stores/display.svelte.ts` — `receiveSnapshot()` ingress; reuse `isValidMatchState()`
- `src/routes/display/+page.svelte` — receiver bridge init in `onMount`; add `src/routes/display/+page.js` if D-04 verification requires prerender/SSR settings
- `src/routes/match/+page.svelte` — `CastSenderManager` instantiation + `<CastButton>` mount + `VITE_CAST_APP_ID` wiring
- `vite.config.ts` — Workbox `globPatterns`/`navigateFallback` (line ~55-57); add `navigateFallbackDenylist` + `globIgnores`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`/display` route + its components** (MatchHeader, PlayerPanel, PauseOverlay, RecordOverlay): render the full scoreboard the Chromecast needs — reused as-is per D-01.
- **`DisplayStore` + `isValidMatchState()`**: the receiver ingress (`receiveSnapshot()`) reuses the existing validation and rendering path.
- **`MatchStore.dispatch()` publish pattern**: already has additive `try/catch` publish blocks for BroadcastChannel + localStorage; Cast is a third block calling `#publishToCast()`.
- **`sync-constants.ts`**: the established "single source for channel/key constants to prevent typo-driven silent sync breakage" pattern — `CAST_NS` follows it.
- **`$state.snapshot(this.state)` BroadcastChannel payload**: the projection (D-05) trims from this same source.

### Established Patterns
- **Additive transport layering** — every spectator path is a separate fire-and-forget publish; Cast must not alter the existing two (SYNC-04).
- **Single-constant-for-sync** — one exported namespace/channel constant imported everywhere; no string literals (mitigates Pitfall 5: namespace mismatch).
- **Pure-SPA build** — global `ssr = false`, `prerender = true`; routes opt out of prerender via per-route `+page.ts`/`+page.svelte` (`history`, `data` do this). D-04's `/display` handling lives in this pattern.
- **Context-gated behavior** — detect execution context, then activate (mirrors how D-02/D-11 gate on `isCastReceiverContext()`).

### Integration Points
- `MatchStore.dispatch()` → new `#publishToCast()` (sender egress)
- `DisplayStore.receiveSnapshot()` ← Cast custom-channel listener (receiver ingress)
- `/display` `onMount` → `CastReceiverBridge.init()` + `context.start()` (after all listeners registered — CAF v3 ordering)
- `vite.config.ts` Workbox config → denylist/globIgnores for the receiver URL
- GitHub Actions deploy workflow → inject `VITE_CAST_APP_ID` repo variable at build

</code_context>

<specifics>
## Specific Ideas

- **Pause sync without a separate message:** piggyback `pauseActive` + `pauseRemainingSeconds` on every snapshot (as the existing `MSG_PAUSE_TICK` does on BroadcastChannel); the receiver runs a locally-driven countdown (SYNC-03). Mirrors the v1.0 pattern in `sync-constants.ts`.
- **`autoJoinPolicy: ORIGIN_SCOPED`** — one-line config that delivers CAST-05 auto-rejoin after a tablet reload without re-selecting the device.
- **`disableIdleTimeout: true; maxInactivity: 3600`** — required so the receiver survives long auto-pause breaks (RECV-04).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (RECV-06 idle-screen match summary and RECV-07 receiver theme customization are already tracked as v2 in `REQUIREMENTS.md` / STATE.md Deferred Items.)

</deferred>

---

## Non-code prerequisite & validation flags (not decisions — carry to planning)

- **Cast Developer Console registration GATES all E2E** ($5 one-time, register Chromecast serial + receiver URL, 15-min propagation + reboot). Must be confirmed **complete before** the plan schedules any on-device test step. The App ID assigned here feeds D-08. SETUP-03 includes the written guide for this.
- **Real-device validation (not resolvable from docs):** (a) Android Chrome backgrounding / screen-lock mid-cast → dedicated UAT step (MEDIUM confidence); (b) confirm the receiver SDK is truly inert when `/display` loads it in desktop Chrome without `start()` — D-02's conditional injection should make this moot, but verify.
- **`@types` versions:** confirm `@types/chromecast-caf-sender` (1.0.11) and `@types/chromecast-caf-receiver` (6.0.26) against the npm registry before installing.

---

*Phase: 7-Chromecast Integration*
*Context gathered: 2026-06-18*
