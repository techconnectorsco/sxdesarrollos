import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { OrdenEjecucionGira } from '$lib/quimicas_unidas/types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw error(401, 'No autorizado');

	const body = (await request.json().catch(() => null)) as OrdenEjecucionGira | null;
	if (!body) throw error(400, 'Body inválido');

	const { metodo } = body;
	if (metodo !== 'agente' && metodo !== 'revision') {
		throw error(400, "metodo inválido: usá 'agente' o 'revision'");
	}

	// null = todos los agentes con correo asignado (opción "Todos los agentes")
	const agenteCodigo = body.agenteCodigo ? body.agenteCodigo.toString().trim() : null;

	if (metodo === 'revision' && !body.correoRevision?.trim()) {
		throw error(400, "El método de revisión requiere un 'correoRevision'");
	}

	const VPS_API_URL = env.VPS_API_URL || 'https://statistic-auction-snowstorm.ngrok-free.dev';

	const payloadPython = {
		agente_codigo: agenteCodigo,
		solo_prueba: metodo === 'revision',
		correo_destino: metodo === 'revision' ? body.correoRevision!.trim() : null
	};

	// Sin correo_logs: esa columna no existe en quimicas_unidas_ejecuciones
	const registroBase = {
		user_id: user.id,
		metodo: metodo === 'revision' ? 'gira_revision' : 'gira',
		alcance: agenteCodigo ? 'agente' : 'completo',
		card_codes: agenteCodigo ? [agenteCodigo] : null,
		correo_rev: metodo === 'revision' ? payloadPython.correo_destino : null
	};

	try {
		const res = await fetch(`${VPS_API_URL}/api/ejecutar-gira`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payloadPython)
		});

		if (!res.ok) throw new Error(`El VPS respondió con estado: ${res.status}`);
		const data = await res.json();

		await locals.supabase.from('quimicas_unidas_ejecuciones').insert({
			...registroBase,
			resultado: true,
			mensaje: data.mensaje ?? 'Orden enviada'
		});

		return json({ ok: true, mensaje: data.mensaje, job_id: data.job_id });
	} catch (e) {
		console.error('[quimicas_unidas] Error conectando al RPA en el VPS (gira):', e);

		await locals.supabase.from('quimicas_unidas_ejecuciones').insert({
			...registroBase,
			resultado: false,
			mensaje: e instanceof Error ? e.message : 'Error desconocido'
		});

		throw error(502, 'No se pudo comunicar con el servidor de automatización.');
	}
};