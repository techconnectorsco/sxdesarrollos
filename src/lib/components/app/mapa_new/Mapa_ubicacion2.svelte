<script lang="ts">
    import { onMount, createEventDispatcher, onDestroy } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    import { Loader, Layers, Eye, EyeOff } from 'lucide-svelte';

    mapboxgl.accessToken = import.meta.env.VITE_MapBoxTokenPublic;

    const dispatch = createEventDispatcher<{
        ubicacionSeleccionada: { lat: number; lng: number };
    }>();

    // PROPS
    let { 
        provincia,
        canton,
        distrito,
        ubicacionInicial = undefined,    // [lng, lat] opcional
        centroInicial = undefined,       // [lng, lat, zoom] opcional
        altura = '500px'
    } = $props<{
        provincia?: string;
        canton?: string;
        distrito?: string;
        ubicacionInicial?: [number, number];
        centroInicial?: [number, number, number];
        altura?: string;
    }>();

    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    let marcadorSeleccion: mapboxgl.Marker | null = null;
    let mapReady = $state(false); // ✅ Estado para saber cuando el mapa está listo
    
    let currentStyle = $state('satellite-streets-v12');
    let showCadastre = $state(true);

    // Función para colocar marcador
    function colocarMarcador(lat: number, lng: number) {
        if (!map) return;
        
        // Remover marcador anterior si existe
        if (marcadorSeleccion) {
            marcadorSeleccion.remove();
        }
        
        // Crear nuevo marcador azul
        marcadorSeleccion = new mapboxgl.Marker({
            color: '#3b82f6',
            draggable: false
        })
            .setLngLat([lng, lat])
            .addTo(map);
        
        // console.log('📍 Marcador colocado en:', { lat, lng });
    }

    onMount(() => {
        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [-84.0907, 9.9347],
            zoom: 13,
            minZoom: 8,
            maxZoom: 22,
            pitch: 0,
            bearing: 0,
            attributionControl: false
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true
            }),
            'top-right'
        );

        map.on('load', () => {
            loadTilesets();
            
            // ✅ MODO SELECCIÓN: Click en el mapa
            map.getCanvas().style.cursor = 'crosshair';
            
            map.on('click', (e) => {
                const lat = e.lngLat.lat;
                const lng = e.lngLat.lng;
                
                // Colocar marcador
                colocarMarcador(lat, lng);
                
                // Emitir evento
                dispatch('ubicacionSeleccionada', { lat, lng });
            });
            
            loading = false;
            mapReady = true; // ✅ Marcar mapa como listo
            
            // ✅ Si hay centroInicial al cargar, volar inmediatamente
            if (centroInicial) {
                const [lng, lat, zoom] = centroInicial;
                map.flyTo({
                    center: [lng, lat],
                    zoom: zoom,
                    duration: 1500,
                    essential: true
                });
                // console.log('🚁 Vuelo inicial al distrito:', { lat, lng, zoom });
            }
            
            // ✅ Si hay ubicación inicial, mostrar marcador
            if (ubicacionInicial) {
                const [lng, lat] = ubicacionInicial;
                colocarMarcador(lat, lng);
            }
        });

        return () => {
            if (marcadorSeleccion) marcadorSeleccion.remove();
            if (map) map.remove();
        };
    });

    // ✅ EFECTO PARA VOLAR CUANDO CAMBIA centroInicial (después de que el mapa esté listo)
    $effect(() => {
        if (mapReady && map && centroInicial) {
            const [lng, lat, zoom] = centroInicial;
            
            // console.log('🚁 Volando al centro del distrito:', { distrito, lat, lng, zoom });
            
            map.flyTo({
                center: [lng, lat],
                zoom: zoom,
                duration: 1500,
                essential: true
            });
        }
    });

    // ✅ EFECTO PARA MOSTRAR MARCADOR CUANDO CAMBIA ubicacionInicial
    $effect(() => {
        if (mapReady && map && ubicacionInicial) {
            const [lng, lat] = ubicacionInicial;
            colocarMarcador(lat, lng);
        }
    });

    function loadTilesets() {
        const isSatellite = currentStyle.includes('satellite');
        const lineColor = isSatellite ? '#ffffff' : '#94a3b8';
        const lineOpacity = isSatellite ? 0.7 : 0.6;
        const cadastreVisibility = showCadastre ? 'visible' : 'none';

        Object.entries(DISTRICT_CONFIG).forEach(([key, config]) => {
            const sourceId = `source-${key}`;
            const lineLayerId = `line-${key}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { 
                    type: 'vector', 
                    url: config.tilesetUrl 
                });
            }

            // Solo líneas para mostrar límites catastrales
            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId, 
                    type: 'line', 
                    source: sourceId, 
                    'source-layer': config.sourceLayer,
                    paint: {
                        'line-color': lineColor,
                        'line-width': 1,
                        'line-opacity': lineOpacity
                    },
                    layout: { 
                        'visibility': cadastreVisibility 
                    }
                });
            }
        });
    }

    function toggleMapStyle() {
        const newStyle = currentStyle.includes('satellite') 
            ? 'mapbox://styles/mapbox/streets-v12' 
            : 'mapbox://styles/mapbox/satellite-streets-v12';
        
        currentStyle = newStyle;
        map.setStyle(newStyle);
        
        map.once('style.load', () => {
            loadTilesets();
            mapReady = true;
        });
    }

    function toggleCadastreLayers() {
        showCadastre = !showCadastre;
        const v = showCadastre ? 'visible' : 'none';
        
        Object.keys(DISTRICT_CONFIG).forEach(k => {
            if (map.getLayer(`line-${k}`)) {
                map.setLayoutProperty(`line-${k}`, 'visibility', v);
            }
        });
    }
</script>

<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<div class="w-full relative bg-white border border-gray-300 rounded-lg overflow-hidden" style="height: {altura};">
    {#if loading}
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
            <Loader class="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p class="text-gray-600 font-medium">Cargando mapa...</p>
        </div>
    {/if}
    
    <div bind:this={mapContainer} class="w-full h-full"></div>

    <!-- Controles -->
    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button 
            onclick={toggleMapStyle} 
            class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 w-full justify-start transition-all"
        >
            <Layers class="w-5 h-5" />
            <span class="text-xs md:text-sm">{currentStyle.includes('satellite') ? 'Satélite' : 'Plano'}</span>
        </button>
        
        <button 
            onclick={toggleCadastreLayers} 
            class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 w-full justify-start transition-all"
        >
            {#if showCadastre}
                <Eye class="w-5 h-5 text-blue-600" />
                <span class="text-xs md:text-sm text-blue-600">Linderos</span>
            {:else}
                <EyeOff class="w-5 h-5 text-gray-400" />
                <span class="text-xs md:text-sm text-gray-500">Linderos</span>
            {/if}
        </button>
    </div>

    <!-- Instrucción -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div class="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Haz clic en el mapa para marcar la ubicación
        </div>
    </div>
</div>

<style>
    :global(body) { 
        margin: 0; 
    }
</style>