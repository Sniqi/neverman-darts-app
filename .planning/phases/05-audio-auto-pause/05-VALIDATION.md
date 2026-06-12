---
phase: 5
slug: audio-auto-pause
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (two projects: `unit` + `browser`) |
| **Config file** | `vite.config.ts` (vitest config embedded) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (unit), longer for browser project |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-AUD01-01 | caller | 1 | AUD-01 | — | N/A | unit | `npm run test:unit -- --grep "audio-caller"` | ❌ W0 | ⬜ pending |
| 5-AUD01-02 | caller | 1 | AUD-01 | — | Silent when callerEnabled=false | unit | `npm run test:unit -- --grep "audio-caller"` | ❌ W0 | ⬜ pending |
| 5-AUD01-03 | caller | 1 | AUD-01 | — | findVoice normalizes Android underscore lang | unit | `npm run test:unit -- --grep "audio-caller"` | ❌ W0 | ⬜ pending |
| 5-AUD01-04 | caller | 1 | AUD-01 | — | findVoice returns null → no speech attempted | unit | `npm run test:unit -- --grep "audio-caller"` | ❌ W0 | ⬜ pending |
| 5-AUD02-01 | sfx | 1 | AUD-02 | — | playSfx creates Audio with correct path | unit | `npm run test:unit -- --grep "audio-sfx"` | ❌ W0 | ⬜ pending |
| 5-AUD02-02 | sfx | 1 | AUD-02 | — | playSfx no-op when sfxEnabled=false | unit | `npm run test:unit -- --grep "audio-sfx"` | ❌ W0 | ⬜ pending |
| 5-AUD03-01 | prefs | 1 | AUD-03 | — | loadAudioPrefs returns defaults when empty | unit | `npm run test:unit -- --grep "audio-prefs"` | ❌ W0 | ⬜ pending |
| 5-AUD03-02 | prefs | 1 | AUD-03 | — | saveAudioPref writes correct localStorage key | unit | `npm run test:unit -- --grep "audio-prefs"` | ❌ W0 | ⬜ pending |
| 5-FLOW02-01 | pause | 2 | FLOW-02 | — | MatchStore tracks pauseLegCount across legs | unit | `npm run test:unit -- --grep "matchStore.pause"` | ❌ W0 | ⬜ pending |
| 5-FLOW02-02 | pause | 2 | FLOW-02 | — | pauseActive true when leg count crosses threshold | unit | `npm run test:unit -- --grep "matchStore.pause"` | ❌ W0 | ⬜ pending |
| 5-FLOW02-03 | pause | 2 | FLOW-02 | — | decrementPause reaches 0 → pauseActive=false | unit | `npm run test:unit -- --grep "matchStore.pause"` | ❌ W0 | ⬜ pending |
| 5-FLOW02-04 | pause-ui | 2 | FLOW-02 | — | PauseOverlay renders countdown + Weiter button | browser | `npm run test:browser -- --grep "PauseOverlay"` | ❌ W0 | ⬜ pending |
| 5-FLOW02-05 | pause-ui | 2 | FLOW-02 | — | PauseOverlay on /display hides Weiter button | browser | `npm run test:browser -- --grep "PauseOverlay"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/audio-caller.test.ts` — covers AUD-01 (voice selection, speak call, fallback, normalization)
- [ ] `src/lib/audio-sfx.test.ts` — covers AUD-02 (SFX fire-and-forget, disabled guard)
- [ ] `src/lib/audio-prefs.test.ts` — covers AUD-03 (localStorage prefs defaults and save)
- [ ] Extend `src/stores/match.svelte.test.ts` — covers FLOW-02 (pauseLegCount, pauseActive transitions)
- [ ] `src/ui/overlays/PauseOverlay.test.ts` — covers FLOW-02 UI (countdown display, Weiter button visibility)

**Test infrastructure note:** `speechSynthesis` and `Audio` are not available in the Node `unit` project. Mock them with `vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: vi.fn(() => []), onvoiceschanged: null })` and `vi.stubGlobal('Audio', vi.fn(() => ({ play: vi.fn().mockResolvedValue(undefined), volume: 1 })))`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Caller actually speaks "180" intelligibly in German | AUD-01 | Real SpeechSynthesis voice quality / numeral reading can't be asserted in headless unit tests (verify A1 from research) | On Android Chrome + desktop: enable caller, throw a visit, confirm spoken score matches and is in selected language |
| SFX audible and not clipped on 180 / high finish / record | AUD-02 | Real audio output is environmental | Trigger a 180 and a record; confirm distinct sounds play, not overlapping into noise |
| Pause overlay readable from 3 m on spectator + auto-resumes | FLOW-02 | Cross-window timing + legibility is physical | Set pause every 1 leg, finish a leg, confirm countdown appears on both windows and resumes at 0 / on Weiter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
