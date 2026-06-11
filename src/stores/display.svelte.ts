// src/stores/display.svelte.ts
// Svelte 5 runes class store for the spectator display view.
// Hydrates from a localStorage snapshot on connect(), then subscribes to live
// updates via BroadcastChannel. Follows the MatchStore class-store pattern.
//
// Security: localStorage snapshot parsed inside try/catch; on failure state
// stays null (idle screen). BroadcastChannel is same-origin only — no
// cross-origin injection possible (T-02-01, T-02-02).

import type { MatchState } from '../engine/types.js';

// These strings MUST match the publisher constants in match.svelte.ts (Plan 02)
// and the Sync Protocol table in 02-UI-SPEC.md.
const CHANNEL_NAME = 'neverman-match';
const SNAPSHOT_KEY = 'neverman-match-snapshot';

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
		// Hydrate from snapshot — T-02-01: parse inside try/catch; fallback to null
		try {
			const raw = localStorage.getItem(SNAPSHOT_KEY);
			if (raw) {
				this.state = JSON.parse(raw) as MatchState;
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
