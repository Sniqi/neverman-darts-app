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

## Cross-Milestone Trends

| Milestone | Phases | Plans | Tests at close | Shipped |
|-----------|--------|-------|----------------|---------|
| v1.0 MVP | 6 | 33 | 430 | 2026-06-13 |
| v1.1 Chromecast-Integration | 1 | 6 | 511 | 2026-07-13 |
