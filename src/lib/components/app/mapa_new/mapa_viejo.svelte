<script lang="ts">
    import { onMount } from 'svelte';
    import mapboxgl from 'mapbox-gl';
    import { DISTRICT_CONFIG } from '$lib/data/map_config';
    import { buscarPropiedadFlexible, getProvinciaCode } from '$lib/utils/provincia_utils';
    
    import { Loader, Layers, Eye, EyeOff } from 'lucide-svelte';
    
    import area from '@turf/area';
    import center from '@turf/center'; 
    import { polygon } from '@turf/helpers';

    mapboxgl.accessToken = import.meta.env.VITE_MapBoxTokenPublic;

    // PROPS
    let { 
        propiedadesActivas = [],
        tipoTransaccion = 'venta',
        altura = '70vh',
        alturaMinima = '600px'
    } = $props<{
        propiedadesActivas?: any[];
        tipoTransaccion?: 'venta' | 'alquiler' | 'remate';
        altura?: string;
        alturaMinima?: string;
    }>();

    let mapContainer: HTMLDivElement;
    let map: mapboxgl.Map;
    let loading = $state(true);
    let mapReady = $state(false);
    
    let selectedState: { layerId: string; idKey: string; idValue: any } | null = null;
    let hoveredState: { source: string; sourceLayer: string; id: string | number } | null = null;
    let currentPopup: mapboxgl.Popup | null = null;
    let currentStyle = $state('streets-v12');
    
    let showCadastre = $state(true);
    let showLabels = $state(true);

    const COLORS = {
        venta: '#10b981',
        alquiler: '#ff8000',
        remate: '#ef4444',
        azulSelect: '#2563eb',
        baseDark: '#1e293b'
    };

    // 1. GENERACIÓN DE CLAVES ÚNICAS (Finca_Provincia)
    // Esto asegura que la Finca 100 de San José no pinte la Finca 100 de Alajuela
    let clavesParaPintar = $derived.by(() => {
        return propiedadesActivas
            .map(p => {
                if (!p.finca_id) return null;
                const provCode = getProvinciaCode(p.provincia);
                if (!provCode) return null; // Si no hay provincia, no podemos asegurar el match
                
                // Formato: "12345_1"
                return `${String(p.finca_id)}_${provCode}`;
            })
            .filter((key): key is string => key !== null);
    });

    $effect(() => {
        const _claves = clavesParaPintar;
        const _tipo = tipoTransaccion;
        if (mapReady && map?.isStyleLoaded()) {
            updateMapVisuals();
        }
    });

    // 2. HELPER CRÍTICO: Expresión de filtrado para Mapbox
    // Incluye el parche para San José (Provincia 0 -> 1)
    function getMatchExpression(claves: string[], layerKey: string) {
        // Obtenemos el valor crudo de provincia del mapa. Si es null, usa '0'
        const rawProvincia = ['to-string', ['coalesce', ['get', 'PROVINCIA'], ['get', 'provincia'], '0']];

        // CORRECCIÓN SAN JOSÉ:
        // Si la capa es '1' (San José) y el mapa dice '0', lo forzamos a ser '1'.
        // En cualquier otro caso (otras provincias), usamos lo que diga el mapa.
        const correctedProvincia = layerKey === '1' 
            ? ['case', ['==', rawProvincia, '0'], '1', rawProvincia]
            : rawProvincia;

        // Construimos la clave "FINCA_PROVINCIA" y verificamos si está en nuestra lista
        return [
            'in',
            ['concat', 
                ['to-string', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']]], 
                '_', 
                correctedProvincia
            ],
            ['literal', claves]
        ];
    }

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
        }).catch(err => console.error('Error:', err));
    }

    onMount(() => {
        (window as any).handleParcelaClick = registrarInteraccionParcela;

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-84.0907, 9.9347],
            zoom: 13,
            minZoom: 8,
            maxZoom: 22,
            attributionControl: false
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

        map.on('load', () => {
            map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (error, image) => {
                if (error) throw error;
                if (!map.hasImage('custom-marker')) map.addImage('custom-marker', image!);
                loadTilesets();
                loading = false;
                mapReady = true;
            });
        });

        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point);
            const isParcel = features.some(f => f.layer.id.startsWith('fill-'));
            if (!isParcel) limpiarSeleccion();
        });

        return () => {
            if (map) map.remove();
            delete (window as any).handleParcelaClick;
        };
    });

    export function highlightProperty(prop: any) {
        clearHighlight();
        if (!prop || !prop.finca_id) return;
        const targetId = String(prop.finca_id);
        const targetProv = getProvinciaCode(prop.provincia);

        for (const [key, config] of Object.entries(DISTRICT_CONFIG)) {
            // Solo buscar en la capa correcta si sabemos la provincia
            if (targetProv && key !== targetProv) continue;

            const sourceId = `source-${key}`;
            if (!map.getSource(sourceId)) continue;

            const features = map.querySourceFeatures(sourceId, {
                sourceLayer: config.sourceLayer,
                filter: ['in', ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], targetId]
            });

            if (features.length > 0 && features[0].id) {
                // Validación extra: Si es capa San José (1) y feature dice 0, es válido.
                // Si es otra capa, debe coincidir.
                const p = features[0].properties || {};
                const provMap = String(p.PROVINCIA || p.provincia || '0');
                
                let isMatch = true;
                if (targetProv) {
                    if (key === '1' && provMap === '0') isMatch = true; // Parche San José
                    else isMatch = (provMap === targetProv);
                }

                if (isMatch) {
                    hoveredState = { source: sourceId, sourceLayer: config.sourceLayer, id: features[0].id };
                    map.setFeatureState(
                        { source: sourceId, sourceLayer: config.sourceLayer, id: features[0].id },
                        { hover: true }
                    );
                    break;
                }
            }
        }
    }

    export function clearHighlight() {
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

        const claves = clavesParaPintar;

        Object.keys(DISTRICT_CONFIG).forEach(key => {
            // Pasamos 'key' para activar el parche de San José solo en la capa 1
            const matchExpression = getMatchExpression(claves, key);

            if (map.getLayer(`fill-${key}`)) {
                map.setPaintProperty(`fill-${key}`, 'fill-color', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect,
                    matchExpression, activeColor,
                    COLORS.baseDark
                ]);
                map.setPaintProperty(`fill-${key}`, 'fill-opacity', [
                    'case',
                    ['boolean', ['feature-state', 'selected'], false], 0.6,
                    matchExpression, 0.5,
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
                    ['boolean', ['feature-state', 'hover'], false], '#2563eb',
                    currentStyle.includes('satellite') ? '#ffffff' : '#94a3b8'
                ]);
            }
            
            if (map.getLayer(`marker-${key}`)) {
                map.setFilter(`marker-${key}`, matchExpression);
            }

            if (map.getLayer(`label-${key}`)) {
                map.setFilter(`label-${key}`, matchExpression);
            }
        });
    }

    export function flyToProperty(prop: any) {
        if (mapContainer) mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const targetId = String(prop.finca_id);
        const targetProv = getProvinciaCode(prop.provincia);
        // Intentamos obtener el código de cantón esperado para validación extra
        // (Necesitas importar getCantonCode en el script si quieres usarlo aquí, pero es opcional)
        // import { getCantonCode } from '$lib/utils/provincia_utils';
        // const targetCanton = getCantonCode(targetProv, prop.canton); 

        let foundFeature = null;
        let foundLayerKey = '';

        for (const [key, config] of Object.entries(DISTRICT_CONFIG)) {
            if (targetProv && key !== targetProv) continue;

            const sourceId = `source-${key}`;
            if (!map.getSource(sourceId)) continue;

            const features = map.querySourceFeatures(sourceId, { sourceLayer: config.sourceLayer });
            const match = features.find(f => {
                const p = f.properties || {};
                const idMatch = String(p.FINCA || p.finca_id || p.finca || p.id) === targetId;
                if (!idMatch) return false;
                
                if (targetProv) {
                    const provMap = String(p.PROVINCIA || p.provincia || '0');
                    if (key === '1' && provMap === '0') return true; 
                    
                    // Si quisieras validar cantón aquí también:
                    /*
                    const cantonMap = String(p.CANTON || p.canton || '0');
                    if (targetCanton && cantonMap !== '0' && cantonMap !== targetCanton) return false;
                    */
                    
                    return provMap === targetProv;
                }
                return true;
            });

            if (match) { foundFeature = match; foundLayerKey = key; break; }
        
        }

        if (foundFeature) {
            try {
                const poly = polygon(foundFeature.geometry.coordinates);
                const coords = center(poly).geometry.coordinates as [number, number];
                map.flyTo({ center: coords, zoom: 19, speed: 1.6 });
                map.once('moveend', () => {
                    handleSelectFeature(foundFeature, `fill-${foundLayerKey}`, `line-${foundLayerKey}`, `marker-${foundLayerKey}`, new mapboxgl.LngLat(coords[0], coords[1]));
                });
            } catch (e) { console.error("Error geometría:", e); }
        }
    }

    function loadTilesets(addListeners = true, isSatellite = false) {
        const lineColor = isSatellite ? '#ffffff' : '#94a3b8';
        let activeColor = tipoTransaccion === 'alquiler' ? COLORS.alquiler : tipoTransaccion === 'remate' ? COLORS.remate : COLORS.venta;
        
        const claves = clavesParaPintar;

        Object.entries(DISTRICT_CONFIG).forEach(([key, config]) => {
            // Generar expresión específica para esta capa (clave)
            const matchExpression = getMatchExpression(claves, key);

            const sourceId = `source-${key}`;
            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, { type: 'vector', url: config.tilesetUrl, promoteId: 'FINCA' });
            }

            if (!map.getLayer(`fill-${key}`)) {
                map.addLayer({
                    id: `fill-${key}`, type: 'fill', source: sourceId, 'source-layer': config.sourceLayer,
                    paint: {
                        'fill-color': [
                            'case', 
                            ['boolean', ['feature-state', 'selected'], false], COLORS.azulSelect, 
                            matchExpression, activeColor, 
                            COLORS.baseDark
                        ],
                        'fill-opacity': [
                            'case', 
                            ['boolean', ['feature-state', 'selected'], false], 0.6, 
                            matchExpression, 0.5, 
                            0
                        ]
                    },
                    layout: { visibility: showCadastre ? 'visible' : 'none' }
                });
            }

            if (!map.getLayer(`line-${key}`)) {
                map.addLayer({
                    id: `line-${key}`, type: 'line', source: sourceId, 'source-layer': config.sourceLayer,
                    paint: { 'line-color': lineColor, 'line-width': 0.5, 'line-opacity': 0.6 },
                    layout: { visibility: showCadastre ? 'visible' : 'none' }
                });
            }

            if (!map.getLayer(`label-${key}`)) {
                map.addLayer({
                    id: `label-${key}`, type: 'symbol', source: sourceId, 'source-layer': config.sourceLayer,
                    filter: matchExpression,
                    layout: { 'text-field': ['coalesce', ['get', 'FINCA'], ['get', 'finca_id'], ['get', 'id']], 'text-size': 10, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], visibility: showLabels ? 'visible' : 'none' },
                    paint: { 'text-color': '#fff', 'text-halo-color': '#000', 'text-halo-width': 1.5 }
                });
            }

            if (!map.getLayer(`marker-${key}`)) {
                map.addLayer({
                    id: `marker-${key}`, type: 'symbol', source: sourceId, 'source-layer': config.sourceLayer,
                    filter: matchExpression,
                    layout: { 'icon-image': 'custom-marker', 'icon-size': 0.5, 'icon-allow-overlap': true, visibility: showLabels ? 'visible' : 'none' }
                });
            }

            if (addListeners) {
                map.on('click', `fill-${key}`, (e) => {
                    if (e.features?.length) handleSelectFeature(e.features[0], `fill-${key}`, `line-${key}`, `marker-${key}`, e.lngLat);
                });
                map.on('mouseenter', `fill-${key}`, () => map.getCanvas().style.cursor = 'pointer');
                map.on('mouseleave', `fill-${key}`, () => map.getCanvas().style.cursor = '');
            }
        });
    }

    function handleSelectFeature(feature: any, fillLayerId: string, lineLayerId: string, markerId: string, lngLat: mapboxgl.LngLat) {
        const props = feature.properties || {};
        const fincaId = String(props.FINCA || props.finca_id || props.finca || props.id || 'S/N');
        
        // 1. Obtener provincia del tileset
        let provinciaTileset = String(props.PROVINCIA || props.provincia || '0');
        
        // 2. NUEVO: Obtener cantón del tileset
        // Mapbox suele traer esto como "CANTON", "canton", "Canton" o "canton_id"
        let cantonTileset = String(props.CANTON || props.canton || props.Canton || props.canton_id || '0');

        // 3. APLICAR PARCHE SAN JOSÉ (Provincia)
        const layerKey = fillLayerId.replace('fill-', '');
        if (layerKey === '1' && provinciaTileset === '0') {
            provinciaTileset = '1';
        }

        const idKey = props.FINCA ? 'FINCA' : props.finca_id ? 'finca_id' : 'id';
        const claves = clavesParaPintar;
        const activeColor = tipoTransaccion === 'alquiler' ? COLORS.alquiler : tipoTransaccion === 'remate' ? COLORS.remate : COLORS.venta;

        // Limpiar anterior (Lógica visual existente...)
        if (selectedState) {
            const prevKey = selectedState.layerId.replace('fill-', '');
            const prevExpr = getMatchExpression(claves, prevKey); // Usar getMatchExpression del código anterior
            map.setPaintProperty(selectedState.layerId, 'fill-opacity', ['case', prevExpr, 0.5, 0]);
            map.setPaintProperty(selectedState.layerId, 'fill-color', ['case', prevExpr, activeColor, COLORS.baseDark]);
            const prevLine = selectedState.layerId.replace('fill-', 'line-');
            if (map.getLayer(prevLine)) {
                map.setPaintProperty(prevLine, 'line-width', 0.5);
                map.setPaintProperty(prevLine, 'line-color', currentStyle.includes('satellite') ? '#fff' : '#94a3b8');
            }
            selectedState = null;
        }

        // Nueva selección visual (Lógica visual existente...)
        if (fincaId !== 'S/N') {
            const currentExpr = getMatchExpression(claves, layerKey);
            selectedState = { layerId: fillLayerId, idKey, idValue: fincaId };
            map.setPaintProperty(fillLayerId, 'fill-opacity', ['case', ['==', ['get', idKey], fincaId], 0.6, currentExpr, 0.5, 0]);
            map.setPaintProperty(fillLayerId, 'fill-color', ['case', ['==', ['get', idKey], fincaId], COLORS.azulSelect, currentExpr, activeColor, COLORS.baseDark]);
            map.setPaintProperty(lineLayerId, 'line-width', ['case', ['==', ['get', idKey], fincaId], 3, 0.5]);
            map.setPaintProperty(lineLayerId, 'line-color', ['case', ['==', ['get', idKey], fincaId], '#1e3a8a', currentStyle.includes('satellite') ? '#fff' : '#94a3b8']);
        }

        // =========================================================
        // AQUÍ ESTÁ EL CAMBIO CLAVE DE LA BÚSQUEDA
        // =========================================================
        // Ahora pasamos cantonTileset a la función
        const matchedProp = buscarPropiedadFlexible(
            propiedadesActivas, 
            fincaId, 
            provinciaTileset, 
            cantonTileset // <--- NUEVO
        );
        
        if (matchedProp) mostrarPopupRico(matchedProp, lngLat);
        else mostrarPopupCatastral(props, lngLat, feature);
    }

    function mostrarPopupRico(prop: any, lngLat: mapboxgl.LngLat) {
        if (currentPopup) currentPopup.remove();

        const precio = prop.base_price_numeric 
            ? `₡${Number(prop.base_price_numeric).toLocaleString()}`
            : prop.precio ? (prop.moneda === 'USD' ? `$${prop.precio.toLocaleString()}` : `₡${prop.precio.toLocaleString()}`) : 'Precio no disponible';
        
        const link = tipoTransaccion === 'remate' ? `/remates/${prop.id}` : tipoTransaccion === 'alquiler' ? `/alquileres/${prop.anuncio_id || prop.id}` : `/propiedades-venta/${prop.anuncio_id || prop.id}`;
        
        let html = '';
        if (tipoTransaccion === 'remate') {
            html = `<div class="info-card rich-popup"><div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:14px 16px;color:#fff"><div style="font-weight:800;font-size:18px;margin-bottom:4px">${precio}</div><div style="font-size:12px;opacity:0.9">${prop.provincia || ''} • ${prop.canton || ''}</div></div><div style="padding:14px 16px"><h4 style="font-size:14px;font-weight:700;margin:0 0 12px;color:#111827">${prop.naturaleza || 'Propiedad en Remate'}</h4><a href="${link}" target="_blank" style="display:flex;align-items:center;justify-content:center;width:100%;background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);color:#fff;padding:10px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">Ver Remate →</a></div></div>`;
        } else {
            html = `<div class="info-card rich-popup"><div class="card-image" style="background-image:url('${prop.imagenes?.[0]?.url || '/placeholder.jpg'}')"><span class="price-tag">${precio}</span></div><div class="card-body"><h4 class="prop-title">${prop.titulo || 'Sin título'}</h4><div style="margin-bottom:10px;font-size:12px;color:#666">${prop.dormitorios || '?'} Hab • ${prop.banos || '?'} Baños • ${prop.area_construccion_m2 || 0} m²</div><a href="${link}" target="_blank" class="detail-btn">Ver Propiedad →</a></div></div>`;
        }

        currentPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true, maxWidth: '300px', className: 'custom-mapbox-popup', anchor: 'bottom', offset: 35 }).setLngLat(lngLat).setHTML(html).addTo(map);
    }

    function mostrarPopupCatastral(props: any, lngLat: mapboxgl.LngLat, feature?: any) {
        if (currentPopup) currentPopup.remove();
        let displayArea = props.AREA || props.area || 0;
        if (feature) { try { displayArea = area(feature).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch {} }
        const fincaNum = props.FINCA || props.finca_id || 'Sin número';
        const datos = { finca: fincaNum, geometry: feature?.geometry || null, area: displayArea, provincia_code: props.PROVINCIA || '0', canton_code: props.CANTON || '0', distrito_code: props.DISTRITO || '0', coordenadas: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`, estado: 'Disponible' };

        const html = `<div class="info-card cadastral-popup"><div class="cadastral-header"><div class="icon-box"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8H7v8"/></svg></div><div><h3 class="title">Finca #${fincaNum}</h3></div></div><div class="card-body"><div class="data-single"><span class="label">Área</span><span class="value">${displayArea} m²</span></div><div class="footer-note">Sin oferta activa</div><a href="/parcelas/${fincaNum}" target="_blank" onclick="window.handleParcelaClick(${JSON.stringify(datos).replace(/"/g, '&quot;')})" class="cta-button">Ver Detalles →</a></div></div>`;
        
        currentPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '260px', className: 'custom-mapbox-popup cadastral', anchor: 'bottom', offset: 35 }).setLngLat(lngLat).setHTML(html).addTo(map);
    }

    function limpiarSeleccion() {
        if (selectedState) {
            const activeColor = tipoTransaccion === 'alquiler' ? COLORS.alquiler : tipoTransaccion === 'remate' ? COLORS.remate : COLORS.venta;
            const claves = clavesParaPintar;
            
            // Usar la expresión correcta (incluyendo parche SJ) para restaurar
            const layerKey = selectedState.layerId.replace('fill-', '');
            const matchExpression = getMatchExpression(claves, layerKey);

            map.setPaintProperty(selectedState.layerId, 'fill-opacity', ['case', matchExpression, 0.5, 0]);
            map.setPaintProperty(selectedState.layerId, 'fill-color', ['case', matchExpression, activeColor, COLORS.baseDark]);
            
            const line = selectedState.layerId.replace('fill-', 'line-');
            if (map.getLayer(line)) { map.setPaintProperty(line, 'line-width', 0.5); map.setPaintProperty(line, 'line-color', currentStyle.includes('satellite') ? '#fff' : '#94a3b8'); }
            selectedState = null;
        }
        if (currentPopup) currentPopup.remove();
    }

    function toggleMapStyle() {
        const newStyle = currentStyle.includes('satellite') ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12';
        currentStyle = newStyle;
        map.setStyle(newStyle);
        map.once('style.load', () => {
            map.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (_, image) => {
                if (image && !map.hasImage('custom-marker')) map.addImage('custom-marker', image);
                loadTilesets(true, newStyle.includes('satellite'));
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
        <button onclick={toggleMapStyle} class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2">
            <Layers class="w-5 h-5" />
            <span class="text-xs md:text-sm">{currentStyle.includes('satellite') ? 'Satélite' : 'Plano'}</span>
        </button>
        <button onclick={toggleCadastreLayers} class="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2">
            {#if showCadastre}<Eye class="w-5 h-5 text-blue-600" /><span class="text-xs md:text-sm text-blue-600">Linderos</span>{:else}<EyeOff class="w-5 h-5 text-gray-400" /><span class="text-xs md:text-sm text-gray-500">Linderos</span>{/if}
        </button>
    </div>
    
    {#if clavesParaPintar.length > 0}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div class="bg-white/90 backdrop-blur border border-gray-200 shadow-xl rounded-full px-6 py-2 flex items-center gap-3">
                <span class="w-3 h-3 rounded-full" style="background-color: {tipoTransaccion === 'alquiler' ? COLORS.alquiler : (tipoTransaccion === 'remate' ? COLORS.remate : COLORS.venta)};"></span>
                <span class="text-sm font-bold text-gray-700">{clavesParaPintar.length} {tipoTransaccion === 'venta' ? 'En Venta' : (tipoTransaccion === 'alquiler' ? 'En Alquiler' : 'Remates')}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.custom-mapbox-popup) { z-index: 99999 !important; }
    :global(.custom-mapbox-popup .mapboxgl-popup-content) { padding: 0; border-radius: 12px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.08); background: white; overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }
    :global(.custom-mapbox-popup .mapboxgl-popup-tip) { border-top-color: white; }
    :global(.mapboxgl-popup-close-button) { display: none; }
    :global(.rich-popup .card-image) { height: 140px; background-size: cover; background-position: center; position: relative; }
    :global(.rich-popup .price-tag) { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.85); color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px; }
    :global(.rich-popup .card-body) { padding: 16px; }
    :global(.rich-popup .prop-title) { font-size: 16px; font-weight: 800; margin: 0 0 6px; color: #111827; }
    :global(.rich-popup .detail-btn) { display: flex; align-items: center; justify-content: center; width: 100%; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px; }
    :global(.cadastral-popup .cadastral-header) { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); }
    :global(.cadastral-popup .icon-box) { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(37, 99, 235, 0.2); border-radius: 8px; color: #2563eb; }
    :global(.cadastral-popup .title) { margin: 0; font-size: 16px; font-weight: 800; color: white; }
    :global(.cadastral-popup .card-body) { padding: 12px 14px; }
    :global(.cadastral-popup .data-single) { display: flex; justify-content: space-between; margin-bottom: 10px; }
    :global(.cadastral-popup .data-single .label) { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    :global(.cadastral-popup .data-single .value) { font-size: 14px; font-weight: 800; color: #1e293b; }
    :global(.cadastral-popup .footer-note) { font-size: 11px; color: #7c3aed; background: rgba(124, 58, 237, 0.08); padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; font-weight: 600; }
    :global(.cadastral-popup .cta-button) { display: flex; align-items: center; justify-content: center; width: 100%; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 9px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700; }
</style>