<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import ProjectCard from '$lib/components/app/projects/ProjectCard.svelte';
	import { apiService } from '$lib/services/api.service';
	import type { ProyectoSoftware } from '$lib/types/database';
	import { Globe, Code } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let { clienteId, esAdmin } = $derived(data);
	let proyectos = $state<ProyectoSoftware[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadProyectos() {
		loading = true;
		error = null;
		try {
			proyectos = await apiService.getProyectos(clienteId || undefined);
		} catch (err) {
			console.error('Error cargando proyectos:', err);
			error = err instanceof Error ? err.message : 'Error al cargar proyectos';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadProyectos();
	});
</script>

<div class="space-y-6">
	<!-- Encabezado -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
				<Globe class="w-8 h-8 text-primary" />
				Launchpad de Aplicaciones
			</h1>
			<p class="text-muted-foreground mt-1">
				Accede a tus sistemas web y aplicaciones personalizadas
			</p>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-96">
			<div class="text-center">
				<div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
				<p class="text-muted-foreground">Cargando aplicaciones...</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-destructive/10 border border-destructive rounded-xl p-6 text-center">
			<p class="text-destructive font-semibold mb-2">Error al cargar aplicaciones</p>
			<p class="text-sm text-muted-foreground mb-4">{error}</p>
			<button
				onclick={loadProyectos}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
			>
				Reintentar
			</button>
		</div>
	{:else if proyectos.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each proyectos as proyecto}
				<ProjectCard {proyecto} />
			{/each}
		</div>
	{:else}
		<div class="bg-card border border-border rounded-xl p-12 text-center">
			<Code class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-foreground mb-2">No hay aplicaciones disponibles</h2>
			<p class="text-muted-foreground">
				{esAdmin
					? 'No hay proyectos de software registrados en el sistema.'
					: 'No hay aplicaciones asignadas a tu cuenta.'}
			</p>
		</div>
	{/if}
</div>
