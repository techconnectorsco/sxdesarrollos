<script lang="ts">
  /**
   * @module DashboardPage
   * @description This is the main dashboard component, responsible for orchestrating and displaying various sections
   * such as initial statistics, recent foreclosures, featured properties, and top-rated agents.
   * It includes dynamic tab navigation to switch between different dashboard views.
   */
  import Carousel from '$lib/components/app/dashboard/carousel.svelte';
  import CardsIniciales from '$lib/components/app/dashboard/CardsInciales.svelte';
  import RematesRecientes from '$lib/components/app/dashboard/RematesRecientes.svelte';
  import PropiedadesDestacadas from '$lib/components/app/dashboard/PropiedadesDestacadas.svelte';
  import AgentesDestacados from '$lib/components/app/dashboard/AgentesDestacados.svelte';

  /**
   * Defines the top-level navigation items for the dashboard.
   * @constant
   * @type {Array<object>}
   * @property {string} name - Internal identifier for the navigation item.
   * @property {string} label - Display label for the navigation item.
   */
  const nav = [
    { name: 'dashboard', label: 'Dashboard' },
    { name: 'propiedades', label: 'Propiedades' },
    { name: 'remates', label: 'Remates' },
    { name: 'consultas', label: 'Consultas' },
    { name: 'analitica', label: 'Analítica' }
  ];
  /**
   * Reactive state variable indicating the currently active tab in the dashboard navigation.
   * @type {string}
   */
  let activeTab = 'dashboard';

  // ===== Datos =====
  /**
   * Object containing key statistics for the dashboard.
   * @constant
   * @type {object}
   * @property {number} totalProperties - Total number of properties registered.
   * @property {number} activeForeclosures - Number of currently active foreclosures.
   * @property {number} userInquiries - Number of user inquiries.
   * @property {number} newProperties - Number of new properties added recently.
   */
  const dashboardStats = {
    totalProperties: 3250,
    activeForeclosures: 812,
    userInquiries: 456,
    newProperties: 87
  };

  /**
   * An array of objects representing recent foreclosure listings.
   * @constant
   * @type {Array<object>}
   * @property {string} id - Unique identifier for the foreclosure.
   * @property {string} property - Name or description of the property.
   * @property {string} location - Location of the property.
   * @property {string} date - Date of the foreclosure.
   * @property {string} monto - Monetary value of the foreclosure.
   * @property {string} status - Current status of the foreclosure (e.g., 'Activo', 'Próximo', 'Finalizado').
   */
  const recentForeclosures = [
    { id: 'EXP-2025-0112', property: 'Casa en Escazú', location: 'San José, Escazú', date: '2025-10-20', monto: '₡125,000,000', status: 'Activo' },
    { id: 'EXP-2025-0098', property: 'Terreno en Grecia', location: 'Alajuela, Grecia', date: '2025-10-22', monto: '₡45,000,000', status: 'Próximo' },
    { id: 'EXP-2025-0087', property: 'Apartamento en Curridabat', location: 'San José, Curridabat', date: '2025-10-23', monto: '₡78,500,000', status: 'Activo' },
    { id: 'EXP-2025-0101', property: 'Lote en Liberia', location: 'Guanacaste, Liberia', date: '2025-10-19', monto: '₡39,800,000', status: 'Finalizado' },
    { id: 'EXP-2025-0123', property: 'Casa Colonial en Heredia', location: 'Heredia, Barva', date: '2025-10-18', monto: '₡92,300,000', status: 'Activo' },
    { id: 'EXP-2025-0134', property: 'Quinta en San Ramón', location: 'Alajuela, San Ramón', date: '2025-10-21', monto: '₡130,000,000', status: 'Próximo' },
    { id: 'EXP-2025-0141', property: 'Edificio comercial en Cartago', location: 'Cartago, Central', date: '2025-10-17', monto: '₡210,000,000', status: 'Finalizado' },
    { id: 'EXP-2025-0147', property: 'Casa moderna en Santa Ana', location: 'San José, Santa Ana', date: '2025-10-24', monto: '₡185,000,000', status: 'Activo' },
    { id: 'EXP-2025-0152', property: 'Terreno agrícola en Orotina', location: 'Alajuela, Orotina', date: '2025-10-16', monto: '₡56,000,000', status: 'Finalizado' },
    { id: 'EXP-2025-0159', property: 'Apartamento en Rohrmoser', location: 'San José, Pavas', date: '2025-10-25', monto: '₡99,500,000', status: 'Próximo' },
    { id: 'EXP-2025-0165', property: 'Casa de playa en Jacó', location: 'Puntarenas, Jacó', date: '2025-10-15', monto: '₡275,000,000', status: 'Finalizado' },
    { id: 'EXP-2025-0172', property: 'Villa en Guanacaste', location: 'Guanacaste, Tamarindo', date: '2025-10-26', monto: '₡320,000,000', status: 'Activo' },
  ];

  /**
   * An array of objects representing featured properties.
   * @constant
   * @type {Array<object>}
   * @property {string} name - The name or description of the property.
   * @property {string} location - The location of the property.
   * @property {string} price - The price of the property.
   * @property {string} image - The URL of the property image.
   */
  const featuredProperties = [
    { name: 'Residencial Valle Azul', location: 'Heredia, Santo Domingo', price: '₡98,000,000', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Casa moderna en Rohrmoser', location: 'San José, Pavas', price: '₡135,000,000', image: 'https://images.unsplash.com/photo-1600585154363-4b46a6c2d5a2?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Casa de playa en Nosara', location: 'Guanacaste, Nosara', price: '₡375,000,000', image: 'https://images.unsplash.com/photo-1600585154206-3e7bf94a9b8d?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Apartamento en Escalante', location: 'San José, Barrio Escalante', price: '₡89,500,000', image: 'https://images.unsplash.com/photo-1600607687126-3a5f4c6b9f98?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Casa campestre en San Ramón', location: 'Alajuela, San Ramón', price: '₡120,000,000', image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Condominio Vista Verde', location: 'Cartago, Tres Ríos', price: '₡110,000,000', image: 'https://images.unsplash.com/photo-1600585154035-8c9b8de4e4c8?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Casa colonial en Grecia', location: 'Alajuela, Grecia', price: '₡140,000,000', image: 'https://images.unsplash.com/photo-1600047502057-64879ad50a70?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Residencial Bosques del Este', location: 'San José, Curridabat', price: '₡175,000,000', image: 'https://images.unsplash.com/photo-1600047502032-96d3f1683a7a?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Casa con vista al mar', location: 'Puntarenas, Jacó', price: '₡295,000,000', image: 'https://images.unsplash.com/photo-1600566753190-17f9a28a6e87?q=80&w=2000&auto=format&fit=crop' },
    { name: 'Villa en Santa Ana', location: 'San José, Santa Ana', price: '₡225,000,000', image: 'https://images.unsplash.com/photo-1600047502032-96d3f1683a7a?q=80&w=2000&auto=format&fit=crop' }
  ];

  /**
   * An array of objects representing top-rated agents.
   * @constant
   * @type {Array<object>}
   * @property {string} name - The name of the agent.
   * @property {number} rating - The agent's rating.
   * @property {number} properties - The number of properties sold by the agent.
   * @property {string} image - The URL of the agent's profile image.
   */
  const topAgents = [
    { name: 'Laura Fernández', rating: 5, properties: 112, image: 'https://randomuser.me/api/portraits/women/68.jpg' },
    { name: 'Carlos Jiménez', rating: 4.8, properties: 97, image: 'https://randomuser.me/api/portraits/men/74.jpg' },
    { name: 'María Gómez', rating: 4.7, properties: 89, image: 'https://randomuser.me/api/portraits/women/62.jpg' },
    { name: 'Javier Mora', rating: 4.6, properties: 85, image: 'https://randomuser.me/api/portraits/men/77.jpg' },
    { name: 'Andrea Solano', rating: 4.5, properties: 80, image: 'https://randomuser.me/api/portraits/women/65.jpg' },
    { name: 'Luis Vargas', rating: 4.4, properties: 75, image: 'https://randomuser.me/api/portraits/men/64.jpg' },
    { name: 'Ana Rodríguez', rating: 4.3, properties: 70, image: 'https://randomuser.me/api/portraits/women/71.jpg' },
    { name: 'David Rojas', rating: 4.3, properties: 68, image: 'https://randomuser.me/api/portraits/men/59.jpg' },
    { name: 'Sofía Hernández', rating: 4.2, properties: 65, image: 'https://randomuser.me/api/portraits/women/56.jpg' },
    { name: 'Ricardo Torres', rating: 4.1, properties: 62, image: 'https://randomuser.me/api/portraits/men/72.jpg' }
  ];
</script>

<style>
  :global(body) {
    font-family: 'Poppins', sans-serif;
  }
</style>

<div class="flex w-full flex-col">
  <!-- Tabs Superiores -->
  <div class="flex justify-center border-b bg-background">
    <div class="flex gap-6 p-4 overflow-x-auto">
      {#each nav as item}
        <button
          on:click={() => (activeTab = item.name)}
          class={`pb-2 border-b-2 transition-colors capitalize ${
            activeTab === item.name
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      {/each}
    </div>
  </div>

  {#if activeTab === 'dashboard'}
    <main class="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8">
      <!-- Cards Iniciales -->
      <CardsIniciales stats={dashboardStats} />

      <!-- Tabla Remates y Destacadas -->
      <div class="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <RematesRecientes {recentForeclosures} />
        <PropiedadesDestacadas {featuredProperties} />
      </div>

      <!-- Carrusel -->
      <div>
        <Carousel />
      </div>

      <!-- Agentes Destacados -->
      <AgentesDestacados {topAgents} />
    </main>
  {:else}
    <div class="flex justify-center items-center h-64 text-muted-foreground text-sm">
      Contenido en desarrollo para <b class="ml-1 capitalize">{activeTab}</b>.
    </div>
  {/if}
</div>
