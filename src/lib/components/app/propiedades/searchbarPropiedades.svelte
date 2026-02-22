<script lang="ts">
    import { goto, beforeNavigate, afterNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import { UBICACIONES } from '$lib/data/costa_rica_ubicaciones';

    // Props
    interface Props {
        searchParams: any;
    }
    let { searchParams }: Props = $props();

    // 1. DETECTAR RUTA ACTUAL
    function detectarTipoDesdeRuta(): string {
        const currentPath = $page.url.pathname;
        if (currentPath.includes('/alquileres')) return 'alquiler';
        if (currentPath.includes('/remates')) return 'remates';
        if (currentPath.includes('/proyectos')) return 'proyectos';
        if (currentPath.includes('/propiedades-venta')) return 'ventas';
        if (currentPath.includes('/propiedades')) return 'todos';
        return 'ventas';
    }

    // 2. ESTADO
    let busqueda = $state(searchParams?.matricula || searchParams?.q || '');
    let tipoSeleccionado = $state(detectarTipoDesdeRuta());
    let provincia = $state(searchParams?.provincia || '');
    let canton = $state(searchParams?.canton || '');
    let rangoPrecios = $state(searchParams?.rangoPrecios || '');
    let ordenamiento = $state(searchParams?.ordenamiento || 'recientes');

    // ✅ ESTADOS DE LOADING
    let buscandoTexto = $state(false);   // Spinner en input (debounce)
    let navegando = $state(false);        // Spinner en botón (navegación)

    // 3. DATOS DERIVADOS
    let cantones = $derived(
        UBICACIONES.find(p => p.provincia === provincia)?.cantones || []
    );

    // 4. CONFIGURACIONES
    const tiposBusqueda = [
        { id: 'ventas', label: 'Ventas', ruta: '/propiedades-venta' },
        { id: 'alquiler', label: 'Alquiler', ruta: '/alquileres' },
        { id: 'remates', label: 'Remates', ruta: '/remates' },
        { id: 'proyectos', label: 'Proyectos', ruta: '/proyectos' },
        { id: 'todos', label: 'Todos', ruta: '/propiedades' }
    ];

    const rangosPrecios = [
        { id: '', label: 'Todos los precios' },
        { id: '0-50000000', label: '₡0 - ₡50M' },
        { id: '50000000-100000000', label: '₡50M - ₡100M' },
        { id: '100000000-150000000', label: '₡100M - ₡150M' },
        { id: '150000000-200000000', label: '₡150M - ₡200M' },
        { id: '200000000-250000000', label: '₡200M - ₡250M' },
        { id: '250000000-300000000', label: '₡250M - ₡300M' },
        { id: '300000000+', label: 'Más de ₡300M' }
    ];

    const opcionesOrdenamiento = [
        { id: 'recientes', label: 'Más recientes' },
        { id: 'precio-desc', label: 'Precio: Mayor a menor' },
        { id: 'precio-asc', label: 'Precio: Menor a mayor' },
        { id: 'tamano-desc', label: 'Área: Mayor a menor' },
        { id: 'tamano-asc', label: 'Área: Menor a mayor' }
    ];

    // ✅ HOOKS DE NAVEGACIÓN
    beforeNavigate(() => {
        navegando = true;
    });

    afterNavigate(() => {
        navegando = false;
        buscandoTexto = false;
    });

    // ========================================================
    // 5. FUNCIONES DE NAVEGACIÓN
    // ========================================================

    function construirURL(overrides: { provincia?: string; canton?: string } = {}): string {
        const tipoActual = tiposBusqueda.find(t => t.id === tipoSeleccionado);
        if (!tipoActual) return '/propiedades';

        const params = new URLSearchParams();

        if (busqueda.trim()) {
            const esMatricula = /^\d+$/.test(busqueda.trim());
            if (esMatricula) {
                params.set('matricula', busqueda.trim());
            } else {
                params.set('q', busqueda.trim());
            }
        }

        const prov = overrides.provincia !== undefined ? overrides.provincia : provincia;
        const cant = overrides.canton !== undefined ? overrides.canton : canton;
        
        if (prov) params.set('provincia', prov);
        if (cant) params.set('canton', cant);
        
        if (rangoPrecios) params.set('rangoPrecios', rangoPrecios);
        if (ordenamiento && ordenamiento !== 'recientes') params.set('ordenamiento', ordenamiento);

        return params.toString() 
            ? `${tipoActual.ruta}?${params.toString()}`
            : tipoActual.ruta;
    }

    function navegar(overrides: { provincia?: string; canton?: string } = {}) {
        const url = construirURL(overrides);
        goto(url, { replaceState: false, keepFocus: true });
    }

    function cambiarTipo() {
        const tipoActual = tiposBusqueda.find(t => t.id === tipoSeleccionado);
        if (!tipoActual) return;

        const params = new URLSearchParams($page.url.searchParams);
        
        const urlDestino = params.toString() 
            ? `${tipoActual.ruta}?${params.toString()}`
            : tipoActual.ruta;
        
        goto(urlDestino, { replaceState: false, keepFocus: true });
    }

    function cambiarProvincia() {
        canton = '';
        navegar({ provincia, canton: '' });
    }

    function cambiarCanton() {
        if (provincia) {
            navegar();
        }
    }

    function aplicarFiltro() {
        navegar();
    }

    // ========================================================
    // 6. BÚSQUEDA DE TEXTO CON DEBOUNCE
    // ========================================================
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let textoIniciado = false;
    let ultimaBusqueda = searchParams?.matricula || searchParams?.q || '';

    function buscarTextoDebounce() {
        if (debounceTimer) clearTimeout(debounceTimer);
        
        // ✅ Mostrar spinner en input
        buscandoTexto = true;
        
        debounceTimer = setTimeout(() => {
            if (busqueda.trim() !== ultimaBusqueda.trim()) {
                ultimaBusqueda = busqueda.trim();
                navegar();
            } else {
                // Si no hay cambio real, quitar spinner
                buscandoTexto = false;
            }
        }, 400);
    }

    function buscarTextoInmediato() {
        if (debounceTimer) clearTimeout(debounceTimer);
        buscandoTexto = false;
        ultimaBusqueda = busqueda.trim();
        navegar();
    }

    $effect(() => {
        const _ = busqueda;
        
        if (!textoIniciado) {
            textoIniciado = true;
            return;
        }

        buscarTextoDebounce();
    });

    function handleKeyPress(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarTextoInmediato();
        }
    }

    $effect(() => {
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    });
</script>

<div class="searchbar-wrapper">
    <div class="searchbar-container">
        <div class="search-bar">
            <!-- Input de Búsqueda -->
            <div class="input-wrapper">
                <!-- ✅ Ícono o Spinner según estado -->
                {#if buscandoTexto}
                    <svg class="input-icon spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                {:else}
                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                    </svg>
                {/if}
                <input
                    type="text"
                    bind:value={busqueda}
                    placeholder="Ej: finca 123456, casa en escazú, 200m2... (escribe o Enter)"
                    class="input-search"
                    onkeypress={handleKeyPress}
                />
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Select Tipo -->
            <div class="select-wrapper select-tipo">
                <svg class="select-icon select-tipo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                </svg>
                <select bind:value={tipoSeleccionado} class="select-field select-tipo-field" onchange={cambiarTipo}>
                    {#each tiposBusqueda as tipo}
                        <option value={tipo.id}>{tipo.label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Select Provincia -->
            <div class="select-wrapper">
                <svg class="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
                </svg>
                <select bind:value={provincia} class="select-field" onchange={cambiarProvincia}>
                    <option value="">Provincia</option>
                    {#each UBICACIONES as prov}
                        <option value={prov.provincia}>{prov.provincia}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Select Cantón -->
            <div class="select-wrapper">
                <svg class="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clip-rule="evenodd" />
                </svg>
                <select
                    bind:value={canton}
                    class="select-field"
                    disabled={!provincia}
                    onchange={cambiarCanton}
                >
                    <option value="">Cantón</option>
                    {#each cantones as cant}
                        <option value={cant.canton}>{cant.canton}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Select Precio -->
            <div class="select-wrapper select-compact">
                <svg class="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z" />
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 11-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 111.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 01-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 011.653-.713V4.75A.75.75 0 0110 4z" clip-rule="evenodd" />
                </svg>
                <select bind:value={rangoPrecios} class="select-field select-small" onchange={aplicarFiltro}>
                    {#each rangosPrecios as rango}
                        <option value={rango.id}>{rango.label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Select Ordenar -->
            <div class="select-wrapper select-compact">
                <svg class="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z" clip-rule="evenodd" />
                </svg>
                <select bind:value={ordenamiento} class="select-field select-small" onchange={aplicarFiltro}>
                    {#each opcionesOrdenamiento as opcion}
                        <option value={opcion.id}>{opcion.label}</option>
                    {/each}
                </select>
            </div>
            
            <!-- ✅ Botón con Spinner durante navegación -->
            <button 
                class="btn-search" 
                class:btn-loading={navegando}
                onclick={buscarTextoInmediato} 
                type="button" 
                title="Buscar ahora"
                disabled={navegando}
            >
                {#if navegando}
                    <svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                    </svg>
                {/if}
                <span class="btn-text">{navegando ? 'Buscando...' : 'Buscar'}</span>
            </button>
        </div>
    </div>
</div>

<style>
    .searchbar-wrapper {
        position: relative;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 16px 12px;
    }
    
    .searchbar-container {
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .search-bar {
        display: flex;
        align-items: center;
        gap: 0;
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        transition: all 0.2s;
    }
    
    .search-bar:focus-within {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        min-width: 0;
    }
    
    .input-icon,
    .select-icon {
        position: absolute;
        left: 16px;
        width: 18px;
        height: 18px;
        color: #6b7280;
        pointer-events: none;
        z-index: 1;
    }
    
    .input-search {
        width: 100%;
        padding: 14px 16px 14px 44px;
        border: none;
        background: transparent;
        font-size: 15px;
        color: #1f2937;
        outline: none;
    }
    
    .input-search::placeholder {
        color: #9ca3af;
    }
    
    .divider {
        width: 1px;
        height: 32px;
        background: rgba(229, 231, 235, 0.6);
        flex-shrink: 0;
        display: none;
    }
    
    .select-wrapper {
        position: relative;
        display: none;
        align-items: center;
        flex-shrink: 0;
    }
    
    .select-field {
        padding: 14px 36px 14px 44px;
        border: none;
        background: transparent;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        outline: none;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        min-width: 140px;
    }
    
    .select-small {
        min-width: 180px;
        padding: 14px 32px 14px 44px;
        font-size: 13px;
    }
    
    .select-field:disabled {
        color: #9ca3af;
        cursor: not-allowed;
    }
    
    .btn-search {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 24px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        border-radius: 0 12px 12px 0;
    }
    
    .btn-search:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    
    .btn-search:active:not(:disabled) {
        transform: scale(0.98);
    }
    
    .btn-search:disabled {
        cursor: wait;
        opacity: 0.9;
    }
    
    .btn-search svg {
        width: 18px;
        height: 18px;
    }
    
    /* ✅ SPINNER ANIMATION */
    .spinner {
        animation: spin 1s linear infinite;
        color: currentColor;
    }
    
    .input-icon.spinner {
        color: #3b82f6;
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    
    .btn-loading {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    }
    
    /* RESPONSIVE */
    @media (max-width: 767px) {
        .select-tipo {
            display: flex !important;
            border-left: 1px solid #e5e7eb;
            padding-left: 12px;
        }
        
        .select-tipo-icon {
            display: none;
        }
        
        .select-tipo-field {
            padding: 14px 32px 14px 12px !important;
            min-width: 100px !important;
        }
        
        .btn-search .btn-text {
            display: none;
        }
        
        .btn-search {
            padding: 14px;
        }
    }
    
    @media (min-width: 768px) {
        .searchbar-wrapper {
            padding: 0 20px;
        }
        
        .searchbar-container {
            padding: 16px;
        }
        
        .divider {
            display: block;
        }
        
        .select-wrapper {
            display: flex;
        }
    }
    
    @media (min-width: 1024px) {
        .btn-search {
            padding: 14px 24px;
        }
        
        .btn-search .btn-text {
            display: inline;
        }
    }
</style>