<script lang="ts">
  /**
   * @module RematesRecientes
   * @description This component displays a table of recent foreclosure listings, providing key information such as expediente ID, property, location, date, and base amount.
   * It offers a quick overview of newly available foreclosure opportunities.
   */
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { ArrowUpRight } from 'lucide-svelte';

  /**
   * @property {Array<object>} recentForeclosures - An array of foreclosure objects to display in the table.
   * @property {string} recentForeclosures[].id - The unique identifier or expediente number for the foreclosure.
   * @property {string} recentForeclosures[].property - The name or description of the property under foreclosure.
   * @property {string} recentForeclosures[].location - The geographical location of the property.
   * @property {string} recentForeclosures[].date - The date associated with the foreclosure listing (e.g., publication or auction date).
   * @property {string} recentForeclosures[].monto - The base monetary amount of the foreclosure.
   * @property {string} [recentForeclosures[].status] - The current status of the foreclosure (optional).
   */
  export let recentForeclosures: {
    id: string;
    property: string;
    location: string;
    date: string;
    monto: string;
    status?: string;
  }[];
</script>

<Card.Root class="xl:col-span-2">
  <Card.Header class="flex flex-row items-center">
    <div class="grid gap-2">
      <Card.Title>Remates recientes</Card.Title>
      <Card.Description>Últimas actualizaciones judiciales en proceso.</Card.Description>
    </div>
    <Button size="sm" class="ml-auto gap-1">
      Ver todos
      <ArrowUpRight class="h-4 w-4" />
    </Button>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Expediente</Table.Head>
          <Table.Head>Propiedad</Table.Head>
          <Table.Head>Ubicación</Table.Head>
          <Table.Head>Fecha</Table.Head>
          <Table.Head class="text-right">Monto base</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each recentForeclosures as f}
          <Table.Row>
            <Table.Cell class="font-medium">{f.id}</Table.Cell>
            <Table.Cell>{f.property}</Table.Cell>
            <Table.Cell>{f.location}</Table.Cell>
            <Table.Cell>{f.date}</Table.Cell>
            <Table.Cell class="text-right">{f.monto}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
</Card.Root>
