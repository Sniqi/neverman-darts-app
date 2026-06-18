---
phase: 07-chromecast-integration
plan: "03"
subsystem: cast-sender
tags: [cast, tdd, state-machine, session-lifecycle]
status: complete

dependency_graph:
  requires: [07-01, 07-02]
  provides: [cast-sender-manager, cast-sender-singleton]
  affects: [07-05-match-wiring, 07-06-spectator-chooser]

tech_stack:
  added: []
  patterns:
    - "CastSenderManager: class + $state (mirrors MatchStore pattern)"
    - "One-shot signal via $state + consume method (resumeDeviceName)"
    - "TDD RED/GREEN gate with globalThis Cast SDK mock in Node unit env"
    - "Fire-and-forget sendSnapshot with try/catch (mirrors #broadcastPause)"
    - "Deferred window/document access: only inside init(), never at module load"

key_files:
  created:
    - src/lib/cast-sender.svelte.ts
  modified:
    - src/lib/cast-sender.test.ts

decisions:
  - "resumeDeviceName $state field + consumeResumeSignal() method chosen for CAST-06 one-shot signal — mirrors the existing pushback-then-read pattern; avoids callback indirection"
  - "Cast SDK mock uses globalThis assignment (not vi.mock) for Node unit env — consistent with existing test-setup-node.ts approach"
  - "SESSION_RESUMED handler reads device name from ctx.getCurrentSession() (not event.session) to match the real SDK type surface"

metrics:
  duration: "~3 min"
  completed: 2026-06-18
  tasks_completed: 2
  files_modified: 2
---

# Phase 7 Plan 03: CastSenderManager Summary

CastSenderManager class + singleton implementing the Cast sender-side session state machine: availability tracking, session transitions (CAST-02), graceful non-Chrome degradation (CAST-04), ORIGIN_SCOPED auto-rejoin (CAST-05), one-shot resume toast signal (CAST-06), and App-ID-via-parameter contract (SETUP-02).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | CastSenderManager state-machine tests | b3a43be | src/lib/cast-sender.test.ts |
| 2 (GREEN) | Implement CastSenderManager | 6b14747 | src/lib/cast-sender.svelte.ts |

## TDD Gate Compliance

- RED commit `b3a43be`: `test(07-03): add CastSenderManager state-machine tests` — all 16 tests failed (Cannot find module)
- GREEN commit `6b14747`: `feat(07-03): implement CastSenderManager` — all 16 tests pass

## Verification

- `npx vitest run --project unit src/lib/cast-sender.test.ts` — 16/16 passed
- `grep loadCastFramework=1 src/lib/cast-sender.svelte.ts` — present on line 20
- No `urn:x-cast:dev.neverman.match` literal outside `sync-constants.ts` — PASS (SETUP-02/D-05)
- No hard-coded App ID in `cast-sender.svelte.ts` — PASS (SETUP-02)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — `CastSenderManager` is fully implemented. The singleton `castSenderManager` is wired into the match page and match store in Plan 05.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what the plan's threat model covers (T-07-03: App ID non-secret; T-07-04: non-Chrome graceful degradation via castAvailable=false).

## Self-Check: PASSED

- `src/lib/cast-sender.svelte.ts` — FOUND
- `src/lib/cast-sender.test.ts` — FOUND (312 lines, 16 tests)
- Commit `b3a43be` — FOUND (RED gate)
- Commit `6b14747` — FOUND (GREEN gate)
