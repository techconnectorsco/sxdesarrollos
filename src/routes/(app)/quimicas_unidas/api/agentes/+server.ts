import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { obtenerAgentes } from '$lib/quimicas_unidas/sap';

// GET /quimicas_unidas/api/agentes
// Devuelve { total, agentes[] } — solo agentes con correo asignado en SAP.
export const GET: RequestHandler = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw error(401, 'No autorizado');

	try {
		const data = await obtenerAgentes();
		return json(data);
	} catch (e) {
		console.error('[quimicas_unidas] error al obtener agentes:', e);
		throw error(502, 'No se pudo obtener la lista de agentes desde el Service Layer');
	}
};