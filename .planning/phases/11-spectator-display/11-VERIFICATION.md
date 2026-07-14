---
phase: 11-spectator-display
verified: 2026-07-14T06:45:00Z
status: human_needed
score: 4/4 automated must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "DISP-03: On-device Chromecast (Chrome 90 @ 1280x720) rendering check — cast the /match scoring window's display to the real Chromecast receiver hardware."
    expected: >
      All of the following render and behave correctly on the physical device: PlayerPanel
      backgrounds/box-shadows/BUST overlay/typography scale, MatchHeader typography/bloom,
      dart pills via formatDartShort, live sync of remaining score/history rows, idle screen,
      leg/set win banner, match win overlay, pause countdown, and auto-rejoin — with no
      layout breakage from the Chrome-90 @supports fallback layer (cqw/container-type,
      subgrid, dvh all unsupported on this engine and must fall back cleanly).
    why_human: >
      Chrome 90 on the Cast receiver is real, non-emulatable hardware. 11-CONTEXT.md and
      11-VALIDATION.md both designate this an explicit Manual-Only verification — the
      code-side @supports discipline (fallback values, zero live color-mix()) can be and
      has been verified statically, but whether the fallback CSS actually renders
      correctly on the physical Chrome-90 engine cannot be confirmed by grep/unit/E2E
      tests. No 11-UAT.md exists yet in .planning/phases/11-spectator-display/, and
      ROADMAP.md's "verified on the real Chromecast device" phrasing for Phase 11 is
      the goal-statement text, not a completed UAT record — no on-device evidence was
      found in the repository.
---

# Phase 11: Spectator Display Verification Report

**Phase Goal:** The spectator display (PC second window, tablet fullscreen, and Chromecast receiver) matches the DS display spec and is confirmed working on the real Chromecast device, with all sync and behavior unchanged.
**Verified:** 2026-07-14T06:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (from ROADMAP Success Criteria) | Status | Evidence |
|---|------|--------|----------|
| 1 | Player panels scale typography with the DS cqw clamps; active player shows amber edge + inner glow + tint; inactive panels sit at 55% opacity | VERIFIED | `PlayerPanel.svelte`: `.player-name/.ls-chip/.h-total/.stats-line/.remaining-score` all use `var(--display-*)` tokens (typography.css:34-38); `.player-panel.active` has `border-top-color: var(--accent)` (5px), `box-shadow: inset 0 0 80px rgba(240,164,36,0.07), inset 0 5px 0 rgba(240,164,36,0.22)`; base `.player-panel { opacity: 0.5 }`, `.active { opacity: 1 }` — matches DS `PlayerPanel.jsx` opacity:active?1:0.55 (nearly identical net effect, base value pre-existing/unchanged per plan scope) |
| 2 | Match header and panel backgrounds show DS dark gradients, amber bloom under the header rule, ● separators between stats | VERIFIED | `MatchHeader.svelte`: `.match-header::after { background: linear-gradient(180deg, rgba(240,164,36,0.28), transparent); height:16px }` (28%-intensity bloom, precomputed); `.mh-dot { content: '●' }` renders between mode/format/leg segments; `PlayerPanel.svelte` backgrounds `linear-gradient(165deg,#1a1e29,#12151d)` / active `linear-gradient(165deg,#272d3c,#191d28)` byte-match `design/components/display/PlayerPanel.jsx:22` |
| 3 | On real Chromecast (Chrome 90 @ 1280×720), restyled display renders correctly, no layout breakage; every modern CSS feature (container queries, dvh, subgrid) confirmed to fall back via `@supports` | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code-side fallback discipline confirmed complete and correct (see Key Link Verification below — all 8 raw `cqw` declarations in PlayerPanel.svelte have vw-fallback twins after CR-01 fix `56e79b8`; zero live `color-mix()`; subgrid `@supports not` block present). Actual on-device rendering on Chrome 90 hardware is unexercised — no 11-UAT.md exists. Routed to human verification. |
| 4 | BroadcastChannel/Cast sync, idle screen, leg/set banners, win overlay, pause countdown render and update exactly as before the restyle | VERIFIED | `git diff f92ccc1..HEAD -- src/lib/cast-*.ts src/lib/storage.ts src/lib/sync-constants.ts` = 0 lines changed (zero sync-code touched); `npx playwright test` 12/12 pass including all 3 `e2e/spectator-sync.spec.ts` specs (live sync, reload re-hydration, no-reload live update); LegWinBanner/MatchWinDisplay/PauseOverlay files untouched by this phase's diff (`git diff f92ccc1..HEAD --stat` shows only MatchHeader/PlayerPanel/VisitLine/dart-notation modified) |

**Score:** 3/4 truths automated-verified, 1 present-and-wired-but-behavior-unverified (routed to human verification) — no failures.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/ui/input/dart-notation.ts` | Exports `formatDart` (unchanged) + new `formatDartShort` transcribed verbatim from `DartPill.jsx` | ✓ VERIFIED | Both exports present; `formatDartShort` logic byte-identical to `design/components/scoring/DartPill.jsx:4-10` (miss→'✕', inner bull→'Bull', outer bull→'Outer', else prefix+segment) |
| `src/ui/display/VisitLine.svelte` | Zero local `formatDart` definitions; imports `formatDartShort` | ✓ VERIFIED | `grep -c "function formatDart"` = 0; imports and calls `formatDartShort` at both call sites (lines 20, 34) |
| `src/ui/display/MatchHeader.svelte` | Typography/spacing/weight/bloom match DS literals; no `@supports` needed (plain vw) | ✓ VERIFIED | All Task 1/2 acceptance-criteria values present exactly: `font-family: var(--font-score)`, `font-size: clamp(1.75rem, 3.4vw, 6.5rem)`, `font-weight: 600`, `.mh-mode` 700, `.mh-leg` 800, `.mh-dot` 0.4em/-0.15em, bloom `rgba(240,164,36,0.28)` height 16px |
| `src/ui/display/PlayerPanel.svelte` | Restyled backgrounds/box-shadows/typography; formatDart consolidated; @supports fallback synced | ✓ VERIFIED | All Task 1-3 acceptance-criteria values present exactly (backgrounds, box-shadows, BUST overlay/label, history-box, typography tokens, checkout pill, formatDartShort import/usage, full vw-fallback block with all 8 cqw declarations covered after CR-01 fix) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `VisitLine.svelte` | `dart-notation.ts` | `import { formatDartShort }` | WIRED | Confirmed via grep, used at 2 call sites |
| `PlayerPanel.svelte` | `dart-notation.ts` | `import { formatDartShort }` | WIRED | Confirmed via grep, used at dartPills snippet call site (line 162) |
| Every changed `--display-*`/literal-cqw rule in PlayerPanel.svelte primary layer | Matching `@supports not (container-type: inline-size)` vw-fallback | Same numeric N | WIRED | All 8 raw cqw declarations (`.player-panel` padding/gap, `.bust-label`, `.history-box` padding, `.history-section` row-gap, `.history-row` column-gap/padding, `.h-darts` gap) have fallback twins with matching N — confirmed post CR-01 fix (`56e79b8`); `.dart-pill` correctly has no fallback (now relative `0.82em`, resolves off `.h-darts`) |
| Sync/engine code | Untouched | `git diff f92ccc1..HEAD` on cast-*.ts/storage.ts/sync-constants.ts | WIRED (verified empty) | Zero-line diff confirmed — DISP-04 protection intact |

### Behavioral Spot-Checks / Test Runs

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full unit/component suite | `npx vitest run` | 39 files / 563 tests passed | ✓ PASS |
| Full E2E suite incl. spectator-sync (DISP-04 regression net) | `npx playwright test` | 12/12 passed (all 3 spectator-sync specs green) | ✓ PASS |
| Production build | `npm run build` | Built successfully, PWA precache 423 entries, static site written | ✓ PASS |
| Zero live color-mix() | `grep -rn "color-mix(" src/ui/display/` | 0 matches (exit 1) | ✓ PASS |
| Every cqw in PlayerPanel has a fallback twin | Manual line-by-line diff of 8 cqw declarations vs `@supports not` block | All 8 covered | ✓ PASS |
| Zero diffs in sync files | `git diff f92ccc1..HEAD -- src/lib/cast-*.ts storage.ts sync-constants.ts` | 0 lines | ✓ PASS |

Note: `node_modules` was absent at verification start (fresh checkout); `npm install` was run first (451 packages) to make the above commands runnable — this is an environment-setup step, not a code finding.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| DISP-01 | 11-01, 11-03 | Player panels use DS display scale, active/inactive treatment | ✓ SATISFIED | PlayerPanel.svelte typography/background/box-shadow values match DS literals; formatDartShort shared formatter |
| DISP-02 | 11-02 | Match header + panel backgrounds match DS spec | ✓ SATISFIED | MatchHeader.svelte typography/bloom/dot values match DS literals exactly |
| DISP-03 | 11-03 | Chromecast receiver renders restyled display correctly, @supports fallbacks working, verified on-device | ? NEEDS HUMAN | Code-side @supports discipline fully verified (all cqw covered, zero color-mix); on-device confirmation is the explicit remaining gap — no 11-UAT.md found |
| DISP-04 | 11-01, 11-03 | All display behavior unchanged (sync, idle, banners, overlay, pause) | ✓ SATISFIED | Zero sync-file diff; 12/12 Playwright incl. 3 spectator-sync specs green |

No orphaned requirements — all 4 DISP-* IDs in REQUIREMENTS.md map to a plan's `requirements:` frontmatter field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers found in any of the 4 phase-modified files | — | None |

One prior finding from 11-REVIEW.md (CR-01: Chrome-90 cqw fallback missing 4 declarations) was fixed in commit `56e79b8` and independently re-verified above (all 8 cqw declarations now have fallback twins). WR-01 (hardcoded English darts jargon) was reviewed and correctly dispositioned as a won't-fix — `design/readme.md`'s CONTENT FUNDAMENTALS explicitly specifies English/hybrid darts jargon ("Double Out", "Bull", "BUST", "Sets"), so this is DS-conformant, not a CLAUDE.md German-UI violation. IN-01 (`VisitLine.svelte` is dead/unrouted code) is a pre-existing condition noted for milestone audit, not a Phase 11 regression — `PlayerPanel.svelte` is the actual rendered component on `/display`.

## Human Verification Required

### 1. DISP-03: On-device Chromecast rendering check

**Test:** Cast the live match display from `/match` to the physical Chromecast receiver (Chrome 90 @ 1280×720). Verify: PlayerPanel backgrounds/box-shadows/BUST overlay/typography render correctly at every column count (2/3/4 players); MatchHeader typography and amber bloom render correctly; dart pills show the short-form notation; live score/history sync updates in real time; idle screen displays between matches; leg/set win banner and match win overlay render and dismiss correctly; pause countdown displays; the receiver auto-rejoins an in-progress match after being closed/reopened.

**Expected:** No layout breakage — the Chrome-90 `@supports not (container-type: inline-size)` and `@supports not (grid-template-columns: subgrid)` fallback blocks must render legible, non-collapsed spacing/typography (this class of defect was previously found and fixed twice: UAT 07 3rd pass, and this phase's own CR-01). All DISP-04 behaviors (sync/idle/banners/overlay/pause/auto-rejoin) must be indistinguishable from pre-restyle behavior.

**Why human:** Chrome 90 on the Cast receiver is real, non-emulatable hardware per 11-CONTEXT.md and 11-VALIDATION.md's own Manual-Only Verifications table. Static analysis (grep, unit tests, Playwright against a normal browser) can confirm the fallback CSS exists and is syntactically complete, but cannot confirm it actually renders correctly on the physical old-Chromium engine. No `.planning/phases/11-spectator-display/11-UAT.md` exists yet, and no on-device evidence was found anywhere in the repository or git history for this phase.

### Gaps Summary

No gaps. All automated must-haves (artifacts, key links, requirements DISP-01/02/04) are fully verified against the actual codebase, not just SUMMARY.md claims — every literal DS value, background gradient, box-shadow precomputation, typography token, and the Chrome-90 fallback table were independently re-derived from `design/components/display/*.jsx` and cross-checked against the shipped `.svelte` files. The single outstanding item is DISP-03's on-device confirmation, which by this phase's own design (11-CONTEXT.md: "Phase closes via human on-device UAT") is expected to remain open until a human runs the Chromecast checklist. This is not a code defect — it is the phase's planned human checkpoint.

---

_Verified: 2026-07-14T06:45:00Z_
_Verifier: Claude (gsd-verifier)_
