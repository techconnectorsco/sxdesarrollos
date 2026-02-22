<script lang="ts">
  export let forSaleCount = 0;
  export let foreclosureCount = 0;
  export let offMarketCount = 0;
  export let isCollapsed = false;
  
  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden">
  <!-- Header -->
  <button
    on:click={toggleCollapse}
    class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
  >
    <h3 class="font-semibold text-sm text-gray-900">Leyenda del Mapa</h3>
    <svg 
      class="w-4 h-4 text-gray-500 transition-transform {isCollapsed ? '' : 'rotate-180'}"
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Content -->
  {#if !isCollapsed}
    <div class="px-4 pb-4 space-y-3">
      <!-- Propiedades en venta -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
          <span class="text-sm text-gray-700">En Venta</span>
        </div>
        <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {forSaleCount}
        </span>
      </div>

      <!-- Remates judiciales -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
          <span class="text-sm text-gray-700">Remate Judicial</span>
        </div>
        <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {foreclosureCount}
        </span>
      </div>

      <!-- Fuera del mercado -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-sm"></div>
          <span class="text-sm text-gray-700">Fuera del Mercado</span>
        </div>
        <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {offMarketCount}
        </span>
      </div>

      <!-- Separador -->
      <div class="border-t border-gray-200 my-3"></div>

      <!-- Clusters -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
            <span class="text-white text-[10px] font-bold">5</span>
          </div>
          <span class="text-sm text-gray-700">Cluster</span>
        </div>
        <span class="text-xs text-gray-500">Múltiples propiedades</span>
      </div>

      <!-- Info adicional -->
      <div class="mt-4 pt-3 border-t border-gray-200">
        <p class="text-xs text-gray-500 text-center">
          Haz clic en un marcador para ver detalles
        </p>
      </div>
    </div>
  {/if}
</div>