<script lang="ts">
  /**
   * @module CardsInciales
   * @description This component displays key initial statistics in a card-based layout for the dashboard.
   * It shows metrics such as total properties, active foreclosures, user inquiries, and new properties.
   */
  import { Building, DollarSign, Users, Calendar } from 'lucide-svelte';
  import * as Card from '$lib/components/ui/card/index.js';

  /**
   * @property {object} stats - An object containing various statistics to display.
   * @property {number} stats.totalProperties - The total number of registered properties.
   * @property {number} stats.activeForeclosures - The number of active foreclosures.
   * @property {number} stats.userInquiries - The number of user inquiries.
   * @property {number} stats.newProperties - The number of new properties listed.
   */
  export let stats: {
    totalProperties: number;
    activeForeclosures: number;
    userInquiries: number;
    newProperties: number;
  };
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between pb-2">
      <Card.Title class="text-sm font-medium">Propiedades Registradas</Card.Title>
      <Building class="h-4 w-4 text-muted-foreground" />
    </Card.Header>
    <Card.Content>
      <div class="text-2xl font-bold">{stats.totalProperties}</div>
      <p class="text-xs text-muted-foreground">+12 nuevas esta semana</p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between pb-2">
      <Card.Title class="text-sm font-medium">Remates Activos</Card.Title>
      <DollarSign class="h-4 w-4 text-muted-foreground" />
    </Card.Header>
    <Card.Content>
      <div class="text-2xl font-bold">{stats.activeForeclosures}</div>
      <p class="text-xs text-muted-foreground">+5 nuevos hoy</p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between pb-2">
      <Card.Title class="text-sm font-medium">Consultas de Usuarios</Card.Title>
      <Users class="h-4 w-4 text-muted-foreground" />
    </Card.Header>
    <Card.Content>
      <div class="text-2xl font-bold">{stats.userInquiries}</div>
      <p class="text-xs text-muted-foreground">+28% este mes</p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between pb-2">
      <Card.Title class="text-sm font-medium">Nuevas Propiedades</Card.Title>
      <Calendar class="h-4 w-4 text-muted-foreground" />
    </Card.Header>
    <Card.Content>
      <div class="text-2xl font-bold">{stats.newProperties}</div>
      <p class="text-xs text-muted-foreground">últimos 7 días</p>
    </Card.Content>
  </Card.Root>
</div>
