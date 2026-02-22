<script lang="ts">
    import { MapPin } from 'lucide-svelte'; 

    // 1. Definición de tipos
    let { 
        propiedad,
        onLocate = undefined // Nueva prop opcional
    } = $props<{ 
        propiedad: {
            anuncio_id?: string;
            anuncio_slug?: string;
            id?: string; // Agregado por compatibilidad
            titulo: string;
            precio: number;
            moneda?: string;
            tipo_operacion?: string;
            tipo_transaccion?: string;
            ubicacion?: string;
            provincia?: string;
            canton?: string;
            distrito?: string;
            finca_id?: string;
            dormitorios?: number;
            habitaciones?: number;
            banos?: number;
            area_terreno?: number; 
            area_terreno_m2?: number; 
            area_construccion_m2?: number;
            imagen?: string;
            imagenes?: any[];
            descripcion?: string;
            caracteristicas?: string[];
            esPatrocinada?: boolean;
            enlaceExterno?: string;
            destacado?: boolean;
            es_destacado_automatico?: boolean;
        },
        onLocate?: (prop: any) => void;
    }>();

    const formatearPrecio = (precio: number, moneda: string = 'CRC') => {
        if (moneda === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            }).format(precio);
        }
        return new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(precio);
    };

    function handleClick(e: MouseEvent) {
        if (propiedad.esPatrocinada && propiedad.enlaceExterno) {
            return;
        }
    }

    // Manejador exclusivo para el botón de mapa
    function handleLocateClick(e: MouseEvent) {
        e.preventDefault(); // Evita navegar al detalle
        e.stopPropagation(); // Evita que el click suba al container
        if (onLocate) onLocate(propiedad);
    }

    const obtenerEnlace = () => {
        if (propiedad.esPatrocinada && propiedad.enlaceExterno) {
            return propiedad.enlaceExterno;
        }
        const tipoTransaccion = (propiedad.tipo_transaccion || propiedad.tipo_operacion || '').toLowerCase();
        
        // Mapeo de rutas según el tipo
        let rutaBase = '/propiedades-venta';
        if (tipoTransaccion === 'alquiler') rutaBase = '/alquileres';
        if (tipoTransaccion === 'proyecto') rutaBase = '/proyectos'; // ✅ Ruta correcta para proyectos
        
        const id = propiedad.anuncio_id || propiedad.id;
        return `${rutaBase}/${id}`;
    };

    const obtenerImagen = () => {
        if (propiedad.imagen) return propiedad.imagen;
        if (propiedad.imagenes && propiedad.imagenes.length > 0) {
            return propiedad.imagenes[0].url || propiedad.imagenes[0];
        }
        return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800';
    };

    // 2. Lógica para separar valores
    const habitaciones = propiedad.dormitorios || propiedad.habitaciones || 0;
    const areaConstruccion = propiedad.area_construccion_m2 || 0;
    const areaTerreno = propiedad.area_terreno || propiedad.area_terreno_m2 || 0;
    
    // Normalizar tipo transacción a minúsculas
    const tipoTransaccion = (propiedad.tipo_transaccion || propiedad.tipo_operacion || '').toLowerCase();
    
    const ubicacionTexto = propiedad.ubicacion || propiedad.canton || propiedad.provincia || '';

    const hoverColor = 
    tipoTransaccion === "alquiler"
        ? "hover:border-blue-500"
        : tipoTransaccion === "venta"
            ? "hover:border-green-500"
            : tipoTransaccion === "proyecto"
                ? "hover:border-purple-500"
                : "hover:border-blue-300";
</script>

<a
    href={obtenerEnlace()}
    onclick={handleClick}
    target={propiedad.enlaceExterno ? "_blank" : "_self"}
    rel={propiedad.enlaceExterno ? "noopener noreferrer" : undefined}
    class={`block rounded-2xl overflow-hidden bg-white border transition-all duration-300 group hover:shadow-2xl relative
        border-gray-200 ${hoverColor}
    `}
>
    <div class="relative h-60 bg-gray-100 overflow-hidden">
        <img
            src={obtenerImagen()}
            alt={propiedad.titulo}
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
        />

        <div class="absolute top-3 right-3 z-10 flex gap-2">
            {#if tipoTransaccion === 'alquiler'}
                <span class="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    ALQUILER
                </span>
            {:else if tipoTransaccion === 'venta'}
                <span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    VENTA
                </span>
            {:else if tipoTransaccion === 'proyecto'} <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg tracking-wide">
                    PROYECTO
                </span>
            {/if}
        </div>

        {#if propiedad.destacado || propiedad.es_destacado_automatico}
            <div class="absolute top-3 left-3 z-10 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ⭐ DESTACADO
            </div>
        {/if}

        {#if propiedad.esPatrocinada}
            <div class="absolute top-12 right-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md border border-white">
                Patrocinado
            </div>
        {/if}

        {#if onLocate && propiedad.finca_id}
            <button 
                class="absolute bottom-16 right-3 z-20 bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 p-2 rounded-full shadow-lg border border-gray-200 transition-all transform hover:scale-110 flex items-center gap-1 text-xs font-bold group/btn"
                onclick={handleLocateClick}
                title="Ubicar en mapa"
                type="button"
                aria-label="Ver propiedad en el mapa"
            >
                <MapPin class="w-4 h-4" />
                <span class="hidden group-hover/btn:inline max-w-0 group-hover/btn:max-w-xs transition-all duration-300 overflow-hidden whitespace-nowrap px-1">Ver mapa</span>
            </button>
        {/if}

        <div class="absolute bottom-3 left-3 bg-white/90 px-4 py-2 rounded-xl shadow-md border border-blue-500/40">
            <p class="text-lg font-bold text-blue-600">
                {formatearPrecio(propiedad.precio, propiedad.moneda || 'CRC')}
            </p>
        </div>
    </div>

    <div class="p-5">
        <h3 class="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {propiedad.titulo}
        </h3>

        <p class="flex items-center text-gray-600 text-sm mb-4">
            <MapPin class="w-5 h-5 text-blue-500 mr-1" />
            {ubicacionTexto}, {propiedad.provincia || ''}
        </p>

        <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-gray-700 text-sm mb-2">
            
            {#if habitaciones > 0}
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M4.5 10.5V21h15V10.5" />
                    </svg>
                    <span>{habitaciones} Hab</span>
                </div>
            {/if}

            {#if propiedad.banos && propiedad.banos > 0}
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-5 9h4m-2-9v9M4 6h16M4 6a2 2 0 012-2h12a2 2 0 012 2M4 6v6a2 2 0 002 2h12a2 2 0 002-2V6" />
                    </svg>
                    <span>{propiedad.banos} Baños</span>
                </div>
            {/if}

            {#if areaConstruccion > 0}
                <div class="flex items-center gap-2" title="Área de Construcción">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-500">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                    </svg>
                    <span>{areaConstruccion}m² const</span>
                </div>
            {/if}

            {#if areaTerreno > 0}
                <div class="flex items-center gap-2" title="Área de Terreno">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-green-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    <span>{areaTerreno}m² terr</span>
                </div>
            {/if}

        </div>

        {#if propiedad.esPatrocinada}
            <div class="mt-4">
                <div class="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-semibold text-sm transition">
                    Ver Detalles
                </div>
            </div>
        {/if}
    </div>
</a>