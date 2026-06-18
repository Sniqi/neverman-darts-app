# Roadmap: Neverman Darts App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-06-13) — full archive: [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)
- ▶ **v1.1 Chromecast-Integration** — Phase 7 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–6) — SHIPPED 2026-06-13</summary>

- [x] **Phase 1: Playable X01 Match** (13/13 plans) — completed 2026-06-11
- [x] **Phase 2: Spectator Display** (6/6 plans) — completed 2026-06-11
- [x] **Phase 3: Persistence & Data** (3/3 plans) — completed 2026-06-12 · *manual UAT deferred (03-UAT.md)*
- [x] **Phase 4: Statistics & Achievements** (5/5 plans) — completed 2026-06-12 (human UAT)
- [x] **Phase 5: Audio & Auto-Pause** (3/3 plans) — completed 2026-06-13 (human UAT)
- [x] **Phase 6: PWA & Deployment** (3/3 plans) — completed 2026-06-13 · *live go-live is a user step*

Full phase details, success criteria, and milestone summary: [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)

</details>

### v1.1 Chromecast-Integration

- [ ] **Phase 7: Chromecast Integration** - Wire the tablet as a Cast sender and `/display` as a Custom Web Receiver so the live scoreboard appears on a Chromecast-connected TV without disrupting existing spectator paths

## Phase Details

### Phase 7: Chromecast Integration

**Goal**: Users can cast the live darts scoreboard from the scoring tablet to a Chromecast-connected TV, with the tablet remaining free for touch scoring and all existing spectator paths (PC second window, tablet fullscreen) continuing to work unchanged

**Depends on**: Phase 6 (PWA deployed to GitHub Pages — the receiver must be served at a stable HTTPS URL under the repo subpath)

**Requirements**: CAST-01, CAST-02, CAST-03, CAST-04, CAST-05, CAST-06, RECV-01, RECV-02, RECV-03, RECV-04, RECV-05, SYNC-01, SYNC-02, SYNC-03, SYNC-04, SETUP-01, SETUP-02, SETUP-03

**Success Criteria** (what must be TRUE):

  1. User taps the Cast button on `/match`, selects their registered Chromecast, and the TV displays the live scoreboard within seconds — without leaving the scoring view
  2. Every dart thrown on the tablet updates the score on the TV in real time; the auto-pause countdown appears and stays in sync on the TV during break intervals
  3. When the tablet page is reloaded mid-cast, the session auto-rejoins and the TV scoreboard recovers the full current match state without re-selecting the device
  4. On a non-Chrome browser (or when no Chromecast is available), `/match` works normally with the Cast control hidden — no errors, no broken layout
  5. The PC second-window (BroadcastChannel) and tablet fullscreen spectator routes work identically before and after Phase 7 is integrated

**Open Decisions (resolve in `/gsd-discuss-phase` before planning):**

  - Receiver entry point: standalone `static/receiver.html` (clean SW isolation, UI duplication) vs. reuse prerendered `/display` route (zero duplication, needs `navigateFallbackDenylist`) — affects RECV-01, SETUP-01
  - Cast message payload: full `MatchState` snapshot (simple, reuses BC payload, risks 64 KB cap on long matches) vs. trimmed `CastDisplayState` projection (payload-safe, extra type) — affects SYNC-01, SYNC-02
  - App ID env strategy: single `VITE_CAST_APP_ID` vs. dev/prod split — affects SETUP-02

**Non-code prerequisite (gates all E2E verification):**

  - Cast Developer Console registration ($5 one-time, Chromecast serial registered, receiver URL registered, 15-min propagation + reboot) must be complete before any real-device testing is possible. SETUP-03 includes a written guide for this step.

**Plans**: 6 plans
**Wave 1**

- [ ] 07-01-PLAN.md — D-04 build gate: prerender /display, SW denylist, CAST_NS, @types install + isolation, Wave 0 scaffolds
- [ ] 07-06-PLAN.md — RECV-05 score flash, VITE_CAST_APP_ID deploy wiring, SETUP-03 registration guide

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 07-02-PLAN.md — CastDisplayState projection (toDisplayState, isValidCastState) under the 32 KB cap (TDD)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 07-03-PLAN.md — CastSenderManager session state machine (availability, resume, auto-join) (TDD)
- [ ] 07-04-PLAN.md — Receiver: isCastReceiverContext, CastReceiverBridge, receiveSnapshot ingress, /display wiring (TDD)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 07-05-PLAN.md — Sender wiring: #publishToCast, /match init, SpectatorChooser Cast row, ResumeToast

**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Playable X01 Match | v1.0 | 13/13 | Complete | 2026-06-11 |
| 2. Spectator Display | v1.0 | 6/6 | Complete | 2026-06-11 |
| 3. Persistence & Data | v1.0 | 3/3 | Complete | 2026-06-12 |
| 4. Statistics & Achievements | v1.0 | 5/5 | Complete | 2026-06-12 |
| 5. Audio & Auto-Pause | v1.0 | 3/3 | Complete | 2026-06-13 |
| 6. PWA & Deployment | v1.0 | 3/3 | Complete | 2026-06-13 |
| 7. Chromecast Integration | v1.1 | 0/6 | Not started | - |
