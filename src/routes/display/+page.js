// src/routes/display/+page.js
// Per-route prerender override for the Chromecast receiver entry point (D-04).
//
// Why this file exists:
//   adapter-static emits a prerendered build/display/index.html ONLY when both
//   prerender and ssr are true for this route. Without this file the SPA layout's
//   prerender=true generates a single 404.html shell that the Chromecast receiver
//   SDK cannot use — the SDK fetches the URL directly via HTTP and requires a real
//   HTML document at that path (not a navigation-fallback SPA redirect).
//
// Inverse of src/routes/history/+page.ts which opts out of prerender (dynamic).
// The existing +page.svelte keeps all window/DOM/BroadcastChannel access inside
// $effect / onMount, so ssr=true is safe (Pitfall 8 — no module-top-level DOM access).

export const prerender = true;
export const ssr = true;
// trailingSlash='always' makes adapter-static emit build/display/index.html
// (a directory index) rather than build/display.html (a flat file).
// The Chromecast Cast SDK loads the receiver URL as-registered; GitHub Pages
// serves directory indexes correctly when the URL ends with /display/.
// Without this, adapter-static defaults to 'never' and produces display.html,
// which causes the navigateFallbackDenylist regex to miss the /display/ form.
export const trailingSlash = 'always';
