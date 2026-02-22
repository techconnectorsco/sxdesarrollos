<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Eye, EyeOff, MoreVertical } from "lucide-svelte";
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import GaleriaFotos from '$lib/components/app/detalle_propiedad/galeria_fotos.svelte';
  import MapaUbicacion from '$lib/components/app/propiedades/mapa_ubicacion.svelte';
  import DetallesDocumentacion from '$lib/components/app/detalle_propiedad/detalle_documentacion.svelte';

  interface Propiedad {
    id: string;
    titulo: string;
    tipo_transaccion: string;
    precio: number;
    moneda: string;
    estado: string;
    created_at: string;
    vistas_total: number;
    publico: boolean;
  }

  let { propiedades = [] }: { propiedades: Propiedad[] } = $props();
  
  let localPropiedades = $state(propiedades);
  let modalAbierto = $state(false);
  let propiedadSeleccionada = $state<any>(null);
  let cargandoPreview = $state(false);
  
  $effect(() => {
    localPropiedades = propiedades;
  });

  async function abrirPreview(id: string) {
    modalAbierto = true;
    cargandoPreview = true;
    propiedadSeleccionada = null;

    try {
      const response = await fetch(`/api/admin/anuncios/${id}`);
      if (!response.ok) throw new Error('Error al cargar');
      const data = await response.json();
      propiedadSeleccionada = data.anuncio;
    } catch (error) {
      console.error('Error:', error);
      modalAbierto = false;
    } finally {
      cargandoPreview = false;
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'CRC'
    }).format(price);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'publicado':
        return 'bg-green-100 text-green-800';
      case 'pendiente_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
</script>

<div class="sm:col-span-8 xl:col-span-6 2xl:col-span-4 border-b mt-4">
  <h2 class="font-semibold text-lg mb-4">Mis Propiedades</h2>

  {#if localPropiedades.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-500">No tienes propiedades publicadas</p>
      <Button class="mt-4" href="/publicar_propiedad">Publicar Propiedad</Button>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b">
            <th class="text-left px-4 py-3 font-semibold">Título</th>
            <th class="text-left px-4 py-3 font-semibold">Tipo</th>
            <th class="text-left px-4 py-3 font-semibold">Precio</th>
            <th class="text-left px-4 py-3 font-semibold">Estado</th>
            <th class="text-left px-4 py-3 font-semibold">Vistas</th>
            <th class="text-left px-4 py-3 font-semibold">Publicado</th>
            <th class="text-left px-4 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each localPropiedades as propiedad (propiedad.id)}
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-3">
                <button 
                  onclick={() => abrirPreview(propiedad.id)}
                  class="text-blue-600 hover:underline text-left">
                  {propiedad.titulo}
                </button>
              </td>
              <td class="px-4 py-3 capitalize">{propiedad.tipo_transaccion}</td>
              <td class="px-4 py-3">{formatPrice(propiedad.precio, propiedad.moneda)}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs font-medium {getEstadoColor(propiedad.estado)}">
                  {propiedad.estado}
                </span>
              </td>
              <td class="px-4 py-3">{propiedad.vistas_total}</td>
              <td class="px-4 py-3">
                <span class={`text-xs font-medium ${propiedad.publico ? 'text-green-600' : 'text-gray-500'}`}>
                  {propiedad.publico ? 'Público' : 'Privado'}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    class="text-xs"
                    href="/publicar_propiedad?editar={propiedad.id}">
                    Editar
                  </Button>
                  
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="outline" size="sm" class="h-8 w-8 p-0">
                        <MoreVertical class="h-4 w-4" />
                        <span class="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Label>Visibilidad</DropdownMenu.Label>
                      <DropdownMenu.Separator />
                      
                      <form 
                        method="POST" 
                        action="?/togglePublico" 
                        use:enhance={() => {
                          const index = localPropiedades.findIndex(p => p.id === propiedad.id);
                          if (index !== -1) {
                            localPropiedades[index].publico = !localPropiedades[index].publico;
                          }
                          
                          return async ({ result, update }) => {
                            if (result.type === 'success') {
                              await update({ reset: false });
                              await invalidateAll();
                            } else {
                              if (index !== -1) {
                                localPropiedades[index].publico = !localPropiedades[index].publico;
                              }
                            }
                          };
                        }}>
                        <input type="hidden" name="anuncioId" value={propiedad.id} />
                        <input type="hidden" name="publico" value={(!propiedad.publico).toString()} />
                        <button type="submit" class="w-full">
                          <DropdownMenu.Item class="cursor-pointer">
                            {#if propiedad.publico}
                              <EyeOff class="mr-2 h-4 w-4" />
                              Hacer Privado
                            {:else}
                              <Eye class="mr-2 h-4 w-4" />
                              Hacer Público
                            {/if}
                          </DropdownMenu.Item>
                        </button>
                      </form>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<Dialog.Root bind:open={modalAbierto}>
  <Dialog.Content class="max-w-[95vw] lg:max-w-7xl max-h-[95vh] overflow-hidden p-0 gap-0" showCloseButton={false}>
    {#if cargandoPreview}
      <div class="flex items-center justify-center py-12">
        <div class="text-gray-500">Cargando...</div>
      </div>
    {:else if propiedadSeleccionada}
      <div class="overflow-y-auto max-h-[95vh] relative">
        <!-- Barra Superior con Badges -->
        <div class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
          <div class="px-5 py-4 flex justify-between items-center gap-4 flex-wrap">
            <div class="flex gap-2.5 items-center flex-wrap">
              <span class="px-2.5 py-1 text-xs font-semibold rounded-md border {propiedadSeleccionada.estado === 'publicado' ? 'bg-green-50 text-green-700 border-green-200' : propiedadSeleccionada.estado === 'pendiente_revision' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}">
                {propiedadSeleccionada.estado.replace('_', ' ')}
              </span>
              
              <span class="px-2.5 py-1 text-xs font-semibold rounded-md border {propiedadSeleccionada.publico ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}">
                {propiedadSeleccionada.publico ? '👁️ Público' : '🔒 Privado'}
              </span>
              
              <span class="px-2.5 py-1 text-xs font-semibold rounded-md border {propiedadSeleccionada.tipo_transaccion === 'venta' ? 'bg-green-50 text-green-700 border-green-200' : propiedadSeleccionada.tipo_transaccion === 'alquiler' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}">
                {propiedadSeleccionada.tipo_transaccion}
              </span>
            </div>
            
            <button 
              onclick={() => modalAbierto = false}
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido -->
        <div class="bg-gray-50 py-6 pb-12">
          <div class="max-w-7xl mx-auto px-5">
            <!-- Galería -->
            <GaleriaFotos 
              imagenes={propiedadSeleccionada.imagenes || []} 
              titulo={propiedadSeleccionada.titulo}
            />

            <!-- Header de la Propiedad -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h1 class="text-3xl font-bold text-gray-800 mb-3">{propiedadSeleccionada.titulo}</h1>

              <div class="flex items-center gap-3 mb-4 flex-wrap">
                <span class="flex items-center gap-1.5 text-base text-gray-600">
                  <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                  </svg>
                  {propiedadSeleccionada.habitaciones || propiedadSeleccionada.dormitorios || 0} habitaciones
                </span>
                <span class="text-gray-300">|</span>
                <span class="flex items-center gap-1.5 text-base text-gray-600">
                  <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-5 9h4m-2-9v9M4 6h16M4 6a2 2 0 012-2h12a2 2 0 012 2M4 6v6a2 2 0 002 2h12a2 2 0 002-2V6" />
                  </svg>
                  {propiedadSeleccionada.banos || 0} baños
                </span>
                <span class="text-gray-300">|</span>
                <span class="flex items-center gap-1.5 text-base text-gray-600">
                  <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  {propiedadSeleccionada.area || propiedadSeleccionada.area_total_terreno_m2 || 0} m²
                </span>
              </div>

              <div class="mb-4">
                <div class="text-4xl font-bold text-gray-900">
                  {#if propiedadSeleccionada.moneda === 'USD'}
                    ${propiedadSeleccionada.precio.toLocaleString('en-US')}
                  {:else}
                    ₡{propiedadSeleccionada.precio.toLocaleString('es-CR')}
                  {/if}
                </div>
              </div>
              
              <p class="flex items-center gap-2 text-base text-gray-600 m-0">
                <svg class="w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {propiedadSeleccionada.distrito || 'N/A'}, {propiedadSeleccionada.canton || 'N/A'}, {propiedadSeleccionada.provincia || 'N/A'}
              </p>
            </div>

            <!-- Layout de 2 columnas -->
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
              <!-- Columna Principal -->
              <div class="flex flex-col gap-6">
                <!-- Descripción -->
                {#if propiedadSeleccionada.descripcion}
                  <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Descripción</h2>
                    <p class="text-base leading-relaxed text-gray-600 m-0">{propiedadSeleccionada.descripcion}</p>
                  </section>
                {/if}

                <!-- Características -->
                {#if propiedadSeleccionada.caracteristicas && propiedadSeleccionada.caracteristicas.length > 0}
                  <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Características y Amenidades</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {#each propiedadSeleccionada.caracteristicas as caracteristica}
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                          <svg class="w-4.5 h-4.5 text-green-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {caracteristica}
                        </div>
                      {/each}
                    </div>
                  </section>
                {/if}

                <!-- Detalles Documentación -->
                <DetallesDocumentacion 
                  finca_id={propiedadSeleccionada.finca_id}
                  naturaleza="Propiedad"
                  area_terreno={propiedadSeleccionada.area || propiedadSeleccionada.area_total_terreno_m2 || 0}
                  area_construccion={propiedadSeleccionada.area_construccion_m2 || 0}
                  valor_fiscal={propiedadSeleccionada.precio * 0.7}
                  gravamenes=""
                  ultima_venta_fecha=""
                  ultima_venta_precio={0}
                />

                <!-- Mapa -->
                <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 class="text-xl font-bold text-gray-800 mb-4">Ubicación</h2>
                  <MapaUbicacion 
                    provincia={propiedadSeleccionada.provincia || 'San José'}
                    canton={propiedadSeleccionada.canton || ''}
                    distrito={propiedadSeleccionada.distrito || ''}
                    finca_id={propiedadSeleccionada.finca_id}
                  />
                </section>
              </div>

              <!-- Columna Lateral -->
              <div class="flex flex-col gap-6">
                <!-- Info de Contacto -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 class="text-xl font-bold text-gray-800 mb-4">Información de Contacto</h3>
                  <div class="space-y-2">
                    <p class="text-sm text-gray-600 m-0"><strong>Nombre:</strong> {propiedadSeleccionada.contacto_nombre || 'N/A'}</p>
                    <p class="text-sm text-gray-600 m-0"><strong>Teléfono:</strong> {propiedadSeleccionada.contacto_telefono || 'N/A'}</p>
                    <p class="text-sm text-gray-600 m-0"><strong>Email:</strong> {propiedadSeleccionada.contacto_email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
