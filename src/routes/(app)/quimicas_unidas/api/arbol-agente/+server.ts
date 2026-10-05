import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { obtenerArbolAgente } from '$lib/quimicas_unidas/sap';

export const GET: RequestHandler = async ({ url, locals }) => {
    const { session } = await locals.safeGetSession();
    if (!session) throw error(401, 'No autorizado');

    const codigo = url.searchParams.get('agente');
    if (!codigo) throw error(400, "Falta el parámetro 'agente'");

    try {
        const data = await obtenerArbolAgente(Number(codigo));
        return json(data);
    } catch (e) {
        console.error('[quimicas_unidas] error obteniendo árbol de agente:', e);
        throw error(502, 'No se pudo obtener el árbol de zonas desde el Service Layer');
    }
};