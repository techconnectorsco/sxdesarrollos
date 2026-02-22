<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let properties: any[] = [];
  export let loading = false;
  
  const dispatch = createEventDispatcher<{
    selectProperty: any;
  }>();
  
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  function getPropertyStatus(property: any) {
    if (property.listings?.length > 0) return 'sale';
    if (property.judicial_foreclosures?.length > 0) return 'foreclosure';
    return 'off-market';
  }
  
  function getPropertyPrice(property: any) {
    return property.listings?.[0]?.price || 
           property.judicial_foreclosures?.[0]?.base_price_numeric;
  }
</script>

<div class="h-full flex flex-col bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b px-4 py-3 sticky top-0 z-10">
    <h2 class="text-lg font-bold text-gray-900">
      Propiedades <span class="text-gray-500 font-normal">({properties.length})</span>
    </h2>
  </div>

  <!-- Loading state -->
  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando propiedades...</p>
      </div>
    </div>
  {:else if properties.length === 0}
    <!-- Empty state -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="text-gray-600 font-medium mb-2">No se encontraron propiedades</p>
        <p class="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
      </div>
    </div>
  {:else}
    <!-- Property list -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-3">
        {#each properties as property (property.id)}
          {@const status = getPropertyStatus(property)}
          {@const price = getPropertyPrice(property)}
          {@const listing = property.listings?.[0]}
          {@const foreclosure = property.judicial_foreclosures?.[0]}
          
          <button
            on:click={() => dispatch('selectProperty', property)}
            class="w-full text-left bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden"
          >
            <div class="flex">
              <!-- Imagen o placeholder -->
              <div class="w-24 h-24 flex-shrink-0 relative">
                {#if listing?.images?.[0]}
                  <img 
                    src={listing.images[0]} 
                    alt={property.finca_regi}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                {/if}
                
                <!-- Badge de estado -->
                <div class="absolute top-1 left-1">
                  <span class="px-2 py-0.5 text-[10px] font-medium rounded-full {
                    status === 'sale' ? 'bg-green-500 text-white' :
                    status === 'foreclosure' ? 'bg-red-500 text-white' :
                    'bg-gray-700 text-white'
                  }">
                    {status === 'sale' ? 'Venta' : status === 'foreclosure' ? 'Remate' : 'Off'}
                  </span>
                </div>
              </div>

              <!-- Información -->
              <div class="flex-1 p-3 min-w-0">
                <div class="mb-1">
                  <h3 class="font-semibold text-sm text-gray-900 truncate">
                    {listing?.title || property.finca_regi}
                  </h3>
                  <p class="text-xs text-gray-500 truncate flex items-center gap-1">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {property.address || property.district || 'Sin ubicación'}
                  </p>
                </div>

                <!-- Precio -->
                {#if price}
                  <p class="text-base font-bold mb-2 {status === 'sale' ? 'text-blue-600' : 'text-red-600'}">
                    {formatPrice(price)}
                  </p>
                {/if}

                <!-- Características compactas -->
                <div class="flex gap-3 text-xs text-gray-600">
                  {#if listing?.bedrooms}
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {listing.bedrooms}
                    </span>
                  {/if}
                  {#if listing?.bathrooms}
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      {listing.bathrooms}
                    </span>
                  {/if}
                  {#if property.area || listing?.square_feet}
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {property.area || listing.square_feet}m²
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Icono de flecha -->
              <div class="flex items-center pr-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>