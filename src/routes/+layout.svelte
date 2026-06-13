<script lang="ts">
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();
	const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

{@render children()}

{#await import('../ui/pwa/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await}
