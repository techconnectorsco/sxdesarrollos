import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =====================================================
// GET - Listar todos los anuncios
// =====================================================
export const GET: RequestHandler = async () => {
	try {
		// 1. Obtener todos los anuncios
		const { data: anuncios, error } = await supabase
			.from('anuncios')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error al obtener anuncios:', error);
			return json({ error: 'Error al cargar anuncios' }, { status: 500 });
		}

		// 2. Obtener IDs únicos de usuarios
		const userIds = [...new Set(anuncios.map(a => a.user_id).filter(Boolean))];

		// 3. Obtener datos de usuarios desde perfiles
		const { data: usuarios } = await supabase
			.from('perfiles')
			.select('id, email, nombre_completo')
			.in('id', userIds);

		// 4. Crear mapa de usuarios para acceso rápido
		const usuariosMap = new Map();
		usuarios?.forEach(u => {
			usuariosMap.set(u.id, {
				email: u.email,
				nombre_completo: u.nombre_completo
			});
		});

		// 5. Combinar datos manteniendo la estructura users_view esperada
		const anunciosFormateados = anuncios.map(anuncio => ({
			...anuncio,
			users_view: usuariosMap.get(anuncio.user_id) || null
		}));

		return json({
			success: true,
			anuncios: anunciosFormateados
		});

	} catch (error: any) {
		console.error('Error en GET /api/admin/anuncios:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

// =====================================================
// POST - Aprobar o Rechazar anuncio
// =====================================================
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { anuncio_id, action, razon_rechazo, notas_admin, revisado_por } = body;

		if (!anuncio_id || !action) {
			return json({ 
				error: 'Faltan parámetros requeridos: anuncio_id, action' 
			}, { status: 400 });
		}

		let updateData: any = {
			fecha_revision: new Date().toISOString(),
			revisado_por: revisado_por || null,
			notas_admin: notas_admin || null
		};

		// ===== APROBAR =====
		if (action === 'aprobar') {
			updateData.estado = 'activo';
			updateData.publico = true;
			updateData.razon_rechazo = null;

			const { data, error } = await supabase
				.from('anuncios')
				.update(updateData)
				.eq('id', anuncio_id)
				.select()
				.single();

			if (error) {
				console.error('Error al aprobar:', error);
				return json({ error: 'Error al aprobar anuncio' }, { status: 500 });
			}

			// console.log(`✅ Anuncio ${anuncio_id} aprobado`);

			return json({
				success: true,
				message: 'Anuncio aprobado exitosamente',
				anuncio: data
			});
		}

		// ===== RECHAZAR =====
		if (action === 'rechazar') {
			if (!razon_rechazo) {
				return json({ 
					error: 'razon_rechazo es requerida para rechazar' 
				}, { status: 400 });
			}

			updateData.estado = 'rechazado';
			updateData.publico = false;
			updateData.razon_rechazo = razon_rechazo;

			const { data, error } = await supabase
				.from('anuncios')
				.update(updateData)
				.eq('id', anuncio_id)
				.select()
				.single();

			if (error) {
				console.error('Error al rechazar:', error);
				return json({ error: 'Error al rechazar anuncio' }, { status: 500 });
			}

			// console.log(`❌ Anuncio ${anuncio_id} rechazado: ${razon_rechazo}`);

			return json({
				success: true,
				message: 'Anuncio rechazado',
				anuncio: data
			});
		}

		return json({ 
			error: 'Acción no válida. Usa: aprobar o rechazar' 
		}, { status: 400 });

	} catch (error: any) {
		console.error('Error en POST /api/admin/anuncios:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

// =====================================================
// PATCH - Cambiar visibilidad (público/privado)
// =====================================================
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { anuncio_id, publico } = body;

		if (!anuncio_id || typeof publico !== 'boolean') {
			return json({ 
				error: 'Faltan parámetros: anuncio_id (string), publico (boolean)' 
			}, { status: 400 });
		}

		const { data, error } = await supabase
			.from('anuncios')
			.update({
				publico: publico,
				updated_at: new Date().toISOString()
			})
			.eq('id', anuncio_id)
			.select()
			.single();

		if (error) {
			console.error('Error al cambiar visibilidad:', error);
			return json({ error: 'Error al cambiar visibilidad' }, { status: 500 });
		}

		// console.log(`👁️ Anuncio ${anuncio_id} → ${publico ? 'público' : 'privado'}`);

		return json({
			success: true,
			message: `Anuncio ahora es ${publico ? 'público' : 'privado'}`,
			anuncio: data
		});

	} catch (error: any) {
		console.error('Error en PATCH /api/admin/anuncios:', error);
		return json({ error: error.message }, { status: 500 });
	}
};

// =====================================================
// DELETE - Eliminar anuncio (opcional - para futuro)
// =====================================================
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { anuncio_id } = body;

		if (!anuncio_id) {
			return json({ error: 'anuncio_id requerido' }, { status: 400 });
		}

		const { error } = await supabase
			.from('anuncios')
			.delete()
			.eq('id', anuncio_id);

		if (error) {
			console.error('Error al eliminar:', error);
			return json({ error: 'Error al eliminar anuncio' }, { status: 500 });
		}

		// console.log(`🗑️ Anuncio ${anuncio_id} eliminado`);

		return json({
			success: true,
			message: 'Anuncio eliminado'
		});

	} catch (error: any) {
		console.error('Error en DELETE /api/admin/anuncios:', error);
		return json({ error: error.message }, { status: 500 });
	}
};