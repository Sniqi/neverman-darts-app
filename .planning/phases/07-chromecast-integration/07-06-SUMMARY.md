---
phase: 07-chromecast-integration
plan: "06"
subsystem: display-polish-and-deployment
tags: [recv-05, setup-02, setup-03, tdd, pwa, cast]
status: complete

dependency_graph:
  requires: []
  provides:
    - RECV-05 remaining-score color flash on PlayerPanel
    - VITE_CAST_APP_ID build-time injection from GitHub Actions repo variable
    - SETUP-03 written Cast Console registration guide
  affects:
    - src/ui/display/PlayerPanel.svelte
    - .github/workflows/deploy.yml
    - docs/CAST-SETUP.md

tech_stack:
  added: []
  patterns:
    - "BUST-flash $effect + setTimeout pattern extended for RECV-05 updating flash"
    - "GitHub Actions vars. (repo variable) for non-secret build-time env injection"
    - "deploy-then-register ordering documented in CAST-SETUP.md (Pitfall 10)"

key_files:
  created:
    - docs/CAST-SETUP.md
    - .env.example
  modified:
    - src/ui/display/PlayerPanel.svelte
    - src/ui/display/PlayerPanel.test.ts
    - .github/workflows/deploy.yml

decisions:
  - "showUpdating $state + $effect mirrors existing showBust pattern exactly — same $state/$effect/setTimeout/onDestroy structure, 300ms timer instead of 2000ms"
  - "VITE_CAST_APP_ID uses vars. not secrets. in deploy.yml — App ID ships in client bundle, is not a secret (D-09/SETUP-02)"
  - "docs/CAST-SETUP.md written for developer audience in English prose — guide covers non-code prerequisite, all 7 steps from fee to verify"

metrics:
  duration: "~5 min"
  completed: "2026-06-18T19:20:16Z"
  tasks_completed: 3
  files_changed: 5
---

# Phase 07 Plan 06: Polish + Deployment Items Summary

**One-liner:** RECV-05 remaining-score white-flash on update (TDD), VITE_CAST_APP_ID repo-variable build wiring, and written Cast Console registration guide.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | RECV-05 remaining-score transition (TDD RED) | 71ccdd5 | PlayerPanel.test.ts |
| 1 | RECV-05 remaining-score transition (TDD GREEN) | 0f48811 | PlayerPanel.svelte |
| 2 | VITE_CAST_APP_ID build wiring | 911d67c | deploy.yml, .env.example |
| 3 | SETUP-03 Cast Console registration guide | 4087b64 | docs/CAST-SETUP.md |

---

## What Was Built

### Task 1 — RECV-05 remaining-score update flash (TDD)

Extended `PlayerPanel.svelte` with a `showUpdating` `$state` + `$effect` + `setTimeout` flash that mirrors the existing BUST-flash pattern exactly:

- `let showUpdating = $state(false)` / `let updatingTimer` / `let prevRemaining: number | null = null`
- `$effect` reads `liveRemaining`, skips the first run (`prevRemaining === null`), then on any change: sets `showUpdating = true`, clears any pending timer, starts a 300ms timer that resets `showUpdating = false`
- `onDestroy` cleanup extended to also clear `updatingTimer`
- Template: `class:updating={showUpdating}` on `.remaining-score` div
- CSS: `transition: color 300ms ease-out` on `.remaining-score`; `.remaining-score.updating { color: #ffffff }` for the flash
- No `transform` — color-only, layout-safe (SYNC-04)

Tests added (3 new, all passing): no `.updating` on initial render; `.updating` present immediately after `liveRemaining` changes; `.updating` absent after 400ms wait. All 14 PlayerPanel tests pass.

### Task 2 — VITE_CAST_APP_ID build wiring

Added `VITE_CAST_APP_ID: ${{ vars.VITE_CAST_APP_ID }}` to the existing Build step `env:` block in `.github/workflows/deploy.yml`, alongside `BASE_PATH`. Uses `vars.` (repo variable), not `secrets.` — the App ID ships in the client bundle and is not secret (D-09/SETUP-02).

Created `.env.example` documenting `VITE_CAST_APP_ID=` with a comment explaining Cast Console origin, GitHub Actions wiring, and `.env.local` local-dev setup. `.gitignore` unchanged (`.env.*` / `!.env.example` rules already present).

### Task 3 — SETUP-03 written Cast Console registration guide

Created `docs/CAST-SETUP.md` — 7-step developer guide covering:

1. One-time $5 Cast Developer registration + permanent-email warning (Pitfall 9)
2. Creating an **unpublished** Custom Receiver (private, no Google review)
3. Deploy-then-register URL ordering (Pitfall 10) — deploy first, `curl`/verify URL, then enter in Cast Console
4. Chromecast serial number registration
5. 15-minute propagation wait + device reboot requirement (Pitfall 11)
6. `VITE_CAST_APP_ID` wiring for GitHub Actions repo variable and local `.env.local`
7. End-to-end verification walkthrough (open `/match` in Chrome, tap Cast row, confirm TV score)

Includes a device-gated requirement table listing which E2E checks (CAST-01/03/05, RECV-01/04) depend on this registration being complete.

---

## Verification Results

- `npx vitest run --project browser src/ui/display/PlayerPanel.test.ts` — 14/14 tests pass (RECV-05 + all pre-existing)
- `grep "vars.VITE_CAST_APP_ID" .github/workflows/deploy.yml` — matches (SETUP-02)
- `docs/CAST-SETUP.md` — exists, contains "unpublished" and "VITE_CAST_APP_ID" (SETUP-03)
- No `transform` added to `.remaining-score` — color-only transition confirmed (SYNC-04 safe)

---

## Deviations from Plan

None — plan executed exactly as written.

The TDD cycle followed the established BUST-flash analog from `07-PATTERNS.md`. The `describe` import needed to be added alongside `test` from vitest (the existing test file used only `test`-level imports), which is a minor setup detail, not a deviation.

---

## Known Stubs

None. All three artifacts are fully wired:
- `PlayerPanel.svelte` `.updating` flash is live (no placeholder)
- `deploy.yml` injects `VITE_CAST_APP_ID` at build time (no hardcoded value)
- `docs/CAST-SETUP.md` is a complete written guide (no TODO sections)

---

## Threat Flags

No new threat surface introduced beyond what the plan's threat model covers:
- T-07-03 (App ID in source) mitigated: `VITE_CAST_APP_ID` in repo variable + gitignored `.env.local` + `.env.example` empty placeholder — confirmed no hardcoded value anywhere in committed code.

---

## Self-Check: PASSED

- [x] `src/ui/display/PlayerPanel.svelte` — modified, committed 0f48811
- [x] `src/ui/display/PlayerPanel.test.ts` — modified, committed 71ccdd5
- [x] `.github/workflows/deploy.yml` — modified, committed 911d67c
- [x] `.env.example` — created, committed 911d67c
- [x] `docs/CAST-SETUP.md` — created, committed 4087b64
- [x] All 4 commits verified in git log
- [x] 14/14 tests pass on final run
