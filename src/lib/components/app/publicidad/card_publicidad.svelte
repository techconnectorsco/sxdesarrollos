<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';
	
	export let publicidad: any;
	
	async function handleClick() {
		// TODO: Registrar métrica de clic
		// console.log('Clic en publicidad:', publicidad.id);
	}
</script>

<a 
	href={publicidad.url_destino}
	target={publicidad.abrir_nueva_pestana ? '_blank' : '_self'}
	rel={publicidad.abrir_nueva_pestana ? 'noopener noreferrer' : ''}
	on:click={handleClick}
	class="block rounded-2xl overflow-hidden bg-white border-2 border-yellow-400 ring-2 ring-yellow-200 transition-all duration-300 group hover:shadow-2xl hover:scale-[1.02]"
>
	<div class="relative h-60 bg-gray-100 overflow-hidden">
		<img 
			src={publicidad.imagen_desktop_url} 
			alt={publicidad.titulo}
			class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
			loading="lazy"
		/>

		<!-- Badge Patrocinado (TOP RIGHT) -->
		<div class="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
			✨ PATROCINADO
		</div>

		<!-- Icono enlace externo (TOP LEFT) -->
		<div class="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
			<ExternalLink class="w-4 h-4 text-gray-700" />
		</div>

		<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
	</div>

	<div class="p-5">
		<h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
			{publicidad.titulo}
		</h3>

		{#if publicidad.subtitulo}
			<p class="text-gray-600 text-sm mb-3 line-clamp-1">
				{publicidad.subtitulo}
			</p>
		{/if}

		{#if publicidad.descripcion}
			<p class="text-gray-500 text-sm mb-4 line-clamp-2">
				{publicidad.descripcion}
			</p>
		{/if}

		<div class="flex items-center justify-between pt-4 border-t border-gray-200">
			<span class="text-base font-bold text-yellow-600">
				{publicidad.texto_boton || 'Ver más información'}
			</span>
			<div class="bg-yellow-400 p-2 rounded-lg group-hover:bg-yellow-500 transition-colors">
				<ExternalLink class="w-5 h-5 text-gray-900" />
			</div>
		</div>
	</div>
</a>