<script lang="ts">
	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import { obtenerCodigoCatastral, obtenerCentroDistrito } from '$lib/utils/ubicaciones';
	import { getTilesetsByDistrito } from '$lib/data/mapbox_tilesets';
	
	// ✅ Svelte 5: Props con $props()
	let { provincia, canton, distrito, finca_id }: { 
		provincia: string; 
		canton: string; 
		distrito: string; 
		finca_id: string 
	} = $props();
	
	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map;
	let parcelaEncontrada = $state(false);
	let mostrarAdvertencia = $state(false);
	
	const MAPBOX_TOKEN = import.meta.env.VITE_MapBoxTokenPublic;
	
	onMount(async () => {
		const codigoCatastral = obtenerCodigoCatastral(provincia, canton, distrito);
		if (!codigoCatastral) {
			console.error('❌ No se pudo obtener código catastral');
			return;
		}
		
		// console.log('📍 Código catastral:', codigoCatastral);
		// console.log('🔑 Buscando finca_id:', finca_id);
		
		const tilesets = getTilesetsByDistrito(codigoCatastral);
		
		if (tilesets.length === 0) {
			console.warn('⚠️ No se encontraron tilesets para código:', codigoCatastral);
			mostrarMapaSinParcelas(codigoCatastral);
			return;
		}
		
		// console.log(`📍 Cargando ${tilesets.length} tileset(s) para ${distrito} (${codigoCatastral})`);
		
		mapboxgl.accessToken = MAPBOX_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [-84.0907, 9.9281],
			zoom: 8,
			pitch: 0,
			bearing: 0
		});
		
		map.on('load', () => {
			// console.log('🗺️ Mapa cargado');
			
			tilesets.forEach((tileset, index) => {
				const sourceId = `parcelas-${index}`;
				
				// console.log(`📦 [${index}] Agregando tileset:`, tileset.sourceLayer);
				
				map.addSource(sourceId, {
					type: 'vector',
					url: tileset.tilesetUrl
				});
				
				map.addLayer({
					id: `parcelas-outline-${index}`,
					type: 'line',
					source: sourceId,
					'source-layer': tileset.sourceLayer,
					paint: {
						'line-color': '#ffffff',
						'line-width': 0.5,
						'line-opacity': 0.3
					}
				});
				
				map.addLayer({
    id: `parcela-seleccionada-${index}`,
    type: 'fill',
    source: sourceId,
    'source-layer': tileset.sourceLayer,
    paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.5
    },
    filter: ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id']], finca_id]
});
				
				map.addLayer({
    id: `parcela-seleccionada-outline-${index}`,
    type: 'line',
    source: sourceId,
    'source-layer': tileset.sourceLayer,
    paint: {
        'line-color': '#3b82f6',
        'line-width': 3
    },
    filter: ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id']], finca_id]
});
				
				// console.log(`✅ [${index}] Capas agregadas`);
			});
			
			esperarYBuscarParcela(tilesets, codigoCatastral);
		});
		
		return () => {
			if (map) map.remove();
		};
	});
	
	function mostrarMapaSinParcelas(codigoCatastral: string) {
		const centro = obtenerCentroDistrito(codigoCatastral);
		
		mapboxgl.accessToken = MAPBOX_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [centro.lng, centro.lat],
			zoom: centro.zoom,
			pitch: 0,
			bearing: 0
		});
		
		mostrarAdvertencia = true;
		parcelaEncontrada = false;
	}
	
	function esperarYBuscarParcela(tilesets: any[], codigoCatastral: string, intentos = 0) {
		if (!map) return;
		
		const maxIntentos = 10;
		
		let hayDatos = false;
		tilesets.forEach((tileset, index) => {
			const sourceId = `parcelas-${index}`;
			const features = map.querySourceFeatures(sourceId, {
				sourceLayer: tileset.sourceLayer
			});
			if (features.length > 0) {
				hayDatos = true;
			}
		});
		
		if (hayDatos) {
			// console.log(`✅ Datos disponibles, iniciando búsqueda...`);
			buscarYCentrarParcela(tilesets, codigoCatastral);
		} else if (intentos < maxIntentos) {
			// console.log(`⏳ Esperando datos... (intento ${intentos + 1}/${maxIntentos})`);
			setTimeout(() => esperarYBuscarParcela(tilesets, codigoCatastral, intentos + 1), 500);
		} else {
			console.warn('⚠️ Timeout: No se cargaron los datos después de esperar');
			centrarEnDistrito(codigoCatastral);
		}
	}
	
	function buscarYCentrarParcela(tilesets: any[], codigoCatastral: string) {
		if (!map) return;
		
		// console.log('\n🔍 ========== BÚSQUEDA DE PARCELA ==========');
		// console.log('🔑 finca_id:', finca_id);
		
		const bounds = new mapboxgl.LngLatBounds();
		let totalEncontradas = 0;
		
		tilesets.forEach((tileset, index) => {
			const sourceId = `parcelas-${index}`;
			
			const features = map.querySourceFeatures(sourceId, {
    sourceLayer: tileset.sourceLayer,
    filter: ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id']], finca_id]
});
			
			// console.log(`📦 [${index}] ${tileset.sourceLayer}: ${features.length} encontradas`);
			
			if (features.length > 0) {
				// console.log(`   ✅ Datos:`, features[0].properties);
				totalEncontradas += features.length;
				
				features.forEach((feature: any) => {
					if (feature.geometry.type === 'Polygon') {
						feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
							bounds.extend(coord);
						});
					} else if (feature.geometry.type === 'MultiPolygon') {
						feature.geometry.coordinates.forEach((polygon: any) => {
							polygon[0].forEach((coord: [number, number]) => {
								bounds.extend(coord);
							});
						});
					}
				});
			}
		});
		
		// console.log('\n📊 Total encontradas:', totalEncontradas);
		
		if (!bounds.isEmpty() && totalEncontradas > 0) {
			// console.log('✅ Haciendo zoom a parcela...\n');
			map.fitBounds(bounds, {
				padding: 50,
				maxZoom: 17,
				duration: 1000
			});
			parcelaEncontrada = true;
			mostrarAdvertencia = false;
		} else {
			console.warn('⚠️ Parcela no encontrada\n');
			centrarEnDistrito(codigoCatastral);
		}
	}
	
	function centrarEnDistrito(codigoCatastral: string) {
		const centro = obtenerCentroDistrito(codigoCatastral);
		map.flyTo({
			center: [centro.lng, centro.lat],
			zoom: centro.zoom,
			duration: 1000
		});
		parcelaEncontrada = false;
		mostrarAdvertencia = true;
	}
</script>

<svelte:head>
	<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<div class="mapa-container">
	<div bind:this={mapContainer} class="mapa"></div>
	
	<div class="info-overlay">
		<div class="info-badge">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
			</svg>
			<div>
				<p class="ubicacion">{distrito}, {canton}</p>
				<p class="finca">Finca: {finca_id}</p>
			</div>
		</div>
	</div>
	
	{#if mostrarAdvertencia}
		<!-- <div class="advertencia-overlay">
			<div class="advertencia-card">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="advertencia-icon">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
				</svg>
				<div>
					<p class="advertencia-titulo">Ubicación aproximada</p>
					<p class="advertencia-texto">
						No se encontró la parcela exacta con finca N° {finca_id}. 
						El mapa muestra la ubicación aproximada del distrito de {distrito}.
					</p>
				</div>
			</div>
		</div> -->
	{/if}
</div>

<style>
	.mapa-container {
		position: relative;
		width: 100%;
		height: 400px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.mapa {
		width: 100%;
		height: 100%;
	}
	
	.info-overlay {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 10;
	}
	
	.info-badge {
		display: flex;
		align-items: center;
		gap: 10px;
		background: white;
		padding: 12px 16px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	.icon {
		width: 24px;
		height: 24px;
		color: #3b82f6;
		flex-shrink: 0;
	}
	
	.ubicacion {
		font-size: 14px;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}
	
	.finca {
		font-size: 12px;
		color: #6b7280;
		margin: 2px 0 0 0;
	}
	
	.advertencia-overlay {
		position: absolute;
		bottom: 16px;
		left: 16px;
		right: 16px;
		z-index: 10;
	}
	
	.advertencia-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background: #fef3c7;
		border: 2px solid #f59e0b;
		padding: 14px 16px;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
	
	.advertencia-icon {
		width: 24px;
		height: 24px;
		color: #f59e0b;
		flex-shrink: 0;
		margin-top: 2px;
	}
	
	.advertencia-titulo {
		font-size: 14px;
		font-weight: 700;
		color: #92400e;
		margin: 0 0 4px 0;
	}
	
	.advertencia-texto {
		font-size: 13px;
		color: #78350f;
		margin: 0;
		line-height: 1.4;
	}
	
	@media (max-width: 768px) {
		.mapa-container {
			height: 300px;
		}
		
		.info-badge {
			padding: 10px 12px;
		}
		
		.ubicacion {
			font-size: 13px;
		}
		
		.finca {
			font-size: 11px;
		}
		
		.advertencia-card {
			padding: 12px 14px;
		}
		
		.advertencia-titulo {
			font-size: 13px;
		}
		
		.advertencia-texto {
			font-size: 12px;
		}
	}
</style>