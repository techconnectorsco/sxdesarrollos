<script lang="ts">
	import { goto } from '$app/navigation';
	
	import GaleriaFotos from '$lib/components/app/detalle_propiedad/galeria_fotos.svelte';
	import MapaUbicacion from '$lib/components/app/propiedades/mapa_ubicacion.svelte'; // ✅ CORRECTO
	import DetallesDocumentacion from '$lib/components/app/detalle_propiedad/detalle_documentacion.svelte';
	
	let { data } = $props();
	
	let anuncio = $derived(data.anuncio);
	
	// Estados para modales
	let showModalRechazo = $state(false);
	let razonRechazo = $state('');
	let notasAdmin = $state('');
	let procesando = $state(false);
	
	// ✅ IMPORTANTE: Las imágenes ya vienen normalizadas del endpoint
	// No necesitamos procesarlas de nuevo, solo asegurarnos que existan
	let imagenesFinales = $derived.by(() => {
		if (!anuncio) return [];
		
		// El endpoint ya retorna imagenes como array de strings
		const imgs = anuncio.imagenes || [];
		
		// console.log('📸 Imágenes recibidas en preview:', imgs.length);
		
		// Si no hay imágenes, usar placeholder
		if (imgs.length === 0) {
			return ['https://placehold.co/800x500/E5E7EB/A3A3A3?text=Sin+Imagen+Disponible&font=montserrat'];
		}
		
		return imgs;
	});
	
	// ✅ Centro del mapa basado en provincia/canton/distrito
	let centroMapa = $derived.by(() => {
		if (!anuncio) return undefined;
		
		// Aquí puedes usar tu lógica de DISTRICT_CONFIG si la tienes
		// Por ahora, un centro por defecto de Costa Rica
		return [-84.0907, 9.9347, 13]; // [lng, lat, zoom]
	});
	
	async function aprobarAnuncio() {
		if (!confirm('¿Aprobar este anuncio?')) return;
		
		procesando = true;
		
		try {
			const response = await fetch('/api/admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					anuncio_id: anuncio.id,
					action: 'aprobar',
					revisado_por: data.user?.id
				})
			});
			
			if (!response.ok) throw new Error('Error al aprobar');
			
			alert('✅ Anuncio aprobado exitosamente');
			goto('/admin/propiedades');
		} catch (err) {
			alert('Error: ' + err.message);
		} finally {
			procesando = false;
		}
	}
	
	function abrirModalRechazo() {
		razonRechazo = '';
		notasAdmin = '';
		showModalRechazo = true;
	}
	
	function cerrarModalRechazo() {
		showModalRechazo = false;
		razonRechazo = '';
		notasAdmin = '';
	}
	
	async function rechazarAnuncio() {
		if (!razonRechazo.trim()) {
			alert('Debes escribir una razón de rechazo');
			return;
		}
		
		procesando = true;
		
		try {
			const response = await fetch('/api/admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					anuncio_id: anuncio.id,
					action: 'rechazar',
					razon_rechazo: razonRechazo,
					notas_admin: notasAdmin,
					revisado_por: data.user?.id
				})
			});
			
			if (!response.ok) throw new Error('Error al rechazar');
			
			alert('❌ Anuncio rechazado');
			goto('/admin/propiedades');
		} catch (err) {
			alert('Error: ' + err.message);
		} finally {
			procesando = false;
			cerrarModalRechazo();
		}
	}
	
	function volverAlPanel() {
		goto('/admin/propiedades');
	}

	// ✅ Debug para ver qué está llegando
	// $effect(() => {
	// 	if (anuncio) {
	// 		console.log('✅ Anuncio cargado en preview:', anuncio.titulo);
	// 		console.log('📸 Array de imágenes:', anuncio.imagenes);
	// 		console.log('📸 Total imágenes:', anuncio.imagenes?.length);
	// 		console.log('📍 Ubicación:', anuncio.provincia, anuncio.canton, anuncio.distrito);
	// 	}
	//});
</script>

<svelte:head>
	<title>Preview: {anuncio.titulo} | Admin SITO.CR</title>
</svelte:head>

{#if anuncio}
	<!-- Barra Admin Flotante -->
	<div class="bg-white border-b border-gray-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center gap-4 flex-wrap">
			<!-- Info Badges -->
			<div class="flex gap-2.5 items-center flex-wrap">
				<!-- Badge Estado -->
				<span class="px-2.5 py-1 text-xs font-semibold rounded-md border {anuncio.estado === 'activo' ? 'bg-green-50 text-green-700 border-green-200' : anuncio.estado === 'pendiente_revision' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}">
					{anuncio.estado.replace('_', ' ')}
				</span>
				
				<!-- Badge Público/Privado -->
				<span class="px-2.5 py-1 text-xs font-semibold rounded-md border {anuncio.publico ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}">
					{anuncio.publico ? '👁️ Público' : '🔒 Privado'}
				</span>
				
				<!-- Badge Tipo -->
				<span class="px-2.5 py-1 text-xs font-semibold rounded-md border {anuncio.tipo_transaccion === 'venta' ? 'bg-green-50 text-green-700 border-green-200' : anuncio.tipo_transaccion === 'alquiler' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}">
					{anuncio.tipo_transaccion}
				</span>
			</div>
			
			<!-- Botones de Acción -->
			<div class="flex gap-2">
				{#if anuncio.estado === 'pendiente_revision'}
					<button 
						onclick={aprobarAnuncio} 
						disabled={procesando}
						class="px-4 py-2 text-sm font-semibold rounded-lg border border-green-600 text-green-600 bg-white hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						✓ Aprobar
					</button>
					<button 
						onclick={abrirModalRechazo} 
						disabled={procesando}
						class="px-4 py-2 text-sm font-semibold rounded-lg border border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						✗ Rechazar
					</button>
				{/if}
				<button 
					onclick={volverAlPanel}
					class="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors">
					← Volver
				</button>
			</div>
		</div>
	</div>

	<!-- Contenido de la Propiedad -->
	<div class="min-h-screen bg-gray-50 py-6 pb-12">
		<div class="max-w-7xl mx-auto px-5">
			<!-- ✅ Galería de Fotos con imágenes ya normalizadas -->
			<GaleriaFotos 
				imagenes={imagenesFinales}
				titulo={anuncio.titulo}
			/>

			<!-- Header de la Propiedad -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
				<h1 class="text-3xl font-bold text-gray-800 mb-3">{anuncio.titulo}</h1>

				<div class="flex items-center gap-3 mb-4 flex-wrap">
					<span class="flex items-center gap-1.5 text-base text-gray-600">
						<svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
						</svg>
						{anuncio.habitaciones || 0} habitaciones
					</span>
					<span class="text-gray-300">|</span>
					<span class="flex items-center gap-1.5 text-base text-gray-600">
						<svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-5 9h4m-2-9v9M4 6h16M4 6a2 2 0 012-2h12a2 2 0 012 2M4 6v6a2 2 0 002 2h12a2 2 0 002-2V6" />
						</svg>
						{anuncio.banos || 0} baños
					</span>
					<span class="text-gray-300">|</span>
					<span class="flex items-center gap-1.5 text-base text-gray-600">
						<svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
						</svg>
						{anuncio.area || 0} m²
					</span>
				</div>

				<div class="mb-4">
					<div class="text-4xl font-bold text-gray-900">
						{#if anuncio.moneda === 'USD'}
							${anuncio.precio.toLocaleString('en-US')}
						{:else}
							₡{anuncio.precio.toLocaleString('es-CR')}
						{/if}
					</div>
				</div>
				
				<p class="flex items-center gap-2 text-base text-gray-600 m-0">
					<svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
					</svg>
					{anuncio.distrito || 'N/A'}, {anuncio.canton || 'N/A'}, {anuncio.provincia || 'N/A'}
				</p>
			</div>

			<!-- Layout de 2 columnas -->
			<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
				<!-- Columna Principal -->
				<div class="flex flex-col gap-6">
					<!-- Descripción -->
					{#if anuncio.descripcion}
						<section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
							<h2 class="text-xl font-bold text-gray-800 mb-4">Descripción</h2>
							<p class="text-base leading-relaxed text-gray-600 m-0">{anuncio.descripcion}</p>
						</section>
					{/if}

					<!-- Características -->
					{#if anuncio.caracteristicas && anuncio.caracteristicas.length > 0}
						<section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
							<h2 class="text-xl font-bold text-gray-800 mb-4">Características y Amenidades</h2>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
								{#each anuncio.caracteristicas as caracteristica}
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<svg class="w-4.5 h-4.5 text-green-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{caracteristica}
									</div>
								{/each}
							</div>
						</section>
					{/if}

					<!-- Detalles Documentación -->
					<DetallesDocumentacion 
						finca_id={anuncio.finca_id}
						naturaleza="Propiedad"
						area_terreno={anuncio.area || 0}
						area_construccion={anuncio.area_construccion_m2 || 0}
						valor_fiscal={anuncio.precio * 0.7}
						gravamenes=""
						ultima_venta_fecha=""
						ultima_venta_precio={0}
					/>

					<!-- ✅ Mapa con ubicación -->
					<section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<h2 class="text-xl font-bold text-gray-800 mb-4">Ubicación</h2>
						<MapaUbicacion 
							provincia={anuncio.provincia || 'San José'}
							canton={anuncio.canton || ''}
							distrito={anuncio.distrito || ''}
							finca_id={anuncio.finca_id}
						/>
					</section>
				</div>

				<!-- Columna Lateral -->
				<div class="flex flex-col gap-6">
					<!-- Info de Contacto -->
					<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
						<h3 class="text-xl font-bold text-gray-800 mb-4">Información de Contacto</h3>
						<div class="space-y-2">
							<p class="text-sm text-gray-600 m-0"><strong>Nombre:</strong> {anuncio.contacto_nombre}</p>
							<p class="text-sm text-gray-600 m-0"><strong>Teléfono:</strong> {anuncio.contacto_telefono}</p>
							<p class="text-sm text-gray-600 m-0"><strong>Email:</strong> {anuncio.contacto_email}</p>
						</div>
					</div>

					<!-- Info Admin -->
					{#if anuncio.razon_rechazo || anuncio.notas_admin}
						<div class="bg-yellow-50 rounded-xl border-2 border-yellow-400 p-6">
							<h3 class="text-xl font-bold text-gray-800 mb-4">Notas Admin</h3>
							{#if anuncio.razon_rechazo}
								<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
									<p class="text-xs font-bold uppercase text-gray-600 m-0 mb-1">Razón de rechazo:</p>
									<p class="text-sm text-gray-900 m-0">{anuncio.razon_rechazo}</p>
								</div>
							{/if}
							{#if anuncio.notas_admin}
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
									<p class="text-xs font-bold uppercase text-gray-600 m-0 mb-1">Notas internas:</p>
									<p class="text-sm text-gray-900 m-0">{anuncio.notas_admin}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Modal Rechazar -->
	{#if showModalRechazo}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000 p-5">
			<div class="bg-white rounded-xl p-6 max-w-md w-full">
				<h3 class="text-xl font-bold text-gray-900 mb-2">❌ Rechazar Anuncio</h3>
				<p class="text-sm text-gray-600 mb-5">{anuncio.titulo}</p>
				
				<div class="mb-4">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Razón de rechazo (visible al usuario) *
					</label>
					<textarea
						bind:value={razonRechazo}
						placeholder="Ejemplo: Las fotos no muestran claramente la propiedad..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y"
						rows="3"></textarea>
				</div>

				<div class="mb-6">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-semibold text-gray-700 mb-2">
						Notas internas (solo admin)
					</label>
					<textarea
						bind:value={notasAdmin}
						placeholder="Notas privadas para el equipo..."
						class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y"
						rows="2"></textarea>
				</div>

				<div class="flex gap-3">
					<button
						onclick={cerrarModalRechazo}
						class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
						Cancelar
					</button>
					<button
						onclick={rechazarAnuncio}
						disabled={procesando}
						class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						Rechazar
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="min-h-screen flex items-center justify-center">
		<p class="text-gray-600">Cargando...</p>
	</div>
{/if}