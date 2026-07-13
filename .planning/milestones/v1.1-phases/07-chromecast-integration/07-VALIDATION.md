---
phase: 7
slug: chromecast-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `07-RESEARCH.md` § Validation Architecture. Task IDs are assigned during planning.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 — `unit` project (node) + `browser` project (Playwright/Chromium) |
| **Config file** | `vite.config.ts` (dual projects already configured) |
| **Quick run command** | `npx vitest run --project unit` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10–20 s unit; browser mode slower (Playwright launch) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project unit` (pure logic — fast)
- **After every plan wave:** Run `npx vitest run` (unit + browser mode)
- **Before `/gsd-verify-work`:** Full suite must be green + D-10 mock-snapshot browser validation
- **Max feedback latency:** ~20 s (unit); physical-Chromecast E2E is gated on Cast Console registration (external)

---

## Per-Task Verification Map

> Requirement-level scaffold. The planner binds each REQ row to concrete task IDs (`7-PP-TT`) when plans are written.

| Requirement | Behavior | Test Type | Automated Command | Device-gated |
|-------------|----------|-----------|-------------------|--------------|
| SETUP-01 | Prerendered `build/display/index.html` emitted | Build artifact | `npm run build && test -f build/display/index.html` | No |
| SETUP-02 | App ID read from `import.meta.env.VITE_CAST_APP_ID` | unit | `npx vitest run --project unit` (CastSenderManager.init env read) | No |
| SETUP-03 | Setup guide exists | manual | Read `SETUP.md` (or docs path) | No |
| CAST-02 | Cast button states reflect connection | unit | `npx vitest run --project unit` (CastSenderManager state machine, mock CastContext) | No |
| CAST-04 | Non-Chrome: no Cast control, scoring intact | browser | `npx vitest run --project browser` (Firefox/no-Cast path) + manual | No |
| CAST-06 | Resume toast on `SESSION_RESUMED` | unit | `npx vitest run --project unit` (mock SESSION_RESUMED → sessionJustResumed) | No |
| RECV-02 | Loading screen before first snapshot | browser (mock) | `npx vitest run --project browser` (mock `isCastReceiverContext`=true, no snapshot) | No |
| RECV-03 | Idle screen on sender disconnect | browser (mock) | `npx vitest run --project browser` (mock SENDER_DISCONNECTED) | No |
| RECV-05 | Remaining-score CSS transition | browser | `npx vitest run --project browser` (`.updating` class applied/removed) | No |
| SYNC-01 | Hydration on connect / late-join | unit | `npx vitest run --project unit` (`#publishToCast` on SESSION_STARTED; `receiveSnapshot` updates state) | No |
| SYNC-02 | Per-throw Cast update | unit | `npx vitest run --project unit` (extend dispatch tests — publish after localStorage block) | No |
| SYNC-03 | Pause countdown stays in sync | unit | `npx vitest run --project unit` (pauseActive + pauseRemainingSeconds in payload) | No |
| SYNC-04 | BroadcastChannel path unchanged | unit | `npx vitest run --project unit` (existing dispatch tests pass unchanged) | No |
| CAST-01 | Cast button functional in Chrome | manual/E2E | Open `/match` in Chrome on registered device | **Yes** |
| CAST-03 | Device name shown; stop works | manual/E2E | Connect session; verify "Überträgt auf: X"; stop via dialog | **Yes** |
| CAST-05 | Auto-rejoin on tablet reload | manual/E2E | Reload `/match` during active session | **Yes** |
| RECV-01 | Chromecast renders `/display` scoreboard | manual/E2E | Cast to device; verify scoreboard | **Yes** |
| RECV-04 | Session survives 6-min pause | manual/E2E | Leave idle 6+ min; verify receiver persists | **Yes** |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/cast-sender.test.ts` — unit stubs for `CastSenderManager` state machine
- [ ] `src/lib/cast-receiver.test.ts` — unit stubs for `isCastReceiverContext()` + `CastReceiverBridge` routing
- [ ] `src/stores/display.test.ts` — extend with `receiveSnapshot()` tests
- [ ] `src/stores/match.test.ts` — extend with `#publishToCast()` called/not-called tests
- [ ] `src/ui/display/PlayerPanel.test.ts` — extend with RECV-05 `.updating` class assertions
- [ ] `src/test-mocks/cast-receiver-mock.ts` — mock `isCastReceiverContext()` return for browser-mode tests
- [ ] CI/build assertion for `build/display/index.html` existence (SETUP-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cast button connects to real device | CAST-01 | Needs registered Chromecast + Cast SDK live | Open `/match` in Chrome, tap Cast, select device, verify TV shows scoreboard |
| Device name + stop casting | CAST-03 | Needs live session | Verify "Überträgt auf: \<Gerät\>"; tap launcher → stop; TV returns to idle |
| Auto-rejoin after reload | CAST-05 | Needs live session persistence | Reload `/match` mid-cast; TV recovers without re-selecting device |
| Receiver renders on TV | RECV-01 | Needs physical Chromecast | Cast and confirm `/display` scoreboard on TV |
| Idle-timeout survival | RECV-04 | Needs 6+ min wall-clock on device | Leave session idle through a pause; receiver stays up |
| RECV-05 perception at 3 m | RECV-05 | Visual perception on TV | Confirm remaining-score flash is noticeable across the room |
| Android background/screen-lock mid-cast | CAST-05 | Device + tablet lifecycle | Lock tablet during session; verify session/UAT behavior (MEDIUM-confidence risk) |

> **External gate (blocks all device-gated rows):** Cast Developer Console registration ($5 one-time, Chromecast serial + receiver URL registered, ~15-min propagation + reboot). Must be complete before the on-device test step runs. D-10 mock-snapshot workflow covers all non-device rows beforehand.

---

## Validation Sign-Off

- [ ] All non-device tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20 s (unit)
- [ ] Device-gated rows clearly separated and blocked on Cast Console registration
- [ ] `nyquist_compliant: true` set in frontmatter (after planner binds task IDs)

**Approval:** pending
