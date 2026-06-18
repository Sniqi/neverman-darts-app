---
status: diagnosed
trigger: "On deployed PWA /match, no Google Cast button/launcher appears in the Anzeigemodus panel — only 'Zweites Fenster öffnen' and 'Anzeige hier im Vollbild'."
created: 2026-06-18T21:13:33Z
updated: 2026-06-18T21:20:00Z
---

## Current Focus

hypothesis: CONFIRMED — The deployed bundle was built BEFORE the `VITE_CAST_APP_ID` repo variable existed. Vite inlined `import.meta.env.VITE_CAST_APP_ID` as undefined/empty, so the `if (appId)` guard in /match onMount is false, `castSenderManager.init()` never runs, the Cast SDK is never loaded, `castAvailable` stays false, and the `{#if castSenderManager.castAvailable}` block in SpectatorChooser never renders the Cast row.
test: Grepped the LIVE deployed bundle (all 11 node + 19 chunk files, 361 KB) for the App ID `9671DA41`, the Cast SDK loader URL, and the Cast UI markers. Cross-checked GitHub Actions deploy timestamp vs. repo-variable creation timestamp.
expecting: App ID absent from deployed JS + all Cast code present = stale-build / unset-env-at-build-time root cause (code-config category, deploy ordering).
next_action: Root cause confirmed. Diagnose-only mode — return diagnosis, do not fix.

## Symptoms

expected: On /match in desktop Chrome (same LAN as a registered Chromecast), a Cast control is visible. Tapping it lists the device; selecting it starts a Cast session and the TV shows the /display scoreboard.
actual: "Ich sehe 'Cast' nirgendswo." Anzeigemodus panel shows only "Zweites Fenster öffnen" and "Anzeige hier im Vollbild". No Cast button / google-cast-launcher / cast icon anywhere.
errors: None reported (console not yet inspected).
reproduction: Open https://sniqi.github.io/neverman-darts-app/match in desktop Chrome on same LAN as a Chromecast. Observe Anzeigemodus panel — no Cast control.
started: First on-device UAT (CAST-01) of deployed receiver in Phase 07.

## Eliminated

## Evidence

- timestamp: 2026-06-18T21:13:33Z
  checked: 07-05-SUMMARY.md (Cast sender wiring)
  found: "Cast row in SpectatorChooser is wrapped in `{#if castSenderManager.castAvailable}` — 'fully absent on non-Chrome (D-13), no disabled state'. /match onMount reads `import.meta.env.VITE_CAST_APP_ID`; 'if present' calls `castSenderManager.init(appId)` + `matchStore.setCastManager(...)`."
  implication: The Cast row's visibility depends on castAvailable, which depends on init() running, which depends on VITE_CAST_APP_ID being present at build time. If the env var is absent in the deployed build, the row never renders.

- timestamp: 2026-06-18T21:13:33Z
  checked: 07-06-SUMMARY.md (deployment)
  found: "VITE_CAST_APP_ID wired via `vars.VITE_CAST_APP_ID` (GitHub Actions repo variable) in deploy.yml. .env.example has empty placeholder. App ID must be set as a repo variable for the deployed bundle to contain it."
  implication: If the GitHub repo variable VITE_CAST_APP_ID is not set (or deploy ran before it was set), the production bundle has an empty/undefined app ID → init() skipped → Cast row hidden.

- timestamp: 2026-06-18T21:15:00Z
  checked: src/routes/match/+page.svelte lines 56-62 (onMount)
  found: "Code reads `const appId = import.meta.env.VITE_CAST_APP_ID; if (appId) { castSenderManager.init(appId); matchStore.setCastManager(castSenderManager); }`. The init call — the ONLY thing that injects the SDK and arms `__onGCastApiAvailable` — is gated behind a truthy appId."
  implication: Empty/undefined appId at build time means init() is never called in production.

- timestamp: 2026-06-18T21:15:30Z
  checked: src/lib/cast-sender.svelte.ts lines 26-69
  found: "`#castAvailable = $state(false)` is set true ONLY inside the `__onGCastApiAvailable` callback, which is assigned inside `init()`. The SDK <script> is appended inside `init()`. No init() → no SDK load → callback never fires → castAvailable stays false forever."
  implication: castAvailable is structurally false whenever init() is skipped.

- timestamp: 2026-06-18T21:16:00Z
  checked: src/ui/display/SpectatorChooser.svelte lines 171-209
  found: "The entire Cast row (`<google-cast-launcher>` + 'Auf Chromecast übertragen' button + connected status line) is wrapped in `{#if castSenderManager.castAvailable}`. No else branch, no disabled state — fully absent when castAvailable is false (D-13). The panel correctly shows only the two non-Cast options."
  implication: This exactly reproduces the symptom: only 'Zweites Fenster öffnen' and 'Anzeige hier im Vollbild' are visible.

- timestamp: 2026-06-18T21:17:00Z
  checked: GitHub Actions deploy history (gh run list) + repo variables (gh variable list)
  found: "Last deploy run: 27788963051, commit d708b08, SUCCESS at 2026-06-18T20:59:37Z. Repo variable VITE_CAST_APP_ID (value 9671DA41) created/updated at 2026-06-18T21:04:02Z — ~4.5 minutes AFTER the last successful deploy finished."
  implication: The bundle currently live on GitHub Pages was built before the variable existed → VITE_CAST_APP_ID was empty at that build. No deploy has run since the variable was set.

- timestamp: 2026-06-18T21:19:00Z
  checked: LIVE deployed bundle at https://sniqi.github.io/neverman-darts-app/ — fetched all 11 node chunks + 19 shared chunks (361,752 bytes total) and grepped them
  found: "App ID '9671DA41' = 0 occurrences. cast_sender.js?loadCastFramework=1 = 1 occurrence. castAvailable token = 1 occurrence. __onGCastApiAvailable = 1 occurrence. German label 'Auf Chromecast übertragen' = 1 occurrence."
  implication: DECISIVE. The Cast feature code (sender manager, SDK loader, Cast row UI) IS present in the deployed bundle — so this is NOT a stale pre-Cast build and NOT a CSP/SW block. But the App ID literal is ABSENT, proving `import.meta.env.VITE_CAST_APP_ID` was inlined as empty at build time. Therefore `if (appId)` is false in production, init() is skipped, and the Cast row never mounts. Root cause confirmed at the bundle level, not just by inference.

## Resolution

root_cause: |
  The live GitHub Pages bundle was built by the deploy run that completed at 2026-06-18T20:59:37Z, which is BEFORE the `VITE_CAST_APP_ID` GitHub Actions repo variable was created (21:04:02Z). At that build, `import.meta.env.VITE_CAST_APP_ID` was undefined and Vite inlined it as empty. In src/routes/match/+page.svelte the Cast bootstrap is guarded by `if (appId)` (lines 58-62); with an empty appId the guard is false, so `castSenderManager.init()` is never called. Because `castAvailable` is only set true inside the `__onGCastApiAvailable` callback that `init()` assigns (and `init()` is also what injects the Cast SDK <script>), `castAvailable` remains false. The Cast row in SpectatorChooser.svelte (lines 171-209) is wrapped in `{#if castSenderManager.castAvailable}` with no else/disabled branch, so it is entirely absent — leaving only "Zweites Fenster öffnen" and "Anzeige hier im Vollbild". Confirmed at the bundle level: the deployed JS contains all Cast code but zero occurrences of the App ID `9671DA41`.
fix: |
  (diagnose-only — not applied) Re-run the GitHub Pages deploy now that the repo variable exists, so the bundle is rebuilt with VITE_CAST_APP_ID inlined. Trigger via `gh workflow run "Deploy to GitHub Pages"` (workflow_dispatch is enabled) or push any commit to main/master. After the new deploy, the live bundle should contain `9671DA41` and the Cast row should appear in Chrome. Optionally harden the UX so a missing App ID is observable (e.g. a DEV console warning when appId is empty) rather than silently hiding Cast — but that is polish, not the root-cause fix.
verification: |
  Not yet verified (diagnose-only). Verification after the fix: (1) confirm the new deploy run finished AFTER 21:04:02Z; (2) grep the live bundle for `9671DA41` — should now be >0; (3) open https://sniqi.github.io/neverman-darts-app/match in Chrome on the Cast LAN and confirm "Auf Chromecast übertragen" appears in the Anzeigemodus panel.
files_changed: []
