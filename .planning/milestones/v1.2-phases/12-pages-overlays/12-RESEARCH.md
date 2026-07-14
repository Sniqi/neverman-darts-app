# Phase 12: Pages & Overlays - Research

**Researched:** 2026-07-14
**Domain:** CSS/token restyling of Svelte pages + overlays against an approved DS transcription spec (no new libraries, no logic changes)
**Confidence:** HIGH

## Summary

Phase 12 is a pure CSS/markup transcription phase: 12-UI-SPEC.md (approved) already contains exhaustive file-by-file diff tables (current value → DS value) for every page and overlay in scope. There is nothing to research about *what* the target styling should be — that question is already answered with certainty by the UI-SPEC. This research instead answers the planner's real open question: **which of the 563 vitest / 12 Playwright tests actually assert on the styling this phase changes, and where would a literal transcription of the UI-SPEC break a test the CONTEXT.md/UI-SPEC assumed would stay green?**

The investigation found the codebase's overlay components (`PauseOverlay`, `RecordOverlay`, `MatchWinOverlay`) cleanly separate logic (`<script>`) from presentation (`<style>`), so the restyle is behavior-safe by construction — verified by reading all three files end-to-end. Test coupling is minimal and mostly resolves cleanly (`PauseOverlay.test.ts`, `MatchSetup.test.ts`, E2E specs) because they query by class-name/role/text, not raw computed style. **One critical exception was found and must be flagged to the planner**: `ReloadPrompt.test.ts` line 93-102 asserts `getComputedStyle(toast).borderColor` equals accent `rgb(240, 164, 36)` on the `.pwa-toast` element itself — but UI-SPEC's own diff table (line 252) requires changing that exact border from `var(--accent)` to `var(--line-strong)`. CONTEXT.md's claim "ReloadPrompt.test.ts accent assertion stays valid" and UI-SPEC's note ("`.btn--cta`'s accent gradient satisfies this") are **both incorrect** — the assertion targets the toast container's border, not any button. A literal implementation of the UI-SPEC's border fix will fail this test unless the test itself is updated in the same commit.

Container-width (480→520) and 480px-coupled layout math was checked project-wide: no `@media` query anywhere in the 6 affected route files references 480px, so the width swap is a pure, isolated literal change with zero coupled breakpoint risk.

**Primary recommendation:** Plan this phase as a literal, file-by-file transcription of the UI-SPEC's diff tables (they are already execution-ready), but add one explicit task to update `ReloadPrompt.test.ts`'s border-color assertion (or restructure it) in the same commit as the `.pwa-toast` border fix — do not treat CONTEXT.md/UI-SPEC's "test stays valid" claim as ground truth for that specific assertion.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Page layout/container width, typography, spacing | Browser/Client (Svelte component CSS) | — | Static, scoped `<style>` blocks per `.svelte` route/component; no server involved (static PWA) |
| History row/list rendering | Browser/Client | Database/Storage (Dexie `matchesLive()`) | Presentation-only change; data source (`toHistoryRow`, `matchesLive`) untouched |
| Stats charts (SVG) | Browser/Client | — | Bespoke inline SVG components; recolor only, geometry/data-binding untouched |
| Overlays (Pause/Record/MatchWin) | Browser/Client | — | Prop-driven presentation components; state lives in `matchStore`/parent, unaffected by this phase |
| PWA update toast / Cast resume toast | Browser/Client | — | `virtual:pwa-register/svelte` (SW) and `castSenderManager` (Cast SDK) own the logic; components are pure display shells |

## Standard Stack

No new libraries. This phase consumes only what Phases 8-9 already shipped:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte | ^5.56.3 | Component/style scoping | Already the project framework — CLAUDE.md locked |
| (project) `src/app.css`, `src/styles/colors.css`, `src/styles/components.css` | n/a | Design tokens + `.btn`/`.switch`/`.chip` primitives | Established in Phases 8-9; this phase is a consumer, introduces zero new tokens/classes (UI-SPEC line 28) |

**Installation:** none — no `npm install` needed for this phase.

## Package Legitimacy Audit

Not applicable — this phase installs no packages.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast/overlay dialog panel styling | New bespoke button/panel CSS | Existing `.btn--cta`/`.btn--ghost`/`.btn--accent` classes in `src/styles/components.css` and the dialog-panel pattern already shipped in `ConfirmDialog.svelte` (referenced explicitly by UI-SPEC as the reference implementation) | UI-SPEC explicitly directs reuse; hand-rolling would duplicate CSS Phase 9 already centralized (see STATE.md decision log: 09-01 "components.css added... CSS `:active` press-state kept") |
| Chevron icon on HistoryRow | New SVG asset | The same inline stroke SVG (`viewBox 0 0 24 24`, `path d="M9 18l6-6-6-6"`, `stroke-width 2`) already used on menu buttons/back-buttons elsewhere (`history/+page.svelte`'s back-btn uses an equivalent stroke-SVG chevron pattern) | UI-SPEC directive: "replace with the same inline SVG chevron used on menu buttons/back-buttons elsewhere in the app" |

## Common Pitfalls

### Pitfall 1: ReloadPrompt.test.ts border-color assertion will break on a literal UI-SPEC transcription
**What goes wrong:** UI-SPEC (line 252) requires changing `.pwa-toast`'s border from `1px solid var(--accent)` to `1px solid var(--line-strong)`. `ReloadPrompt.test.ts` (line 93-102, test name `'PLAT-04: toast has position:fixed and accent (#f0a424) border color'`) asserts `window.getComputedStyle(toast).borderColor` matches `/rgb\(240,\s*164,\s*36\)/` (accent) on the `.pwa-toast` element itself — not on any button.
**Why it happens:** CONTEXT.md (line 34) and UI-SPEC (line 257) both assert "the test stays valid" / "`.btn--cta`'s accent gradient satisfies this", reasoning about a button-level accent assertion. But the actual test's `borderColor` check targets the *toast container*, which is exactly the element whose border color the UI-SPEC changes away from accent. `--line-strong` is `rgba(235, 240, 255, 0.14)` [VERIFIED: src/styles/colors.css:39] — it will never render as `rgb(240, 164, 36)`.
**How to avoid:** Add an explicit plan task, in the same commit/wave as the `.pwa-toast` border CSS fix, to update this test's expectation — either assert the new border color renders (`rgba(235, 240, 255, 0.14)` / `.14` alpha) or restructure the assertion if the border-color check is no longer the intended signal. Do not rely on the UI-SPEC's "stays valid" note for this specific line.
**Warning signs:** `npm test` (vitest) failing on `ReloadPrompt.test.ts` after the `.pwa-toast` border fix lands — this is the expected/predicted failure, not a regression to investigate further.

### Pitfall 2: Assuming `.match-list`/`.pause-content`/`.win-content`/`.record-content` class-name changes are needed
**What goes wrong:** A tempting "clean" implementation might rename wrapper classes when adding a DS panel treatment (e.g. renaming `.pause-content` to `.pause-panel`).
**Why it happens:** DS terminology ("panel", "list box") differs from the current class names.
**How to avoid:** Keep existing selectors (`.pause-content`, `.win-content`, `.record-content`, `.match-list`) and add the new background/border/radius/shadow *properties* to them in place — `PauseOverlay.test.ts` queries `.pause-content` indirectly via `.pause-overlay`/`.countdown-digits`/`.zero-flash`/`.sr-only[aria-live]`, and any class rename risks silently breaking `querySelector` calls that aren't obviously coupled to styling.
**Warning signs:** vitest `querySelector` returning `null`/`falsy` in a previously-passing assertion.

### Pitfall 3: Treating `RecordOverlay`'s panel treatment as mandatory
**What goes wrong:** Applying the same `--surface-2`/`--radius-lg`/`--shadow-panel` treatment to `.record-content` as a hard requirement.
**Why it happens:** CONTEXT.md groups "all three" overlays under DS treatment, but UI-SPEC explicitly demotes this one line item to **Claude's Discretion** ("this overlay is celebratory/non-interactive so a panel is optional, not load-bearing" — UI-SPEC line 237).
**How to avoid:** Apply it for consistency (UI-SPEC's own recommended default) but do not block the phase or add extra verification ceremony around this specific line — it is optional by the spec's own words.
**Warning signs:** none — this is a scope-calibration note, not a bug risk.

## Runtime State Inventory

Not applicable — this is a pure restyle phase (CSS/markup only), not a rename/refactor/migration phase. No stored data, service config, OS-registered state, secrets, or build artifacts are touched.

## Code Examples

### Overlay logic/presentation separation (verified pattern — applies to all 3 overlays)
```svelte
<!-- Source: src/ui/overlays/PauseOverlay.svelte (read in full) -->
<script lang="ts">
  // All derived state ($derived, $derived.by) computes text/booleans only —
  // zero coupling to CSS class names or style values. Restyle-safe by construction.
  let mm = $derived(String(Math.floor(remainingSeconds / 60)).padStart(2, '0'));
  let isZero = $derived(remainingSeconds === 0 && pauseActive);
</script>
<!-- <style> block below is 100% presentational — no script reads computed styles -->
```
Same pattern confirmed in `MatchWinOverlay.svelte` (derives `winnerName`/`displayBadge` from `matchStore`, zero style coupling) and `RecordOverlay.svelte` (auto-dismiss `$effect` keyed only on `records.length`/`autoDismissMs`, zero style coupling).

### Chart recolor — exact line-level target (verified via Grep)
```svelte
<!-- Source: src/ui/stats/ScoreDistributionChart.svelte:67 -->
{@const fill = i === highlightIdx ? 'var(--accent)' : 'var(--line-strong)'}
<!-- UI-SPEC fix: change 'var(--line-strong)' -> 'var(--surface-3)' on this line only -->
```
```svelte
<!-- Source: src/ui/stats/DartsPerLegChart.svelte:81 -->
{@const fill = i === bestIdx ? 'var(--accent)' : 'var(--line-strong)'}
<!-- Same fix: 'var(--line-strong)' -> 'var(--surface-3)' -->
```
`AverageTrendChart.svelte` was not part of the fill-color fix per UI-SPEC (only the two bar charts have the off-role mapping) — verify-only for that file.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| n/a | n/a | n/a | This is an internal token-consistency pass, not an ecosystem/tooling change |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | — | — | All claims below were verified by direct file reads/greps in this session — no `[ASSUMED]` tags used |

**This table is empty:** All claims in this research were verified directly against the current codebase (file reads and greps performed in this session) — no external/training-knowledge claims requiring user confirmation.

## Open Questions

1. **Should `ReloadPrompt.test.ts`'s border-color test be updated to assert the new `--line-strong` value, or restructured to drop the border-color check entirely?**
   - What we know: the current assertion (`rgb(240, 164, 36)` on `.pwa-toast`) will fail after the DS-mandated border fix.
   - What's unclear: whether the test's *intent* (PLAT-04 — "toast is styled per DS") is better served by asserting the new border color, or by moving any accent-color assertion to the `.btn--cta`/`Aktualisieren` button instead (which the UI-SPEC's author seems to have originally intended).
   - Recommendation: planner should have the executing task update the assertion to check the actual new border value (`getComputedStyle` will resolve `--line-strong`'s rgba), keeping the test's `position:fixed` check intact — simplest fix, smallest diff, stays true to "test what's actually there."

## Test Coverage Map (Phase 12 scope)

Every test file that touches a Phase-12 file, with the specific assertions that are style-coupled vs. behavior-coupled:

| Test file | Target component | Style-coupled assertions (must verify post-change) | Behavior-coupled assertions (unaffected, must stay green) |
|---|---|---|---|
| `src/ui/pwa/ReloadPrompt.test.ts` | `ReloadPrompt.svelte` | **Line 93-102: `.pwa-toast` `borderColor` === accent rgb — WILL BREAK, needs update (Pitfall 1)** | Lines 37-91: text content ("Neue Version verfügbar"), button labels ("Aktualisieren"/"Schließen"), `updateServiceWorker(true)` call, store-driven show/hide — all class/text/role-based, unaffected by CSS token swaps |
| `src/ui/overlays/PauseOverlay.test.ts` | `PauseOverlay.svelte` | None directly assert color/font-size values — only `position: fixed` (line 38-47, `.pause-overlay`, untouched by UI-SPEC) | All 20 tests query `.pause-overlay`/`.pause-content`/`.countdown-digits`/`.zero-flash`/`.sr-only[aria-live]`/generic `button` + textContent — none touch the properties UI-SPEC changes (backdrop-filter, panel bg/border/radius, heading font-size, button class swap). Safe as long as class *names* are preserved (Pitfall 2) |
| `src/ui/setup/MatchSetup.test.ts` | `MatchSetup.svelte` | None | Queries 4 switches by `getByRole('switch', {name: ...})` — accessible names unaffected by container-width/typography/copy fixes (the h1 copy fix "Neverman Darts"→"Neues Spiel" is not the switches' accessible name) |
| `src/ui/setup/ProfileManager.test.ts` | `ProfileManager.svelte` (not in Phase 12 file list directly, but rendered inside `.profiles-panel`) | None expected — UI-SPEC only touches the *outer* `.profiles-panel` wrapper box styling, not `ProfileManager.svelte`'s internal rows | Out of Phase-12 file scope per UI-SPEC (its internal rows "already use `background: var(--surface); border-radius: var(--radius-md)`" — verify-only) — confirm this test doesn't assert on `.profiles-panel` itself before treating as fully unaffected |
| `src/ui/stats/StatCard.test.ts` | `StatCard.svelte` | None — `StatCard` is explicitly out of Phase-12 scope ("already DS-correct from Phase 9 (COMP-04) — verify-only") | n/a |
| `src/db/stats.test.ts` | `src/db/stats.ts` | None — pure data-layer test, no UI | n/a |
| **No test file exists for:** `HistoryRow.svelte`, `MatchStatBreakdown.svelte`, `PlayerStatRow.svelte`, `RecordOverlay.svelte`, `MatchWinOverlay.svelte`, `ResumeToast.svelte`, any `routes/+page.svelte`/`history/+page.svelte`/`history/[id]/+page.svelte`/`stats/+page.svelte`/`data/+page.svelte` | — | — | **No vitest safety net for these files** — E2E specs (below) are the only automated check; visual/manual verification carries more weight here |

**Every planned expected-test-update, enumerated:**
1. `ReloadPrompt.test.ts` line ~101 — update expected `borderColor` regex (mandatory, see Pitfall 1).
2. No other `.test.ts` file in the repo requires an expectation change for this phase — confirmed by reading every test file that imports a Phase-12-scoped component.

## E2E Coupling (Playwright)

Full grep of `e2e/*.spec.ts` for any assertion touching hub/setup/history accessible names, headings, or text:

- `e2e/full-match-flow.spec.ts:96-97` — asserts `getByRole('heading', {name: /gewinnt!/})` and `getByRole('button', {name: 'Neues Spiel'})`. **This is `MatchWinOverlay`**, not the Setup page — the win-heading text (`"{winnerName} gewinnt!"`) and CTA text (`"Neues Spiel"`) are both locked as **unchanged** by the Copywriting Contract (UI-SPEC line 159) and are not modified by this phase (CSS-only fixes to that overlay). Confirmed no conflict with the Setup-page h1 copy change (different page, different role — `heading` here refers to `<h1 class="win-heading">`, not `MatchSetup.svelte`'s `<h1>`).
- `e2e/spectator-sync.spec.ts` — touches setup flow buttons (`'Spieler hinzufügen'`, `'Gast hinzufügen'`, `'501'`, `'Spiel starten'`, `'Spielreihenfolge bestätigen'`) — all by exact button text, none of which change per the Copywriting Contract. No heading/h1 assertions found (grepped for `getByRole('heading'`).
- `e2e/reduced-motion.spec.ts` — no matches for heading/history/Verlauf/hub patterns (motion-focused, out of this phase's CSS-color/typography scope except insofar as it touches `prefers-reduced-motion` — the overlay `<style>` blocks already use token-based `--dur-*`/`--ease` durations, unaffected by this phase's panel/border additions).
- No E2E spec references `Match-Verlauf`, `Statistik`, `Daten`, or any hub-menu/history-page heading text.

**Conclusion: the Setup h1 copy fix ("Neverman Darts" → "Neues Spiel") has zero E2E coupling** — independently re-verified via full-repository grep across `e2e/`, confirming UI-SPEC's own note (line 146: "Verified: no vitest/Playwright test asserts the old `Neverman Darts` MatchSetup h1 — safe").

## Overlay Behavior/Style Separability (verified)

All three overlay components were read in full. Confirmed pattern for all three:
- **Script block**: props in, `$derived`/`$derived.by`/`$effect` compute only text values and booleans (`mm`, `ss`, `isZero`, `ariaAnnouncement`, `winnerName`, `displayBadge`, auto-dismiss `setTimeout`). None of these read `getComputedStyle`, CSS custom properties, or DOM layout — the restyle surface (`<style>` block) is fully separable from logic.
- **Logic that must stay byte-identical** (per CONTEXT.md PAGE-04 gate, confirmed present and untouched by any UI-SPEC line item):
  - `PauseOverlay.svelte:28-44` — `mm`/`ss` zero-padding math, `isZero` derivation, `ariaAnnouncement` coarse-interval logic (60s marks + ≤10s threshold).
  - `MatchWinOverlay.svelte:17-38` — `winnerName` derivation from `matchStore.activePlayer`, `displayBadge` snapshot-then-clear `$effect` (guards against `pendingRecords` leaking into the next match).
  - `RecordOverlay.svelte:21-27` — auto-dismiss `setTimeout`/`clearTimeout` `$effect` keyed on `records.length`.
- Class names (`.pause-overlay`, `.pause-content`, `.countdown-digits`, `.zero-flash`, `.win-overlay`, `.win-content`, `.record-overlay`, `.record-content`) are all referenced by `PauseOverlay.test.ts` — **must be preserved verbatim** even as their CSS property values change (Pitfall 2).

## Container 480→520 Coupling Check

Grepped every route file in scope for `max-width: 480px` and any `@media` rule:

| File | `max-width: 480px` location | Any `@media` referencing 480? |
|---|---|---|
| `src/routes/+page.svelte:131` | `.start-screen` | No |
| `src/ui/setup/MatchSetup.svelte:363` | `.setup-screen` | No |
| `src/routes/history/+page.svelte:44` | `.screen` | No |
| `src/routes/history/[id]/+page.svelte:150` | `.screen` | No |
| `src/routes/stats/+page.svelte:92` | `.screen` | No |
| `src/routes/data/+page.svelte:205` | `.screen` | No |

The only `@media` rule found project-wide in these files' vicinity is `src/routes/match/+page.svelte:649` (`@media (orientation: landscape)`) — that file is **out of scope** for this phase (the `/match` shell, explicitly excluded by CONTEXT.md's Phase Boundary). **Conclusion: the 480→520 swap is a pure, isolated single-value literal change per file — no coupled breakpoint or child-width math exists to break.**

## Chart Color Roles — Exact Selectors

Confirmed via direct read/grep against UI-SPEC's Chart Recolor Contract:

| File | Line | Current | Fix | Verified via |
|---|---|---|---|---|
| `src/ui/stats/ScoreDistributionChart.svelte` | 67 | `{@const fill = i === highlightIdx ? 'var(--accent)' : 'var(--line-strong)'}` | `'var(--line-strong)'` → `'var(--surface-3)'` | Grep, exact line match |
| `src/ui/stats/DartsPerLegChart.svelte` | 81 | `{@const fill = i === bestIdx ? 'var(--accent)' : 'var(--line-strong)'}` | `'var(--line-strong)'` → `'var(--surface-3)'` | Grep, exact line match |
| `src/ui/stats/ScoreDistributionChart.svelte` | 61 | `stroke="var(--line-strong)"` (axis) | **verify-only, no change** — axis hairline role is correct as-is | Grep |
| `src/ui/stats/DartsPerLegChart.svelte` | 74 | `stroke="var(--line-strong)"` (axis) | **verify-only, no change** | Grep |

`AverageTrendChart.svelte` was not grepped for a fill fix — UI-SPEC's contract names only the two bar charts (`ScoreDistributionChart`, `DartsPerLegChart`) as having the off-role mapping; the trend chart's polyline/dots already use `--accent` correctly per UI-SPEC's prose (no diff-table entry exists for it, confirming verify-only status).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 (`--project=unit` + `--project=browser` via `vitest-browser-svelte` 2.1.1) + Playwright 1.60.0 (E2E) [VERIFIED: package.json] |
| Config file | `vite.config.ts` (vitest projects config, not separately read this session — pattern established Phase 8-11) |
| Quick run command | `npm run test:browser -- src/ui/pwa/ReloadPrompt.test.ts` (or the specific changed file) |
| Full suite command | `npm test` (563 vitest) + `npx playwright test` (12 E2E specs) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | Hub/setup container 520px, list boxes, collapsible panel styling | manual/visual | none automated | ❌ — no test asserts container width/list-box CSS; rely on `checkpoint:human-verify` or design-tokens guard |
| PAGE-01 | 4 MatchSetup switches keep accessible names after copy/typography fix | unit (browser) | `npm run test:browser -- src/ui/setup/MatchSetup.test.ts` | ✅ existing |
| PAGE-02 | HistoryRow visual diff (border/gap/chevron/typography) | manual/visual | none automated | ❌ — no HistoryRow.test.ts exists; E2E doesn't assert history page content either |
| PAGE-03 | Chart fill-color fix (2 lines) | manual/visual (SVG color inspection) | none automated | ❌ — no chart tests exist |
| PAGE-04 | PauseOverlay countdown/behavior stays identical through restyle | unit (browser) | `npm run test:browser -- src/ui/overlays/PauseOverlay.test.ts` | ✅ existing, 20 tests |
| PAGE-04 | MatchWinOverlay win-flow, heading/CTA text | E2E | `npx playwright test e2e/full-match-flow.spec.ts` | ✅ existing |
| PAGE-04 | ReloadPrompt toast text/behavior + border color | unit (browser) | `npm run test:browser -- src/ui/pwa/ReloadPrompt.test.ts` | ✅ existing — **needs 1-line update, see Pitfall 1** |
| PAGE-04 | design-tokens guard (no forbidden hardcoded colors reintroduced) | unit | (established Phase 8 — file not re-read this session, assume `npm test` includes it per STATE.md "design-tokens guard green" gate) | ✅ existing, per CONTEXT.md gate |

### Sampling Rate
- **Per task commit:** run the specific affected `*.test.ts` file(s) in browser mode (fast, targeted).
- **Per wave merge:** `npm test` (full 563 vitest) — must stay green except the intentionally-updated `ReloadPrompt.test.ts` line.
- **Phase gate:** `npm test` + `npx playwright test` both fully green (CONTEXT.md's explicit gate: "full suites green (563 vitest + 12/12 Playwright); zero behavior change; design-tokens guard green") before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `ReloadPrompt.test.ts` — expected border-color assertion needs updating in the same wave as the `.pwa-toast` border CSS fix (mandatory, not optional — see Pitfall 1). This is a modification to an *existing* file, not a new test file.
- No new test files or fixtures are required — this phase has no new testable logic (CSS/markup-only). The "gap" is entirely the one existing-test update above.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` [VERIFIED: .planning/config.json]. This phase makes no changes to authentication, session management, access control, cryptography, or input handling — it is CSS/markup-only against local-first, no-backend static pages. ASVS categories are not applicable at the code-change level for this phase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth system exists (local-only PWA, no accounts) |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No access control boundaries |
| V5 Input Validation | No | This phase touches no input-handling code paths (data/import-export flow explicitly marked "unchanged, KEEP" in UI-SPEC) |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Player-name/record-string injection via `{@html}` | Tampering/Information Disclosure | Already mitigated project-wide — `HistoryRow.svelte`, `MatchWinOverlay.svelte`, `RecordOverlay.svelte` all use Svelte `{interpolation}` only (no `{@html}`), per each file's own header comment (T-03-05/T-03-04/T-04-13). This phase does not touch that binding — verify-only, no new risk introduced. |

## Sources

### Primary (HIGH confidence — direct codebase reads this session)
- `D:\github\neverman-darts-app\.planning\phases\12-pages-overlays\12-CONTEXT.md` — locked decisions
- `D:\github\neverman-darts-app\.planning\phases\12-pages-overlays\12-UI-SPEC.md` — approved diff tables (source of truth)
- `D:\github\neverman-darts-app\.planning\REQUIREMENTS.md`, `.planning\STATE.md`, `.planning\config.json`
- `src/ui/overlays/PauseOverlay.svelte`, `MatchWinOverlay.svelte`, `RecordOverlay.svelte` (full reads)
- `src/ui/overlays/PauseOverlay.test.ts`, `src/ui/pwa/ReloadPrompt.test.ts`, `src/ui/setup/MatchSetup.test.ts` (full reads)
- `src/ui/pwa/ReloadPrompt.svelte`, `src/ui/history/HistoryRow.svelte`, `src/ui/cast/ResumeToast.svelte` (full reads)
- `src/routes/+page.svelte`, `src/routes/history/+page.svelte` (partial reads)
- `src/styles/components.css`, `src/styles/colors.css` (targeted greps/reads)
- `src/ui/stats/ScoreDistributionChart.svelte`, `DartsPerLegChart.svelte` (targeted greps)
- `e2e/*.spec.ts` — full-repository grep for heading/text assertions
- `package.json` — verified test tooling versions

### Secondary (MEDIUM confidence)
- None used — no external documentation lookup was needed for this phase (no new libraries; project-internal transcription against an already-approved spec).

### Tertiary (LOW confidence)
- None.

**Note on tool strategy:** No external MCP research providers (Context7/web search) were invoked. All `config.json` search flags (`brave_search`, `exa_search`, `firecrawl`, `tavily_search`, `ref_search`, `perplexity`, `jina`) are `false`, and this phase introduces zero new libraries or APIs — every open question was resolvable by direct codebase inspection, which is the higher-authority source for a transcription-against-an-approved-spec phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, versions confirmed from `package.json`
- Architecture: HIGH — every file/line cited was read or grepped directly this session
- Pitfalls: HIGH — the ReloadPrompt test-break finding is a direct, reproducible line-level contradiction between UI-SPEC's assumption and the actual test file content

**Research date:** 2026-07-14
**Valid until:** Valid through Phase 12 execution (this research is tied to the current UI-SPEC/codebase snapshot; re-verify if either changes before planning completes)
