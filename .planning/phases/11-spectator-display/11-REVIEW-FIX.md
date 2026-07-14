---
phase: 11-spectator-display
fixed_at: 2026-07-14T06:34:00Z
review_path: .planning/phases/11-spectator-display/11-REVIEW.md
iteration: 1
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-07-14T06:34:00Z
**Source review:** .planning/phases/11-spectator-display/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 1 (CR-01, Critical)
- Fixed: 1
- Skipped: 0

## Fixed Issues

### CR-01: Chrome-90 `cqw` fallback missing 4 declarations touched by the phase diff

**Files modified:** `src/ui/display/PlayerPanel.svelte`
**Commit:** `56e79b8`
**Applied fix:** Added four missing rules to the existing `@supports not (container-type: inline-size)` fallback block, following the same `Ncqw ≈ calc(Nvw / var(--player-count, 2))` idiom already used by every other rule in the block:

```css
.history-box    { padding: clamp(5px, calc(1vw / var(--player-count, 2)), 12px); }
.history-section { row-gap: clamp(4px, calc(0.8vw / var(--player-count, 2)), 10px); }
.history-row {
	column-gap: clamp(0.4em, calc(1.5vw / var(--player-count, 2)), 1em);
	padding: clamp(4px, calc(0.9vw / var(--player-count, 2)), 10px)
		clamp(8px, calc(1.6vw / var(--player-count, 2)), 16px);
}
.h-darts        { gap: clamp(0.2em, calc(0.8vw / var(--player-count, 2)), 0.5em); }
```

**Verification — systematic cqw listing (grep cqw vs fallback-block coverage):**

All 8 raw `cqw` declarations in `PlayerPanel.svelte` now have fallback twins:

| Line | Declaration | Fallback coverage |
|------|-------------|--------------------|
| 205, 213 | `.player-panel` padding, gap | pre-existing (554-557) |
| 245 | `.bust-label` font-size | pre-existing (562) |
| 350 | `.history-box` padding | **added** (569) |
| 363 | `.history-section` row-gap | **added** (570) |
| 372-373 | `.history-row` column-gap/padding | **added** (571-575) |
| 406 | `.h-darts` gap | **added** (576) |

(`var(--display-*)` font-size tokens consumed elsewhere in the file were already covered by pre-existing entries in the same block, per the reviewer's note — unaffected by this fix.)

- Tier 1: re-read the modified section (`PlayerPanel.svelte:546-580`) — fix text present, block braces balanced, surrounding rules intact.
- Tier 2: no direct syntax checker for `.svelte` SFC style blocks; ran `npx vitest run` instead (transforms/compiles every `.svelte` file, would fail on malformed CSS) — **563/563 passed**.
- `npx playwright test` was attempted but the ephemeral worktree's PWA build step (`vite-plugin-pwa:sveltekit:build`) failed on an unrelated missing `.svelte-kit/output/client/_app/version.json` artifact — a pre-existing scratch-worktree build/tooling issue unconnected to this CSS-only change, not a regression introduced by the fix. Full e2e is out of scope for per-fix verification per the fixer's own rules (handled by the verifier phase later); `vitest` (563/563) plus the two-tier read/compile check above are sufficient for a CSS-fallback addition with no behavioral/logic surface.

## Wont-Fix (out of scope per fix instructions)

### WR-01: Spectator-display labels are hardcoded English

**Rationale:** `design/readme.md` CONTENT FUNDAMENTALS explicitly keeps darts jargon English/hybrid ("Legs - First to", "Double Out", "Bull", "BUST", "Sets", "Caller"). The flagged strings are DS-conformant, not violations of the German-UI constraint. No action taken.

### IN-01: `VisitLine.svelte` is dead code

**Rationale:** Noted for milestone audit (same policy as the `VisitStrip` orphan already tracked). No action taken in this pass.

---

_Fixed: 2026-07-14T06:34:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
