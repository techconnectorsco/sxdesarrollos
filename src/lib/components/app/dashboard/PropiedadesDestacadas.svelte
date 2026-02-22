<script lang="ts">
  /**
   * @module PropiedadesDestacadas
   * @description This component displays a list of featured properties, showcasing key details like name, location, price, and an image.
   * It provides a quick overview of attractive real estate opportunities.
   */
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { ArrowUpRight } from 'lucide-svelte';

  /**
   * @property {Array<object>} featuredProperties - An array of property objects to display.
   * @property {string} featuredProperties[].name - The name or title of the property.
   * @property {string} featuredProperties[].location - The geographical location of the property.
   * @property {string} featuredProperties[].price - The price of the property.
   * @property {string} featuredProperties[].image - The URL of the property's main image.
   */
  export let featuredProperties: {
    name: string;
    location: string;
    price: string;
    image: string;
  }[];
</script>

<Card.Root>
  <Card.Header class="flex flex-row items-center">
    <div class="grid gap-2">
      <Card.Title>Mis Propiedades</Card.Title>
      <Card.Description>Aqui veras las propiedades que hayas publicado.</Card.Description>
    </div>
  </Card.Header>
  <Card.Content class="grid gap-6">
    {#each featuredProperties as p}
      <div class="flex items-center gap-4">
        <Avatar.Root class="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
          <Avatar.Image src={p.image} alt={p.name} class="object-cover w-full h-full" />
          <Avatar.Fallback>{p.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
        <div class="grid gap-1">
          <p class="text-sm font-medium leading-none">{p.name}</p>
          <p class="text-xs text-muted-foreground">{p.location}</p>
        </div>
        <div class="ml-auto font-medium">{p.price}</div>
      </div>
    {/each}
  </Card.Content>
</Card.Root>
