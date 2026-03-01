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
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const automatizacionId = url.searchParams.get('automatizacion_id');

	try {
		let ejecuciones = [];

		if (automatizacionId) {
			// Obtener ejecuciones de una automatización específica
			ejecuciones = await services.automatizaciones.getEjecuciones(automatizacionId, limit);
		} else if (esAdmin) {
			// Administradores ven todas las ejecuciones
			ejecuciones = await services.automatizaciones.getAllEjecucionesRecientes(limit);
		} else if (clienteId) {
			// Usuarios regulares ven solo ejecuciones de su cliente
			ejecuciones = await services.automatizaciones.getEjecucionesRecientes(clienteId, limit);
		}

		return json({ ejecuciones });
	} catch (err) {
		console.error('Error en GET /api/ejecuciones:', err);
		throw error(500, 'Error al obtener ejecuciones');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		throw error(401, 'No autenticado');
	}

	const services = createServices(supabase);
	const body = await request.json();

	try {
		const ejecucion = await services.automatizaciones.crearEjecucion({
			automatizacion_id: body.automatizacion_id,
			fecha_inicio: body.fecha_inicio || new Date().toISOString(),
			estado: body.estado,
			metricas: body.metricas || null,
			log_salida: body.log_salida || null,
			observaciones: body.observaciones || null
		});

		return json({ ejecucion }, { status: 201 });
	} catch (err) {
		console.error('Error en POST /api/ejecuciones:', err);
		throw error(500, 'Error al crear ejecución');
	}
};
