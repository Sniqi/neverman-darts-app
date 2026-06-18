<script lang="ts">
	// src/ui/display/SpectatorChooser.svelte
	// Monitor/cast icon in the scoring view toolbar that opens a chooser menu.
	// D-12: monitor icon always reachable mid-match.
	// D-13: chooser with two options — PC second window (DISP-01) and tablet fullscreen (DISP-02).
	//        Cast row added as third option, gated on castSenderManager.castAvailable (CAST-04).
	// T-02-06: win.opener is nulled manually after open (no reverse tabnabbing).
	// T-02-07: popup-blocked null-check; no crash on denied fullscreen.
	// T-02-04: player names / copy rendered via {interpolation} only — no {@html}.
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { castSenderManager } from '../../lib/cast-sender.svelte.js';

	function requestCastSession() {
		try {
			cast.framework.CastContext.getInstance().requestSession();
		} catch {
			// Cast SDK not yet loaded or unavailable — no-op
		}
	}

	let open = $state(false);
	let popupBlocked = $state(false);

	function toggle() {
		open = !open;
		if (!open) popupBlocked = false;
	}

	function close() {
		open = false;
		popupBlocked = false;
	}

	function openSecondWindow() {
		const win = window.open(`${base}/display`, '_blank');
		if (win) {
			win.opener = null;
			close();
		} else {
			popupBlocked = true;
		}
	}

	function goToDisplayFullscreen() {
		close();
		goto(`${base}/display?fullscreen=1`);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}

	function handleOutsideClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		const menu = document.querySelector('.chooser-menu');
		const iconBtn = document.querySelector('.chooser-icon-btn');
		if (menu && !menu.contains(target) && iconBtn && !iconBtn.contains(target)) {
			close();
		}
	}

	$effect(() => {
		if (open) {
			document.addEventListener('keydown', handleKeydown);
			document.addEventListener('pointerdown', handleOutsideClick);
			return () => {
				document.removeEventListener('keydown', handleKeydown);
				document.removeEventListener('pointerdown', handleOutsideClick);
			};
		}
	});
</script>

<!-- Monitor icon button — 44×44px touch target -->
<button
	class="chooser-icon-btn"
	aria-label="Anzeigemodus öffnen"
	aria-expanded={open}
	onclick={toggle}
>
	<!-- Inline SVG monitor/cast icon, accent stroke per UI-SPEC -->
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="#e8a020"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<!-- Monitor outline -->
		<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
		<!-- Stand stem -->
		<line x1="8" y1="21" x2="16" y2="21" />
		<line x1="12" y1="17" x2="12" y2="21" />
	</svg>
</button>

{#if open}
	<!-- Bottom-sheet chooser menu -->
	<div class="chooser-menu" role="dialog" aria-label="Anzeigemodus">
		<h2 class="chooser-heading">Anzeigemodus</h2>

		<button class="chooser-action-btn" onclick={openSecondWindow}>
			<!-- PC second window icon -->
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
				class="action-icon"
			>
				<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
				<line x1="8" y1="21" x2="16" y2="21" />
				<line x1="12" y1="17" x2="12" y2="21" />
			</svg>
			Zweites Fenster öffnen
		</button>

		{#if popupBlocked}
			<p class="popup-blocked-msg">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					class="warn-icon"
				>
					<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				Bitte Popups für diese Seite erlauben
			</p>
		{/if}

		<button class="chooser-action-btn" onclick={goToDisplayFullscreen}>
			<!-- Fullscreen icon -->
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
				class="action-icon"
			>
				<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
			</svg>
			Anzeige hier im Vollbild
		</button>

		{#if castSenderManager.castAvailable}
			<!-- Cast row (CAST-01/CAST-02/CAST-03/CAST-04 — D-12/D-13) -->
			<!-- google-cast-launcher is a custom element registered by the Cast SDK at runtime. -->
			<!-- Hidden visually; row click calls requestSession() directly (UI-SPEC §1). -->
			<!-- svelte-ignore unknown_element -->
			<google-cast-launcher style="display:none" aria-hidden="true"></google-cast-launcher>
			<button class="chooser-action-btn" onclick={requestCastSession}>
				<!-- Cast icon: screen with wifi waves (Chromecast shape) -->
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					class="action-icon"
				>
					<!-- Screen outline -->
					<rect x="2" y="4" width="20" height="14" rx="2" />
					<!-- Wifi waves from bottom-left corner (cast shape) -->
					<path d="M2 18v2" />
					<path d="M2 15a5 5 0 0 1 5 5" />
					<path d="M2 11a9 9 0 0 1 9 9" />
				</svg>
				Auf Chromecast übertragen
			</button>

			{#if castSenderManager.activeSession !== null}
				<!-- "Überträgt auf: <Gerät>" connected status line (CAST-02/CAST-03) -->
				<p class="cast-connected-line">
					<span class="cast-dot">●</span>
					<span class="cast-label">Überträgt auf:</span>
					<span class="cast-device">{castSenderManager.activeSession.getCastDevice().friendlyName}</span>
				</p>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.chooser-icon-btn {
		position: fixed;
		bottom: 16px;
		right: 16px;
		z-index: 40;
		width: 44px;
		height: 44px;
		background: rgba(30, 32, 39, 0.9);
		border: 1px solid #444;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.chooser-icon-btn:active {
		background: rgba(232, 160, 32, 0.15);
	}

	.chooser-menu {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #1e2027;
		border-top: 1px solid #333;
		border-radius: 12px 12px 0 0;
		padding: var(--space-lg, 24px);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
		z-index: 50;
		animation: slideUp 200ms ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	/* Landscape: compact popover anchored above the fixed button */
	@media (orientation: landscape) {
		.chooser-menu {
			bottom: 68px; /* 16px margin + 44px button + 8px gap */
			left: auto;
			right: 16px;
			width: 280px;
			border-top: none;
			border: 1px solid #444;
			border-radius: 8px;
			animation: fadeIn 200ms ease-out;
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}

	.chooser-heading {
		font-size: 20px;
		font-weight: 600;
		color: #f0f0f0;
		margin: 0 0 var(--space-sm, 8px) 0;
	}

	.chooser-action-btn {
		display: flex;
		align-items: center;
		gap: var(--space-sm, 8px);
		width: 100%;
		min-height: 48px;
		padding: 0 var(--space-md, 16px);
		background: #111318;
		border: 1px solid #333;
		border-radius: 6px;
		color: #f0f0f0;
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		text-align: left;
	}

	.chooser-action-btn:active {
		background: #22242d;
	}

	.action-icon {
		flex-shrink: 0;
		opacity: 0.7;
	}

	.popup-blocked-msg {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: #f0f0f0;
		margin: 0;
		padding: var(--space-xs, 4px) var(--space-md, 16px);
	}

	.warn-icon {
		flex-shrink: 0;
		color: #e8a020;
	}

	/* Cast connected status line — shown below the Cast row when a session is active */
	.cast-connected-line {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 14px;
		font-weight: 400;
		line-height: 1.4;
		margin: 0;
		padding: 4px 16px;
	}

	.cast-dot {
		font-size: 10px;
		color: var(--accent, #e8a020);
		flex-shrink: 0;
	}

	.cast-label {
		color: rgba(240, 240, 240, 0.6);
	}

	.cast-device {
		color: var(--accent, #e8a020);
	}
</style>
