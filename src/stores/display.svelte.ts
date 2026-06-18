// src/stores/display.svelte.ts
// Svelte 5 runes class store for the spectator display view.
// Hydrates from a localStorage snapshot on connect(), then subscribes to live
// updates via BroadcastChannel. Follows the MatchStore class-store pattern.
//
// Security: localStorage snapshot parsed inside try/catch; on failure state
// stays null (idle screen). BroadcastChannel is same-origin only — no
// cross-origin injection possible (T-02-01, T-02-02).

import type { MatchState } from '../engine/types.js';
import { BC_CHANNEL, LS_SNAPSHOT, MSG_PAUSE_TICK } from '../lib/sync-constants.js';
import { isValidCastState } from '../lib/cast-types.js';
import type { CastDisplayState } from '../lib/cast-types.js';

// Aliases for backward-compat with the names used throughout this file
const CHANNEL_NAME = BC_CHANNEL;
const SNAPSHOT_KEY = LS_SNAPSHOT;

/**
 * Validates the shape of an incoming MatchState before it reaches the render loops
 * (WR-07 / WR-04). A corrupt or partially-hydrated snapshot (empty players, or
 * activePlayerIndex out of range) would render a broken grid
 * (grid-template-columns: repeat(0, 1fr)) and crash the averages/standings loops.
 * Both ingress paths — localStorage hydration AND the live BroadcastChannel handler —
 * must apply this identical guard so they cannot diverge.
 */
function isValidMatchState(parsed: unknown): parsed is MatchState {
	const p = parsed as MatchState | null;
	return (
		!!p &&
		Array.isArray(p.players) &&
		p.players.length > 0 &&
		typeof p.activePlayerIndex === 'number' &&
		p.activePlayerIndex >= 0 &&
		p.activePlayerIndex < p.players.length
	);
}

export class DisplayStore {
	state = $state<MatchState | null>(null);
	private channel: BroadcastChannel | null = null;

	/** True when the pause countdown overlay should be shown on /display. */
	pauseActive = $state(false);
	/** Remaining seconds on the countdown as broadcast by the scoring window. */
	pauseRemainingSeconds = $state(0);

	/**
	 * Hydrates state from the localStorage snapshot (cold-start / reload path),
	 * then subscribes to live BroadcastChannel updates from the scoring window.
	 *
	 * Returns a cleanup function suitable for use in a Svelte $effect teardown:
	 *   $effect(() => displayStore.connect())
	 *
	 * The cleanup function closes the channel. After cleanup, further channel
	 * messages will not update state.
	 */
	connect(): () => void {
		// Hydrate from snapshot — T-02-01: parse inside try/catch; fallback to null.
		// WR-07: validate the parsed shape before assigning (see isValidMatchState).
		// On any invalid shape, leave state null (idle screen).
		try {
			const raw = localStorage.getItem(SNAPSHOT_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (isValidMatchState(parsed)) {
					this.state = parsed;
				}
			}
		} catch {
			// Corrupt or invalid JSON — leave state null (idle screen will show)
		}

		// Subscribe to live updates from the scoring window. WR-04: apply the SAME
		// shape guard as the hydration path — a malformed or partial MatchState posted
		// on the channel (future protocol change / stray same-origin sender) must not
		// reach the render loops the WR-07 guard protects.
		this.channel = new BroadcastChannel(CHANNEL_NAME);
		this.channel.addEventListener('message', (e: MessageEvent<unknown>) => {
			// FLOW-02: route pause-tick messages before the match-state guard so they
			// are never passed to isValidMatchState (RESEARCH Pitfall 3, T-05-07).
			// Same cast style as display/+page.svelte record-event handling.
			const data = e.data as { type?: string; pauseActive?: boolean; pauseRemainingSeconds?: number };
			if (data?.type === MSG_PAUSE_TICK) {
				this.pauseActive = data.pauseActive ?? false;
				this.pauseRemainingSeconds = data.pauseRemainingSeconds ?? 0;
				return;
			}
			if (isValidMatchState(e.data)) {
				this.state = e.data;
			}
		});

		// Return cleanup function for $effect teardown
		return () => {
			this.channel?.close();
			this.channel = null;
		};
	}

	/**
	 * Receiver ingress: apply a Cast snapshot to display state (SYNC-01, SYNC-03).
	 *
	 * - null → return to idle screen and clear pause (RECV-03: sender disconnected).
	 * - invalid payload → silently ignored (T-07-IV: malicious/malformed same-LAN sender).
	 * - valid CastDisplayState → update state + pause fields.
	 *
	 * This is a NEW additive ingress alongside connect(). The existing BroadcastChannel
	 * handler in connect() is NOT modified (SYNC-04 guard).
	 */
	receiveSnapshot(msg: CastDisplayState | null): void {
		if (msg === null) {
			// RECV-03: sender disconnected — return to idle screen
			this.state = null;
			this.pauseActive = false;
			this.pauseRemainingSeconds = 0;
			return;
		}
		// T-07-IV: validate before applying (same discipline as isValidMatchState in connect())
		if (!isValidCastState(msg)) return;

		// SYNC-01: pad fields that MatchState requires but CastDisplayState omits (CR-01).
		// CastDisplayState intentionally omits isGuest, legCompleted, legStarterIndex, and
		// eventLog — these are not transmitted over the wire (D-05/D-07 payload trim).
		// Safe defaults ensure any /display component reading those fields gets a defined value.
		const state: MatchState = {
			...msg,
			players: msg.players.map(p => ({
				...p,
				isGuest: false,    // Cast receiver has no guest concept
				legCompleted: [],  // Not transmitted; safe default
			})),
			legStarterIndex: 0, // Not transmitted; safe default
			eventLog: [],       // Not transmitted; safe default
		};
		this.state = state;
		// SYNC-03: drive the receiver's local pause countdown from the snapshot
		this.pauseActive = msg.pauseActive;
		this.pauseRemainingSeconds = msg.pauseRemainingSeconds;
	}
}

export const displayStore = new DisplayStore();
