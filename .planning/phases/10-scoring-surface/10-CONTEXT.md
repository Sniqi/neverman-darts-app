# Phase 10: Scoring Surface - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — recommendations auto-accepted after user timeout; all follow the DS source of truth (`design/components/scoring/*`), SCOR-01..04, or locked prior decisions.

<domain>
## Phase Boundary

The touch-scoring screen (`/match`) visually matches the DS scoring specs while every existing scoring behavior stays unchanged. Covers SCOR-01 (Numpad), SCOR-02 (Dartboard colors + touch highlight), SCOR-03 (VisitStrip/DartPill notation + colors), SCOR-04 (ScoreCard active/inactive treatment, checkout callout, BUST flash).

**Not in this phase:** display surface (`/display`, PlayerPanel/MatchHeader — Phase 11), page shells/overlays/toasts (Phase 12), generic buttons/toggles (done in Phase 9). The `/match` audio bar was finished in Phase 9 (compact 48px rows, DS switch) — leave it.

</domain>

<decisions>
## Implementation Decisions

### Numpad (SCOR-01)
- Key geometry per DS: 76px keys (`--key-h`), 32px digits (`--text-2xl`), entry display 40px (`--text-3xl`); pressed state steps to `--surface-3`; layout 7-8-9 / 4-5-6 / 1-2-3 / C-0-⌫ per Numpad.jsx.
- "Bestätigen" = full-width amber gradient key per Numpad.jsx (76px key height — NOT the 64px `.btn--accent`).
- ⌫ backspace gets its aria-label now (deferred item from Phase 8 UI review — redeem it).
- Invalid behavior unchanged: shake stays 400ms (locked exception), "Ungültige Punktzahl" message stays; only visuals change.

### Dartboard (SCOR-02)
- ONLY colors move to `--board-*` tokens (`--board-single`, `--board-red`, `--board-green`, `--board-stroke`, `--board-bg`, miss zone `--bg-deep`); polar hit detection, enlarged double/triple rings, and segment geometry stay byte-identical (success criterion 2 + touch constraint).
- Active-touch feedback per DS: tapped region flashes + score label floats (score-float exists, 1.6s locked).
- Number labels/dividers keep `pointer-events: none`.
- Proof: existing dartboard hit-detection tests unchanged and green; E2E match flow green.

### VisitStrip & DartPill (SCOR-03)
- Pills at `--radius-pill` (999); empty slots render "—"; tap-to-undo behavior unchanged.
- **Notation aligned to the DS content spec:** `Bull (50)` (inner), `Bull (25)` (outer), `✕` for miss (replacing `Bull`/`Outer Bull`/`0 (Daneben)`; keep plain number for singles, `T`/`D` prefixes). Apply wherever the scoring surface renders notation; if a shared helper also feeds other surfaces, the DS content spec is global — aligning them is correct. No test asserts the old strings (verified).
- DartPill color semantics per spec: triples & bull glow amber, doubles `--accent-double` (pale amber), misses dashed, busts red + struck.
- Triple flash uses `--triple` (#ff7d75).

### ScoreCard & Verifikation (SCOR-04)
- Active player: 96px/800 Barlow Semi Condensed (`--text-score-active`, `--weight-heavy`) + amber inset edge + `--accent-soft` tint + inner amber glow. Inactive: 44px (`--text-score-inactive`).
- Checkout route inline with amber glow (`--glow-accent`); CheckoutSuggestion component included in the treatment.
- BUST flash in semantic red (`--destructive`); existing keyframes keep token durations.
- Gate: 535 vitest + 9/9 Playwright stay green; scoring behavior EXACTLY unchanged (criterion 4); dev-server visual spot-check supplementary.

### Claude's Discretion
- Exact flash/glow implementation details (box-shadow vs filter) — match DS .jsx values.
- Whether the two duplicated notation helpers (VisitStrip.svelte, match/+page.svelte) get consolidated into one shared helper — allowed if it stays a pure refactor with identical output (prefer smallest safe diff).
- Score-float/flash layering on the board SVG (keep existing approach unless DS .jsx shows a cleaner one).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tokens complete (Phase 8): `--board-*`, `--triple`, `--accent-double`, `--text-score-active/inactive`, `--key-h`, `--glow-accent`, `--radius-pill`, press/motion tokens.
- Shared primitives (Phase 9): `.btn` variants + `.switch` in `src/styles/components.css` (Numpad keys deliberately do NOT reuse `.btn` — own 76px spec).
- DS sources: `design/components/scoring/{Numpad,Dartboard,VisitStrip,ScoreCard,DartPill}.jsx` + `.prompt.md`.
- Current files: `src/ui/input/{Numpad,Dartboard,VisitStrip,ScorePanel,CheckoutSuggestion,StatDrawer}.svelte`, `src/routes/match/+page.svelte`.
- E2E: 9/9 green baseline; `full-match-flow` enters visits via numpad (180 → 321 assertions), `match-audio-toggle` covers the audio bar.

### Established Patterns
- Svelte-scoped styles + global tokens; same-commit delete rule for superseded local CSS; browser tests importing app.css for computed styles; German labels/roles locked.
- Notation helpers duplicated: `VisitStrip.svelte:10-13` and `match/+page.svelte:210-212` (display VisitLine has its own — Phase 11 surface, but the string spec is global).
- design-tokens.test.ts forbidden-hex guard active.

### Integration Points
- `/match` page composes ScorePanel + Dartboard + Numpad + VisitStrip + CheckoutSuggestion + StatDrawer.
- Caller/audio reads visit data separately (announcements unaffected by display-string changes — verify no caller string coupling to the notation helpers during research).

</code_context>

<specifics>
## Specific Ideas

- Numpad.prompt.md: invalid totals shake + "Ungültige Punktzahl"; validate excludes impossible totals (existing logic — untouched).
- Dartboard.prompt.md: rings ~2× real proportions (KEEP); taps flash region + float score label; Bull 50 = {segment:25, multiplier:2}.
- ScoreCard.prompt.md: `<ScoreCard name active checkout="T20 20 D20">` — checkout inline in the card.
- DartPill.prompt.md: bust variant red + struck-through.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Numpad ⌫ aria-label deferred FROM Phase 8 is redeemed HERE.)

</deferred>
