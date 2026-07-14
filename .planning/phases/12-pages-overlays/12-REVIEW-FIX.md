---
phase: 12-pages-overlays
fixed_at: 2026-07-14T07:48:00Z
review_path: .planning/phases/12-pages-overlays/12-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 1
skipped: 0
status: partial
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-07-14T07:48:00Z
**Source review:** .planning/phases/12-pages-overlays/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (WR-01 code fix, WR-02 disposition-only)
- Fixed: 1
- Recorded (no code change): 1

## Fixed Issues

### WR-01: ReloadPrompt toast buttons now use full DS `.btn--cta` sizing, likely oversized/cramped for the toast

**Files modified:** `src/ui/pwa/ReloadPrompt.svelte`
**Commit:** 5b74e52
**Applied fix:** Added a compact local override to `.pwa-toast-actions .btn` so the toast's `.btn`/`.btn--cta`/`.btn--ghost` buttons no longer inherit full 64px DS sizing inside the 22rem corner toast:

```css
.pwa-toast-actions .btn {
	flex: 1;
	width: auto;
	min-height: var(--hit-min);
	padding: var(--space-xs) var(--space-sm);
	font-size: var(--text-base);
}
```

`--hit-min` (48px) keeps the touch-target minimum intact (per project touch-target constraints), while `--space-xs`/`--space-sm` padding and `--text-base` (17px, vs. the previous 22px/700-weight `--text-lg`) shrink the button to fit the 352px-wide toast without wrapping or visually dominating the compact notification. `flex: 1`/`width: auto` (unchanged from the pre-fix override) still make both buttons share the row evenly.

**Verification:** Re-read the modified `<style>` block to confirm the override is intact (Tier 1). Ran the full suite in the isolated worktree (with a `node_modules` junction to the main repo) — `npx vitest run`: 39 test files, 563/563 passed, including all 6 `ReloadPrompt.test.ts` assertions (toast render, button presence/click behavior, border-color computed-style check). No new test was added for toast height — a computed-style height assertion was judged not straightforward to make robust (depends on font metrics/line-height in the headless browser), consistent with the review's "add ONLY if straightforward" guidance.

## Disposition: WR-02 (no code change)

### WR-02: RecordOverlay/PauseOverlay `backdrop-filter` addition also affects the Chrome 90 Cast receiver, contradicting the stated review assumption

**File:** `src/ui/overlays/RecordOverlay.svelte:44-45`, `src/ui/overlays/PauseOverlay.svelte:79-80`
**Disposition:** No source code change. `backdrop-filter` is supported on Chrome 76+, and the Chromecast receiver (`/display`) already uses `backdrop-filter: blur(8px)` for small icon-button chrome, so the property itself is confirmed to render on that hardware. What was unverified is the *performance* of a larger full-viewport blurred scrim (vs. the existing small-chrome usage) on the physical Cast device — this is a runtime/hardware concern, not a code defect, so it is tracked as a manual UAT check rather than fixed in code.

Recorded by extending `.planning/phases/11-spectator-display/11-UAT.md` item 5 (Pause-Countdown) with an explicit check: "ZUSATZ (Phase 12 WR-02): Der neue Blur-Scrim (backdrop-filter 12px) muss auf dem Receiver flüssig rendern (Chrome 90 unterstützt blur; prüfe Performance des Vollbild-Blurs)" — commit fb9048e (pre-existing at the start of this fix run, made prior to this fixer invocation).

### IN-01 (referenced, not in fix scope): Blur radius mismatch between existing `/display` chrome and new overlay scrims

**Disposition:** wont-fix. The 8px (existing button chrome) vs. 12px (`--blur-backdrop`, new overlay scrims) mismatch is consistent-enough — different UI elements (small chrome vs. full-viewport scrim), not a functional bug. No code change made.

---

_Fixed: 2026-07-14T07:48:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
