---
phase: 12-pages-overlays
reviewed: 2026-07-14T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/routes/+page.svelte
  - src/routes/data/+page.svelte
  - src/routes/history/+page.svelte
  - src/routes/history/[id]/+page.svelte
  - src/routes/stats/+page.svelte
  - src/ui/setup/MatchSetup.svelte
  - src/ui/setup/PlayerPicker.svelte
  - src/ui/history/HistoryRow.svelte
  - src/ui/history/MatchStatBreakdown.svelte
  - src/ui/history/PlayerStatRow.svelte
  - src/ui/stats/ProfileStatDashboard.svelte
  - src/ui/stats/ScoreDistributionChart.svelte
  - src/ui/stats/DartsPerLegChart.svelte
  - src/ui/overlays/PauseOverlay.svelte
  - src/ui/overlays/RecordOverlay.svelte
  - src/ui/overlays/MatchWinOverlay.svelte
  - src/ui/pwa/ReloadPrompt.svelte
  - src/ui/pwa/ReloadPrompt.test.ts
  - src/ui/cast/ResumeToast.svelte
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-07-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Reviewed the full diff (`git diff d056892..HEAD`) for every file in the phase-12 file set plus the current file contents for context. This phase is a disciplined, mechanical CSS-token-recolor/520px-column sweep — almost every diff hunk is a literal-px-to-`var(--text-*)` token substitution or a `max-width: 480px → 520px` change, with no unexpected script-block edits.

Verified against the stated constraints:
- **Chart 2-line recolor rule**: `ScoreDistributionChart.svelte` and `DartsPerLegChart.svelte` diffs are each exactly one changed line (`var(--line-strong)` → `var(--surface-3)` for the non-highlighted bar fill). No rebuild occurred. Confirmed.
- **Same-commit CSS-delete rule**: `MatchWinOverlay.svelte` (`.new-game-btn`), `PauseOverlay.svelte` (`.weiter-btn`), and `ReloadPrompt.svelte` (bespoke `button` selector block) all had their superseded bespoke button CSS deleted in the same diff that introduced the shared `.btn`/`.btn--cta`/`.btn--ghost` classes. No orphaned/shadowing bespoke button rules remain in the reviewed files.
- **Setup h1 text lock**: only `MatchSetup.svelte`'s `<h1>` changed ("Neverman Darts" → "Neues Spiel"); no other German copy was touched anywhere in the file set.
- **ReloadPrompt + test same-commit update**: the component's border-color token change (`var(--accent)` → `var(--line-strong)`) is paired with the corresponding assertion update in `ReloadPrompt.test.ts` in the same diff; the new expected value (`rgba(235, 240, 255, 0.14)`) matches `colors.css:39`. Consistent.
- **Script-block diffs beyond plan**: none found — every `<script>` block in the reviewed files is byte-identical to the pre-phase version except `MatchSetup.svelte`'s template-only `<h1>` text (not script).
- **CSS custom properties referenced by new/changed rules** (`--text-xl/lg/md/sm/base`, `--surface-3`, `--row-h`, `--hit-min`, `--accent-soft`, `--accent-line`, `--font-score`, `--blur-backdrop`, `--shadow-panel`) all resolve to real declarations in `src/styles/*.css`. No undefined-token regressions.

One real quality concern was found in `ReloadPrompt.svelte` (button sizing regression, see WR-01), and one edge case worth double-checking is flagged as WR-02. No BLOCKER-level bugs, security issues, or data-loss risks were identified in this file set.

## Warnings

### WR-01: ReloadPrompt toast buttons now use full DS `.btn--cta` sizing, likely oversized/cramped for the toast

**File:** `src/ui/pwa/ReloadPrompt.svelte:50-53`
**Issue:** The diff replaces the previous compact bespoke buttons (`padding: 0.25rem 0.75rem; font-size: 13px;`) with the shared `.btn.btn--cta` (Aktualisieren) and `.btn.btn--ghost` (Schließen) classes, only narrowed with a local override:
```css
.pwa-toast-actions .btn {
	flex: 1;
	width: auto;
}
```
`.btn--cta` in `src/styles/components.css:74-84` sets `min-height: var(--row-h)` (64px), `font-size: var(--text-lg)` (22px, weight 700), and `padding: var(--space-sm) var(--space-lg)` (8px/24px). The toast itself is capped at `max-width: 22rem` (352px) with 16px horizontal padding, and the two buttons sit side-by-side with `flex: 1` and an 0.5rem gap. That leaves roughly ~100-160px of width per button, of which ~48px is consumed by `.btn--cta`'s own horizontal padding — not enough room at 22px/700-weight for "Aktualisieren" (13 chars) to render on one line without wrapping or visually crowding the 64px-tall button. This is a disproportionate primary CTA (sized for a full-width screen button) crammed into a small fixed corner notification whose own message text is `var(--text-sm)` (15px) — the button will visually dominate/overflow the toast it belongs to. Because `.pwa-toast-actions` is a flex row with default `align-items: stretch`, `.btn--ghost` ("Schließen") will also be stretched to the same 64px height even though it has no explicit sizing, making the whole toast much taller than the previous design.
**Fix:** Add an explicit compact override for the toast's buttons instead of only overriding `flex`/`width`, e.g.:
```css
.pwa-toast-actions .btn {
	flex: 1;
	width: auto;
	min-height: 40px;
	padding: var(--space-xs) var(--space-sm);
	font-size: var(--text-sm);
}
```
or introduce a `.btn--compact` discretionary variant in `components.css` if this pattern is needed elsewhere.

### WR-02: RecordOverlay/PauseOverlay `backdrop-filter` addition also affects the Chrome 90 Cast receiver, contradicting the stated review assumption

**File:** `src/ui/overlays/RecordOverlay.svelte:44-45`, `src/ui/overlays/PauseOverlay.svelte:79-80`
**Issue:** The review context states "overlays run on /match = modern Chrome, blur ok," but `RecordOverlay` and `PauseOverlay` (unlike `MatchWinOverlay`) are also imported and rendered by `src/routes/display/+page.svelte` (lines 18-19, 243, 252), which is the Chromecast receiver route documented elsewhere in this project as running Chrome 90 with strict CSS-feature gating (no `dvh`, no container queries, `@supports`-gated `height: 100dvh`). `backdrop-filter: blur(var(--blur-backdrop))` was newly added to these two overlay scrims in this diff. `display/+page.svelte` does already use `backdrop-filter: blur(8px)` elsewhere (lines 363, 418) for small icon buttons, which is reassuring precedent that the property itself renders on that hardware, but those are small chrome elements, not full-viewport scrims layered under a content card with its own `box-shadow`/`animation`. This has not been visually/perf-verified on real Cast hardware as part of this phase per the available artifacts.
**Fix:** No code change required if this was already spot-checked on the physical Chromecast during phase testing — but the review context's framing should be corrected (these overlays are not /match-only), and it's worth a quick manual check on the actual Cast device that the full-screen blur scrim on `/display` doesn't introduce a visible seam/performance hitch, since it's a larger blurred surface than the existing 8px button-chrome usages.

## Info

### IN-01: Blur radius mismatch between existing `/display` chrome elements and new overlay scrims

**File:** `src/ui/overlays/RecordOverlay.svelte:45`, `src/ui/overlays/PauseOverlay.svelte:80`, `src/routes/display/+page.svelte:363,418`
**Issue:** The newly-added overlay scrim blur uses `var(--blur-backdrop)` (12px, per `elevation.css:19`), while the pre-existing `/display` fullscreen-toggle and exit-btn chrome use a hardcoded `blur(8px)`. Not a functional bug (different UI elements, arguably intentional), but worth confirming the differing blur intensity on the same screen is a deliberate design choice rather than an oversight, since both are now visible together during a pause/record celebration on `/display`.
**Fix:** If a single blur intensity is intended for `/display`, consider updating the hardcoded `8px` in `display/+page.svelte` to `var(--blur-backdrop)` for consistency (out of this phase's stated scope — flagging only for awareness).

---

_Reviewed: 2026-07-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
