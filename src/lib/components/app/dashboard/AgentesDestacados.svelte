<script lang="ts">
  /**
   * @module AgentesDestacados
   * @description This component displays a list of top-rated real estate agents.
   * It shows agent names, ratings, number of properties sold, and a profile image.
   */
  import * as Card from '$lib/components/ui/card/index.js';
  import { Star } from 'lucide-svelte';

  /**
   * @property {Array<object>} topAgents - An array of agent objects to display.
   * @property {string} topAgents[].name - The name of the agent.
   * @property {number} topAgents[].rating - The agent's rating (e.g., 1-5 stars).
   * @property {number} topAgents[].properties - The number of properties sold by the agent.
   * @property {string} topAgents[].image - The URL of the agent's profile image.
   */
  export let topAgents: {
    name: string;
    rating: number;
    properties: number;
    image: string;
  }[];
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Agentes con mejor valoración</Card.Title>
    <Card.Description>Top 10 agentes más destacados.</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {#each topAgents as a}
        <div class="p-4 bg-card rounded-xl shadow-md flex flex-col items-center text-center">
          <img src={a.image} alt={a.name} class="w-16 h-16 rounded-full mb-3 object-cover" />
          <p class="font-semibold text-sm">{a.name}</p>
          <div class="flex items-center justify-center text-yellow-400">
            {#each Array(Math.round(a.rating)) as _}
              <Star class="h-4 w-4 fill-yellow-400" />
            {/each}
          </div>
          <p class="text-xs text-muted-foreground mt-1">{a.properties} propiedades vendidas</p>
        </div>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
