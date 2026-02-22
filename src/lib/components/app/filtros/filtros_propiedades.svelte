<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { X, SlidersHorizontal } from 'lucide-svelte';
    import { UBICACIONES } from '$lib/data/costa_rica_ubicaciones';

    // 1. LEER URL (Fuente de la verdad)
    let params = $derived($page.url.searchParams);
    let mostrarFiltros = $state(false);

    // 2. VALORES DERIVADOS DE LA URL
    let provincia = $derived(params.get('provincia') || '');
    let canton = $derived(params.get('canton') || '');
    let distrito = $derived(params.get('distrito') || '');
    let moneda = $derived(params.get('moneda') || 'TODAS');
    let pMin = $derived(params.get('precioMin') || '0');
    let pMax = $derived(params.get('precioMax') || '0');
    let orden = $derived(params.get('ordenarPor') || 'fecha_desc');

    // 3. CALCULAR LISTAS DISPONIBLES
    let cantonesDisponibles = $derived(
        UBICACIONES.find(u => u.provincia === provincia)?.cantones || []
    );

    let distritosDisponibles = $derived(
        cantonesDisponibles.find(c => c.canton === canton)?.distritos || []
    );

    // 4. RANGOS
    const rangosCRC = [
        { label: 'Menos de ₡50M', min: 0, max: 50_000_000 },
        { label: '₡50M - ₡100M', min: 50_000_000, max: 100_000_000 },
        { label: '₡100M - ₡150M', min: 100_000_000, max: 150_000_000 },
        { label: '₡150M - ₡200M', min: 150_000_000, max: 200_000_000 },
        { label: 'Más de ₡200M', min: 200_000_000, max: 0 }
    ];

    const rangosUSD = [
        { label: 'Menos de $200K', min: 0, max: 200_000 },
        { label: '$200K - $400K', min: 200_000, max: 400_000 },
        { label: '$400K - $600K', min: 400_000, max: 600_000 },
        { label: '$600K - $800K', min: 600_000, max: 800_000 },
        { label: 'Más de $800K', min: 800_000, max: 0 }
    ];

    // 5. FUNCIÓN MAESTRA DE ACTUALIZACIÓN
    function actualizarURL(cambios: Record<string, string | null>) {
        const url = new URL($page.url);
        
        for (const [clave, valor] of Object.entries(cambios)) {
            if (valor && valor !== '0') {
                url.searchParams.set(clave, valor);
            } else {
                url.searchParams.delete(clave);
            }
        }

        // Navegación sin recarga, manteniendo el foco
        goto(url, { keepFocus: true, noScroll: true, replaceState: true });
    }

    // 6. HANDLERS INDIVIDUALES
    function handleProvincia(e: Event) {
        const val = (e.currentTarget as HTMLSelectElement).value;
        // Al cambiar provincia, borramos hijos
        actualizarURL({ provincia: val, canton: null, distrito: null });
    }

    function handleCanton(e: Event) {
        const val = (e.currentTarget as HTMLSelectElement).value;
        actualizarURL({ canton: val, distrito: null });
    }

    function handleMoneda(m: string) {
        if (m === moneda) return;
        // Al cambiar moneda, borramos precios
        actualizarURL({ moneda: m, precioMin: null, precioMax: null });
    }

    function handleRango(e: Event) {
        const idxStr = (e.currentTarget as HTMLSelectElement).value;
        if (!idxStr) {
            actualizarURL({ precioMin: null, precioMax: null });
            return;
        }
        
        const lista = moneda === 'CRC' ? rangosCRC : rangosUSD;
        const r = lista[parseInt(idxStr)];
        
        if (r) {
            actualizarURL({ 
                precioMin: r.min.toString(), 
                precioMax: r.max.toString() 
            });
        }
    }

    function limpiarTodo() {
        // Borramos todos los query params navegando a la ruta base
        goto($page.url.pathname, { noScroll: true });
    }

    // 7. UI HELPERS
    let filtrosActivos = $derived([
        provincia, canton, distrito, 
        Number(pMin) > 0, moneda !== 'TODAS'
    ].filter(Boolean).length);

    function textoRango() {
        if (pMin === '0' && pMax === '0') return '';
        const k = moneda === 'USD' ? 'k' : 'M';
        const div = moneda === 'USD' ? 1000 : 1000000;
        const sim = moneda === 'USD' ? '$' : '₡';
        return `${sim}${Number(pMin)/div}${k} - ${sim}${Number(pMax)/div}${k}`;
    }
</script>

<div class="card-container">
    <div class="header-row">
        <div class="flex items-center gap-3">
            <div class="icon-box">
                <SlidersHorizontal class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900">Filtros</h3>
            {#if filtrosActivos > 0}
                <span class="badge-counter">{filtrosActivos}</span>
            {/if}
        </div>

        <div class="flex items-center gap-2">
            {#if filtrosActivos > 0}
                <button onclick={limpiarTodo} class="btn-limpiar">
                    <X class="w-4 h-4" /> Limpiar
                </button>
            {/if}
            <button onclick={() => mostrarFiltros = !mostrarFiltros} class="btn-toggle">
                {mostrarFiltros ? 'Ocultar' : 'Mostrar'}
            </button>
        </div>
    </div>

    {#if mostrarFiltros}
        <div class="grid-3-cols">
            <div>
                <label class="label">Provincia</label>
                <select class="input" value={provincia} onchange={handleProvincia}>
                    <option value="">Todas</option>
                    {#each UBICACIONES as u}
                        <option value={u.provincia}>{u.provincia}</option>
                    {/each}
                </select>
            </div>
            <div>
                <label class="label">Cantón</label>
                <select class="input" value={canton} disabled={!provincia} onchange={handleCanton}>
                    <option value="">{provincia ? 'Todos' : '---'}</option>
                    {#each cantonesDisponibles as c}
                        <option value={c.canton}>{c.canton}</option>
                    {/each}
                </select>
            </div>
            <div>
                <label class="label">Distrito</label>
                <select class="input" value={distrito} disabled={!canton} onchange={(e) => actualizarURL({ distrito: e.currentTarget.value })}>
                    <option value="">{canton ? 'Todos' : '---'}</option>
                    {#each distritosDisponibles as d}
                        <option value={d.distrito}>{d.distrito}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="grid-3-cols">
            <div>
                <label class="label">Moneda</label>
                <div class="moneda-group">
                    {#each ['TODAS', 'CRC', 'USD'] as m}
                        <button 
                            onclick={() => handleMoneda(m)}
                            class="btn-moneda {moneda === m ? 'active' : ''}"
                        >
                            {m === 'TODAS' ? 'Todas' : m}
                        </button>
                    {/each}
                </div>
            </div>

            <div>
                <label class="label">Precio</label>
                <select 
                    class="input" 
                    disabled={moneda === 'TODAS'}
                    onchange={handleRango}
                >
                    <option value="">
                        {moneda === 'TODAS' ? 'Elige moneda' : 'Cualquier precio'}
                    </option>
                    {#if moneda === 'CRC'}
                        {#each rangosCRC as r, i} <option value={i}>{r.label}</option> {/each}
                    {/if}
                    {#if moneda === 'USD'}
                        {#each rangosUSD as r, i} <option value={i}>{r.label}</option> {/each}
                    {/if}
                </select>
            </div>

            <div>
                <label class="label">Ordenar por</label>
                <select 
                    class="input" 
                    value={orden} 
                    onchange={(e) => actualizarURL({ ordenarPor: e.currentTarget.value })}
                >
                    <option value="fecha_desc">Más recientes</option>
                    <option value="fecha_asc">Más antiguos</option>
                    <option value="precio_asc">Precio: Bajo a Alto</option>
                    <option value="precio_desc">Precio: Alto a Bajo</option>
                    <option value="area_desc">Mayor área</option>
                    <option value="area_asc">Menor área</option>
                </select>
            </div>
        </div>

        {#if filtrosActivos > 0}
            <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                {#if provincia} <span class="badge-filtro">{provincia}</span> {/if}
                {#if canton} <span class="badge-filtro">{canton}</span> {/if}
                {#if distrito} <span class="badge-filtro">{distrito}</span> {/if}
                {#if moneda !== 'TODAS'} <span class="badge-moneda">{moneda}</span> {/if}
                {#if Number(pMin) > 0 || Number(pMax) > 0} <span class="badge-moneda">{textoRango()}</span> {/if}
            </div>
        {/if}
    {/if}
</div>

<style>
    /* MISMOS ESTILOS QUE TE GUSTARON */
    .card-container {
        background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #f3f4f6;
    }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .icon-box { background-color: #eff6ff; padding: 0.5rem; border-radius: 0.5rem; }
    .badge-counter { background-color: #2563eb; color: white; font-size: 0.75rem; font-weight: bold; padding: 0.25rem 0.625rem; border-radius: 9999px; }
    .btn-limpiar { color: #dc2626; font-size: 0.875rem; padding: 0.375rem 0.75rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer; transition: background 0.2s; }
    .btn-limpiar:hover { background-color: #fef2f2; }
    .btn-toggle { font-size: 0.875rem; font-weight: 500; color: #4b5563; cursor: pointer; transition: color 0.2s; }
    .btn-toggle:hover { color: #2563eb; }
    .grid-3-cols { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (min-width: 768px) { .grid-3-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .label { display: block; font-size: 0.75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
    .input { width: 100%; padding: 0 1rem; height: 42px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
    .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    .input:disabled { opacity: 0.5; cursor: not-allowed; }
    .moneda-group { display: flex; background-color: #f3f4f6; padding: 0.25rem; border-radius: 0.5rem; height: 42px; gap: 0.25rem; }
    .btn-moneda { flex: 1; font-size: 0.75rem; font-weight: 700; border-radius: 0.375rem; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-moneda.active { background-color: #2563eb; color: white; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    .btn-moneda:not(.active) { background-color: transparent; color: #6b7280; }
    .btn-moneda:not(.active):hover { color: #374151; background-color: #e5e7eb; }
    .badge-filtro { padding: 0.25rem 0.75rem; background-color: #eff6ff; color: #1d4ed8; font-size: 0.75rem; font-weight: bold; border-radius: 9999px; border: 1px solid #dbeafe; }
    .badge-moneda { padding: 0.25rem 0.75rem; background-color: #f0fdf4; color: #15803d; font-size: 0.75rem; font-weight: bold; border-radius: 9999px; border: 1px solid #dcfce7; }
</style>