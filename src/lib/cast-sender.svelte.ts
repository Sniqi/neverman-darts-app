// src/lib/cast-sender.svelte.ts
// CastSenderManager — browser-side Cast session state machine.
//
// Owns: CAST-02 (connection-state reflection), CAST-04 (graceful degradation on
// non-Chrome), CAST-05 (auto-rejoin via ORIGIN_SCOPED), CAST-06 (resume-toast
// flag), SETUP-02 (App ID via init(appId), never hard-coded).
//
// Class + singleton pattern mirrors src/stores/match.svelte.ts.
// sendSnapshot is fire-and-forget (non-fatal) — match play must never be
// interrupted by Cast errors.
//
// IMPORTANT: all window/document access is deferred to init() so the singleton
// construction is safe at module-load time (SSR-safe, unit-test-safe).

import { CAST_NS } from './sync-constants.js';
import type { CastDisplayState } from './cast-types.js';

/** URL of the Cast Sender SDK script. ?loadCastFramework=1 is REQUIRED (Pitfall 3). */
const CAST_SDK_URL =
	'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

export class CastSenderManager {
	/** The active Cast session, or null when not connected. Reactive (CAST-02). */
	activeSession = $state<cast.framework.CastSession | null>(null);

	/** True when the Cast SDK reports availability (false on non-Chrome — CAST-04). */
	#castAvailable = $state(false);

	/**
	 * One-shot resume signal (CAST-06).
	 * Set to the device friendlyName on SESSION_RESUMED; cleared by consumeResumeSignal().
	 * Null when no pending resume toast.
	 */
	resumeDeviceName = $state<string | null>(null);

	/** Expose #castAvailable as a read-only getter (drives {#if castAvailable} in UI). */
	get castAvailable(): boolean {
		return this.#castAvailable;
	}

	/**
	 * Initialise the Cast sender.
	 *
	 * CRITICAL ORDER (Pitfall 2 — load-order safety):
	 *   1. Assign window.__onGCastApiAvailable FIRST.
	 *   2. Then inject the SDK <script> tag.
	 * If the script is injected first the SDK may invoke __onGCastApiAvailable
	 * synchronously before our handler is assigned, silently losing the callback.
	 *
	 * @param appId - The Cast Application ID from VITE_CAST_APP_ID (SETUP-02).
	 *   Never hard-coded — always passed in by the caller.
	 */
	init(appId: string): void {
		// Step 1: assign the callback BEFORE injecting the script (Pitfall 2).
		(window as Window & { __onGCastApiAvailable?: (available: boolean) => void }).__onGCastApiAvailable =
			(isAvailable: boolean) => {
				this.#castAvailable = isAvailable;
				if (isAvailable) {
					this.#initCastContext(appId);
				}
				// CAST-04: if isAvailable=false (non-Chrome), #castAvailable stays false
				// and the Cast row remains hidden via {#if castAvailable} (D-13).
			};

		// Step 2: inject the SDK script (Pitfall 3: ?loadCastFramework=1 is required).
		const script = document.createElement('script');
		script.src = CAST_SDK_URL;
		document.head.appendChild(script);
	}

	/**
	 * Called by __onGCastApiAvailable(true) to configure the Cast context and
	 * register the session state listener.
	 */
	#initCastContext(appId: string): void {
		const ctx = cast.framework.CastContext.getInstance();

		// CAST-05, SETUP-02: App ID from caller; ORIGIN_SCOPED for auto-rejoin.
		ctx.setOptions({
			receiverApplicationId: appId,
			autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
		});

		// CAST-02: track session state changes.
		ctx.addEventListener(
			cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
			(event: cast.framework.SessionStateEventData) => {
				this.#handleSessionState(event, ctx);
			},
		);
	}

	/**
	 * Handle SESSION_STATE_CHANGED events.
	 * SESSION_STARTED | SESSION_RESUMED → set activeSession from context.
	 * SESSION_RESUMED                   → raise one-shot resume signal (CAST-06).
	 * SESSION_ENDED                     → clear activeSession.
	 */
	#handleSessionState(
		event: cast.framework.SessionStateEventData,
		ctx: cast.framework.CastContext,
	): void {
		const { SessionState } = cast.framework;

		if (
			event.sessionState === SessionState.SESSION_STARTED ||
			event.sessionState === SessionState.SESSION_RESUMED
		) {
			// WR-03: cache the session once — a second getCurrentSession() call may return
			// null if the SDK fires SESSION_ENDED between the two calls (CAF v3 edge case),
			// which would set resumeDeviceName=null while activeSession is correctly set.
			const session = ctx.getCurrentSession();
			this.activeSession = session;

			if (event.sessionState === SessionState.SESSION_RESUMED) {
				// CAST-06: raise one-shot resume signal carrying device name for toast body
				// "Überträgt weiter auf: <Gerät>".
				this.resumeDeviceName = session?.getCastDevice().friendlyName ?? null;
			}
		} else if (event.sessionState === SessionState.SESSION_ENDED) {
			this.activeSession = null;
		}
	}

	/**
	 * Consume the one-shot resume signal (CAST-06).
	 * Returns the device friendlyName if a SESSION_RESUMED event raised it since
	 * the last call, then resets to null so the toast fires exactly once per resume.
	 */
	consumeResumeSignal(): string | null {
		const name = this.resumeDeviceName;
		this.resumeDeviceName = null;
		return name;
	}

	/**
	 * Send a trimmed match-state snapshot to the Chromecast receiver.
	 *
	 * Fire-and-forget: errors are swallowed so match play is never interrupted
	 * (SYNC-04 additive/non-fatal contract). If activeSession is null this is
	 * a no-op (CAST-04 — non-Chrome path).
	 *
	 * @param payload - The trimmed CastDisplayState produced by toDisplayState().
	 */
	sendSnapshot(payload: CastDisplayState): void {
		if (!this.activeSession) return;
		try {
			this.activeSession.sendMessage(CAST_NS, payload);
		} catch {
			// Non-fatal — match play continues uninterrupted
		}
	}
}

/** Singleton — mirrors matchStore / displayStore pattern. */
export const castSenderManager = new CastSenderManager();
