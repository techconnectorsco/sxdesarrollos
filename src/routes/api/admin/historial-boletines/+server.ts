import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parámetros opcionales
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Obtener historial ordenado por fecha más reciente
		const { data, error, count } = await supabase
			.from('historial_procesamiento_boletines')
			.select(`
				id,
				numero_boletin,
				nombre_archivo,
				procesado_en,
				total_entradas,
				total_propiedades,
				cantidad_insertados,
				cantidad_actualizados,
				cantidad_errores,
				estado,
				notas
			`, { count: 'exact' })
			.order('procesado_en', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error('Error obteniendo historial:', error);
			return json({ error: error.message }, { status: 500 });
		}

		return json({
			success: true,
			data: data || [],
			total: count || 0,
			limit,
			offset
		});

	} catch (err: any) {
		console.error('Error en historial-boletines API:', err);
		return json({ 
			error: 'Error interno del servidor',
			message: err.message 
		}, { status: 500 });
	}
};