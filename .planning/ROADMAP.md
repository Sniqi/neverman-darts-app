# Roadmap: Neverman Darts App

## Milestones

- ✅ **v1.0 MVP** — Phases 1–6 (shipped 2026-06-13) — full archive: [`milestones/v1.0-ROADMAP.md`](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Chromecast-Integration** — Phase 7 (shipped 2026-07-13; UAT 5/5 on-device 2026-06-19) — full archive: [`milestones/v1.1-ROADMAP.md`](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Restyling** — Phases 8–12 (in progress)

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

<details>
<summary>✅ v1.1 Chromecast-Integration (Phase 7) — SHIPPED 2026-07-13</summary>

- [x] **Phase 7: Chromecast Integration** (6/6 plans) — completed 2026-06-18; on-device UAT 5/5 passed 2026-06-19

Full phase details, success criteria, and milestone summary: [`milestones/v1.1-ROADMAP.md`](milestones/v1.1-ROADMAP.md)

</details>

### 🚧 v1.2 Restyling (Phases 8–12) — IN PROGRESS

**Milestone Goal:** Bring the entire app UI to the target state of the design system in `design/` — Barlow typography, layered dark surfaces with amber `#f0a424` accent, new radii/elevation/motion — on both surfaces (scoring app + spectator display incl. Cast receiver), without changing any functionality. Pure restyle; all ~511 existing tests stay green.

- [x] **Phase 8: Design Foundation** - DS color/spacing/radius/elevation tokens, self-hosted Barlow fonts, and the DS motion system replace all provisional v1.0 styling app-wide (completed 2026-07-13)
- [x] **Phase 9: Core Components** - Shared UI primitives (Button, Chip, SegmentedControl, Stepper, ToggleRow, StatCard, ConfirmDialog) match their DS specs everywhere they're used (completed 2026-07-14)
- [x] **Phase 10: Scoring Surface** - `/match` restyled to DS specs (Numpad, Dartboard colors, VisitStrip/DartPill, ScoreCard) with all scoring logic and behavior unchanged (completed 2026-07-14)
- [x] **Phase 11: Spectator Display** - `/display` restyled to DS specs (PC window, tablet fullscreen, Cast receiver) and verified on the real Chromecast device (Chrome 90 @ 1280×720) (completed 2026-07-14)
- [ ] **Phase 12: Pages & Overlays** - Start hub, setup, history, stats, and data/backup pages plus all global overlays/toasts restyled to DS specs

## Phase Details

### Phase 8: Design Foundation

**Goal**: The app's foundational visual language — color, typography, spacing/radii/elevation, and motion — matches the design system everywhere, replacing all provisional v1.0 styling.
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):

  1. Every screen in the app (scoring app + spectator display) renders on the DS dark, blue-tinted charcoal palette with amber `#f0a424` accents — no old provisional colors remain anywhere.
  2. All UI text renders in Barlow and all score numerals render in Barlow Semi Condensed with tabular figures, and both load correctly while the PWA is fully offline.
  3. Spacing, corner radii, and elevation (hairlines, layered shadows, edge-highlights) across every surface follow the DS 4px/radius/elevation scales — no ad-hoc spacing or mismatched corners remain.
  4. Interactive transitions (button press, dialog open, invalid-input shake, score float) animate within the DS's 100–300ms motion spec, and stop moving entirely when "reduce motion" is enabled.

**Plans**: 6/6 plans complete
Plans:
**Wave 1**

- [x] 08-01-PLAN.md — DS color/typography/spacing/elevation tokens + reduced-motion E2E proof

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-02-PLAN.md — Self-hosted WOFF2 fonts, PWA precache, offline-font E2E proof

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 08-03-PLAN.md — Sweep: scoring input, dialogs & overlays (15 files)
- [x] 08-04-PLAN.md — Sweep: display, setup & history (14 files)
- [x] 08-05-PLAN.md — Sweep: stats charts & route pages (12 files)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 08-06-PLAN.md — Profile.color default + durable no-provisional-colors regression test

**UI hint**: yes

### Phase 9: Core Components

**Goal**: Every shared UI primitive matches its DS component spec wherever it appears across the app.
**Depends on**: Phase 8
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):

  1. Every button shows the correct DS variant (amber gradient CTA, secondary, ghost, or destructive), visibly presses with a scale-down, and is comfortably tappable (≥48px).
  2. Chips, segmented controls (e.g. Single/Double Out), steppers (e.g. leg/set counts), and toggle rows (e.g. audio/SFX switches) render at DS sizes with spring-animated switch thumbs.
  3. Every confirmation dialog opens with a blurred scrim and a scale-in animation, and shows stacked full-width buttons with an explicit destructive action plus "Abbrechen".
  4. Stat cards (e.g. on the stats dashboard) show large DS-sized values with the DS caption styling.

**Plans**: 7/7 plans complete
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Shared `.btn` + `.switch` primitives (`components.css`) + hub page migration
- [x] 09-04-PLAN.md — StatCard restyle (independent — no shared-class dependency)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 09-02-PLAN.md — Route button sweep (stats/history/history-detail/data)
- [x] 09-03-PLAN.md — Dialog restyle (ConfirmDialog/DartsAtDoubleDialog/ResumePrompt)
- [x] 09-05-PLAN.md — MatchSetup chips/segmented control/steppers/toggle rows
- [x] 09-06-PLAN.md — PlayerPicker/ProfileManager/BullOffOrder button sweep
- [x] 09-07-PLAN.md — `/match` audio toggle rows

**UI hint**: yes

### Phase 10: Scoring Surface

**Goal**: The touch-scoring screen (`/match`) visually matches the DS scoring specs while every existing scoring behavior stays unchanged.
**Depends on**: Phase 8, Phase 9
**Requirements**: SCOR-01, SCOR-02, SCOR-03, SCOR-04
**Success Criteria** (what must be TRUE):

  1. The numpad shows DS-sized keys and digits with a visible pressed state and a ⌫ backspace key, and still enters scores correctly.
  2. The dartboard renders in DS board colors with an active-touch highlight, while polar hit detection, enlarged rings, and segment geometry keep working exactly as before.
  3. The visit strip shows pill-shaped dart notation (`T20`, `D16`, `Bull (50)`, `✕`) with the triple-flash color on triple hits.
  4. The score panel shows the active player in the large amber-edged treatment, inactive players smaller, checkout suggestions with an amber glow, and a red BUST flash — all matching current scoring behavior exactly.

**Plans**: 5/5 plans complete
Plans:

- [x] 10-05-PLAN.md

**Wave 1**

- [x] 10-01-PLAN.md — Numpad restyle to DS 76px/40px values + ⌫ aria-label (SCOR-01)
- [x] 10-02-PLAN.md — Dartboard flash/float literal-value gaps closed, hit-detection byte-identical (SCOR-02)
- [x] 10-03-PLAN.md — Live /match dart-pill notation + DartPill states via shared dart-notation.ts (SCOR-03)
- [x] 10-04-PLAN.md — ScorePanel/CheckoutSuggestion restyle to DS 96px/44px, amber glow, landscape overflow fix (SCOR-04)

**UI hint**: yes

### Phase 11: Spectator Display

**Goal**: The spectator display (PC second window, tablet fullscreen, and Chromecast receiver) matches the DS display spec and is confirmed working on the real Chromecast device, with all sync and behavior unchanged.
**Depends on**: Phase 8
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04
**Success Criteria** (what must be TRUE):

  1. Player panels scale their typography with the DS cqw clamps, the active player shows the amber edge + inner glow + tint, and inactive panels sit at 55% opacity.
  2. The match header and panel backgrounds show the DS dark gradients, an amber bloom under the header rule, and ● separators between stats.
  3. On the real Chromecast device (Chrome 90 @ 1280×720), the restyled display renders correctly with no layout breakage — every modern CSS feature used (container queries, dvh, subgrid) is confirmed to fall back correctly via `@supports`.
  4. BroadcastChannel/Cast sync, the idle screen, leg/set banners, the win overlay, and the pause countdown all still render and update exactly as before the restyle.

**Plans**: 3/3 plans complete
Plans:
**Wave 1**

- [x] 11-01-PLAN.md — Notation consolidation: shared `formatDartShort` (dart-notation.ts) + VisitLine.svelte planned test-string update
- [x] 11-02-PLAN.md — MatchHeader restyle to DS typography/spacing/bloom (DISP-02)

**Wave 2** *(blocked on 11-01 completion)*

- [x] 11-03-PLAN.md — PlayerPanel restyle: backgrounds/box-shadows/BUST/history-box, --display-* typography, formatDart consolidation + Chrome-90 fallback sync (DISP-01, DISP-03 code-side)

**UI hint**: yes

### Phase 12: Pages & Overlays

**Goal**: Every remaining app page and every global overlay/toast matches the DS screens, completing the restyle across the whole app.
**Depends on**: Phase 8, Phase 9
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):

  1. The start hub and match setup show the centered 520px column, DS list boxes, a collapsible "Profile verwalten" section, and terse German labels.
  2. Match history (list + detail) matches the DS HistoryRow layout and styling.
  3. The statistics dashboard shows DS typography/colors, with the existing bespoke SVG charts recolored to the DS palette (not rebuilt).
  4. The data/backup page and global overlays/toasts (PWA update toast, resume prompt, pause overlay, record celebrations) all match their DS specs.

**Plans**: 1/5 plans executed
Plans:
**Wave 1**

- [x] 12-01-PLAN.md — Hub + Setup restyle to DS 520px column/list-box/type-scale (PAGE-01)
- [ ] 12-02-PLAN.md — History list + detail restyle to DS HistoryRow spec (PAGE-02)
- [ ] 12-03-PLAN.md — Stats dashboard restyle + 2-line chart recolor fix (PAGE-03)
- [ ] 12-04-PLAN.md — Overlay restyle: Pause/Record/MatchWin panel treatment + button swap (PAGE-04)
- [ ] 12-05-PLAN.md — Toast restyle (ReloadPrompt + coupled test/ResumeToast) + Data/backup page (PAGE-04)

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
| 7. Chromecast Integration | v1.1 | 6/6 | Complete | 2026-06-18 |
| 8. Design Foundation | v1.2 | 6/6 | Complete    | 2026-07-13 |
| 9. Core Components | v1.2 | 7/7 | Complete    | 2026-07-14 |
| 10. Scoring Surface | v1.2 | 5/5 | Complete    | 2026-07-14 |
| 11. Spectator Display | v1.2 | 3/3 | Complete   | 2026-07-14 |
| 12. Pages & Overlays | v1.2 | 1/5 | In Progress|  |
