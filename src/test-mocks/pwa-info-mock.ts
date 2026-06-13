// src/test-mocks/pwa-info-mock.ts
// Stand-in for `virtual:pwa-info` in tests.
// +layout.svelte (added in Plan 02) imports `virtual:pwa-info` and renders
// nothing when the value is falsy — aliasing to this stub means any test that
// transitively reaches the layout resolves the module instead of failing on the
// plugin-only virtual import (checker W4 hardening).
// Named export to match the real module's `export const pwaInfo` shape, so the
// `import { pwaInfo }` in +layout.svelte resolves correctly under the test alias (WR-01).
export const pwaInfo = undefined;
