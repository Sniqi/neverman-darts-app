<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	// Skeleton: the root route redirects straight to /setup (base-path-aware).
	$effect(() => {
		goto(`${base}/setup`);
	});
</script>

<p>Weiterleitung …</p>
