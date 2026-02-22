import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async () => {
	try {
		// Obtener estadísticas generales
		const { data: rematesData, error } = await supabase
			.from('propiedades_remates')
			.select('status, is_active, provincia');

		if (error) {
			console.error('Error obteniendo remates:', error);
			return json({ error: error.message }, { status: 500 });
		}

		// Calcular estadísticas
		const total_remates = rematesData.length;
		const activos = rematesData.filter(r => r.is_active).length;
		const primera_subasta = rematesData.filter(r => r.status === 'active').length;
		const segunda_subasta = rematesData.filter(r => r.status === 'segunda_subasta').length;
		const tercera_subasta = rematesData.filter(r => r.status === 'tercera_subasta').length;
		const finalizados = rematesData.filter(r => r.status === 'finalizado').length;

		// Distribución por provincia
		const por_provincia = rematesData.reduce((acc: any, remate) => {
			if (remate.provincia && remate.is_active) {
				acc[remate.provincia] = (acc[remate.provincia] || 0) + 1;
			}
			return acc;
		}, {});

		return json({
			total_remates,
			activos,
			primera_subasta,
			segunda_subasta,
			tercera_subasta,
			finalizados,
			por_provincia
		});

	} catch (error: any) {
		console.error('Error en stats:', error);
		return json({ error: error.message }, { status: 500 });
	}
};