<script lang="ts">
	import SidebarAdmin from '$lib/components/app/admin/SidebarAdmin.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-background flex">
	<SidebarAdmin />
	<main class="flex-1 px-4 sm:px-6 pt-20 pb-8 lg:pl-80 lg:pr-8 lg:pt-24">
		{@render children()}
	</main>
</div>
