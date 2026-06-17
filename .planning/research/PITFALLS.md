# Pitfalls Research

**Domain:** Google Cast (CAF) integration into a SvelteKit static PWA on GitHub Pages
**Researched:** 2026-06-18
**Confidence:** MEDIUM (official Google Cast docs + verified SvelteKit/Workbox docs; specific interaction bugs cross-checked via community; testing claims LOW due to manual-only Google guidance)

---

## Critical Pitfalls

### Pitfall 1: Receiver Page Swallowed by SPA Fallback

**What goes wrong:**
GitHub Pages has no server-side routing. The deployed app uses adapter-static's `fallback: '200.html'` so every unknown URL returns the SPA shell. When the Chromecast loads the registered receiver URL (`https://sniqi.github.io/neverman-darts-app/display`), it receives the SPA shell HTML instead of the Cast receiver page. The SvelteKit client router then boots up and tries to navigate to `/display` as an SPA route — but the receiver SDK scripts are never loaded correctly because the SPA shell is not the receiver's standalone HTML.

**Why it happens:**
`/display` is a SvelteKit route, so adapter-static does not emit a standalone `display/index.html` unless that route is explicitly prerendered. With `ssr = false` globally (common in SPA mode), prerendering is disabled and the fallback page is served for all paths.

**How to avoid:**
In `src/routes/display/+page.js`, set:
```js
export const prerender = true;
export const ssr = true; // required — prerender needs SSR enabled
```
This forces adapter-static to emit `build/display/index.html` as a real standalone file. GitHub Pages serves it directly without the fallback. Also add the route to `navigateFallbackDenylist` in the vite-plugin-pwa config (see Pitfall 7).

**Warning signs:**
- Chromecast TV shows the darts scoring UI briefly then goes blank or shows a routing error
- Chrome Remote Debugger at `<device-ip>:9222` shows the SPA JS bundle loading on the receiver
- Casting from the sender shows "Launching..." indefinitely

**Phase to address:** Phase 1 — Receiver Setup (before any Cast integration work begins)

---

### Pitfall 2: `__onGCastApiAvailable` Callback Missed Due to Script Load Order

**What goes wrong:**
The Cast SDK calls `window.__onGCastApiAvailable(isAvailable)` exactly once, when it finishes loading. If the callback is assigned *after* the `<script>` tag runs (e.g., in a Svelte `onMount` after the script has already been appended), the callback fires before the assignment and Cast never initializes. The Cast button never appears; no error is thrown.

**Why it happens:**
In a SvelteKit component, it is tempting to append the Cast SDK script tag in `onMount` and also define `window.__onGCastApiAvailable` in the same `onMount` body after `appendChild`. If the script loads synchronously from cache or very fast, the callback fires before the `window` assignment line runs.

**How to avoid:**
Assign `window.__onGCastApiAvailable` *before* appending the script tag, in the same synchronous block:
```js
onMount(() => {
  window['__onGCastApiAvailable'] = (isAvailable) => {
    if (isAvailable) initializeCast();
  };
  const s = document.createElement('script');
  s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
  document.head.appendChild(s);
});
```
Guard the entire block with `import { browser } from '$app/environment'` since `document` and `window` do not exist during prerender.

**Warning signs:**
- Cast button never appears on any device
- `typeof cast` is `'undefined'` in browser console after page load
- No errors in console (silent failure)

**Phase to address:** Phase 1 — Cast Sender integration in `/match`

---

### Pitfall 3: Missing `?loadCastFramework=1` Query Parameter on SDK Script

**What goes wrong:**
The CAF (Cast Application Framework) layer — `cast.framework.CastContext`, `cast.framework.RemotePlayer`, message channels — is only loaded when the script URL includes `?loadCastFramework=1`. Without it, only the older low-level `chrome.cast` Base API is available. Code using `cast.framework.*` throws `TypeError: Cannot read properties of undefined`.

**Why it happens:**
Copying the script URL from older Stack Overflow answers or examples that predate CAF. The Base API URL and the CAF URL look nearly identical.

**How to avoid:**
Always use:
```
https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1
```
Add this as a named constant in a `cast-config.ts` file to prevent typos.

**Warning signs:**
- `cast.framework` is `undefined` in console
- `CastContext` or `RemotePlayer` references throw TypeError
- Chrome Cast button appears but clicking it throws an error

**Phase to address:** Phase 1 — Cast Sender integration

---

### Pitfall 4: Receiver Idle Timeout Disconnects Mid-Match

**What goes wrong:**
The CAF receiver framework automatically terminates the receiver app after approximately 5 minutes of inactivity (no media playback, no messages). A darts match with breaks between legs, auto-pause screens, or a slow player can easily exceed this threshold. The TV goes back to the Chromecast home screen mid-game with no warning to the players.

**Why it happens:**
CAF's default idle timeout is designed for media apps where "no media playing" means "user is done." A darts score display is permanently "idle" from the framework's perspective — it has no media, only custom messages.

**How to avoid:**
In the receiver's `CastReceiverOptions`:
```js
const options = new cast.framework.CastReceiverOptions();
options.disableIdleTimeout = true; // for non-media apps
options.maxInactivity = 3600;      // 1 hour heartbeat window
context.start(options);
```
`disableIdleTimeout = true` is explicitly documented for non-media applications. `maxInactivity = 3600` keeps the sender connection alive via heartbeats across long turns. Do NOT use `setInactivityTimeout()` — it is debug-only and unsupported in production.

**Warning signs:**
- TV returns to Chromecast home screen after 5 minutes of no throws
- Session appears active on the sender (Cast button still shows connected) but receiver is gone
- Reconnecting from sender restarts the receiver from scratch (losing the live display)

**Phase to address:** Phase 1 — Receiver core setup (set these options before any other receiver work)

---

### Pitfall 5: Custom Namespace Mismatch Silently Drops All Messages

**What goes wrong:**
Custom channel messages between sender and receiver are routed by namespace string. If the namespace differs by even one character between the sender registration and receiver listener, messages are silently discarded — no error, no warning, nothing. The receiver shows a stale score forever while the sender thinks it is successfully broadcasting.

**Why it happens:**
The namespace must be typed identically in at minimum two places: the sender (`CastSession.addMessageListener`) and the receiver (`context.addCustomMessageListener`). Typos, case differences, or missing the `urn:x-cast:` prefix on one side cause silent failure.

**How to avoid:**
Define the namespace as a single exported constant in a shared module:
```ts
// src/lib/cast/constants.ts
export const CAST_NAMESPACE = 'urn:x-cast:com.neverman.darts.state';
```
Import this constant in both the sender Svelte component and the receiver page. Never duplicate the string literal.

The namespace must start with `urn:x-cast:` — any other prefix is rejected by the SDK.

**Warning signs:**
- Sender logs show `sendMessage` calls succeeding (no error returned)
- Receiver never fires the message listener callback
- Chrome Remote Debugger on the receiver shows no incoming custom messages

**Phase to address:** Phase 1 — Messaging infrastructure, before writing any state sync logic

---

### Pitfall 6: Message Payload Exceeds 64 KB Limit

**What goes wrong:**
Cast transport enforces a hard message size limit of 64 KB per message. The full `MatchState` object including match history, all players' throw history, and statistics could exceed this if serialized naively. Messages at or above the limit are silently dropped or cause a send error.

**Why it happens:**
The initial "hydration snapshot" on session connect is tempting to implement as a full `JSON.stringify(matchState)` dump including history, cumulative stats, and all past legs. This can grow large in a long match.

**How to avoid:**
Send only the live display state — current scores, active leg throws, player names, who is throwing — not match history or accumulated statistics. Keep the snapshot payload under 32 KB as a safe margin. Define a `CastDisplayState` type that is a strict subset of `MatchState`, containing only what `/display` needs to render. Validate payload size in development with `new TextEncoder().encode(JSON.stringify(payload)).length` before sending.

**Warning signs:**
- Receiver stops updating after a certain number of legs
- Sender's `sendMessage` returns an error after match grows long
- First connection (hydration snapshot) works but later reconnects after a long game fail

**Phase to address:** Phase 1 — State sync design (define `CastDisplayState` type before writing sync code)

---

### Pitfall 7: Workbox `navigateFallback` Serves SPA Shell to the Receiver

**What goes wrong:**
`@vite-pwa/sveltekit` configures Workbox with a `navigateFallback` pointing to `200.html`. Workbox intercepts all navigation requests that don't match a precached URL and returns the SPA shell. When the Chromecast first loads the receiver URL, the service worker registered from the sender's origin intercepts it and returns the SPA shell instead of the prerendered receiver HTML.

**Why it happens:**
The receiver URL (`/neverman-darts-app/display`) is on the same origin as the sender. The service worker's scope covers the whole origin. Without explicit exclusion, the receiver URL falls through to `navigateFallback`.

**How to avoid:**
Add the receiver route to `navigateFallbackDenylist` in `vite.config.ts`:
```ts
VitePWA({
  workbox: {
    navigateFallback: '/neverman-darts-app/200.html',
    navigateFallbackDenylist: [/^\/neverman-darts-app\/display(\/|$)/],
  }
})
```
With `prerender = true` on the `/display` route, adapter-static emits the real HTML file, and the denylist ensures Workbox serves it directly.

Note: the Chromecast device itself runs the receiver in a clean Chromium context and does not have the sender's service worker installed — this pitfall only affects the initial load when the receiver page is first fetched.

**Warning signs:**
- Receiver URL returns the darts scoring app HTML when navigated to directly
- Chromecast shows the scoring board briefly then goes blank
- DevTools Application > Service Workers shows the SW intercepting `/display` navigation

**Phase to address:** Phase 1 — PWA/SW configuration, same commit as the receiver prerender change

---

### Pitfall 8: SvelteKit Prerender Crashes on `window`/`chrome` Access in Receiver

**What goes wrong:**
`window`, `document`, and `chrome` are undefined in Node.js during SvelteKit's prerender phase. If the receiver page's `+page.svelte` imports or runs any Cast receiver SDK code at module level, the `svelte-kit build` step throws `ReferenceError: window is not defined` and the build fails.

**Why it happens:**
The Cast Receiver SDK (`cast_receiver_framework.js`) is a browser-only script. It accesses globals on load. If SvelteKit tries to SSR the `/display` route, it executes the module in Node.js context where these globals don't exist.

**How to avoid:**
The receiver page must set `ssr = true` for prerendering to work, but the SDK must only execute in the browser. Load the receiver SDK script via a `<svelte:head>` tag (which is inert during SSR), or inject it dynamically in `onMount`. Access `cast.framework.*` only inside `onMount` callbacks. Never call receiver SDK code at module top level or in `$effect` runes that run during SSR.

```svelte
<!-- src/routes/display/+page.svelte -->
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Cast receiver SDK is loaded via <svelte:head> script tag
    const context = cast.framework.CastReceiverContext.getInstance();
    // ...
  });
</script>

<svelte:head>
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</svelte:head>
```

**Warning signs:**
- `vite build` or `svelte-kit build` fails with `ReferenceError: window is not defined`
- Build completes but `/display` route throws a hydration error
- `svelte-check` reports type errors referencing `cast` namespace

**Phase to address:** Phase 1 — Receiver page scaffold (first thing to validate before writing any receiver logic)

---

### Pitfall 9: Cast Developer Registration Account Email is Permanent

**What goes wrong:**
The email address used to register the Google Cast Developer account cannot be changed after creation. If the account is registered under a personal Gmail address and the project outlasts that relationship (or the user wants to transfer it), the entire Cast developer account is locked to that email forever.

**Why it happens:**
Google Cast Console does not expose an email-change flow. This is a one-way decision made at the $5 registration step.

**How to avoid:**
Use the same email address already associated with other project assets (GitHub account, etc.) or a dedicated project email. For a home project this is low risk, but worth knowing before paying the fee. The $5 fee is also non-refundable.

**Warning signs:**
- None — this is a pre-registration decision, not a technical failure

**Phase to address:** Pre-Phase 0 — Before any code is written; resolve during project setup

---

### Pitfall 10: Receiver URL in Cast Console Must Match the Exact Deployed URL

**What goes wrong:**
The Cast Console requires a receiver URL when registering the application. If the URL is entered incorrectly (e.g., missing the `/neverman-darts-app` subpath prefix, using `http` instead of `https`, or pointing to a path that does not resolve), the Chromecast fetches the wrong page or gets a 404. The sender receives `LAUNCH_ERROR` or the session times out silently.

**Why it happens:**
GitHub Pages deploys to `https://<username>.github.io/<repo-name>/`. The receiver URL must include the full subpath: `https://sniqi.github.io/neverman-darts-app/display`. If entered as `https://sniqi.github.io/display` or the repo is later renamed, the registration is stale.

**How to avoid:**
Before registering, deploy the app to GitHub Pages and verify `https://sniqi.github.io/neverman-darts-app/display` returns the correct receiver HTML (not a 404 or the SPA shell). Paste the verified URL into Cast Console. If the repo is renamed or moved, the receiver URL registration must be updated (requires another propagation wait + device reboot cycle).

Store the registered App ID in a `.env` variable (`VITE_CAST_APP_ID`) so the build embeds it without hardcoding.

**Warning signs:**
- Sender shows "Connecting..." indefinitely
- Chromecast TV shows no loading indicator after cast request
- Cast Console device status shows connected but receiver page loads as blank

**Phase to address:** Phase 1 — Before first Cast session test; receiver must be deployed and verified first

---

### Pitfall 11: 15-Minute Propagation + Reboot Loop During Development

**What goes wrong:**
Every time a device registration or receiver URL is changed in the Cast Console, Google's systems take 5–15 minutes to propagate the change. The Chromecast then requires a power reboot to pick up the new config. Developers testing registration changes iterate slowly, often assuming something is broken when the device simply has not received the update yet.

**Why it happens:**
Cast device configuration is pushed from Google's servers, not pulled on demand. The device firmware checks for updates periodically, and only after a reboot.

**How to avoid:**
- Register the device and receiver URL once before beginning integration work, not incrementally.
- Do not change the receiver URL unless absolutely necessary during development.
- Add a calendar reminder: "Wait 15 min, then reboot Chromecast" after any Console change.
- Verify the Console shows "Ready for Testing" status on the device before testing.
- Keep a local dev server running on the same LAN as a fallback so the receiver page can be tested independently from the Cast session.

**Warning signs:**
- Receiver app fails to load even though the URL is correct
- Cast Console shows device registered but device status is not "Ready for Testing"
- App worked yesterday, not today (stale config on device after a settings change)

**Phase to address:** Phase 1 — Setup checklist item before first end-to-end test

---

### Pitfall 12: Graceful Degradation Not Implemented for Non-Chrome Browsers

**What goes wrong:**
The Cast SDK only exists in Chrome/Chromium on desktop/Android. `window.__onGCastApiAvailable` fires with `isAvailable = false` (or never fires) on Firefox, Safari, and iOS Chrome. If the sender component does not handle this, the Cast button renders as a broken UI element, or the component throws trying to access `cast.framework` which is `undefined`. On the existing `/match` route — which must continue working on all browsers for scoring — this is a regression.

**Why it happens:**
Cast SDK integration is typically built and tested in Chrome, then shipped. Firefox/Safari users hit it only in production.

**How to avoid:**
Store a `castAvailable` boolean in `$state`, defaulting to `false`. Set it to `true` only inside the `__onGCastApiAvailable` callback when `isAvailable` is `true`. Render the Cast button only when `castAvailable` is `true`. All other scoring functionality must be completely independent of this boolean. Never call `cast.framework.*` without first checking `castAvailable`.

```ts
let castAvailable = $state(false);

window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
  castAvailable = isAvailable;
  if (isAvailable) initializeCast();
};
```

**Warning signs:**
- Firefox users see a Cast button that does nothing on click
- `TypeError: Cannot read properties of undefined (reading 'CastContext')` in non-Chrome browsers
- `/match` route broken on Safari for scoring (not just Cast features)

**Phase to address:** Phase 1 — Sender integration; must be part of the initial implementation, not a follow-up

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode the Cast App ID string in source | Avoids environment variable setup | App ID leaked in public GitHub repo; harder to change | Never — use `VITE_CAST_APP_ID` env var |
| Send full `MatchState` as hydration snapshot | Simple implementation | Risk of exceeding 64 KB limit in long matches; sends private history to Chromecast | Never — define a `CastDisplayState` subset |
| Skip `navigateFallbackDenylist` for `/display` | One fewer config option | Receiver serves SPA shell; Cast session never loads | Never — required for correctness |
| Use `setInactivityTimeout()` instead of `maxInactivity` | Slightly simpler API | Debug-only API; behavior undefined in production | Never |
| Inline the namespace string in sender and receiver | Faster first draft | Silent mismatch bug guaranteed when one copy drifts | Never — shared constant only |
| Register Cast device after writing all the code | Defer external dependency | 15-min propagation blocks all end-to-end testing at the end | Acceptable only if local dev testing (non-Cast) covers most of the work |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cast SDK script tag | Loaded via `import` or top-level module code | Injected in `onMount` behind `browser` guard; `__onGCastApiAvailable` assigned first |
| Cast Console App ID | Hardcoded string | `VITE_CAST_APP_ID` env var; `.env.example` checked into repo |
| Receiver URL | Entered in Cast Console before page is deployed | Deploy to GitHub Pages, verify URL returns correct HTML, then register |
| `urn:x-cast` namespace | Duplicated string literals in sender and receiver files | Single exported constant in `src/lib/cast/constants.ts` |
| `/display` route prerender | Skipped because app uses SPA mode globally | `export const prerender = true; export const ssr = true` in `display/+page.js` |
| Workbox `navigateFallback` | Left at default (catches all routes) | Add `/neverman-darts-app\/display` to `navigateFallbackDenylist` |
| Receiver idle timeout | Not configured (defaults to ~5 min) | `disableIdleTimeout = true` + `maxInactivity = 3600` in `CastReceiverOptions` |
| BroadcastChannel + Cast coexistence | Cast sender replaces BroadcastChannel | Cast is additive; BroadcastChannel path must continue working; `/display` must handle both |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full `MatchState` on every throw | Works fine for short matches; breaks silently on long ones | Define a `CastDisplayState` projection; validate size before send | Matches with 10+ legs and full throw history |
| Rebuilding entire Svelte component tree on each Cast message | Perceptible flicker on TV screen during rapid scoring | Use fine-grained `$state` runes; update only changed fields | Not a concern at one-throw-per-second cadence, but avoid full state replacement |
| Polling for Cast session state in a tight `$effect` | CPU drain on tablet while scoring | React to Cast SDK events (`SESSION_STATE_CHANGED`), never poll | Immediately — polling is wrong architecture |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing the Cast App ID in a public GitHub commit | App ID is not a secret per se, but scoping it to an env var prevents accidental use of production ID in dev | Use `VITE_CAST_APP_ID`; add to `.env.local` (gitignored); document in `.env.example` |
| Trusting message content from Cast channel without validation | A malicious sender on the same LAN could send arbitrary state | Validate message schema on the receiver before applying to UI state; this is a home app so risk is low, but type-guard the parsed JSON |
| Registering Cast account under personal Google account without considering account recovery | Account locked if Google account is compromised or deleted | Use the same Google account as other project assets; enable 2FA |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No Cast connection status shown on `/match` | User does not know if Chromecast is actually receiving updates | Show a Cast connection indicator (connected / connecting / disconnected) near the Cast button |
| Receiver shows stale score after reconnect with no indication | Players see wrong scores on TV without knowing they need to reconnect | On session reconnect, immediately send a full hydration snapshot; show a "reconnecting" overlay on the receiver until a message is received |
| No fallback when Cast session drops mid-match | TV goes blank; players confused | Receiver should show a "Verbindung unterbrochen — Bitte neu verbinden" overlay when `SENDER_DISCONNECTED` fires with zero connected senders |
| Cast button hidden vs. disabled on unsupported browsers | Firefox users see no button, wonder where the feature went | Show a grayed-out Cast icon with tooltip "Nur in Chrome verfügbar" instead of completely hiding it |

---

## "Looks Done But Isn't" Checklist

- [ ] **Receiver URL prerendered:** Verify `build/display/index.html` exists after `vite build` and does NOT contain the SPA bootstrap JS
- [ ] **Workbox denylist active:** Navigate to `https://sniqi.github.io/neverman-darts-app/display` directly in a browser and confirm the Cast receiver page loads (not the scoring app)
- [ ] **Idle timeout disabled:** Leave a Cast session connected for 6 minutes with no messages; confirm the receiver stays on screen
- [ ] **Namespace constant shared:** Grep the codebase for the `urn:x-cast:` string — it should appear exactly once (the constant definition), never as a string literal in sender or receiver code
- [ ] **64 KB payload check:** `console.log(new TextEncoder().encode(JSON.stringify(castDisplayState)).length)` during a long test match — must stay under 32 768 bytes
- [ ] **Non-Chrome graceful degradation:** Open `/match` in Firefox; Cast button is absent or visually disabled; all scoring features work normally
- [ ] **BroadcastChannel still works:** Open `/display` in a second PC window while Cast is connected; both the Cast receiver and the BroadcastChannel window show correct score

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Receiver page serves SPA shell | MEDIUM | Add `prerender = true` to display route; add denylist entry; redeploy; wait for GitHub Pages cache to clear (can take minutes) |
| Wrong Cast App ID registered | HIGH | Re-register receiver in Cast Console with correct URL; wait 15 min; reboot Chromecast; redeploy with corrected App ID env var |
| Namespace mismatch discovered in testing | LOW | Introduce shared constant; update both sender and receiver; no Cast Console change needed |
| Idle timeout kills session | LOW | Add `disableIdleTimeout = true` to receiver options; redeploy receiver |
| Cast account email wrong | HIGH | No fix — email cannot be changed. Mitigation: create new Cast developer account ($5 again) and re-register app + device |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Receiver page swallowed by SPA fallback | Phase 1 — Receiver scaffold | `curl https://sniqi.github.io/neverman-darts-app/display` returns receiver HTML, not SPA shell |
| `__onGCastApiAvailable` missed | Phase 1 — Sender integration | `typeof cast !== 'undefined'` in Chrome console on `/match`; Cast button appears |
| Missing `?loadCastFramework=1` | Phase 1 — Sender integration | `typeof cast.framework !== 'undefined'` in Chrome console |
| Receiver idle timeout | Phase 1 — Receiver core setup | Manual: leave session idle 6 min; receiver remains visible |
| Namespace mismatch | Phase 1 — Messaging infrastructure | Send a test message; Chrome Remote Debugger confirms receipt on receiver |
| 64 KB payload limit | Phase 1 — State sync design | Payload size assertion in dev; test after 20+ legs |
| Workbox serves SPA shell to receiver | Phase 1 — PWA/SW config | Open receiver URL with DevTools SW debugger; confirm SW does not intercept |
| SSR crash on receiver page | Phase 1 — Receiver scaffold | `vite build` passes; no ReferenceError in build output |
| Cast account email permanent | Pre-Phase 0 — Setup | Choose account before paying the $5 fee |
| Wrong receiver URL in Console | Phase 1 — Before first E2E test | Verify URL loads correct HTML in browser before entering in Cast Console |
| 15-min propagation loop | Phase 1 — Setup checklist | Register device before starting integration coding; do not touch Console during active development |
| No graceful degradation | Phase 1 — Sender integration | Open `/match` in Firefox; scoring UI fully functional; no Cast-related errors in console |

---

## Sources

- [Google Cast Registration docs](https://developers.google.com/cast/docs/registration) — device registration, serial numbers, propagation timing — MEDIUM confidence (official)
- [Cast Developer Help: Developer Registration](https://support.google.com/cast-developer/answer/4512496) — $5 fee, email permanence — MEDIUM confidence (official support)
- [Integrate Cast SDK into Your Web Sender App](https://developers.google.com/cast/docs/web_sender/integrate) — `__onGCastApiAvailable` timing, `?loadCastFramework=1`, `setOptions` ordering — MEDIUM confidence (official)
- [CastReceiverOptions reference](https://developers.google.com/cast/docs/reference/web_receiver/cast.framework.CastReceiverOptions) — `disableIdleTimeout`, `maxInactivity` — MEDIUM confidence (official)
- [Add Core Features to Your Custom Web Receiver](https://developers.google.com/cast/docs/web_receiver/core_features) — idle timeout behavior, message interception caveats — MEDIUM confidence (official)
- [Custom Channels: React Native Google Cast](https://react-native-google-cast.github.io/docs/guides/custom-channels) — namespace format requirement — LOW confidence (third-party)
- [Media Playback Messages namespace](https://developers.google.com/cast/docs/media/messages) — 64 KB message size limit — MEDIUM confidence (official)
- [SvelteKit Static Site Generation docs](https://svelte.dev/docs/kit/adapter-static) — prerender = true, ssr = true requirements — MEDIUM confidence (official)
- [Vite PWA: generateSW / navigateFallbackDenylist](https://vite-pwa-org.netlify.app/workbox/generate-sw) — SW interception exclusion — MEDIUM confidence (official plugin docs)
- [Testing Cast Applications](https://developers.google.com/cast/docs/testing) — manual testing only, no automated test framework — MEDIUM confidence (official)
- [chromecast-device-emulator](https://github.com/ajhsu/chromecast-device-emulator) — local emulation without physical device — LOW confidence (community)
- [Command and Control (CaC) Tool](https://developers.google.com/cast/docs/debugging/cac_tool) — functional web sender for testing receivers — MEDIUM confidence (official)

---
*Pitfalls research for: Google Cast (CAF) integration — SvelteKit static PWA on GitHub Pages (v1.1)*
*Researched: 2026-06-18*
