<script lang="ts">
    // D:\Users\Usuario\Desktop\SITO-SvelteKit\src\lib\components\app\mapa_new\MiniMapaParcela.svelte
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    import { UBICACIONES } from '$lib/data/costa_rica_ubicaciones';
    import area from '@turf/area';
    import { Layers, Eye, EyeOff } from 'lucide-svelte';

    let { geometry, coordenadas, fincaId } = $props<{
        geometry?: any;
        coordenadas?: string;
        fincaId?: string;
    }>();

    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    let currentPopup: mapboxgl.Popup | null = null;
    let currentStyle = $state('streets-v12');
    let showCadastre = $state(true);
    let showLabels = $state(false);
    let selectedFincaId = $state<string | null>(null);
    let mapReady = $state(false);

    mapboxgl.accessToken = import.meta.env.VITE_MapBoxTokenPublic;

    const COLORS = {
        azulSelect: '#2563eb',     // Parcela actual (AZUL)
        verdeSelect: '#10b981',    // Parcela seleccionada (VERDE)
        baseDark: '#1e293b'
    };

    // --- NUEVO: FUNCIÓN DE REGISTRO (Igual que en Mapa.svelte) ---
   function registrarInteraccionParcela(datos: any) {
        // 1. Guardar en LocalStorage (Para que la ficha cargue los datos)
        localStorage.setItem('parcelaData', JSON.stringify(datos));

        // 2. Enviar a la API de prioridad-scraping
        // keepalive: true es vital para que la petición sobreviva al abrir nueva pestaña
        fetch('/api/prioridad-scraping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            keepalive: true, // <--- ¡ESTO FALTABA!
            body: JSON.stringify({
                geometry: datos.geometry,
                finca_id: datos.finca === 'Sin número' ? null : datos.finca,
                provincia_code: datos.provincia_code,
                canton_code: datos.canton_code,
                distrito_code: datos.distrito_code,
                coordenadas: datos.coordenadas,
                area_calculada: datos.area,
                origen: 'mini_mapa_detalle_click', 
            })
        }).catch(err => {
            console.error('Error de red al registrar prioridad:', err);
        });
    }

    // ✅ EFECTO REACTIVO: Pintar parcela seleccionada cuando cambia
    $effect(() => {
    if (!mapReady || !map) return;
    
    // Usar valores placeholder que nunca coincidirán con fincas reales
    const selected = selectedFincaId || '__NO_SELECTION__';
    const currentFinca = fincaId ? String(fincaId) : '__NO_CURRENT__';
    
    Object.keys(DISTRICT_CONFIG).forEach(key => {
        const fillLayerId = `fill-${key}`;
        const lineLayerId = `line-${key}`;
        
        if (!map.getLayer(fillLayerId)) return;

        map.setPaintProperty(fillLayerId, 'fill-color', [
            'case',
            ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], currentFinca],
            COLORS.azulSelect,
            ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], selected],
            COLORS.verdeSelect,
            COLORS.baseDark
        ]);

        map.setPaintProperty(fillLayerId, 'fill-opacity', [
            'case',
            ['==', ['coalesce', ['get', 'FINCA'], ['get', 'Finca'], ['get', 'finca_id'], ''], currentFinca],
            0.5,
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
        // --- EXPONER FUNCIÓN AL WINDOW ---
        (window as any).handleParcelaClick = registrarInteraccionParcela;

        if (!mapContainer || !mapboxgl.accessToken) return;

        let lat = 9.9347, lng = -84.0907;
if (coordenadas && coordenadas !== '0, 0') {
    [lat, lng] = coordenadas.split(',').map(c => parseFloat(c.trim()));
} else if (geometry) {
    // Calcular centro desde la geometría
    try {
        const coords = geometry.type === 'MultiPolygon' 
            ? geometry.coordinates[0][0] 
            : geometry.coordinates[0];
        const avgLng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
        const avgLat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
        lat = avgLat;
        lng = avgLng;
    } catch (e) { console.warn('Error calculando centro:', e); }
}

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 16,
            minZoom: 15,
            maxZoom: 22,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
            map.loadImage(
                'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
                (error, image) => {
                    if (error) throw error;
                    if (!map.hasImage('custom-marker')) map.addImage('custom-marker', image);
                    
                    // Cargar tilesets PRIMERO
                    loadTilesets();
                    
                    // Si tenemos geometría, dibujar la parcela actual ENCIMA de los tilesets
                    if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
                        try {
                            map.addSource('parcela-actual', {
                                type: 'geojson',
                                data: {
                                    type: 'Feature',
                                    geometry: geometry,
                                    properties: {}
                                }
                            });

                            // Relleno azul para parcela actual
                            map.addLayer({
                                id: 'parcela-actual-fill',
                                type: 'fill',
                                source: 'parcela-actual',
                                paint: {
                                    'fill-color': COLORS.azulSelect,
                                    'fill-opacity': 0.6
                                }
                            });

                            // Borde grueso para parcela actual
                            map.addLayer({
                                id: 'parcela-actual-line',
                                type: 'line',
                                source: 'parcela-actual',
                                paint: {
                                    'line-color': '#1e3a8a',
                                    'line-width': 4
                                }
                            });

                            // Auto-zoom
                            const bounds = new mapboxgl.LngLatBounds();
                            if (geometry.type === 'Polygon') {
                                geometry.coordinates[0].forEach((coord: [number, number]) => {
                                    bounds.extend(coord);
                                });
                            } else if (geometry.type === 'MultiPolygon') {
                                geometry.coordinates.forEach((poly: any) => {
                                    poly[0].forEach((coord: [number, number]) => {
                                        bounds.extend(coord);
                                    });
                                });
                            }
                            map.fitBounds(bounds, { padding: 80, maxZoom: 18 });
                        } catch (e) {
                            console.error('Error dibujando parcela:', e);
                        }
                    }
                    
                    mapReady = true;
                    loading = false;
                }
            );
        });

        // ✅ Click en parcelas del tileset - MEJORADO
        Object.keys(DISTRICT_CONFIG).forEach(key => {
            const fillLayerId = `fill-${key}`;
            
            map.on('click', fillLayerId, (e) => {
                if (!e.features || e.features.length === 0) return;
                
                const feature = e.features[0];
                const props = feature.properties || {};
                const clickedFincaId = props.FINCA || props.Finca || props.finca_id || props.id;
                
                if (!clickedFincaId) return;
                
                const clickedId = String(clickedFincaId);
                
                // Si hace click en la parcela actual, mostrar popup pero no cambiar selección
                if (clickedId === String(fincaId)) {
                    mostrarPopupCatastral(props, e.lngLat, feature, true);
                    return;
                }
                
                // Limpiar popup anterior
                if (currentPopup) currentPopup.remove();
                
                // Marcar como seleccionada (esto dispara el $effect)
                selectedFincaId = clickedId;
                
                // Mostrar popup
                mostrarPopupCatastral(props, e.lngLat, feature, false);
            });
            
            map.on('mouseenter', fillLayerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', fillLayerId, () => {
                map.getCanvas().style.cursor = '';
            });
        });

        // Click fuera de parcelas -> limpiar selección
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
            // Limpiar la función global
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

            // Fill Layer
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

            // Line Layer
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

            // Label Layer
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

    // ========================================================
    // ✅ POPUP ACTUALIZADO (Con detección y URL ?p=)
    // ========================================================
    function mostrarPopupCatastral(props: any, lngLat: mapboxgl.LngLat, feature?: any, esActual: boolean = false) {
        if (currentPopup) currentPopup.remove();
        
        // --- 1. Cálculo de área ---
        let displayArea = props.AREA || props.Area || props.Shape__Are || props.area || 0;
        if (feature) {
            try {
                const areaCalculada = area(feature);
                displayArea = areaCalculada.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) { console.warn('Error calculando área:', e); }
        }

        const fincaNum = props.FINCA || props.Finca || props.finca_id || 'Sin número';

        // --- 2. DETECTAR PROVINCIA (Para el scraping) ---
        // Obtenemos el layerId del feature si existe, o string vacío
        const layerId = feature?.layer?.id?.replace('fill-', '') || '';
        const provinciaCode = detectarProvincia(props, layerId);

        console.log(`🔍 MiniMapa -> Finca: ${fincaNum} | Prov: ${provinciaCode}`);

        // ✅ Objeto de datos completo
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

        const headerColor = esActual ? '#2563eb' : '#10b981';
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
                        ${esActual ? '📍 Parcela actual' : '🔍 Parcela seleccionada'}
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
                if (!error && !map.hasImage('custom-marker')) map.addImage('custom-marker', image);
                loadTilesets();
                
                // Re-dibujar parcela actual si existe
                if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
                    if (!map.getSource('parcela-actual')) {
                        map.addSource('parcela-actual', {
                            type: 'geojson',
                            data: { type: 'Feature', geometry: geometry, properties: {} }
                        });
                    }
                    if (!map.getLayer('parcela-actual-fill')) {
                        map.addLayer({
                            id: 'parcela-actual-fill',
                            type: 'fill',
                            source: 'parcela-actual',
                            paint: { 'fill-color': COLORS.azulSelect, 'fill-opacity': 0.6 }
                        });
                    }
                    if (!map.getLayer('parcela-actual-line')) {
                        map.addLayer({
                            id: 'parcela-actual-line',
                            type: 'line',
                            source: 'parcela-actual',
                            paint: { 'line-color': '#1e3a8a', 'line-width': 4 }
                        });
                    }
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

<div class="w-full relative rounded-lg overflow-hidden border border-gray-200 shadow-sm" style="height: 400px;">
    {#if loading}
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-white/90">
            <div class="flex flex-col items-center gap-2">
                <div class="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span class="text-sm text-gray-600">Cargando mapa...</span>
            </div>
        </div>
    {/if}
    
    <div bind:this={mapContainer} class="w-full h-full"></div>

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button 
            onclick={toggleMapStyle}
            class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 transition-all"
            title={currentStyle.includes('satellite') ? 'Ver mapa' : 'Ver satélite'}
        >
            <Layers class="w-4 h-4" />
            <span class="text-xs hidden sm:inline">{currentStyle.includes('satellite') ? 'Satélite' : 'Plano'}</span>
        </button>
        <button 
            onclick={toggleCadastreLayers}
            class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 transition-all"
            title={showCadastre ? 'Ocultar linderos' : 'Mostrar linderos'}
        >
            {#if showCadastre}
                <Eye class="w-4 h-4 text-blue-600" />
            {:else}
                <EyeOff class="w-4 h-4 text-gray-400" />
            {/if}
            <span class="text-xs hidden sm:inline {showCadastre ? 'text-blue-600' : 'text-gray-500'}">Linderos</span>
        </button>
    </div>

    <div class="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p class="font-semibold text-gray-900 mb-2">Leyenda</p>
        <div class="space-y-1 text-gray-700">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background-color: {COLORS.azulSelect};"></div>
                <span>Parcela actual</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background-color: {COLORS.verdeSelect};"></div>
                <span>Parcela seleccionada</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Otras parcelas</span>
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) { 
        margin: 0; 
    }

    /* === POPUP CATASTRAL === */
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
</style>