# Neverman Darts App

## What This Is

A touch-optimized darts scoring web app (PWA) for home play with steel darts. Players enter their thrown darts manually on an on-screen dartboard; a separate spectator display shows the live game state, readable from across the room — as a PC second window, tablet fullscreen view, or cast to a Chromecast TV via Google Cast. Runs on Android tablets and Windows PCs without any dev tools — installable from GitHub Pages, fully offline-capable afterwards.

## Core Value

A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

## Current Milestone: v1.2 Restyling

**Goal:** Die gesamte App-UI auf den Ziel-Zustand des Design-Systems (`design/`) bringen — Barlow-Typografie, geschichtete dunkle Surfaces mit Amber-Akzent `#f0a424`, neue Radien/Elevation/Motion — auf beiden Surfaces (Scoring-App + Spectator-Display inkl. Cast-Receiver), ohne Funktionalität zu ändern.

**Target features:**
- Design-Tokens app-weit übernommen (Farben, Spacing, Radien, Elevation, Typo-Skalen)
- Barlow + Barlow Semi Condensed self-hosted (OFL), offline via PWA-Precache
- Core-Komponenten nach DS-Spec (Buttons, Chips, SegmentedControl, Stepper, ToggleRow, StatCard, ConfirmDialog)
- Scoring-Surface nach DS-Spec (Numpad, Dartboard-Farben, VisitStrip, ScoreCards)
- Display-Surface nach DS-Spec (cqw-Display-Skala, Active-Player-Treatment) — Chrome-90-sicher via `@supports` für den Cast-Receiver
- Alle Seiten restyled (Hub, Setup, History, Stats, Daten/Backup) + Overlays/Toasts
- Motion-System nach DS (100–300ms, reduced-motion-Collapse)

**Prior state:** v1.1 shipped 2026-07-13 (Chromecast, UAT 5/5); PWA live at https://sniqi.github.io/neverman-darts-app — full history in `.planning/MILESTONES.md`.

## Requirements

### Validated

- ✓ **X01 game engine** — 301/401/501 with Single/Double Out, up to 4 players, legs & sets, bull-off (result-only), checkout suggestions, undo via event-log replay — v1.0 (Phase 1)
- ✓ **Touch dart entry** — SVG dartboard with polar-math hit detection and enlarged triple/double rings + numpad with impossible-score validation, correction window, darts-at-double dialog — v1.0 (Phase 1)
- ✓ **Spectator display** — PC second window (BroadcastChannel + localStorage hydration) and tablet fullscreen route; scores/legs/sets/averages readable on 27" at 3 m — v1.0 (Phase 2)
- ✓ **Persistence** — Dexie/IndexedDB player profiles, match history, long-term stats, JSON backup export/import — v1.0 (Phase 3)
- ✓ **Chromecast** — `/match` as Cast sender (official button, states, stop, graceful degradation), `/display` as unpublished Custom Web Receiver, snapshot+delta sync over a Cast custom channel incl. auto-pause countdown, ORIGIN_SCOPED auto-rejoin with match restore, existing spectator paths unchanged — v1.1 (Phase 7, on-device UAT 5/5)
- **Statistics (live + lifetime + dashboard)** — live 3-dart/first-9 averages, checkout %, score bands, best/worst leg during play; per-profile lifetime stats with hand-rolled SVG charts at `/stats`; match-detail breakdown. *Validated in Phase 4: Statistics & Achievements.*
- **Achievements: personal records celebrated live AND stored** — highest visit/checkout, best leg, best match average, 180s detected in real time, celebrated on input + spectator views, and persisted (recompute-from-history). Records celebrate once per genuine new best. *Validated in Phase 4 (human UAT 2026-06-12).*
- **Audio caller + auto-pause** — Web Speech caller announces each non-bust visit (DE/EN) with a checkout-number hint; sound effects on 180/high-finish/record; independent toggles + a master volume slider (default 50%); auto-pause shows a synced countdown overlay on both views after a configurable number of legs, auto-resuming or via "Weiter". *Validated in Phase 5 (human UAT 2026-06-13).* Audio plays from the scoring window (`/match`) only — the spectator window is passive and browsers block its autoplay.
- **PWA & deployment** — installable PWA (manifest + service worker via `@vite-pwa/sveltekit`, `registerType: 'prompt'`); full offline precache incl. SFX; subpath-correct build for GitHub Pages (`BASE_PATH=/neverman-darts-app`); German dark update toast ("Neue Version verfügbar"); GitHub Actions deploy workflow. *Config validated + accepted in Phase 6 (2026-06-13).* Live go-live (create repo, enable Pages, push) is the user's outward-facing step — workflow is committed and ready.
- ✓ **Design foundation (v1.2)** — DS tokens app-wide (colors/spacing/radii/elevation as static Chrome-90-safe values), Barlow + Barlow Semi Condensed self-hosted as WOFF2 (offline-precached, tabular-nums on score surfaces), DS motion tokens with reduced-motion collapse, zero provisional colors (grep-gated by `src/lib/design-tokens.test.ts`) — v1.2 (Phase 8, verified 8/8 must-haves)
- ✓ **Core components (v1.2)** — shared `.btn` (5 DS variants + 4 extensions) & `.switch` primitives in `src/styles/components.css`; dialogs on DS spec (blur scrim, scale-in .94, 420px, stacked buttons); chips/segmented/steppers/toggles at DS sizes with spring thumbs; StatCard 40px/BSC — v1.2 (Phase 9, verified 15/15 must-haves, 535 tests + 9/9 E2E)

### Active

**Restyling (v1.2)** — pure visual adoption of the design system in `design/`; no functional changes, all existing tests stay green.

- [x] Foundation: DS color/spacing/radius/elevation tokens replace the provisional styling app-wide *(Phase 8 ✓)*
- [x] Typography: Barlow (UI) + Barlow Semi Condensed (score numerals), self-hosted, offline-precached, tabular-nums on score surfaces *(Phase 8 ✓)*
- [x] Core components restyled to DS specs (Button, Chip, SegmentedControl, Stepper, ToggleRow, StatCard, ConfirmDialog) *(Phase 9 ✓)*
- [ ] Scoring surface restyled (Numpad, Dartboard colors, VisitStrip, ScoreCard, active-score 96px treatment)
- [ ] Spectator display restyled (cqw display scale, amber active-player edge/glow, header + gradients) — Chrome-90-safe on the Cast receiver
- [ ] All pages restyled (Hub, Setup, History, Stats, Daten/Backup) incl. overlays/toasts
- [x] Motion system per DS (100–300ms + DS-documented exceptions, standard/spring easing, `prefers-reduced-motion` collapse) *(Phase 8 ✓)*

### Out of Scope

- Camera-based automatic dart detection (autodarts/Scolia style) — manual input is the design; no camera hardware assumed
- Online/cloud multiplayer or internet-based cross-device sync — no backend; the match runs on one device. *(As of v1.1, local Chromecast cast-session sync to a TV IS in scope — see Current Milestone. This exclusion now covers internet/cloud sync only; the Chromecast is synced LAN-locally over the Cast session, not via a server.)*
- App store distribution (Play Store etc.) — PWA install covers Android sufficiently
- Backend/server — GitHub Pages is static hosting only; all data stays on-device

## Context

- Live PWA at https://sniqi.github.io/neverman-darts-app (GitHub Pages, GitHub Actions deploy); SvelteKit 2 + Svelte 5 runes, Dexie, vite-plugin-pwa; ~511 tests (unit + browser + E2E).
- Primary input device is an Android tablet (touch); the spectator display runs as a PC second window (27" at ~3 m), tablet fullscreen, or on a Chromecast TV (Custom Web Receiver — the Cast device runs **Chrome 90 @ 1280×720**: no container queries, no dvh, no subgrid; modern CSS must be gated behind `@supports`).
- A complete Claude Design system lives in `design/` (synced 2026-07-13 from the claude.ai/design project): Barlow typefaces, amber `#f0a424` accent on blue-tinted charcoal surfaces, tokens/guidelines/components/templates. It is the **target visual state** — the app still shows the provisional v1.0 styling.
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
| Spectator window only on PC; tablet uses in-app fullscreen view | Android has no freely movable windows | ✓ Good (v1.0, in daily use) |
| Bull-off records result only (no bull throw input) | The real throw happens at the board; app only needs the starting order | ✓ Good (v1.0) |
| Auto-pause = pause screen with countdown timer | User preference; continues automatically or by button | ✓ Done (Phase 5) |
| Achievements celebrated live + persisted in stats | User preference | ✓ Good (Phase 4, human UAT) |
| German UI, dark mode native | User preference | ✓ Good (v1.0) |
| Audio plays from scoring window (`/match`) only, not the spectator | Browsers block autoplay in a window that never received a user gesture; the passive Observer stays muted | ✓ Done (Phase 5, UAT-decided 2026-06-13) |
| Master volume slider (default 50%) for caller + SFX; checkout hint speaks the number | User preference during Phase 5 UAT | ✓ Done (Phase 5) |
| Chromecast via Google Cast SDK (Custom Receiver), not screen-mirroring or a cloud relay | Casts data, not pixels: tablet stays free for scoring; no backend needed (sync runs over the Cast session on the LAN); fits GitHub Pages static hosting; receiver stays unpublished on the user's own device (one-time $5 Cast dev registration) | ✓ Good (v1.1, on-device UAT 5/5) |
| Reversed "cross-device sync = out of scope" for local Cast only | The Chromecast is a genuine second device, but sync is LAN-local via the Cast session — still no backend, still offline-capable at home; internet/cloud sync remains out of scope | ✓ Good (v1.1) |
| Absolute asset paths (`kit.paths.relative=false`) | Relative `../_app` paths 404 at the domain root when the Cast receiver (or a manual reload) loads `/display` without a trailing slash — absolute paths resolve at any route depth | ✓ Good (v1.1 UAT fix, 5b333e9) |
| Modern CSS gated behind `@supports` for the receiver | The Cast device runs Chrome 90 (no container queries/dvh/subgrid); duplicate-property fallbacks don't survive the CSS minifier's dedup — `@supports` blocks do | ✓ Good (v1.1 UAT fix) |
| Cast messages carry a `type` discriminant + sender→receiver contract test | Receiver routes only `data.type === 'snapshot'`; isolated unit tests missed the untagged-payload mismatch — the contract test guards the wire format | ✓ Good (v1.1 UAT fix, 3f028f2) |

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
*Last updated: 2026-07-14 after Phase 9 (Core Components) completion*
