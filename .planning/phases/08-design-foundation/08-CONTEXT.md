# Phase 8: Design Foundation - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — recommendations auto-accepted after user timeout; all answers follow the DS source of truth (`design/`), FOUND-01..04, or logged v1.1 decisions. Revisit via this file if needed.

<domain>
## Phase Boundary

The app's foundational visual language — color, typography, spacing/radii/elevation, and motion — matches the design system everywhere, replacing all provisional v1.0 styling. Covers FOUND-01 (DS color world on every screen), FOUND-02 (Barlow/Barlow Semi Condensed self-hosted + offline), FOUND-03 (4px spacing, DS radii, hairline+shadow elevation), FOUND-04 (100–300ms motion, reduced-motion collapse).

**Not in this phase:** exact per-component DS specs (gradient CTAs, 56px chips, dialog layout → Phase 9), scoring-surface specifics (Numpad key sizes, board colors → Phase 10), display cqw layout + Chrome-90 fallbacks at usage sites (→ Phase 11), page-level layouts (→ Phase 12). Phase 8 delivers the token layer, fonts, base styles, motion primitives, and the app-wide sweep that eliminates provisional colors/values.

</domain>

<decisions>
## Implementation Decisions

### Token-Adoption & Struktur
- DS token files are **copied into `src/styles/`** (5 files mirroring `design/tokens/`: fonts, colors, typography, spacing, elevation), imported from `app.css`. `design/` stays an untouched, re-syncable reference — the app build must not depend on it (font paths there don't resolve from src anyway).
- **Full migration to DS token names.** No alias layer. Name collisions with changed values (`--radius-sm` 8→12px, `--radius-md` 12→16, `--radius-lg` 16→20, `--surface-2` #262932→#1d2330, `--accent-soft`, `--accent-line`, `--shadow-*`) are intentional DS shifts — every existing `var()` usage gets sanity-checked during the sweep (e.g. an element that must stay 8px now uses `--radius-xs`).
- **All 349 hardcoded hex + 89 rgba() occurrences are replaced with DS tokens in this phase** (FOUND-01 demands zero provisional colors). Where a later component spec defines an exact treatment (gradients, sheens), use the nearest token now; the exact treatment lands in Phases 9–12.
- **Verification is grep-based + tests:** old provisional values (`#e8a020`, `#111318`, `#1e2027`, `#f0f0f0`, `#c0392b`, `#262932`, `#888`, `#444`, `#333`, `#2d2d2d` …) must have 0 matches in `src/`; all ~511 tests stay green; visual spot-check via dev server.

### Fonts & Offline (FOUND-02)
- **Convert TTF → WOFF2** (`pip install fonttools brotli`, then convert the 7 files; ~540 KB → ~250 KB precache). Ship `OFL.txt` alongside. If conversion tooling fails in practice, shipping the TTFs unchanged is the accepted fallback (decision: prefer WOFF2, TTF acceptable).
- **Fonts live under `src/styles/fonts/`**, referenced with relative `url()` from the fonts CSS → Vite hashes them into `_app/immutable/assets/` (subpath-safe under `/neverman-darts-app`). Add `woff2` (and `ttf` if shipped) to the PWA `globPatterns` in `vite.config.ts` so fonts precache for full offline.
- **`font-display: swap`** (DS default — text renders immediately in system-ui, swaps to Barlow).
- **All 7 weights ship:** Barlow 400/500/600/700 + Barlow Semi Condensed 600/700/800 (exactly the files in `design/assets/fonts/`).

### Chrome-90-sichere Tokens (Cast-Receiver)
- **`color-mix(in oklab, …)` is precomputed to static rgba values** for all 7 derived tokens (`--accent-soft`, `--accent-line`, `--focus-ring`, `--destructive-soft`, `--destructive-line`, `--positive-soft`, `--glow-accent`). No runtime color-mix anywhere — deterministic, Chrome-90-safe, minifier-safe (per v1.1 decision: no duplicate-property fallbacks). Compute the statics from the DS base colors so they match the DS intent (13%/45%/65%/14%/40%/13%/18% alpha mixes ≈ base color at that alpha).
- **cqw display tokens (`--display-*`) are defined 1:1 now** (inert until used); `@supports` fallback strategy at usage sites is Phase 11 work.
- **Global reduced-motion collapse adopted verbatim** from DS elevation.css (`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important } }`).
- **DS base styles adopted completely** from typography.css: body (bg/color/font/size/line-height/antialiased), link colors, `::selection`, `:focus-visible` (3px amber ring).

### Motion & Phasen-Abgrenzung (FOUND-04)
- **All 21 existing keyframes/transitions are retimed to token durations/easings** in this phase (100–300ms, `--dur-*`, `--ease`, `--ease-spring`) — success criterion 4 names button press, dialog open, shake, score float explicitly.
- **Press states:** define `--press-scale: 0.97` / `--press-opacity` tokens and apply the press scale where components already have `:active` styles. The full DS Button treatment (gradient, inner sheen, on-accent text) is Phase 9 — do not build it now.
- **Keyframes stay component-local** (Svelte scoped CSS) consuming global duration/ease tokens — Svelte idiom, no global keyframe utilities.
- **Base typography applies now:** Barlow globally via body; `--font-score` + `font-variant-numeric: tabular-nums` applied to existing score displays (ScorePanel, PlayerPanel, Numpad digits/entry, StatCards, display surfaces) so FOUND-02's "all score numerals" holds at phase end.

### Claude's Discretion
- Exact static rgba values for the precomputed color-mix tokens (match DS alpha intent).
- Whether to preload the most critical font files (e.g. Barlow-Regular, BSC-Bold) via `<link rel="preload">` — optional, decide during implementation.
- Per-usage judgment calls in the sweep when a provisional value has no obvious DS token (map to nearest DS token by role: text/muted/surface-step/line).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app.css` — current 42-line provisional token set (will be replaced/expanded by DS tokens; spacing scale names already match DS).
- `design/tokens/*.css` — the 5 DS token files to copy (colors 54 ln, elevation 38 ln, fonts 50 ln, spacing 16 ln, typography 59 ln).
- `design/assets/fonts/*.ttf` — 7 font files (~76–80 KB each) + `OFL.txt`.
- Components live in `src/ui/**` (input/, display/, setup/, stats/, history/, overlays/, dialogs/, cast/, pwa/, start/) + 10 route pages in `src/routes/**`.

### Established Patterns
- Svelte scoped `<style>` blocks per component; global tokens via `:root` in `app.css` imported by `+layout.svelte`.
- Spacing tokens (`--space-*`) already used 205×; color tokens partially used (`--accent` 40×, `--text` 31×) but 349 hex + 89 rgba() are hardcoded.
- 21 existing `@keyframes` across components (shake, score-float, dialogIn, liveRowPulse, toastEnter, banners…).
- PWA precache via `vite.config.ts` `globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}']` — no font extensions yet.
- Chrome 90 receiver: modern CSS behind `@supports`, never duplicate-property fallbacks (v1.1 decision).
- Tests: ~511 (unit + browser + E2E) must stay green; pure-visual changes shouldn't touch them, but browser tests may assert computed styles — check when sweeping.

### Integration Points
- `src/routes/+layout.svelte` imports `../app.css` (global entry).
- `vite.config.ts` — PWA globPatterns for font precache.
- Hex hotspots: match/+page.svelte (22), Dartboard.svelte (20), PlayerPanel.svelte (20), data/+page.svelte (16), MatchSetup/StatDrawer/Numpad/SpectatorChooser/stats/history-detail (14 each).

</code_context>

<specifics>
## Specific Ideas

- The DS readme (`design/readme.md`) is the authoritative prose spec; `design/tokens/*.css` are the authoritative values. On conflict, tokens win for values, readme for intent.
- Old→new palette mapping (for the sweep): `#111318`→`--bg #0c0e14`, `#1e2027`→`--surface #161a23`, `#262932`/`#2d2d2d`→`--surface-2/-3`, `#e8a020`/`#f0ab2c`→`--accent #f0a424`, `#f0f0f0`→`--text #eef1f6`, `#888`→`--text-muted`, `#c0392b`→`--destructive #e5484d`, board greens/reds (`#1a5c2e`, `#8b1a1a`)→`--board-green/--board-red` (exact board treatment refined in Phase 10).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Component-exact treatments intentionally deferred to Phases 9–12 per phase boundary.)

</deferred>
