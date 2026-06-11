---
phase: 02-spectator-display
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/routes/display/+page.svelte
  - src/ui/display/SpectatorChooser.svelte
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 02 (Plan 02-06): Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Scoped adversarial review of the 02-06 gap-closure diff (commit `3d5a77b`) only. The change widens the `.fullscreen-prompt` render condition on `/display` so the tablet "Anzeige hier im Vollbild" path can show the amber "Vollbild aktivieren" prompt mid-match, by tagging that navigation with `?fullscreen=1` and reading the flag once at mount.

The four concerns called out in the scope note were all traced and found **sound — no BLOCKER:**

1. **URLSearchParams read under base path / ssr:false — CORRECT.** `window.location.search` returns only the query portion (`?fullscreen=1`) and is independent of SvelteKit's `paths.base`; `URLSearchParams` strips the leading `?`. The route inherits `ssr = false` from `src/routes/+layout.ts`, so `window` is always defined in practice — the `typeof window !== 'undefined'` guard is dead-but-harmless defensive code. The static `404.html` fallback (svelte.config.js) is irrelevant: the query string is processed entirely client-side by `goto`.
2. **PC second-window regression — DOES NOT OCCUR.** `openSecondWindow()` is unchanged and opens `${base}/display` with no query string in a fresh document context, so `tabletFullscreenIntent` evaluates to `false` there. The new `|| tabletFullscreenIntent` term cannot fire on the PC path. The pre-existing idle/setup term is untouched. Confirmed no regression.
3. **XSS / injection — NONE.** The flag is only compared `=== '1'` and used as a boolean gate. It is never interpolated into the DOM, an attribute, or `{@html}`. No sink exists.
4. **Svelte 5 runes correctness — CORRECT.** A page-lifetime value that is fixed at mount is appropriately a plain `const`; `$state`/`$derived` would add reactivity that is never needed. The plan explicitly chose this and it is right.

The remaining findings are robustness and UX-durability concerns, not correctness defects in the current call graph.

## Warnings

### WR-01: Amber prompt re-appears over the live scoreboard whenever fullscreen is exited mid-match (tablet)

**File:** `src/routes/display/+page.svelte:179`
**Issue:** `tabletFullscreenIntent` is fixed `true` for the entire page lifetime on the tablet path, and the prompt condition is `!isFullscreen && (... || tabletFullscreenIntent)`. After the user taps the prompt and enters fullscreen (`isFullscreen` → `true`, prompt hides), any subsequent fullscreen *exit* — via the top-right `.fullscreen-toggle`, the browser/OS gesture, or Android system back — flips `isFullscreen` back to `false` and the large bottom-center amber button **re-renders on top of the active scoreboard and stays there for the rest of the match.** This is exactly the "amber prompt obstructing the live scoreboard" outcome the plan's `design_decision` set out to avoid; the design only proved the PC window is unaffected, not that the tablet window is unobstructed after a fullscreen round-trip. Note the `.exit-btn` ("Zurück zur Eingabe") leaves via `goto('/match')` rather than just exiting fullscreen, so the common exit path avoids this — but a manual fullscreen exit that keeps the user on `/display` does not.
**Fix:** Decide and encode the intended post-exit behavior. If the prompt should only nudge *until the first successful fullscreen entry*, latch that:
```ts
let hasEnteredFullscreen = $state(false);
$effect(() => { if (isFullscreen) hasEnteredFullscreen = true; });
// prompt condition:
// !isFullscreen && (matchState === null || matchState.phase === 'setup'
//   || (tabletFullscreenIntent && !hasEnteredFullscreen))
```
If re-prompting after exit is actually desired, add a code comment stating so, since it contradicts the stated "do not obstruct the scoreboard" principle and will otherwise read as a bug.

### WR-02: `const`-read-at-mount intent flag is fragile against future same-route navigation

**File:** `src/routes/display/+page.svelte:82-84`
**Issue:** `tabletFullscreenIntent` is read once when the `/display` component instance is created. SvelteKit 2 reuses the *same* page component instance across client-side navigations that stay within the same route — it does not remount. Today every entry to `/display` comes from a different route (`/match` → `/display`), so the read is always fresh and correct. But the value is derived from `window.location.search` at mount, not from a reactive `page` store, so if any future code navigates `/display?fullscreen=1` → `/display` (or vice versa) without a full remount, the flag will be **stale** — the component keeps the old boolean while the URL says otherwise. This is latent, not currently triggerable, but the pattern silently breaks the moment same-route navigation is introduced.
**Fix:** If staying with the lightweight approach, add a comment documenting the load-bearing assumption ("valid only because `/display` is always reached via a cross-route `goto`/`window.open`; do not add same-route navigation that changes this query without making it reactive"). The reactive alternative is to read `page.url.searchParams.get('fullscreen')` from `$app/state` — but the plan explicitly forbade adding that import, so a documented assumption is the pragmatic choice here.

## Info

### IN-01: Dead SSR guard

**File:** `src/routes/display/+page.svelte:83`
**Issue:** `typeof window !== 'undefined'` can never be `false` for this component: the layout sets `ssr = false`, so the component only ever executes in the browser. The guard is harmless defensive code but is unreachable-false and slightly misleads a reader into thinking SSR is possible for this route.
**Fix:** Optional. Either keep it as intentional defense-in-depth (acceptable) or drop it and rely on the documented `ssr = false`. No action required.

### IN-02: No automated test covers the widened prompt condition

**File:** `src/ui/display/SpectatorChooser.test.ts` (and absent `src/routes/display/+page.svelte` test)
**Issue:** The 02-06 behavioral change — prompt shows on `?fullscreen=1` mid-match, prompt absent on the PC path mid-match — is verified only by the blocking human checkpoint (Task 2), with no regression test. The existing `SpectatorChooser.test.ts` still asserts `window.open(... '_blank')` (PC path) but does not assert that `goToDisplayFullscreen` now navigates to `…?fullscreen=1`, and there is no test asserting the `.fullscreen-prompt` visibility matrix on `/display`. A future refactor of either the query flag or the render condition could silently regress DISP-02 without any failing test.
**Fix:** Add a browser-mode test asserting (a) `goToDisplayFullscreen` triggers navigation to a URL containing `fullscreen=1`, and (b) the `/display` prompt renders when `fullscreen=1` is present mid-match and is absent without it. Not blocking for this gap-closure, but recommended to lock in the no-regression contract that currently rests entirely on manual UAT.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
