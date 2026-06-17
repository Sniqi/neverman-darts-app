# Neverman Darts App

## What This Is

A touch-optimized darts scoring web app (PWA) for home play with steel darts. Players enter their thrown darts manually on an on-screen dartboard; a separate spectator display shows the live game state, readable from across the room. Runs on Android tablets and Windows PCs without any dev tools — installable from GitHub Pages, fully offline-capable afterwards.

## Core Value

A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

## Current Milestone: v1.1 Chromecast-Integration

**Goal:** Den Live-Spielstand vom Tablet (`/match`) per Google Cast auf einen Chromecast am TV bringen — `/display` läuft eigenständig als Custom Cast Receiver, das Tablet bleibt frei zum Scoren.

**Target features:**
- Cast Sender in `/match`: offizieller Cast-Button, Geräte-Discovery, Session-Start/-Stop, Verbindungsstatus-UI
- Custom Web Receiver: `/display` als eigenständige Receiver-App auf dem Chromecast (gehostet auf GitHub Pages, HTTPS)
- Zustands-Sync über Cast-Custom-Channel: voller Snapshot beim Verbinden (Hydration) + Deltas pro Wurf
- Koexistenz: bestehendes PC-Zweitfenster (BroadcastChannel) und Tablet-Fullscreen bleiben funktionsfähig; Cast ist additiv
- Setup: Receiver bleibt unpublished, eigener Chromecast per Seriennummer registriert; App-ID-Handling im Build

## Requirements

### Validated

- **Statistics (live + lifetime + dashboard)** — live 3-dart/first-9 averages, checkout %, score bands, best/worst leg during play; per-profile lifetime stats with hand-rolled SVG charts at `/stats`; match-detail breakdown. *Validated in Phase 4: Statistics & Achievements.*
- **Achievements: personal records celebrated live AND stored** — highest visit/checkout, best leg, best match average, 180s detected in real time, celebrated on input + spectator views, and persisted (recompute-from-history). Records celebrate once per genuine new best. *Validated in Phase 4 (human UAT 2026-06-12).*
- **Audio caller + auto-pause** — Web Speech caller announces each non-bust visit (DE/EN) with a checkout-number hint; sound effects on 180/high-finish/record; independent toggles + a master volume slider (default 50%); auto-pause shows a synced countdown overlay on both views after a configurable number of legs, auto-resuming or via "Weiter". *Validated in Phase 5 (human UAT 2026-06-13).* Audio plays from the scoring window (`/match`) only — the spectator window is passive and browsers block its autoplay.
- **PWA & deployment** — installable PWA (manifest + service worker via `@vite-pwa/sveltekit`, `registerType: 'prompt'`); full offline precache incl. SFX; subpath-correct build for GitHub Pages (`BASE_PATH=/neverman-darts-app`); German dark update toast ("Neue Version verfügbar"); GitHub Actions deploy workflow. *Config validated + accepted in Phase 6 (2026-06-13).* Live go-live (create repo, enable Pages, push) is the user's outward-facing step — workflow is committed and ready.

### Active

**Game engine**
- [ ] X01 game modes: 301, 401, 501 with Single Out / Double Out
- [ ] Up to 4 players per match
- [ ] Legs and sets support
- [ ] Bull-off (Ausbullen) at match start — players throw at bull for real; the app only records the resulting starting order/winner
- [ ] Checkout suggestions: what to throw with the next 1–3 darts to finish
- [x] Auto-pause option: after a configurable number of legs (e.g. 5), a pause screen with countdown timer (e.g. 5 min) appears; continues after timer or button press *(Phase 5)*

**Input**
- [ ] Manual dart entry on a displayed dartboard, optimized for touch — triple and double segments must be large enough to hit reliably with a finger on a tablet

**Spectator display**
- [ ] On PC: second browser window that can be dragged to a second monitor
- [ ] On tablet: fullscreen display view within the app
- [ ] Shows: current score, legs/sets, player names, leg average, match average
- [ ] Readable on a 27" monitor from 3 m distance

**Statistics & persistence**
- [ ] Persistent player profiles, match history, and long-term statistics across sessions
- [ ] Achievements: personal records (e.g. new highest 3-dart score, new highest checkout) — celebrated live with an in-game overlay AND stored in player statistics

**Platform & look**
- [x] PWA hosted on GitHub Pages: open once in browser, install to home screen (Android) / as app (desktop), works offline afterwards *(Phase 6 — config ready; user go-live pending)*
- [x] Native dark mode design *(Phases 1–6)*
- [x] German UI *(Phases 1–6)*

**Cast / Chromecast (v1.1)**
- [ ] Cast the live display from the tablet (`/match`) to a Chromecast at the TV via Google Cast — board stays free for touch scoring
- [ ] `/display` runs standalone as a Custom Web Receiver on the Chromecast (no screen-mirroring)
- [ ] Live state sync over the Cast session: full snapshot on connect + per-throw deltas
- [ ] Existing PC second-window and tablet fullscreen spectator paths keep working unchanged (Cast is additive)
- [ ] Receiver stays unpublished; user registers their own Chromecast by serial number

### Out of Scope

- Camera-based automatic dart detection (autodarts/Scolia style) — manual input is the design; no camera hardware assumed
- Online/cloud multiplayer or internet-based cross-device sync — no backend; the match runs on one device. *(As of v1.1, local Chromecast cast-session sync to a TV IS in scope — see Current Milestone. This exclusion now covers internet/cloud sync only; the Chromecast is synced LAN-locally over the Cast session, not via a server.)*
- App store distribution (Play Store etc.) — PWA install covers Android sufficiently
- Backend/server — GitHub Pages is static hosting only; all data stays on-device

## Context

- Empty greenfield repo at `D:\github\neverman-darts-app`; target deployment is GitHub Pages.
- Primary input device is an Android tablet (touch); the spectator display typically runs on a PC with a 27" monitor viewed from ~3 m.
- User explicitly requested domain research (with Opus agents) to surface additional features that are standard or sensible in darts scoring apps.
- Common reference apps in this space: DartCounter, Russ Bray Scorer, autodarts (for feature expectations, not for camera detection).

## Constraints

- **Platform**: Must run on Android (Chrome) and Windows browsers with zero dev tools or installation steps — PWA from a URL
- **Hosting**: GitHub Pages — static files only, no backend, no server-side logic
- **Input**: Touch-first UI; triple/double board segments must be reliably hittable by finger
- **Readability**: Spectator view legible on 27" at 3 m — large typography, high contrast, dark mode
- **Language**: German UI throughout

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA hosted on GitHub Pages | Best path to Android + PC with zero install friction; offline via service worker | ✓ Done (Phase 6 — `@vite-pwa/sveltekit`, prompt update, GH Actions deploy; user go-live pending) |
| Spectator window only on PC; tablet uses in-app fullscreen view | Android has no freely movable windows | — Pending |
| Bull-off records result only (no bull throw input) | The real throw happens at the board; app only needs the starting order | — Pending |
| Auto-pause = pause screen with countdown timer | User preference; continues automatically or by button | ✓ Done (Phase 5) |
| Achievements celebrated live + persisted in stats | User preference | — Pending |
| German UI, dark mode native | User preference | — Pending |
| Audio plays from scoring window (`/match`) only, not the spectator | Browsers block autoplay in a window that never received a user gesture; the passive Observer stays muted | ✓ Done (Phase 5, UAT-decided 2026-06-13) |
| Master volume slider (default 50%) for caller + SFX; checkout hint speaks the number | User preference during Phase 5 UAT | ✓ Done (Phase 5) |
| Chromecast via Google Cast SDK (Custom Receiver), not screen-mirroring or a cloud relay | Casts data, not pixels: tablet stays free for scoring; no backend needed (sync runs over the Cast session on the LAN); fits GitHub Pages static hosting; receiver stays unpublished on the user's own device (one-time $5 Cast dev registration) | — Pending (v1.1) |
| Reversed "cross-device sync = out of scope" for local Cast only | The Chromecast is a genuine second device, but sync is LAN-local via the Cast session — still no backend, still offline-capable at home; internet/cloud sync remains out of scope | — Pending (v1.1) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-18 — Milestone v1.1 (Chromecast-Integration) started*
