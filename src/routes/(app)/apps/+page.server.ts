import type { PageServerLoad } from './$types';
import { createServices } from '$lib/services';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase }, data }) => {
	const { session, user } = data;

	if (!session || !user) {
		throw error(401, 'No autenticado');
	}

	const services = createServices(supabase);
	const clienteId = user.user_metadata?.cliente_id || null;
	const esAdmin = user.user_metadata?.es_admin === true || user.email?.includes('admin');

	try {
		let proyectos = [];

		if (esAdmin) {
			proyectos = await services.proyectos.getAll();
		} else if (clienteId) {
			proyectos = await services.proyectos.getByCliente(clienteId);
		}

		return {
			proyectos,
			clienteId,
			esAdmin
		};
	} catch (err) {
		console.error('Error cargando aplicaciones:', err);
		throw error(500, 'Error al cargar aplicaciones');
	}
};
