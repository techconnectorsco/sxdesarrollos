<script lang="ts">
	import type { PageData } from './$types';
	import ProjectCard from '$lib/components/app/projects/ProjectCard.svelte';
	import { Globe, Code } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let { proyectos = [], esAdmin } = $derived(data);
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

	{#if proyectos.length > 0}
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
