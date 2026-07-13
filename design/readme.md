# Neverman Darts — Design System

Design system for **Neverman Darts**, a touch-optimized darts scoring PWA for home play with steel darts. Players enter thrown darts on an on-screen SVG dartboard or numpad; a separate **spectator display** shows live game state readable from across the room (27" at 3 m). Runs offline on Android tablets and Windows PCs from GitHub Pages; can cast to Chromecast. **The entire UI is in German.**

> 2026 refresh: this system modernized the provisional app design — real typefaces (Barlow), layered dark surfaces, softer radii, real elevation, and much larger type on both surfaces. The app codebase still shows the old provisional styling; **this system is the target state.**

## Sources

- Codebase: `neverman-darts-app/` (locally mounted; SvelteKit 2 / Svelte 5, Dexie, vite-plugin-pwa)
- GitHub: https://github.com/Sniqi/neverman-darts-app — explore it for real flows/logic; visual truth is HERE, not in the app.

## Products / surfaces

One product, two very different surfaces:

1. **Scoring app** (primary target: 10" iPad, touch-first): start hub → match setup → match screen (dartboard + numpad + visit strip + score panel) → history → stats → data/backup. Centered column `max-width: 520px` for hub/setup.
2. **Spectator display** (27" monitor/Chromecast at ~3 m): match header bar + one giant `PlayerPanel` column per player. Typography scales with column width via container queries — see the **display scale** below. Nothing on this surface renders below ~34px.

## CONTENT FUNDAMENTALS

- **Language: German, informal "du".** "Wenn du ein neues Spiel startest, geht der aktuelle Spielstand verloren."
- **Sentence case**, terse noun labels for navigation/buttons: "Neues Spiel", "Spieler verwalten", "Match-Verlauf", "Statistik", "Daten / Backup", "Spiel starten", "Bestätigen", "Abbrechen".
- **Darts jargon stays English/hybrid**: "Legs - First to", "Double Out", "Bull", "BUST", "Caller", "Sets", "Ø Leg / Ø Match" (average uses the Ø glyph).
- Errors are short and factual: "Ungültige Punktzahl", "Mindestens 1 Spieler erforderlich".
- Dialog pattern: heading = plain statement ("Es läuft noch ein Spiel"), body = one consequence sentence, destructive CTA is explicit ("Verwerfen und neu starten"), cancel is always "Abbrechen".
- Helper copy (info hints) is 1–2 plain sentences explaining a rule. No marketing tone, no exclamation marks, **no emoji**.
- Dart notation: `T20`, `D16`, plain number for singles, `Bull (50)`, `Bull (25)`, `✕`/`0 (Daneben)` for miss.

## VISUAL FOUNDATIONS

- **Dark mode only**, blue-tinted charcoal ramp. Page bg `#0c0e14`, cards/controls `#161a23`, nested/raised `#1d2330`, pressed `#29303f`, deepest `#07080c`. Elevation = one lightness step up on the same hue, always with a hairline border. No light theme exists.
- **One accent: amber `#f0a424`** (`--accent-bright #ffc44d` for hover/glows, `--accent-deep #c07d0a` as gradient tail). Accent fills are subtle top-lit vertical gradients (`bright → accent → deep`) with an inner top sheen, near-black text `#191104`. Soft tint and 45% line derive via `color-mix`. Used for CTAs, active states, active-player edges, checkout routes, winner names, the Leg counter.
- **Semantic**: destructive/bust `#e5484d`, positive (leg/checkout won) `#3dd68c`, triple flash `#ff7d75`. Soft tints via `color-mix`.
- **Type: Barlow** (400/500/600/700) for UI; **Barlow Semi Condensed** (600/700/800) for all score numerals and the spectator display — self-hosted in `assets/fonts/` (OFL), `system-ui` fallback.
  - App scale (10" iPad): body 17px/1.5; section headings 22px/600; page titles 26px/600; numpad digits 32px; stat values 40px; scores 44px inactive → **96px/800** active. `font-variant-numeric: tabular-nums` on all score surfaces.
  - Display scale (27" @ 3 m), cqw-clamped per player column: `--display-caption` clamp(1.75rem, 4cqw, 5rem) · `--display-body` clamp(2rem, 5cqw, 6.5rem) · `--display-emph` clamp(2.5rem, 6.5cqw, 8rem) · `--display-name` clamp(3rem, 10cqw, 12rem) · `--display-score` **clamp(6rem, 27cqw, 26rem)** — on a 960px column that's 38/48/62/96/259px. Negative letter-spacing (−0.02em) only on giant numerals.
- **Spacing**: strict 4px multiples (4/8/16/24/32/48/64). Touch targets ≥48px; chips/segments 56px; rows/CTAs 64px; numpad keys 76px.
- **Radii**: soft and layered — 8 (tags, inner segments), 12 (buttons/keys/chips/inputs), 16 (cards, list boxes), 20 (dialogs), 999 pills (dart pills, switches).
- **Borders + shadows together**: 1px alpha hairlines (`--line` 7%, `--line-strong` 14%, inputs 16%) on every surface; layered shadows (`--shadow-raise` on accent CTAs, `--shadow-panel` on dialogs/spectator header) plus `--edge-highlight` top sheen on raised surfaces. Amber `--glow-accent` on checkout callouts and active elements.
- **Backgrounds**: flat token fills in the app; the spectator display uses subtle dark linear gradients (`165deg, #1a1e29 → #12151d`, active `#272d3c → #191d28`) and an amber "bloom" under the header rule. No imagery, no textures, no illustrations.
- **Active-player treatment**: amber top/left edge (4–5px inset) + accent-soft tint + inner amber glow; inactive spectator panels sit at `opacity: .55`.
- **Motion**: fast, functional. 100–300ms, standard ease `cubic-bezier(.2,0,0,1)`, spring `cubic-bezier(.3,1.4,.4,1)` for switch thumbs/dialog pop; dialogs scale from .94 over a blurred scrim; invalid input shakes ±6px/400ms; score floats rise & fade 1.6s; live row pulses its amber inset edge. `prefers-reduced-motion` collapses all of it. No decorative loops.
- **Press states**: `scale(.97)` + slight brightness on filled buttons; keys/rows step up to `--surface-3`. Hover exists only as subtle brightness (touch-first).
- **Overlays**: scrim `rgba(5,7,12,.65)` + `backdrop-filter: blur(12px)`, dialog max-width 420px, stacked full-width buttons.
- **Focus**: 3px amber `--focus-ring` via `:focus-visible` (keyboard/remote input on the display PC).

## ICONOGRAPHY

- **No icon library.** Icons are tiny inline stroke SVGs written in place: 20–22px, `viewBox="0 0 24 24"`, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`. Used glyphs: chevron-right, chevron-left (back), info circle.
- **Unicode as icons**: ▼ (collapsible), ⌫ (backspace), × (remove), ✓ (added), ● (header separator), — (empty slot), Ø (average), ✕ (miss), − / + (steppers).
- **No emoji anywhere.**
- Brand mark: `assets/logo.svg` — amber dartboard rings + bull + "N" monogram (also `assets/pwa-192x192.png`, `assets/maskable-icon-512x512.png`). Used only as the PWA icon; in-app branding is the plain-text title "Neverman Darts" at 26px/600.

## Index

- `styles.css` → imports `tokens/{fonts,colors,typography,spacing,elevation}.css`
- `assets/` — logo.svg, PWA icons, `fonts/` (Barlow + Barlow Semi Condensed TTFs, OFL)
- `guidelines/` — foundation specimen cards (Design System tab)
- `components/core/` — Button, Chip, SegmentedControl, Stepper, ToggleRow, StatCard, ConfirmDialog
- `components/scoring/` — Numpad, Dartboard, VisitStrip, ScoreCard, DartPill
- `components/display/` — MatchHeader, PlayerPanel
- `components/history/` — HistoryRow
- `ui_kits/darts-app/` — interactive click-through of start → setup → match → spectator display (834×1112 iPad viewport)
- `templates/darts-app/` — the same click-through as a starting-point template for consuming projects (`DartsApp.dc.html`)
- `SKILL.md` — agent skill entry point

### Intentional additions
- `DartPill` — extracted from PlayerPanel's inline pill markup so consumers can render dart notation standalone.
- Webfonts (Barlow) — deliberate upgrade over the provisional system-ui stack; the PWA must self-host them (`assets/fonts/`) to stay offline-capable.

### Notes / gaps
- No logo variants beyond the PWA mark; in-app the brand is plain text.
- Stats charts (AverageTrendChart etc.) are bespoke SVG; not recreated as primitives.
