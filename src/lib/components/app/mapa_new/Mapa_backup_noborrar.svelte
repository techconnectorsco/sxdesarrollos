<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    
    import * as jsonUbicaciones from '$lib/data/costa_rica_ubicaciones.json';
    const ubicacionesData = jsonUbicaciones.default || jsonUbicaciones;

    import { Loader, Layers, Eye, EyeOff, WholeWord } from 'lucide-svelte';
    
    // --- TURF para cálculos geométricos ---
    import area from '@turf/area';
    import center from '@turf/center'; 
    import bbox from '@turf/bbox';
    import { polygon, featureCollection, feature } from '@turf/helpers';

    mapboxgl.accessToken = import.meta.env.VITE_MapBoxTokenPublic;

    // PROPS
    let { 
        propiedadesActivas = [],
        tipoTransaccion = 'venta',
        altura = '70vh',
        alturaMinima = '600px'
    } = $props<{
        propiedadesActivas?: any[];
        tipoTransaccion?: 'venta' | 'alquiler' | 'remate' | 'proyecto' | 'todos' ;
        altura?: string;
        alturaMinima?: string;
    }>();

    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    
    // Estado
    let idsParaPintar = $state<string[]>([]); 
    let selectedState: { layerId: string; idKey: string; idValue: any } | null = null;
    
    // Estado para el Hover
    let hoveredState: { source: string; sourceLayer: string; id: string | number } | null = null;
    let hoveredGeomId: string | null = null;

    let currentPopup: mapboxgl.Popup | null = null;
    let currentStyle = $state('streets-v12');
    
    let showCadastre = $state(true);
    let showLabels = $state(false);

    // ========================================================
    // ✅ Almacenar marcadores personalizados
    // ========================================================
    let marcadoresActivos: Map<string, mapboxgl.Marker> = new Map();
    
    // ✅ NUEVO: Almacenar intervalos de animación
    let animacionesActivas: Map<string, number> = new Map();

    const COLORS = {
        venta: '#10b981',      // Verde esmeralda
        alquiler: '#3b82f6',   // Azul
        remate: '#ef4444',     // Rojo
        proyecto: '#8b5cf6',   // Morado/Violeta
        azulSelect: '#2563eb',
        baseDark: '#1e293b',
        highlight: '#ef4444'   // ✅ Rojo para highlight/titileo
    };

    // ========================================================
    // ✅ CONFIGURACIÓN DE ZOOM PARA TILESETS (LINDEROS)
    // ========================================================
    const TILESET_ZOOM = {
        minZoom: 15,
        maxZoom: 22
    };

    // ========================================================
    // ✅ FUNCIÓN PARA CREAR MARCADOR SVG PERSONALIZADO
    // ========================================================
    function crearMarcadorSVG(color: string, tamano: number = 40, destacado: boolean = false): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'custom-marker-container';
        container.style.cssText = `
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        // Guardamos el color base como data attribute
        container.dataset.baseColor = color;
        
        // SVG del marcador tipo pin moderno
        container.innerHTML = generarSVGMarcador(color, tamano, destacado);

        // Efecto hover nativo del marcador
        container.addEventListener('mouseenter', () => {
            container.style.transform = 'scale(1.15) translateY(-3px)';
        });
        container.addEventListener('mouseleave', () => {
            if (!container.classList.contains('marker-pulsing')) {
                container.style.transform = 'scale(1) translateY(0)';
            }
        });

        return container;
    }

    // ========================================================
    // ✅ NUEVO: Generar SVG del marcador (separado para poder actualizar)
    // ========================================================
    function generarSVGMarcador(color: string, tamano: number = 40, destacado: boolean = false, pulsing: boolean = false): string {
        const gradientId = `gradient-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <svg width="${tamano}" height="${tamano * 1.3}" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg" 
                 style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); ${pulsing ? 'animation: marker-glow 0.5s ease-in-out infinite alternate;' : ''}"
                 class="marker-svg">
                <!-- Sombra del pin -->
                <ellipse cx="20" cy="50" rx="8" ry="2" fill="rgba(0,0,0,0.2)"/>
                
                <!-- Cuerpo del pin -->
                <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 32 20 32s20-20.954 20-32C40 8.954 31.046 0 20 0z" 
                      fill="${color}" class="marker-body"/>
                
                <!-- Gradiente/brillo -->
                <path d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 32 20 32s20-20.954 20-32C40 8.954 31.046 0 20 0z" 
                      fill="url(#${gradientId})"/>
                
                <!-- Círculo interior blanco -->
                <circle cx="20" cy="18" r="10" fill="white"/>
                
                <!-- Ícono de casa -->
                <path d="M20 10L12 17V25H17V20H23V25H28V17L20 10Z" fill="${color}" class="marker-icon"/>
                
                <!-- Definiciones de gradiente -->
                <defs>
                    <linearGradient id="${gradientId}" x1="0" y1="0" x2="40" y2="52" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="white" stop-opacity="0.3"/>
                        <stop offset="50%" stop-color="white" stop-opacity="0"/>
                        <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
                    </linearGradient>
                </defs>
                
                ${destacado ? `
                    <!-- Anillo de destacado -->
                    <circle cx="20" cy="18" r="16" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4 2">
                        <animateTransform attributeName="transform" type="rotate" from="0 20 18" to="360 20 18" dur="8s" repeatCount="indefinite"/>
                    </circle>
                ` : ''}
                
                ${pulsing ? `
                    <!-- Anillo de pulso para highlight -->
                    <circle cx="20" cy="18" r="18" fill="none" stroke="${COLORS.highlight}" stroke-width="3" opacity="0.8">
                        <animate attributeName="r" values="14;20;14" dur="0.6s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.6s" repeatCount="indefinite"/>
                    </circle>
                ` : ''}
            </svg>
        `;
    }

    // ========================================================
    // ✅ NUEVO: Iniciar animación de titileo en marcador
    // ========================================================
    function iniciarTitileoMarcador(fincaId: string) {
        const marker = marcadoresActivos.get(fincaId);
        if (!marker) return;
        
        const el = marker.getElement();
        const baseColor = el.dataset.baseColor || COLORS[tipoTransaccion] || COLORS.venta;
        const prop = propiedadesConGeometria.find(p => String(p.finca_id) === fincaId);
        
        // Agregar clase para estilos
        el.classList.add('marker-pulsing');
        el.style.transform = 'scale(1.25) translateY(-5px)';
        el.style.zIndex = '1000';
        
        // Colores para el titileo
        const colorHighlight = COLORS.highlight; // Rojo
        let isHighlight = false;
        
        // Limpiar intervalo anterior si existe
        if (animacionesActivas.has(fincaId)) {
            clearInterval(animacionesActivas.get(fincaId));
        }
        
        // Crear intervalo de titileo
        const intervalo = setInterval(() => {
            isHighlight = !isHighlight;
            const colorActual = isHighlight ? colorHighlight : baseColor;
            
            // Actualizar el SVG con el nuevo color
            el.innerHTML = generarSVGMarcador(colorActual, 36, prop?.destacado, true);
        }, 400) as unknown as number; // Cambiar cada 400ms
        
        animacionesActivas.set(fincaId, intervalo);
        
        // Iniciar con el SVG pulsante
        el.innerHTML = generarSVGMarcador(baseColor, 36, prop?.destacado, true);
    }

    // ========================================================
    // ✅ NUEVO: Detener animación de titileo
    // ========================================================
    function detenerTitileoMarcador(fincaId: string) {
        // Limpiar intervalo
        if (animacionesActivas.has(fincaId)) {
            clearInterval(animacionesActivas.get(fincaId));
            animacionesActivas.delete(fincaId);
        }
        
        const marker = marcadoresActivos.get(fincaId);
        if (!marker) return;
        
        const el = marker.getElement();
        const baseColor = el.dataset.baseColor || COLORS[tipoTransaccion] || COLORS.venta;
        const prop = propiedadesConGeometria.find(p => String(p.finca_id) === fincaId);
        
        // Restaurar estado normal
        el.classList.remove('marker-pulsing');
        el.style.transform = 'scale(1) translateY(0)';
        el.style.zIndex = '';
        
        // Restaurar SVG sin animación
        el.innerHTML = generarSVGMarcador(baseColor, 36, prop?.destacado, false);
        
        // Re-agregar event listener del click
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const coords = marker.getLngLat();
            if (prop) handleMarkerClick(prop, [coords.lng, coords.lat]);
        });
    }

    // ========================================================
    // ✅ NUEVO: Detener todas las animaciones
    // ========================================================
    function detenerTodasLasAnimaciones() {
        animacionesActivas.forEach((intervalo, fincaId) => {
            detenerTitileoMarcador(fincaId);
        });
        animacionesActivas.clear();
    }

    // ========================================================
    // ✅ CREAR GeoJSON de propiedades con geometría guardada
    // ========================================================
    let propiedadesConGeometria = $derived(
        propiedadesActivas.filter(p => p.geometria && p.finca_id)
    );

    let geojsonPropiedades = $derived.by(() => {
        const features = propiedadesConGeometria.map(prop => {
            try {
                return feature(prop.geometria, {
                    finca_id: prop.finca_id,
                    titulo: prop.titulo,
                    precio: prop.precio,
                    moneda: prop.moneda,
                    dormitorios: prop.dormitorios,
                    banos: prop.banos,
                    area_construccion_m2: prop.area_construccion_m2,
                    imagen: prop.imagen || prop.imagenes?.[0]?.url,
                    anuncio_id: prop.anuncio_id,
                    destacado: prop.destacado
                });
            } catch (e) {
                console.warn(`Error creando feature para finca ${prop.finca_id}:`, e);
                return null;
            }
        }).filter(Boolean);
        
        return featureCollection(features);
    });

    $effect(() => {
        if (propiedadesActivas && map) actualizarPropiedades();
    });

    $effect(() => {
        if (tipoTransaccion && map) updateMapVisuals();
    });

    // ========================================================
    // ✅ ACTUALIZAR: Cuando cambian las propiedades
    // ========================================================
    $effect(() => {
        if (map && map.isStyleLoaded() && geojsonPropiedades) {
            const source = map.getSource('propiedades-guardadas') as mapboxgl.GeoJSONSource;
            if (source) {
                source.setData(geojsonPropiedades);
            }
            actualizarMarcadores();
        }
    });

    function actualizarPropiedades() {
        idsParaPintar = propiedadesActivas
            .map(p => p.finca_id ? String(p.finca_id) : null)
            .filter(id => id !== null) as string[];
        
        if (map && map.isStyleLoaded()) {
            updateMapVisuals();
            actualizarMarcadores();
        }
    }

    // ========================================================
    // ✅ Actualizar/Crear marcadores personalizados
    // ========================================================
    function actualizarMarcadores() {
        if (!map) return;

        const activeColor = COLORS[tipoTransaccion] || COLORS.venta;
        const propiedadesParaMarcadores = propiedadesConGeometria;

        // IDs actuales
        const idsActuales = new Set(propiedadesParaMarcadores.map(p => String(p.finca_id)));
        
        // Remover marcadores que ya no existen
        marcadoresActivos.forEach((marker, id) => {
            if (!idsActuales.has(id)) {
                // Detener animación si existe
                if (animacionesActivas.has(id)) {
                    clearInterval(animacionesActivas.get(id));
                    animacionesActivas.delete(id);
                }
                marker.remove();
                marcadoresActivos.delete(id);
            }
        });

        // Crear/actualizar marcadores
        propiedadesParaMarcadores.forEach(prop => {
            const fincaId = String(prop.finca_id);
            
            if (marcadoresActivos.has(fincaId)) {
                return;
            }

            // Calcular centro de la geometría
            try {
                const centroFeature = center(feature(prop.geometria));
                const coords = centroFeature.geometry.coordinates as [number, number];

                // Crear elemento del marcador
                const markerElement = crearMarcadorSVG(activeColor, 36, prop.destacado);
                
                // Agregar data attribute para identificación
                markerElement.dataset.fincaId = fincaId;

                // Click en el marcador
                markerElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleMarkerClick(prop, coords);
                });

                // Crear marcador de Mapbox
                const marker = new mapboxgl.Marker({
                    element: markerElement,
                    anchor: 'bottom',
                    offset: [0, 0]
                })
                    .setLngLat(coords)
                    .addTo(map);

                marcadoresActivos.set(fincaId, marker);
            } catch (e) {
                console.warn(`Error creando marcador para ${fincaId}:`, e);
            }
        });

        // console.log(`📍 ${marcadoresActivos.size} marcadores personalizados activos`);
    }

    // ========================================================
    // ✅ Manejar click en marcador
    // ========================================================
    function handleMarkerClick(prop: any, coords: [number, number]) {
        limpiarSeleccion();
        
        const fincaId = String(prop.finca_id);
        
        // Marcar como seleccionado en la capa
        map.setFeatureState(
            { source: 'propiedades-guardadas', id: fincaId },
            { selected: true }
        );
        
        selectedState = { 
            layerId: 'propiedades-guardadas-fill', 
            idKey: 'finca_id', 
            idValue: fincaId 
        };
        
        // Mostrar popup
        const lngLat = new mapboxgl.LngLat(coords[0], coords[1]);
        mostrarPopupRico(prop, lngLat);
        
        // Hacer pequeño zoom al marcador
        map.flyTo({
            center: coords,
            zoom: Math.max(map.getZoom(), 17),
            duration: 800
        });
    }

    // --- FUNCIÓN GLOBAL PARA MANEJAR EL CLICK Y API ---
    function registrarInteraccionParcela(datos: any) {
        localStorage.setItem('parcelaData', JSON.stringify(datos));

        fetch('/api/prioridad-scraping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                geometry: datos.geometry,
                finca_id: datos.finca === 'Sin número' ? null : datos.finca,
                provincia_code: datos.provincia_code,
                canton_code: datos.canton_code,
                distrito_code: datos.distrito_code,
                coordenadas: datos.coordenadas,
                area_calculada: datos.area,
                origen: 'mapa_propiedades_click',
            })
        }).then(res => {
            if (!res.ok) console.warn('Error enviando prioridad scraping:', res.statusText);
            else console.log('Prioridad scraping registrada correctamente');
        }).catch(err => {
            console.error('Error de red al registrar prioridad:', err);
        });
    }

    onMount(() => {
        (window as any).handleParcelaClick = registrarInteraccionParcela;
        actualizarPropiedades();

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
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
        map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
            loadTilesets();
            loadGeometriasGuardadas();
            actualizarMarcadores();
            loading = false;
        });

        // CLICK EN EL MAPA - LIMPIAR SELECCIÓN SI NO ES UNA PARCELA
        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point);
            const isParcel = features.some(f => 
                f.layer.id.startsWith('fill-') || 
                f.layer.id === 'propiedades-guardadas-fill'
            );
            if (!isParcel) limpiarSeleccion();
        });

        map.on('idle', () => {
            const capasActivas = Object.keys(DISTRICT_CONFIG)
                .map(k => `fill-${k}`)
                .filter(id => map.getLayer(id));

            if (capasActivas.length > 0) {
                const featuresEnPantalla = map.queryRenderedFeatures({ layers: capasActivas });
                const coincidencias = featuresEnPantalla
                    .map(f => f.properties?.FINCA || f.properties?.finca_id || f.properties?.id)
                    .filter(idMapa => idsParaPintar.includes(String(idMapa)));

                const unicos = [...new Set(coincidencias)];
                
                if (unicos.length > 0) {
                    // console.log(`🎨 PINTANDO ${unicos.length} PROPIEDADES VISIBLES (tilesets)`);
                }
            }
        });

        return () => {
            // Limpiar animaciones
            detenerTodasLasAnimaciones();
            
            // Limpiar marcadores
            marcadoresActivos.forEach(marker => marker.remove());
            marcadoresActivos.clear();
            
            if (map) map.remove();
            delete (window as any).handleParcelaClick;
        };
    });

    // ========================================================
    // ✅ Cargar capa de geometrías guardadas
    // ========================================================
    function loadGeometriasGuardadas() {
        const activeColor = COLORS[tipoTransaccion] || COLORS.venta;
        
        if (!map.getSource('propiedades-guardadas')) {
            map.addSource('propiedades-guardadas', {
                type: 'geojson',
                data: geojsonPropiedades,
                promoteId: 'finca_id'
            });
        }

        // Capa de relleno (Fill)
        if (!map.getLayer('propiedades-guardadas-fill')) {
            map.addLayer({
                id: 'propiedades-guardadas-fill',
                type: 'fill',
                source: 'propiedades-guardadas',
                paint: {
                    'fill-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect,
                        ['boolean', ['feature-state', 'hover'], false], COLORS.highlight, // ✅ Rojo en hover
                        activeColor
                    ],
                    'fill-opacity': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false], 0.7,
                        ['boolean', ['feature-state', 'hover'], false], 0.6,
                        0.4
                    ]
                }
            });
        }

        // Capa de borde (Line)
        if (!map.getLayer('propiedades-guardadas-line')) {
            map.addLayer({
                id: 'propiedades-guardadas-line',
                type: 'line',
                source: 'propiedades-guardadas',
                paint: {
                    'line-color': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false], '#1e3a8a',
                        ['boolean', ['feature-state', 'hover'], false], COLORS.highlight, // ✅ Rojo en hover
                        activeColor === COLORS.venta ? '#065f46' : (activeColor === COLORS.alquiler ? '#1d4ed8' : '#991b1b')
                    ],
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'selected'], false], 3,
                        ['boolean', ['feature-state', 'hover'], false], 3,
                        2
                    ]
                }
            });
        }

        // Event handlers para la capa de geometrías guardadas
        map.on('click', 'propiedades-guardadas-fill', (e) => {
            if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const fincaId = feature.properties?.finca_id;
                const prop = propiedadesActivas.find(p => String(p.finca_id) === String(fincaId));
                
                if (prop) {
                    limpiarSeleccion();
                    
                    map.setFeatureState(
                        { source: 'propiedades-guardadas', id: fincaId },
                        { selected: true }
                    );
                    
                    selectedState = { 
                        layerId: 'propiedades-guardadas-fill', 
                        idKey: 'finca_id', 
                        idValue: fincaId 
                    };
                    
                    mostrarPopupRico(prop, e.lngLat);
                }
            }
        });

        map.on('mouseenter', 'propiedades-guardadas-fill', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (e.features && e.features.length > 0) {
                const fincaId = e.features[0].properties?.finca_id;
                if (fincaId && fincaId !== hoveredGeomId) {
                    if (hoveredGeomId) {
                        map.setFeatureState(
                            { source: 'propiedades-guardadas', id: hoveredGeomId },
                            { hover: false }
                        );
                        detenerTitileoMarcador(hoveredGeomId);
                    }
                    hoveredGeomId = fincaId;
                    map.setFeatureState(
                        { source: 'propiedades-guardadas', id: fincaId },
                        { hover: true }
                    );
                    // ✅ Iniciar titileo del marcador al hacer hover en el mapa también
                    iniciarTitileoMarcador(fincaId);
                }
            }
        });

        map.on('mouseleave', 'propiedades-guardadas-fill', () => {
            map.getCanvas().style.cursor = '';
            if (hoveredGeomId) {
                map.setFeatureState(
                    { source: 'propiedades-guardadas', id: hoveredGeomId },
                    { hover: false }
                );
                detenerTitileoMarcador(hoveredGeomId);
                hoveredGeomId = null;
            }
        });

        // console.log(`✅ Capa de geometrías guardadas cargada`);
    }

    // --- LÓGICA DE HOVER desde la Card ---
    export function highlightProperty(prop: any) {
        clearHighlight(); 

        if (!prop || !prop.finca_id) return;
        const targetId = String(prop.finca_id);

        // ✅ NUEVO: Iniciar animación de titileo en el marcador
        iniciarTitileoMarcador(targetId);

        // Resaltar geometría guardada
        if (prop.geometria) {
            hoveredGeomId = targetId;
            map.setFeatureState(
                { source: 'propiedades-guardadas', id: targetId },
                { hover: true }
            );
            return;
        }

        // Buscar en tilesets
        for (const [key, config] of Object.entries(DISTRICT_CONFIG)) {
            const sourceId = `source-${key}`;
            if (!map.getSource(sourceId)) continue;

            const features = map.querySourceFeatures(sourceId, {
                sourceLayer: config.sourceLayer,
                filter: ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], targetId]
            });

            if (features.length > 0) {
                const feature = features[0];
                if (feature.id) {
                    hoveredState = {
                        source: sourceId,
                        sourceLayer: config.sourceLayer,
                        id: feature.id
                    };
                    map.setFeatureState(
                        { source: sourceId, sourceLayer: config.sourceLayer, id: feature.id },
                        { hover: true }
                    );
                }
                break;
            }
        }
    }

    export function clearHighlight() {
        // ✅ NUEVO: Detener todas las animaciones de titileo
        detenerTodasLasAnimaciones();

        // Limpiar hover de geometrías guardadas
        if (hoveredGeomId) {
            map.setFeatureState(
                { source: 'propiedades-guardadas', id: hoveredGeomId },
                { hover: false }
            );
            hoveredGeomId = null;
        }
        
        // Limpiar hover de tilesets
        if (hoveredState) {
            map.setFeatureState(
                { source: hoveredState.source, sourceLayer: hoveredState.sourceLayer, id: hoveredState.id },
                { hover: false }
            );
            hoveredState = null;
        }
    }

    function updateMapVisuals() {
        if (!map || !map.isStyleLoaded()) return;

        let activeColor = COLORS.venta;
        if (tipoTransaccion === 'alquiler') activeColor = COLORS.alquiler;
        if (tipoTransaccion === 'remate') activeColor = COLORS.remate;
        if (tipoTransaccion === 'proyecto') activeColor = COLORS.proyecto;

        // Actualizar colores de la capa de geometrías guardadas
        if (map.getLayer('propiedades-guardadas-fill')) {
            map.setPaintProperty('propiedades-guardadas-fill', 'fill-color', [
                'case',
                ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect,
                ['boolean', ['feature-state', 'hover'], false], COLORS.highlight,
                activeColor
            ]);
        }

        if (map.getLayer('propiedades-guardadas-line')) {
            map.setPaintProperty('propiedades-guardadas-line', 'line-color', [
                'case',
                ['boolean', ['feature-state', 'selected'], false], '#1e3a8a',
                ['boolean', ['feature-state', 'hover'], false], COLORS.highlight,
                activeColor === COLORS.venta ? '#065f46' : 
                (activeColor === COLORS.alquiler ? '#1d4ed8' : 
                (activeColor === COLORS.proyecto ? '#5b21b6' : '#991b1b'))
            ]);
        }

        // Actualizar tilesets
        Object.keys(DISTRICT_CONFIG).forEach(key => {
            if (map.getLayer(`fill-${key}`)) {
                map.setPaintProperty(`fill-${key}`, 'fill-color', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect,
                    ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], activeColor,
                    COLORS.baseDark
                ]);
                map.setPaintProperty(`fill-${key}`, 'fill-opacity', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], 0.6,
                    ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], 0.5,
                    0
                ]);
            }

            if (map.getLayer(`line-${key}`)) {
                map.setPaintProperty(`line-${key}`, 'line-width', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], 3,
                    ['boolean', ['feature-state', 'hover'], false], 4,
                    0.5
                ]);
                
                map.setPaintProperty(`line-${key}`, 'line-color', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], '#1e3a8a',
                    ['boolean', ['feature-state', 'hover'], false], COLORS.highlight,
                    currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8'
                ]);
            }
            
            if (map.getLayer(`marker-${key}`)) {
                map.setFilter(`marker-${key}`, ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]]);
            }
        });

        // Recrear marcadores con nuevo color si cambió el tipo
        recrearMarcadoresConColor(activeColor);
    }

    // ========================================================
    // ✅ Recrear marcadores cuando cambia el color
    // ========================================================
    function recrearMarcadoresConColor(nuevoColor: string) {
        marcadoresActivos.forEach((marker, fincaId) => {
            const prop = propiedadesConGeometria.find(p => String(p.finca_id) === fincaId);
            if (!prop) return;

            const coords = marker.getLngLat();
            
            // Crear nuevo elemento con el color actualizado
            const nuevoElemento = crearMarcadorSVG(nuevoColor, 36, prop.destacado);
            nuevoElemento.dataset.fincaId = fincaId;
            
            nuevoElemento.addEventListener('click', (e) => {
                e.stopPropagation();
                handleMarkerClick(prop, [coords.lng, coords.lat]);
            });

            // Remover marcador antiguo y crear nuevo
            marker.remove();
            
            const nuevoMarker = new mapboxgl.Marker({
                element: nuevoElemento,
                anchor: 'bottom'
            })
                .setLngLat(coords)
                .addTo(map);

            marcadoresActivos.set(fincaId, nuevoMarker);
        });
    }

    // ========================================================
    // ✅ MEJORADO: flyToProperty usa geometría guardada primero
    // ========================================================
    export function flyToProperty(prop: any) {
        if (mapContainer) mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const targetId = String(prop.finca_id);
        
        // PRIMERO: Si tiene geometría guardada, usarla directamente
        if (prop.geometria) {
            // console.log(`🚀 Volando a ${targetId} usando geometría guardada`);
            
            try {
                const geom = prop.geometria;
                const bounds = bbox(geom);
                const centroFeature = center(feature(geom));
                const coords = centroFeature.geometry.coordinates as [number, number];

                map.fitBounds(
                    [[bounds[0], bounds[1]], [bounds[2], bounds[3]]],
                    {
                        padding: { top: 100, bottom: 100, left: 100, right: 100 },
                        maxZoom: 19,
                        duration: 1500
                    }
                );

                map.once('moveend', () => {
                    limpiarSeleccion();
                    
                    map.setFeatureState(
                        { source: 'propiedades-guardadas', id: targetId },
                        { selected: true }
                    );
                    
                    selectedState = { 
                        layerId: 'propiedades-guardadas-fill', 
                        idKey: 'finca_id', 
                        idValue: targetId 
                    };
                    
                    // Resaltar el marcador con titileo temporal
                    iniciarTitileoMarcador(targetId);
                    setTimeout(() => detenerTitileoMarcador(targetId), 2000);
                    
                    const lngLat = new mapboxgl.LngLat(coords[0], coords[1]);
                    mostrarPopupRico(prop, lngLat);
                });
                
                return;
            } catch (e) {
                console.error("Error usando geometría guardada:", e);
            }
        }

        // FALLBACK: Buscar en tilesets
        // console.log(`🔍 Buscando ${targetId} en tilesets...`);
        
        let foundFeature = null;
        let foundLayerKey = '';

        for (const [key, config] of Object.entries(DISTRICT_CONFIG)) {
            const sourceId = `source-${key}`;
            if (!map.getSource(sourceId)) continue; 

            const features = map.querySourceFeatures(sourceId, { sourceLayer: config.sourceLayer });
            const match = features.find(f => {
                const props = f.properties || {};
                const val = props.FINCA || props.finca_id || props.finca || props.id || props.OBJECTID;
                return String(val) === targetId;
            });

            if (match) {
                foundFeature = match;
                foundLayerKey = key;
                break;
            }
        }

        if (foundFeature) {
            try {
                const poly = polygon(foundFeature.geometry.coordinates);
                const centro = center(poly); 
                const coords = centro.geometry.coordinates as [number, number];

                map.flyTo({ center: coords, zoom: 19, speed: 1.6, curve: 1 });

                map.once('moveend', () => {
                    const layerId = `fill-${foundLayerKey}`;
                    const lineLayerId = `line-${foundLayerKey}`;
                    const markerId = `marker-${foundLayerKey}`;
                    const lngLat = new mapboxgl.LngLat(coords[0], coords[1]);
                    handleSelectFeature(foundFeature, layerId, lineLayerId, markerId, lngLat);
                });
            } catch (e) { console.error("Error geometría:", e); }
        } else {
            console.warn("⚠️ Parcela no encontrada en tilesets ni tiene geometría guardada.");
        }
    }

    function loadTilesets(addListeners = true, isSatellite = false) {
        const lineColor = isSatellite ? '#ffffff' : '#94a3b8';
        const lineOpacity = isSatellite ? 0.7 : 0.6;
        const cadastreVisibility = showCadastre ? 'visible' : 'none';

        let activeColor = COLORS.venta;
        if (tipoTransaccion === 'alquiler') activeColor = COLORS.alquiler;
        if (tipoTransaccion === 'remate') activeColor = COLORS.remate;
        if (tipoTransaccion === 'proyecto') activeColor = COLORS.proyecto;

        Object.entries(DISTRICT_CONFIG).forEach(([key, config]) => {
            const sourceId = `source-${key}`;
            const layerId = `fill-${key}`;
            const lineLayerId = `line-${key}`;
            const labelLayerId = `label-${key}`;
            const markerId = `marker-${key}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { type: 'vector', url: config.tilesetUrl, promoteId: 'FINCA' });
            }

            // Fill
            if (!map.getLayer(layerId)) {
                map.addLayer({
                    id: layerId, 
                    type: 'fill', 
                    source: sourceId, 
                    'source-layer': config.sourceLayer,
                    minzoom: TILESET_ZOOM.minZoom,
                    maxzoom: TILESET_ZOOM.maxZoom,
                    paint: {
                        'fill-color': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect,
                            ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], activeColor,
                            COLORS.baseDark
                        ],
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 0.6,
                            ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], 0.5,
                            0
                        ]
                    },
                    layout: { 'visibility': cadastreVisibility }
                });
            }

            // Line
            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId, 
                    type: 'line', 
                    source: sourceId, 
                    'source-layer': config.sourceLayer,
                    minzoom: TILESET_ZOOM.minZoom,
                    maxzoom: TILESET_ZOOM.maxZoom,
                    paint: {
                        'line-color': lineColor,
                        'line-width': 0.5,
                        'line-opacity': lineOpacity
                    },
                    layout: { 'visibility': cadastreVisibility }
                });
            }

            if (addListeners) {
                map.on('click', layerId, (e) => {
                    if (e.features && e.features.length > 0) handleSelectFeature(e.features[0], layerId, lineLayerId, markerId, e.lngLat);
                });
                map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
                map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
            }
        });
    }

    function handleSelectFeature(feature: any, fillLayerId: string, lineLayerId: string, markerId: string, lngLat: mapboxgl.LngLat) {
        const props = feature.properties || {};
        
        const fincaInfo = getProperty(props, ['finca_id', 'FINCA', 'finca', 'id']);
        const fincaId = fincaInfo ? String(fincaInfo) : 'S/N';
        const idKey = props.FINCA ? 'FINCA' : (props.finca_id ? 'finca_id' : 'id');

        limpiarSeleccion();

        if (idKey && fincaId !== 'S/N') {
            selectedState = { layerId: fillLayerId, idKey, idValue: fincaId };
            const activeColor = tipoTransaccion === 'alquiler' ? COLORS.alquiler : 
                               (tipoTransaccion === 'remate' ? COLORS.remate : 
                               (tipoTransaccion === 'proyecto' ? COLORS.proyecto : COLORS.venta));

            map.setPaintProperty(fillLayerId, 'fill-opacity', [
                'case', ['==', ['get', idKey], fincaId], 0.6,
                ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], 0.5, 0
            ]);
            map.setPaintProperty(fillLayerId, 'fill-color', [
                'case', ['==', ['get', idKey], fincaId], COLORS.azulSelect,
                ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], activeColor, COLORS.baseDark
            ]);

            map.setPaintProperty(lineLayerId, 'line-width', ['case', ['==', ['get', idKey], fincaId], 3, 0.5]);
            map.setPaintProperty(lineLayerId, 'line-color', ['case', ['==', ['get', idKey], fincaId], '#1e3a8a', currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8']);
        }

        const matchedProp = propiedadesActivas.find(p => String(p.finca_id) === String(fincaId));
        if (matchedProp) {
            mostrarPopupRico(matchedProp, lngLat);
        } else {
            mostrarPopupCatastral(props, lngLat, feature);
        }
    }

    function mostrarPopupRico(prop: any, lngLat: mapboxgl.LngLat) {
        if (currentPopup) currentPopup.remove();

        const precioFormateado = prop.precio 
            ? (prop.moneda === 'USD' ? `$${prop.precio.toLocaleString()}` : `₡${prop.precio.toLocaleString()}`)
            : 'Precio no disponible';
        
        const link = obtenerUrlDetalle(prop);
        const popupContent = `
            <div class="info-card rich-popup">
                <div class="card-image" style="background-image: url('${prop.imagenes?.[0]?.url || prop.imagen || '/placeholder.jpg'}');">
                    <span class="price-tag">${precioFormateado}</span>
                    ${prop.destacado ? '<span class="featured-badge">⭐ Destacado</span>' : ''}
                </div>
                <div class="card-body">
                    <h4 class="prop-title">${prop.titulo || 'Sin título'}</h4>
                    <div class="meta-row" style="margin-bottom:10px; font-size:12px; color:#666;">
                        <span>${prop.dormitorios || prop.habitaciones || '?'} Hab • ${prop.banos || '?'} Baños • ${prop.area_construccion_m2 || 0} m²</span>
                    </div>
                    <a href="${link}" target="_blank" class="detail-btn">
                        Ver Propiedad 
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                </div>
            </div>
        `;

        currentPopup = new mapboxgl.Popup({ 
            closeButton: false, 
            closeOnClick: true, 
            maxWidth: '300px', 
            className: 'custom-mapbox-popup', 
            anchor: 'bottom', 
            offset: 45,
            autoPan: true, 
            autoPanPadding: { top: 100, bottom: 20, left: 20, right: 20 } 
        })
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(map);
    }

    function mostrarPopupCatastral(props: any, lngLat: mapboxgl.LngLat, feature?: any) {
        if (currentPopup) currentPopup.remove();
        
        let displayArea = props.AREA || props.area || 0;

        if (feature) {
            try {
                const areaCalculada = area(feature);
                displayArea = areaCalculada.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) {
                console.warn('Error calculando área con Turf:', e);
            }
        }

        const fincaNum = props.FINCA || props.finca_id || 'Sin número';

        const datosParcelaStore = {
            finca: fincaNum,
            geometry: feature?.geometry || null,
            area: displayArea,
            provincia_code: props.PROVINCIA || '0',
            canton_code: props.CANTON || '0',
            distrito_code: props.DISTRITO || '0',
            coordenadas: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
            estado: 'Disponible'
        };

        const popupContent = `
        <div class="info-card cadastral-popup">
            <div class="cadastral-header">
                <div class="icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                <div class="footer-note">Sin oferta activa</div>
                <a href="/parcelas/${fincaNum}" 
                   target="_blank"
                   onclick="window.handleParcelaClick(${JSON.stringify(datosParcelaStore).replace(/"/g, '&quot;')})"
                   class="cta-button">
                   Ver Detalles →
                </a>
            </div>
        </div>
        `;
        
        currentPopup = new mapboxgl.Popup({ 
            closeButton: false, 
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

    function limpiarSeleccion() {
        // Detener animaciones
        detenerTodasLasAnimaciones();

        // Limpiar selección de geometrías guardadas
        if (selectedState?.layerId === 'propiedades-guardadas-fill') {
            map.setFeatureState(
                { source: 'propiedades-guardadas', id: selectedState.idValue },
                { selected: false }
            );
            selectedState = null;
            if (currentPopup) currentPopup.remove();
            return;
        }
        
        // Limpiar selección de tilesets
        if (selectedState) {
            const { layerId, idKey, idValue } = selectedState;
            const activeColor = tipoTransaccion === 'alquiler' ? COLORS.alquiler : 
                               (tipoTransaccion === 'remate' ? COLORS.remate : 
                               (tipoTransaccion === 'proyecto' ? COLORS.proyecto : COLORS.venta));

            map.setPaintProperty(layerId, 'fill-opacity', [
                'case', ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], 0.5, 0
            ]);
            map.setPaintProperty(layerId, 'fill-color', [
                'case', ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], ['literal', idsParaPintar]], activeColor, COLORS.baseDark
            ]);
            
            const lineLayerId = layerId.replace('fill-', 'line-');
            if (map.getLayer(lineLayerId)) {
                map.setPaintProperty(lineLayerId, 'line-width', 0.5);
                map.setPaintProperty(lineLayerId, 'line-color', currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8');
            }
            selectedState = null;
        }
        if (currentPopup) currentPopup.remove();
    }

    function getProperty(props: any, candidates: string[]) {
        for (const candidate of candidates) {
            if (props[candidate] !== undefined) return props[candidate];
        }
        return null;
    }

    function toggleMapStyle() {
        const newStyle = currentStyle.includes('satellite') ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12';
        currentStyle = newStyle;
        map.setStyle(newStyle);
        map.once('style.load', () => {
            loadTilesets(true, newStyle.includes('satellite'));
            loadGeometriasGuardadas();
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

    function obtenerUrlDetalle(prop: any) {
        if (tipoTransaccion === 'remate') return `/remates/${prop.id}`;
        else if (tipoTransaccion === 'alquiler') return `/alquileres/${prop.anuncio_id || prop.id}`;
        else if (tipoTransaccion === 'proyecto') return `/proyectos/${prop.anuncio_id || prop.id}`;
        else return `/propiedades-venta/${prop.anuncio_id || prop.id}`;
    }
</script>

<svelte:head>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
</svelte:head>

<div class="w-full relative bg-white border-b border-gray-200" style="height: {altura}; min-height: {alturaMinima};">
    {#if loading}
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
            <Loader class="w-10 h-10 text-gray-800 animate-spin mb-3" />
            <p class="text-gray-600 font-medium">Cargando mapa...</p>
        </div>
    {/if}
    
    <div bind:this={mapContainer} class="w-full h-full"></div>

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button onclick={toggleMapStyle} class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 w-full justify-start transition-all">
            <Layers class="w-5 h-5" />
            <span class="text-xs md:text-sm">{currentStyle.includes('satellite') ? 'Satélite' : 'Plano'}</span>
        </button>
        <button onclick={toggleCadastreLayers} class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2 w-full justify-start transition-all">
            {#if showCadastre}<Eye class="w-5 h-5 text-blue-600" /><span class="text-xs md:text-sm text-blue-600">Linderos</span>{:else}<EyeOff class="w-5 h-5 text-gray-400" /><span class="text-xs md:text-sm text-gray-500">Linderos</span>{/if}
        </button>
    </div>
    
    {#if idsParaPintar.length > 0 || propiedadesConGeometria.length > 0}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div class="bg-white/90 backdrop-blur border border-gray-200 shadow-xl rounded-full px-6 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: {tipoTransaccion === 'alquiler' ? COLORS.alquiler : (tipoTransaccion === 'remate' ? COLORS.remate : (tipoTransaccion === 'proyecto' ? COLORS.proyecto : COLORS.venta))};"></span>
                    <span class="text-sm font-bold text-gray-700">
                        {idsParaPintar.length} {tipoTransaccion === 'venta' ? 'En Venta' : (tipoTransaccion === 'alquiler' ? 'En Alquiler' : (tipoTransaccion === 'proyecto' ? 'Proyectos' : 'Remates'))}
                    </span>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) { margin: 0; }

    /* === MARCADORES PERSONALIZADOS === */
    :global(.custom-marker-container) {
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    :global(.custom-marker-container:hover) {
        z-index: 1000 !important;
    }
    
    /* ✅ NUEVO: Clase para marcador en estado de pulso */
    :global(.custom-marker-container.marker-pulsing) {
        z-index: 1000 !important;
        filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6));
    }

    /* ✅ NUEVO: Animación de brillo/glow para el SVG */
    @keyframes marker-glow {
        0% {
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)) drop-shadow(0 0 4px rgba(239, 68, 68, 0.4));
        }
        100% {
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.8));
        }
    }

    /* === POPUP GLOBAL === */
    :global(.custom-mapbox-popup) {
        z-index: 99999 !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        transform: translateZ(0);
        backface-visibility: hidden;
    }

    :global(.custom-mapbox-popup .mapboxgl-popup-content) {
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3);
        border: 1px solid rgba(0,0,0,0.08);
        background: white;
        overflow: hidden;
        font-family: 'Inter', system-ui, sans-serif;
    }

    :global(.custom-mapbox-popup .mapboxgl-popup-tip) {
        border-top-color: white;
        margin-bottom: -1px;
    }

    :global(.mapboxgl-popup-close-button) {
        display: none;
    }

    /* === POPUP "RICO" === */
    :global(.rich-popup .card-image) {
        height: 140px;
        background-size: cover;
        background-position: center;
        position: relative;
        image-rendering: -webkit-optimize-contrast; 
    }

    :global(.rich-popup .price-tag) {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 700;
        font-size: 14px;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    :global(.rich-popup .featured-badge) {
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #78350f;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    :global(.rich-popup .card-body) {
        padding: 16px;
    }

    :global(.rich-popup .prop-title) {
        font-size: 16px;
        font-weight: 800;
        margin: 0 0 6px;
        color: #111827;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    :global(.rich-popup .detail-btn) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 10px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        margin-top: 12px;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
        transition: transform 0.1s, box-shadow 0.2s;
    }

    :global(.rich-popup .detail-btn:hover) {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.4);
    }

    :global(.rich-popup .detail-btn:active) {
        transform: translateY(0);
    }

    /* === POPUP "SIMPLE" === */
    :global(.info-card:not(.rich-popup) .card-header) {
        background: #1e293b;
        padding: 12px 16px;
        color: white;
        border-bottom: 3px solid #334155;
    }

    :global(.info-card:not(.rich-popup) h3) {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }

    :global(.info-card:not(.rich-popup) .card-body) {
        padding: 16px;
    }

    :global(.info-card:not(.rich-popup) .meta-row) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 4px;
    }

    :global(.info-card:not(.rich-popup) .label) {
        color: #64748b;
        font-weight: 500;
    }

    :global(.info-card:not(.rich-popup) .value) {
        font-weight: 700;
        color: #0f172a;
        text-align: right;
    }

    /* === POPUP CATASTRAL MEJORADO === */
    :global(.custom-mapbox-popup.cadastral .mapboxgl-popup-content) {
        border-radius: 12px;
        padding: 0;
        background: #ffffff;
    }

    :global(.cadastral-popup) {
        font-family: 'Inter', system-ui, sans-serif;
    }

    :global(.cadastral-popup .cadastral-header) {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    :global(.cadastral-popup .icon-box) {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(37, 99, 235, 0.2);
        border-radius: 8px;
        color: #2563eb;
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
        color: #7c3aed;
        background: rgba(124, 58, 237, 0.08);
        padding: 8px 10px;
        border-radius: 6px;
        border-left: 2px solid #7c3aed;
        margin-bottom: 10px;
        font-weight: 600;
    }

    :global(.cadastral-popup .cta-button) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        padding: 9px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s ease;
        cursor: pointer;
    }

    :global(.cadastral-popup .cta-button:hover) {
        transform: translateY(-1px);
        box-shadow: 0 6px 12px -1px rgba(37, 99, 235, 0.4);
    }

    :global(.cadastral-popup .cta-button:active) {
        transform: translateY(0);
    }
</style>