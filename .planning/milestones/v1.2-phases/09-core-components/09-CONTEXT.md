# Phase 9: Core Components - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — all 4 grey areas accepted by user ("Accept all", 2026-07-14).

<domain>
## Phase Boundary

Every shared UI primitive matches its DS component spec wherever it appears across the app. Covers COMP-01 (Button variants incl. press states, ≥48px), COMP-02 (Chips/SegmentedControl/Stepper/ToggleRow at DS sizes with spring switch thumbs), COMP-03 (ConfirmDialog spec: radius 20, blurred scrim, scale-in, 420px, stacked buttons), COMP-04 (StatCard 40px values + caption).

**Not in this phase:** Numpad keys, dartboard, visit strip, ScoreCard (Phase 10 — SCOR); display-surface panels/header (Phase 11 — DISP); page-level layouts, PauseOverlay/RecordOverlay/toasts (Phase 12 — PAGE). **Exception per COMP-02:** the audio/SFX toggle rows on `/match` ARE in scope now (explicitly named in success criterion 2).

</domain>

<decisions>
## Implementation Decisions

### Komponenten-Architektur
- **Buttons via shared CSS classes, not new Svelte components:** new `src/styles/components.css` (imported from `app.css`) defines a `.btn` base + variant classes matching the DS Button variants (`menu`, `accent`, `cta`, `destructive`, `cancel`, plus ghost/secondary as defined in `design/components/core/Button.jsx`). Usage sites swap/add classes — minimal markup churn, no new component API.
- **Existing Svelte components restyled in place, API unchanged:** `ConfirmDialog.svelte` and `StatCard.svelte` keep their current props (they already match the DS spec shape); only styles change.
- **Chips/Segmented/Stepper/Toggle restyled in place** in their usage sites (MatchSetup, PlayerPicker, …); shared classes only where a pattern appears in ≥2 files.
- **DS `.jsx` files are value references, not code to port:** transcribe exact values (sizes, radii, gradients, easings) from `design/components/core/*.jsx` + `.prompt.md` into Svelte-scoped CSS / components.css.

### Button-Rollen-Mapping (app-weit)
- Hub menu rows → `menu` (64px surface row + chevron-right inline SVG); "Neues Spiel" → `accent` (64px amber top-lit gradient, near-black text `--on-accent`).
- "Spiel starten" (setup) → `cta` (radius 12, 22px/700 per DS). Dialog confirm buttons → `destructive` or accent-CTA per action semantics.
- Delete/discard actions ("Verwerfen…", "Löschen") → `destructive`; every "Abbrechen" → `cancel` (bordered surface). Back/inline/icon-ish buttons → ghost variant per Button.jsx.
- **Phase boundary honored:** Numpad confirm/keys stay Phase 10. Audio/SFX ToggleRows on `/match` are Phase 9 (COMP-02).
- Press state everywhere: `transform: scale(var(--press-scale))` + slight brightness on filled; keys/rows step to `--surface-3`. Disabled = opacity .4 (DS Button) / .3 (Stepper bounds). All targets ≥48px (`--hit-min`), rows/CTAs 64px (`--row-h`), chips/segments 56px (`--control-h`).

### Dialoge & Motion (COMP-03)
- ConfirmDialog: radius 20 (`--radius-lg`), scrim `var(--backdrop)` + `backdrop-filter: blur(var(--blur-backdrop))` (Chrome 76+ — receiver-safe, though dialogs never render on /display), scale-in from .94 with `--ease-spring` over `--dur-med`, max-width 420px, stacked full-width buttons, explicit destructive CTA + "Abbrechen".
- **All confirmation-shaped dialogs get the treatment:** ConfirmDialog, DartsAtDoubleDialog, ResumePrompt. PauseOverlay/RecordOverlay/MatchWinOverlay/toasts are Phase 12 (PAGE-04).
- Switch thumbs (ToggleRow 56×34): amber track + glow when on, thumb eased with `--ease-spring`; collapses under global reduced-motion.
- **German labels and ARIA roles stay EXACTLY stable** — E2E selectors (`getByRole('button', {name: …})`) and the DS content fundamentals lock them.

### Scope & Verifikation
- File scope: setup cluster (MatchSetup, PlayerPicker, ProfileManager, BullOffOrder), hub `routes/+page.svelte`, `routes/data/+page.svelte` + history pages (generic buttons), dialogs (ConfirmDialog, DartsAtDoubleDialog, ResumePrompt), StatCard, `/match` audio toggle rows.
- Gate: all 523 unit/browser tests AND the now-green full Playwright E2E suite (8/8, repaired 2026-07-14 commit 2956c1e) stay green after every plan.
- E2E protection: accessible names/roles unchanged; run the full suite per plan wave.
- New tests at Claude's discretion: small browser-mode assertions only for genuinely new shared contracts (e.g. `.btn` variant computed styles, chip 56px height, toggle track color), no mandatory new test file.

### Research Open Questions — Resolved (post-research, 2026-07-14)
- **Q1 Non-DS-covered buttons** (icon-only back 44×44, outline delete, flat action rows, unstyled picker items): add extension classes `.btn--ghost` (borderless, for icon-only/inline; ≥48×48 target — bump back-btns from 44) and `.btn--surface` (flat surface row); outline destructive → destructive-outline flavor using `--destructive`/`--destructive-line`/`--destructive-soft` tokens. German labels + roles unchanged.
- **Q2 /match audio-bar sizing:** the DS match screen contains NO audio bar (verified: zero audio/caller/volume references in design/*/screens.jsx; ToggleRow only in Setup) — the DS is silent on this app-specific strip. Resolution: adopt the DS **switch** itself (56×34, amber track + glow when on, spring thumb — the COMP-02 visible contract) inside the compact bar; raise interactive targets to ≥48px (`--hit-min`); do NOT force 64px list rows onto the scoring toolbar. Full 64px ToggleRows apply in Setup where the DS shows them. Phase 10 (scoring-surface layout) may reposition the bar.
- **Q3 ConfirmDialog buttons:** consume the shared `.btn--*` classes (destructive/cancel/cta) directly — dialogs are a ≥2-usage-site pattern; no duplicated local button CSS.
- **Sweep rule (Pitfall 3):** deleting superseded local button CSS happens in the SAME commit as the class swap — Svelte scoped styles otherwise silently override shared classes.

### Claude's Discretion
- Exact class naming inside components.css (BEM-ish `.btn--accent` vs `.btn-accent`) — follow any existing codebase idiom.
- Whether ghost/secondary variants get distinct classes or share `cancel` styling, per what Button.jsx actually defines.
- Chevron/inline-SVG markup details for menu rows (20–22px stroke SVG per DS iconography).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 8 token layer complete: `src/styles/{colors,typography,spacing,elevation,fonts}.css` + `src/app.css` aggregator — all DS tokens available (incl. `--control-h` 56, `--row-h` 64, `--hit-min` 48, `--press-scale`, `--ease-spring`, `--backdrop`, `--blur-backdrop`, `--radius-lg` 20).
- DS references: `design/components/core/{Button,Chip,SegmentedControl,Stepper,ToggleRow,StatCard,ConfirmDialog}.jsx` + `.prompt.md` (authoritative values); `design/readme.md` (states/motion prose).
- Hub already uses `.menu-btn` / `.menu-btn--accent` classes — semantic mapping to `menu`/`accent` variants is direct.
- `ConfirmDialog.svelte` already has backdrop + `backdropIn` keyframe using tokens (`--backdrop`, `--dur-med`, `--ease`); needs radius/blur/scale-in/stacked-buttons/420px alignment.
- Full E2E suite green (8/8) since 2026-07-14 — strongest regression net for markup-touching changes.

### Established Patterns
- Svelte-scoped styles per component; global tokens via app.css `:root`; component-local keyframes consuming global duration/ease tokens (Phase 8 decision).
- No provisional colors anywhere; `src/lib/design-tokens.test.ts` guards the forbidden list — new CSS must use tokens (or DS-conformant literals not on the forbidden list, e.g. gradients from `--accent-bright/--accent/--accent-deep`).
- Chrome-90 rule: modern CSS behind `@supports` at usage sites; no duplicate-property fallbacks. (backdrop-filter is fine: Chrome 76+.)

### Integration Points
- `src/app.css` — add `@import './styles/components.css';`
- MatchSetup.svelte hosts chips (301/401/501), segmented (Single/Double Out), steppers (Legs/Sets/Pause), toggles (Sets/Caller/SFX/Musik) — the COMP-02 epicenter.
- `src/routes/match/+page.svelte` audio bar rows → ToggleRow treatment (COMP-02).

</code_context>

<specifics>
## Specific Ideas

- DS Button variants (from Button.prompt.md): menu = 64px surface row + chevron; accent = 64px amber gradient; cta = start button radius 12, 22px/700; destructive = red; cancel = bordered surface. Press = scale .97 + brightness; disabled = opacity .4.
- Chip: active = amber gradient + 700 weight; inactive = surface + 16% hairline (`--border-input`); 56px min height, radius 12; 8px flex gap.
- Stepper: −/+ 48px targets, disabled at bounds via opacity .3.
- ToggleRow: custom 56×34 switch, amber track + glow when on, spring thumb.
- StatCard: value 40px/700 Barlow Semi Condensed above 17px muted label.

</specifics>

<deferred>
## Deferred Ideas

- Numpad backspace aria-label (from Phase 8 UI review) — Phase 10 (Numpad spec work).
- None else — discussion stayed within phase scope.

</deferred>
