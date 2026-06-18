// src/test-mocks/cast-receiver-mock.ts
// Mockable receiver context for browser-mode tests.
//
// Module-level design mirrors pwa-register-mock.ts: a module-scoped flag lets
// individual tests set the receiver context before importing cast-receiver.ts,
// without needing vi.mock() or ESM namespace rewriting (neither is reliable in
// Vitest browser mode).
//
// Usage in tests:
//   import { setMockReceiverContext } from '../test-mocks/cast-receiver-mock.ts';
//   setMockReceiverContext(true);  // simulate Cast receiver environment
//   setMockReceiverContext(false); // simulate normal browser environment
//
// The CastReceiverBridge no-op class prevents browser-mode receiver tests from
// ever calling context.start() on the real Cast SDK (which would throw outside
// a Cast device environment).

let _mockReceiverContext = false;

/** Set whether the mock should report a Cast receiver context.
 *  Call before each test that needs to exercise receiver-specific code paths. */
export function setMockReceiverContext(value: boolean): void {
	_mockReceiverContext = value;
}

/** Returns true when the mock receiver context flag is set.
 *  cast-receiver.ts imports this (via vite.config.ts test alias, wired by Plan 04)
 *  instead of the real Cast SDK environment check. */
export function isCastReceiverContext(): boolean {
	return _mockReceiverContext;
}

/** No-op CastReceiverBridge for browser-mode tests.
 *  The real bridge (created in Plan 04) calls context.start() on init;
 *  this stub lets tests import cast-receiver.ts without triggering SDK calls. */
export class CastReceiverBridge {
	static init(): void {
		// no-op in test environment — prevents context.start() outside Cast device
	}
}
