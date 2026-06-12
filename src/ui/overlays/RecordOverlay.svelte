<script lang="ts">
	// src/ui/overlays/RecordOverlay.svelte
	// Transient auto-dismiss celebration overlay for personal records and 180s.
	// Prop-driven — pure presentation component; parent manages records state.
	// Multiple records in one moment combine into a single card (D-07).
	// Auto-dismisses after autoDismissMs via ondismiss callback (parent clears records).
	// Rendered only when records.length > 0.
	// Player names / record strings rendered via {interpolation} only (T-04-13: no {@html}).
	// z-index 50: above win banners (z-10/z-20), below MatchWinOverlay (z-100) per UI-SPEC.

	interface Props {
		records: string[];
		autoDismissMs?: number;
		ondismiss?: () => void;
	}

	let { records, autoDismissMs = 2500, ondismiss = () => {} }: Props = $props();

	// Auto-dismiss: when records become non-empty, schedule ondismiss after autoDismissMs.
	// clearTimeout on teardown prevents stale callbacks when records change quickly.
	$effect(() => {
		if (records.length === 0) return;
		const timer = setTimeout(() => {
			ondismiss();
		}, autoDismissMs);
		return () => clearTimeout(timer);
	});
</script>

{#if records.length > 0}
	<div class="record-overlay" role="status" aria-live="assertive">
		<div class="record-content">
			<p class="record-headline">{records.join(' · ')}</p>
		</div>
	</div>
{/if}

<style>
	.record-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
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

	.record-content {
		text-align: center;
		padding: var(--space-xl, 32px);
	}

	.record-headline {
		margin: 0;
		font-size: clamp(2.5rem, 6vw, 8rem);
		font-weight: 600;
		color: #e8a020;
		line-height: 1.1;
		text-align: center;
	}
</style>
