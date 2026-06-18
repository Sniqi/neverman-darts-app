# Requirements: Neverman Darts App — v1.1 Chromecast-Integration

**Defined:** 2026-06-18
**Core Value:** A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

## v1 Requirements

Requirements for the v1.1 milestone (Chromecast integration). Each maps to a roadmap phase. The Cast layer is **additive** — every existing v1.0 spectator path (PC second window, tablet fullscreen) must keep working unchanged.

### CAST — Sender (Tablet `/match`)

- [ ] **CAST-01**: User can start casting the live display to a Chromecast from `/match` via the official Cast button
- [ ] **CAST-02**: The Cast button reflects connection state (verfügbar / verbindet / verbunden)
- [ ] **CAST-03**: User sees which device is being cast to ("Überträgt auf: <Gerät>") and can stop casting from `/match`
- [ ] **CAST-04**: On a browser without Cast support (non-Chrome), `/match` works normally with the Cast control hidden/disabled (graceful degradation)
- [ ] **CAST-05**: After a tablet page reload during an active cast, the session auto-rejoins without re-selecting the device
- [ ] **CAST-06**: User sees a brief "Verbindung wiederhergestellt" hint when a Cast session resumes *(polish)*

### RECV — Receiver (Chromecast)

- [ ] **RECV-01**: The Chromecast runs `/display` as a standalone Custom Web Receiver showing the live scoreboard (not screen-mirroring)
- [ ] **RECV-02**: Before the first state arrives, the receiver shows a loading screen
- [ ] **RECV-03**: When no match is active or the sender disconnects, the receiver shows an idle screen ("Kein aktives Spiel")
- [ ] **RECV-04**: The receiver stays connected through long pauses (idle timeout disabled — survives auto-pause breaks)
- [x] **RECV-05**: The remaining-score field animates smoothly on update *(polish)*

### SYNC — State sync over Cast

- [x] **SYNC-01**: On connect (including late join / reconnect), the receiver hydrates the full current match state
- [x] **SYNC-02**: Every dart/visit updates the Chromecast scoreboard live
- [x] **SYNC-03**: The auto-pause countdown stays in sync on the Chromecast display
- [ ] **SYNC-04**: The existing PC second-window (BroadcastChannel) and tablet fullscreen spectator paths keep working unchanged (Cast is additive)

### SETUP — Deployment & registration

- [x] **SETUP-01**: The receiver is served at a stable HTTPS URL on GitHub Pages, correct under the repo subpath, and is not intercepted or broken by the PWA service worker
- [x] **SETUP-02**: The Cast App ID is supplied at build time (no hard-coded App ID committed in source)
- [x] **SETUP-03**: A written setup guide documents the one-time Cast Console registration (unpublished receiver, register own Chromecast by serial, 15-min propagation + reboot)

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### RECV — Receiver polish

- **RECV-06**: Idle-screen match summary (last result shown between games)
- **RECV-07**: Receiver UI theme customization

## Out of Scope

Explicitly excluded for v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Published (public) Cast receiver | Stays unpublished for private home use; publishing requires Google review and is unnecessary for the user's own device |
| Multiple simultaneous senders / sender-authority model | One scoring tablet, one Chromecast — a multi-sender model adds complexity with no home-use benefit |
| Mini controller / expanded controller / volume integration | Media-player Cast artifacts; N/A for a non-media scoreboard receiver (audio plays from the sender per the v1.0 decision) |
| Internet/cloud cross-device sync | No backend; Cast sync is LAN-local over the Cast session only (PROJECT.md constraint) |
| Casting from non-Chrome browsers | The Google Cast Sender SDK is Chrome/Chromium-only — a platform limitation, not a project choice |

## Open Decisions (resolve in `/gsd-discuss-phase` before planning)

Surfaced by research; deliberately not pre-decided here because they are implementation (HOW) tradeoffs, not scope (WHAT):

1. **Receiver entry point** — standalone `static/receiver.html` (clean SW/SPA isolation, duplicates scoreboard UI) vs. reuse the prerendered `/display` route (zero UI duplication, needs `navigateFallbackDenylist`). Affects RECV-01, SETUP-01.
2. **Cast message payload** — full `MatchState` snapshot (simple, reuses BroadcastChannel payload, risks the 64 KB cap on long matches) vs. trimmed `CastDisplayState` projection (payload-safe, extra type). Affects SYNC-01, SYNC-02.
3. **App ID env strategy** — single `VITE_CAST_APP_ID` vs. dev/prod split. Affects SETUP-02.

## Traceability

Which phase covers which requirement. Filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAST-01 | Phase 7 | Pending |
| CAST-02 | Phase 7 | Pending |
| CAST-03 | Phase 7 | Pending |
| CAST-04 | Phase 7 | Pending |
| CAST-05 | Phase 7 | Pending |
| CAST-06 | Phase 7 | Pending |
| RECV-01 | Phase 7 | Pending |
| RECV-02 | Phase 7 | Pending |
| RECV-03 | Phase 7 | Pending |
| RECV-04 | Phase 7 | Pending |
| RECV-05 | Phase 7 | Complete |
| SYNC-01 | Phase 7 | Complete |
| SYNC-02 | Phase 7 | Complete |
| SYNC-03 | Phase 7 | Complete |
| SYNC-04 | Phase 7 | Pending |
| SETUP-01 | Phase 7 | Complete |
| SETUP-02 | Phase 7 | Complete |
| SETUP-03 | Phase 7 | Complete |

**Coverage:**

- v1 requirements: 18 total
- Mapped to phases: 18/18 (Phase 7)
- Unmapped: 0

---
*Requirements defined: 2026-06-18*
*Last updated: 2026-06-18 — traceability filled after roadmap creation*
