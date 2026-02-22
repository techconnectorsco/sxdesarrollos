<script lang="ts">
	import { House, Key, Gavel, Briefcase, ChevronRight } from 'lucide-svelte';
	
	let { categoria } = $props();
	
	// Mapear categoría a imagen y datos
	const categoriaData: Record<string, any> = {
		'venta': {
			titulo: 'Propiedades en Venta',
			descripcion: 'Explora casas, lotes y apartamentos en todo Costa Rica',
			link: '/propiedades-venta',
			imagen: '/venta.jpg',
			icon: 'house',
			cta: 'Ver Propiedades'
		},
		'alquiler': {
			titulo: 'Propiedades en Alquiler',
			descripcion: 'Encuentra tu hogar ideal para alquilar',
			link: '/alquileres',
			imagen: '/alquiler.jpg',
			icon: 'key',
			cta: 'Ver Alquileres'
		},
		'remate': {
			titulo: 'Remates Judiciales',
			descripcion: 'Oportunidades únicas con precios base especiales',
			link: '/remates',
			imagen: '/remate.jpg',
			icon: 'gavel',
			cta: 'Ver Remates'
		},
		'proyecto': {
			titulo: 'Proyectos Inmobiliarios',
			descripcion: 'Desarrollos nuevos y pre-ventas exclusivas',
			link: '/proyectos',
			imagen: '/proyecto.jpg',
			icon: 'briefcase',
			cta: 'Ver Proyectos'
		}
	};
	
	const data = categoriaData[categoria] || categoriaData['venta'];
</script>

<a 
	href={data.link}
	class="block rounded-2xl overflow-hidden bg-white border-2 border-blue-400 ring-2 ring-blue-200 transition-all duration-300 group hover:shadow-2xl hover:scale-[1.02]"
>
	<div class="relative h-60 bg-gray-100 overflow-hidden">
		<img 
			src={data.imagen} 
			alt={data.titulo}
			class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
			loading="lazy"
		/>

		<!-- Badge SITO (TOP RIGHT) -->
		<div class="absolute top-3 right-3 z-10 ">
			<img 
				src="/LogoSITOnuevofooterrecortado.png" 
				alt="SITO"
				class="w-7 h-7 object-contain"
			/>
		</div>

		<!-- Icono de categoría (TOP LEFT) -->
		<div class="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
			{#if data.icon === 'house'}
				<House class="w-4 h-4 text-blue-600" />
			{:else if data.icon === 'key'}
				<Key class="w-4 h-4 text-blue-600" />
			{:else if data.icon === 'gavel'}
				<Gavel class="w-4 h-4 text-blue-600" />
			{:else if data.icon === 'briefcase'}
				<Briefcase class="w-4 h-4 text-blue-600" />
			{/if}
		</div>

		<div class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
	</div>

	<div class="p-5">
		<h3 class="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
			{data.titulo}
		</h3>

		<p class="text-gray-500 text-sm mb-4">
			{data.descripcion}
		</p>

		<div class="flex items-center justify-between pt-4 border-t border-gray-200">
			<span class="text-base font-bold text-blue-600">
				{data.cta}
			</span>
			<div class="bg-blue-500 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
				<ChevronRight class="w-5 h-5 text-white" />
			</div>
		</div>

		<!-- Footer con logo pequeño -->
		<div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center">
			<img 
				src="/LogoSITOnuevorecortado.png" 
				alt="SITO"
				class="h-8 opacity-40 group-hover:opacity-60 transition-opacity"
			/>
		</div>
	</div>
</a>