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
		let automatizaciones = [];

		if (esAdmin) {
			// Administradores pueden ver todas o filtrar por cliente
			if (clienteIdParam) {
				automatizaciones = await services.automatizaciones.getByCliente(clienteIdParam);
			} else {
				automatizaciones = await services.automatizaciones.getAll();
			}
		} else if (clienteId) {
			// Usuarios regulares solo ven su cliente
			automatizaciones = await services.automatizaciones.getByCliente(clienteId);
		}

		// Obtener última ejecución para cada automatización
		const automatizacionesConUltimaEjecucion = await Promise.all(
			automatizaciones.map(async (auto) => {
				const conEjecucion = await services.automatizaciones.getByIdWithLastExecution(
					auto.id
				);
				return conEjecucion || auto;
			})
		);

		return json({ automatizaciones: automatizacionesConUltimaEjecucion });
	} catch (err) {
		console.error('Error en GET /api/automatizaciones:', err);
		throw error(500, 'Error al obtener automatizaciones');
	}
};
