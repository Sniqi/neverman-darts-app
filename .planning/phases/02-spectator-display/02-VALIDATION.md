---
phase: 2
slug: spectator-display
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (unit + browser projects) + Playwright 1.60.0 (e2e) |
| **Config file** | `vite.config.ts` (two Vitest projects: `unit` node env + `browser` Playwright) + `playwright.config.ts` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (unit ~5 s, browser ~20 s, e2e ~25 s separately) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit` (and `npm run test:browser -- <component>.test.ts` for UI tasks)
- **After every plan wave:** Run `npm test` (unit + browser)
- **Before `/gsd-verify-work`:** Full suite must be green; `npx playwright test e2e/spectator-sync.spec.ts` must pass (it is an intended-red baseline until Plan 04)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DISP-03 | T-02-01 | Average math has no injection surface; pure functions over typed Visit[] | unit | `npm run test:unit -- src/engine/averages.test.ts src/engine/reducer.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DISP-05 | T-02-01 / T-02-02 | JSON.parse of snapshot inside try/catch → null on failure; same-origin channel | unit | `npm run test:unit -- src/stores/display.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DISP-05 | T-02-02 / T-02-03 | Publisher post + setItem guarded in try/catch; non-fatal on quota/SSR | unit | `npm run test:unit -- src/stores/match.svelte.test.ts` | ✅ extend | ⬜ pending |
| 02-02-02 | 02 | 2 | DISP-03, DISP-04, DISP-05 | T-02-04 | Player names via `{name}` interpolation only; no `{@html}` | browser | `npm run test:browser -- src/ui/display/PlayerPanel.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | DISP-03 | T-02-04 | VisitLine + checkout via getSuggestion; interpolation only | browser | `npm run test:browser -- src/ui/display/VisitLine.test.ts src/ui/display/PlayerPanel.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | DISP-03 | T-02-04 / T-02-05 | LegWinBanner name in accent via interpolation; MatchWinDisplay covered by Plan-04 e2e | browser | `npm run test:browser -- src/ui/display/LegWinBanner.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 4 | DISP-01, DISP-02 | T-02-06 / T-02-07 | window.open `'noopener,noreferrer'`; popup-blocked null-check; no `{@html}` | browser | `npm run test:browser -- src/ui/display/SpectatorChooser.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | DISP-01, DISP-02, DISP-05 | T-02-06 / T-02-07 | requestFullscreen from user gesture, try/catch on denial; turns e2e green | e2e | `npx playwright test e2e/spectator-sync.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: 02-04-03 (end-of-phase human-verify review) is a `checkpoint:human-verify` task with no automated command — covered under Manual-Only Verifications below.*

---

## Wave 0 Requirements

- [ ] `src/engine/averages.test.ts` — average computation: leg + match, bust = 3 darts/0 scored, numpad = 3 darts, zero-visit guard returns null (Task 02-01-01)
- [ ] `src/stores/display.svelte.test.ts` — DisplayStore hydration from localStorage, BroadcastChannel subscription, corrupt-snapshot null guard, cleanup closes channel (Task 02-01-02)
- [ ] `src/ui/display/PlayerPanel.test.ts` — 1–4 player render, active highlight, Ø Leg / Ø Match labels, "—" for zero-visit, display-scale font, setsEnabled branch (Tasks 02-02-02, 02-03-01)
- [ ] `src/ui/display/VisitLine.test.ts` — live three-slot line, completed dart visit, numpad total-only, formatDart special cases (Task 02-03-01)
- [ ] `src/ui/display/LegWinBanner.test.ts` — null = no DOM, message renders full-screen, winner name in accent (Task 02-03-02)
- [ ] `src/ui/display/SpectatorChooser.test.ts` — menu opens/closes, two options, window.open args, popup-blocked text, aria-label, 48px targets (Task 02-04-01)
- [ ] `e2e/spectator-sync.spec.ts` — created RED in Plan 01 (Task 02-01-02); turned GREEN in Plan 04 (Task 02-04-02): second window opens + shows state, dart entry syncs to /display, reload mid-match re-hydrates

*`src/stores/match.svelte.test.ts` already exists and is extended (not created) by Task 02-02-01.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tablet in-app fullscreen via gesture | DISP-02 / D-15 | `requestFullscreen()` needs a real user gesture in a real browser/device; headless cannot grant true fullscreen reliably | On a touch device or emulation: choose "Anzeige hier im Vollbild" → tap "Vollbild aktivieren" → confirm true borderless fullscreen; tap → "Zurück zur Eingabe" appears, auto-hides ~3 s; tap it → returns to /match |
| 27" / 3 m readability | DISP-04 | Physical legibility from 3 m on a 27" panel cannot be asserted in code (browser tests only smoke-check font-size ≥ 64px) | View /display on a 27" monitor from ~3 m; confirm remaining score, active-player glow/dimming, and German labels are clearly legible |
| Match-win display end-to-end | DISP-03 / D-10 | `MatchWinDisplay.svelte` has no dedicated component test; its render path is exercised live | Win a match; confirm the persistent "[Name] gewinnt!" display shows final standing + Ø Match and persists until a new match starts (also exercised by the Plan-04 e2e spectator-sync flow) |

*Covered by the Plan 04 Task 3 `checkpoint:human-verify` end-of-phase review (8-step walkthrough).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-11
