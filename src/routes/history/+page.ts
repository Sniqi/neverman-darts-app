// src/routes/history/+page.ts
// Override layout-level prerender=true — this route uses liveQuery (dynamic).
export const prerender = false;
export const ssr = false;
