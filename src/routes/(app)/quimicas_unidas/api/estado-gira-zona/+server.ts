import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// GET /quimicas_unidas/api/estado-gira-zona?job=a1b2c3d4
// Consulta en el VPS cómo terminó una gira selectiva ya encolada.
// Solo lectura: el estado vive en memoria del proceso de la API, no dispara nada.
//
// Existe para que el panel pueda mostrar los clientes OMITIDOS. El POST de
// ejecutar-gira-zona solo alcanza a decir "encolada": los omitidos se conocen
// recién cuando el worker termina de evaluar los documentos en SAP.
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw error(401, 'No autorizado');

	const jobId = url.searchParams.get('job')?.trim();
	if (!jobId) throw error(400, "Falta el parámetro 'job'");

	const VPS_API_URL = env.VPS_API_URL || 'https://statistic-auction-snowstorm.ngrok-free.dev';

	try {
		const res = await fetch(`${VPS_API_URL}/api/estado-gira-zona/${encodeURIComponent(jobId)}`);
		if (!res.ok) throw new Error(`El VPS respondió con estado: ${res.status}`);
		return json(await res.json());
	} catch (e) {
		console.error('[quimicas_unidas] error consultando estado de gira-zona:', e);
		throw error(502, 'No se pudo consultar el estado de la gira.');
	}
};
