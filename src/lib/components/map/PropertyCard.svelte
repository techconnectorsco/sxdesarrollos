<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let property: any;
  
  const dispatch = createEventDispatcher<{
    close: void;
    viewDetails: any;
  }>();
  
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  $: listing = property?.listings?.[0];
  $: foreclosure = property?.judicial_foreclosures?.[0];
  $: isForSale = !!listing;
  $: isForeclosure = !!foreclosure;
  $: mainImage = listing?.images?.[0] || null;
  $: price = listing?.price || foreclosure?.base_price_numeric;
</script>

<div class="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
  <!-- Header con imagen -->
  <div class="relative">
    {#if mainImage}
      <img 
        src={mainImage} 
        alt="Propiedad {property.finca_regi}"
        class="w-full h-48 object-cover"
      />
    {:else}
      <div class="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    {/if}
    
    <!-- Botón cerrar -->
    <button
      on:click={() => dispatch('close')}
      class="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
      aria-label="Cerrar"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    
    <!-- Badge de estado -->
    <div class="absolute top-2 left-2">
      <span class="px-3 py-1 text-xs font-medium rounded-full shadow-lg {
        isForSale ? 'bg-green-500 text-white' :
        isForeclosure ? 'bg-red-500 text-white' :
        'bg-gray-700 text-white'
      }">
        {isForSale ? 'En Venta' : isForeclosure ? 'Remate Judicial' : 'Off-market'}
      </span>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-6">
    <!-- Título y dirección -->
    <div class="mb-4">
      <h3 class="text-xl font-bold text-gray-900 mb-1">
        {listing?.title || `Propiedad ${property.finca_regi}`}
      </h3>
      <p class="text-sm text-gray-600 flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {property.address || property.district || 'Sin dirección'}
      </p>
    </div>

    <!-- Precio -->
    {#if price}
      <div class="mb-4">
        <p class="text-3xl font-bold {isForSale ? 'text-blue-600' : 'text-red-600'}">
          {formatPrice(price)}
        </p>
        {#if isForeclosure}
          <p class="text-sm text-gray-600">Base de remate</p>
        {/if}
      </div>
    {/if}

    <!-- Características -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      {#if listing?.bedrooms}
        <div class="flex items-center gap-2 text-sm">
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{listing.bedrooms}</p>
            <p class="text-xs text-gray-500">Habitaciones</p>
          </div>
        </div>
      {/if}
      
      {#if listing?.bathrooms}
        <div class="flex items-center gap-2 text-sm">
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{listing.bathrooms}</p>
            <p class="text-xs text-gray-500">Baños</p>
          </div>
        </div>
      {/if}
      
      {#if property.area || listing?.square_feet}
        <div class="flex items-center gap-2 text-sm">
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{property.area || listing.square_feet}</p>
            <p class="text-xs text-gray-500">m²</p>
          </div>
        </div>
      {/if}
      
      {#if listing?.parking_spaces}
        <div class="flex items-center gap-2 text-sm">
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{listing.parking_spaces}</p>
            <p class="text-xs text-gray-500">Parqueos</p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Descripción -->
    {#if listing?.description}
      <div class="mb-4">
        <p class="text-sm text-gray-600 line-clamp-3">
          {listing.description}
        </p>
      </div>
    {/if}

    <!-- Amenidades -->
    {#if listing?.amenities?.length > 0}
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Amenidades:</p>
        <div class="flex flex-wrap gap-2">
          {#each listing.amenities.slice(0, 4) as amenity}
            <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {amenity}
            </span>
          {/each}
          {#if listing.amenities.length > 4}
            <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{listing.amenities.length - 4} más
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Botón de acción -->
    <button
      on:click={() => dispatch('viewDetails', property)}
      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
    >
      Ver Detalles Completos
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>

    <!-- ID de la propiedad -->
    <p class="text-xs text-gray-500 text-center mt-4">
      Finca: {property.finca_regi}
    </p>
  </div>
</div>

<style>
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>