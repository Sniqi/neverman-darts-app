/// <reference types="@types/chromecast-caf-receiver" />
// src/lib/cast-receiver.ts
// Receiver-side bridge: context detection + CastReceiverBridge lifecycle.
//
// Pattern 6 (tsconfig.receiver.json): the `/// <reference>` on the FIRST line
// scopes the receiver globals (cast.framework.*) to this file only. The main
// tsconfig.json does NOT reference @types/chromecast-caf-receiver so the cast.*
// namespace is invisible to all other src/ files (D-06 / Pitfall 8).
//
// SSR-safety: no module-level window/cast access. Both exports are plain
// functions called at runtime from an `onMount` handler. (D-02 / Pitfall 8)

import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

// ── Callbacks ──────────────────────────────────────────────────────────────

export interface ReceiverCallbacks {
	/** Called with the incoming CastDisplayState snapshot, or null on disconnect (RECV-03). */
	onSnapshot: (msg: CastDisplayState | null) => void;
}

// ── isCastReceiverContext ──────────────────────────────────────────────────

/**
 * Returns true only when the CAF receiver SDK is present on window — i.e.
 * the page is running inside a Chromecast device environment (RECV-01 / D-02).
 *
 * False on normal browsers (Android tablet, PC) even after the SDK `<script>`
 * has loaded, because the SDK sets `window.cast.framework.CastReceiverContext`
 * only inside an actual Chromecast runtime.
 *
 * Safe to call when `window` is undefined (SSR / Node) — returns false.
 */
export function isCastReceiverContext(): boolean {
	return (
		typeof globalThis !== 'undefined' &&
		(globalThis as Record<string, unknown>).cast != null &&
		(globalThis as { cast?: { framework?: { CastReceiverContext?: unknown } } }).cast?.framework
			?.CastReceiverContext != null
	);
}

// ── CastReceiverBridge ─────────────────────────────────────────────────────

/**
 * Initializes the CAF Custom Web Receiver lifecycle for the `/display` route.
 *
 * Ordering (required by CAF v3):
 *   1. `addCustomMessageListener(CAST_NS, ...)` — register namespace handler FIRST
 *   2. `ctx.addEventListener(SENDER_DISCONNECTED, ...)` — RECV-03 idle-on-disconnect
 *   3. `ctx.start(options)` — LAST (after all listeners are registered)
 *
 * Options:
 *   - `disableIdleTimeout: true` — prevents the Chromecast from timing out during
 *     long match pauses or mid-session gaps (RECV-04).
 *   - `maxInactivity: 3600` — 1-hour hard cap as belt-and-suspenders safety.
 *
 * Call only when `isCastReceiverContext()` returns true.
 */
export const CastReceiverBridge = {
	init(callbacks: ReceiverCallbacks): void {
		if (!isCastReceiverContext()) return;

		const ctx = cast.framework.CastReceiverContext.getInstance();

		// Step 1: Register custom-message listener BEFORE start() (CAF v3 ordering)
		ctx.addCustomMessageListener(CAST_NS, (event) => {
			const data = event.data as { type?: string } & CastDisplayState;
			if (data?.type === 'snapshot') {
				// Strip the 'type' discriminant, pass the rest as the snapshot payload
				const { type: _type, ...snapshot } = data;
				callbacks.onSnapshot(snapshot as CastDisplayState);
			}
		});

		// Step 2: Register SENDER_DISCONNECTED system event → return receiver to idle (RECV-03)
		ctx.addEventListener(
			cast.framework.system.EventType.SENDER_DISCONNECTED,
			() => {
				callbacks.onSnapshot(null);
			},
		);

		// Step 3: Start the receiver context LAST (CAF v3 mandatory ordering, RECV-04)
		// Plain object literal is valid — CastReceiverOptions is a data bag, not a class requirement.
		ctx.start({ disableIdleTimeout: true, maxInactivity: 3600 });
	},
};
