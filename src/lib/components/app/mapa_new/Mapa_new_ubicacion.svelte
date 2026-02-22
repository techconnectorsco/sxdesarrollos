<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    import { Loader, Layers, Eye, EyeOff, MapPin, Home } from 'lucide-svelte';

    mapboxgl.accessToken = import.meta.env.VITE_MapBoxTokenPublic;

    const dispatch = createEventDispatcher<{
        ubicacionSeleccionada: { 
            lat: number; 
            lng: number; 
            finca_id?: string | null; 
            geometria?: any;
            tipo: 'parcela' | 'punto'
        };
    }>();

    let { 
        provincia,
        canton,
        distrito,
        ubicacionInicial = undefined, 
        centroInicial = undefined,
        geometriaInicial = undefined,
        altura = '500px'
    } = $props<{
        provincia?: string;
        canton?: string;
        distrito?: string;
        ubicacionInicial?: [number, number];
        centroInicial?: [number, number, number];
        geometriaInicial?: any;
        altura?: string;
    }>();

    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    let marcador: mapboxgl.Marker | null = null;
    let seleccionState: { source: string; sourceLayer: string; id: string | number } | null = null;

    let currentStyle = $state('mapbox://styles/mapbox/streets-v12');
    let showCadastre = $state(true);

    const COLOR_SELECCION = '#22c55e'; // Verde
    const COLOR_LINDERO_SELECT = '#15803d'; ''
    

    onMount(() => {
        map = new mapboxgl.Map({
            container: mapContainer,
            style: currentStyle,
            center: centroInicial ? [centroInicial[0], centroInicial[1]] : [-84.0907, 9.9347],
            zoom: centroInicial ? centroInicial[2] : 13,
            attributionControl: false,
            pitchWithRotate: false
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
            loadTilesets();
            map.getCanvas().style.cursor = 'crosshair';

            if (geometriaInicial && geometriaInicial.type === 'Polygon') {
            setTimeout(() => {
                try {
                    // Agregar la geometría como source GeoJSON
                    if (!map.getSource('geometria-inicial')) {
                        map.addSource('geometria-inicial', {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                geometry: geometriaInicial,
                                properties: {}
                            }
                        });
                    }

                    // Layer de relleno (VERDE)
                    if (!map.getLayer('geometria-inicial-fill')) {
                        map.addLayer({
                            id: 'geometria-inicial-fill',
                            type: 'fill',
                            source: 'geometria-inicial',
                            paint: {
                                'fill-color': '#22c55e', // VERDE
                                'fill-opacity': 0.5
                            }
                        });
                    }

                    // Layer de borde (VERDE OSCURO)
                    if (!map.getLayer('geometria-inicial-line')) {
                        map.addLayer({
                            id: 'geometria-inicial-line',
                            type: 'line',
                            source: 'geometria-inicial',
                            paint: {
                                'line-color': '#15803d',
                                'line-width': 3
                            }
                        });
                    }
                    const bounds = new mapboxgl.LngLatBounds();
                    geometriaInicial.coordinates[0].forEach((coord: [number, number]) => {
                        bounds.extend(coord);
                    });
                    map.fitBounds(bounds, { padding: 80, maxZoom: 18 });

                    // console.log('✅ Geometría dibujada en verde');
                } catch (e) {
                    console.warn('Error dibujando geometría:', e);
                }
            }, 500);

            } else if (ubicacionInicial) {
                // Si solo hay coordenadas, marcador azul
                colocarMarcador(ubicacionInicial[1], ubicacionInicial[0], '#3b82f6');
            }

            loading = false;
        });

        map.on('click', (e) => {
            const bbox = [[e.point.x - 3, e.point.y - 3], [e.point.x + 3, e.point.y + 3]];
            const features = map.queryRenderedFeatures(bbox, {
                layers: Object.keys(DISTRICT_CONFIG).map(k => `fill-${k}`)
            });

            if (features.length > 0) {
                seleccionarParcela(features[0], e.lngLat);
            } else {
                seleccionarPunto(e.lngLat);
            }
        });

        return () => {
            if (map) map.remove();
        };
    });

    function seleccionarParcela(feature: any, lngLat: mapboxgl.LngLat) {
        if (marcador) marcador.remove();
        limpiarSeleccionVisual();

        const props = feature.properties || {};
        const fincaId = props.FINCA || props.Finca || props.finca_id || props.id || feature.id;

        const layerId = feature.layer.id; 
        const key = layerId.replace('fill-', '');
        const config = DISTRICT_CONFIG[key];
        
        if (config && feature.id !== undefined) {
            try {
                const sourceId = `source-${key}`;
                seleccionState = { source: sourceId, sourceLayer: config.sourceLayer, id: feature.id };
                map.setFeatureState(
                    { source: sourceId, sourceLayer: config.sourceLayer, id: feature.id },
                    { selected: true }
                );
            } catch (err) { console.warn(err); }
        }

        colocarMarcador(lngLat.lat, lngLat.lng, '#22c55e');

        dispatch('ubicacionSeleccionada', {
            lat: lngLat.lat,
            lng: lngLat.lng,
            finca_id: fincaId ? String(fincaId) : null,
            geometria: feature.geometry,
            tipo: 'parcela'
        });
    }

    function seleccionarPunto(lngLat: mapboxgl.LngLat) {
        limpiarSeleccionVisual();
        colocarMarcador(lngLat.lat, lngLat.lng, '#3b82f6');

        dispatch('ubicacionSeleccionada', {
            lat: lngLat.lat,
            lng: lngLat.lng,
            finca_id: null,
            geometria: null,
            tipo: 'punto'
        });
    }

    function colocarMarcador(lat: number, lng: number, color: string = '#3b82f6') {
        if (marcador) marcador.remove();
        
        // console.log(`📌 Marker en: ${lat}, ${lng} (${color})`);

        marcador = new mapboxgl.Marker({ 
            color: color, 
            scale: 1.0 
        })
            .setLngLat([lng, lat])
            .addTo(map);
    }

    function limpiarSeleccionVisual() {
        if (seleccionState && seleccionState.id !== undefined) {
            try {
                map.setFeatureState(
                    { source: seleccionState.source, sourceLayer: seleccionState.sourceLayer, id: seleccionState.id },
                    { selected: false }
                );
            } catch (e) {}
        }
        seleccionState = null;
    }

    function loadTilesets() {
        const isSatellite = currentStyle.includes('satellite');
        Object.entries(DISTRICT_CONFIG).forEach(([key, config]) => {
            const sourceId = `source-${key}`;
            const fillLayerId = `fill-${key}`;
            const lineLayerId = `line-${key}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { type: 'vector', url: config.tilesetUrl, promoteId: 'finca_id' });
            }
            if (!map.getLayer(fillLayerId)) {
                map.addLayer({
                    id: fillLayerId, type: 'fill', source: sourceId, 'source-layer': config.sourceLayer,
                    paint: {
                        'fill-color': ['case', ['boolean', ['feature-state', 'selected'], false], COLOR_SELECCION, 'transparent'],
                        'fill-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.5, 0]
                    },
                    layout: { visibility: showCadastre ? 'visible' : 'none' }
                });
            }
            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId, type: 'line', source: sourceId, 'source-layer': config.sourceLayer,
                    paint: {
                        'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], COLOR_LINDERO_SELECT, isSatellite ? '#ffffff' : '#475569'],
                        'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2, 1],
                        'line-opacity': isSatellite ? 0.5 : 0.4
                    },
                    layout: { visibility: showCadastre ? 'visible' : 'none' }
                });
            }
        });
    }

    $effect(() => {
        if (!loading && map && centroInicial) {
            map.flyTo({ center: [centroInicial[0], centroInicial[1]], zoom: centroInicial[2], speed: 1.5 });
        }
    });

    function toggleMapStyle() {
        const newStyle = currentStyle.includes('satellite') ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12';
        currentStyle = newStyle;
        map.setStyle(newStyle);
        map.once('style.load', () => loadTilesets());
    }

    function toggleCadastre() {
        showCadastre = !showCadastre;
        const v = showCadastre ? 'visible' : 'none';
        Object.keys(DISTRICT_CONFIG).forEach(k => {
            if(map.getLayer(`fill-${k}`)) map.setLayoutProperty(`fill-${k}`, 'visibility', v);
            if(map.getLayer(`line-${k}`)) map.setLayoutProperty(`line-${k}`, 'visibility', v);
        });
    }

    function resetView() {
        if (!map) return;
        const center = centroInicial ? [centroInicial[0], centroInicial[1]] : [-84.0907, 9.9347];
        const zoom = centroInicial ? centroInicial[2] : 13;
        map.flyTo({ center: center as [number, number], zoom: zoom, bearing: 0, pitch: 0, speed: 1.2 });
    }
</script>

<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<div class="w-full relative bg-gray-100 rounded-lg overflow-hidden border border-gray-300" style="height: {altura};">
    <div bind:this={mapContainer} class="w-full h-full"></div>

    {#if loading}
        <div class="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <Loader class="w-8 h-8 animate-spin text-blue-600" />
        </div>
    {/if}

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button 
            type="button" 
            onclick={toggleMapStyle} 
            class="bg-white px-3 py-2 rounded-lg shadow hover:bg-gray-50 text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
        >
            <Layers class="w-4 h-4" />
            <span>{currentStyle.includes('satellite') ? 'Mapa' : 'Satélite'}</span>
        </button>

        <div class="flex gap-2">
            <button 
                type="button" 
                onclick={toggleCadastre} 
                class="bg-white p-2 rounded-lg shadow hover:bg-gray-50 text-gray-700 flex-1 flex justify-center"
            >
                {#if showCadastre}<Eye class="w-5 h-5 text-blue-600"/>{:else}<EyeOff class="w-5 h-5"/>{/if}
            </button>
            
            <button 
                type="button" 
                onclick={resetView} 
                class="bg-white p-2 rounded-lg shadow hover:bg-gray-50 text-gray-700 flex-1 flex justify-center"
            >
                <Home class="w-5 h-5" />
            </button>
        </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div class="bg-gray-900/90 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-sm shadow-lg flex items-center gap-2 border border-gray-700">
            <MapPin class="w-3 h-3" />
            {#if seleccionState}
                <span class="text-green-400 font-bold">Parcela seleccionada</span>
            {:else if marcador}
                 <span class="text-blue-400 font-bold">Punto manual marcado</span>
            {:else}
                Haz clic en tu parcela o marca un punto
            {/if}
        </div>
    </div>
</div>

<style>
    :global(.mapboxgl-canvas) { outline: none; }
    :global(.mapboxgl-ctrl-scale) {
        border: none !important;
        background-color: rgba(255, 255, 255, 0.75) !important;
        color: #333 !important;
        font-weight: 600;
        text-align: center;
        line-height: 1.2;
    }
</style>