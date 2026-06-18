# Phase 7: Chromecast Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 7-Chromecast Integration
**Areas discussed:** Receiver entry point, Cast payload schema, App ID env strategy, TV layout / overscan, Cast status UI, Non-Chrome degradation, Polish scope

---

## Receiver entry point

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse /display route | Chromecast loads the existing /display route; Cast bridge feeds snapshots into DisplayStore. Zero UI duplication. Needs prerender/denylist + conditional receiver-SDK injection. (Research lean) | ✓ |
| Standalone receiver.html | Plain static/receiver.html, clean SW isolation, but duplicates the scoreboard UI — two sources of truth. | |

**User's choice:** Reuse /display route.
**Notes:** Asked for a recommendation; chose the recommended option. Locked guardrails: inject receiver SDK only via `onMount` when `isCastReceiverContext()`; add `navigateFallbackDenylist`; verify the prerender/SSR mechanics early (`curl` of built output + Google CaC tool) before writing receiver code, since the app is currently a pure SPA (`ssr=false` global) and `/display` has no `+page.js`.

---

## Cast payload schema

| Option | Description | Selected |
|--------|-------------|----------|
| Bounded payload (trimmed CastDisplayState) | Send only what /display renders; no match history. Stays well under the 64 KB cap. (Research lean) | ✓ |
| Full MatchState snapshot | Reuse the BroadcastChannel payload verbatim; less code, but silent 64 KB-cap risk on long matches. | |

**User's choice:** Bounded/trimmed CastDisplayState projection.
**Notes:** Asked for a recommendation; chose the recommended option. Constraint captured: trimmed shape must match what the /display components read (keeps the reuse clean per the receiver-entry decision); verify real byte size in dev (`< 32 768 bytes`).

---

## App ID env strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single VITE_CAST_APP_ID | One App ID; GitHub Actions repo variable (deploy) + gitignored .env.local (dev). Receiver UI developed in a browser; real Chromecast only for integration tests. (Research lean) | ✓ |
| Dev/prod split | .env.development / .env.production with separate App IDs for faster on-device iteration; more wiring + a second registered app. | |

**User's choice:** Single VITE_CAST_APP_ID.
**Notes:** Iteration benefit of a split is small because (with the reuse decision) the receiver UI is just /display, testable in a browser. Adding a dev App ID later is non-breaking.

---

## TV layout / overscan

| Option | Description | Selected |
|--------|-------------|----------|
| Receiver-context only | Overscan margins (~10%) via a .cast-receiver class set when isCastReceiverContext(); PC window + tablet fullscreen unchanged. | ✓ |
| Global on /display | Margins for all /display instances — consistent, but changes the already-accepted PC second-window. | |

**User's choice:** Receiver-context only.
**Notes:** Keeps SYNC-04 (existing paths unchanged) bulletproof; overscan is a TV-only problem.

---

## Cast status UI in /match

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent indicator + standard stop | <google-cast-launcher> (3 states) + compact "Überträgt auf: <Gerät>" in the match header; stop via standard Cast dialog. Details to /gsd-ui-phase. | ✓ |
| Toast only | Transient connect toasts, no persistent indicator — weaker fit for CAST-03. | |

**User's choice:** Persistent indicator + standard stop.
**Notes:** Detailed visuals deferred to /gsd-ui-phase (roadmap flags a UI hint).

---

## Non-Chrome degradation

| Option | Description | Selected |
|--------|-------------|----------|
| Fully hide | Cast control visible only when casting is possible; hidden entirely on non-Chrome. Standard Cast pattern. | ✓ |
| Visible but disabled | Greyed-out button on non-Chrome — signals the feature but the user can't act (potentially confusing). | |

**User's choice:** Fully hide.
**Notes:** Satisfies success-criterion 4 (no errors, no broken layout). Covers CAST-04.

---

## Polish scope

| Option | Description | Selected |
|--------|-------------|----------|
| Both now | CAST-06 resume toast + RECV-05 smooth score animation in Phase 7. | ✓ |
| Only RECV-05, defer CAST-06 | Score animation now (core value), resume toast later. | |
| Defer both | Focus Phase 7 on function; both polish items later. | |

**User's choice:** Both now.
**Notes:** Both small; RECV-05 directly serves cross-room readability.

---

## Claude's Discretion

- Exact `CastDisplayState` field list + `toDisplayState(state)` projection function (within the bounded-payload constraints).
- Detailed Cast status-UI visuals — deferred to `/gsd-ui-phase`.
- Internal build/wiring order — follow the research's 8-step build order.

## Deferred Ideas

None — discussion stayed within phase scope. (RECV-06 idle-screen match summary and RECV-07 receiver theme customization remain tracked as v2.)
