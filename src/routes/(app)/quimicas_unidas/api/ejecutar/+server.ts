import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { OrdenEjecucion } from '$lib/quimicas_unidas/types';

// URL de tu túnel de Cloudflare hacia el VPS
const VPS_API_URL = process.env.VPS_API_URL || 'https://rpa.tu-dominio.com';

export const POST: RequestHandler = async ({ request }) => {
    const body = (await request.json().catch(() => null)) as OrdenEjecucion | null;
    if (!body) throw error(400, 'Body inválido');

    const { metodo, alcance } = body;

    if (metodo !== 'cliente' && metodo !== 'revision') {
        throw error(400, "metodo inválido: usá 'cliente' o 'revision'");
    }
    if (alcance !== 'completo' && alcance !== 'cliente') {
        throw error(400, "alcance inválido: usá 'completo' o 'cliente'");
    }
    if (metodo === 'revision' && alcance === 'completo') {
        throw error(400, 'El método de revisión solo aplica a clientes específicos');
    }

    const codigos = Array.isArray(body.cardCodes)
        ? body.cardCodes.map((c) => c.trim().toUpperCase()).filter(Boolean)
        : [];
        
    if (alcance === 'cliente' && codigos.length === 0) {
        throw error(400, 'Seleccioná al menos un cliente');
    }

    // ── TRADUCCIÓN DEL PAYLOAD PARA LA API EN PYTHON ──
    const payloadPython = {
        clientes: alcance === 'cliente' ? codigos : [],
        solo_prueba: metodo === 'revision',
        ejecutar_todos: alcance === 'completo',
        correo_prueba: metodo === 'revision' ? 'credito@qu.cr' : null
    };

    try {
        const res = await fetch(`${VPS_API_URL}/api/ejecutar-cxc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadPython)
        });

        if (!res.ok) {
            throw new Error(`El VPS respondió con estado: ${res.status}`);
        }

        const data = await res.json();
        
        return json({
            ok: true,
            mensaje: data.mensaje,
            job_id: data.job_id
        });

    } catch (e) {
        console.error('[quimicas_unidas] Error conectando al RPA en el VPS:', e);
        throw error(502, 'No se pudo comunicar con el servidor de automatización.');
    }
};