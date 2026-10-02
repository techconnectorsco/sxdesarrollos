import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// GET /quimicas_unidas/api/arbol-agente?agente=7[&refrescar=1]
//
// Devuelve { agente, zonas[], sinZona[], totalElegibles, totalNoElegibles } —
// el árbol para la gira selectiva, con la elegibilidad ya resuelta.
// Solo lectura: no dispara ningún proceso del RPA.
//
// POR QUÉ PROXEA AL VPS Y YA NO LE HABLA A SAP DIRECTO
// ----------------------------------------------------
// Antes esto llamaba a obtenerArbolAgente() de sap.ts, que armaba el árbol con
// los clientes cuya FICHA tenía SalesPersonCode = agente. El PDF no usa ese
// criterio: rutea por U_CODV de la DIRECCIÓN del documento. Eran dos universos
// distintos, y de ahí venía el reclamo — la pantalla dejaba marcar clientes que
// nunca salían en el reporte — más un faltante que nadie había reportado.
//
// La única forma de que la pantalla y el PDF digan lo mismo es que los dos
// salgan del mismo cálculo, y ese vive en el RPA (agentes.py). Duplicarlo acá
// en TypeScript sería reponer exactamente la duplicación que causó el problema.
//
// SIN FALLBACK al árbol viejo, a propósito: si el VPS no responde, un error
// explícito es mejor que un árbol con el universo equivocado. Un árbol que
// parece correcto y no lo es hace perder una gira entera; un error se ve y se
// reintenta.
export const GET: RequestHandler = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) throw error(401, 'No autorizado');

	const codigo = url.searchParams.get('agente');
	if (!codigo) throw error(400, "Falta el parámetro 'agente'");

	const numero = Number(codigo);
	if (!Number.isFinite(numero)) throw error(400, "El parámetro 'agente' debe ser numérico");

	const VPS_API_URL = env.VPS_API_URL || 'https://statistic-auction-snowstorm.ngrok-free.dev';

	// El VPS mantiene el árbol en caché unos minutos; refrescar=1 lo fuerza.
	const refrescar = url.searchParams.get('refrescar') === '1' ? '&refrescar=1' : '';

	try {
		// El timeout es generoso porque con el caché frío el VPS tiene que barrer
		// los documentos abiertos de toda la empresa, y en horario de oficina cada
		// consulta al Service Layer de SAP cuesta 25-30 segundos.
		const res = await fetch(`${VPS_API_URL}/api/arbol-gira-zona?agente=${numero}${refrescar}`, {
			signal: AbortSignal.timeout(240_000)
		});

		if (!res.ok) throw new Error(`El VPS respondió con estado: ${res.status}`);

		const data = await res.json();

		// El RPA devuelve { error } en vez de tirar la petición cuando SAP no le
		// dio los datos completos. Eso NO se puede pasar como un árbol vacío: en
		// la pantalla se vería como "este agente no tiene clientes con carga", que
		// es justo la conclusión equivocada.
		if (data?.error) throw error(502, data.error);

		return json(data);
	} catch (e) {
		// Un error() ya formado (el 502 de arriba) se re-lanza tal cual.
		if (e && typeof e === 'object' && 'status' in e && 'body' in e) throw e;

		console.error('[quimicas_unidas] error obteniendo árbol de agente desde el VPS:', e);

		if (e instanceof Error && e.name === 'TimeoutError') {
			throw error(
				504,
				'El servidor de automatización tardó demasiado en responder. ' +
					'Suele pasar cuando SAP está lento; volvé a intentar en un momento.'
			);
		}

		throw error(502, 'No se pudo obtener el árbol de zonas desde el servidor de automatización.');
	}
};
