import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async () => {
	try {
		// ========================================
		// ANUNCIOS (Propiedades publicadas)
		// ========================================
		
		// Total anuncios
		const { count: totalAnuncios } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true });

		// Anuncios por tipo de transacción
		const { data: anunciosPorTipo } = await supabase
			.from('anuncios')
			.select('tipo_transaccion');

		const ventasCount = anunciosPorTipo?.filter(a => a.tipo_transaccion === 'venta').length || 0;
		const alquileresCount = anunciosPorTipo?.filter(a => a.tipo_transaccion === 'alquiler').length || 0;
		const proyectosCount = anunciosPorTipo?.filter(a => a.tipo_transaccion === 'proyecto').length || 0;

		// Anuncios ACTIVOS y PÚBLICOS
		const { count: anunciosActivos } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.eq('estado', 'activo')
			.eq('publico', true);

		// Anuncios PENDIENTES DE REVISIÓN
		const { count: anunciosPendientes } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.eq('estado', 'pendiente_revision');

		// Anuncios RECHAZADOS
		const { count: anunciosRechazados } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.eq('estado', 'rechazado');

		// Anuncios PAUSADOS
		const { count: anunciosPausados } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.eq('estado', 'pausado');

		// Anuncios DESTACADOS
		const { count: anunciosDestacados } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.eq('destacado', true);

		// ========================================
		// REMATES
		// ========================================
		
		// Total remates
		const { count: totalRemates } = await supabase
			.from('propiedades_remates')
			.select('*', { count: 'exact', head: true });

		// Remates ACTIVOS
		const { count: rematesActivos } = await supabase
			.from('propiedades_remates')
			.select('*', { count: 'exact', head: true })
			.eq('is_active', true);

		// Remates por número de subasta (basado en fechas)
		const { data: rematesConFechas } = await supabase
			.from('propiedades_remates')
			.select('first_auction_date, second_auction_date, third_auction_date')
			.eq('is_active', true);

		let rematesPrimeraSubasta = 0;
		let rematesSegundaSubasta = 0;
		let rematesTerceraSubasta = 0;

		rematesConFechas?.forEach(r => {
			if (r.third_auction_date) {
				rematesTerceraSubasta++;
			} else if (r.second_auction_date) {
				rematesSegundaSubasta++;
			} else if (r.first_auction_date) {
				rematesPrimeraSubasta++;
			}
		});

		// ========================================
		// USUARIOS
		// ========================================
		
		// Total usuarios registrados (desde auth.users via RPC o admin API)
		// Nota: auth.users no es accesible directamente, usar profiles si existe
		const { count: totalUsuarios } = await supabase
			.from('perfiles')
			.select('*', { count: 'exact', head: true });

		// Usuarios activos (que han publicado al menos 1 anuncio)
		const { data: usuariosConAnuncios } = await supabase
			.from('anuncios')
			.select('user_id')
			.not('user_id', 'is', null);

		const usuariosActivosCount = new Set(usuariosConAnuncios?.map(a => a.user_id)).size;

		// ========================================
		// CONSULTAS
		// ========================================
		
		// Total consultas/inquiries
		const { count: totalConsultas } = await supabase
			.from('consultas')
			.select('*', { count: 'exact', head: true });

		// ========================================
		// ACTIVIDAD RECIENTE
		// ========================================

		// Anuncios creados HOY
		const hoy = new Date().toISOString().split('T')[0];
		const { count: anunciosHoy } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', hoy);

		// Anuncios creados esta SEMANA
		const hace7dias = new Date();
		hace7dias.setDate(hace7dias.getDate() - 7);
		const { count: anunciosSemana } = await supabase
			.from('anuncios')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', hace7dias.toISOString());

		// ========================================
		// STATS ADICIONALES
		// ========================================

		// Anuncios con mayor engagement (vistas)
		const { data: topAnuncios } = await supabase
			.from('anuncios')
			.select('titulo, vistas_total, contactos_recibidos')
			.eq('estado', 'activo')
			.order('vistas_total', { ascending: false })
			.limit(5);

		// Total vistas
		const { data: vistasTotales } = await supabase
			.from('anuncios')
			.select('vistas_total');
		
		const totalVistas = vistasTotales?.reduce((sum, a) => sum + (a.vistas_total || 0), 0) || 0;

		// Total contactos recibidos
		const { data: contactosTotales } = await supabase
			.from('anuncios')
			.select('contactos_recibidos');
		
		const totalContactos = contactosTotales?.reduce((sum, a) => sum + (a.contactos_recibidos || 0), 0) || 0;

		// ========================================
		// RETORNAR STATS COMPLETAS
		// ========================================

		return json({
			// ANUNCIOS
			anuncios: {
				total: totalAnuncios || 0,
				activos: anunciosActivos || 0,
				pendientes_revision: anunciosPendientes || 0,
				rechazados: anunciosRechazados || 0,
				pausados: anunciosPausados || 0,
				destacados: anunciosDestacados || 0,
				por_tipo: {
					ventas: ventasCount,
					alquileres: alquileresCount,
					proyectos: proyectosCount
				},
				recientes: {
					hoy: anunciosHoy || 0,
					esta_semana: anunciosSemana || 0
				}
			},

			// REMATES
			remates: {
				total: totalRemates || 0,
				activos: rematesActivos || 0,
				primera_subasta: rematesPrimeraSubasta,
				segunda_subasta: rematesSegundaSubasta,
				tercera_subasta: rematesTerceraSubasta
			},

			// USUARIOS
			usuarios: {
				total: totalUsuarios || 0,
				activos: usuariosActivosCount
			},

			// CONSULTAS
			consultas: {
				total: totalConsultas || 0
			},

			// ENGAGEMENT
			engagement: {
				total_vistas: totalVistas,
				total_contactos: totalContactos,
				top_anuncios: topAnuncios || []
			}
		});

	} catch (error: any) {
		console.error('Error obteniendo stats del dashboard:', error);
		
		return json({
			anuncios: {
				total: 0,
				activos: 0,
				pendientes_revision: 0,
				rechazados: 0,
				pausados: 0,
				destacados: 0,
				por_tipo: { ventas: 0, alquileres: 0, proyectos: 0 },
				recientes: { hoy: 0, esta_semana: 0 }
			},
			remates: {
				total: 0,
				activos: 0,
				primera_subasta: 0,
				segunda_subasta: 0,
				tercera_subasta: 0
			},
			usuarios: {
				total: 0,
				activos: 0
			},
			consultas: {
				total: 0
			},
			engagement: {
				total_vistas: 0,
				total_contactos: 0,
				top_anuncios: []
			}
		}, { status: 500 });
	}
};