<script lang="ts">
	import { onMount } from 'svelte';
	import CardPropiedad from '$lib/components/app/propiedades/card_propiedad.svelte';
	import FiltrosPropiedades from '$lib/components/app/filtros/filtros_propiedades.svelte';

	// 🔹 Props Svelte5
	let { propiedades, tipoOperacion = 'todas', titulo = 'Propiedades', descripcion = 'Encuentra tu propiedad ideal' } = $props<{
		propiedades: any[],
		tipoOperacion?: 'venta' | 'alquiler' | 'remate' | 'todas',
		titulo?: string,
		descripcion?: string
	}>();

	// ------------------------------
	// FILTROS
	// ------------------------------
	let provincia = $state('');
	let canton = $state('');
	let distrito = $state('');
	let precioMin = $state(0);
	let precioMax = $state(0);
	let moneda = $state('TODAS');
	let ordenarPor = $state('fecha_desc');

	// ------------------------------
	// SCROLL INFINITO
	// ------------------------------
	let propiedadesFiltradas = $state<any[]>([]);
	let propiedadesMostradas = $state<any[]>([]);
	let cargando = $state(false);
	let paginaActual = $state(0);
	const propiedadesPorPagina = 12;

	// ------------------------------
	// Anuncios patrocinados
	// ------------------------------
	const anunciosPatrocinados = [
		{
			id: 'patrocinado-001',
			titulo: 'Villa Premium en Escazú - Inversión Exclusiva',
			precio: 865000,
			moneda: 'USD',
			tipo_operacion: 'venta',
			ubicacion: 'Escazú',
			provincia: 'San José',
			canton: 'Escazú',
			distrito: 'Escazú',
			habitaciones: 5,
			banos: 4,
			area: 450,
			imagen: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
			esPatrocinada: true,
			enlaceExterno: '/proyectos/villa-premium-escazu'
		},
		{
			id: 'patrocinado-002',
			titulo: 'Proyecto Santa Ana Towers - Preventa Especial',
			precio: 345000,
			moneda: 'USD',
			tipo_operacion: 'venta',
			ubicacion: 'Santa Ana',
			provincia: 'San José',
			canton: 'Santa Ana',
			distrito: 'Santa Ana',
			habitaciones: 3,
			banos: 2,
			area: 180,
			imagen: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
			esPatrocinada: true,
			enlaceExterno: '/proyectos/santa-ana-towers'
		}
	];

	// ------------------------------
	// FILTROS REACTIVOS
	// ------------------------------
	$effect(() => {
		propiedadesFiltradas = propiedades.filter((p: any) => {
			if (tipoOperacion !== 'todas' && p.tipo_operacion !== tipoOperacion) return false;
			if (moneda !== 'TODAS' && p.moneda !== moneda) return false;
			if (provincia && p.provincia !== provincia) return false;
			if (canton && p.canton !== canton) return false;
			if (distrito && p.distrito !== distrito) return false;
			if (precioMin > 0 && p.precio < precioMin) return false;
			if (precioMax > 0 && p.precio > precioMax) return false;
			return true;
		});

		propiedadesFiltradas.sort((a: any, b: any) => {
			switch (ordenarPor) {
				case 'precio_desc': return b.precio - a.precio;
				case 'precio_asc': return a.precio - b.precio;
				case 'area_desc': return (b.area || 0) - (a.area || 0);
				case 'area_asc': return (a.area || 0) - (b.area || 0);
				default: return 0;
			}
		});

		propiedadesMostradas = [];
		paginaActual = 0;
		cargarMasPropiedades();
	});

	// ------------------------------
	// SCROLL INFINITO
	// ------------------------------
	function cargarMasPropiedades() {
		if (cargando) return;
		cargando = true;

		setTimeout(() => {
			const inicio = paginaActual * propiedadesPorPagina;
			const fin = inicio + propiedadesPorPagina;
			const nuevas = propiedadesFiltradas.slice(inicio, fin);
			propiedadesMostradas = [...propiedadesMostradas, ...nuevas];
			paginaActual++;
			cargando = false;
		}, 200);
	}

	function manejarScroll() {
		const scrollTop = window.scrollY;
		const windowHeight = window.innerHeight;
		const docHeight = document.documentElement.scrollHeight;
		if (scrollTop + windowHeight >= docHeight - 200 && !cargando) {
			if (propiedadesMostradas.length < propiedadesFiltradas.length) {
				cargarMasPropiedades();
			}
		}
	}

	onMount(() => {
		window.addEventListener('scroll', manejarScroll);
		return () => window.removeEventListener('scroll', manejarScroll);
	});

	// Intercalar anuncios
	const propiedadesConAnuncios = $derived((() => {
		const resultado = [];
		let iA = 0;
		for (let i = 0; i < propiedadesMostradas.length; i++) {
			resultado.push(propiedadesMostradas[i]);
			if ((i + 1) % 6 === 0 && iA < anunciosPatrocinados.length) {
				resultado.push(anunciosPatrocinados[iA]);
				iA++;
			}
		}
		return resultado;
	})());
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b-2 border-blue-500 shadow-md">
		<div class="container mx-auto px-4 py-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">{titulo}</h1>
			<p class="text-gray-600 text-lg">
				{propiedadesFiltradas.length} {propiedadesFiltradas.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
				{#if moneda === 'USD'}
					<span class="text-sm text-gray-500">(en dólares)</span>
				{:else if moneda === 'CRC'}
					<span class="text-sm text-gray-500">(en colones)</span>
				{:else}
					<span class="text-sm text-gray-500">(todas las monedas)</span>
				{/if}
			</p>
			<p class="text-gray-500">{descripcion}</p>
		</div>
	</div>

	<div class="container mx-auto px-4 py-8">
		<FiltrosPropiedades
			bind:provincia
			bind:canton
			bind:distrito
			bind:precioMin
			bind:precioMax
			bind:moneda
			bind:ordenarPor
		/>

		{#if propiedadesConAnuncios.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				{#each propiedadesConAnuncios as propiedad (propiedad.id)}
					<CardPropiedad {propiedad} />
				{/each}
			</div>

			{#if !cargando && propiedadesMostradas.length >= propiedadesFiltradas.length && propiedadesFiltradas.length > propiedadesPorPagina}
				<div class="text-center py-8 border-t-2 border-gray-200">
					<p class="text-gray-600 font-semibold">
						✅ Has visto todas las {propiedadesFiltradas.length} propiedades disponibles
					</p>
				</div>
			{/if}
		{:else if !cargando}
			<div class="text-center py-16 bg-white rounded-xl shadow-lg">
				<div class="mb-6">
					<svg class="w-24 h-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
				<h3 class="text-2xl font-bold text-gray-900 mb-2">No se encontraron propiedades</h3>
				<p class="text-gray-600 mb-6">Intenta ajustar los filtros de búsqueda.</p>
			</div>
		{/if}

		{#if cargando}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
				<span class="ml-4 text-gray-600 font-semibold">Cargando más propiedades...</span>
			</div>
		{/if}
	</div>
</div>