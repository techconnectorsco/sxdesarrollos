import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Configuración del adapter de Vercel con maxDuration extendido
		adapter: adapter({
			maxDuration: 600 // Duración máxima en segundos (10 minutos)
		})
	}
};

export default config;
