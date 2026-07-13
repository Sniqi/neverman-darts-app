# Phase 8: Design Foundation - Research

**Researched:** 2026-07-13
**Domain:** CSS design-token architecture, self-hosted webfonts in a Vite/SvelteKit PWA, motion-token retiming
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token-Adoption & Struktur**
- DS token files are copied into `src/styles/` (5 files mirroring `design/tokens/`: fonts, colors, typography, spacing, elevation), imported from `app.css`. `design/` stays an untouched, re-syncable reference — the app build must not depend on it (font paths there don't resolve from src anyway).
- Full migration to DS token names. No alias layer. Name collisions with changed values (`--radius-sm` 8→12px, `--radius-md` 12→16, `--radius-lg` 16→20, `--surface-2` #262932→#1d2330, `--accent-soft`, `--accent-line`, `--shadow-*`) are intentional DS shifts — every existing `var()` usage gets sanity-checked during the sweep (e.g. an element that must stay 8px now uses `--radius-xs`).
- All 349 hardcoded hex + 89 rgba() occurrences are replaced with DS tokens in this phase (FOUND-01 demands zero provisional colors). Where a later component spec defines an exact treatment (gradients, sheens), use the nearest token now; the exact treatment lands in Phases 9–12.
- Verification is grep-based + tests: old provisional values (`#e8a020`, `#111318`, `#1e2027`, `#f0f0f0`, `#c0392b`, `#262932`, `#888`, `#444`, `#333`, `#2d2d2d` …) must have 0 matches in `src/`; all ~511 tests stay green; visual spot-check via dev server.

**Fonts & Offline (FOUND-02)**
- Convert TTF → WOFF2 (`pip install fonttools brotli`, then convert the 7 files; ~540 KB → ~250 KB precache). Ship `OFL.txt` alongside. If conversion tooling fails in practice, shipping the TTFs unchanged is the accepted fallback (decision: prefer WOFF2, TTF acceptable).
- Fonts live under `src/styles/fonts/`, referenced with relative `url()` from the fonts CSS → Vite hashes them into `_app/immutable/assets/` (subpath-safe under `/neverman-darts-app`). Add `woff2` (and `ttf` if shipped) to the PWA `globPatterns` in `vite.config.ts` so fonts precache for full offline.
- `font-display: swap` (DS default — text renders immediately in system-ui, swaps to Barlow).
- All 7 weights ship: Barlow 400/500/600/700 + Barlow Semi Condensed 600/700/800 (exactly the files in `design/assets/fonts/`).

**Chrome-90-sichere Tokens (Cast-Receiver)**
- `color-mix(in oklab, …)` is precomputed to static rgba values for all 7 derived tokens (`--accent-soft`, `--accent-line`, `--focus-ring`, `--destructive-soft`, `--destructive-line`, `--positive-soft`, `--glow-accent`). No runtime color-mix anywhere — deterministic, Chrome-90-safe, minifier-safe (per v1.1 decision: no duplicate-property fallbacks). Compute the statics from the DS base colors so they match the DS intent (13%/45%/65%/14%/40%/13%/18% alpha mixes ≈ base color at that alpha).
- cqw display tokens (`--display-*`) are defined 1:1 now (inert until used); `@supports` fallback strategy at usage sites is Phase 11 work.
- Global reduced-motion collapse adopted verbatim from DS elevation.css (`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important } }`).
- DS base styles adopted completely from typography.css: body (bg/color/font/size/line-height/antialiased), link colors, `::selection`, `:focus-visible` (3px amber ring).

**Motion & Phasen-Abgrenzung (FOUND-04)**
- All 21 existing keyframes/transitions are retimed to token durations/easings in this phase (100–300ms, `--dur-*`, `--ease`, `--ease-spring`) — success criterion 4 names button press, dialog open, shake, score float explicitly.
- Press states: define `--press-scale: 0.97` / `--press-opacity` tokens and apply the press scale where components already have `:active` styles. The full DS Button treatment (gradient, inner sheen, on-accent text) is Phase 9 — do not build it now.
- Keyframes stay component-local (Svelte scoped CSS) consuming global duration/ease tokens — Svelte idiom, no global keyframe utilities.
- Base typography applies now: Barlow globally via body; `--font-score` + `font-variant-numeric: tabular-nums` applied to existing score displays (ScorePanel, PlayerPanel, Numpad digits/entry, StatCards, display surfaces) so FOUND-02's "all score numerals" holds at phase end.

### Claude's Discretion
- Exact static rgba values for the precomputed color-mix tokens (match DS alpha intent).
- Whether to preload the most critical font files (e.g. Barlow-Regular, BSC-Bold) via `<link rel="preload">` — optional, decide during implementation.
- Per-usage judgment calls in the sweep when a provisional value has no obvious DS token (map to nearest DS token by role: text/muted/surface-step/line).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. (Component-exact treatments intentionally deferred to Phases 9–12 per phase boundary.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | User sees the DS color world on every screen — page bg `#0c0e14`, layered surfaces (`#161a23`/`#1d2330`/`#29303f`), amber accent `#f0a424` with gradient fills, semantic red/green — no provisional v1.0 colors remain anywhere | Standard Stack (token file copy), Pattern 1–3 (color-mix substitution, full migration, fallback cleanup), Pitfall 1 & 3 (test/data literal-value risks), Validation Architecture test map |
| FOUND-02 | User sees Barlow for all UI text and Barlow Semi Condensed for all score numerals (`tabular-nums`), self-hosted (OFL) with `system-ui` fallback — fonts load offline via the PWA precache | Standard Stack (fonttools/brotli, verified WOFF2 conversion), Architecture Diagram (font pipeline), Pitfall 4 (globPatterns), Code Examples (conversion command, globPatterns snippet) |
| FOUND-03 | Spacing (strict 4px multiples), radii (8/12/16/20/999) and elevation (1px alpha hairlines + layered shadows + top edge-highlight) follow the DS tokens on every surface | Pattern 2 (full migration, radius collision handling), Standard Stack token file list |
| FOUND-04 | Motion follows the DS spec — 100–300ms, standard ease `cubic-bezier(.2,0,0,1)`, spring for switch/dialog pop, invalid-input shake, score floats — and collapses fully under `prefers-reduced-motion` | Pattern 4 (retiming), Pitfall 2 (motion-duration contradiction — Open Questions 1–2), Pitfall 5 (reduced-motion is new code), Validation Architecture (Wave 0 reduced-motion test gap) |
</phase_requirements>

## Summary

Phase 8 is a pure token/foundation restyle with no new npm dependencies and no functional changes. The work is: (1) copy 5 DS token CSS files from `design/tokens/` into `src/styles/`, (2) convert 7 TTF fonts to WOFF2 and wire them into Vite + the PWA precache, (3) sweep ~391 hardcoded hex + ~96 `rgba()` occurrences across 44 `.svelte` files to DS token `var()` references, and (4) retime 21 existing `@keyframes`/transitions to the DS's `--dur-*`/`--ease` tokens plus add the global `prefers-reduced-motion` collapse (currently absent).

Everything needed is already verified locally: the DS token files exist and were read in full (`design/tokens/{colors,typography,spacing,elevation,fonts}.css`), WOFF2 conversion was tested end-to-end in this session (Barlow-Regular.ttf 104KB → 38KB, 63% reduction — consistent with the DS's precompute strategy), and Vite's CSS `url()` rebasing is official, documented behavior that requires no extra configuration beyond what `svelte.config.js` already sets up for the GitHub Pages subpath.

Three concrete risks surfaced during verification that the planner must account for: (1) a browser test (`ReloadPrompt.test.ts`) hardcodes the **old** accent color as a literal `rgb()` assertion and will fail once `--accent` changes — this is an expected, in-scope test update, not a regression; (2) the DS's own prose (`design/readme.md`) documents shake at 400ms and score-float at 1.6s, both **outside** the 100–300ms band that FOUND-04 and CONTEXT.md mandate for "all 21 keyframes" — this is a real internal contradiction in the design system that needs an explicit resolution, not a silent pick; (3) `Profile.color` defaults to the old accent hex as **stored application data** (not CSS), and is asserted in three test fixtures — grep-based verification will flag it, but changing it is arguably a "functional" change the milestone claims to avoid.

**Primary recommendation:** Do the sweep in the order token-files → fonts → base/motion → per-file color/spacing/radius sweep → keyframe retiming → verification, and resolve the two ambiguities above (motion outliers, Profile.color default) as explicit planning decisions before task-writing, not as sweep-time judgment calls.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DS token definitions (color/type/space/elevation/motion) | Browser / Client (CSS) | — | Static `:root` custom properties, no build-time logic beyond Vite asset processing |
| Self-hosted font delivery + offline precache | Browser / Client (CSS `@font-face`) + Build tool (Vite/PWA) | — | Vite hashes/serves the font files; vite-plugin-pwa's Workbox config decides what's precached for offline |
| App-wide color/spacing/radius/elevation sweep | Browser / Client (Svelte scoped `<style>`) | — | Every `.svelte` component's own `<style>` block; no shared component layer to intercept this |
| Motion retiming + reduced-motion collapse | Browser / Client (CSS `@keyframes` + global media query) | — | Component-local keyframes consuming global duration tokens; the reduced-motion collapse is a single global rule |
| Build/asset pipeline (WOFF2, subpath hashing) | Build tool (Vite) | CDN/Static (GitHub Pages serving) | Vite resolves relative `url()` in CSS at build time; GitHub Pages just serves the resulting static files |

There is no API/backend or Database tier involved — Phase 8 touches only the client-side presentation layer and the build configuration that ships it.

## Standard Stack

### Core
No new runtime libraries. This phase consumes what's already installed:

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.16 [VERIFIED: package.json] | CSS `url()` resolution, asset hashing, base-path rewriting | Already in use; handles font asset pipeline with zero new config beyond adding extensions to PWA globPatterns |
| @vite-pwa/sveltekit | 1.1.0 [VERIFIED: package.json] | Service worker / precache manifest generation | Already in use; `workbox.globPatterns` is the single touch point for this phase |
| SvelteKit / Svelte | 2.64.0 / 5.56.3 [VERIFIED: package.json] | Scoped component `<style>` blocks | Already in use; no new API needed — tokens are plain CSS custom properties |

### Supporting (dev-time only, not shipped)

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| fonttools | 4.63.0 [VERIFIED: pip show, installed and exercised this session] | TTF→WOFF2 conversion | Run once during this phase's font-conversion task; not a runtime/npm dependency, not bundled |
| brotli | 1.2.0 [VERIFIED: pip show, installed and exercised this session] | Compression backend fonttools' WOFF2 module requires | Installed alongside fonttools; same one-time use |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fonttools` CLI (Python) | Online TTF→WOFF2 converters, `google-webfonts-helper`, Node `wawoff2` package | CONTEXT.md already locked the `pip install fonttools brotli` approach with TTF-only as an accepted fallback; no reason to introduce a new npm dependency for a one-time dev-time conversion |
| Manual per-file color sweep | A build-time PostCSS lint rule banning raw hex/rgba in `.svelte` `<style>` blocks | Out of scope for Phase 8 (CONTEXT.md specifies grep-based verification only); worth flagging as a possible Phase 9+ or tooling follow-up, not required now |

**Installation (dev-time, not added to package.json):**
```bash
pip install fonttools brotli
python -m fontTools.ttLib.woff2 compress "design/assets/fonts/Barlow-Regular.ttf" -o "src/styles/fonts/Barlow-Regular.woff2"
# repeat per font file, or loop over design/assets/fonts/*.ttf
```
**Version verification:** `pip show fonttools brotli` confirmed 4.63.0 / 1.2.0 installed and working in this environment during research (see Code Examples below for the exact command used).

## Package Legitimacy Audit

No npm packages are installed by this phase. Two Python/pip tools are installed dev-time-only (not bundled into the app, not added to `package.json`) to run a one-time font conversion.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| fonttools | pypi | long-established project; latest release 2026-05-14 [VERIFIED: package-legitimacy seam] | unknown (PyPI download-count API unavailable to the checker) | github.com/fonttools/fonttools [VERIFIED] | SUS (reason: `unknown-downloads` only) | Approved — see note |
| brotli | pypi | long-established project; latest release 2025-11-05 [VERIFIED: package-legitimacy seam] | unknown (PyPI download-count API unavailable to the checker) | github.com/google/brotli [VERIFIED] | SUS (reason: `unknown-downloads` only) | Approved — see note |

**Note on the SUS verdicts:** both packages resolve to their canonical, long-standing official repositories (`fonttools/fonttools`, the reference Python font-tooling library; `google/brotli`, Google's own compression library) and were installed and successfully exercised in this research session — WOFF2 conversion ran end-to-end (see Code Examples). The `SUS` verdict here is driven purely by the checker's `unknown-downloads` signal (PyPI weekly-download stats aren't queryable through this tool), not by any name-squatting, deprecation, or missing-repo signal. Per protocol, the planner should still add a `checkpoint:human-verify` step before the `pip install` task, but the risk is low and the packages are dev-only (never shipped to the browser).

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** fonttools, brotli — planner should add a lightweight `checkpoint:human-verify` before the pip install task (dev-time only; see note above)

## Architecture Patterns

### System Architecture Diagram

```
design/tokens/*.css (source of truth, untouched)
        │  (one-time copy, this phase)
        ▼
src/styles/{colors,typography,spacing,elevation,fonts}.css  ──┐
        │  (imported by)                                       │ referenced by
        ▼                                                      ▼
src/app.css (or src/styles/index.css)              src/styles/fonts/*.woff2 (+.ttf fallback)
        │  (imported by)                                       │ (relative url() in fonts.css)
        ▼                                                      ▼
src/routes/+layout.svelte (global entry) ──────────► Vite build: resolves url(), hashes
        │                                             into _app/immutable/assets/, rebases
        │ (every component renders using)             for BASE_PATH subpath
        ▼
src/ui/**/*.svelte + src/routes/**/*.svelte
   - hardcoded hex/rgba  ──sweep──►  var(--token)
   - arbitrary radii     ──sweep──►  var(--radius-*)
   - @keyframes durations──retime─►  var(--dur-*), var(--ease*)
        │
        ▼
vite.config.ts → SvelteKitPWA workbox.globPatterns
   adds 'woff2' (+'ttf' if shipped) so fonts precache
        │
        ▼
Offline-installed PWA: fonts + tokens load from SW cache,
no network dependency after first install
```

### Recommended Project Structure
```
src/
├── styles/
│   ├── colors.css        # copied from design/tokens/colors.css, verbatim values
│   ├── typography.css    # copied verbatim + base body/link/selection/:focus-visible rules
│   ├── spacing.css       # copied verbatim
│   ├── elevation.css     # copied verbatim + global reduced-motion media query
│   ├── fonts.css         # @font-face rules, url() pointing into ./fonts/
│   └── fonts/
│       ├── Barlow-Regular.woff2 (+ .ttf if shipping both)
│       ├── Barlow-Medium.woff2
│       ├── Barlow-SemiBold.woff2
│       ├── Barlow-Bold.woff2
│       ├── BarlowSemiCondensed-SemiBold.woff2
│       ├── BarlowSemiCondensed-Bold.woff2
│       ├── BarlowSemiCondensed-ExtraBold.woff2
│       └── OFL.txt
├── app.css                # entry point importing the 5 styles/*.css files (or a new styles/index.css does this — Claude's discretion per CONTEXT.md)
└── routes/+layout.svelte  # imports the entry CSS (unchanged import path/mechanism)
```

### Pattern 1: Chrome-90-safe static rgba instead of `color-mix()`
**What:** The DS token files (`colors.css`, `elevation.css`) define `--accent-soft`, `--accent-line`, `--focus-ring`, `--destructive-soft`, `--destructive-line`, `--positive-soft`, `--glow-accent` using `color-mix(in oklab, var(--accent) X%, transparent)`. CONTEXT.md locks these to precomputed static `rgba()` values instead, because the Chromecast receiver runs Chrome 90 which does not support `color-mix()`.
**When to use:** Every one of these 7 derived tokens, in the copied `src/styles/colors.css` and `src/styles/elevation.css` — do not carry over the `color-mix()` syntax from `design/tokens/`.
**Example:**
```css
/* design/tokens/colors.css has: */
--accent-soft: color-mix(in oklab, var(--accent) 13%, transparent);

/* src/styles/colors.css must have instead: */
--accent-soft: rgba(240, 164, 36, 0.13);   /* --accent #f0a424 at 13% alpha */
```
`color-mix(in oklab, X%, transparent)` is visually equivalent to an alpha-scaled `rgba()` of the same base color — this is a straightforward substitution, not an approximation, as long as the base hex and the percentage match exactly (already provided in the UI-SPEC's derived-token table).

### Pattern 2: Full token migration with no alias layer
**What:** Every `var(--token)` call site in `src/` must resolve against the *new* DS values, including names that already exist under the old app.css but changed value (`--radius-sm` 8→12px, `--radius-md` 12→16px, `--radius-lg` 16→20px, `--surface-2` `#262932`→`#1d2330`).
**When to use:** During the per-component sweep — grep for every `var(--radius-*)`, `var(--surface-*)`, `var(--accent-*)`, `var(--shadow-*)` call site and visually re-verify, since the same variable name now means a different pixel/color value.
**Example:**
```css
/* Before (Phase 1 provisional): */
border-radius: var(--radius-sm); /* was 8px */

/* After: if this element must stay 8px visually, it now needs: */
border-radius: var(--radius-xs); /* 8px in the new scale */
/* If it's fine growing to 12px (buttons/keys/chips/inputs — the DS intent for --radius-sm), leave as var(--radius-sm) */
```

### Pattern 3: `var(--token, #fallback)` cleanup
**What:** 52 call sites in `src/` use the pattern `var(--accent, #e8a020)` (a CSS custom-property fallback). Because `--accent` is always defined in `:root`, this fallback is dead code today — but it still contains the literal old hex the grep-verification gate checks for.
**When to use:** During the sweep, update every occurrence's fallback literal to the new value (`var(--accent, #f0a424)`), or drop the fallback entirely (`var(--accent)`) since `:root` always defines it. Either satisfies the "0 matches of old provisional hex" gate; dropping the fallback is simpler and removes now-meaningless dead code.
**Example:**
```css
/* Found 52× across src/ui/** and src/routes/** , e.g.: */
border-color: var(--accent, #e8a020);
color: var(--accent, #e8a020);

/* Sweep to: */
border-color: var(--accent);
color: var(--accent);
```

### Pattern 4: Motion retiming to DS duration/ease tokens
**What:** Existing `animation:`/`transition:` declarations hardcode ms values (`200ms`, `150ms`, `0.2s`, etc.) rather than referencing `--dur-*`/`--ease*` tokens.
**When to use:** Every one of the 21 `@keyframes` blocks and their companion `animation:`/`transition:` declarations.
**Example:**
```css
/* Before: */
animation: dialogIn 200ms ease-out;

/* After: */
animation: dialogIn var(--dur-med) var(--ease);
```

### Anti-Patterns to Avoid
- **Global keyframe utility classes:** CONTEXT.md explicitly keeps keyframes component-local (Svelte scoped `<style>`). Do not extract shared `@keyframes fadeIn { … }` into a global stylesheet even though several components duplicate similarly named keyframes (`fadeIn` appears in 3+ files) — that's a refactor beyond this phase's scope.
- **Building the full Button/Chip/Dialog visual treatment now:** Phase 8 only applies press-scale (`--press-scale: 0.97`) to existing `:active` styles. Gradient CTAs, inner sheen, on-accent text belong to Phase 9 (COMP-01) — resist the urge to "finish" a component while touching its colors.
- **Wiring `--display-*` cqw tokens into layout:** They're defined now (inert) but not used at any call site — Phase 11 wires them up with `@supports` fallbacks for Chrome 90.
- **Restyling the Dartboard component:** `--board-*` tokens ship now; only swap the Dartboard's own hardcoded hex for the nearest token if it has any — full board treatment is Phase 10 (SCOR-02).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TTF→WOFF2 conversion | A custom Node/WASM font-subsetting script | `fonttools`'s `ttLib.woff2` module (pip) | It's the reference implementation Google/W3C tooling uses; verified working in this session, zero custom code needed |
| CSS asset path rewriting for the GitHub Pages subpath | Manual string-replace of `url()` paths post-build | Vite's built-in CSS `url()` rebasing (already active, already handles the project's other assets) | Vite's own docs: "CSS `url()` references... are always automatically rebased to ensure correctness" — reinventing this risks breaking the exact subpath issue the project already fixed once (see `svelte.config.js` comment re: RECV-01) |
| Detecting leftover provisional colors | Manual visual QA only | `grep -rn` for the documented old-value list, ideally captured as an automated Node/Vitest unit test (see Validation Architecture) | Manual visual QA can't catch every one of 391 hex + 96 rgba occurrences across 44 files reliably; a grep-based test is deterministic and repeatable on every future PR |

**Key insight:** Nothing in this phase requires new tooling — it's a disciplined, mechanical sweep. The main risk isn't "needing a library," it's under-verifying: relying on eyeballing 44 files instead of a grep/test gate.

## Common Pitfalls

### Pitfall 1: A browser test hardcodes the OLD accent color as a literal assertion
**What goes wrong:** `src/ui/pwa/ReloadPrompt.test.ts` (test `PLAT-04`, lines 86–95) asserts `getComputedStyle(toast).borderColor` matches `rgb(232, 160, 32)` — the RGB form of the old `#e8a020` accent. Once `--accent` becomes `#f0a424` (`rgb(240, 164, 36)`), this test will fail.
**Why it happens:** The test was written to lock in a specific rendered value, and that value is exactly the provisional color this phase replaces.
**How to avoid:** Update the test's expected value to `rgb(240, 164, 36)` as part of the sweep task that touches `ReloadPrompt.svelte`. This is an intentional, in-scope test update (the milestone's "tests stay green" bar means tests reflect the new correct DS value, not that the old value is preserved) — plan this explicitly as a task, don't discover it as a surprise test failure.
**Warning signs:** Any other test asserting a specific `rgb()`/`#hex` value via `getComputedStyle` will have the same failure mode — confirmed via full-repo search that this is the *only* such assertion (searched all `*.test.ts` for hex/rgb literals); `LegWinBanner.test.ts` and `PauseOverlay.test.ts` also call `getComputedStyle` but only assert `position: fixed`, not colors.

### Pitfall 2: The DS's own prose contradicts its own duration-token ceiling for two named animations
**What goes wrong:** `design/readme.md` states "invalid input shakes ±6px/**400ms**" and "score floats rise & fade **1.6s**" — both exceed the `--dur-slow: 300ms` ceiling. But CONTEXT.md's locked decision says "All 21 existing keyframes/transitions are retimed to token durations/easings in this phase (100–300ms...) — success criterion 4 names button press, dialog open, shake, score float explicitly," and the phase's own source-of-truth precedence rule states "tokens win for values, readme for intent." Measured current values confirm the conflict: `Numpad.svelte:126` shake is `400ms`; `Dartboard.svelte:301` score-float is `1.6s`; additionally `PlayerPanel.svelte:396` liveRowPulse is `1.6s infinite` and `PauseOverlay.svelte:121` zeroFlashFade is `800ms` (neither of these two is named in success criterion 4, so their status is even less clear).
**Why it happens:** The DS prose spec appears to describe the *felt* animation timing from the original design mockup, while the token scale was finalized afterward with a strict 300ms ceiling for "interactive transitions" — the two were never reconciled.
**How to avoid:** This must be resolved as an explicit planning/discuss decision, not a silent sweep choice, because both readings are defensible:
  - **Reading A (strict):** Compress shake to `--dur-slow` (300ms) and cap score-float's DS-token-driven portion at 300ms too — satisfies the literal "100–300ms" text and the "tokens win for values" rule, but changes the felt animation (a visible behavior change, not just a token rename).
  - **Reading B (scoped):** Success criterion 4 is about the four *named* interactive-transition categories using token durations (i.e., they must *reference* `--dur-*`/`--ease` rather than a bespoke literal ms value) — but the specific numeric target for shake/float can stay close to their current felt duration by composing tokens (e.g., `calc(var(--dur-slow) * 1.33)` for 400ms, or simply keeping non-token bespoke values for the two decorative/ambient animations named in `design/readme.md` while everything else strictly uses `--dur-*`). `liveRowPulse` (continuous, infinite) and `zeroFlashFade` (800ms, not named in criterion 4) would then plausibly keep their current durations since they're not literal "interactive transitions."
  Recommend the planner surface this exact tension to the user (via `checkpoint:human-verify` or a quick clarifying question at plan-time) rather than picking one reading during task-writing — this directly affects whether FOUND-04's UAT / success-criterion-4 check passes.
**Warning signs:** Any UAT/verification step that eyeballs "does the shake/float feel right" without a numeric target will not catch a silent wrong choice here — the verification step must state which reading was chosen and the resulting concrete ms value per keyframe.

### Pitfall 3: `Profile.color` is stored application DATA using the old accent hex — not a CSS token
**What goes wrong:** `src/db/profiles.ts` sets `color: '#e8a020'` as the default value assigned to every newly created player profile (`Profile.color: string`, per `src/db/db.ts:11`). This is persisted application data (a Dexie/IndexedDB field), not a CSS custom property. It's also asserted literally in three test fixtures: `src/db/profiles.test.ts:20`, `src/lib/backup.test.ts:25,61,80`. The grep-based verification gate ("0 matches of `#e8a020` in `src/`") will flag these files exactly like it flags real CSS — but changing this default is a **data/behavior** change, which REQUIREMENTS.md's "pure restyling... no functional changes" milestone character explicitly tries to avoid.
**Why it happens:** The old accent hex was reused as a convenient default "player color" at some point in v1.0/v1.1 development, coupling business data to what was then the app's only accent color.
**How to avoid:** A search of every `.svelte` file found no place that currently *renders* `Profile.color` visually (`grep` for `profile.color`/`player.color`/similar usage in `.svelte` files returned nothing) — it appears to be a currently-unused/reserved data field. Given that, updating the default to `#f0a424` is low-risk (no visible behavior changes because nothing reads it today) and keeps the grep gate meaningful; the three test fixtures would need trivial literal updates in the same commit. Still, this is a genuine gray area against the "no functional changes" framing — recommend the planner flag it as an explicit task with a one-line rationale ("default profile color updated for DS consistency; field is currently unused by any UI") rather than silently changing or silently excluding it from the sweep.
**Warning signs:** If a future phase (9–12) starts rendering `Profile.color` visually, an unswept `#e8a020` default would silently reintroduce the old provisional color into the UI.

### Pitfall 4: Adding font extensions to PWA `globPatterns` is required, not automatic
**What goes wrong:** `vite.config.ts`'s `workbox.globPatterns` currently lists `'client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'` — no font extensions. Fonts referenced only via CSS `url()` and hashed into `_app/immutable/assets/` will build and work online, but will **not** be precached for offline use unless their extension is explicitly added.
**Why it happens:** Workbox's `globPatterns` is an explicit allowlist; it does not infer "any asset referenced by CSS" automatically. This is a known gotcha (confirmed via community reports — vite-plugin-pwa issue #243) and this project's own comments already show awareness of the same class of issue for `mp3` files ("mp3 explicitly included so SFX are precached for offline play (Pitfall 4)" — the SFX pitfall from a prior phase).
**How to avoid:** Add `woff2` (and `ttf` if shipping both/TTF-fallback) to the `globPatterns` array: `'client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3,woff2,ttf}'`.
**Warning signs:** Fonts render correctly on first (online) load but the PWA fails the "works fully offline after install" check, or repeat installs show `system-ui` fallback text only after going offline — this is the litmus test to include in Wave 0 / verification, not just visual spot check.

### Pitfall 5: Reduced-motion collapse doesn't exist yet — it's new code, not "carried over"
**What goes wrong:** Neither `src/app.css` nor any other current stylesheet has a `prefers-reduced-motion` media query (confirmed: zero matches for `prefers-reduced-motion`/`reduced-motion`/`reducedMotion` anywhere in `src/`). Success criterion 4 requires animations to "stop moving entirely when reduce motion is enabled" — this is currently unimplemented, not a pre-existing behavior being preserved.
**Why it happens:** The provisional v1.0 styling never addressed accessibility motion preferences.
**How to avoid:** Add the exact block from `design/tokens/elevation.css` verbatim to the global entry stylesheet (see Code Examples). Because `!important` on `animation-duration`/`transition-duration` universally overrides all component-level durations, this one rule handles every keyframe/transition in the app — including the "outlier" cases from Pitfall 2 — without needing per-component reduced-motion logic.
**Warning signs:** No test currently exercises this. Recommend Wave 0 add a browser test that sets `prefers-reduced-motion: reduce` (via Playwright's `page.emulateMedia` or a CSS-media mock) and asserts a representative animated element's computed `animationDuration`/`transitionDuration` is `0.01ms` — otherwise FOUND-04's reduced-motion clause has zero automated coverage.

## Code Examples

### Verified: WOFF2 conversion command (tested in this session)
```bash
# Source: fonttools official docs (pypi.org/project/fonttools) + verified by running this
# exact command against a real project font file during this research session.
pip install fonttools brotli
python -m fontTools.ttLib.woff2 compress "design/assets/fonts/Barlow-Regular.ttf" -o "src/styles/fonts/Barlow-Regular.woff2"
# Result observed: Barlow-Regular.ttf 104,068 bytes -> Barlow-Regular.woff2 38,456 bytes (~63% smaller)
```
Measured total for all 7 files if converted at a similar ratio: source TTFs total ~740 KB (108220+103536+104068+108348+111772+112096+109772 bytes measured via `ls -la design/assets/fonts/`); at the observed ~63% reduction, expect a WOFF2 total in the ~270–280 KB range (CONTEXT.md's own "~540 KB → ~250 KB" estimate is in the same ballpark, though the actual source total measured is closer to 740 KB than 540 KB — convert all 7 and measure exactly, don't assume the estimate is precise).

### Global reduced-motion collapse (adopt verbatim per CONTEXT.md)
```css
/* Source: design/tokens/elevation.css, copied as-is */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Chrome-90-safe derived token substitution
```css
/* Source: 08-UI-SPEC.md derived-token table + design/tokens/colors.css intent */
:root {
  --accent-soft: rgba(240, 164, 36, 0.13);
  --accent-line: rgba(240, 164, 36, 0.45);
  --focus-ring: rgba(240, 164, 36, 0.65);
  --destructive-soft: rgba(229, 72, 77, 0.14);
  --destructive-line: rgba(229, 72, 77, 0.40);
  --positive-soft: rgba(61, 214, 140, 0.13);
  --glow-accent: 0 0 28px rgba(240, 164, 36, 0.18);
}
```

### PWA globPatterns update
```ts
// Source: vite.config.ts (existing file) — add font extensions to the existing array
workbox: {
  globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3,woff2,ttf}'],
  // ...rest unchanged
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Provisional 5-color flat token set (`src/app.css`, 42 lines) | 5-file DS token architecture (colors/typography/spacing/elevation/fonts), ~217 lines total | This phase | Establishes the full palette/type/motion system the rest of v1.2 (Phases 9–12) builds on |
| System-ui only, no self-hosted fonts | Barlow + Barlow Semi Condensed self-hosted, WOFF2 + `font-display: swap` | This phase | First custom typography in the app; must stay fully offline-capable per PWA constraint |
| No reduced-motion handling | Global `prefers-reduced-motion` collapse | This phase | First accessibility motion accommodation in the app |

**Deprecated/outdated:**
- `src/app.css`'s 5 provisional colors (`--bg #111318`, `--surface #1e2027`, `--accent #e8a020`, `--destructive #c0392b`, `--text #f0f0f0`) and 3 provisional elevation tokens (`--radius-sm/md/lg` at 8/12/16px, `--surface-2 #262932`) — all superseded by DS values with the *same variable names* but different pixel/hex values (see Pattern 2 above — this is the single biggest sweep-verification risk).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Updating `Profile.color`'s default from `#e8a020` to `#f0a424` is safe because no current UI renders it | Pitfall 3 | If some code path does render it (missed by grep for `profile.color`/`player.color`), the visual color of a currently-invisible feature changes — low risk since search found zero render sites, but not exhaustively proven for every possible property-access pattern (e.g. destructured `const { color } = profile`) |
| A2 | Reading B (scoped) of Pitfall 2 — that `liveRowPulse` and `zeroFlashFade` can keep their current out-of-band durations since they're not named in success criterion 4 — is a defensible interpretation | Pitfall 2 | If the intended reading is actually "all 21, no exceptions," these two keyframes would need compressing to ≤300ms as well, which is a felt-behavior change beyond token substitution |

**If this table is empty:** N/A — see above, 2 assumptions need explicit confirmation before the planner locks the motion-retiming and Profile.color tasks.

## Open Questions

1. **Should shake (currently 400ms) and score-float (currently 1.6s) be compressed to ≤300ms, or kept at their current felt duration while still referencing/composing DS tokens?**
   - What we know: `design/readme.md` documents these exact durations (400ms, 1.6s); the DS token scale only goes up to `--dur-slow: 300ms`; CONTEXT.md's decision text says "all 21... retimed... 100–300ms" and separately says success criterion 4 "names button press, dialog open, shake, score float explicitly."
   - What's unclear: Whether "retimed to token durations" means "must literally land in 100–300ms" (a felt-behavior change for these two) or "must be expressed via the token system" (which could include composed/multiplied token values that land outside 300ms).
   - Recommendation: Ask the user directly at plan-time (or via `checkpoint:human-verify`) which reading is intended, and lock the exact target ms value per animation in the plan before writing sweep tasks — this is the one place in this phase where a wrong silent choice directly fails a stated success criterion.

2. **Should `liveRowPulse` (1.6s infinite) and `zeroFlashFade` (800ms) also be brought into the 100–300ms band, even though neither is named in success criterion 4?**
   - What we know: Both currently exceed 300ms; neither appears in the four examples the success criterion lists; both are continuous/ambient rather than one-shot "interactive transition" feedback.
   - What's unclear: Whether CONTEXT.md's blanket "all 21 keyframes...100-300ms" phrase is meant literally for these two as well.
   - Recommendation: Resolve alongside Question 1 as a single motion-retiming decision, since the same ambiguity applies to all 4 non-conforming keyframes (shake, score-float, liveRowPulse, zeroFlashFade).

3. **Is a new automated "no provisional colors" regression test in scope for this phase, or is the grep check purely a one-time manual verification gate?**
   - What we know: CONTEXT.md's verification section describes grep as a one-time check ("Verification is grep-based + tests"); there's no existing pattern in the repo for a "scan source files for forbidden strings" test.
   - What's unclear: Whether the plan should add a lightweight Vitest unit test that greps `src/` for the old-value list (durable regression protection for Phases 9–12, which will add new components that could reintroduce old values) versus treating the grep as throwaway CI/manual verification only.
   - Recommendation: Low-cost, high-value addition — recommend the planner add it as a small Wave 0 task (a Node-environment unit test reading `.svelte`/`.css` files and asserting zero matches), but this is Claude's discretion per CONTEXT.md, not a locked requirement.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 | WOFF2 font conversion | ✓ | 3.13.12 / 3.13.3 (two interpreters found: `python`, `python3`) [VERIFIED: version check this session] | — |
| pip | Installing fonttools/brotli | ✓ | 26.1.1 [VERIFIED] | — |
| fonttools (pip) | TTF→WOFF2 conversion | ✓ (installed this session) | 4.63.0 [VERIFIED] | Ship TTF-only (CONTEXT.md-accepted fallback) if conversion is skipped |
| brotli (pip) | WOFF2 compression backend | ✓ (installed this session) | 1.2.0 [VERIFIED] | Same TTF-only fallback |
| Node.js | Vite build, tests | ✓ | 22.22.0 [VERIFIED: node --version output during this session] | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — both Python tools installed and verified working; TTF-only remains the documented fallback if a future environment lacks Python/pip.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8, two projects: `unit` (Node env, `src/**/*.test.ts` excluding `src/ui/**`) and `browser` (Playwright/Chromium via `@vitest/browser-playwright`, `src/ui/**/*.test.ts`) [VERIFIED: vite.config.ts] |
| Config file | `vite.config.ts` (test config is inline, not a separate `vitest.config.ts`) |
| Quick run command | `npm run test:unit` (fast, Node-only) or targeted: `npx vitest run --project=browser src/ui/pwa/ReloadPrompt.test.ts` |
| Full suite command | `npm test` (runs both projects, ~511 tests total per project record) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | No provisional hex/rgba remain in `src/`; DS colors render everywhere | grep-based check (manual or new automated test) | `grep -rn "#e8a020\|#111318\|#1e2027\|#f0f0f0\|#c0392b\|#262932" src/` (expect 0 matches) | ❌ Wave 0 — recommend adding as a Vitest unit test per Open Question 3 |
| FOUND-01 | Existing `ReloadPrompt` test updated to new accent RGB | unit/browser (existing) | `npx vitest run --project=browser src/ui/pwa/ReloadPrompt.test.ts` | ✅ exists, needs literal-value edit (Pitfall 1) |
| FOUND-02 | Barlow/Barlow Semi Condensed load, offline-capable | manual/E2E (Playwright offline simulation) | no existing automated test found for font-loading-while-offline; recommend a Playwright test toggling `context.setOffline(true)` after first load and asserting `document.fonts.check('1em Barlow')` | ❌ Wave 0 |
| FOUND-03 | Spacing/radii/elevation follow DS scale on every surface | visual spot-check + grep for off-scale values | no automated test currently checks computed radius/spacing; manual dev-server check per CONTEXT.md | ❌ Wave 0 (optional — CONTEXT.md accepts manual spot-check) |
| FOUND-04 | Motion within 100–300ms band; reduced-motion collapses everything | browser test (new) | recommend a Playwright/Vitest-browser test using `page.emulateMedia({ reducedMotion: 'reduce' })` then asserting computed `animationDuration`/`transitionDuration` on a representative animated element is `0.01ms` | ❌ Wave 0 (no existing coverage — confirmed zero matches for reduced-motion anywhere in `src/`) |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (fast feedback for non-visual changes) and `npx vitest run --project=browser <touched-file>.test.ts` for any component touched in the sweep.
- **Per wave merge:** `npm test` (full ~511-test suite, both projects).
- **Phase gate:** Full suite green, plus a manual grep pass confirming 0 matches for every old provisional value, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Automated "no provisional colors" regression test (Node-env Vitest test scanning `src/**/*.{svelte,css}` for the old-value list) — recommended, not locked (Open Question 3)
- [ ] Reduced-motion browser test — no existing coverage for `prefers-reduced-motion` anywhere in the suite; FOUND-04's reduced-motion clause has zero automated verification without this
- [ ] Offline font-loading Playwright test — no existing test verifies fonts remain available after the SW takes the app offline (existing E2E offline tests, if any, should be checked for whether they already exercise this incidentally)
- [ ] `ReloadPrompt.test.ts` literal-value edit (not a new file, but a required edit — see Pitfall 1)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | Not touched — no auth in this app |
| V3 Session Management | no | Not touched |
| V4 Access Control | no | Not touched |
| V5 Input Validation | no | No new user input surfaces introduced; pure styling/token change |
| V6 Cryptography | no | Not touched |

This phase has no security-relevant surface: it changes CSS custom properties, static font asset files, and animation timing values. No new data inputs, no new network calls beyond static asset fetches already covered by the existing PWA/service-worker model, no auth/session/access-control code paths touched.

### Known Threat Patterns for {stack}

Not applicable — no new attack surface. The one file-system-adjacent action (`pip install fonttools brotli`, `npm view`-style dev-tool installs) is dev-time only and does not ship to the browser; standard due diligence was applied via the Package Legitimacy Audit above.

## Sources

### Primary (HIGH confidence)
- `design/tokens/colors.css`, `typography.css`, `spacing.css`, `elevation.css`, `fonts.css` — read in full this session, values transcribed directly
- `design/readme.md` — read in full this session
- `.planning/phases/08-design-foundation/08-CONTEXT.md` and `08-UI-SPEC.md` — read in full, locked decisions
- `.planning/REQUIREMENTS.md` — read in full
- Direct codebase inspection: `src/app.css`, `vite.config.ts`, `svelte.config.js`, `package.json`, and grep sweeps across `src/**/*.svelte` and `src/**/*.test.ts` (hex/rgba counts, keyframe list, computed-style test assertions, reduced-motion coverage) — all performed and verified in this session
- WOFF2 conversion — actually executed (`pip install fonttools brotli`; `python -m fontTools.ttLib.woff2 compress`) against a real project font file, output measured
- `gsd-tools query package-legitimacy check --ecosystem pypi fonttools brotli` — executed this session

### Secondary (MEDIUM confidence)
- Vite official docs (vite.dev/guide/assets) — CSS `url()` rebasing behavior, via WebSearch summary [CITED]
- vite-plugin-pwa GitHub issue #243 and Vite PWA org docs (vite-pwa-org.netlify.app) — globPatterns font-extension requirement, via WebSearch summary [CITED]
- fonttools PyPI page (pypi.org/project/fonttools) — conversion CLI syntax, cross-checked by actually running the command [CITED, then VERIFIED]

### Tertiary (LOW confidence)
- None — every claim above was either directly verified against the codebase/tools in this session or cited from official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing stack versions confirmed from package.json
- Architecture: HIGH — token files read in full, existing app.css/vite.config.ts/svelte.config.js read in full
- Pitfalls: HIGH — every pitfall above was independently confirmed via direct grep/read of the codebase and/or by executing the relevant command (WOFF2 conversion, package-legitimacy check), not inferred

**Research date:** 2026-07-13
**Valid until:** 30 days (stable domain — CSS tokens, static fonts, no fast-moving dependencies)
