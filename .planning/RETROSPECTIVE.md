# Retrospective — Neverman Darts App

## Milestone: v1.0 — MVP

**Shipped:** 2026-06-13
**Phases:** 6 | **Plans:** 33

### What Was Built
A touch-optimized X01 darts scoring PWA (German, dark mode): full playable match with SVG dartboard input, undo, bust handling, and checkout suggestions; a live spectator display (second window on PC / in-app fullscreen on tablet) synced over BroadcastChannel; Dexie/IndexedDB persistence with crash-resume, profiles, match history, and JSON export/import; live + lifetime statistics with hand-rolled SVG charts and live-celebrated personal records; a Web Speech caller plus sound effects with a master volume slider, and a configurable auto-pause countdown synced to both views; and an installable, fully-offline PWA with a German update prompt and a GitHub Actions deploy workflow for GitHub Pages.

### What Worked
- The discuss → research → plan → checker → execute → verify chain caught real issues before they shipped: the plan-checker flagged missing test coverage and unresolved research; the milestone integration audit caught a genuine deployment blocker (SFX absolute paths 404-ing on the Pages subpath) that all unit tests and the dev build had missed.
- Human UAT on audio (Phase 5) surfaced real product decisions a machine couldn't: audio source (scoring window, because passive windows can't autoplay), volume control, and a remastered SFX level.
- Sequential execution on the main tree (worktrees auto-degraded — no origin/HEAD) kept shared-file phases conflict-free.

### What Was Inefficient
- Several executor agents truncated their return right before committing SUMMARY.md (a Windows stdio pattern), requiring orchestrator recovery (commit summary + update tracking). Reliable but cost extra round-trips.
- The Git Bash `BASE_PATH=/...` path-mangling trap briefly looked like a build bug; PowerShell builds were needed to verify the subpath locally.

### Patterns Established
- Audio plays from the scoring window `/match` only (browser autoplay needs a user gesture) — see the audio-source decision.
- PWA virtual modules (`virtual:pwa-register/svelte`, `virtual:pwa-info`) are excluded under VITEST and aliased to mocks; their types come from a `src/app.d.ts` reference.
- Base-path-prefix every runtime asset URL (`new Audio(\`${base}/sfx/...\`)`) — absolute paths break on the Pages subpath.

### Key Lessons
- A cross-phase integration audit is worth its cost: a phase can pass in isolation (Phase 5 audio worked when base was `''`) yet break once a later phase (Phase 6 subpath) changes the environment.
- Carry inherently-manual acceptance criteria (install/offline/live-deploy, audible output) as explicit human-verification items rather than faking automated checks.

### Deferred at Close (accepted tech debt)
- Phase 3 persistence UAT — 9 manual scenarios never run (`03-UAT.md`); automated checks passed.
- Live GitHub Pages go-live (create repo, enable Pages, push) — the user's outward-facing step; workflow committed and ready.
- Nyquist `compliant` frontmatter flags stale on phases 4–6 (coverage exists).

### Cost Observations
- Model mix: planning on opus, research/execution/review/verify on sonnet.
- Notable: most rework came from environment-specific issues (Windows env mangling, subpath base paths, browser autoplay) rather than logic errors — the logic was well-covered by the test suite (430 tests green at close, `npm run check` clean).

---

## Milestone: v1.1 — Chromecast-Integration

**Shipped:** 2026-07-13 (on-device UAT 5/5 passed 2026-06-19)
**Phases:** 1 | **Plans:** 6

### What Was Built
Google Cast integration on top of the shipped PWA: `/match` acts as Cast sender (official button with connection states, device name, stop, full absence on non-Cast browsers), `/display` doubles as an unpublished Custom Web Receiver on the user's own Chromecast, live sync over a Cast custom channel (trimmed `CastDisplayState` projection < 32 KB, snapshot hydration + per-throw deltas, auto-pause countdown in sync), ORIGIN_SCOPED auto-rejoin incl. in-progress-match restore after tablet reload, and a written Cast Console registration guide. Existing PC second-window and tablet fullscreen paths unchanged.

### What Worked
- Single-phase milestone avoided a verification cliff: all Cast work (sender, receiver, sync, deploy) verified together in one on-device UAT pass structure.
- Ground-truth diagnosis on real hardware: remote-debugging the receiver's console, a temporary on-screen debug overlay on the TV, and grepping the live deployed bundle each turned a vague symptom ("Failed to cast") into a confirmed root cause before any fix was written.
- The debug workflow nailed the invisible-Cast-button mystery at the bundle level (deploy ran 4.5 min before the `VITE_CAST_APP_ID` repo variable existed — zero App-ID occurrences in the live JS proved it).

### What Was Inefficient
- Three on-device UAT passes, each requiring a Pages deploy + physical TV round-trip. Two bug classes were only observable on real hardware: the receiver's Chrome 90 CSS support matrix and no-trailing-slash URL asset resolution.
- Mock-based unit tests masked two integration bugs: the sender sent untagged snapshots the receiver silently dropped (434 unit tests green, TV stuck on idle), and a synchronous `MockBroadcastChannel` hid an open-post-close message race.

### Patterns Established
- The Cast receiver runs **Chrome 90 @ 1280×720**: no container queries, no dvh, no subgrid. Gate modern CSS behind `@supports` — duplicate-property fallbacks do NOT survive the CSS minifier's dedup.
- `kit.paths.relative = false` (absolute asset paths) — relative `../_app` paths 404 at the domain root on no-trailing-slash deep-route loads (Cast receiver, manual reloads).
- Wire formats get a sender→receiver contract test (`cast-contract.test.ts`) — isolated unit tests of each side cannot catch a message-shape mismatch.
- PWA `registerType: 'autoUpdate'` so the receiver self-updates on each cast session (no Chromecast reboot after deploys).

### Key Lessons
- Schedule hardware prerequisites before code-complete: the $5 Cast Console registration (+ 15-min propagation) gated every E2E test; it was flagged as a blocker early and still compressed the UAT window.
- Every UAT failure was environment/config-shaped (build-time env timing, URL resolution, legacy-browser CSS, wire tagging) — the reducer/state logic held; invest verification effort at the integration boundaries.
- Close the loop on planning artifacts promptly: UAT passed 2026-06-19, but the debug session and VERIFICATION status stayed open until milestone close (2026-07-13) had to retro-resolve them.

### Cost Observations
- Model mix: planning on opus, research/execution/review on sonnet (unchanged from v1.0).
- Fixes were tiny (a 1-line config flag, `@supports` blocks, a type tag); diagnosis on real hardware was the cost driver — 3 UAT passes.

---

## Milestone: v1.2 — Restyling

**Shipped:** 2026-07-14 (verified closeout)
**Phases:** 5 (Phases 8–12) | **Plans:** 27

### What Was Built
A pure, full-app restyle onto the `design/` design system — no functional change. DS color/spacing/radius/elevation tokens replace all provisional v1.0 styling app-wide (as precomputed, Chrome-90-safe static values); Barlow + Barlow Semi Condensed self-hosted as WOFF2 and offline-precached with tabular-nums on score surfaces; a shared `.btn`/`.switch` component layer; the scoring surface (Numpad, Dartboard colors, DartPill visit strip, 96px amber-edge ScoreCard) and the spectator display on all three surfaces (PC window, tablet fullscreen, Chromecast receiver) brought to spec; every remaining page (Hub, Setup, History, Stats, Data/backup) and every global overlay/toast restyled; DS motion with a full `prefers-reduced-motion` collapse.

### What Worked
- Wave-based parallel sweeps handled breadth cheaply: independent component/file groups (Phase 8's three parallel sweeps, Phase 9's seven plans) ran without contention because each plan owned disjoint files.
- Scoped grep gates + nearest-DS-token mapping kept a 75-file color migration mechanical and auditable — each plan proved its own scope (e.g. "chart recolor limited to the exact 2 flagged `@const` fill lines").
- A permanent no-provisional-color file-scanner test (`design-tokens.test.ts`) turned "did we miss a color anywhere?" into a CI invariant — the restyle can't silently drift back.
- Computed-style browser tests (Numpad, StatCard, etc.) locked literal DS values rather than trusting the eye; dartboard hit-detection was asserted byte-identical.
- On-device Chromecast UAT again earned its cost: it surfaced the pause-not-shown-on-receiver gap that every green unit test missed.

### What Was Inefficient
- The pause-on-Chromecast gap was only observable on real hardware — a Phase-12 pause blur-scrim addendum drew attention to a delivery path (`#broadcastPause()` never reached the Cast channel) that a "pure restyle" wasn't expected to touch. Same environment-boundary lesson as v1.1.
- Precomputing `color-mix()`/derived DS colors to static `rgba()` for Chrome 90 was repeated by hand per file — a recurring manual chore that a shared build step could have absorbed.
- The diagnosed pause debug session (fix already shipped in Phase 11) stayed `diagnosed` on disk until milestone close and had to be retro-resolved — the exact "close planning-artifact loops promptly" miss from v1.1, repeated.

### Patterns Established
- Precompute every DS `color-mix()`/derived color to a static `rgba()` — the Chrome-90 Cast receiver has neither `color-mix()` nor surviving minified fallbacks; now a project-wide rule.
- One shared `.btn`/`.switch` layer in `src/styles/components.css` instead of per-route button CSS.
- Ship a durable regression guard with a large sweep (`design-tokens.test.ts` file-scanner) so the change stays enforced, not just done once.
- Restyle discipline: byte-identical geometry/logic, nearest-token mapping, and a per-plan scoped grep gate that fails on out-of-scope edits.
- Live/pause state must be published to the Cast session on every relevant tick, not only inside `dispatch()`.

### Key Lessons
- Even a "pure restyle" can cross a delivery boundary: the one UAT failure was again environment-shaped (real Chromecast pause delivery), not logic. Invest verification at integration boundaries even when the diff looks cosmetic.
- Resolve diagnosed debug sessions and stale statuses at phase end, not at milestone close — the fix landing in code and the artifact saying so are two separate steps.
- A grep-gated invariant is a better deliverable than a clean sweep: it converts one-time correctness into a permanent property.

### Cost Observations
- Model mix: planning on opus, execution/review/verify on sonnet (unchanged from v1.0/v1.1).
- Fixes were tiny (a 1-line `#publishToCast()` call); cost was breadth (75 src files swept, +2 417 / −1 312) plus on-device UAT round-trips, not diagnosis difficulty.

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests at close | Shipped |
|-----------|--------|-------|----------------|---------|
| v1.0 MVP | 6 | 33 | 430 | 2026-06-13 |
| v1.1 Chromecast-Integration | 1 | 6 | 511 | 2026-07-13 |
| v1.2 Restyling | 5 | 27 | ~535 | 2026-07-14 |
