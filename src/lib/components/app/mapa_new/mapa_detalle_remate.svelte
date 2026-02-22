<script lang="ts">
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { obtenerCodigoCatastral, obtenerCentroDistrito } from '$lib/utils/ubicaciones';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    import area from '@turf/area';
    import { Layers, Eye, EyeOff } from 'lucide-svelte';
	import { UBICACIONES } from '$lib/data/costa_rica_ubicaciones';
    
    // Props
    let { 
        provincia, 
        canton, 
        distrito, 
        finca_id,
        geometria = null
    }: { 
        provincia: string; 
        canton: string; 
        distrito: string; 
        finca_id: string;
        geometria?: any;
    } = $props();
    
    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    let parcelaEncontrada = $state(false);
    let mostrarAdvertencia = $state(false);
    let currentPopup: mapboxgl.Popup | null = null;
    let currentStyle = $state('streets-v12');
    let showCadastre = $state(true);
    let showLabels = $state(false);
    let selectedFincaId = $state<string | null>(null);
    let mapReady = $state(false);
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MapBoxTokenPublic;

    const COLORS = {
        azulSelect: '#2563eb',
        azulBorde: '#1e3a8a',
        verdeSelect: '#10b981',
        baseDark: '#1e293b'
    };

    // Función de registro para analytics/prioridad
    function registrarInteraccionParcela(datos: any) {
        localStorage.setItem('parcelaData', JSON.stringify(datos));
        fetch('/api/prioridad-scraping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                geometry: datos.geometry,
                finca_id: datos.finca === 'Sin número' ? null : datos.finca,
                provincia_code: datos.provincia_code,
                canton_code: datos.canton_code,
                distrito_code: datos.distrito_code,
                coordenadas: datos.coordenadas,
                area_calculada: datos.area,
                origen: 'mapa_remate_detalle_click',
            })
        }).catch(err => console.error('Error al registrar prioridad:', err));
    }

    // Efecto reactivo para pintar parcela seleccionada
    $effect(() => {
        if (!mapReady || !map) return;
        
        const selected = selectedFincaId || '__NO_SELECTION__';
        const currentFinca = finca_id ? String(finca_id) : '__NO_CURRENT__';
        
        Object.keys(DISTRICT_CONFIG).forEach(key => {
            const fillLayerId = `fill-${key}`;
            const lineLayerId = `line-${key}`;
            
            if (!map.getLayer(fillLayerId)) return;

            map.setPaintProperty(fillLayerId, 'fill-color', [
                'case',
                // 🔴 CAMBIO: Ya no pintamos automáticamente 'azulSelect' aquí por finca_id
                // Solo dejamos el color verde para cuando el usuario hace CLICK manual en otra parcela
                ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], selected],
                COLORS.verdeSelect,
                COLORS.baseDark
            ]);

            map.setPaintProperty(fillLayerId, 'fill-opacity', [
                'case',
                ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], selected],
                0.6,
                0
            ]);

            if (map.getLayer(lineLayerId)) {
                map.setPaintProperty(lineLayerId, 'line-width', [
                    'case',
                    ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], selected],
                    3,
                    0.5
                ]);
                
                map.setPaintProperty(lineLayerId, 'line-color', [
                    'case',
                    ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], selected],
                    '#047857',
                    currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8'
                ]);
            }
        });
    });
    
    onMount(() => {
        // Exponer función al window para el popup
        (window as any).handleParcelaClick = registrarInteraccionParcela;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const codigoCatastral = obtenerCodigoCatastral(provincia, canton, distrito);
        
        let centroInicial: [number, number] = [-84.0907, 9.9281];
        let zoomInicial = 8;

        if (codigoCatastral) {
            const centro = obtenerCentroDistrito(codigoCatastral);
            centroInicial = [centro.lng, centro.lat];
            zoomInicial = centro.zoom;
        }

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: centroInicial,
            zoom: zoomInicial,
            minZoom: 10,
            maxZoom: 22,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        map.on('load', () => {
            // console.log('🗺️ Mapa cargado');

            map.loadImage(
                'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
                (error, image) => {
                    if (error) throw error;
                    if (!map.hasImage('custom-marker')) map.addImage('custom-marker', image!);
                    
                    // Cargar tilesets PRIMERO (solo linderos decorativos)
                    loadTilesets();
                    
                    // 🔴 CAMBIO: Única fuente de verdad para el remate es la prop 'geometria'
                    if (geometria && (geometria.type === 'Polygon' || geometria.type === 'MultiPolygon')) {
                        dibujarGeometria();
                    } else {
                        // console.log('⚠️ Sin geometría, mostrando ubicación del distrito');
                        mostrarAdvertencia = true;
                        parcelaEncontrada = false;
                    }
                    
                    mapReady = true;
                    loading = false;
                }
            );
        });

        // Click en parcelas del tileset
        Object.keys(DISTRICT_CONFIG).forEach(key => {
            const fillLayerId = `fill-${key}`;
            
            map.on('click', fillLayerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                
                const feature = e.features[0];
                const props = feature.properties || {};
                const clickedFincaId = props.FINCA || props.Finca || props.finca_id || props.id;
                
                if (!clickedFincaId) return;
                const clickedId = String(clickedFincaId);
                
                // Si hace click en la parcela actual, mostramos su popup como "Actual"
                if (clickedId === String(finca_id)) {
                    mostrarPopupCatastral(props, e.lngLat, feature, true);
                    return;
                }
                
                if (currentPopup) currentPopup.remove();
                selectedFincaId = clickedId;
                mostrarPopupCatastral(props, e.lngLat, feature, false);
            });
            
            map.on('mouseenter', fillLayerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', fillLayerId, () => {
                map.getCanvas().style.cursor = '';
            });
        });

        // Click fuera de parcelas
        map.on('click', (e) => {
            const layers = Object.keys(DISTRICT_CONFIG).map(k => `fill-${k}`).filter(id => map.getLayer(id));
            const features = map.queryRenderedFeatures(e.point, { layers });
            
            if (features.length === 0) {
                selectedFincaId = null;
                if (currentPopup) currentPopup.remove();
            }
        });
        
        return () => {
            if (map) map.remove();
            delete (window as any).handleParcelaClick;
        };
    });

    function loadTilesets() {
        if (!map || !map.isStyleLoaded()) return;

        const cadastreVisibility = showCadastre ? 'visible' : 'none';
        const lineColor = currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8';

        Object.entries(DISTRICT_CONFIG).forEach(([key, config]) => {
            const sourceId = `source-${key}`;
            const layerId = `fill-${key}`;
            const lineLayerId = `line-${key}`;
            const labelLayerId = `label-${key}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { type: 'vector', url: config.tilesetUrl, promoteId: 'FINCA' });
            }

            if (!map.getLayer(layerId)) {
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    'source-layer': config.sourceLayer,
                    paint: {
                        'fill-color': COLORS.baseDark,
                        'fill-opacity': 0
                    },
                    layout: { 'visibility': cadastreVisibility }
                });
            }

            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId,
                    type: 'line',
                    source: sourceId,
                    'source-layer': config.sourceLayer,
                    paint: {
                        'line-color': lineColor,
                        'line-width': 0.5,
                        'line-opacity': 0.6
                    },
                    layout: { 'visibility': cadastreVisibility }
                });
            }

            if (!map.getLayer(labelLayerId)) {
                map.addLayer({
                    id: labelLayerId,
                    type: 'symbol',
                    source: sourceId,
                    'source-layer': config.sourceLayer,
                    layout: {
                        'text-field': ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ['get', 'id']],
                        'text-size': 9,
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'visibility': showLabels ? 'visible' : 'none'
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 1.5
                    }
                });
            }
        });
    }

    function dibujarGeometria() {
        if (!map || !geometria) return;

        try {
            map.addSource('parcela-remate', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: geometria,
                    properties: {}
                }
            });

            map.addLayer({
                id: 'parcela-remate-fill',
                type: 'fill',
                source: 'parcela-remate',
                paint: {
                    'fill-color': COLORS.azulSelect,
                    'fill-opacity': 0.6
                }
            });

            map.addLayer({
                id: 'parcela-remate-line',
                type: 'line',
                source: 'parcela-remate',
                paint: {
                    'line-color': COLORS.azulBorde,
                    'line-width': 4
                }
            });

            const bounds = new mapboxgl.LngLatBounds();

            if (geometria.type === 'Polygon') {
                geometria.coordinates[0].forEach((coord: [number, number]) => {
                    bounds.extend(coord);
                });
            } else if (geometria.type === 'MultiPolygon') {
                geometria.coordinates.forEach((polygon: any) => {
                    polygon[0].forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                });
            }

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, {
                    padding: 80,
                    maxZoom: 18,
                    duration: 1000
                });
                parcelaEncontrada = true;
                mostrarAdvertencia = false;
                // console.log('✅ Geometría dibujada y zoom aplicado');
            }
        } catch (e) {
            console.error('Error dibujando geometría:', e);
            mostrarAdvertencia = true;
            parcelaEncontrada = false;
        }
    }

    function mostrarPopupCatastral(props: any, lngLat: mapboxgl.LngLat, feature?: any, esActual: boolean = false) {
        if (currentPopup) currentPopup.remove();
        
        let displayArea = props.AREA || props.Area || props.Shape__Are || props.area || 0;
        if (feature) {
            try {
                const areaCalculada = area(feature);
                displayArea = areaCalculada.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) { console.warn('Error calculando área:', e); }
        }

        const fincaNum = props.FINCA || props.Finca || props.finca_id || 'Sin número';

        // --- 1. DETECTAR PROVINCIA ---
        // Obtenemos el layerId del feature si existe
        const layerId = feature?.layer?.id?.replace('fill-', '') || '';
        const provinciaCode = detectarProvincia(props, layerId);

        // console.log(`🔍 DetalleRemate -> Finca: ${fincaNum} | Prov: ${provinciaCode}`);

        const datosParcelaStore = {
            finca: fincaNum,
            geometry: feature?.geometry || null,
            area: displayArea,
            provincia_code: provinciaCode, // ✅ Dato limpio
            canton_code: props.CANTON || props.Canton || '0',
            distrito_code: props.DISTRITO || props.Distrito || '0',
            coordenadas: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
            estado: 'Disponible'
        };

        const headerGradient = esActual 
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
            : 'linear-gradient(135deg, #10b981 0%, #047857 100%)';

        const popupContent = `
            <div class="info-card cadastral-popup">
                <div class="cadastral-header" style="background: ${headerGradient};">
                    <div class="icon-box" style="background: rgba(255,255,255,0.2);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/>
                        </svg>
                    </div>
                    <div class="header-text">
                        <h3 class="title">Finca #${fincaNum}</h3>
                    </div>
                </div>
                <div class="card-body">
                    <div class="data-single">
                        <span class="label">Área</span>
                        <span class="value">${displayArea} m²</span>
                    </div>
                    <div class="footer-note" style="color: ${esActual ? '#2563eb' : '#10b981'}; background: ${esActual ? 'rgba(37,99,235,0.08)' : 'rgba(16,185,129,0.08)'}; border-left-color: ${esActual ? '#2563eb' : '#10b981'};">
                        ${esActual ? '📍 Parcela del remate' : '🔍 Parcela seleccionada'}
                    </div>
                    
                    <a href="/parcelas/${fincaNum}?p=${provinciaCode}" 
                       target="_blank"
                       onclick="window.handleParcelaClick(${JSON.stringify(datosParcelaStore).replace(/"/g, '&quot;')}); return true;"
                       class="cta-button"
                       style="background: ${headerGradient};">
                        Ver Detalles →
                    </a>
                </div>
            </div>
        `;

        currentPopup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '260px',
            className: 'custom-mapbox-popup cadastral',
            anchor: 'bottom',
            offset: 35,
            autoPan: true,
            autoPanPadding: { top: 100, bottom: 20, left: 20, right: 20 }
        })
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(map);
    }

    function toggleMapStyle() {
        const newStyle = currentStyle.includes('satellite') 
            ? 'mapbox://styles/mapbox/streets-v12' 
            : 'mapbox://styles/mapbox/satellite-streets-v12';
        currentStyle = newStyle;
        map.setStyle(newStyle);
        
        map.once('style.load', () => {
            mapReady = false;
            map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (error, image) => {
                if (!error && !map.hasImage('custom-marker')) map.addImage('custom-marker', image!);
                loadTilesets();
                if (geometria && (geometria.type === 'Polygon' || geometria.type === 'MultiPolygon')) {
                    dibujarGeometria();
                }
                mapReady = true;
            });
        });
    }

    function toggleCadastreLayers() {
        showCadastre = !showCadastre;
        const v = showCadastre ? 'visible' : 'none';
        Object.keys(DISTRICT_CONFIG).forEach(k => {
            if (map.getLayer(`fill-${k}`)) map.setLayoutProperty(`fill-${k}`, 'visibility', v);
            if (map.getLayer(`line-${k}`)) map.setLayoutProperty(`line-${k}`, 'visibility', v);
        });
    }

    function toggleLabels() {
        showLabels = !showLabels;
        const v = showLabels ? 'visible' : 'none';
        Object.keys(DISTRICT_CONFIG).forEach(k => {
            if (map.getLayer(`label-${k}`)) map.setLayoutProperty(`label-${k}`, 'visibility', v);
        });
    }

	// ========================================================
    // 🧠 CEREBRO GEOGRÁFICO (VERSIÓN CORREGIDA Y SEGURA)
    // ========================================================

    // 1. Crear índice
    const GEO_INDEX = new Map();

    // 2. Función de inicialización para evitar errores de sintaxis suelta
    function inicializarIndice() {
        // Recorremos las ubicaciones importadas
        UBICACIONES.forEach(prov => {
            const codProv = prov.codigo; // Ahora sí funcionará
            
            if (prov.provincia) {
                GEO_INDEX.set(limpiarTexto(prov.provincia), codProv);
            }

            if (prov.cantones) {
                prov.cantones.forEach(canton => {
                    if (canton.canton) {
                        GEO_INDEX.set(limpiarTexto(canton.canton), codProv);
                    }
                    
                    if (canton.distritos) {
                        canton.distritos.forEach(dist => {
                            if (dist.distrito) {
                                GEO_INDEX.set(limpiarTexto(dist.distrito), codProv);
                            }
                        });
                    }
                });
            }
        });

        // Agregamos manuales comunes
        GEO_INDEX.set("sj", "1");
        GEO_INDEX.set("sanjose", "1");
        GEO_INDEX.set("limon", "7");
    }

    // Ejecutamos la función inmediatamente
    inicializarIndice();

    // 3. Función Maestra para detectar provincia
    function detectarProvincia(props: any, layerId: string): string {
        // A. TU ESTÁNDAR (Prioridad Máxima): Si ya pusiste un número 1-7
        const campoDirecto = props.provincia || props.PROVINCIA || props.Provincia;
        if (campoDirecto && /^[1-7]$/.test(String(campoDirecto).trim())) {
            return String(campoDirecto).trim();
        }

        // B. CÓDIGOS GEOESTADÍSTICOS (Ej: 10101 -> Provincia 1)
        const camposDeCodigo = [
            props.cod_cat, 
            props.codigo_cat, 
            props.COD_UGED, 
            props.ID, 
            props.id, 
            props.finca_id
        ];
        
        for (const rawVal of camposDeCodigo) {
            if (!rawVal) continue;
            const valStr = String(rawVal).trim();
            // Si empieza con 1-7 y tiene 5 dígitos o más
            if (/^[1-7]\d{4,}/.test(valStr)) return valStr.charAt(0);
        }

        // C. BÚSQUEDA POR TEXTO (Usando el GEO_INDEX)
        const camposTexto = [
            props.provincia, props.PROVINCIA, 
            props.canton, props.CANTON, props.Canton,
            props.municipio, props.Municipio,
            props.distrito, props.DISTRITO
        ];
        
        for (const campo of camposTexto) {
            if (!campo) continue;
            const texto = limpiarTexto(campo);
            if (GEO_INDEX.has(texto)) return GEO_INDEX.get(texto);
        }

        // D. NOMBRE DEL LAYER (Último recurso)
        return inferirProvinciaDeLayer(layerId || '');
    }

    // 4. Funciones de limpieza y mapeo
    function limpiarTexto(valor: any): string {
        if (!valor) return "";
        return String(valor)
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
            .replace(/[^a-z0-9]/g, "") // Quita espacios y raros
            .trim();
    }

    function inferirProvinciaDeLayer(layerKey: string): string {
        const key = limpiarTexto(layerKey);
        // Intentar buscar coincidencia en el índice
        if (GEO_INDEX.has(key)) return GEO_INDEX.get(key);
        
        // Búsqueda bruta por si acaso
        if (key.includes("sanjose")) return "1";
        if (key.includes("alajuela")) return "2";
        if (key.includes("cartago")) return "3";
        if (key.includes("heredia")) return "4";
        if (key.includes("guanacaste")) return "5";
        if (key.includes("puntarenas")) return "6";
        if (key.includes("limon")) return "7";
        
        return '1'; // Default
    }
</script>

<svelte:head>
	<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<div class="mapa-container">
	{#if loading}
		<div class="loading-overlay">
			<div class="loading-content">
				<div class="spinner"></div>
				<span>Cargando mapa...</span>
			</div>
		</div>
	{/if}

	<div bind:this={mapContainer} class="mapa"></div>
	
	<!-- Controles superiores izquierda -->
	<div class="controls-overlay">
		<button 
			onclick={toggleMapStyle}
			class="control-btn"
			title={currentStyle.includes('satellite') ? 'Ver mapa' : 'Ver satélite'}
		>
			<Layers class="control-icon" />
			<span class="control-text">{currentStyle.includes('satellite') ? 'Satélite' : 'Plano'}</span>
		</button>
		<button 
			onclick={toggleCadastreLayers}
			class="control-btn"
			title={showCadastre ? 'Ocultar linderos' : 'Mostrar linderos'}
		>
			{#if showCadastre}
				<Eye class="control-icon active" />
			{:else}
				<EyeOff class="control-icon" />
			{/if}
			<span class="control-text" class:active={showCadastre}>Linderos</span>
		</button>
	</div>
	
	<!-- Info badge -->
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

	<!-- Leyenda -->
	<div class="legend-overlay">
		<p class="legend-title">Leyenda</p>
		<div class="legend-items">
			<div class="legend-item">
				<div class="legend-color" style="background-color: {COLORS.azulSelect};"></div>
				<span>Parcela del remate</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: {COLORS.verdeSelect};"></div>
				<span>Parcela seleccionada</span>
			</div>
			<div class="legend-item">
				<div class="legend-color" style="background-color: #9ca3af;"></div>
				<span>Otras parcelas</span>
			</div>
		</div>
	</div>
	
	{#if mostrarAdvertencia}
		<div class="advertencia-overlay">
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
		</div>
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

	.loading-overlay {
		position: absolute;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.9);
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #dbeafe;
		border-top-color: #2563eb;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-content span {
		font-size: 14px;
		color: #4b5563;
	}

	/* Controles */
	.controls-overlay {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.control-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: white;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-weight: 600;
		color: #374151;
		transition: all 0.2s;
	}

	.control-btn:hover {
		background: #f9fafb;
	}

	.control-icon {
		width: 16px;
		height: 16px;
		color: #6b7280;
	}

	.control-icon.active {
		color: #2563eb;
	}

	.control-text {
		font-size: 12px;
		color: #6b7280;
	}

	.control-text.active {
		color: #2563eb;
	}
	
	/* Info badge */
	.info-overlay {
		position: absolute;
		top: 16px;
		right: 60px;
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

	/* Leyenda */
	.legend-overlay {
		position: absolute;
		bottom: 16px;
		right: 16px;
		z-index: 10;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(4px);
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 12px;
	}

	.legend-title {
		font-size: 12px;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 8px 0;
	}

	.legend-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: #4b5563;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	/* Advertencia */
	.advertencia-overlay {
		position: absolute;
		bottom: 16px;
		left: 16px;
		right: 140px;
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

	/* Popup styles */
	:global(.custom-mapbox-popup.cadastral .mapboxgl-popup-content) {
		border-radius: 12px;
		padding: 0;
		background: #ffffff;
		box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
	}

	:global(.custom-mapbox-popup.cadastral .mapboxgl-popup-close-button) {
		color: white;
		font-size: 18px;
		padding: 4px 8px;
		right: 4px;
		top: 4px;
	}

	:global(.custom-mapbox-popup.cadastral .mapboxgl-popup-close-button:hover) {
		background: rgba(255,255,255,0.2);
		border-radius: 4px;
	}

	:global(.cadastral-popup) {
		font-family: 'Inter', system-ui, sans-serif;
	}

	:global(.cadastral-popup .cadastral-header) {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(.cadastral-popup .icon-box) {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: white;
	}

	:global(.cadastral-popup .header-text) {
		flex: 1;
	}

	:global(.cadastral-popup .title) {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		color: white;
		line-height: 1.2;
	}

	:global(.cadastral-popup .card-body) {
		padding: 12px 14px;
	}

	:global(.cadastral-popup .data-single) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
	}

	:global(.cadastral-popup .data-single .label) {
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.3px;
	}

	:global(.cadastral-popup .data-single .value) {
		font-size: 14px;
		font-weight: 800;
		color: #1e293b;
		text-align: right;
	}

	:global(.cadastral-popup .footer-note) {
		font-size: 11px;
		padding: 8px 10px;
		border-radius: 6px;
		border-left: 2px solid;
		margin-bottom: 10px;
		font-weight: 600;
	}

	:global(.cadastral-popup .cta-button) {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 100%;
		color: white;
		padding: 9px;
		border-radius: 8px;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
		box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
		transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease;
		cursor: pointer;
	}

	:global(.cadastral-popup .cta-button:hover) {
		transform: translateY(-1px);
		box-shadow: 0 6px 12px -1px rgba(0,0,0,0.3);
	}

	:global(.cadastral-popup .cta-button:active) {
		transform: translateY(0);
	}
	
	@media (max-width: 768px) {
		.mapa-container {
			height: 300px;
		}

		.info-overlay {
			top: auto;
			bottom: 70px;
			right: 16px;
			left: 16px;
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
		
		.advertencia-overlay {
			right: 16px;
			bottom: 16px;
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

		.legend-overlay {
			display: none;
		}

		.control-text {
			display: none;
		}
	}
</style>