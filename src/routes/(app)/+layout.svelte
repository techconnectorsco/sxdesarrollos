<script lang="ts">
	import MainNav from '$lib/components/app/nav/main-nav.svelte';
	import Breadcrumb from '$lib/components/app/nav/breadcrumb.svelte';
	
	
	let { data, children } = $props();
</script>

<!-- Barra superior con session -->
<MainNav session={data.session} user={data.user} supabase={data.supabase} />

<!-- Contenido principal -->
<main id="content" class="pt-20">
	<Breadcrumb />
	
	<div class="space-y-5 p-2 sm:p-5 sm:py-0 md:pt-5">
		{@render children()}
	</div>
	
</main>


