# Requirements: Neverman Darts App — v1.2 Restyling

**Defined:** 2026-07-13
**Core Value:** A full X01 darts match can be scored quickly and accurately by touch, with a large, readable live display for everyone in the room.

**Source of truth:** the design system in `design/` (synced 2026-07-13 from the claude.ai/design project "Neverman Darts Design System"). Every requirement below means "matches the corresponding `design/` spec" — tokens in `design/tokens/`, component specs in `design/components/**` (`.jsx` + `.prompt.md`), foundation rules in `design/guidelines/` and `design/readme.md`.

**Milestone character:** pure restyling. No functional changes, no new features, no engine/store/sync changes. All existing tests (~511) stay green; E2E flows unchanged.

## v1 Requirements

### FOUND — Foundation (tokens, fonts, motion)

- [x] **FOUND-01**: User sees the DS color world on every screen — page bg `#0c0e14`, layered surfaces (`#161a23`/`#1d2330`/`#29303f`), amber accent `#f0a424` with gradient fills, semantic red/green — no provisional v1.0 colors remain anywhere
- [x] **FOUND-02**: User sees Barlow for all UI text and Barlow Semi Condensed for all score numerals (`tabular-nums`), self-hosted (OFL) with `system-ui` fallback — fonts load offline via the PWA precache
- [x] **FOUND-03**: Spacing (strict 4px multiples), radii (8/12/16/20/999) and elevation (1px alpha hairlines + layered shadows + top edge-highlight) follow the DS tokens on every surface
- [x] **FOUND-04**: Motion follows the DS spec — 100–300ms, standard ease `cubic-bezier(.2,0,0,1)`, spring for switch/dialog pop, invalid-input shake, score floats — and collapses fully under `prefers-reduced-motion`

### COMP — Core components

- [x] **COMP-01**: Buttons match the DS Button spec — amber top-lit gradient CTA with near-black text and inner sheen, secondary/ghost variants, destructive variant, press state `scale(.97)`, ≥48px targets
- [x] **COMP-02**: Chips, segmented controls, steppers and toggle rows match their DS specs (56px chips/segments, spring switch thumbs, − / + steppers)
- [x] **COMP-03**: Dialogs match the DS ConfirmDialog spec — radius 20, blurred scrim `rgba(5,7,12,.65)` + 12px blur, scale-in from .94, max-width 420px, stacked full-width buttons, explicit destructive CTA + "Abbrechen"
- [x] **COMP-04**: Stat cards match the DS StatCard spec (40px values, caption style)

### SCOR — Scoring surface (`/match`)

- [x] **SCOR-01**: Numpad matches the DS Numpad spec — 76px keys, 32px digits, surface-step press states, ⌫ backspace
- [x] **SCOR-02**: Dartboard uses the DS board colors and active-touch highlight while polar hit detection, enlarged rings and segment geometry stay unchanged
- [x] **SCOR-03**: Visit strip and dart pills match the DS specs — pill radius 999, dart notation (`T20`, `D16`, `Bull (50)`, `✕`), triple flash color
- [x] **SCOR-04**: Score panel matches the DS ScoreCard spec — active player at 96px/800 with amber edge treatment, inactive at 44px, checkout route callout with amber glow, BUST flash in semantic red

### DISP — Spectator display (`/display`: PC window, tablet fullscreen, Cast receiver)

- [x] **DISP-01**: Player panels use the DS display scale — cqw-clamped typography (`--display-score` up to clamp(6rem, 27cqw, 26rem)), active-player amber edge + inner glow + tint, inactive panels at 55% opacity
- [x] **DISP-02**: Match header and panel backgrounds match the DS display spec — dark linear gradients, amber bloom under the header rule, ● separators
- [ ] **DISP-03**: The Chromecast receiver (Chrome 90 @ 1280×720) renders the restyled display correctly — every modern CSS feature (container queries, dvh, subgrid) gated behind `@supports` with working fallbacks, verified on-device
- [x] **DISP-04**: All display behavior is unchanged after the restyle — BroadcastChannel/Cast sync, idle screen, leg/set banners, win overlay, pause countdown render and update exactly as before

### PAGE — App pages & overlays

- [ ] **PAGE-01**: Start hub and match setup match the DS screens — centered 520px column, list boxes (radius 16), collapsible "Profile verwalten", terse German labels
- [ ] **PAGE-02**: Match history (list + detail) matches the DS HistoryRow spec
- [ ] **PAGE-03**: Statistics dashboard restyled — DS type/colors; the bespoke SVG charts are recolored to the DS palette (not rebuilt)
- [ ] **PAGE-04**: Daten/Backup page plus global overlays and toasts (PWA update toast, resume prompt, pause overlay, record celebrations) match the DS specs

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### RECV — Receiver polish (carried from v1.1)

- **RECV-06**: Idle-screen match summary (last result shown between games)
- **RECV-07**: Receiver UI theme customization

## Out of Scope

Explicitly excluded for v1.2. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Any functional/behavioral change (engine, stores, sync, routes) | Pure restyling milestone — the DS explicitly restyles existing flows only |
| Light theme | The DS is dark-only by design ("No light theme exists") |
| Logo/brand redesign, in-app logo usage | DS keeps the plain-text "Neverman Darts" title; logo is PWA-icon-only |
| Rebuilding stats charts as DS primitives | DS notes this gap intentionally — bespoke SVG charts stay, only recolored |
| New icon library | DS uses inline stroke SVGs + Unicode glyphs only ("No icon library", "no emoji") |
| Receiver theme customization (RECV-07) | Already deferred to v2 at v1.1 close |

## Traceability

Which phase covers which requirement. Filled during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 8 | Complete |
| FOUND-02 | Phase 8 | Complete |
| FOUND-03 | Phase 8 | Complete |
| FOUND-04 | Phase 8 | Complete |
| COMP-01 | Phase 9 | Complete |
| COMP-02 | Phase 9 | Complete |
| COMP-03 | Phase 9 | Complete |
| COMP-04 | Phase 9 | Complete |
| SCOR-01 | Phase 10 | Complete |
| SCOR-02 | Phase 10 | Complete |
| SCOR-03 | Phase 10 | Complete |
| SCOR-04 | Phase 10 | Complete |
| DISP-01 | Phase 11 | Complete |
| DISP-02 | Phase 11 | Complete |
| DISP-03 | Phase 11 | Pending |
| DISP-04 | Phase 11 | Complete |
| PAGE-01 | Phase 12 | Pending |
| PAGE-02 | Phase 12 | Pending |
| PAGE-03 | Phase 12 | Pending |
| PAGE-04 | Phase 12 | Pending |

**Coverage:**

- v1 requirements: 20 total
- Mapped to phases: 20 (roadmap created)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after roadmap creation (Phases 8–12)*
