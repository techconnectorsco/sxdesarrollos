import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServices } from '$lib/services';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'No autenticado');
	}

	const services = createServices(supabase);
	const clienteId = user.user_metadata?.cliente_id || null;
	const esAdmin = user.user_metadata?.es_admin === true || user.email?.includes('admin');
	const clienteIdParam = url.searchParams.get('cliente_id');

	try {
		let proyectos = [];

		if (esAdmin) {
			// Administradores pueden ver todos o filtrar por cliente
			if (clienteIdParam) {
				proyectos = await services.proyectos.getByCliente(clienteIdParam);
			} else {
				proyectos = await services.proyectos.getAll();
			}
		} else if (clienteId) {
			// Usuarios regulares solo ven su cliente
			proyectos = await services.proyectos.getByCliente(clienteId);
		}

		return json({ proyectos });
	} catch (err) {
		console.error('Error en GET /api/proyectos:', err);
		throw error(500, 'Error al obtener proyectos');
	}
};
