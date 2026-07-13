<script lang="ts">
	// src/ui/dialogs/ConfirmDialog.svelte
	// Reusable confirmation dialog (Plan 03-01, Task 2).
	// Used for: new-match warning (D-02), delete-match (D-09), import replace-all (D-12).
	// Security T-03-03: all text via Svelte {interpolation} only — no {@html}.

	import { onMount, onDestroy } from 'svelte';

	interface Props {
		heading: string;
		body: string;
		ctaLabel: string;
		ctaStyle: 'destructive' | 'accent';
		backdropDismiss?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		heading,
		body,
		ctaLabel,
		ctaStyle,
		backdropDismiss = false,
		onconfirm,
		oncancel,
	}: Props = $props();

	function handleBackdropClick() {
		if (backdropDismiss) oncancel();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && backdropDismiss) oncancel();
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="backdrop"
	role="dialog"
	aria-modal="true"
	aria-labelledby="dialog-heading"
	tabindex="-1"
	onclick={handleBackdropClick}
>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog" onclick={(e) => e.stopPropagation()}>
		<h2 id="dialog-heading" class="dialog-heading">{heading}</h2>
		<p class="dialog-body">{body}</p>
		<div class="dialog-actions">
			<button
				class="btn"
				class:btn--destructive={ctaStyle === 'destructive'}
				class:btn--accent={ctaStyle === 'accent'}
				onclick={onconfirm}
			>{ctaLabel}</button>
			<button class="btn btn--cancel" onclick={oncancel}>Abbrechen</button>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--backdrop);
		backdrop-filter: blur(var(--blur-backdrop));
		-webkit-backdrop-filter: blur(var(--blur-backdrop));
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 40;
		animation: backdropIn var(--dur-med) var(--ease);
	}

	@keyframes backdropIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.dialog {
		background: var(--surface-2);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		max-width: 420px;
		width: calc(100% - 32px);
		border: 1px solid var(--line-strong);
		box-shadow: var(--shadow-panel), var(--edge-highlight);
		animation: dialogIn var(--dur-med) var(--ease-spring);
	}

	@keyframes dialogIn {
		from { opacity: 0; transform: scale(0.94) translateY(8px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	.dialog-heading {
		font-size: var(--text-xl);
		font-weight: 600;
		line-height: 1.25;
		margin: 0 0 var(--space-md) 0;
		color: var(--text);
	}

	.dialog-body {
		font-size: var(--text-base);
		font-weight: 400;
		margin: 0 0 var(--space-lg) 0;
		color: var(--text);
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
