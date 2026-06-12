// src/stores/display.svelte.ts
// Svelte 5 runes class store for the spectator display view.
// Hydrates from a localStorage snapshot on connect(), then subscribes to live
// updates via BroadcastChannel. Follows the MatchStore class-store pattern.
//
// Security: localStorage snapshot parsed inside try/catch; on failure state
// stays null (idle screen). BroadcastChannel is same-origin only — no
// cross-origin injection possible (T-02-01, T-02-02).

import type { MatchState } from '../engine/types.js';
import { BC_CHANNEL, LS_SNAPSHOT } from '../lib/sync-constants.js';

// Aliases for backward-compat with the names used throughout this file
const CHANNEL_NAME = BC_CHANNEL;
const SNAPSHOT_KEY = LS_SNAPSHOT;

export class DisplayStore {
	state = $state<MatchState | null>(null);
	private channel: BroadcastChannel | null = null;

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
		// WR-07: validate the parsed shape before assigning. A corrupt / partially
		// hydrated snapshot (empty players, or activePlayerIndex out of range) would
		// render a broken grid (grid-template-columns: repeat(0, 1fr)) and crash the
		// averages/standings loops. On any invalid shape, leave state null (idle screen).
		try {
			const raw = localStorage.getItem(SNAPSHOT_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as MatchState;
				if (
					parsed &&
					Array.isArray(parsed.players) &&
					parsed.players.length > 0 &&
					typeof parsed.activePlayerIndex === 'number' &&
					parsed.activePlayerIndex >= 0 &&
					parsed.activePlayerIndex < parsed.players.length
				) {
					this.state = parsed;
				}
			}
		} catch {
			// Corrupt or invalid JSON — leave state null (idle screen will show)
		}

		// Subscribe to live updates from the scoring window
		this.channel = new BroadcastChannel(CHANNEL_NAME);
		this.channel.addEventListener('message', (e: MessageEvent<MatchState>) => {
			this.state = e.data;
		});

		// Return cleanup function for $effect teardown
		return () => {
			this.channel?.close();
			this.channel = null;
		};
	}
}

export const displayStore = new DisplayStore();
