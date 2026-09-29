import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { OrdenGiraZona } from '$lib/quimicas_unidas/types';
import { env } from '$env/dynamic/private';

// POST /quimicas_unidas/api/ejecutar-gira-zona
// Encola en el VPS la gira de una selección puntual de clientes.
export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw error(401, 'No autorizado');

	const body = (await request.json().catch(() => null)) as OrdenGiraZona | null;
	if (!body) throw error(400, 'Body inválido');

	const { metodo } = body;
	if (metodo !== 'agente' && metodo !== 'revision') {
		throw error(400, "metodo inválido: usá 'agente' o 'revision'");
	}
	if (!body.agenteCodigo) throw error(400, 'Falta agenteCodigo');
	if (!body.cardCodes?.length) throw error(400, 'Seleccioná al menos un cliente');
	if (metodo === 'revision' && !body.correoRevision?.trim()) {
		throw error(400, "El método de revisión requiere un 'correoRevision'");
	}

	const VPS_API_URL = env.VPS_API_URL || 'https://statistic-auction-snowstorm.ngrok-free.dev';

	const payloadPython = {
		agente_codigo: String(body.agenteCodigo).trim(),
		card_codes: body.cardCodes,
		solo_prueba: metodo === 'revision',
		correo_destino: metodo === 'revision' ? body.correoRevision!.trim() : null,
		zona_nombre: body.zonaNombre ?? null,
		dry_run: false
	};

	// Sin correo_logs: esa columna no existe en quimicas_unidas_ejecuciones.
	const registroBase = {
		user_id: user.id,
		metodo: metodo === 'revision' ? 'gira_zona_revision' : 'gira_zona',
		alcance: 'zona',
		card_codes: body.cardCodes,
		correo_rev: metodo === 'revision' ? payloadPython.correo_destino : null
	};

	try {
		const res = await fetch(`${VPS_API_URL}/api/ejecutar-gira-zona`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payloadPython)
		});

		if (!res.ok) throw new Error(`El VPS respondió con estado: ${res.status}`);
		const data = await res.json();

		// El RPA valida de nuevo del lado Python y puede rechazar la orden.
		if (data.estado === 'error') {
			await locals.supabase.from('quimicas_unidas_ejecuciones').insert({
				...registroBase,
				resultado: false,
				mensaje: data.mensaje
			});
			throw error(400, data.mensaje);
		}

		await locals.supabase.from('quimicas_unidas_ejecuciones').insert({
			...registroBase,
			resultado: true,
			mensaje: data.mensaje ?? 'Orden enviada'
		});

		return json({ ok: true, mensaje: data.mensaje, job_id: data.job_id });
	} catch (e) {
		// Un error() ya formado (el 400 de arriba) se re-lanza tal cual.
		if (e && typeof e === 'object' && 'status' in e && 'body' in e) throw e;

		console.error('[quimicas_unidas] Error conectando al RPA en el VPS (gira-zona):', e);

		await locals.supabase.from('quimicas_unidas_ejecuciones').insert({
			...registroBase,
			resultado: false,
			mensaje: e instanceof Error ? e.message : 'Error desconocido'
		});

		throw error(502, 'No se pudo comunicar con el servidor de automatización.');
	}
};
