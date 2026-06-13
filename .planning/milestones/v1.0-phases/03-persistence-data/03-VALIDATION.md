---
phase: 3
slug: persistence-data
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (unit + browser) + Playwright 1.60.0 (E2E); svelte-check 4.6.0 (types) |
| **Config file** | `vite.config.ts` (Vitest `unit` + `browser` projects); `playwright.config.ts` (E2E, baseURL `http://localhost:4173`) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit && npm run check && npx playwright test` |
| **Type-check command** | `npm run check` |
| **Estimated runtime** | ~45 seconds (unit ~5s, check ~10s, E2E ~30s incl. build+preview) |

Note: `npm run test:unit` runs the Vitest `unit` project only (`vitest run --project=unit`). `npm test` (`vitest run`) runs unit + browser projects together; use it at wave-merge if browser-project component tests are added.

---

## Sampling Rate

- **After every task commit:** Run that task's mapped `<automated>` command (see Per-Task Verification Map). For the unit-test tasks this is a scoped `npm run test:unit -- <file>`; for UI/type tasks it is `npm run check`; for the resume slice it is `npx playwright test e2e/resume.spec.ts`.
- **After every plan wave:** Run `npm run test:unit && npm run check` (full unit + type-check across all files touched so far).
- **Before `/gsd-verify-work`:** Full suite must be green — `npm run test:unit && npm run check && npx playwright test`.
- **Max feedback latency:** ~30 seconds (longest single mapped command is the resume E2E, which builds + previews).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FLOW-03 | T-03-01 / T-03-02 | Corrupt/non-`playing` snapshot rejected (JSON.parse in try/catch → null; phase-guard) | unit | `npm run test:unit -- src/lib/storage.test.ts src/stores/match.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FLOW-03 | T-03-03 | Restored player names rendered via `{interpolation}` only, no `{@html}` | type | `npm run check` | ✅ | ⬜ pending |
| 03-01-03 | 01 | 1 | FLOW-03 | T-03-01 | End-to-end: mid-match reload → resume prompt → exact restore; Verwerfen clears | e2e | `npx playwright test e2e/resume.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | STAT-06 | T-03-06 | `#persistCompletedMatch` in try/catch; failed `db.matches.add` is atomic, never corrupts | unit | `npm run test:unit -- src/db/matches.test.ts src/stores/match.svelte.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | STAT-06 | T-03-05 | History row stored names via `{interpolation}`, no `{@html}` | type | `npm run check` | ✅ | ⬜ pending |
| 03-02-03 | 02 | 2 | STAT-06 | T-03-04 / T-03-05 | `[id]` parsed via `parseInt`+`isNaN` → 404 before query; detail names interpolated | type | `npm run check` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 3 | PROF-03 | T-03-SC | Blocking-human npm package-legitimacy gate before install (never auto-approved) | gate | `node -e "process.exit(require('./package.json').dependencies['dexie-export-import'] ? 0 : 1)"` | ✅ (package.json) | ⬜ pending |
| 03-03-02 | 03 | 3 | PROF-03 | T-03-07 / T-03-08 | `validateImportFile()` (`peakImportFile` + `databaseName` gate) rejects foreign/corrupt before any write; replace-all clears tables | unit | `npm run test:unit -- src/lib/backup.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 3 | PROF-03 | T-03-09 / T-03-10 | Imported strings interpolated (no `{@html}`); storage warning surfaced; foreign file → German error, no dialog | type | `npm run check` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**E2E-as-task-verify tradeoff (Task 03-01-03):** This is the one task whose `<automated>` verification is an E2E test rather than a unit test, and it is justified. Plan 01 is the crash-resume vertical slice; FLOW-03's core guarantee ("an in-progress match survives a browser reload and resumes exactly") is only provable by driving a real match partway, reloading the page, and asserting the restored remaining score at `/match`. The underlying logic (`loadUnfinishedMatch` phase discrimination, `matchStore.restore()` round-trip) is already unit-covered in Task 03-01-01; the E2E in Task 03-01-03 proves the wiring of that logic through the start screen, navigation, and store end-to-end. The latency cost (build+preview, ~30s) is accepted because no unit test can substitute for the reload boundary.

---

## Wave 0 Requirements

- [ ] `src/lib/storage.ts` + `src/lib/storage.test.ts` — FLOW-03 resume detection (`loadUnfinishedMatch`, `clearUnfinishedMatch`, storage helpers). Created in Plan 01 Task 1 (RED→GREEN).
- [ ] Extend `src/stores/match.svelte.test.ts` — `matchStore.restore()` round-trip (Plan 01 Task 1) and persist-on-complete + resume-slot clear (Plan 02 Task 1).
- [ ] `e2e/resume.spec.ts` — FLOW-03 end-to-end crash-resume slice. Created in Plan 01 Task 3.
- [ ] `src/db/matches.ts` + `src/db/matches.test.ts` — STAT-06 CRUD + liveQuery + `toHistoryRow`. Created in Plan 02 Task 1 (RED→GREEN).
- [ ] `src/lib/backup.ts` + `src/lib/backup.test.ts` — PROF-03 export/validate/import wrapper. Created in Plan 03 Task 2 (RED→GREEN), after the package-legitimacy gate (Task 1) installs `dexie-export-import`.

Existing infrastructure (Vitest unit/browser projects, Playwright, svelte-check, `fake-indexeddb`) is already configured; no framework install is needed. The only new dependency is `dexie-export-import`, gated by Plan 03 Task 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Package legitimacy of `dexie-export-import` | PROF-03 | Human judgment on npmjs.com provenance (typosquat check) cannot be automated; legitimacy gates ignore auto-advance | Open https://www.npmjs.com/package/dexie-export-import; confirm Dexie org, repo `github.com/dexie/Dexie.js`, 4.x version, healthy downloads; approve, then executor runs `npm install dexie-export-import` |
| Storage-near-full warning rendering | PROF-03 | `navigator.storage.estimate()` returning >80% cannot be reliably forced in CI; logic is unit-testable but the visual banner is verified by hand | On `/data`, with storage near quota, confirm the accent banner with the German warning text appears |

All other phase behaviors have automated verification via the Per-Task Verification Map.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (every code-producing task maps to a unit/check/E2E command; the checkpoint task has a `node -e` package-presence check)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task in every wave has a mapped command)
- [x] Wave 0 covers all MISSING references (`storage.ts`/`.test.ts`, `matches.ts`/`.test.ts`, `backup.ts`/`.test.ts`, extended `match.svelte.test.ts`, `e2e/resume.spec.ts`)
- [x] No watch-mode flags (all commands are `vitest run` / `playwright test` / `svelte-check`, single-shot)
- [x] Feedback latency < 30s (longest mapped command is the resume E2E build+preview)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-12
