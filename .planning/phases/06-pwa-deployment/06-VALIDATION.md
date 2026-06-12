---
phase: 6
slug: pwa-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 (unit) + Vitest browser mode (component) |
| **Config file** | `vite.config.ts` (both projects inline) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15s unit; longer for browser |

---

## Sampling Rate

- **After every task commit:** `npm run test:unit`
- **After every plan wave:** `npm test`
- **Before `/gsd-verify-work`:** Full suite green + manual offline/install verification
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-PLAT03-01 | reload-prompt | 1 | PLAT-03 | — | Update toast appears on needRefresh | browser | `npm run test:browser -- --grep "ReloadPrompt"` | ❌ W0 | ⬜ pending |
| 6-PLAT03-02 | reload-prompt | 1 | PLAT-03 | — | "Aktualisieren" calls updateServiceWorker(true) | browser | `npm run test:browser -- --grep "ReloadPrompt"` | ❌ W0 | ⬜ pending |
| 6-PLAT03-03 | reload-prompt | 1 | PLAT-03 | — | "Schließen" hides toast | browser | `npm run test:browser -- --grep "ReloadPrompt"` | ❌ W0 | ⬜ pending |
| 6-PLAT04-01 | reload-prompt | 1 | PLAT-04 | — | Toast strings are German, dark-styled | browser | `npm run test:browser -- --grep "ReloadPrompt"` | ❌ W0 | ⬜ pending |
| 6-PLAT01-01 | pwa-config | 1 | PLAT-01 | — | Build emits manifest + SW + precache (incl. mp3) | unit/build | `BASE_PATH=/neverman-darts-app npm run build` then assert `build/manifest.webmanifest`, `build/sw.js`, mp3 in precache | ❌ W0 | ⬜ pending |
| 6-PLAT02-01 | deploy | 2 | PLAT-02/03 | — | GH Actions workflow valid; builds with BASE_PATH; .nojekyll present | unit/static | yaml-lint + assert workflow keys + `static/.nojekyll` exists | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ReloadPrompt.test.ts` (browser) — covers PLAT-03/04 update-prompt behavior (appears, Aktualisieren→updateServiceWorker(true), Schließen→hide, German strings)
- [ ] `src/test-mocks/pwa-register-mock.ts` — shared mock for `virtual:pwa-register/svelte` so the suite never loads the real PWA virtual module
- [ ] vite.config test-mode guard: exclude `SvelteKitPWA()` when `process.env.VITEST` set + `test.alias` for the virtual module → keeps the existing ~421 tests green

**Note:** The PWA virtual module (`virtual:pwa-register/svelte`) does not exist at unit-test time — it is injected by the plugin at build. All component tests for ReloadPrompt MUST import the mock, not the virtual module.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App is installable (manifest green, SW registered, icons) | PLAT-01 | Install UX is browser/OS-driven | `BASE_PATH=/neverman-darts-app npm run build && npm run preview`; DevTools → Application → Manifest shows no errors; install prompt available |
| Works fully offline after first load incl. SFX | PLAT-02 | Offline behavior is environmental | After SW installs, DevTools → Network → Offline, reload → app loads; trigger a 180 → SFX still plays |
| Loads correctly at the Pages subpath (no 404 assets/routes) | PLAT-02/03 | Real subpath only exists on Pages | After first deploy, browse `https://<user>.github.io/neverman-darts-app/`; navigate /match, /display, /stats — no broken assets |
| Update prompt appears on a new deploy (not silent stale) | PLAT-03 | Requires two deployed versions | Deploy v2; open installed v1 → German "Neue Version verfügbar" toast appears; tap Aktualisieren → reloads to v2 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or are documented manual-only
- [ ] Wave 0 covers ReloadPrompt + the PWA virtual-module mock + test-mode plugin guard
- [ ] Existing full suite stays green (PWA plugin excluded under VITEST)
- [ ] Build asserts: manifest, SW, mp3 precache, .nojekyll, base-path-prefixed manifest fields
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
