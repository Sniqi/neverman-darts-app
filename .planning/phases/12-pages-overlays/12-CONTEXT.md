# Phase 12: Pages & Overlays - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — recommendations auto-accepted after user timeout; pure DS transcription (design/templates screens.jsx + HistoryRow.jsx + readme states/overlays).

<domain>
## Phase Boundary

Every remaining app page and every global overlay/toast matches the DS screens, completing the restyle across the whole app. PAGE-01 (hub + setup: 520px column, list boxes, collapsible Profile verwalten, terse labels), PAGE-02 (history list + detail per HistoryRow spec), PAGE-03 (stats dashboard DS typo/colors; bespoke SVG charts RECOLORED ONLY — rebuild is explicitly out of scope), PAGE-04 (data/backup page + global overlays/toasts: PWA update toast, resume prompt, pause overlay, record celebrations).

**Not in this phase:** /match shell (not named in PAGE criteria; scoring surface done in Phase 10), display surface (Phase 11), sync/engine (locked).

</domain>

<decisions>
## Implementation Decisions

### Seiten-Layout (PAGE-01)
- Containers 480→**520px** on hub/setup/history/stats (+data page for consistency — same 520 in DS screens family); /match shell untouched.
- List boxes radius 16 (`--radius-md`) for grouped sections (setup groups, data sections); paddings/gaps per DS screens.jsx literals (hub: padding var(--space-3xl) var(--space-lg), gap var(--space-xl); setup/history/stats: padding var(--space-lg), gap var(--space-xl)/(--space-lg)).
- Collapsible "Profile verwalten" keeps its behavior (q01); DS optics only (▼ glyph, list-box style).

### History (PAGE-02)
- `HistoryRow.svelte` transcribed from HistoryRow.jsx: muted date, winner name in amber, result, muted format subtitle, › chevron (DS iconography).
- History detail page: DS typography/tokens using nearest DS idioms (no dedicated spec exists) — no layout inventions.

### Stats (PAGE-03)
- Charts: recolor-validation ONLY against DS color roles (accent for primary series, text-muted axes, line hairlines — Phase 8 already tokenized; fine-tune any off-role mappings). REBUILD FORBIDDEN (REQUIREMENTS Out of Scope table).
- Dashboard typography per DS (page title 26/600, section headings 22/600); StatCards done (Phase 9).

### Overlays & Toasts (PAGE-04)
- PauseOverlay/RecordOverlay/MatchWinOverlay: DS overlay treatment — scrim `var(--backdrop)` + `backdrop-filter: blur(var(--blur-backdrop))`, panel radius 20 (`--radius-lg`), motion tokens (scale-in where dialog-shaped, existing timings/keyframes stay token-based). Behavior identical (auto-pause countdown logic, record celebration triggers untouched).
- ReloadPrompt (PWA toast) + ResumeToast (Cast): DS toast optics (surface-2, radius 16, `--shadow-raise`, token motion; German texts locked — "Neue Version verfügbar" etc.). ReloadPrompt.test.ts accent assertion stays valid.
- ResumePrompt: verify-only (Phase 9 dialog treatment).
- Gate: full suites green (563 vitest + 12/12 Playwright); zero behavior change; design-tokens guard green.

### Claude's Discretion
- Exact list-box composition on setup/data (which groups get boxed) — follow DS screens.jsx visual grouping.
- History-detail typography mapping (nearest DS roles).
- Chart color-role fine-tuning specifics.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- All tokens + shared primitives (.btn/.switch, dialog treatment) from Phases 8-9; `--radius-md/lg`, `--backdrop`, `--blur-backdrop`, `--shadow-raise` ready.
- DS sources: design/templates/darts-app/screens.jsx (layout literals: maxWidth 520, paddings/gaps), design/components/history/HistoryRow.jsx + .prompt.md, design/readme.md (overlays/states/toasts prose).
- Current: hub/MatchSetup at 480px (routes/+page.svelte:131, MatchSetup.svelte:363); overlays have NO backdrop-filter yet; HistoryRow.svelte exists (Phase 8 token-swept).
- Suites: 563 vitest + 12/12 Playwright green.

### Established Patterns
- Same-commit CSS-delete; German labels/roles locked (E2E contract); design-tokens guard; no live color-mix; Chrome-90 rules (overlays/toasts render on /match + pages — modern Chrome — but global precompute rule stands; backdrop-filter is Chrome 76+ = fine).
- Phase-11 UAT deferred — do not touch display components.

### Integration Points
- routes: +page (hub), setup, history, history/[id], stats, data; ui: history/{HistoryRow,MatchStatBreakdown,PlayerStatRow}, overlays/{PauseOverlay,RecordOverlay,MatchWinOverlay}, pwa/ReloadPrompt, cast/ResumeToast, stats charts.

</code_context>

<specifics>
## Specific Ideas

- HistoryRow.prompt.md: "muted date, winner name in amber, result, muted format subtitle, › chevron".
- DS screens.jsx layout literals: hub maxWidth 520 / padding space-3xl space-lg / gap space-xl; setup 520 / space-lg / bottom space-3xl; history+stats 520 / space-lg / gap space-lg.

</specifics>

<deferred>
## Deferred Ideas

- Orphan cleanup (VisitStrip.svelte, VisitLine.svelte, CorrectionWindow.svelte dead code) → milestone audit item, not this phase.

</deferred>
