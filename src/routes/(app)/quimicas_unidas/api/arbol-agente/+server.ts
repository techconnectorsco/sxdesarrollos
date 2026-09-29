import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { obtenerArbolAgente } from '$lib/quimicas_unidas/sap';

// GET /quimicas_unidas/api/arbol-agente?agente=7
// Devuelve { agente, zonas[], sinZona[] } — el árbol para la gira selectiva.
// Solo lectura: no dispara ningún proceso del RPA.
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw error(401, 'No autorizado');

	const codigo = url.searchParams.get('agente');
	if (!codigo) throw error(400, "Falta el parámetro 'agente'");

	const numero = Number(codigo);
	if (!Number.isFinite(numero)) throw error(400, "El parámetro 'agente' debe ser numérico");

	try {
		return json(await obtenerArbolAgente(numero));
	} catch (e) {
		console.error('[quimicas_unidas] error obteniendo árbol de agente:', e);
		throw error(502, 'No se pudo obtener el árbol de zonas desde el Service Layer');
	}
};
