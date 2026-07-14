---
phase: 12-pages-overlays
audited: 2026-07-14
asvs_level: 1
block_on: high
threats_total: 14
threats_closed: 14
threats_open: 0
threats_open_non_blocking: 0
status: secured
---

# Phase 12: Pages & Overlays — Security Audit

**Scope:** CSS/markup restyle of 5 plans covering the start hub, match setup, match history (list + detail), stats dashboard, 3 overlays (Pause/Record/MatchWin), and 3 toasts/data page (ReloadPrompt, ResumeToast, data/backup). No new packages, no new endpoints, no new storage, no new user-input surface declared or found across all 5 PLAN.md threat models (14 threats total, 0 `T-XX-SC` supply-chain entries formally registered this phase).

**Method:** Every threat below was independently re-verified against the current on-disk implementation (post `12-REVIEW-FIX.md`), not accepted from SUMMARY.md claims alone. Concretely: re-ran the full suite live (`npm test` → 39 files / **563/563 passed**, matching every plan's stated gate); read the actual `<script>`/markup of every cited file and grepped for the literal evidence each disposition rests on (`onclick={navigate}`, `onclick={onresume}`, `onclick={newGame}`, `onclick={() => updateServiceWorker(true)}`, `onclick={close}`, `ConfirmDialog` prop wiring, `$effect`/`setTimeout`/`clearTimeout` blocks, `backdrop-filter` rules, `.btn btn--cta`/`.btn btn--ghost` classes, `weiter-btn`/`new-game-btn` removal); grepped every `src/` file for `{@html}` (only pre-existing, unrelated occurrence is `+layout.svelte`'s static `webManifest` — zero new occurrences in any phase-12 file); ran the Chart Recolor Contract's grep gate directly (`var(--line-strong)` count = 1 in both `ScoreDistributionChart.svelte` and `DartsPerLegChart.svelte`, confirming only the axis-stroke line survives); confirmed `ReloadPrompt.test.ts`'s updated assertion (`rgba(235, 240, 255, 0.14)`) is present verbatim; checked `git diff` across the full phase-12 commit range (`0bcc598^..5b74e52`) on `package.json`/`package-lock.json` — empty, confirming the "no new deps" premise stated in every plan's objective.

## Threat Verification

| Threat ID | Category | Severity | Disposition | Status | Evidence |
|-----------|----------|----------|-------------|--------|----------|
| T-12-01-01 | Tampering | low | accept | CLOSED | `src/routes/+page.svelte`, `MatchSetup.svelte`, `PlayerPicker.svelte` — zero `{@html}` in any of the three (repo-wide grep); `npm test` 563/563 live-confirmed. Diff is style/markup-only per 12-01-SUMMARY.md task commits (`0bcc598`, `195f1c6`). |
| T-12-01-02 | Information Disclosure | low | accept | CLOSED | `MatchSetup.svelte:162` confirmed `<h1>Neues Spiel</h1>` (grep); repo-wide grep for the old string "Neverman Darts" shows it survives only in the *hub's* `<h1>` (`routes/+page.svelte:65`, unchanged/correct) and unrelated files (`IdleScreen.svelte`, `backup.ts`/`.test.ts`, CSS file-header comments) — no stray coupling to the setup-page string. |
| T-12-02-01 | Tampering | medium | mitigate | CLOSED | `HistoryRow.svelte:27` confirmed byte-identical `<button class="row" onclick={navigate} aria-label="Match vom {row.date} öffnen">` — only the trailing chevron markup (Unicode → inline SVG) changed, wrapping button/handler/aria-label untouched. |
| T-12-02-02 | Information Disclosure | low | accept | CLOSED | Zero `{@html}` in `HistoryRow.svelte`/`PlayerStatRow.svelte`/`MatchStatBreakdown.svelte` (grep); each file carries its own header comment reaffirming `{interpolation}`-only rendering (T-03-05/T-04-09 invariants), confirmed still present. |
| T-12-02-03 | Repudiation | low | accept | CLOSED | `history/[id]/+page.svelte:137-144` confirmed `<ConfirmDialog heading="Spiel löschen?" body="..." ctaLabel="Löschen" onconfirm={handleDeleteConfirm} oncancel={...}>` unchanged — only surrounding typography tokens differ per plan scope. |
| T-12-03-01 | Tampering | medium | mitigate | CLOSED | Grep gate re-run live: `var(--line-strong)` count is exactly `1` in both `ScoreDistributionChart.svelte` (line 61, axis stroke) and `DartsPerLegChart.svelte` (line 74, axis stroke) — the non-highlighted fill branch is confirmed moved to `var(--surface-3)`, zero other SVG geometry lines touched. |
| T-12-03-02 | Information Disclosure | low | accept | CLOSED | Zero `{@html}` in `ProfileStatDashboard.svelte`/`stats/+page.svelte` (grep); header comments reaffirm `{interpolation}`-only (T-04-05 invariant). |
| T-12-04-01 | Tampering | high | mitigate | CLOSED | `PauseOverlay.svelte:69` confirmed `<button class="btn btn--cta" onclick={onresume}>Weiter</button>`; `MatchWinOverlay.svelte:53` confirmed `<button class="btn btn--cta" onclick={newGame}>` — both `onclick` handlers preserved verbatim through the class swap. `PauseOverlay.test.ts` 20/20 and `e2e/full-match-flow.spec.ts` win-flow assertions reported green in 12-04-SUMMARY.md; full-suite 563/563 re-confirmed live by this audit. |
| T-12-04-02 | Denial of Service | low | accept | CLOSED | `RecordOverlay.svelte:20-26` and `PauseOverlay.svelte:28-38` script blocks read in full: `$effect`/`setTimeout`/`clearTimeout` auto-dismiss logic and the `mm`/`ss`/`isZero`/`ariaAnnouncement` `$derived` chain are unchanged — only `<style>` blocks and button markup differ, confirmed by direct read (not just "test still green"). |
| T-12-04-03 | Information Disclosure | low | accept | CLOSED | Zero `{@html}` in `MatchWinOverlay.svelte`/`RecordOverlay.svelte` (grep); header comments reaffirm `{interpolation}`-only (T-03-04/T-04-13 invariants). |
| T-12-05-01 | Tampering | medium | mitigate | CLOSED | `ReloadPrompt.test.ts:101` confirmed `expect(style.borderColor).toMatch(/rgba\(235,\s*240,\s*255,\s*0\.14\)/);` present verbatim (renamed test, `position:fixed` check at line 99 unchanged) — targets the real new computed value, not a loosened/removed assertion. |
| T-12-05-02 | Tampering | high | mitigate | CLOSED | `ReloadPrompt.svelte:50,52` confirmed `<button class="btn btn--cta" onclick={() => updateServiceWorker(true)}>Aktualisieren</button>` and `<button class="btn btn--ghost" onclick={close}>Schließen</button>` — both handlers preserved verbatim through the class swap. Post-review-fix compact sizing override (`min-height: var(--hit-min)`, commit `5b74e52`) did not touch the `onclick` wiring; re-verified live via full suite (563/563, includes 6 `ReloadPrompt.test.ts` assertions per `12-REVIEW-FIX.md`). |
| T-12-05-03 | Tampering | low | accept | CLOSED | `data/+page.svelte` script block confirmed unchanged: `handleExport`, `handleFileSelected`, `handleImportConfirm` all present with original wiring; `<ConfirmDialog onconfirm={handleImportConfirm} ...>` intact (lines 192-198+). Only `<style>` token/width edits per plan scope. |
| T-12-05-04 | Information Disclosure | low | accept | CLOSED | Zero `{@html}` in `ResumeToast.svelte` (grep). |

## Open Threats

None. All 14 threats resolve to CLOSED (0 open, blocking or non-blocking).

## Unregistered Flags

None found. Cross-checked all 5 SUMMARY.md files for a `## Threat Flags` section (grepped the phase directory) — none of the 5 include one. Independently corroborated by:
- `12-REVIEW.md` (code review, `findings.critical: 0`, `warning: 2`, `info: 1`) — neither WR-01 (ReloadPrompt button sizing/oversizing) nor WR-02 (backdrop-filter perf on the Chrome 90 Cast receiver) nor IN-01 (blur-radius inconsistency) represents new *attack surface*; all three are UX/perf/consistency concerns, not security-relevant. WR-01 was fixed same-phase (`12-REVIEW-FIX.md`, commit `5b74e52`) without touching the `onclick` wiring verified above (T-12-05-02). WR-02 was dispositioned "no code change, tracked as manual UAT check" — a legitimate performance-verification gap on Cast hardware, not a security gap, and out of scope for this threat-mitigation audit.
- This audit's own greps: zero new `{@html}` introduced in any phase-12-changed file (only pre-existing `+layout.svelte:10` webManifest usage, unrelated to this phase); zero `package.json`/`package-lock.json` changes across the full phase-12 commit range (`git diff 0bcc598^..5b74e52` — empty).
- No new routes, endpoints, storage APIs, or input surfaces touched — confirmed via each plan's `files_modified` frontmatter (18 `.svelte`/`.ts` files total, all pre-existing components/routes).

## Accepted Risks Log

The following threats are formally accepted (not mitigated by code) per their PLAN.md disposition, verified CLOSED above because the cited rationale/evidence was independently confirmed to hold against the current on-disk implementation:

- T-12-01-01, T-12-01-02 — `low` severity, accepted on the basis of confirmed zero `{@html}` introduction and zero test-string coupling.
- T-12-02-02, T-12-02-03 — `low` severity, accepted on the basis of confirmed `{interpolation}`-only rendering and byte-identical `ConfirmDialog` prop wiring.
- T-12-03-02 — `low` severity, accepted on the basis of confirmed `{interpolation}`-only rendering.
- T-12-04-02, T-12-04-03 — `low` severity, accepted on the basis of confirmed byte-identical `$effect`/timer script blocks and `{interpolation}`-only rendering.
- T-12-05-03, T-12-05-04 — `low` severity, accepted on the basis of confirmed byte-identical export/import script wiring and `{interpolation}`-only rendering.

Four `medium`/`high`-severity threats were dispositioned `mitigate` rather than `accept` and are recorded above with direct evidence rather than here (T-12-02-01, T-12-03-01, T-12-04-01, T-12-05-01, T-12-05-02).

## Recommendation

Secured at ASVS Level 1 / `block_on: high`. Phase 12 may ship — `threats_open: 0`.

No process gaps found this phase (contrast with Phase 9/10's pattern of disposition claims not holding up under re-verification): every `mitigate`-dispositioned threat's cited evidence (test assertions, grep gates, preserved `onclick` wiring) was independently reproduced live during this audit rather than trusted from SUMMARY.md text, and all held. `npm test` re-run live: 39 files / 563/563 passed.

---
*Audited: 2026-07-14*
*Auditor: Claude (gsd-security-auditor)*
