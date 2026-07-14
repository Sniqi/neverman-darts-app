---
phase: 11-spectator-display
verified: 2026-07-14T17:50:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: "3/4 automated + 1 present-and-wired-but-behavior-unverified (routed to human)"
  gaps_closed:
    - "DISP-03 on-device Chromecast (Chrome 90 @ 1280x720) rendering/behavior check — now confirmed via 11-UAT.md (6/6 pass, all on real Chromecast receiver hardware)"
    - "DISP-04 pause countdown never reached the physical Chromecast receiver — fixed in gap-closure Plan 11-04 (commits 2531eed RED, b1a6e19 GREEN); re-verified on-device in UAT Test 5 retest (pass)"
  gaps_remaining: []
  regressions: []
---

# Phase 11: Spectator Display Verification Report

**Phase Goal:** The spectator display (PC second window, tablet fullscreen, and Chromecast receiver) matches the DS display spec and is confirmed working on the real Chromecast device, with all sync and behavior unchanged.
**Verified:** 2026-07-14T17:50:00Z
**Status:** passed
**Re-verification:** Yes — after DISP-03 on-device UAT completion and DISP-04 gap-closure (Plan 11-04)

## Goal Achievement

### Observable Truths

| # | Truth (from ROADMAP Success Criteria) | Status | Evidence |
|---|------|--------|----------|
| 1 | Player panels scale typography with the DS cqw clamps; active player shows amber edge + inner glow + tint; inactive panels sit at 55% opacity | ✓ VERIFIED | `PlayerPanel.svelte` unchanged since prior verification — `clamp(3rem, 14cqw, 12rem)` score typography, `.player-panel.active { border-top-color: var(--accent); box-shadow: inset 0 0 80px rgba(240,164,36,0.07), inset 0 5px 0 rgba(240,164,36,0.22) }`, base `.player-panel { opacity: 0.5 }`. Confirmed on real hardware in 11-UAT.md Test 1 (Receiver-Rendering, DISP-03) — "Panels/Header/Typo wie oben" — pass |
| 2 | Match header and panel backgrounds show DS dark gradients, amber bloom under the header rule, ● separators between stats | ✓ VERIFIED | `MatchHeader.svelte` unchanged — `.match-header::after { background: linear-gradient(180deg, rgba(240,164,36,0.28), transparent) }`, `.mh-dot { content: '●' }`; `PlayerPanel.svelte` gradients `linear-gradient(165deg,#1a1e29,#12151d)` / active `linear-gradient(165deg,#272d3c,#191d28)`. Confirmed on real hardware in 11-UAT.md Test 1 — pass |
| 3 | On real Chromecast (Chrome 90 @ 1280×720), restyled display renders correctly, no layout breakage; every modern CSS feature (container queries, dvh, subgrid) confirmed to fall back via `@supports` | ✓ VERIFIED | Code-side fallback discipline previously confirmed (all 8 raw `cqw` declarations have vw-fallback twins, zero live `color-mix()`, subgrid `@supports not` block present). **On-device confirmation now complete:** 11-UAT.md Test 1 ("Receiver-Rendering DISP-03") — "Panels/Header/Typo wie oben; History-Zeilen-Spacing intakt (CR-01-Fix); nichts unter ~34px; keine kaputten Klammern/Umbrüche bei 1280×720" — result: pass, executed on the physical Chromecast receiver |
| 4 | BroadcastChannel/Cast sync, idle screen, leg/set banners, win overlay, pause countdown render and update exactly as before the restyle | ✓ VERIFIED | Sync-code files (`cast-*.ts`, `storage.ts`, `sync-constants.ts`) remain zero-diff since `f92ccc1`; only `src/stores/match.svelte.ts` changed (surgical pause-publish fix, +13/-1 lines). `npx vitest run` = 567/567 pass (39 files); `npx playwright test` = 12/12 pass (incl. 3 spectator-sync specs). **Pause countdown on real device:** was the sole prior gap (UAT Test 5 first pass: "pass, aber der chromecast zeigt die Pause nicht an") — root-caused in `.planning/debug/pause-not-shown-on-receiver.md`, fixed in Plan 11-04 (`#broadcastPause()` now also calls `#publishToCast()`), regression-tested (4 new "Gap Test 5" unit tests, all pass), and **re-verified on the physical Chromecast** in 11-UAT.md Test 5 retest — result: pass, "Pause overlay now appears on the receiver." Tests 2/3/4/6 (live sync, idle, banners/overlay, auto-rejoin) all independently re-confirmed pass on-device |

**Score:** 4/4 truths verified — no failures, no items routed to human verification.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/ui/input/dart-notation.ts` | Exports `formatDart` (unchanged) + `formatDartShort` transcribed verbatim from `DartPill.jsx` | ✓ VERIFIED | Both exports present at lines 13/21; unchanged since prior verification |
| `src/ui/display/VisitLine.svelte` | Zero local `formatDart` definitions; imports `formatDartShort` | ✓ VERIFIED | `grep -c "function formatDart"` = 0; imports and calls `formatDartShort` at lines 20, 34 |
| `src/ui/display/MatchHeader.svelte` | Typography/spacing/weight/bloom match DS literals | ✓ VERIFIED | Unchanged since prior verification; confirmed on-device in 11-UAT.md Test 1 |
| `src/ui/display/PlayerPanel.svelte` | Restyled backgrounds/box-shadows/typography; formatDart consolidated; @supports fallback synced | ✓ VERIFIED | Unchanged since prior verification; confirmed on-device in 11-UAT.md Test 1 |
| `src/stores/match.svelte.ts` | `#broadcastPause()` republishes to the active Cast session on every call (trigger, tick, resume) | ✓ VERIFIED | Line ~462: unconditional `this.#publishToCast()` added at the end of `#broadcastPause()`, after the existing BroadcastChannel try/catch. Confirmed present in current tree; matches Plan 11-04's `<action>` exactly |
| `src/stores/match.svelte.test.ts` | 4 new regression tests under `describe('matchStore.pause', ...)` | ✓ VERIFIED | `npx vitest run --project=unit src/stores/match.svelte.test.ts -t "Gap Test 5"` → 4 passed, 45 skipped (test-name filter working as expected) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `VisitLine.svelte` | `dart-notation.ts` | `import { formatDartShort }` | WIRED | Confirmed via grep, used at 2 call sites |
| `PlayerPanel.svelte` | `dart-notation.ts` | `import { formatDartShort }` | WIRED | Confirmed via grep, used at line 162 |
| `#checkAutoPause()` / `decrementPause()` / `resumePause()` | `#broadcastPause()` | Direct call | WIRED | All 3 mutators call `#broadcastPause()` (lines 396, 411, 421, 428 in match.svelte.ts) |
| `#broadcastPause()` | `#publishToCast()` → `castSenderManager.sendSnapshot()` → `activeSession.sendMessage(CAST_NS)` | Unconditional call after BroadcastChannel try/catch | WIRED | Confirmed at match.svelte.ts:462; this is the exact link that closed UAT Test 5's gap, and it is now confirmed both by unit test (Gap Test 5, 4/4 pass) and on real hardware (11-UAT.md Test 5 retest, pass) |
| Sync/engine code | Untouched | `git diff f92ccc1..HEAD` on cast-*.ts/storage.ts/sync-constants.ts | WIRED (verified empty) | Zero-line diff confirmed — DISP-04 protection intact; only `match.svelte.ts` changed in this phase's gap-closure plan |

### Behavioral Spot-Checks / Test Runs

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit/component suite | `npx vitest run` | 39 files / 567 tests passed | ✓ PASS |
| Gap Test 5 (pause→Cast publish regression) | `npx vitest run --project=unit src/stores/match.svelte.test.ts -t "Gap Test 5"` | 4/4 passed | ✓ PASS |
| Full E2E suite incl. spectator-sync (DISP-04 regression net) | `npx playwright test` | 12/12 passed (all 3 spectator-sync specs green) | ✓ PASS |
| Production build | `npm run build` | Built successfully, PWA precache 423 entries, static site written | ✓ PASS |
| Zero diffs in sync files since prior verification baseline | `git diff f92ccc1..HEAD -- src/lib/cast-*.ts storage.ts sync-constants.ts` | 0 lines | ✓ PASS |
| On-device Chromecast UAT (all 6 tests) | See 11-UAT.md | 6/6 passed, 0 issues, 0 pending | ✓ PASS |

Note: `node_modules` was present at verification start (no fresh-checkout setup needed this run).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| DISP-01 | 11-01, 11-03 | Player panels use DS display scale, active/inactive treatment | ✓ SATISFIED | PlayerPanel.svelte values match DS literals; confirmed on-device |
| DISP-02 | 11-02 | Match header + panel backgrounds match DS spec | ✓ SATISFIED | MatchHeader.svelte values match DS literals exactly; confirmed on-device |
| DISP-03 | 11-03 | Chromecast receiver renders restyled display correctly, @supports fallbacks working, verified on-device | ✓ SATISFIED | Code-side @supports discipline fully verified (all cqw covered, zero color-mix); **on-device confirmation now complete** — 11-UAT.md Test 1, pass, no layout breakage at 1280×720 |
| DISP-04 | 11-01, 11-03, 11-04 | All display behavior unchanged (sync, idle, banners, overlay, pause) | ✓ SATISFIED | Zero sync-file diff (except surgical match.svelte.ts fix); 567/567 unit + 12/12 Playwright green; pause-on-Cast gap fixed (Plan 11-04) and re-verified on-device (11-UAT.md Test 5 retest, pass) |

No orphaned requirements — all 4 DISP-* IDs in REQUIREMENTS.md map to a plan's `requirements:` frontmatter field and are marked "Complete".

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any of the 6 phase-modified files (dart-notation.ts, VisitLine.svelte, MatchHeader.svelte, PlayerPanel.svelte, match.svelte.ts, match.svelte.test.ts) | — | None |

**WR-01 disposition (evaluated, not a gap):** 11-04-REVIEW.md flagged a real, provable defect — on the exact dispatch that crosses the auto-pause threshold, `dispatch()`'s pre-existing unconditional `#publishToCast()` call (line ~126, runs before `#checkAutoPause()` at line ~146) sends one stale snapshot (`pauseActive:false`) immediately followed by a fresh one from `#broadcastPause()`. This is confirmed still present in the current code (`dispatch()` was deliberately not reordered, per Plan 11-04's explicit scope decision) and is a genuine, not-yet-eliminated code characteristic — the review's own suggested fix (reordering `dispatch()`) was NOT applied. However: (1) it was explicitly tracked as a "watch item" in STATE.md with instructions to reorder if a visible flash is observed on-device; (2) 11-UAT.md's Test 5 retest note explicitly states "WR-01 stale-flash NOT observed on-device"; (3) it is registered and accepted as a low-severity threat (T-11-04-01/02) in 11-SECURITY.md with a self-healing (≤1s) rationale. Given the phase's truths concern observable, on-device behavior (which UAT directly exercised and passed) rather than internal message-count purity, this is correctly dispositioned as an accepted, documented, non-blocking characteristic rather than a FAILED must-have — consistent with the review's own classification as a "warning," not a "critical" finding, and with its suggested fix being explicitly optional polish.

One prior finding from 11-REVIEW.md (CR-01: Chrome-90 cqw fallback missing 4 declarations) was fixed in commit `56e79b8` and remains fixed (unchanged since prior verification).

## Human Verification Required

None. The single item that previously required human verification (DISP-03 on-device Chromecast rendering/behavior, including the DISP-04 pause-countdown sub-check) has concrete on-device evidence in `.planning/phases/11-spectator-display/11-UAT.md`: 6/6 tests pass, 0 issues, 0 pending, executed on the physical Chromecast receiver hardware (Chrome 90 @ 1280×720) — including the retested Test 5 (pause countdown), which failed on first pass and now passes after the Plan 11-04 gap-closure fix.

### Gaps Summary

No gaps. All 4 ROADMAP Success Criteria are verified against the actual codebase and confirmed with on-device evidence (not just SUMMARY.md claims):

- Every literal DS value (backgrounds, box-shadows, typography tokens, bloom) was independently re-derived from `design/components/display/*.jsx` and cross-checked against the shipped `.svelte` files (unchanged since the prior automated pass).
- The Chrome-90 `@supports` fallback table was re-confirmed unchanged and complete.
- The one item the prior VERIFICATION.md (2026-07-14T06:45:00Z) correctly left open — on-device confirmation — now has a complete, passing on-device record in `11-UAT.md` (6/6, including the pause-countdown retest after the Plan 11-04 fix).
- Full regression suite re-run fresh for this verification: `npx vitest run` (567/567), `npx playwright test` (12/12), `npm run build` (success) — no regressions introduced by the gap-closure fix.
- The one code-review warning (WR-01) that remains structurally present in the code was evaluated on its merits (see Anti-Patterns Found) and correctly dispositioned as an accepted, on-device-verified-absent risk rather than a functional gap.

Phase 11 goal is achieved: the spectator display matches the DS spec and is confirmed working on the real Chromecast device, with all sync and behavior unchanged.

---

_Verified: 2026-07-14T17:50:00Z_
_Verifier: Claude (gsd-verifier)_
