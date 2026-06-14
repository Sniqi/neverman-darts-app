<script lang="ts">
	// src/ui/display/LegWinBanner.svelte
	// Full-screen leg/set win banner overlay for the spectator display.
	// Prop-driven — pure presentation component; parent manages legWinMessage state.
	// Player name rendered via Svelte {interpolation} only (T-03-04: no {@html}).
	// Appears when message is non-null; dismissed by parent clearing message to null
	// when currentVisit.length > 0 (first dart of next leg — event-driven D-09).

	interface Props {
		message: string | null;
		subtitle?: string | null;
		/** D-08: record text folded into the banner when a record coincides with a leg win. */
		recordBadge?: string | null;
	}

	let { message, subtitle = null, recordBadge = null }: Props = $props();
</script>

{#if message !== null}
	<div class="leg-win-banner" role="status" aria-live="assertive">
		<div class="banner-content">
			<p class="banner-message">
				<span class="banner-name">{message}</span>
			</p>
			{#if subtitle}
				<p class="banner-subtitle">{subtitle}</p>
			{/if}
			{#if recordBadge}
				<p class="record-badge">{recordBadge}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.leg-win-banner {
		position: fixed;
		inset: 0;
		z-index: 10;
		background: rgba(17, 19, 24, 0.88);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: bannerFadeIn 250ms ease-out;
	}

	@keyframes bannerFadeIn {
		from { opacity: 0; transform: scale(0.95); }
		to   { opacity: 1; transform: scale(1); }
	}

	.banner-content {
		text-align: center;
		padding: var(--space-xl, 32px);
	}

	.banner-message {
		margin: 0;
		font-size: clamp(2.5rem, 6vw, 8rem);
		font-weight: 600;
		line-height: 1.1;
	}

	/* The whole message renders in accent color for maximum legibility from 3m */
	.banner-name {
		color: #e8a020;
	}

	.banner-subtitle {
		margin: var(--space-lg, 24px) 0 0;
		font-size: clamp(2rem, 4vw, 5rem);
		font-weight: 400;
		color: var(--text, #f0f0f0);
	}

	.record-badge {
		margin: var(--space-sm, 8px) 0 0;
		font-size: clamp(1.5rem, 3vw, 3.5rem);
		font-weight: 400;
		color: #e8a020;
	}
</style>
