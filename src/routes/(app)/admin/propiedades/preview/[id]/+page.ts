import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch, parent }) => {
	const { id } = params;
	
	// Obtener user del layout padre
	const { user } = await parent();

	try {
		// Llamar API admin que usa Service Role Key
		const response = await fetch(`/api/admin/anuncios/${id}`);

		if (!response.ok) {
			throw error(404, 'Anuncio no encontrado');
		}

		const data = await response.json();

		return {
			anuncio: data.anuncio,
			user
		};
	} catch (err) {
		console.error('Error cargando anuncio:', err);
		throw error(404, 'Anuncio no encontrado');
	}
};