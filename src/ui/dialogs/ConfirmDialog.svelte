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
				class="cta-btn"
				class:cta-destructive={ctaStyle === 'destructive'}
				class:cta-accent={ctaStyle === 'accent'}
				onclick={onconfirm}
			>{ctaLabel}</button>
			<button class="cancel-btn" onclick={oncancel}>Abbrechen</button>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 40;
		animation: backdropIn 200ms ease-out;
	}

	@keyframes backdropIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.dialog {
		background: #1e2027;
		border-radius: 8px;
		padding: var(--space-lg, 24px);
		max-width: 360px;
		width: calc(100% - 32px);
		animation: dialogIn 200ms ease-out;
	}

	@keyframes dialogIn {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}

	.dialog-heading {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 var(--space-md, 16px) 0;
		color: #f0f0f0;
	}

	.dialog-body {
		font-size: 16px;
		font-weight: 400;
		margin: 0 0 var(--space-lg, 24px) 0;
		color: #f0f0f0;
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm, 8px);
	}

	.cta-btn,
	.cancel-btn {
		width: 100%;
		height: 52px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		border: none;
	}

	.cta-destructive {
		background: #c0392b;
		color: #f0f0f0;
	}

	.cta-accent {
		background: #e8a020;
		color: #111318;
	}

	.cancel-btn {
		background: #1e2027;
		color: #f0f0f0;
		border: 1px solid #444;
	}

	.cancel-btn:active {
		background: #22242d;
	}

	.cta-destructive:active {
		opacity: 0.85;
	}

	.cta-accent:active {
		opacity: 0.85;
	}
</style>
