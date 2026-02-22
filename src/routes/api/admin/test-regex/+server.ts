import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractRematesPropiedades } from '$lib/utils/rematesParser';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ message: 'No se proporcionó archivo' }, { status: 400 });
		}

		const fileContent = await file.text();
		const rematesPropiedades = extractRematesPropiedades(fileContent);

		// Extraer solo preview de cada remate
		const previews = rematesPropiedades.map((r, i) => ({
			index: i + 1,
			referencia: r.referencia,
			preview: r.rawText.substring(0, 300) + '...',
			chars: r.rawText.length
		}));

		return json({
			success: true,
			total: rematesPropiedades.length,
			previews,
			fileSize: fileContent.length,
			fileName: file.name
		});

	} catch (error: any) {
		return json({ message: error.message }, { status: 500 });
	}
};