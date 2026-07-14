---
phase: 12
score: 23/24
---

# Phase 12 — UI Review

**Audited:** 2026-07-14
**Baseline:** 12-UI-SPEC.md (design contract, approved)
**Screenshots:** not captured (no dev server running on 3000/5173/8080 — code-only audit)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All contract copy (incl. "Neues Spiel" title fix) transcribed verbatim; no generic labels found. |
| 2. Visuals | 4/4 | Overlay panels now have proper dialog-shaped surfaces, blur scrims, SVG chevron on HistoryRow replacing text glyph — hierarchy matches DS. |
| 3. Color | 4/4 | Accent confined to the DS-listed 5 use cases; zero stray hex literals found in phase-touched files (one grep hit was a `.each` block false positive, not a color). |
| 4. Typography | 4/4 | Zero leftover hardcoded `20px` title/heading sizes across all 6 restyled pages; grep hit was a `520px` substring false positive. |
| 5. Spacing | 4/4 | All 6 target pages confirmed at `max-width: 520px`, zero `480px` leftovers. |
| 6. Experience Design | 3/4 | Solid state coverage overall, but one review-flagged item (WR-02, blur-scrim performance on the Chrome 90 Cast receiver) remains an unverified runtime risk, deferred to manual UAT rather than resolved in code. |

**Overall: 23/24**

---

## Top 3 Priority Fixes

1. **WR-02 — untested `backdrop-filter` blur performance on Chrome 90 Cast receiver** — user impact: if the full-viewport 12px blur on `PauseOverlay`/`RecordOverlay` chugs on the actual Chromecast hardware (weaker GPU than desktop, only prior usage was small icon-chrome blur), the spectator display could visibly stutter during pause countdowns — a highly visible, room-wide degradation. Concrete fix: run the physical-device check already queued in `11-UAT.md` item 5 addendum before considering this phase fully closed; if it stutters, gate `backdrop-filter` behind a `/display`-only `@supports`/media-query fallback (flat scrim, no blur) rather than removing it project-wide.
2. **No dedicated computed-style test for `ResumeToast`/toast button sizing edge cases** — user impact: low (full suite is green and code review already caught/fixed the WR-01 oversized-button issue), but the SUMMARY explicitly flags ResumeToast's `--surface-2` swap and the toast button compact override as "no dedicated visual test, human/UAT judgment required." Concrete fix: add a lightweight computed-style assertion for `.pwa-toast-actions .btn` height (`var(--hit-min)` = 48px) to lock in the WR-01 fix against regression, since a future edit could silently re-inherit the full 64px DS button size.
3. **IN-01 blur-radius inconsistency (8px vs 12px) left as wont-fix** — user impact: negligible/cosmetic (different UI classes: small icon chrome vs. full-viewport scrim), but worth a one-line CONTEXT.md note so a future contributor doesn't "fix" it into an actual regression by force-matching the two unrelated blur values.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `MatchSetup.svelte` h1 confirmed changed from `"Neverman Darts"` to `"Neues Spiel"` (the one flagged copy fix) — matches Copywriting Contract table exactly.
- Grep for generic English labels (`Submit`, `Click Here`, `>OK<`, `Cancel`) across `src/routes` and `src/ui` returned zero matches — the app is consistently German with terse, specific copy per the DS contract (e.g. `"Weiter"`, `"Neues Spiel"`, dialog copy verified unchanged in VERIFICATION.md).
- No issues found justifying a lower score; contract fully met.

### Pillar 2: Visuals (4/4)
- `HistoryRow.svelte:49-52` — confirmed the Unicode `›` chevron was replaced with the DS-mandated inline SVG (`viewBox 0 0 24 24`, `path d="M9 18l6-6-6-6"`, `stroke-width 2`), matching the same chevron pattern used elsewhere (menu buttons/back-buttons). `aria-hidden="true"` present since the parent `<button>` carries its own `aria-label`.
- `PauseOverlay.svelte:88-100` — dialog-shaped panel now has `background: var(--surface-2)`, `border-radius: var(--radius-lg)`, `border: 1px solid var(--line-strong)`, `box-shadow: var(--shadow-panel), var(--edge-highlight)`, scale-in `pauseContentIn` keyframe — this was previously content sitting bare on the scrim; now correctly reads as a distinct focal surface, consistent with `ConfirmDialog`'s established treatment.
- Icon-only elements: HistoryRow's chevron button carries `aria-label="Match vom {date} öffnen"` on the parent — no orphaned icon-only interactive element found.
- Visual hierarchy: countdown digits at `clamp(4rem, 10vw, 12rem)` accent-colored vs. `--text-xl` heading vs. `--text-base` subtitle — clear size/color differentiation on the pause overlay.

### Pillar 3: Color (4/4)
- Accent usage across `src/ui/overlays`, `src/ui/pwa`, `src/ui/cast` = 6 occurrences, consistent with the DS's explicit reserved list (PauseOverlay countdown+CTA, MatchWinOverlay heading/badge/CTA, ReloadPrompt's CTA via `.btn--cta` class not raw `var(--accent)`) — no overuse detected.
- Hardcoded hex-color grep across `src/ui/overlays`, `src/ui/pwa`, `src/ui/cast`, `src/ui/history`, `src/routes/+page.svelte` returned exactly one line, which is a Svelte `{#each players as player (player.id)}` keyed-each block matched by the regex's hex-digit heuristic, not an actual color literal — false positive, zero real hardcoded colors found.
- Chart recolor gate independently re-confirmed via VERIFICATION's `git diff --stat` evidence: exactly 1 changed line per chart file (`--line-strong` → `--surface-3` on non-highlighted bar fill only) — rebuild-forbidden constraint respected.

### Pillar 4: Typography (4/4)
- Grep for `20px` across all 6 restyled route/page files returned only `max-width: 520px` substring matches (false positives) plus one unrelated `min-height: 20px` on `data/+page.svelte:297` (a small UI element, not a title/heading — not in the DS Typography table's flagged list, so out of this table's scope and not a defect).
- No leftover `20px` page-title or section-heading hardcoding found — the systematic 26px/22px title/heading rule (locked by CONTEXT.md) appears fully applied across all 12 flagged selectors in the UI-SPEC Typography table.

### Pillar 5: Spacing (4/4)
- Grep for `480px` across all 6 target files (`+page.svelte`, `MatchSetup.svelte`, `history/+page.svelte`, `history/[id]/+page.svelte`, `stats/+page.svelte`, `data/+page.svelte`) returned zero matches; all 6 independently confirmed at `max-width: 520px` via direct line reads.
- `HistoryRow.svelte` spot-checked directly: `.row` uses `min-height: var(--row-h)` (token, not hardcoded 64px), `gap: var(--space-md)` (16px, matches DS fix from 8px), `.row-item` border-bottom uses `var(--line)` (not `--line-strong`) — all three flagged spacing fixes from the UI-SPEC PAGE-02 table confirmed applied correctly in source.

### Pillar 6: Experience Design (3/4)
- Loading/empty/error state coverage: DS Copywriting Contract's empty-state copy (history, stats-no-profiles, stats-profile-no-matches) and error-state copy (export/import failures) are marked "unchanged" in the contract and confirmed present per prior phase work — not re-broken by this phase's CSS-only pass.
- Destructive-action confirmation: delete-match and import-replace-all both route through `ConfirmDialog` (verify-only, already DS-correct) — confirmation pattern intact.
- Disabled/pending states: `data/+page.svelte` export button busy-copy (`"Exportiere…"`) preserved per contract, script blocks untouched per SUMMARY diffs.
- **Deduction:** WR-02 (backdrop-filter blur performance on the physical Chrome 90 Cast receiver) is a genuinely open experience-quality risk specific to this phase's overlay changes — a full-viewport blur is new hardware-performance surface area that wasn't present before Phase 12, and its resolution was correctly deferred to manual UAT rather than fixed, but it remains unverified. This is a real, if scoped and already-tracked, gap — not a 4/4 pillar.

---

## Files Audited
- `src/routes/+page.svelte`, `src/ui/setup/MatchSetup.svelte`, `src/ui/setup/PlayerPicker.svelte`
- `src/routes/history/+page.svelte`, `src/ui/history/HistoryRow.svelte`, `src/routes/history/[id]/+page.svelte`, `src/ui/history/PlayerStatRow.svelte`, `src/ui/history/MatchStatBreakdown.svelte`
- `src/routes/stats/+page.svelte`, `src/ui/stats/ProfileStatDashboard.svelte`, `src/ui/stats/ScoreDistributionChart.svelte`, `src/ui/stats/DartsPerLegChart.svelte`, `src/ui/stats/AverageTrendChart.svelte`
- `src/routes/data/+page.svelte`
- `src/ui/overlays/PauseOverlay.svelte`, `src/ui/overlays/RecordOverlay.svelte`, `src/ui/overlays/MatchWinOverlay.svelte`
- `src/ui/pwa/ReloadPrompt.svelte`, `src/ui/cast/ResumeToast.svelte`
- Cross-referenced: `.planning/phases/12-pages-overlays/12-UI-SPEC.md`, `12-CONTEXT.md`, `12-01..05-SUMMARY.md`, `12-REVIEW.md`, `12-REVIEW-FIX.md`, `12-VERIFICATION.md`
