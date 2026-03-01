import type { PageServerLoad } from './$types';
import { createServices } from '$lib/services';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	const {
		locals: { supabase },
		parent
	} = event;

	// Datos provenientes de los layouts padres (+layout.ts y (app)/+layout.server.ts)
	const parentData = await parent();
	const { session, user } = parentData as {
		session: any;
		user: any;
	};

	if (!session || !user) {
		throw error(401, 'No autenticado');
	}

	const services = createServices(supabase);

	// Obtener el cliente_id del usuario desde su metadata o perfil
	// Por ahora asumimos que está en user.user_metadata.cliente_id
	// O podrías tener una tabla de perfiles que relacione usuarios con clientes
	const clienteId = user.user_metadata?.cliente_id || null;
	const esAdmin = user.user_metadata?.es_admin === true || user.email?.includes('admin');

	try {
		let automatizaciones: any[] = [];
		let ejecuciones: any[] = [];
		let estadisticas: any = null;
		let proyectos: any[] = [];

		if (esAdmin) {
			// Administradores ven todo
			automatizaciones = await services.automatizaciones.getAll();
			ejecuciones = await services.automatizaciones.getAllEjecucionesRecientes(20);
			proyectos = await services.proyectos.getAll();
		} else if (clienteId) {
			// Usuarios regulares ven solo su cliente
			automatizaciones = await services.automatizaciones.getByCliente(clienteId);
			ejecuciones = await services.automatizaciones.getEjecucionesRecientes(clienteId, 20);
			estadisticas = await services.automatizaciones.getEstadisticas(clienteId);
			proyectos = await services.proyectos.getByCliente(clienteId);
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

		return {
			automatizaciones: automatizacionesConUltimaEjecucion,
			ejecuciones,
			estadisticas,
			proyectos,
			clienteId,
			esAdmin
		};
	} catch (err) {
		console.error('Error cargando dashboard:', err);
		throw error(500, 'Error al cargar datos del dashboard');
	}
};
