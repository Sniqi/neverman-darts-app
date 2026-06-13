# Phase 5 — UI Review

**Audited:** 2026-06-12
**Baseline:** UI-SPEC.md (05-UI-SPEC.md, status: approved)
**Screenshots:** Not captured (no dev server detected on ports 3000 or 5173)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | "Weiter geht's!" zero-countdown flash copy absent; all other strings correct |
| 2. Visuals | 3/4 | fadeOut exit animation missing; entrance and hierarchy correct |
| 3. Color | 4/4 | Token use correct; hardcoded button values are intentional parity with analog |
| 4. Typography | 4/4 | All sizes and weights match spec; tabular-nums bonus |
| 5. Spacing | 4/4 | Token-based throughout; touch targets meet 44px minimum |
| 6. Experience Design | 2/4 | Zero-countdown state unimplemented; aria-live over-announces; fadeOut missing |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **"Weiter geht's!" zero-countdown flash not implemented** — At `remainingSeconds === 0`, the spec requires a temporary string swap to "Weiter geht's!" displayed for 800ms before auto-resume. Without this, the countdown goes dark with no closing signal — users may not realize the pause ended automatically. Fix: add a derived `isZero` boolean, conditionally render "Weiter geht's!" in place of the `MM:SS` display, and trigger the 800ms flash via a `$effect` that sets a local `showZero` boolean; the parent's auto-resume handles navigation.
   **RESOLVED (2026-06-12, commit bfe99b6 + 5836ebe):** `decrementPause()` now sets `pauseRemainingSeconds=0` and broadcasts before calling `resumePause()` via `setTimeout(...,800)`. `PauseOverlay` renders "Weiter geht's!" with `.zero-flash` (opacity fade keyframe) when `isZero` derived is true. Works on both `/match` and `/display` via broadcast state.

2. **fadeOut exit animation absent** — The spec declares "fadeOut opacity 1→0, 200ms ease-in" on overlay removal. The component only defines `fadeIn`. Without an exit transition, the overlay snaps away instantly rather than fading, which is jarring especially on a large spectator display at 3 m. Fix: use Svelte's `transition:fade={{ duration: 200, easing: cubicIn }}` or a CSS `@keyframes fadeOut` with `animation-fill-mode: forwards` keyed on the `pauseActive` condition.
   **RESOLVED (2026-06-12, commit 5836ebe):** Added `out:fade={{ duration: 200, easing: cubicIn }}` from `svelte/transition`; replaced manual `@keyframes fadeIn` with `in:fade={{ duration: 300 }}` for consistency.

3. **aria-live announces countdown every second** — The spec says countdown should announce "every 60s and at ≤10s". Currently `aria-live="polite"` is on the element that renders `{mm}:{ss}` which updates every second, so screen readers will read the time every single second for the entire 8-minute countdown. This will be deeply disruptive to any assistive-technology user. Fix: move `aria-live` to a visually-hidden companion element that is only populated at the 60-second marks and when `remainingSeconds <= 10`, leaving the displayed digits untouched.
   **RESOLVED (2026-06-12, commit 5836ebe):** Removed `aria-live` from `.countdown-digits`. Added `.sr-only[aria-live="polite"]` companion populated only at minute marks and `remainingSeconds <= 10`. 10 new browser test cases cover all three fixes; full suite 405/405 green.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**PASS — all spec-declared strings present:**
- `PauseOverlay.svelte:38` — heading: "Pause" ✓
- `PauseOverlay.svelte:39` — subtitle: "Nächste Leg in Kürze" ✓
- `PauseOverlay.svelte:42` — CTA: "Weiter" ✓
- `MatchSetup.svelte:195` — section heading: "Audio & Pause" (via `&amp;` entity — renders correctly) ✓
- `MatchSetup.svelte:199` — "Anrufer" ✓
- `MatchSetup.svelte:216` — "Sprache" / "Deutsch" / "Englisch" ✓
- `MatchSetup.svelte:234` — "Soundeffekte" ✓
- `MatchSetup.svelte:246` — "Automatische Pause" ✓
- `MatchSetup.svelte:261/264` — "Pause nach" / "Legs" ✓
- `MatchSetup.svelte:269/272` — "Pausendauer" / "Minuten" ✓

**WARNING — missing copy:**
- "Weiter geht's!" (zero-countdown flash copy) — not present anywhere in `PauseOverlay.svelte`. The spec states this string appears for 800ms at countdown end. The component has no zero-state branch.

Score deducted from 4 to 3 for the missing zero-state copy.

---

### Pillar 2: Visuals (3/4)

**PASS — anatomy and hierarchy correct:**
- Visual layout matches spec anatomy: heading → subtitle → countdown digits → CTA button, vertically centered in a full-screen backdrop.
- Font sizing creates clear hierarchy: 20px heading, 16px subtitle, `clamp(4rem, 10vw, 12rem)` countdown. The countdown will be dominant and readable at 3 m per DISP-04.
- CTA button at 56px height and min-width 200px — matches spec.
- Overlay correctly hidden on spectator view via `showResume=false` prop — layout adapts correctly.
- `fadeIn 300ms ease-out` entrance present and matches spec.

**WARNING — missing exit transition:**
- `PauseOverlay.svelte` defines `@keyframes fadeIn` but no corresponding `fadeOut`. When `pauseActive` becomes false, the `{#if}` block removes the element instantly with no opacity transition. The spec requires `fadeOut 200ms ease-in` on overlay removal.
- The MatchWinOverlay analog also lacks an explicit exit — but PauseOverlay differs in that it can be dismissed mid-countdown (user presses "Weiter"), making the abrupt snap more visible.

---

### Pillar 3: Color (4/4)

**PASS — token usage:**
- Backdrop: `rgba(17, 19, 24, 0.96)` — exact spec value (`PauseOverlay.svelte:52`).
- Countdown digits: `color: var(--accent, #e8a020)` — correct, fallback present (`PauseOverlay.svelte:92`).
- Heading and subtitle: `var(--text, #f0f0f0)` — correct.

**Hardcoded values — intentional parity, not a defect:**
- `.weiter-btn` uses `background: #e8a020` and `color: #111318` rather than `var(--accent)` and `var(--bg)`. This is a direct copy of `MatchWinOverlay.svelte .new-game-btn` (lines 109-110 of MatchWinOverlay). The pattern is consistent across overlays. The values match the token values exactly, so there is no visual deviation. No deduction.

**60/30/10 distribution:**
- 60% dark backdrop dominates; surface color on `.pause-content` not applied (transparent, inherits backdrop). 30% would be expressed if the content panel had a card; it does not. This is appropriate for a fullscreen overlay — no excess accent bleeding.
- Accent restricted to countdown digits and "Weiter" button — matches the spec's explicit reservation list.

---

### Pillar 4: Typography (4/4)

**PASS — all sizes and weights match spec:**

| Element | Spec | Actual | Match |
|---------|------|--------|-------|
| Pause heading | 20px/600/lh1.2 | 20px/600/1.2 (`PauseOverlay.svelte:75-80`) | ✓ |
| Pause subtitle | 16px/400/lh1.5 | 16px/400 (`PauseOverlay.svelte:83-87`) | ✓ |
| Countdown | clamp(4rem,10vw,12rem)/600/lh1.0 | identical (`PauseOverlay.svelte:90-95`) | ✓ |
| Audio section h2 | 20px/600 | 20px/600 (shared `.h2` rule `MatchSetup.svelte:330-334`) | ✓ |
| Toggle labels | 16px/400 | `.toggle-label { font-size: 16px }` (`MatchSetup.svelte:456`) | ✓ |
| Stepper unit | 14px (label role) | `.stepper-unit { font-size: 14px }` (`MatchSetup.svelte:442`) | ✓ |

**Bonus:** `font-variant-numeric: tabular-nums` on `.countdown-digits` prevents digit-width jitter as seconds tick. Not in spec, entirely appropriate.

---

### Pillar 5: Spacing (4/4)

**PASS — token-only spacing throughout:**

`PauseOverlay.svelte`:
- `.pause-content` gap and padding: `var(--space-xl, 32px)` — matches spec "overlay content padding = xl".
- All spacing expressed as design tokens with correct fallback values.

`MatchSetup.svelte` Audio section:
- Reuses pre-existing `.toggle-row` and `.stepper-row` CSS rules without modification.
- `.toggle-row` padding: `var(--space-sm) var(--space-md)` (8px 16px) — matches existing pattern, within the declared scale.
- `.stepper-btn` width/height: 44×44px — meets the spec's 44×44px minimum touch target requirement.
- No arbitrary `px` values introduced by Phase 5 code.

---

### Pillar 6: Experience Design (2/4)

**BLOCKER — zero-countdown state unimplemented:**
- The spec defines a terminal interaction state: at `remainingSeconds === 0`, the countdown digits should be replaced with "Weiter geht's!" for 800ms, then the overlay is removed by the auto-resume logic. `PauseOverlay.svelte` has no conditional for `remainingSeconds === 0`. The overlay simply disappears when `pauseActive` becomes false. Users get no closure signal.

**BLOCKER — aria-live over-announces:**
- `countdown-digits` element has `aria-live="polite"` and renders `{mm}:{ss}` which updates every second. The spec's accessibility table states: "announce every 60s and at ≤10s". A screen reader user will hear the time read aloud 480 times during an 8-minute pause. This inverts the intent of the spec and creates a hostile experience for assistive technology users.

**WARNING — fadeOut exit animation missing:**
- Covered in Pillar 2. Interaction quality degrades when the user taps "Weiter" mid-countdown and the overlay snaps away rather than fading. Spec: `fadeOut 200ms ease-in`.

**PASS — all other interaction contracts:**
- `/display` suppression of "Weiter" button: `showResume=false` prop, correctly used.
- `role="dialog"` + `aria-modal="true"` + `aria-label="Pause"`: present (`PauseOverlay.svelte:33-35`).
- Audio prefs defaults confirmed correct: `callerEnabled: false`, `sfxEnabled: false`, `pauseEnabled: true`, `pauseLegs: 5`, `pauseMinutes: 8` (`audio-prefs.ts:15-22`).
- `role="switch"` + `aria-checked` on all three toggles in MatchSetup: confirmed (`MatchSetup.svelte:203-205`, `237-240`, `249-252`).
- Conditional rendering of language seg-control (only when `callerEnabled`) and pause steppers (only when `pauseEnabled`): correct (`MatchSetup.svelte:211`, `258`).
- localStorage keys match spec: `nvm_caller_enabled`, `nvm_caller_lang`, `nvm_sfx_enabled`, `nvm_pause_enabled`, `nvm_pause_legs`, `nvm_pause_minutes` (`audio-prefs.ts:24-31`).

---

## Registry Safety

Not applicable. Project does not use shadcn. No third-party component registries. No new npm packages introduced by this phase.

---

## Files Audited

- `src/ui/overlays/PauseOverlay.svelte` — primary new component
- `src/ui/setup/MatchSetup.svelte` — AudioSettings section (lines 193–279 and supporting state/CSS)
- `src/ui/overlays/MatchWinOverlay.svelte` — analog reference for pattern consistency
- `src/app.css` — design tokens verification
- `src/lib/audio-prefs.ts` — defaults verification
