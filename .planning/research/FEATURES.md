# Feature Research

**Domain:** Google Cast (Chromecast) integration — "second screen / live scoreboard" for a private home darts-scoring PWA
**Researched:** 2026-06-18
**Confidence:** HIGH for Cast UX and SDK behavior (official Google Cast Design Checklist, CAF documentation, web sender integration guide); MEDIUM for PWA-specific edge cases and private/unpublished receiver nuances.

> Scope note: This file covers v1.1 Cast features only. Darts gameplay, scoring rules, stats, achievements, and the spectator layout itself are built (v1.0). The question is: what does the Cast interaction layer need to look like from the user's perspective, and what must the receiver show in each state?

---

## Cast Interaction Model (Context)

The `/match` page on the tablet is the **Cast sender** — it holds scoring authority and posts state. The `/display` page runs on the Chromecast as a **Custom Web Receiver** — it displays the live scoreboard and receives state over a custom channel (`urn:x-cast:` namespace). Sync is a full snapshot on connect followed by per-throw JSON deltas, mirroring the existing BroadcastChannel pattern. The existing PC second-window and tablet fullscreen paths remain unchanged; Cast is additive.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features whose absence makes the Cast integration feel broken or half-finished. A user who has a Chromecast expects these from any "Cast-enabled" app.

| Feature | Why Expected | Complexity | Notes / Existing UI Touch Point |
|---------|--------------|------------|----------------------------------|
| **Cast button in the `/match` toolbar** | Every Cast-enabled app shows `<google-cast-launcher>` visibly; absence breaks discoverability. Must appear on all screens with castable content. | LOW | Use the `<google-cast-launcher>` web component (styling via `--connected-color` / `--disconnected-color` CSS custom properties). Place top-right of the `/match` control bar — consistent with the Cast design checklist "right side of content area." The button is self-managing: the SDK drives its visual state. |
| **Three distinct button states** | Users read the button to know if Cast is available, if they are connecting, and if they are connected. | LOW | States are automatic when using the web component: (1) **Disconnected/available** — standard button icon (waves + frame outline); (2) **Connecting** — animated progressive-wave pulse; (3) **Connected** — filled frame icon (colored via `--connected-color`). Unavailable state: button is hidden on Chrome web when no receivers are found (acceptable for home Wi-Fi). |
| **Device picker (Cast dialog)** | User needs to see and select their Chromecast by name. The SDK provides this natively on tap of the cast button. | LOW | Fully SDK-managed. Tapping the button opens the Cast dialog listing nearby Cast-capable devices by their friendly name (e.g. "Wohnzimmer TV"). User taps the device name → session starts. No custom UI required here. |
| **Session start — receiver shows "connecting" then scoreboard** | TV must give feedback immediately on tap; a blank or frozen screen reads as broken. | MEDIUM | Receiver must implement two screen states: (1) a **launcher/loading screen** (app logo + animated spinner) shown while the CAF framework bootstraps; (2) a **connected/active state** showing the live scoreboard once the first snapshot arrives. The existing `/display` layout covers (2). Add (1) as a pre-load overlay. |
| **Receiver shows match state after connection** | The whole point of casting is that the TV immediately shows the live score. If the receiver shows a blank or a previous state, users lose trust. | MEDIUM | On `SENDER_CONNECTED` event (or on first custom-channel message received), the receiver must hydrate from the snapshot sent by the sender. This is the late-join / initial-sync requirement — the sender must always send a full state snapshot as its first message to any new receiver session. |
| **Stop casting / disconnect** | Users must be able to end the Cast session from the tablet without navigating away. The Cast dialog (opened via the cast button) shows a "STOP CASTING" button; this is required by the Google Cast design checklist. | LOW | SDK-managed via the Cast dialog. The sender should also listen to `SESSION_STATE_CHANGED → SESSION_ENDED` to update its local UI (re-enable the button, clear any "casting" status indicator). |
| **Sender UI reflects connected state** | While casting, the `/match` UI must visually confirm the session is live (beyond the filled cast button icon). Users expect some "casting to [device name]" confirmation. | LOW–MEDIUM | A small status chip or toast ("Überträgt auf: Wohnzimmer TV") shown under or near the cast button after session start. Use `CastSession.getCastDevice().friendlyName`. Not required to be persistent — a brief toast on connect + the filled cast button icon is sufficient. |
| **Receiver stays alive during a paused match** | Auto-pause is a v1.0 feature (configurable leg-count pause with countdown). During pause the match is not being actively scored. The default CAF idle timeout (~5 min for non-media apps in some configurations) would kill the receiver — sending the TV back to the Chromecast home screen mid-break. | MEDIUM | Set `disableIdleTimeout: true` in `CastReceiverOptions`. This is explicitly documented as correct for non-media apps (scoreboards, dashboards). The darts receiver has no "media playback" lifecycle; idle timeout is meaningless for it. Without this, a 5-minute auto-pause break kills the session. |
| **Reconnection after transient network drop** | Home Wi-Fi drops briefly (router reboot, range edge). Users expect Cast to recover without manually reconnecting. | LOW | CAF handles this automatically at the session level — a session enters "suspended" state on connectivity loss and returns to "connected" when restored. No code required; just do not interfere with the SDK's reconnection logic. |

### Differentiators (Valuable but Not Expected)

Features that make the Cast integration noticeably better than a bare-minimum implementation for a private home context.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Receiver idle screen (logo + "Warte auf Spielstart…")** | Between matches, the TV shows something intentional rather than a frozen last-score or blank. Follows the Google design guideline: receiver idle state shows app logo and a message; rotates content every 30–60 s to prevent burn-in. | LOW–MEDIUM | When the sender sends an "idle" or "match-ended" state, the receiver transitions to an idle screen: the Neverman logo, "Kein aktives Spiel" or "Warte auf nächste Runde", maybe last-match summary. This is the differentiator between feeling "finished" vs feeling "abandoned." |
| **Late-join hydration (receiver opened after match starts)** | If the Chromecast app is reloaded or a second Cast device connects mid-match, the receiver gets the current full state immediately without needing to restart the match. | MEDIUM | Sender must always send a full state snapshot as the first message to a newly connected receiver (on `SENDER_CONNECTED` event at the receiver). This mirrors what the existing BroadcastChannel hydration already does for the PC spectator window — same pattern, different transport. |
| **Session resume after sender page refresh** | If the tablet reloads `/match` (browser refresh, PWA restart), the Cast session should auto-resume rather than requiring the user to re-cast. | LOW–MEDIUM | Set `autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED` in `CastContext` initialization. With this policy, on page reload the SDK automatically reconnects to the existing running session without user interaction. On reconnect, the sender sends a fresh snapshot to sync. |
| **Receiver shows player-count-aware layout** | The existing `/display` already adapts to 1–4 players. Confirming that the Cast receiver uses the same adaptive layout (inherited from `/display`) ensures 2-player matches look as good as 4-player matches on the TV. | LOW | No new work if `/display` is reused as-is. Explicitly verify that the layout adapts at 1920×1080 (standard TV resolution), not just at PC monitor resolutions. |
| **Smooth state transitions on score update** | Per-throw deltas arrive frequently. A score that "snaps" immediately is fine; a brief CSS transition (fade or slide) on the score field makes the display feel polished and live. | LOW | CSS `transition: color 0.2s ease` on the remaining-score element. Cheap, high perceived quality. Consistent with the Google receiver guideline for "cinematic transitions between states." |
| **Receiver overscan-safe layout** | Older TVs (and even some modern ones with incorrect display settings) crop ~5–10% at the edges. Content near the edge will be clipped. | LOW | The Google receiver guideline mandates a 10% margin from all edges for safe content. The existing `/display` layout should be reviewed to ensure no critical elements (player names, score remaining) sit in the outermost 10% of the viewport. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but are wrong for this private, single-Chromecast home context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Mini controller (persistent cast bar)** | The official Google Cast design checklist says a web sender must show a mini controller when navigating away from the content page. | For this app the scoring page `/match` IS the content page; there are no "other pages" the user navigates to during a match. The mini controller is designed for media apps where the user browses a catalog while music plays in the background. Implementing it adds code, layout complexity, and a persistent UI bar that occludes the dartboard on a tablet. | The filled Cast button icon + the session-start toast are sufficient. Note this explicitly in code: the design checklist mini-controller requirement is N/A for a single-page scoring app where `/match` is always foreground. |
| **Multiple senders (two phones casting simultaneously)** | Cast supports it; a second household member might want to cast from their phone. | This is a private home scoreboard: one tablet controls scoring authority. A second sender joining could send conflicting state or trigger unintended session management. The complexity is real (sender-disconnect logic, authority model) and the use case does not exist in a household with one scoring device. | Ignore. With `autoJoinPolicy: ORIGIN_SCOPED`, a second device on the same Wi-Fi could theoretically auto-join the existing session and listen, but only the original scoring tablet sends state updates. That is acceptable and requires no active mitigation. |
| **Expanded controller (full-screen cast control overlay)** | The Google Design Checklist requires an "expanded controller" for media Cast apps. | Expanded controller is for media playback (play/pause/seek/volume). The darts receiver has no playback controls — the tablet is the input device and the TV is display-only. An expanded controller with darts-context "controls" is meaningless; the tablet's full-screen `/match` IS the controller. | Not applicable. Document explicitly that the expanded controller requirement is N/A for a non-media, non-playback receiver. |
| **Hardware volume control integration** | Sender checklist includes volume slider synced to receiver. | The TV's volume is irrelevant to a visual-only scoreboard. Audio (the caller voice) plays from the tablet (`/match`), not from the Chromecast receiver. A volume slider in the Cast context would control the Chromecast's audio output, which is silent. | Omit volume integration. Caller + SFX audio stays on the tablet as established in v1.0. |
| **Screen-mirroring / Tab Cast** | "Just mirror the tablet screen to the TV instead of building a receiver." | Screen-mirroring sends pixels and the tablet display is optimized for touch scoring, not TV viewing. The typography is too small for 3 m viewing distance. The existing `/display` layout with its large-typography TV design is the right solution. Also, tab cast uses a different Cast session type and has performance/latency characteristics unsuitable for a live scoreboard. | Custom Web Receiver loading `/display` — already the plan. |
| **Cloud relay for state sync** | "What if Cast isn't available / Chromecast is offline?" | Adds a backend, which is explicitly out of scope. The existing BroadcastChannel path already handles the PC second-window case. The Cast path is additive and optional — if the Chromecast is unavailable, the user falls back to the PC window. | Cast is additive. No fallback beyond what already exists. |
| **Receiver published to Cast console (public listing)** | "Easier setup — anyone can cast to it." | Public listing exposes the app on the Cast developer console, requires Google review/approval, and makes the receiver available to unknown devices. For a private home app, the user registers their own Chromecast serial number to use an unpublished receiver. This is the explicit project decision and requires only a one-time $5 Cast developer registration. | Unpublished receiver with serial-number device registration — already the project decision. |
| **Introductory overlay ("Cast Introduction")** | The Cast Design Checklist requires showing a first-run overlay that circles the cast button and explains it. | This is designed for public consumer apps where most users have never seen a cast button. For a private home app built and operated by one developer-user, a first-run tutorial is noise. | Skip. The requirement is for apps distributed to general users who may not know what the Cast button does. |

---

## Feature Dependencies

```
Cast sender session (CastContext + CastSession)
    └──requires──> App ID from unpublished receiver registration
    └──requires──> `<google-cast-launcher>` web component in /match toolbar
    └──enables──>  Device picker (SDK-managed)
    └──enables──>  Session lifecycle events (SESSION_STARTED, SESSION_ENDED, SESSION_RESUMED)

Session started
    └──requires──> Sender sends full state snapshot immediately
                       └──enables──> Receiver hydration (late-join safe)
                       └──enables──> Receiver transitions from "loading" to "active scoreboard"

Per-throw scoring event (existing game engine, /match)
    └──triggers──> State delta message over custom channel
                       └──updates──> Receiver display (same data as BroadcastChannel delta, different transport)

disableIdleTimeout: true (receiver option)
    └──prevents──> CAF killing the receiver during auto-pause breaks or between-match idle

autoJoinPolicy: ORIGIN_SCOPED (sender option)
    └──enables──> Session resume after tablet page refresh (no re-cast needed)

Receiver screen states
    Loading screen (spinner + logo)
        └──transitions to──> Active scoreboard (on first snapshot received)
    Active scoreboard
        └──transitions to──> Idle screen (on "match ended" / no sender / explicit idle signal)
    Idle screen
        └──transitions to──> Active scoreboard (on new match start / snapshot received)

Existing /display layout
    └──reused as──> Cast receiver content (verify 1920×1080 fit + overscan margins)

Existing BroadcastChannel sync
    └──coexists──> Cast custom channel (both emit from same game-engine state; sender decides which transports to use)
```

### Dependency Notes

- **App ID must exist before any Cast code runs:** The `receiverApplicationId` is set at `CastContext` init time. Use a build-time env var (`PUBLIC_CAST_APP_ID`) so the ID is injected at build; the receiver's URL (GitHub Pages `/display`) is registered in the Cast developer console and tied to the serial-number-registered Chromecast.
- **Snapshot is always the first message:** The sender must send a full state snapshot on `SENDER_CONNECTED` at the receiver (or on `SESSION_STARTED` at the sender). Never assume the receiver has prior state. This mirrors the BroadcastChannel hydration pattern already built for the PC spectator window.
- **`disableIdleTimeout` must be set before `context.start()`:** Custom namespaces must also be declared in `CastReceiverOptions` before start; they cannot be added after the framework initializes.
- **`/display` reuse reduces receiver build scope:** The receiver is the existing `/display` SvelteKit route, bootstrapped with the CAF receiver SDK script. The only additions are: a loading overlay, an idle overlay, and the custom-channel listener that writes incoming state into the existing Svelte store.

---

## MVP Definition

### Launch With (v1.1 — Cast MVP)

The minimum to achieve "score a match on the tablet, watch live on the Chromecast TV."

- [ ] **Cast button** (`<google-cast-launcher>`) in `/match` toolbar — all three states (available / connecting / connected)
- [ ] **CastContext initialization** with the registered unpublished `receiverApplicationId` and `autoJoinPolicy: ORIGIN_SCOPED`
- [ ] **Session-start handler** — sender sends full state snapshot immediately on session start
- [ ] **Per-throw delta sender** — each throw event also posts a delta over the custom Cast channel (alongside existing BroadcastChannel post)
- [ ] **Custom Web Receiver** — `/display` with CAF receiver SDK, `disableIdleTimeout: true`, custom-channel listener hydrating Svelte store
- [ ] **Receiver loading screen** — app logo + spinner, shown until first snapshot arrives
- [ ] **Receiver idle screen** — app logo + "Kein aktives Spiel" message, shown when no sender is connected or match is over
- [ ] **Session-end handler** — sender clears cast status indicator on `SESSION_ENDED`; receiver transitions to idle screen on sender disconnect
- [ ] **"Überträgt auf: [Gerätename]" status toast** on session start in `/match`
- [ ] **Overscan-safe receiver layout** — verify `/display` has 10% edge margins at 1920×1080

### Add After Validation (v1.1.x)

- [ ] **Smooth score-update transitions** — CSS fade on remaining-score field (low effort, high polish)
- [ ] **Session resume toast** ("Verbindung wiederhergestellt") on `SESSION_RESUMED` — informs user after a network drop recovery

### Future Consideration (v2+)

- [ ] **Idle-screen match-summary** — show last match result on the idle screen (requires passing summary data)
- [ ] **Receiver UI theme customization** — different color schemes for different match moods (very low priority, home-use only)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Cast button (`<google-cast-launcher>`) in /match | HIGH | LOW | P1 |
| CastContext init + App ID wiring | HIGH | LOW | P1 |
| Snapshot on session start (sender) | HIGH | LOW | P1 |
| Per-throw delta over Cast channel (sender) | HIGH | LOW | P1 |
| Custom receiver with CAF SDK + channel listener | HIGH | MEDIUM | P1 |
| `disableIdleTimeout: true` on receiver | HIGH | LOW | P1 (prevents session death during auto-pause) |
| Receiver loading screen | MEDIUM | LOW | P1 |
| Receiver idle screen | MEDIUM | LOW | P1 |
| Session-end / disconnect handling | HIGH | LOW | P1 |
| Status toast ("Überträgt auf…") | MEDIUM | LOW | P1 |
| Overscan margin verification on /display | MEDIUM | LOW | P1 |
| `autoJoinPolicy: ORIGIN_SCOPED` (session resume) | HIGH | LOW | P1 (one-line config, prevents frustrating re-cast on refresh) |
| CSS transition on score update | LOW | LOW | P2 |
| Session-resume toast | LOW | LOW | P2 |
| Idle-screen match summary | LOW | MEDIUM | P3 |
| Mini controller | N/A | MEDIUM | SKIP |
| Expanded controller | N/A | MEDIUM | SKIP |
| Multiple-sender authority model | N/A | HIGH | SKIP |
| Cast Introduction overlay | N/A | LOW | SKIP |
| Volume control integration | N/A | LOW | SKIP |

---

## Receiver Screen State Reference

The CAF receiver for a non-media scoreboard has three meaningful screen states. These must be implemented:

| State | Trigger | What TV Shows | Duration |
|-------|---------|---------------|----------|
| **Loading** | Receiver app bootstrapping (before CAF framework ready) | Neverman logo + animated spinner, dark background | Seconds (until framework init + first message) |
| **Active** | Full state snapshot received from sender | Live `/display` scoreboard: player scores, legs/sets, averages — identical to the existing spectator view | As long as match is running and sender is connected |
| **Idle** | No sender connected, or "match ended" signal received | Neverman logo + "Kein aktives Spiel" text, optionally last-match player names | Until next session / next match; rotate to prevent burn-in if idle for more than a few minutes |

Note: The Google CAF design guideline specifies that the idle state should rotate content every 30–60 seconds and disconnect after 5 minutes of complete inactivity. With `disableIdleTimeout: true`, the receiver stays alive; but if there is no sender connected for an extended period (e.g. Chromecast was cast to by accident with no match running), the idle screen rotation prevents screen burn. The receiver app itself does not need to self-terminate — when the last sender disconnects, the Chromecast OS will eventually reclaim it after a long timeout.

---

## Sources

- [Google Cast UX Guidelines](https://developers.google.com/cast/docs/ux_guidelines) — sender/receiver model, button placement, receiver UI zones — MEDIUM (official)
- [Google Cast Design Checklist — Cast Button](https://developers.google.com/cast/docs/design_checklist/cast-button) — button states, introduction overlay, position — MEDIUM (official)
- [Google Cast Design Checklist — Sender App](https://developers.google.com/cast/docs/design_checklist/sender) — mini controller, expanded controller, volume, stop casting, what is N/A for web senders — MEDIUM (official)
- [Google Cast Design Checklist — Non-Touch Receiver](https://developers.google.com/cast/docs/design_checklist/receiver) — receiver screen states (idle, loading, playing, paused), idle timeout guidelines — MEDIUM (official)
- [Integrate Cast SDK into Your Web Sender App](https://developers.google.com/cast/docs/web_sender/integrate) — `<google-cast-launcher>`, `CastContext.setOptions`, `autoJoinPolicy`, session state events, custom channel API — MEDIUM (official)
- [Add Core Features to Your Custom Web Receiver](https://developers.google.com/cast/docs/web_receiver/core_features) — `addCustomMessageListener`, `SENDER_DISCONNECTED`, late-join, `disableIdleTimeout`, `CastReceiverOptions` — MEDIUM (official)
- [CastReceiverOptions reference](https://developers.google.com/cast/docs/reference/web_receiver/cast.framework.CastReceiverOptions) — `disableIdleTimeout`, `maxInactivity`, `customNamespaces` — MEDIUM (official)
- [Cast Overview — multiple senders](https://developers.google.com/cast/docs/overview) — multi-sender session semantics — MEDIUM (official)
- Web search synthesis (2026-06-18): `disableIdleTimeout` for non-media apps, `autoJoinPolicy` reconnect behavior, custom channel scoreboard pattern, idle timeout confirmation (~5 min) — LOW–MEDIUM (cross-checked)

---

*Feature research for: Google Cast integration — private home darts-scoring PWA (v1.1)*
*Researched: 2026-06-18*
