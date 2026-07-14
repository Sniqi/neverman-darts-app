# Phase 11: Spectator Display - Research

**Researched:** 2026-07-14
**Domain:** CSS restyle of a Chrome-90-safe, cqw-driven Svelte display surface (PC window / tablet fullscreen / Chromecast receiver)
**Confidence:** HIGH (codebase-verified — this is a transcription phase against an approved UI-SPEC, not open exploration)

## Summary

Phase 11 restyles three already-shipped, already-tested Svelte components (`MatchHeader.svelte`, `PlayerPanel.svelte`, and dead-code `VisitLine.svelte`) to match literal values from `design/components/display/{MatchHeader,PlayerPanel}.jsx`. No new libraries, no new components, no logic changes — every required change is a CSS value swap or a 2-line text-notation fix. The codebase already has the exact `--display-*` cqw clamp tokens defined in `src/styles/typography.css:34-38` (they were added in Phase 8 and are unused until now), so no new tokens are strictly required for typography.

The single highest-risk finding is **not** in the UI-SPEC: several DS literal values the UI-SPEC asks the executor to adopt (bloom `28%`, active-panel glow `7%`/`22%`, live-row tint `17%`) are expressed in the DS source as `color-mix(in oklab, ...)`. This project has an explicit, established rule — stated in-code twice (`src/routes/match/+page.svelte:458-460,494-496`) and reflected in every existing token (`--accent-soft`, `--accent-line`, `--glow-accent`, `--destructive-soft`, etc. in `src/styles/colors.css` and `src/styles/elevation.css`) — that `color-mix()` must **never** ship as a live CSS expression because Chrome 90 (the Cast receiver) does not support it. All new DS color-mix literals must be precomputed to static `rgba()` using the project's existing convention (percentage → alpha on the same base RGB). This phase's plan must apply that same precomputation to the *new* literals the UI-SPEC introduces, exactly as Phase 8 did for the existing tokens.

A second finding: the UI-SPEC's own "Dart-pill notation contract" table (lines 188-201) asserts the DS short-pill form maps outer-bull to `'Bull'`, but the literal, canonical source `design/components/scoring/DartPill.jsx:7` returns `'Outer'` for outer bull. This is a direct contradiction between the UI-SPEC's prose and its own cited source file — flagged as an Open Question below; do not silently pick one without a decision.

**Primary recommendation:** Implement every UI-SPEC "FIX" row as a literal CSS value swap on the existing class names (no new components, no DOM restructuring). Precompute every `color-mix()`-derived literal to a static `rgba()` value before it reaches PlayerPanel.svelte/MatchHeader.svelte's `<style>` block (see Common Pitfalls for the exact computed values). Update `VisitLine.test.ts`'s two negative-notation assertions and `PlayerPanel.svelte`'s two-line `formatDart` fix as isolated, planned test/string changes. Everything else (structure, class names, props, `@supports` gates, E2E selectors) stays byte-identical.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Player panel visuals (backgrounds, typography, history box) | Browser/Client (Svelte component CSS) | — | Pure presentational CSS in `PlayerPanel.svelte`; no server, no data layer involved |
| Match header visuals | Browser/Client | — | Same — `MatchHeader.svelte` is prop-driven, stateless CSS |
| Chrome-90 fallback layer (`@supports not (...)`) | Browser/Client | — | CSS feature-detection executed entirely client-side at render time; no build-time branching |
| Dart notation strings (VisitLine, PlayerPanel local formatDart) | Browser/Client | — | Pure display formatting functions, no I/O |
| Live sync (BroadcastChannel/Cast) | Browser/Client (existing, untouched) | — | Out of scope this phase (DISP-04 locks it) — included only to confirm no tier boundary is crossed by the restyle |

**Why this matters here:** every capability in this phase lives entirely in the Browser/Client tier (Svelte component styles rendered on three deployment targets — PC window, tablet fullscreen, TV receiver — but all the same client-side bundle). There is no API/backend or CDN tier interaction to misassign. The map is included for completeness/plan-checker verification, not because tier misassignment is a real risk this phase.

## Standard Stack

No new libraries this phase. Existing stack (verified against `package.json`, current in repo):

| Library | Installed Version | Purpose | Confirmed |
|---------|-------------------|---------|-----------|
| Svelte | ^5.56.3 | Component runtime (runes) | `package.json:21` |
| @sveltejs/kit | ^2.64.0 | Routing / `/display` route | `package.json:18` |
| TypeScript | ~5.9.3 | Type-checked `<script lang="ts">` | `package.json` devDependencies |
| Vite | ^8.0.16 | Build | `package.json` devDependencies |
| Vitest | ^4.1.8 | Unit + browser-mode component tests | `package.json` devDependencies |
| Playwright | ^1.60.0 | E2E (`spectator-sync.spec.ts`) | `npx playwright --version` → 1.60.0 [VERIFIED] |

No `npm install` needed this phase — this is a CSS/markup-only restyle. **Package Legitimacy Audit is not applicable** (no new packages).

## Package Legitimacy Audit

Not applicable — this phase installs zero new packages. All work is CSS-value and 2-line string-logic edits inside existing, already-audited files.

## Architecture Patterns

### System Architecture Diagram

```
                     MatchStore (src/stores/match.svelte.ts, unchanged)
                              │ writes state
                              ▼
        ┌─────────────────────────────────────────────┐
        │  BroadcastChannel  +  localStorage snapshot   │  ← DISP-04 locked, untouched
        └───────────────┬───────────────────┬───────────┘
                         │                   │
              (PC 2nd window /              (Chromecast receiver:
               tablet fullscreen)             CastReceiverBridge.init())
                         │                   │
                         ▼                   ▼
              ┌─────────────────────────────────────┐
              │  src/routes/display/+page.svelte     │  ← route shell (untouched this phase)
              │  branches: IdleScreen | active match  │
              └───────────────┬───────────────────────┘
                               │ passes props (no store reads)
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
          MatchHeader    PlayerPanel×N   LegWinBanner /
          (THIS PHASE)   (THIS PHASE)    MatchWinDisplay /
                                          PauseOverlay
                                          (verify-only)
                 │             │
                 └── both consume var(--display-*) INSIDE
                     @supports (container-type: inline-size)
                     with a parallel @supports-not vw-fallback
                     block — the two-layer Chrome-90 pattern
```

Reading this diagram: a dart thrown on `/match` flows through the store → BroadcastChannel/localStorage (unchanged) → the `/display` route shell (unchanged) → into `MatchHeader`/`PlayerPanel`, which is where 100% of this phase's edits live. The fallback `@supports` block is a parallel CSS path evaluated by the browser itself, not a separate code branch.

### Recommended Project Structure

No new files. Edits confined to:
```
src/ui/display/
├── MatchHeader.svelte      # CSS value swaps only (11 FIX rows)
├── PlayerPanel.svelte      # CSS value swaps + 2-line formatDart fix + @supports fallback value sync
└── VisitLine.svelte        # swap local formatDart for shared dart-notation.ts import (dead code, still tested)
src/ui/display/VisitLine.test.ts   # update 2 negative-notation assertions (planned)
```

### Pattern 1: Chrome-90 two-layer cqw/vw architecture (extend, don't redesign)

**What:** Every `cqw`-based rule in `PlayerPanel.svelte` has a paired `@supports not (container-type: inline-size)` rule (lines 553-569) that re-derives the identical clamp using `calc(Nvw / var(--player-count, 2))`. `MatchHeader.svelte` needs no such gate — its clamps use plain `vw` (baseline-supported on Chrome 90), confirmed by the currently-shipped file having zero `@supports` blocks.

**When to use:** Any time a `--display-*` token's clamp `N` value changes (per the UI-SPEC Typography table), the vw-fallback block's matching `calc(Nvw / var(--player-count, 2))` must be updated with the same `N` in the same commit, or the two layers drift out of sync — silently correct on modern browsers, silently wrong on the Chrome-90 receiver where only the fallback runs.

**Example (existing, from `PlayerPanel.svelte:553-569`):**
```css
/* Source: src/ui/display/PlayerPanel.svelte:553-569 (already shipped, UAT-verified Phase 7/8) */
@supports not (container-type: inline-size) {
	.player-panel { padding: clamp(8px, calc(2vw / var(--player-count, 2)), 24px) ...; }
	.player-name    { font-size: clamp(1.6rem, calc(11vw  / var(--player-count, 2)), 8.5rem); }
	.remaining-score { font-size: clamp(3rem,  calc(23vw  / var(--player-count, 2)), 16rem); }
	/* ... one line per cqw rule that has a real font-size/spacing consequence */
}
```
The plan must add a matching entry for every renamed/changed cqw rule (e.g. once `.player-name` swaps to `var(--display-name)` = `clamp(3rem, 10cqw, 12rem)`, the fallback line becomes `clamp(3rem, calc(10vw / var(--player-count, 2)), 12rem)` — UI-SPEC's own table at lines 217-226 already spells out all six required fallback pairs verbatim; use those values directly, they are internally consistent with the Typography table above them.

### Anti-Patterns to Avoid

- **Duplicate-property "fallback" declarations** (e.g. `height: 100vh; height: 100dvh;` on two lines in the same rule): the production CSS minifier dedupes same-property declarations and keeps only the last one, silently deleting the Chrome-90 fallback. This is a **locked v1.1 finding** (see `src/routes/display/+page.svelte:305-310` comment, and the `display-root`/`IdleScreen` code for the correct pattern: base value in the unconditional rule, upgrade value inside a *separate* `@supports (...)` rule). Every fallback in this phase must follow that same separate-rule pattern, never same-rule duplicate-property.
- **Referencing raw `--display-*` cqw tokens outside a gate:** if a `cqw`-unit custom property is referenced on Chrome 90 outside a feature-detected context, the property is invalid at computed-value time and the whole declaration collapses to its initial/inherited value — worse than having no fallback at all, because it fails silently with no visual cue. CONTEXT.md already locks this; the fix is structural: PlayerPanel's primary rules must live in the unconditional/`@supports (container-type: inline-size)` layer and the fallback rules must use `vw`-only replacements, never referencing `var(--display-*)` inside the `@supports not (...)` block.
- **Shipping `color-mix()` as a live expression anywhere reachable by the Cast receiver route.** See Common Pitfalls below — this is the single biggest risk in this phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chrome-90-safe amber tint at a given alpha | A new `color-mix()` call, even "just this once" | A static `rgba(240, 164, 36, <alpha>)` literal (or a new CSS custom property holding that same static rgba) | Every existing amber/red tint token in `src/styles/colors.css` and `src/styles/elevation.css` is already precomputed this way; introducing one live `color-mix()` reintroduces the exact bug Phase 7/8 fixed on-device (UAT 3rd pass) |
| Dart notation formatting | A third local copy of `formatDart` | `src/ui/input/dart-notation.ts` (long form) for `VisitLine.svelte`; keep `PlayerPanel.svelte`'s own local short-form `formatDart` (2-line fix only) — do NOT try to unify the two, they intentionally produce different strings for different UI contexts (long form on `/match`, short form in TV-legible pills) | The module's own top-of-file comment (`dart-notation.ts:3-5`) explicitly documents this split and warns against importing it into `VisitLine.svelte`'s sibling |

**Key insight:** This phase has zero "deceptively complex" problems in the traditional sense (no dates, no currency, no auth) — the domain-specific "don't hand-roll" risk here is entirely about *not reintroducing a previously-fixed CSS portability bug* while translating literal DS values.

## Common Pitfalls

### Pitfall 1: Shipping `color-mix()` literals verbatim from the DS `.jsx` source

**What goes wrong:** The DS source files use `color-mix(in oklab, ...)` extensively (`design/components/display/MatchHeader.jsx:23` for the bloom, `design/components/display/PlayerPanel.jsx:24` for the active box-shadow, `design/components/display/PlayerPanel.jsx:30` for the bust overlay, `design/components/display/PlayerPanel.jsx:66` for the live-row tint, `design/components/scoring/DartPill.jsx:20,22` for double-pill fill/border and bust-pill text). `color-mix()` is not supported in Chrome 90 — the value the CSS engine assigns is `unset`/inherited, silently breaking the visual on the one device (the Cast receiver) where DISP-03 explicitly requires on-device verification.

**Why it happens:** The DS `.jsx` files are React/browser-preview code meant to render in a modern authoring tool (claude.ai design project), not on the target Chrome-90 runtime. They are the correct *value* source but not portable CSS as-is.

**How to avoid:** Precompute every `color-mix(in oklab, var(--accent) N%, transparent)` to `rgba(240, 164, 36, N/100)` and every `color-mix(in oklab, var(--destructive) N%, transparent)` to `rgba(229, 72, 77, N/100)` — this is exactly how the existing `--accent-soft` (13%→`rgba(240,164,36,0.13)`), `--accent-line` (45%→`rgba(240,164,36,0.45)`), `--glow-accent` (18%→`rgba(240,164,36,0.18)` static in `src/styles/elevation.css:13`, NOT the color-mix form used in `design/tokens/elevation.css:13`), and `--destructive-soft` (14%→`rgba(229,72,77,0.14)`) tokens were already derived. Exact values needed this phase:

| DS literal (`.jsx` source) | Precomputed static value | Where it's needed |
|---|---|---|
| `color-mix(in oklab, var(--accent) 28%, transparent)` (MatchHeader bloom) | `rgba(240, 164, 36, 0.28)` | `MatchHeader.svelte` `.match-header::after` background |
| `color-mix(in oklab, var(--accent) 7%, transparent)` (active panel glow, ambient) | `rgba(240, 164, 36, 0.07)` | `PlayerPanel.svelte` `.player-panel.active` box-shadow (first inset) |
| `color-mix(in oklab, var(--accent) 22%, transparent)` (active panel glow, top edge) | `rgba(240, 164, 36, 0.22)` | `PlayerPanel.svelte` `.player-panel.active` box-shadow (second inset) |
| `color-mix(in oklab, var(--accent) 17%, transparent)` (live history row tint) | `rgba(240, 164, 36, 0.17)` | `PlayerPanel.svelte` `.history-row.live-row` background |
| `color-mix(in oklab, var(--accent) 40%, transparent)` (active remaining-score text-shadow, DS `PlayerPanel.jsx:41` — not explicitly a UI-SPEC FIX row but present in the literal source) | `rgba(240, 164, 36, 0.40)` | flag as Open Question 3 below — UI-SPEC did not table this one |
| `color-mix(in oklab, var(--destructive) 16%, transparent)` (bust overlay background, DS `PlayerPanel.jsx:30` — also not tabled by UI-SPEC) | `rgba(229, 72, 77, 0.16)` | flag as Open Question 3 below |

Non-`color-mix` literals the UI-SPEC already gives directly (safe to use as-is, no Chrome-90 concern): `rgba(0,0,0,0.22)` (history-box recess bg), `inset 0 2px 8px rgba(0,0,0,0.25)` (history-box shadow), `rgba(255,255,255,0.03)` (non-last history row bg), `rgba(255,255,255,0.05)` (DS `PlayerPanel.jsx:14` inactive chip bg — not currently in UI-SPEC's chip table but present in source; chips table says "already correct, no fix required" so verify this specific value if precision matters).

**Warning signs:** Any `background:`, `box-shadow`, or `text-shadow` declaration inside `PlayerPanel.svelte` or `MatchHeader.svelte` containing the literal substring `color-mix(` after this phase ships. A simple `grep -rn "color-mix" src/ui/display/` should return zero matches — use this as a plan verification step.

### Pitfall 2: `VisitLine.test.ts` assertions that will silently continue to pass with the wrong string

**What goes wrong:** The CONTEXT.md-locked plan is to swap `VisitLine.svelte`'s local `formatDart` for `dart-notation.ts`'s (which produces `✕` for miss and `Bull (50)`/`Bull (25)` for bull variants). Two of the seven `formatDart`-related tests in `VisitLine.test.ts` will **fail loudly** (good — they assert the literal old string, `.not.toContain` won't save them):
  - `VisitLine.test.ts:94-101` — asserts `toContain('0 (Daneben)')` for a miss dart. New string is `'✕'`. **Must update to `expect(...).toContain('✕')`.**
  - `VisitLine.test.ts:103-110` — asserts `toContain('Outer Bull')` for outer bull. New string is `'Bull (25)'`. **Must update to `expect(...).toContain('Bull (25)')`.**

  One test will **silently continue to pass but for the wrong reason** — a false-negative risk if left unexamined:
  - `VisitLine.test.ts:83-92` — asserts `toContain('Bull')` for inner bull (multiplier:2, segment:25). New string `'Bull (50)'` still contains the substring `'Bull'`, so this assertion passes without being updated. It also asserts `not.toContain('Outer Bull')` — new string `'Bull (50)'` doesn't contain that either, so it also still passes. **Recommendation: update the expected string to the exact new value (`'Bull (50)'`) anyway, for precision, even though it isn't strictly required for the suite to stay green** — otherwise a future regression to, say, `'Bull (500)'` would go undetected.

**Why it happens:** Substring assertions (`toContain`) are commonly used for resilience to whitespace/markup changes, but they mask exactly this kind of "old assertion happens to still match new string" drift.

**How to avoid:** Treat all three bull/miss tests as touched by this phase, not just the two that would fail. Grep `VisitLine.test.ts` for every use of `'Bull'`, `'Outer Bull'`, `'0 (Daneben)'` before considering the test-update task complete.

### Pitfall 3: `VisitLine.svelte`'s own display font-size (`clamp(1rem, 5cqw, 3.2rem)` at line 76) has no `@supports` fallback

**What goes wrong:** Unlike `PlayerPanel.svelte`, `VisitLine.svelte` has zero `@supports` blocks — its `.visit-line` font-size is a bare `cqw` clamp with no vw-fallback. Since `VisitLine.svelte` is dead code (not imported by any route, confirmed: `grep -rn "VisitLine" src/routes` returns nothing, and UI-SPEC/CONTEXT.md both state it is unused, `PlayerPanel.svelte` renders its own inline history rows instead), this currently causes **no runtime bug** — but if the consolidation task (formatDart import swap) is the only thing touched, the component still silently lacks the Chrome-90 fallback pattern that every *active* display component has.

**How to avoid:** No action required — CONTEXT.md explicitly scopes the `VisitLine.svelte` change to the `formatDart` swap only, and it is confirmed dead code. Do not add a Chrome-90 fallback to it as unsolicited scope; just don't be surprised that it's missing, and don't treat its absence as a phase-blocking gap.

### Pitfall 4: MatchHeader gradient/background acceptable-drift vs. PlayerPanel locked-literal

**What goes wrong:** The UI-SPEC explicitly treats MatchHeader's background gradient (`#212634→#13161e` DS vs. currently-shipped token-based `var(--surface-2)→var(--surface)` = `#1d2330→#161a23`) as **"Acceptable — nearest-token mapping... No change required"**, while PlayerPanel's near-identical-looking gradients are **locked literal hex values that MUST change**. A planner or executor skimming quickly could apply the wrong rule to the wrong component (e.g. "fixing" MatchHeader's background to the literal hex, which CONTEXT.md/UI-SPEC did NOT ask for and would be unrequested scope; or leaving PlayerPanel's background as token-based, which IS a required fix).

**Why it happens:** Both are background gradients on visually similar panels; the distinction (MatchHeader = nearest-token acceptable, PlayerPanel = locked literal) is a one-line editorial note buried in two different table cells (UI-SPEC lines 72 and 89-94).

**How to avoid:** Plan tasks should explicitly separate "MatchHeader: no background change" from "PlayerPanel: literal hex gradient required," each as its own line item, so this distinction survives into execution.

## Code Examples

### Example: Precomputed color-mix replacement, matching the project's own pattern

```css
/* Source: src/routes/match/+page.svelte:494-496 (existing precedent for this exact pattern) */
/* bg/border are precomputed statics for DartPill.jsx:20's literal
   color-mix(in oklab, var(--accent) 7%/30%, transparent) — the .jsx is the
   authoritative value source (text stays --accent-double per the same line). */
.dart-pill--double {
	color: var(--accent-double);
	background: rgba(240, 164, 36, 0.07);
	border-color: rgba(240, 164, 36, 0.3);
	font-weight: 600;
}
```
Apply this identical style of same-commit code comment + precomputed literal for every new color-mix value this phase introduces (bloom, active-panel glow, live-row tint — see Pitfall 1 table).

### Example: MatchHeader — combined typography + bloom fix (illustrative, values per UI-SPEC tables)

```css
/* Source: src/ui/display/MatchHeader.svelte:33-49 (current) + design/components/display/MatchHeader.jsx:9-23 (target) */
.match-header {
	font-family: var(--font-score);                              /* currently missing */
	font-size: clamp(1.75rem, 3.4vw, 6.5rem);                     /* was clamp(2rem, 4vw, 5.6rem) */
	font-weight: 600;                                             /* was 500 */
	padding: clamp(8px, 1vw, 20px) clamp(16px, 2.5vw, 48px);      /* was var(--space-sm) var(--space-lg) */
	gap: clamp(0.5rem, 1.2vw, 1.6rem);                            /* was clamp(0.4rem, 1vw, 1.2rem) */
	/* background, border-bottom, box-shadow: unchanged (nearest-token acceptable) */
}
.match-header::after {
	height: 16px;                                                 /* was 14px */
	background: linear-gradient(180deg, rgba(240, 164, 36, 0.28), transparent); /* precomputed, was var(--accent-soft) = 13% */
}
.mh-dot {
	font-size: 0.4em;              /* was 0.45em */
	transform: translateY(-0.15em); /* was translateY(-0.1em) */
}
.mh-mode { font-weight: 700; }    /* was inherited base weight (was effectively 500, now correctly 600 via base) */
.mh-leg { font-weight: 800; }     /* was 700 */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Ad-hoc per-element cqw clamps hand-tuned during Phase 7 (v1.1) | Shared `--display-*` scale tokens from Phase 8 (`typography.css:34-38`), consumed at usage sites | Phase 8 (2026, tokens added but left unconsumed until this phase) | Consistent scale across all display elements; single source of truth for future scale tuning |
| Live `color-mix()` in DS previews | Static precomputed `rgba()` in shipped code | Established Phase 8 (`08-01` decision, STATE.md) and reaffirmed Phase 10 | Chrome-90 Cast receiver compatibility; this phase must extend the same pattern to new literals |

**Deprecated/outdated:** None specific to this phase — no dependency upgrades involved.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `color-mix(in oklab, X N%, transparent)` is safely approximated by `rgba(<X's RGB>, N/100)` for this project's amber/red palette (i.e., oklab mixing with fully-transparent produces a result visually indistinguishable from simple alpha blending at these percentages) | Common Pitfalls / Code Examples | LOW — this is not a novel claim; it is the exact pattern already used and shipped for `--accent-soft`, `--accent-line`, `--glow-accent`, `--destructive-soft` (all verified by direct file read, not assumed) — included here only because the *specific new percentages* (28%, 7%, 22%, 17%, 40%, 16%) haven't been individually eyeballed on a real screen yet; if any looks visibly off during on-device UAT, nudge the alpha, don't reintroduce `color-mix()` |

**All other claims in this research are `[VERIFIED: codebase]`** — read directly from the current repository state (file:line cited throughout) — or `[CITED: design/ DS source]`. No package/library claims were made that required registry verification (no new packages this phase).

## Open Questions

1. **DartPill outer-bull notation: UI-SPEC prose says `'Bull'`, literal DS source says `'Outer'`**
   - What we know: `design/components/scoring/DartPill.jsx:7` (the canonical, single-source-of-truth DS file per this project's established convention) literally returns `'Outer'` for `{multiplier:1, segment:25}`. The 11-UI-SPEC.md's own "Dart-pill notation contract" table (lines 188-201) claims the target short-pill form is `'Bull'` ("must match inner bull's word — pill has no room for the (50)/(25) distinction, per DS").
   - What's unclear: whether the UI-SPEC's author made a deliberate, reasoned deviation from the literal DS file (and forgot to say so explicitly) or made a transcription error while writing the contract table.
   - Recommendation: Surface this to the user/planner explicitly before locking the plan. If the project's "the .jsx is the literal source of truth" rule (stated at the top of 11-UI-SPEC.md itself: "This is a transcription phase... the literal source of truth") is applied consistently, the correct target string is `'Outer'`, not `'Bull'` — i.e., PlayerPanel's local `formatDart` should change `'Outer'` (unchanged) but change the **miss** case from `'0'` to `'✕'` only, leaving the outer-bull case as-is. This is a one-line difference in scope from what UI-SPEC currently states; do not silently pick either interpretation in the plan without flagging it.

2. **UI-SPEC's Checker Sign-Off is unresolved** (all six dimension checkboxes unchecked, "Approval: pending" at `11-UI-SPEC.md:263-270`) despite front-matter `status: draft` — while the task briefing describes the UI-SPEC as "approved." This research treats the document's content as authoritative (per CONTEXT.md's explicit locked decisions referencing it), but the planner should confirm with the user whether the formal checker sign-off step was completed out-of-band or still needs to run.

3. **Two DS literal values present in the source `.jsx` but not tabled as "FIX" rows in the UI-SPEC:** the active remaining-score's `text-shadow` using `color-mix(...var(--accent) 40%...)` (`design/components/display/PlayerPanel.jsx:41`) and the bust-overlay background using `color-mix(...var(--destructive) 16%...)` (`design/components/display/PlayerPanel.jsx:30`, vs. currently-shipped `var(--destructive-soft)` = 14%). The currently-shipped `PlayerPanel.svelte` already has a `text-shadow` on `.player-panel.active .remaining-score` (line 341: `text-shadow: 0 0 55px var(--accent-line), 0 2px 10px var(--backdrop)`) and a bust-overlay background (line 239: `background-color: var(--destructive-soft)`) that are close-but-not-identical to the DS literals.
   - Recommendation: since UI-SPEC (the approved contract) did not table these as required fixes, treat them as out of this phase's locked scope by default — but flag to the user that two small DS-literal deltas exist unaddressed, in case the omission from UI-SPEC was accidental rather than an editorial "close enough" call.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev/test | ✓ | v22.22.0 | — |
| npm | Package scripts | ✓ | 11.10.0 | — |
| Playwright | E2E suite (`spectator-sync.spec.ts`) | ✓ | 1.60.0 | — |
| Vitest (unit + browser projects) | Component tests | ✓ | ^4.1.8 (package.json) | — |
| Physical Chromecast device + TV | DISP-03 final on-device UAT (Chrome 90 @ 1280×720) | ✗ (not verifiable from this environment) | — | **No fallback — human-required.** This is by design per CONTEXT.md: "Phase closes via human on-device UAT... this pause at end-of-phase is by design, not a failure." |

**Missing dependencies with no fallback:**
- Physical Chromecast/TV for the end-of-phase DISP-03 UAT checklist. This is an expected, planned human checkpoint, not a phase blocker to resolve in code.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.8 (two projects: `unit` and `browser`, per `package.json` scripts `test:unit` / `test:browser`) + Playwright ^1.60.0 for E2E |
| Config file | `playwright.config.ts` (repo root); Vitest project config inferred from `package.json` scripts (no separate `vitest.config.ts` found at repo root during this research — confirm exact config location during planning if a dedicated file exists elsewhere) |
| Quick run command | `npx vitest run --project=browser src/ui/display/` (targeted display component tests) |
| Full suite command | `npm test` (all Vitest projects) `&&` `npx playwright test` (full E2E, includes the 3 `spectator-sync.spec.ts` specs) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | Player panels use `--display-*` scale, active-edge + glow + tint, inactive 55% opacity | component (visual values not asserted by existing tests — CSS-only verification is manual/on-device) | `npx vitest run --project=browser src/ui/display/PlayerPanel.test.ts` (structural assertions only: class names, text content — unaffected by CSS value changes, confirmed by reading the file) | ✅ exists, green before/after by design |
| DISP-02 | MatchHeader + panel backgrounds, bloom, ● separators | component (no dedicated `MatchHeader.test.ts` exists) | Manual/visual verification only — no automated test file to run | ❌ no test file exists; not a Wave 0 gap per se (UI-SPEC/CONTEXT.md do not request adding one — visual-only changes on a component with stable props) |
| DISP-03 | Chrome 90 receiver renders correctly, `@supports` fallbacks work | manual-only (justification: Chrome 90 cannot be emulated locally — CONTEXT.md explicitly defers this to end-of-phase human on-device UAT) | N/A — human checklist | N/A |
| DISP-04 | All display behavior unchanged (sync, idle, banners, win overlay, pause) | E2E (regression net) | `npx playwright test e2e/spectator-sync.spec.ts` (3 specs); plus full Vitest suite for `LegWinBanner.test.ts`, `PlayerPanel.test.ts`, `VisitLine.test.ts`, `SpectatorChooser.test.ts` | ✅ all exist, all must stay green (2 planned string updates in `VisitLine.test.ts` are the only expected diffs) |

### Sampling Rate

- **Per task commit:** `npx vitest run --project=browser src/ui/display/` (fast — seconds, covers the three components under active edit)
- **Per wave merge:** `npm test && npx playwright test` (full suite — confirms no cross-component regression, especially `spectator-sync.spec.ts`'s exact-text selectors)
- **Phase gate:** Full suite green before `/gsd-verify-work`, followed by the human on-device Chromecast UAT checklist (DISP-03) as the final phase-closing step — this is a planned pause, not a failure state.

### Wave 0 Gaps

None — existing test infrastructure (`PlayerPanel.test.ts`, `LegWinBanner.test.ts`, `VisitLine.test.ts`, `SpectatorChooser.test.ts`, `e2e/spectator-sync.spec.ts`) already covers every automatable phase requirement. The two required test-string updates (`VisitLine.test.ts` miss + outer-bull assertions, see Pitfall 2) are planned edits to existing files, not new test infrastructure.

## Security Domain

`security_enforcement` is enabled (ASVS level 1) per `.planning/config.json`, but this phase introduces no new attack surface: no new user input, no new data handling, no new network calls, no new auth/session logic. All ASVS categories below are marked not-applicable for this specific phase's diff.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface on `/display`; unchanged this phase |
| V3 Session Management | No | No session state introduced |
| V4 Access Control | No | `/display` remains a public, unauthenticated local route (unchanged architectural decision, out of this phase's scope) |
| V5 Input Validation | No | Zero new user input this phase — all changes are CSS values and two hardcoded string literals in a pure-function formatter; `player.name` interpolation is pre-existing (`{player.name}` at `PlayerPanel.svelte:141`) and already uses Svelte's default-escaped `{interpolation}`, never `{@html}` (confirmed by the file's own header comment: "Player name rendered via Svelte {interpolation} only (T-03-04: no {@html})") — this phase does not touch that binding |
| V6 Cryptography | No | Not applicable — no crypto in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via player name rendered on a shared/broadcast display | Tampering / Info Disclosure | Already mitigated pre-existing: Svelte's default text interpolation auto-escapes; `{@html}` is explicitly forbidden by code comment and never used in `PlayerPanel.svelte`/`MatchHeader.svelte`/`VisitLine.svelte`. This phase does not modify any name-rendering binding — verify no new `{@html}` is introduced anywhere in the diff as a plan-checker gate. |

## Sources

### Primary (HIGH confidence — direct codebase reads this session)
- `src/ui/display/PlayerPanel.svelte` (full file) — current CSS, `@supports` fallback architecture, formatDart
- `src/ui/display/MatchHeader.svelte` (full file) — current CSS, no `@supports` needed confirmed
- `src/routes/display/+page.svelte` (full file) — route shell, receiver detection, dvh fallback pattern
- `src/ui/display/VisitLine.svelte` + `VisitLine.test.ts` (full files) — dead-code status confirmed, exact test assertions needing update identified
- `src/ui/input/dart-notation.ts` — shared long-form notation, explicit comment warning against VisitLine reuse
- `src/ui/display/PlayerPanel.test.ts`, `LegWinBanner.test.ts` (full files) — confirmed no CSS-value assertions, only class/text assertions unaffected by restyle
- `e2e/spectator-sync.spec.ts` (full file) — confirmed exact-text selectors (`getByText('501'/'321'/'141', {exact:true})`) target `.remaining-score`'s isolated text node, unaffected by any FIX row in UI-SPEC
- `src/styles/{colors,typography,elevation}.css` (full files) — confirmed `--display-*` tokens already exist; confirmed every existing amber/red tint token is a precomputed static value, never live `color-mix()`
- `src/routes/match/+page.svelte:440-509` — explicit in-code documentation of the project-wide "precompute color-mix to static rgba" rule, with a second concrete precedent
- `design/components/display/{MatchHeader,PlayerPanel}.jsx`, `design/components/scoring/DartPill.jsx` (full files) — literal DS source of truth, confirmed `color-mix()` usage and the DartPill outer-bull discrepancy
- `.planning/phases/11-spectator-display/11-CONTEXT.md`, `11-UI-SPEC.md` (full files) — locked decisions and diff tables
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json` — requirement IDs, decision history, workflow toggles
- `package.json` — dependency versions; `node --version` / `npm --version` / `npx playwright --version` — runtime versions [VERIFIED: local tool invocation]
- `git log --oneline --grep` — confirmed on-device UAT evidence for the existing Chrome-90 `@supports` architecture (commits `35ec3c8`, `016eebb`, `1ce517a`, `8d3fecc`, `e61190c`)

### Secondary / Tertiary
None used — this phase required zero external web research; it is a closed-world transcription task fully answerable from the repository and the approved design system files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, versions read directly from `package.json` and confirmed by local CLI invocation
- Architecture: HIGH — every pattern cited is read directly from the currently-shipped file with line numbers, not inferred
- Pitfalls: HIGH — the color-mix/Chrome-90 finding is grounded in two separate in-code comments already present in the repository documenting the exact same rule for prior phases, not a novel inference

**Research date:** 2026-07-14
**Valid until:** No expiry driver — this research is tied to the current state of the `design/` DS source files and `src/ui/display/` components, not to any external package ecosystem. Re-research only if `11-UI-SPEC.md` or the DS `.jsx` sources change before planning begins.
