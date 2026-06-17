# Technology Stack — v1.1 Cast Integration

**Domain:** Google Cast sender + Custom Web Receiver in a SvelteKit adapter-static PWA
**Researched:** 2026-06-18
**Confidence:** MEDIUM (SDK URLs and API shape verified against Google Cast developer docs, June 2026; npm versions verified against DefinitelyTyped / libraries.io)

> This file covers **only the additions required for v1.1 Cast support**. The v1.0 darts-domain stack (SvelteKit, Svelte 5, adapter-static, vite-plugin-pwa, Dexie, Vitest) is already shipped and documented in CLAUDE.md — do not re-research it.

---

## What Gets Added

Two orthogonal additions, no shared library between them:

1. **Sender** (`/match`) — loads Google's Cast Sender SDK at runtime, shows a Cast button, opens a session, sends state over a custom channel.
2. **Receiver** (`static/receiver.html`) — a standalone HTML file that loads Google's CAF Receiver SDK, subscribes to the same custom channel, and renders the `/display` scoreboard UI.

Neither addition requires an npm package for the runtime SDK — both SDKs are loaded from `gstatic.com` at runtime. The only npm additions are TypeScript `@types` dev-dependencies.

---

## Recommended Stack

### Core Technologies (new for v1.1)

| Technology | Load URL / Version | Purpose | Why |
|------------|--------------------|---------|-----|
| **Cast Sender SDK** (CAF) | `https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1` | Sender-side Cast API: device discovery, session management, custom channel messaging | The only supported way to add Cast sender capability to a web app. Must load from gstatic — Google does not publish this to npm. The `?loadCastFramework=1` query param is required to access `cast.framework.*`; without it you get only the legacy `chrome.cast.*` API. Chrome/Chromium-only (by design — Cast sender is a Chrome feature). |
| **CAF Web Receiver SDK** | `//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js` | Receiver-side Cast API: session lifecycle, custom message channel, context start | The only supported way to build a Custom Web Receiver. Must load from gstatic — never self-host. Protocol-relative URL (`//`) is intentional: lets the Chromecast fetch it via HTTPS without hard-coding the protocol (per Google's own docs). Current CAF version is v3, release 3.0.0151 (May 2026). |

### TypeScript Typings (new for v1.1, dev-only)

| Package | Version | Scope | What It Provides |
|---------|---------|-------|-----------------|
| `@types/chromecast-caf-sender` | `1.0.11` | devDependency — sender build only (`src/routes/match/`) | Declares `window.cast`, `window.__onGCastApiAvailable`, the full `cast.framework` namespace (CastContext, CastSession, CastState, RemotePlayerController, etc.). Depends on `@types/chrome`. Latest version, no known CVEs. |
| `@types/chromecast-caf-receiver` | `6.0.26` | devDependency — receiver build only (`static/receiver.html` is plain JS/HTML, but types help if the receiver logic is extracted to a `.ts` file compiled separately) | Declares `cast.framework.CastReceiverContext`, `CastReceiverOptions`, `addCustomMessageListener`, `sendCustomMessage`, and all CAF receiver namespaces. ~8 352 weekly downloads. Latest version. |

### No Additional npm Runtime Packages

The Cast SDKs are **not on npm**. There is no `chromecast-caf-sender` or `chromecast-caf-receiver` npm package — both SDKs are CDN-only by Google's design. The `@types` packages provide types against these globals, but install no runtime code.

Do not add:
- Any Cast wrapper/helper library from npm — none is maintained or necessary
- Any realtime sync backend (Supabase, Firebase, Pusher) — state syncs over the Cast session itself
- Any screen-mirroring library — this is a data-cast, not a screen-cast

---

## Sender Integration Pattern

**File:** `src/routes/match/` (existing route; Cast sender layer added here)

### Script loading

```html
<!-- In the <svelte:head> of +page.svelte, or injected by the Cast wrapper component -->
<script src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"></script>
```

The script is loaded on `/match` only — not globally in `+layout.svelte`. This keeps the Chrome-only SDK off every other route.

### Initialization callback

Must be set on `window` **before** the script executes:

```typescript
// In onMount or a dedicated cast-sender.ts module
window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
  if (isAvailable) {
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: CAST_APP_ID, // baked into build via env var
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });
  }
};
```

### Cast button

Use the built-in custom element — no extra JS required:

```html
<google-cast-launcher></google-cast-launcher>
```

Style via CSS custom properties (`--connected-color`, `--disconnected-color`). The element is defined by the SDK script itself and is a standard Web Component.

### Custom channel (sender side)

```typescript
const NAMESPACE = 'urn:x-cast:com.neverman.darts';

async function sendState(state: MatchState): Promise<void> {
  const session = cast.framework.CastContext.getInstance().getCurrentSession();
  if (session) {
    await session.sendMessage(NAMESPACE, state);
  }
}

// Listen for receiver to sender messages (e.g. hydration ACK)
session.addMessageListener(NAMESPACE, (ns: string, msg: string) => {
  const data = JSON.parse(msg);
  // handle
});
```

---

## Receiver Entry Point

### Recommendation: `static/receiver.html` (plain static file)

**Use a plain HTML file in `static/`**, not a prerendered SvelteKit route.

**Why not a SvelteKit route:**
- A SvelteKit route (even with `export const prerender = true`) pulls in the root `+layout.svelte`, which imports the `@vite-pwa/sveltekit` virtual modules (`virtual:pwa-register/svelte`, `virtual:pwa-info`). Those modules inject the service worker registration script. A Chromecast running the receiver must not register a PWA service worker — it is not a device that installs apps, and the SW would intercept the receiver's own network requests.
- The SvelteKit SPA shell JS bundle (~100-200 KB) is unnecessary overhead for a receiver that just needs to render a scoreboard from Cast messages.
- Prerendering a route under `/display` would conflict with the existing `/display` SPA route that serves the PC spectator window.

**Why `static/receiver.html` is correct:**
- Files placed in `static/` are copied verbatim to the build output (e.g. `build/receiver.html`) by `adapter-static`, with no SvelteKit processing. No shell JS, no SW registration, no layout.
- The receiver page is hosted at `https://sniqi.github.io/neverman-darts-app/receiver.html` — exactly the HTTPS URL you register in the Cast Developer Console.
- The file can inline all receiver logic (< 5 KB of JS for the Cast message handler + DOM updates) or import a small compiled TS bundle produced by a separate Vite entry point.
- The receiver does not need to work offline (Chromecast always has network access when active), so being outside the service worker precache is correct behavior.

### Minimal receiver.html structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Neverman Cast Receiver</title>
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
</head>
<body>
  <!-- scoreboard markup here; styled to match /display -->
  <script>
    const NAMESPACE = 'urn:x-cast:com.neverman.darts';
    const ctx = cast.framework.CastReceiverContext.getInstance();

    ctx.addCustomMessageListener(NAMESPACE, (event) => {
      const state = event.data; // MatchState snapshot or delta
      renderScoreboard(state);
    });

    ctx.start();

    function renderScoreboard(state) {
      // Update DOM from state — same logic as /display +page.svelte
    }
  </script>
</body>
</html>
```

### Base-path note

The receiver is served at `https://sniqi.github.io/neverman-darts-app/receiver.html`. The `BASE_PATH=/neverman-darts-app` env var affects SvelteKit route links and the PWA manifest `start_url`/`scope` — it does **not** affect files in `static/`, which are served at their literal path relative to the repo root on GitHub Pages. No base-path configuration change needed for the receiver file itself.

---

## Service Worker Configuration

Two changes required in `vite.config.ts` to keep the service worker from interfering with `receiver.html`:

```typescript
// In SvelteKitPWA({ workbox: { ... } })
workbox: {
  globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest,mp3}'],
  navigateFallback: base + '/404.html',

  // NEW: prevent receiver.html from being precached
  globIgnores: ['**/receiver.html'],

  // NEW: prevent the SW from serving the navigation fallback when the
  // Chromecast device loads receiver.html — it must always fetch fresh from network
  navigateFallbackDenylist: [/\/receiver\.html$/],
},
```

`globIgnores` keeps `receiver.html` out of the precache manifest. `navigateFallbackDenylist` prevents the service worker's navigation handler from intercepting a `fetch` of `receiver.html` and returning the cached `404.html` shell instead.

The Chromecast fetches `receiver.html` over the LAN via the router — it will always have network access when the Cast session is active. No offline concern applies to the receiver.

---

## Cast Developer Console Setup (one-time, not code)

1. Pay $5 registration fee at `cast.google.com/publish` (one-time, non-refundable).
2. Register a **Custom Web Receiver** app with URL `https://sniqi.github.io/neverman-darts-app/receiver.html`.
3. Note the assigned **App ID** (e.g. `A1B2C3D4`).
4. Register the Chromecast device's serial number under "Add New Device" — wait 15 minutes.
5. Bake the App ID into the build via an env var (`VITE_CAST_APP_ID`) referenced in the sender initialization.

The receiver stays **unpublished** (status: "Ready for Testing"). No Google Cast review process required for personal/unpublished apps.

---

## Installation

```bash
# TypeScript typings only — no runtime npm packages for Cast
npm install -D @types/chromecast-caf-sender @types/chromecast-caf-receiver
```

The SDK scripts load at runtime from `gstatic.com` — no npm install needed for them.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `static/receiver.html` (plain file) | Prerendered SvelteKit route at `/receiver` | Pulls in SPA shell bundle + vite-plugin-pwa virtual modules + SW registration — all wrong for a Cast receiver. More complex to isolate from the main app layout. |
| `static/receiver.html` (plain file) | Separate Vite sub-project for receiver | Cleaner isolation but significant build complexity (two Vite configs, two build steps, merge output). Overkill: the receiver is < 200 lines of logic. |
| Native Cast SDK (`gstatic.com`) | Any npm Cast wrapper library | No maintained Cast wrapper exists. The SDK API surface needed (one custom channel, session lifecycle) is small enough that a wrapper adds no value. |
| Custom Web Receiver (CAF v3) | Default Media Receiver | Default receiver handles only media (video/audio). Our use case is entirely custom data — no media. Custom receiver required. |
| Custom Web Receiver (CAF v3) | Styled Media Receiver | Same issue as Default — media-oriented. Cannot handle arbitrary game-state messages. |
| BroadcastChannel (existing, kept) | Replace with Cast for PC window | Cast sender is Chrome-only and requires session setup. BroadcastChannel works on all browsers with zero friction for the existing PC-window use case. Cast is additive only. |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any npm Cast SDK wrapper | None is maintained; the raw API surface is small | Call `cast.framework.*` directly with `@types/chromecast-caf-sender` for type safety |
| Firebase / Supabase / any cloud relay | No backend; sync runs over the Cast session (LAN) | `CastSession.sendMessage` / `CastReceiverContext.addCustomMessageListener` |
| `cast-media-player` element in receiver | Only needed for media playback (video/audio); scoreboard is pure DOM | Render game state directly via DOM manipulation in `renderScoreboard()` |
| Screen-mirroring / `chrome.tabCapture` | Sends pixels, not data; tablet locked to Cast tab during scoring | Data-cast over custom channel — tablet stays free for touch input |
| `@types/chromecast-caf-receiver` in the sender tsconfig | Receiver types pollute sender globals; they conflict on the `cast` namespace | Scope receiver types via `tsconfig.receiver.json` or `/// <reference types="..." />` in the receiver entry file only |
| Registering `/display` route as receiver URL | `/display` is the SvelteKit SPA shell for the PC spectator window; it loads the full app bundle and SW | Use `static/receiver.html` at a separate URL |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@types/chromecast-caf-sender@1.0.11` | TypeScript ~5.9.x, `@types/chrome` | Depends on `@types/chrome`; install that if not already present. Works with the existing `typescript@~5.9.3` pin. Do not bump to TS 6.0 until Svelte toolchain confirms compatibility. |
| `@types/chromecast-caf-receiver@6.0.26` | TypeScript ~5.9.x | Scoping caveat: receiver types expose many globals (`breaks`, `category`, etc.) that must not leak into sender or app tsconfig. Scope via `tsconfig.receiver.json` or `/// <reference types="..." />` in the receiver entry file only. |
| CAF Receiver SDK v3 | Any modern browser, Chromecast with Google TV, Chromecast (3rd gen), Chromecast Ultra | v3 is current (3.0.0151, May 2026). Do not use v2 — deprecated. |
| Cast Sender SDK v1 | Chrome / Chromium only | By design. Android tablet (Chrome), Windows PC (Chrome/Edge) — both covered. Firefox, Safari: Cast button hidden (sender API not available; `__onGCastApiAvailable` never fires). Gracefully degrade: hide the Cast button when `isAvailable === false`. |
| `static/receiver.html` | `@sveltejs/adapter-static@3.0.10` | `static/` contents are always copied to `build/` — no configuration needed. Confirmed behavior for adapter-static 3.x. |
| `workbox.globIgnores` + `navigateFallbackDenylist` | `@vite-pwa/sveltekit@1.1.0`, workbox 7.x | Both options are standard Workbox options passed through vite-plugin-pwa unchanged. Fully supported in current setup. |

---

## Sources

- Google Cast developer docs — `https://developers.google.com/cast/docs/web_sender/integrate` (verified June 2026, last updated June 11, 2026) — sender script URL, `__onGCastApiAvailable`, CastContext init, `google-cast-launcher` element — MEDIUM confidence
- Google Cast developer docs — `https://developers.google.com/cast/docs/web_receiver/basic` and `/core_features` — CAF receiver script URL, CastReceiverContext, custom message listener/send pattern, start() — MEDIUM confidence
- Google Cast SDK release notes — `https://developers.google.com/cast/docs/release-notes` — CAF v3, current version 3.0.0151 (May 2026) — MEDIUM confidence
- Google Cast developer docs — `https://developers.google.com/cast/docs/registration` — unpublished receiver registration, device serial, $5 fee, 15-minute propagation — MEDIUM confidence
- Cast Web Sender API reference — `https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastSession` — `sendMessage(namespace, data)`, `addMessageListener(namespace, fn)` signatures — MEDIUM confidence
- npm / DefinitelyTyped — `@types/chromecast-caf-sender@1.0.11`, `@types/chromecast-caf-receiver@6.0.26` — LOW confidence (libraries.io + websearch summary; versions not verified against npm registry directly)
- vite-plugin-pwa docs — `globIgnores`, `navigateFallbackDenylist` patterns — LOW confidence (community summary, cross-checked with official vite-pwa-org.netlify.app)
- SvelteKit adapter-static docs — `static/` directory copied verbatim to build output — MEDIUM confidence (`https://svelte.dev/docs/kit/adapter-static`)

---
*Stack research for: Google Cast (Chromecast) integration — v1.1*
*Researched: 2026-06-18*
