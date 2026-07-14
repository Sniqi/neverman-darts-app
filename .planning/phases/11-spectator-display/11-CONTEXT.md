# Phase 11: Spectator Display - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — recommendations auto-accepted after user timeout; all follow the DS source of truth, the v1.1-proven Chrome-90 pattern, or DISP-03's explicit on-device requirement.

<domain>
## Phase Boundary

The spectator display (PC second window, tablet fullscreen, Chromecast receiver) matches the DS display spec and is confirmed working on the real Chromecast device, with all sync and behavior unchanged. Covers DISP-01 (cqw player panels + active treatment), DISP-02 (header + gradients + bloom + ● separators), DISP-03 (Chrome 90 receiver renders correctly — @supports fallbacks, verified ON-DEVICE), DISP-04 (all display behavior unchanged: BroadcastChannel/Cast sync, idle screen, banners, win overlay, pause countdown).

**Not in this phase:** page shells/overlays/toasts on the app side (Phase 12), scoring surface (done), sync/engine code (locked).

</domain>

<decisions>
## Implementation Decisions

### Chrome-90/cqw-Architektur
- **Extend the v1.1-proven pattern** already in `PlayerPanel.svelte`/`display/+page.svelte`/`IdleScreen.svelte`: Chrome-90-safe base values first, cqw enhancements inside `@supports (container-type: inline-size)` blocks. Never duplicate-property fallbacks (minifier strips them — locked v1.1 decision).
- **DS `--display-*` clamp VALUES are consumed at usage sites inside the @supports gates** — do NOT reference the raw cqw tokens outside gates (a cqw var on Chrome 90 is invalid-at-computed-value-time → property collapses to unset, worse than a fallback).
- `container-type: inline-size` setup stays as-is (proven on-device in v1.1 UAT).
- No NEW dvh/subgrid/container-query features; IdleScreen's dvh is already @supports-gated (Phase 8 CR-01 fix). Receiver correctness is proven by @supports discipline + the end-of-phase on-device UAT (Chrome 90 is not locally emulatable).

### DS-Transkription PlayerPanel/MatchHeader
- Typography: align the existing ad-hoc cqw clamps to the DS `--display-*` values — caption clamp(1.75rem, 4cqw, 5rem) · body clamp(2rem, 5cqw, 6.5rem) · emph clamp(2.5rem, 6.5cqw, 8rem) · name clamp(3rem, 10cqw, 12rem) · score clamp(6rem, 27cqw, 26rem) — with element-by-element mapping (Ø labels/meta=caption, visit rows/chips=body, totals/checkout=emph, name, remaining score).
- Backgrounds: panel gradients `linear-gradient(165deg, #1a1e29, #12151d)` (active `#272d3c → #191d28`), header 3px amber rule + soft bloom beneath, ● separators between header stats (MatchHeader.prompt.md).
- Active-player treatment: amber top/left inset edge (4–5px) + `--accent-soft` tint + inner amber glow; inactive panels `opacity: .55`.
- `letter-spacing: -0.02em` ONLY on giant numerals; Barlow Semi Condensed across the display surface; nothing renders below ~34px on the display.

### Notation & Display-Komponenten
- `VisitLine.svelte` consumes the shared `src/ui/input/dart-notation.ts`; **`VisitLine.test.ts` is updated to the DS strings as a PLANNED expected test change** (same class as Phase 8's PLAT-04) — delete its local formatDart copy.
- LegWinBanner/MatchWinDisplay/PauseOverlay: verify-only (Phase 8 already token-swept them; no DS component spec exists for them) — DISP-04 demands they render and update exactly as before.
- SpectatorChooser: leave (already swept; not a display-render surface).
- Receiver route uses the same components — zero receiver-specific code changes.

### DISP-04-Schutz & On-Device-UAT
- **Zero sync-code changes:** DisplayStore, BroadcastChannel wiring, `cast-receiver.ts`, `cast-sender.svelte.ts`, cast contract test — all untouched.
- Test gate per plan: full vitest suite + full Playwright (incl. spectator-sync 3 tests) green.
- **Phase closes via human on-device UAT** (DISP-03: "verified on-device"): the autonomous run pauses at end-of-phase with a UAT checklist — cast to the real TV, verify panels/header rendering, live sync, idle screen, leg/set banner, win overlay, pause countdown, auto-rejoin. This pause is by design, not a failure.

### Claude's Discretion
- Exact bloom implementation (radial-gradient vs box-shadow) — match DS .jsx.
- Base fallback values inside the non-@supports path (keep current proven values or nearest DS-static equivalents — whichever renders better at 1280×720; document choice).
- Whether MatchHeader gets ● separators via pseudo-elements or text nodes.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- v1.1-proven cqw architecture: `PlayerPanel.svelte` (container-type: inline-size, cqw clamps at lines ~212-323), @supports usage in 3 display files.
- Shared `dart-notation.ts` (Phase 10) ready for VisitLine.
- Tokens: `--display-*` (typography.css, cqw — consume only inside gates), gradients/glow/edge tokens, `--accent-soft`, `--glow-accent`.
- DS sources: `design/components/display/{MatchHeader,PlayerPanel}.jsx` + `.prompt.md`.
- E2E: 12/12 green incl. spectator-sync (3) — the DISP-04 regression net.

### Established Patterns
- @supports gating (never duplicate-property); same-commit CSS-delete; German labels/roles locked; design-tokens guard.
- Display components: PlayerPanel, MatchHeader, VisitLine (+test with OLD notation strings — planned update), IdleScreen, LegWinBanner, MatchWinDisplay, SpectatorChooser under src/ui/display/; route src/routes/display/+page.svelte.
- Audio never plays from display (locked decision).

### Integration Points
- `/display` route: PC window + tablet fullscreen + Cast receiver (all three run the same components; receiver = Chrome 90 @ 1280×720).
- Cast receiver hydrates via snapshot+delta over the Cast channel; BroadcastChannel + localStorage hydration for PC window.

</code_context>

<specifics>
## Specific Ideas

- MatchHeader.prompt.md: "mode, format and current leg separated by amber dots, with a 3px amber rule + soft bloom beneath".
- PlayerPanel.prompt.md: "full-bleed grid; inactive panels dim to 55%; all type uses the --display-* scale; readable on 27" at 3 m".
- On a 960px column the DS scale ≈ 38/48/62/96/259px (readme).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
