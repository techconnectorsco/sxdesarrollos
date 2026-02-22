<script lang="ts">
  /**
   * @module PropertyCarousel
   * @description This component implements an image carousel for displaying featured properties.
   * It includes automatic sliding, pause-on-hover functionality, and manual navigation controls.
   */
	import * as Carousel from "$lib/components/ui/carousel/index.js";
	import { Button } from "$lib/components/ui/button";
	import { onMount, onDestroy } from "svelte";

	/**
	 * An array of slide objects, each containing details for a property display in the carousel.
	 * @type {Array<object>}
	 * @property {string} title - The main title for the slide.
	 * @property {string} subtitle - A descriptive subtitle for the slide.
	 * @property {string} image - The URL of the image to display for the slide.
	 */
	let slides = [
		{ title: "Residencia Moderna en Escazú", subtitle: "Vista panorámica y diseño contemporáneo", image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Casa Familiar en Santa Ana", subtitle: "Amplio jardín y acabados de lujo", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Apartamento Urbano en Curridabat", subtitle: "Cerca de todo, ideal para profesionales", image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Villa de Lujo en Guanacaste", subtitle: "Piscina infinita y acceso a la playa", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Loft Minimalista en San José", subtitle: "Perfecto para estilo de vida urbano", image: "https://images.unsplash.com/photo-1599423300746-b62533397364?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Casa de Campo en Atenas", subtitle: "Rodeada de naturaleza y vistas al valle", image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Penthouse en Rohrmoser", subtitle: "Terraza privada con vista al atardecer", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Casa Colonial Restaurada", subtitle: "Encanto histórico con toques modernos", image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Villa Costera en Tamarindo", subtitle: "Ideal para escapadas familiares", image: "https://images.unsplash.com/photo-1613977257684-5e3a62ad3d52?q=80&w=1800&auto=format&fit=crop" },
		{ title: "Residencia Panorámica en Heredia", subtitle: "Vistas al valle central y clima perfecto", image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1800&auto=format&fit=crop" }
	];

	/**
	 * The index of the currently displayed slide in the carousel.
	 * @type {number}
	 */
	let current = 0;
	/**
	 * Stores the interval ID for automatic slide transitions.
	 * @type {ReturnType<typeof setInterval> | null}
	 */
	let interval: ReturnType<typeof setInterval> | null = null;
	/**
	 * Indicates whether the automatic slide transition is paused (e.g., on hover).
	 * @type {boolean}
	 */
	let isPaused = false;

	onMount(() => startAutoSlide());
	onDestroy(() => interval && clearInterval(interval));

	/**
	 * Starts the automatic slide transition at a 5-second interval.
	 * The slide transition is skipped if `isPaused` is true.
	 * @returns {void}
	 */
	function startAutoSlide() {
		interval = setInterval(() => {
			if (!isPaused) nextSlide();
		}, 5000);
	}

	/**
	 * Advances the carousel to the next slide in the sequence.
	 * It wraps around to the first slide if the end is reached.
	 * @returns {void}
	 */
	function nextSlide() {
		current = (current + 1) % slides.length;
	}

	/**
	 * Moves the carousel to the previous slide in the sequence.
	 * It wraps around to the last slide if currently at the first slide.
	 * @returns {void}
	 */
	function prevSlide() {
		current = (current - 1 + slides.length) % slides.length;
	}
</script>

<section
	class="w-full flex flex-col justify-center py-4"
	on:mouseenter={() => (isPaused = true)}
	on:mouseleave={() => (isPaused = false)}
>
	<div class="relative w-full rounded-xl overflow-hidden shadow-lg">
		<Carousel.Root class="relative rounded-xl">
			<Carousel.Content class="min-h-[220px] md:min-h-[300px]">
				{#each slides as slide, i (i)}
					<Carousel.Item
						class="transition-opacity duration-700 ease-in-out absolute top-0 left-0 w-full"
						style="opacity: {i === current ? 1 : 0}; z-index: {i === current ? 10 : 0};"
					>
						<div
							class="block h-[220px] md:h-[300px] lg:h-[340px] bg-cover bg-center rounded-xl relative group"
							style="background-image: url('{slide.image}')"
						>
							<!-- Overlay -->
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-xl transition-opacity group-hover:opacity-70"
							></div>

							<!-- Texto -->
<div class="absolute bottom-16 left-8 md:bottom-20 md:left-12 z-10 text-white space-y-3 max-w-[80%]">
	<h3 class="text-2xl md:text-3xl font-semibold drop-shadow-lg">{slide.title}</h3>
	<p class="text-base md:text-lg text-gray-200 leading-snug">{slide.subtitle}</p>

	<Button
		variant="secondary"
		size="sm"
		class="mt-3 px-8 py-3.5 text-lg font-semibold bg-white/90 text-gray-800 hover:bg-white rounded-xl shadow-lg"
	>
		Ver Detalle
	</Button>
</div>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>

			<!-- Controles -->
			<button
				on:click={prevSlide}
				class="absolute top-1/2 left-2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white rounded-full p-1.5 shadow-md backdrop-blur-sm"
				aria-label="Anterior"
			>
				‹
			</button>
			<button
				on:click={nextSlide}
				class="absolute top-1/2 right-2 -translate-y-1/2 z-20 bg-white/70 hover:bg-white rounded-full p-1.5 shadow-md backdrop-blur-sm"
				aria-label="Siguiente"
			>
				›
			</button>

			<!-- Indicadores -->
			<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
				{#each slides as _, i}
					<div
						class={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`}
					></div>
				{/each}
			</div>
		</Carousel.Root>
	</div>
</section>
