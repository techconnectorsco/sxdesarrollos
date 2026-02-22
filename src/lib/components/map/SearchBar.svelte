<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{ search: string }>();
  
  let searchValue = '';
  
  function handleInput() {
    // Búsqueda en tiempo real mientras escribe
    dispatch('search', searchValue);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      dispatch('search', searchValue);
    }
  }
  
  function clearSearch() {
    searchValue = '';
    dispatch('search', '');
  }
</script>

<div class="relative">
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg 
        class="h-5 w-5 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
        />
      </svg>
    </div>
    
    <input
      type="text"
      bind:value={searchValue}
      on:input={handleInput}
      on:keydown={handleKeydown}
      placeholder="Buscar por finca, dirección, distrito u OID..."
      class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    />
    
    {#if searchValue}
      <button
        on:click={clearSearch}
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Limpiar búsqueda"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
</div>