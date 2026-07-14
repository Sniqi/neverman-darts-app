# Phase 10: Scoring Surface - Research

**Researched:** 2026-07-14
**Domain:** Svelte 5 component restyling (CSS custom-property token migration) — no new libraries, no behavior changes
**Confidence:** HIGH (all claims verified by reading the actual source files and tests in this repo; no external/library research was needed since this phase touches zero new dependencies)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Numpad (SCOR-01)**
- Key geometry per DS: 76px keys (`--key-h`), 32px digits (`--text-2xl`), entry display 40px (`--text-3xl`); pressed state steps to `--surface-3`; layout 7-8-9 / 4-5-6 / 1-2-3 / C-0-⌫ per Numpad.jsx.
- "Bestätigen" = full-width amber gradient key per Numpad.jsx (76px key height — NOT the 64px `.btn--accent`).
- ⌫ backspace gets its aria-label now (deferred item from Phase 8 UI review — redeem it).
- Invalid behavior unchanged: shake stays 400ms (locked exception), "Ungültige Punktzahl" message stays; only visuals change.

**Dartboard (SCOR-02)**
- ONLY colors move to `--board-*` tokens (`--board-single`, `--board-red`, `--board-green`, `--board-stroke`, `--board-bg`, miss zone `--bg-deep`); polar hit detection, enlarged double/triple rings, and segment geometry stay byte-identical (success criterion 2 + touch constraint).
- Active-touch feedback per DS: tapped region flashes + score label floats (score-float exists, 1.6s locked).
- Number labels/dividers keep `pointer-events: none`.
- Proof: existing dartboard hit-detection tests unchanged and green; E2E match flow green.

**VisitStrip & DartPill (SCOR-03)**
- Pills at `--radius-pill` (999); empty slots render "—"; tap-to-undo behavior unchanged.
- Notation aligned to the DS content spec: `Bull (50)` (inner), `Bull (25)` (outer), `✕` for miss (replacing `Bull`/`Outer Bull`/`0 (Daneben)`; keep plain number for singles, `T`/`D` prefixes). Apply wherever the scoring surface renders notation; if a shared helper also feeds other surfaces, the DS content spec is global — aligning them is correct. **[CONTEXT.md claimed "no test asserts the old strings" — this is FALSE, see Common Pitfalls #1 below.]**
- DartPill color semantics per spec: triples & bull glow amber, doubles `--accent-double` (pale amber), misses dashed, busts red + struck.
- Triple flash uses `--triple` (#ff7d75).

**ScoreCard & Verifikation (SCOR-04)**
- Active player: 96px/800 Barlow Semi Condensed (`--text-score-active`, `--weight-heavy`) + amber inset edge + `--accent-soft` tint + inner amber glow. Inactive: 44px (`--text-score-inactive`).
- Checkout route inline with amber glow (`--glow-accent`); CheckoutSuggestion component included in the treatment.
- BUST flash in semantic red (`--destructive`); existing keyframes keep token durations. **[No such keyframe currently exists on the scoring surface — see Common Pitfalls #3.]**
- Gate: 535 vitest + 9/9 Playwright stay green; scoring behavior EXACTLY unchanged (criterion 4); dev-server visual spot-check supplementary.

### Claude's Discretion
- Exact flash/glow implementation details (box-shadow vs filter) — match DS .jsx values.
- Whether the two duplicated notation helpers (VisitStrip.svelte, match/+page.svelte) get consolidated into one shared helper — allowed if it stays a pure refactor with identical output (prefer smallest safe diff).
- Score-float/flash layering on the board SVG (keep existing approach unless DS .jsx shows a cleaner one).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (Numpad ⌫ aria-label deferred FROM Phase 8 is redeemed HERE.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCOR-01 | Numpad matches the DS Numpad spec — 76px keys, 32px digits, surface-step press states, ⌫ backspace | Exact current vs. target values documented below (`src/ui/input/Numpad.svelte`); aria-label gap confirmed; no existing test file to preserve — new computed-style tests recommended following `StatCard.test.ts` pattern |
| SCOR-02 | Dartboard uses the DS board colors and active-touch highlight while polar hit detection, enlarged rings and segment geometry stay unchanged | `Dartboard.svelte` already uses `--board-*` tokens and DS-aligned float-label notation/colors; remaining gaps identified (flash opacity literals, stroke color, font-size); `Dartboard.test.ts` (3 tests) confirmed to assert only dispatch behavior, not colors — safe to leave untouched |
| SCOR-03 | Visit strip and dart pills match the DS specs — pill radius 999, dart notation (`T20`, `D16`, `Bull (50)`, `✕`), triple flash color | **Critical finding:** the DS-spec'd "VisitStrip" is orphaned/dead code — the live `/match` dart-slot strip is inline markup in `match/+page.svelte`. Styling must target that markup to be visible. Notation duplication and the untouched Phase-11 copy are mapped exactly (file:line below) |
| SCOR-04 | Score panel matches the DS ScoreCard spec — active player at 96px/800 with amber edge treatment, inactive at 44px, checkout route callout with amber glow, BUST flash in semantic red | Exact current vs. target values documented for `ScorePanel.svelte`/`CheckoutSuggestion.svelte`; confirmed no bust-flash keyframe exists yet on this surface (locked decision's "existing keyframes" premise needs planner correction); landscape multi-player layout risk flagged |
</phase_requirements>

## Summary

This phase is a pure CSS/markup restyling pass with **zero new dependencies** — no packages to install, no registry checks needed. All four target components already exist and are already wired into `/match`; the work is exclusively changing literal CSS values (font-size, height, color, border, box-shadow) to consume already-shipped DS tokens (Phase 8) and, for SCOR-03, changing three notation strings.

The single most important research finding, not reflected in CONTEXT.md/UI-SPEC.md, is that **`src/ui/input/VisitStrip.svelte` is dead code** — it is not imported by any route or component in the app. The live `/match` dart-slot strip that users actually see is hand-rolled inline markup in `src/routes/match/+page.svelte` (`.dart-column`/`.dart-pill`, lines 345–358 template / 440–480 styles), with its own separate `formatDart()` (lines 208–214). The planner must target **that** file for SCOR-03's visible behavior, not (only) the orphaned component. A second, independent finding: CONTEXT.md's claim "no test asserts the old strings" is incorrect — `src/ui/display/VisitLine.test.ts` (Phase 11 scope) asserts exactly the old strings ('Bull', 'Outer Bull', '0 (Daneben)') via a formatDart copy explicitly marked "copied verbatim from VisitStrip.svelte" — this file/test must NOT be touched in Phase 10.

Also notable: `Dartboard.svelte` already implements the DS-aligned notation strings and already consumes `--board-*`/`--triple`/`--accent` tokens for its floating score labels — SCOR-02's color work is largely done; only a few literal-value gaps remain (flash overlay opacity, stroke color, float font-size).

**Primary recommendation:** Treat this phase as "diff each component's literal CSS values against the UI-SPEC table," but redirect all SCOR-03 visible-behavior work to `match/+page.svelte`'s inline markup (not the orphaned `VisitStrip.svelte`), and explicitly exclude `VisitLine.svelte`/`VisitLine.test.ts` from any notation-helper consolidation.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Numpad key rendering + press state | Browser / Client | — | Bespoke Svelte component, client-only PWA, no SSR |
| Dartboard SVG hit detection + color | Browser / Client | — | Polar-math + SVG rendering, pure client component |
| Dart notation formatting (`formatDart`) | Browser / Client | — | Pure presentation helper, duplicated per-surface, no shared module |
| Score panel display (ScorePanel/CheckoutSuggestion) | Browser / Client | — | Reads `matchStore` (Svelte runes store), renders synchronously |
| Match state (remaining, bust, checkout) | Browser / Client (store) | — | `matchStore`/`reducer.ts` — out of scope, untouched by this phase |
| Audio caller announcements | Browser / Client | — | Confirmed independent of notation helpers (see Common Pitfalls #2) |

(This is a static, client-only PWA with no backend/API/CDN tiers — every capability in this phase lives in the browser tier.)

## Standard Stack

No new libraries. This phase uses only what Phase 8/9 already shipped:

| Asset | Source | Purpose |
|-------|--------|---------|
| CSS custom-property tokens | `src/styles/{colors,typography,spacing,elevation}.css` | All target values already defined (`--board-*`, `--triple`, `--accent-double`, `--text-score-active/inactive`, `--key-h`, `--glow-accent`, `--radius-pill`, `--press-scale`, `--ease`, `--dur-*`) — verified present, see Code Examples |
| Svelte 5 runes (`$state`) | `svelte@^5.56.3` (already installed) | Flash/pressed-state/shake local component state — pattern already used identically in all 4 target components |
| `vitest-browser-svelte` | `^2.1.1` (already installed) | Computed-style component tests — established pattern (see Architecture Patterns) |

**Installation:** None required — no `npm install` needed for this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages — it is a pure CSS-value and markup-string change to four already-existing, already-imported Svelte components. No `package.json` changes are expected.

## Architecture Patterns

### System Architecture Diagram

```
User touch/pointer input
        │
        ▼
┌─────────────────────────────┐        ┌──────────────────────────┐
│ /match (routes/match/+page) │◀──────▶│  matchStore (runes store) │
│  - ScorePanel (SCOR-04)     │        │  - dispatch(DART_THROWN)  │
│  - CheckoutSuggestion       │        │  - dispatch(UNDO)         │
│  - StatDrawer               │        │  - dispatch(NUMPAD_VISIT) │
│  - inline dart-slot strip   │        └──────────────────────────┘
│    (LIVE "VisitStrip", not          Same store also drives:
│     VisitStrip.svelte!)             - audio-caller announcements
│  - Dartboard (SCOR-02)  OR           (numeric only, no notation
│  - Numpad (SCOR-01)                  string coupling — verified)
└─────────────────────────────┘
        │ pointerdown → screenToBoard() → classifyHit()
        ▼
   DartScore {segment, multiplier} ──▶ formatDart() (LOCAL, per-file,
                                        duplicated 2x live + 1x dead +
                                        1x Phase-11 copy) ──▶ rendered text
```

Trace for SCOR-03: a tap on the dartboard or a numpad confirm dispatches `DART_THROWN`/`NUMPAD_VISIT` to `matchStore`; `matchStore.currentVisit` updates; `match/+page.svelte`'s own template (NOT `VisitStrip.svelte`) reads `matchStore.currentVisit`/`activePl.visits.at(-1)`, formats each dart via its **local** `formatDart()` (lines 208–214), and renders the `.dart-pill` buttons the user actually sees.

### Recommended Project Structure

No new files/folders needed. Existing structure:
```
src/ui/input/
├── Numpad.svelte          # SCOR-01 — edit CSS values only, add aria-label
├── Dartboard.svelte       # SCOR-02 — edit flash-color/stroke/font-size literals only
├── VisitStrip.svelte      # SCOR-03 — orphaned; update for consistency but NOT sufficient alone
├── ScorePanel.svelte      # SCOR-04 — edit CSS values, add bust-handling (new, see Pitfall 3)
└── CheckoutSuggestion.svelte  # SCOR-04 — edit CSS values (pill treatment is new, currently plain text)
src/routes/match/+page.svelte  # SCOR-03 — the file that actually needs the notation string + pill CSS changes
src/ui/display/VisitLine.svelte  # Phase 11 — DO NOT TOUCH (has its own formatDart copy, its own test)
```

### Pattern 1: Computed-style component test (Phase 9 established pattern)
**What:** Vitest browser-mode test that renders a component in isolation and asserts `getComputedStyle()` values, importing `app.css` directly since no root layout renders in isolation.
**When to use:** For every new/changed CSS contract in Numpad/ScoreCard/DartPill — this phase currently has ZERO test coverage for the visual values being changed (see Validation Architecture Wave 0 gaps).
**Example:**
```typescript
// Source: src/ui/stats/StatCard.test.ts (Phase 9, COMP-04) — established pattern to replicate
import '../../app.css';
import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';

test('.key computed height is 76px', async () => {
	const screen = render(Numpad, { onconfirm: () => {} });
	const keyEl = screen.container.querySelector('.digit-key') as HTMLElement;
	const style = getComputedStyle(keyEl);
	expect(style.height).toBe('76px');
});
```

### Pattern 2: Local $state flash/press timers (already used consistently)
**What:** All 4 components use plain `let x = $state(...)` + `setTimeout` to clear transient visual state (flash, shake, press). No animation library, no store involvement.
**When to use:** Keep this pattern for any new flash/glow additions — do not introduce a new abstraction.
**Example:**
```typescript
// Source: src/ui/input/Dartboard.svelte:22, 189 (existing, unchanged pattern)
let flashKey = $state<string | null>(null);
// ...
setTimeout(() => { flashKey = null; }, 300);
```

### Anti-Patterns to Avoid
- **Styling only `VisitStrip.svelte` and assuming SCOR-03 is done:** it is not rendered on `/match`. Verify visually via dev server after any VisitStrip-related change — check the actual page, not just the component file.
- **Consolidating the notation helper into `VisitLine.svelte`'s copy:** that file is Phase 11 scope with its own locked-old-string test (`VisitLine.test.ts`). Any shared-helper refactor (Claude's Discretion) must only merge the two in-scope copies (`match/+page.svelte` + `VisitStrip.svelte`), leaving `VisitLine.svelte` as a third, independent, untouched copy.
- **Assuming an existing BUST keyframe on the scoring surface:** there isn't one (see Pitfall 3). Don't go hunting for `zeroFlashFade`/`bustFadeIn` inside `/match` files — those keyframes exist only in `PauseOverlay.svelte` and `PlayerPanel.svelte` (unrelated surfaces).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Computed-style regression proof | Manual visual screenshot diffing | `vitest-browser-svelte` + `getComputedStyle()` assertions (Pattern 1) | Already the established, CI-friendly pattern from Phase 9; fast and precise |
| Dart notation formatting | A new shared notation module imported by all 3 copies (including VisitLine) | Keep the duplication pattern for the copy Phase 11 owns; only merge the 2 in-scope copies if doing so at all | Consolidating into VisitLine would put Phase-10 changes into Phase-11-owned code and break its locked-old-string test |

**Key insight:** This phase does not need new infrastructure — it needs precise, surgical value edits verified against existing/established test patterns.

## Common Pitfalls

### Pitfall 1: VisitLine.test.ts already asserts the "OLD" notation strings — contradicts CONTEXT.md
**What goes wrong:** CONTEXT.md's SCOR-03 decision states "No test asserts the old strings (verified)." This is incorrect. `src/ui/display/VisitLine.test.ts` has explicit assertions:
- Line 89: `expect(screen.container.textContent).toContain('Bull')` (and asserts it does NOT contain "Outer Bull")
- Line 100: `expect(screen.container.textContent).toContain('0 (Daneben)')`
- Line 109: `expect(screen.container.textContent).toContain('Outer Bull')`
**Why it happens:** `VisitLine.svelte`'s `formatDart()` (lines 16-23) is a byte-for-byte copy of `VisitStrip.svelte`'s old-string version, explicitly labeled "copied verbatim from src/ui/input/VisitStrip.svelte (lines 9-15)" in its own comment. CONTEXT.md's author likely checked only the 2 in-scope files and missed this third copy, or assumed "Phase 11 surface" meant "irrelevant to this check."
**How to avoid:** Do NOT modify `VisitLine.svelte` or its notation strings in Phase 10 — it is explicitly Phase 11 scope (`DISP-*` requirements). Leave `VisitLine.test.ts` untouched and green. When exercising the "Claude's Discretion" option to consolidate notation helpers, only merge `match/+page.svelte`'s and `VisitStrip.svelte`'s copies — never touch `VisitLine.svelte`'s copy or import it from there.
**Warning signs:** If `VisitLine.test.ts` starts failing during Phase 10 execution, a shared-helper refactor leaked into Phase 11 territory.

### Pitfall 2: `VisitStrip.svelte` is orphaned — styling it alone has zero visible effect
**What goes wrong:** A plan that only edits `src/ui/input/VisitStrip.svelte` to match the DS VisitStrip spec will pass any component-level test but produce **no visible change** on `/match`, because that component is never imported by any route (confirmed via repo-wide grep — the only two matches for `VisitStrip` as an import target are the file's own self-reference and `VisitLine.svelte`'s comment referencing it as a source, not an import).
**Why it happens:** The live dart-slot strip on `/match` is inline markup directly in `src/routes/match/+page.svelte` (`.dart-column`/`.dart-pill`, template lines 345-358, CSS lines 440-480), built independently at some point in v1.0/v1.1 without reusing the `VisitStrip.svelte` component that already existed.
**How to avoid:** Apply all SCOR-03 CSS/notation changes to `match/+page.svelte`'s inline markup (this is the file that satisfies the requirement observably). Also update `VisitStrip.svelte` for consistency/future-proofing (cheap, low-risk, keeps the dead component from drifting further), but do not treat editing it as sufficient for SCOR-03 sign-off. Verify via dev-server visual check on `/match`, not just by opening `VisitStrip.svelte` in isolation.
**Warning signs:** UI review/dev-server spot-check shows old notation strings ('Bull', '0 (Daneben)') still on `/match` after "VisitStrip" work is marked done.

### Pitfall 3: SCOR-04's "existing keyframes keep token durations" premise doesn't hold — there is no BUST flash keyframe on the scoring surface
**What goes wrong:** A plan that searches for an existing bust-flash `@keyframes` to "preserve the duration of" inside `ScorePanel.svelte`/`match/+page.svelte` will find nothing, because none exists there.
**Why it happens:** `ScorePanel.svelte` (the actual SCOR-04 target) has ZERO bust-handling code at all today — no class, no color, no animation. The only current bust-adjacent visuals are: (a) the orphaned `VisitStrip.svelte`'s static `.visit-strip.bust { background-color: var(--destructive-line); }` (never rendered), and (b) `match/+page.svelte`'s live `.dart-column.bust .dart-pill { border-color: var(--destructive-line); color: var(--destructive); }` (a static color change via CSS class toggle, not a `@keyframes` animation). Keyframes named `zeroFlashFade` and `bustFadeIn` DO exist in the codebase, but in unrelated files: `src/ui/overlays/PauseOverlay.svelte:125` and `src/ui/display/PlayerPanel.svelte:256/261` — a Phase-11/other-surface component, not the `/match` ScorePanel.
**How to avoid:** Treat SCOR-04's BUST requirement as: apply `--destructive`/`--destructive-soft`/`--destructive-line` tokens to whatever bust-indicating element currently exists on `ScorePanel`/`match/+page.svelte` (there may need to be a NEW small bust indicator added to `ScorePanel.svelte` itself, since it currently has none — the player card doesn't visually react to a bust at all today, only the dart-pill row does). If a genuinely new animated flash is deemed necessary, that is additive scope beyond "color values move to tokens, no new timing" — flag it back to the user/planner as a scope question rather than silently building new keyframe logic.
**Warning signs:** Grepping `ScorePanel.svelte` for "bust" today returns zero matches — confirm this doesn't change to a false "existing keyframe" being invented from scratch without flagging it.

### Pitfall 4: Landscape layout risk with 96px active-score glyphs and 3-4 players
**What goes wrong:** `ScorePanel`'s landscape media query (`match/+page.svelte`... `.score-panel { flex-direction: row }` is inherited/unchanged, `.player-card { min-width: 0 }`) packs all player cards side-by-side inside a narrow 34%-width column (`~348px` at a 1024px-wide tablet viewport, matching `full-match-flow.spec.ts`'s test viewport). Jumping the active player's font from the current 80px (landscape override) to the DS-specified 96px, plus adding `--weight-heavy` (800) and a `text-shadow` glow, increases the risk of the score digits overflowing or wrapping when 3-4 players are active, since 3 inactive cards must still fit alongside the one active 96px card in that same narrow column.
**Why it happens:** `player-card { min-width: 0 }` in the landscape override removes the flex basis floor entirely, so cards will compress arbitrarily — there's no test or explicit `flex-wrap` guard here today.
**How to avoid:** During planning, add an explicit verification step (dev-server visual spot-check at 3 and 4 players, landscape orientation, ~1024px viewport — matching the E2E test viewport) as CONTEXT.md's gate already allows ("dev-server visual spot-check supplementary"). If the 4-player case genuinely overflows, this needs to surface as an Open Question rather than being silently patched with a functional layout change (which would exceed "pure visual restyle" scope, per the milestone's "no functional changes" character).
**Warning signs:** Visual spot-check with 4 profiles in a match, landscape orientation, shows clipped/overlapping score text.

### Pitfall 5: Dartboard's remaining color/geometry gaps are literal-value details, not token additions
**What goes wrong:** Assuming Dartboard.svelte needs a broad rewrite for SCOR-02, when in fact it already uses `--board-single`, `--board-red`, `--board-green`, `--board-stroke`, `--board-bg`, `--bg-deep`, `--triple`, `--accent`, `--text-muted`, and already renders `'Bull (50)'`/`'Bull (25)'`/`'✕'` notation for its floating labels (`spawnFloat()`, lines 32-53).
**Why it happens:** CONTEXT.md's phrasing ("ONLY colors move to `--board-*` tokens") reads as if this hasn't happened yet; in reality most of it already has.
**How to avoid:** The actual remaining gaps are narrow: (1) flash-overlay color is currently a single `var(--text-faint)` applied uniformly to both region-taps and the miss-zone (lines 213, 226, 237, 246), but the DS spec wants two distinct literal values — `rgba(255,255,255,0.35)` for region flashes and the dimmer `rgba(255,255,255,0.15)` for the miss-zone flash; (2) the floating-label stroke currently uses `var(--backdrop)` (`rgba(5,7,12,.65)`) but DS specifies a literal `rgba(0,0,0,.75)` halo; (3) floating-label `font-size="52"` is hardcoded but DS specifies 56px literal. All three are small, targeted literal-value edits — not new token plumbing.
**Warning signs:** A plan that proposes adding brand-new `--board-*` tokens (they already exist) or rewriting `buildRegions()`/hit-detection math (must stay byte-identical per SCOR-02).

## Code Examples

### Numpad current vs. target values (for the planner's diff table)
```
Current (src/ui/input/Numpad.svelte):          Target (10-UI-SPEC.md, DS-aligned):
.input-display { height: 56px; font-size: 28px; font-weight: 600; }
                                                 → height: var(--key-h) [76px]; font-size: var(--text-3xl) [40px]; font-weight: 700; background: var(--bg-deep)
.key { height: 64px; font-size: 24px; font-weight: 400; }
                                                 → height: var(--key-h) [76px]; font-size: var(--text-2xl) [32px]; font-weight: 500
.confirm-key { height: 64px; font-size: 18px; font-weight: 600; background: var(--accent); }
                                                 → height: var(--key-h) [76px]; font-size: var(--text-lg) [22px]; font-weight: 700; background: linear-gradient(180deg, var(--accent-bright) 0%, var(--accent) 45%, var(--accent-deep) 130%)
.error-msg { font-size: 14px; }                 → font-size: var(--text-sm) [15px]
⌫ button: no aria-label                         → aria-label="Letzte Ziffer löschen"
```
(clear-key "C" 26px/600 target vs. current 24px/400 shared `.key` class also needs its own override for size, since currently C/⌫ inherit the digit `.key` 24px/400 rule.)

### ScorePanel current vs. target values
```
Current (src/ui/input/ScorePanel.svelte):       Target (10-UI-SPEC.md):
.player-name { font-size: 26px; }               → font-size: var(--text-lg) [22px]; ellipsis truncation (no wrap) — currently no truncation at all
.remaining-active { font-size: 64px; }          → font-size: var(--text-score-active) [96px]; font-weight: var(--weight-heavy) [800]; text-shadow glow
.remaining-inactive { font-size: 32px; }        → font-size: var(--text-score-inactive) [44px]; font-weight: 700
.player-card.active { border-left: 3px; bg tint only } → box-shadow: inset 4px 0 0 var(--accent), var(--glow-accent), var(--edge-highlight); border: 1px solid var(--accent-line)
```

### CheckoutSuggestion current vs. target values
```
Current: <span class="suggestion"> plain text, 14px/400, color var(--accent), no background/border/pill.
Target:  17px/700 pill — background var(--accent-soft), border var(--accent-line), border-radius var(--radius-pill), padding 4px 14px, plus box-shadow var(--glow-accent) per CONTEXT.md's discretion addition.
```

## State of the Art

Not applicable — this is an internal restyle of the project's own components, not a third-party library/framework question. No external "current vs. deprecated" API surface is involved.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "correct" fix for the BUST requirement is to add color-token-only bust styling to `ScorePanel.svelte` (a small new indicator) rather than building a new flash keyframe, since CONTEXT.md's "no new timing" instruction implies staying additive/minimal | Pitfall 3 / Common Pitfalls | If wrong, the planner under-scopes SCOR-04's BUST requirement (misses a needed visual) or over-scopes it (adds an unrequested animation, violating "pure visual pass, no new timing") |
| A2 | The landscape 3-4 player overflow risk (Pitfall 4) is real enough to warrant an explicit verification task, not just the general "dev-server visual spot-check" already in CONTEXT.md's gate | Pitfall 4 | If the risk doesn't materialize, this is a low-cost extra verification step; if it does and isn't checked, a shipped regression on tablets with 3-4 players |

All other findings in this document were verified directly by reading the cited source files (`file:line` references throughout) — not assumed from training knowledge.

## Open Questions

1. **Should `VisitStrip.svelte` (orphaned) be deleted, kept in sync, or left alone?**
   - What we know: it is not imported/rendered anywhere; its only "consumer" is a comment in `VisitLine.svelte` citing it as the origin of a copied function.
   - What's unclear: whether removing dead code is in scope for a "pure restyling" milestone (CLAUDE.md/user global guideline: don't remove pre-existing dead code unless asked — this suggests leaving it, just updating it for consistency, or asking the user).
   - Recommendation: Update `VisitStrip.svelte`'s CSS/notation to match the DS spec for consistency (cheap, avoids further drift) but do not delete it and do not rely on it alone for SCOR-03 sign-off. Mention this discovery to the user during planning/discussion rather than silently deciding.

2. **Does the "BUST" requirement for SCOR-04 require adding a new visual element to `ScorePanel.svelte`, or does the requirement fold into the existing `match/+page.svelte` dart-pill bust styling?**
   - What we know: `ScorePanel.svelte` (the literal SCOR-04 target file) has no bust-handling code today; `match/+page.svelte`'s separate dart-pill bust styling is really SCOR-03 territory (VisitStrip/DartPill), not SCoreCard.
   - What's unclear: whether "existing keyframes keep token durations" in CONTEXT.md refers to a keyframe that needs to be newly authored (contradicting "no new timing"), or whether it was a mistaken assumption that can be resolved by just token-izing the dart-pill bust colors (already SCOR-03 scope) and leaving `ScorePanel.svelte` itself with no bust reaction (since a leg-ending bust is transient and mid-visit, tied to the current-visit strip, not the score card).
   - Recommendation: Confirm with the user/planner whether ScoreCard needs ANY new bust-reactive element, or whether SCOR-04's BUST line item is fully satisfied by the dart-pill/visit-strip work already covered under SCOR-03.

3. **Is `CorrectionWindow.svelte` (shows "Überworfen!" bust label) actually dead code too, or reachable via some code path not found in this search?**
   - What we know: it's imported nowhere outside its own file and its own test.
   - What's unclear: whether it's a leftover from a pre-quick-task UI flow (the E2E test comment in `full-match-flow.spec.ts:52` says "the correction-window overlay was replaced by the dart-pill undo strip") — this suggests it's confirmed dead/superseded, consistent with the VisitStrip finding.
   - Recommendation: Since CONTEXT.md doesn't mention `CorrectionWindow.svelte` at all, treat it as explicitly out of scope for Phase 10 — no action needed, just don't be surprised if it's noticed during a repo-wide grep for "bust" styling.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`unit` project = Node, `browser` project = real Chromium via `vitest-browser-svelte` 2.1.1 + `@vitest/browser-playwright`) + Playwright 1.60.0 for E2E |
| Config file | `vite.config.ts` (Vitest projects), `playwright.config.ts` (E2E) |
| Quick run command | `npm run test:browser -- src/ui/input/Dartboard.test.ts` (targeted); `npm run test:browser` (all browser-mode) |
| Full suite command | `npm test` (all Vitest projects) && `npx playwright test` (9 E2E specs) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCOR-01 | Numpad key/entry/confirm computed CSS values (76px/40px/32px/etc.) | unit (browser-mode) | `npm run test:browser -- src/ui/input/Numpad.test.ts` | ❌ Wave 0 — no file exists today |
| SCOR-01 | ⌫ has correct aria-label | unit (browser-mode) | same file as above | ❌ Wave 0 |
| SCOR-01 | Existing invalid-shake/validation logic unchanged | E2E (regression only, no new test needed) | `npx playwright test full-match-flow` | ✅ (behavior-only, doesn't assert CSS) |
| SCOR-02 | Hit-detection dispatch unchanged (center/miss/triple-20) | unit (browser-mode) | `npm run test:browser -- src/ui/input/Dartboard.test.ts` | ✅ exists, must stay green unmodified |
| SCOR-02 | Flash/float color+font-size literal values | unit (browser-mode) | new assertions in `Dartboard.test.ts` or a new file | ❌ Wave 0 — no CSS-value coverage exists today |
| SCOR-03 | Notation strings render `Bull (50)`/`Bull (25)`/`✕` on the LIVE `/match` strip | unit (browser-mode) on `match/+page.svelte`, or E2E | new test — `match/+page.svelte` currently has no dedicated test file | ❌ Wave 0 |
| SCOR-03 | `VisitLine.test.ts` stays green with OLD strings (Phase 11, do not touch) | unit (browser-mode), regression only | `npm run test:browser -- src/ui/display/VisitLine.test.ts` | ✅ exists — must stay untouched-green |
| SCOR-04 | ScoreCard active/inactive computed font-size/weight, box-shadow | unit (browser-mode) | new file, e.g. `src/ui/input/ScorePanel.test.ts` | ❌ Wave 0 |
| SCOR-04 | Checkout pill computed values | unit (browser-mode) | new file, e.g. `src/ui/input/CheckoutSuggestion.test.ts` | ❌ Wave 0 |
| ALL | Full regression: 535 Vitest + 9/9 Playwright green | full suite | `npm test && npx playwright test` | ✅ — this is the phase's overall gate per CONTEXT.md |

### Sampling Rate
- **Per task commit:** `npm run test:browser -- <changed component test file>` (fast, targeted)
- **Per wave merge:** `npm test` (full Vitest, ~535 tests) 
- **Phase gate:** Full suite (`npm test && npx playwright test`) green before `/gsd-verify-work`, plus a manual dev-server visual spot-check per CONTEXT.md's gate (landscape, 3-4 players, per Pitfall 4)

### Wave 0 Gaps
- [ ] `src/ui/input/Numpad.test.ts` — new file, computed-style assertions for key/entry/confirm dimensions + aria-label presence (SCOR-01)
- [ ] New computed-style assertions in/near `src/ui/input/Dartboard.test.ts` (or a sibling file) — flash color literals + float font-size (SCOR-02); do NOT touch the 3 existing dispatch tests
- [ ] A test exercising `match/+page.svelte`'s live dart-pill notation strings post-change (SCOR-03) — no such coverage exists today; component test or E2E
- [ ] `src/ui/input/ScorePanel.test.ts` — new file, active/inactive font-size/weight + box-shadow presence (SCOR-04)
- [ ] `src/ui/input/CheckoutSuggestion.test.ts` — new file, pill computed values (SCOR-04)
- [ ] No framework install needed — Vitest browser-mode + Playwright already configured and used identically in Phase 9 (`StatCard.test.ts`, `components-css.test.ts`)

## Security Domain

`security_enforcement` is enabled (ASVS level 1) but this phase has no security-relevant surface:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app |
| V3 Session Management | No | Not touched |
| V4 Access Control | No | Not touched |
| V5 Input Validation | No change | `isValidVisitTotal` validation logic untouched — this phase only restyles the shake/error-message presentation, never the validation rule itself |
| V6 Cryptography | No | Not touched |

### Known Threat Patterns for this stack
Not applicable — no new user input surfaces, no data persistence changes, no new rendering of untrusted content (`{@html}` is not used and not being introduced; all interpolation stays plain `{}` text per the project's existing T-04-03/T-03-04 conventions observed in `StatDrawer.svelte` and `VisitLine.svelte`).

## Sources

### Primary (HIGH confidence — direct source reads, this session)
- `src/ui/input/Dartboard.svelte` (full read) — geometry constants, spawnFloat(), flash logic, existing token usage
- `src/ui/input/Numpad.svelte` (full read) — current CSS values, validation flow
- `src/ui/input/VisitStrip.svelte` (full read) — orphaned-component finding, old-string formatDart
- `src/ui/input/ScorePanel.svelte`, `CheckoutSuggestion.svelte`, `StatDrawer.svelte` (full reads) — current CSS values, no-bust-handling finding
- `src/routes/match/+page.svelte` (full read) — live dart-pill markup, formatDart duplicate, audio-caller decoupling proof
- `src/ui/display/VisitLine.svelte` + `VisitLine.test.ts` (full reads) — old-string test proof, Phase-11 scope confirmation
- `src/lib/audio-caller.ts` (full read) — confirms announcements use raw numbers, zero coupling to notation helpers
- `src/styles/{colors,typography,spacing,elevation}.css` (full reads) — confirms every target token already exists
- `src/ui/input/Dartboard.test.ts`, `src/ui/stats/StatCard.test.ts`, `src/ui/shared/components-css.test.ts` — test-pattern verification
- `e2e/full-match-flow.spec.ts`, `e2e/reduced-motion.spec.ts` — E2E coupling verification
- `.planning/phases/10-scoring-surface/{10-CONTEXT.md,10-UI-SPEC.md}`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json`, `package.json` — phase scope, requirements, tooling versions

### Secondary / Tertiary
None used — this phase required zero external documentation lookups (no new libraries, frameworks, or APIs).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new stack, all tokens/tools confirmed present by direct file reads
- Architecture: HIGH — orphaned-component and duplication findings confirmed via repo-wide grep, not inference
- Pitfalls: HIGH — all 5 pitfalls backed by exact file:line citations from this session's reads

**Research date:** 2026-07-14
**Valid until:** No external dependency — valid for the lifetime of this phase (re-research only if CONTEXT.md/UI-SPEC.md are revised)
