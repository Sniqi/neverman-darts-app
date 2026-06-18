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
