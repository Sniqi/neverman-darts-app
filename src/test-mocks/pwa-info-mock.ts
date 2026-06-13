// src/test-mocks/pwa-info-mock.ts
// Stand-in for `virtual:pwa-info` in tests.
// +layout.svelte (added in Plan 02) imports `virtual:pwa-info` and renders
// nothing when the value is falsy — aliasing to this stub means any test that
// transitively reaches the layout resolves the module instead of failing on the
// plugin-only virtual import (checker W4 hardening).
export default undefined;
