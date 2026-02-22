<script lang="ts">
    import { onMount } from 'svelte';
    import MapaNewUbicacion from '$lib/components/app/mapa_new/Mapa_new_ubicacion.svelte';
    import { obtenerCodigoCatastral, obtenerCentroDistrito } from '$lib/utils/ubicaciones';
    import { Info, MapPin, CheckCircle2, FileText, Ban } from 'lucide-svelte';

    let { datos = $bindable() } = $props<{ datos: any }>();

    // Interfaces y Estado
    interface UbicacionSimple {
        nombre: string;
        hijos: UbicacionSimple[];
    }
    let DB_PROVINCIAS: UbicacionSimple[] = [];
    let cargando = $state(true);
    let errorCarga = $state('');
    let provincias = $state<string[]>([]);
    let cantones = $state<string[]>([]);
    let distritos = $state<string[]>([]); 
    let centroDistrito = $state<{ lat: number; lng: number; zoom: number } | null>(null);
    
    let mostrarMapa = $derived(!!(datos.provincia && datos.canton && datos.distrito));
    
    onMount(async () => {
        try {
            const response = await fetch('/ubicaciones_cr.json');
            if (!response.ok) throw new Error('Error cargando ubicaciones');
            const dataRaw = await response.json();

            DB_PROVINCIAS = dataRaw.map((p: any) => ({
                nombre: p.provincia || p.nombre, 
                hijos: (p.cantones || []).map((c: any) => ({
                    nombre: c.canton || c.nombre,
                    hijos: (c.distritos || []).map((d: any) => ({
                        nombre: d.distrito || d.nombre,
                        hijos: []
                    }))
                }))
            }));
            provincias = DB_PROVINCIAS.map(p => p.nombre);

            if (datos.provincia) {
                filtrarCantones(datos.provincia);
                if (datos.canton) {
                    filtrarDistritos(datos.provincia, datos.canton);
                    if (datos.distrito) actualizarCentroMapa();
                }
            }
        } catch (e) {
            console.error(e);
            errorCarga = 'No se pudo cargar la lista de lugares.';
        } finally {
            cargando = false;
        }
    });

    // Funciones de Filtrado y Lógica
    function filtrarCantones(nombreProv: string) {
        const prov = DB_PROVINCIAS.find(p => p.nombre === nombreProv);
        cantones = prov ? prov.hijos.map(h => h.nombre) : [];
    }
    function filtrarDistritos(nombreProv: string, nombreCant: string) {
        const prov = DB_PROVINCIAS.find(p => p.nombre === nombreProv);
        if (!prov) return;
        const cant = prov.hijos.find(c => c.nombre === nombreCant);
        distritos = cant ? cant.hijos.map(h => h.nombre) : [];
    }
    function actualizarCentroMapa() {
        if (!datos.provincia || !datos.canton || !datos.distrito) { centroDistrito = null; return; }
        try {
            const codigo = obtenerCodigoCatastral(datos.provincia, datos.canton, datos.distrito);
            if (codigo) centroDistrito = obtenerCentroDistrito(codigo);
        } catch (e) { console.warn('Error centro distrito', e); }
    }

    // Handlers
    function onChangeProvincia() {
        datos.canton = ''; datos.distrito = ''; cantones = []; distritos = []; centroDistrito = null;
        if (datos.provincia) filtrarCantones(datos.provincia);
    }
    function onChangeCanton() {
        datos.distrito = ''; distritos = []; centroDistrito = null;
        if (datos.canton) {
            filtrarDistritos(datos.provincia, datos.canton);
            setTimeout(() => document.getElementById('distrito-input')?.focus(), 50);
        }
    }
    function onChangeDistrito() {
        if (datos.distrito && distritos.includes(datos.distrito)) actualizarCentroMapa();
    }
    function resetearSeleccion() {
        datos.provincia = ''; datos.canton = ''; datos.distrito = '';
        datos.latitud = 0; datos.longitud = 0;
        datos.geometria = null; datos.finca_id = '';
        datos.origen_datos = 'manual';
        cantones = []; distritos = []; centroDistrito = null;
        setTimeout(() => document.getElementById('provincia')?.focus(), 100);
    }

    // ✅ PROCESAMIENTO DEL MAPA
    function procesarUbicacion(event: CustomEvent) {
        const info = event.detail;
        // console.log("📍 Datos recibidos en Paso 2:", info);

        datos.latitud = info.lat;
        datos.longitud = info.lng;

        if (info.tipo === 'parcela') {
            // Caso Parcela: Asignamos todo
            datos.finca_id = String(info.finca_id); 
            datos.geometria = info.geometria;
            datos.origen_datos = 'mapa';
        } else {
            // Caso Punto Manual: LIMPIEZA TOTAL
            // Al hacer esto, el input del Paso 1 también se borrará automáticamente
            datos.geometria = null;
            datos.origen_datos = 'manual';
            datos.finca_id = ''; // ✅ Usamos string vacío para limpiar inputs de texto
        }
    }
</script>

<div class="max-w-4xl mx-auto w-full">
    <div class="mb-6 flex justify-between items-center">
        <div>
            <h2 class="text-2xl font-bold text-gray-800">Ubicación de la Propiedad</h2>
            <p class="text-sm text-gray-500">Seleccione la zona y marque el punto exacto.</p>
        </div>
        {#if datos.provincia || datos.canton || datos.distrito}
            <button onclick={resetearSeleccion} class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
                Reiniciar ubicación
            </button>
        {/if}
    </div>

    {#if cargando}
        <div class="p-8 text-center bg-gray-50 rounded-lg animate-pulse"><p class="text-gray-600">Cargando...</p></div>
    {:else if errorCarga}
        <div class="p-4 bg-red-50 text-red-700 rounded-lg">{errorCarga}</div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div class="flex flex-col gap-1">
                <label for="provincia" class="text-sm font-semibold text-gray-700">Provincia *</label>
                <select id="provincia" class="form-input" bind:value={datos.provincia} onchange={onChangeProvincia}>
                    <option value="">Seleccione...</option>
                    {#each provincias as p}<option value={p}>{p}</option>{/each}
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label for="canton" class="text-sm font-semibold text-gray-700">Cantón *</label>
                <select id="canton" class="form-input" bind:value={datos.canton} onchange={onChangeCanton} disabled={!datos.provincia}>
                    <option value="">Seleccione...</option>
                    {#each cantones as c}<option value={c}>{c}</option>{/each}
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label for="distrito-input" class="text-sm font-semibold text-gray-700">Distrito *</label>
                <input id="distrito-input" type="text" list="lista-distritos" class="form-input" bind:value={datos.distrito} onchange={onChangeDistrito} disabled={!datos.canton} placeholder={datos.canton ? "Escriba o seleccione..." : "Seleccione cantón"} autocomplete="off" />
                <datalist id="lista-distritos">{#each distritos as d}<option value={d}></option>{/each}</datalist>
            </div>
        </div>

        {#if mostrarMapa}
            <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                
                <div class="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex gap-3 items-start p-3 bg-white border border-green-100 rounded-lg shadow-sm hover:border-green-300 transition-colors cursor-help" title="Información catastral disponible">
                        <div class="w-8 h-8 rounded bg-green-100 flex items-center justify-center shrink-0 text-green-600">
                             <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" opacity="0.5"/><path d="M7 7h10v10H7z" /></svg>
                        </div>
                       <div class="text-sm">
                            <p class="font-bold text-gray-800">Mapa</p>
                            <p class="text-gray-500 leading-snug mt-1">Si seleccionas tu parcela la podras ver en <span class="text-green-600 font-bold">verde</span>, y asi obtenemos su ubicación</p>
                        </div>
                    </div>

                    <div class="flex gap-3 items-start p-3 bg-white border border-blue-100 rounded-lg shadow-sm hover:border-blue-300 transition-colors cursor-help" title="Ubicación manual">
                        <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                            <MapPin class="w-5 h-5" />
                        </div>
                         <div class="text-sm">
                            <p class="font-bold text-gray-800">Ubicación Manual</p>
                            <p class="text-gray-500 leading-snug mt-1">Si tu propiedad esta fuera del alcance de nuestro mapa, haga clic en el lugar exacto para marcar un <span class="text-blue-600 font-bold">punto azul</span>.</p>
                        </div>
                    </div>
                </div>

                <div class="w-full h-[550px] relative z-0">
                    {#key `${datos.provincia}-${datos.canton}-${datos.distrito}`}
                        <MapaNewUbicacion
                            provincia={datos.provincia}
                            canton={datos.canton}
                            distrito={datos.distrito}
                            centroInicial={centroDistrito ? [centroDistrito.lng, centroDistrito.lat, centroDistrito.zoom] : undefined}
                            ubicacionInicial={datos.latitud && datos.longitud ? [datos.latitud, datos.longitud] : undefined}
                            geometriaInicial={datos.geometria}
                            on:ubicacionSeleccionada={procesarUbicacion}
                        />
                    {/key}
                </div>

                <div class="p-5 bg-gray-50 border-t border-gray-100">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div class="space-y-3">
                            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <MapPin class="w-3.5 h-3.5" /> Coordenadas Capturadas
                            </h4>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-white p-2 rounded border border-gray-200">
                                    <span class="text-xs text-gray-400 block">Latitud</span>
                                    <span class="text-sm font-mono font-medium text-gray-800">{datos.latitud ? datos.latitud.toFixed(6) : '---'}</span>
                                </div>
                                <div class="bg-white p-2 rounded border border-gray-200">
                                    <span class="text-xs text-gray-400 block">Longitud</span>
                                    <span class="text-sm font-mono font-medium text-gray-800">{datos.longitud ? datos.longitud.toFixed(6) : '---'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText class="w-3.5 h-3.5" /> Información Detectada
                            </h4>
                            
                            <div class="p-3 rounded border flex items-center justify-between transition-colors
                                {datos.origen_datos === 'mapa' ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}">
                                
                                <div>
                                    <span class="text-xs block mb-0.5 {datos.origen_datos === 'mapa' ? 'text-green-600' : 'text-gray-500'}">
                                        {#if datos.origen_datos === 'mapa'}
                                            Finca Detectada
                                        {:else}
                                            Sin datos catastrales
                                        {/if}
                                    </span>
                                    
                                    <span class="font-mono font-medium {datos.origen_datos === 'mapa' ? 'text-green-900' : 'text-gray-400'}">
                                        {#if datos.finca_id}
                                            {datos.finca_id}
                                        {:else}
                                            Modo Manual
                                        {/if}
                                    </span>
                                </div>
                                
                                {#if datos.origen_datos === 'mapa'}
                                    <CheckCircle2 class="w-5 h-5 text-green-600" />
                                {:else}
                                    <Ban class="w-4 h-4 text-gray-300" />
                                {/if}
                            </div>
                            
                            {#if datos.origen_datos === 'mapa'}
                                <p class="text-xs text-green-600 mt-1">✅ Dato obtenido del mapa catastral.</p>
                            {:else}
                                <p class="text-xs text-gray-400 mt-1">Se guardará solo la ubicación GPS.</p>
                            {/if}
                        </div>

                    </div>
                </div>
            </div>

            <div class="mt-6">
                <label for="direccion" class="text-sm font-semibold text-gray-700 mb-1 block">Dirección Exacta / Señas *</label>
                <textarea 
                    id="direccion"
                    rows="2"
                    class="form-input w-full"
                    bind:value={datos.direccion_exacta}
                    placeholder="Ej: Del supermercado 200m norte, casa portón negro..."
                ></textarea>
            </div>
        {:else}
            <div class="mt-6 p-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                <MapPin class="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p class="text-gray-500 font-medium">Complete la provincia, cantón y distrito para cargar el mapa interactivo.</p>
            </div>
        {/if}
    {/if}
</div>

<style>
    .form-input { width: 100%; padding: 0.6rem; border: 1px solid #d1d5db; border-radius: 0.5rem; background-color: white; transition: all 0.2s; font-size: 0.95rem; }
    .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .form-input:disabled { background-color: #f9fafb; color: #9ca3af; cursor: not-allowed; }
</style>