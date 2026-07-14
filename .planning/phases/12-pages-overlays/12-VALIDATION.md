---
phase: 12
slug: pages-overlays
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-14
---

# Phase 12 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (unit + browser) + Playwright 1.60.x (E2E) |
| **Quick run command** | `npm run test:unit` (node project) / `npm run test:browser -- <file>` (browser-mode component test) |
| **Full suite command** | `npm test && npx playwright test` |

## Sampling Rate

- After every task commit: the task's specific `npm run test:browser -- <file>` where a dedicated test exists, else `npm test` (full regression + design-tokens guard)
- After every plan wave: full suite (`npm test` = 563+ vitest, `npx playwright test` = 12/12 E2E)
- Max feedback latency: 180 s

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-T1 | 12-01 | 1 | PAGE-01 | T-12-01-01 | Hub CSS/markup diff, existing onclick/aria untouched | regression | `npm test` | ✅ (no dedicated test) | ⬜ pending |
| 12-01-T2 | 12-01 | 1 | PAGE-01 | T-12-01-01, T-12-01-02 | Setup h1 copy fix + 4 switches keep accessible names | unit (browser) + regression | `npm run test:browser -- src/ui/setup/MatchSetup.test.ts && npm test` | ✅ | ⬜ pending |
| 12-02-T1 | 12-02 | 1 | PAGE-02 | T-12-02-01 | HistoryRow navigate() onclick preserved through chevron swap | regression | `npm test` | ✅ (no dedicated test) | ⬜ pending |
| 12-02-T2 | 12-02 | 1 | PAGE-02 | T-12-02-03 | Delete-match ConfirmDialog wiring untouched | regression | `npm test` | ✅ (no dedicated test) | ⬜ pending |
| 12-03-T1 | 12-03 | 1 | PAGE-03 | T-12-03-02 | Profile/stat values via {interpolation} only, unchanged | regression | `npm test` | ✅ (no dedicated test) | ⬜ pending |
| 12-03-T2 | 12-03 | 1 | PAGE-03 | T-12-03-01 | REBUILD FORBIDDEN — 2-line fill fix, geometry untouched | regression + scoped grep gate | `grep -c "var(--line-strong)" src/ui/stats/ScoreDistributionChart.svelte src/ui/stats/DartsPerLegChart.svelte && npm test` | ✅ (no dedicated test) | ⬜ pending |
| 12-04-T1 | 12-04 | 1 | PAGE-04 | T-12-04-02 | Countdown/auto-dismiss/win-derivation script blocks untouched; class names preserved verbatim | unit (browser) | `npm run test:browser -- src/ui/overlays/PauseOverlay.test.ts` | ✅ | ⬜ pending |
| 12-04-T2 | 12-04 | 1 | PAGE-04 | T-12-04-01 | onclick handlers preserved verbatim through button class swap | unit (browser) + E2E | `npm run test:browser -- src/ui/overlays/PauseOverlay.test.ts && npx playwright test e2e/full-match-flow.spec.ts` | ✅ | ⬜ pending |
| 12-05-T1 | 12-05 | 1 | PAGE-04 | T-12-05-01, T-12-05-02 | Border-color assertion updated same-commit (not loosened); onclick handlers preserved | unit (browser) | `npm run test:browser -- src/ui/pwa/ReloadPrompt.test.ts` | ✅ | ⬜ pending |
| 12-05-T2 | 12-05 | 1 | PAGE-04 | T-12-05-03 | Export/import/storage-warning script blocks untouched | regression | `npm test` | ✅ (no dedicated test) | ⬜ pending |

## Wave 0 Requirements

- [x] No new test scaffolding required — this phase is CSS/markup-only against an already-approved UI-SPEC, with zero new business logic to unit-test from scratch.
- [x] One existing test file needs a same-commit assertion update (not a new scaffold): `src/ui/pwa/ReloadPrompt.test.ts`'s border-color assertion (line ~93-102) must move from asserting accent `rgb(240,164,36)` to the new `--line-strong` computed value `rgba(235,240,255,0.14)`, landing in the same commit as Plan 12-05 Task 1's `.pwa-toast` border CSS fix (RESEARCH.md Pitfall 1). This is embedded directly in 12-05-PLAN.md Task 1 — no separate Wave 0 plan needed since all 5 plans are independent Wave 1 plans with zero cross-plan dependency.
- [x] All 5 plans are Wave 1 (no `depends_on`, zero `files_modified` overlap) — nothing blocks parallel execution.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hub/setup 520px column, boxed "Profile verwalten" list-box, DS type scale | PAGE-01 | No test asserts container width, list-box CSS, or font-size values — `design-tokens.test.ts` only guards against old provisional hex literals, not layout/typography | Load `/` and `/setup` in a browser; compare against `12-UI-SPEC.md`'s Spacing/Typography/PAGE-01 tables — confirm 520px centered column, boxed collapsible Profile-verwalten section, "Neues Spiel" setup title |
| HistoryRow visual diff (list-box border, row gap/height, chevron SVG, tabular result) | PAGE-02 | No `HistoryRow.test.ts` exists; E2E specs don't assert history-row content | Load `/history` with ≥1 completed match; compare against `12-UI-SPEC.md`'s PAGE-02 History list table — confirm boxed list, 16px row gap, inline SVG chevron (no `›` glyph), tabular-nums result |
| History detail typography (title/section-heading/summary/stat-row sizes) | PAGE-02 | No dedicated test file for `history/[id]/+page.svelte`, `PlayerStatRow.svelte`, or `MatchStatBreakdown.svelte` | Open a completed match's detail view; compare font sizes against `12-UI-SPEC.md`'s Typography table rows for these 3 files |
| Chart fill-color visual (bar recolor, axis/highlight unchanged) | PAGE-03 | SVG color inspection has no automated visual-regression tool in this project | Open `/stats` for a profile with match history; visually confirm non-highlighted bars in both bar charts render `--surface-3` grey (not the axis-hairline `--line-strong` shade) while the highlighted bar stays accent-colored |
| Overlay panel treatment (backdrop-blur, surface-2 panel, scale-in) | PAGE-04 | No automated `backdrop-filter`/animation visual assertion exists; `PauseOverlay.test.ts` checks DOM/text/class presence, not the rendered blur/panel look | Trigger auto-pause (or PauseOverlay's Storybook-less manual render), the match-win overlay, and a personal-record celebration during a match; confirm blurred scrim + boxed panel matching `12-UI-SPEC.md`'s PAGE-04 Overlays table |
| Toast + data-page typography/color (ReloadPrompt, ResumeToast, data/+page.svelte) | PAGE-04 | `ReloadPrompt.test.ts` covers text/behavior/border-color only, not background/padding/button-class visuals; no test exists for `ResumeToast.svelte` or `data/+page.svelte` | Trigger a PWA update toast (or inspect via devtools), a Cast resume toast (on-device, out of scope for this phase's automated gate), and load `/data`; compare against `12-UI-SPEC.md`'s PAGE-04 Toasts table |

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (specific component test where one exists, else full-suite regression `npm test` as the safety net; no `MISSING` scaffolds needed)
- [x] Sampling continuity · Wave 0 covers the one same-commit test update (embedded in 12-05-T1) · No watch-mode · Latency < 180s
- [x] `nyquist_compliant: true`

**Approval:** approved (planning-stage; final phase gate is `npm test && npx playwright test` fully green per CONTEXT.md's explicit gate, confirmed at `/gsd-verify-work 12`)
