import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractRematesPropiedades, extractMatriculaConRegex, type RematePropiedad } from '$lib/utils/rematesParser';
import { processWithOpenAI } from '$lib/server/openai';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Configuración específica para esta ruta: maxDuration extendido para procesamiento de remates
export const config = {
	maxDuration: 800 
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CONFIGURACIÓN DE BATCHES
const BATCH_SIZE = 2; 

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const bulletinNumber = formData.get('bulletin_number') as string;
		const previewOnly = formData.get('preview_only') === 'true';
		const streamProgress = formData.get('stream_progress') === 'true';

		if (!file) {
			return json({ message: 'No se proporcionó archivo' }, { status: 400 });
		}

		// console.log('📄 Procesando:', file.name);
		
		const fileContent = await file.text();
		const rematesPropiedades = extractRematesPropiedades(fileContent);
		
		// console.log('🔍 Remates encontrados:', rematesPropiedades.length);

		if (streamProgress) {
			const stream = new ReadableStream({
				async start(controller) {
					const encoder = new TextEncoder();
					const sendEvent = (data: any) => {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
					};

					const totalRemates = rematesPropiedades.length;
					
					// PASO 1: Separar por si tiene matrícula extraída con regex
					const conMatricula: any[] = [];
					const sinMatricula: any[] = [];

					// console.log(`🚀 Iniciando análisis de ${totalRemates} remates encontrados.`);

					for (const remate of rematesPropiedades) {
						const matricula = extractMatriculaConRegex(remate.rawText);
						if (matricula) {
							// console.log(`📍 Regex capturó: ${matricula}`);
							conMatricula.push({ ...remate, matricula });
						} else {
							// console.log(`❓ Regex falló - Destino: OpenAI Directo`);
							sinMatricula.push(remate);
						}
					}

					// console.log(`✅ Con matrícula (regex): ${conMatricula.length}`);
					// console.log(`⏳ Sin matrícula (irán a OpenAI): ${sinMatricula.length}`);

					// ✅ PASO 2: Verificar en BD los que tienen matrícula
					const { nuevos, existentes } = await verificarMatriculasEnBD(conMatricula);

					// console.log(`✅ Nuevos: ${nuevos.length}`);
					// console.log(`⏭️  Ya existentes: ${existentes.length}`);

					// console.log('--- RESUMEN DE FILTRADO ---');
					// console.log(`✅ OMITIDOS (Ya están en BD): ${existentes.length}`);
					// console.log(`🤖 AL MODELO 4o (Nuevos con matrícula): ${nuevos.length}`);
					// console.log(`🤖 AL MODELO 4o (Regex no los entendió): ${sinMatricula.length}`);
					// console.log(`📊 TOTAL LLAMADAS OPENAI: ${nuevos.length + sinMatricula.length}`);
					// console.log('---------------------------');

					// ✅ PASO 3: Calcular remates a procesar con OpenAI
					const paraOpenAI = [...nuevos, ...sinMatricula];
					const batches = [];
					for (let i = 0; i < paraOpenAI.length; i += BATCH_SIZE) {
						batches.push(paraOpenAI.slice(i, i + BATCH_SIZE));
					}

					sendEvent({ 
						type: 'total', 
						total: totalRemates,
						con_matricula_regex: conMatricula.length,
						sin_matricula_regex: sinMatricula.length,
						existentes: existentes.length,
						nuevos_para_openai: nuevos.length,
						sin_matricula_para_openai: sinMatricula.length,
						total_openai: paraOpenAI.length,
						batches: batches.length
					});

					if (totalRemates === 0) {
						sendEvent({ type: 'error', message: 'No hay remates' });
						controller.close();
						return;
					}

					const stats = {
						totalEntradas: totalRemates,
						rematesPropiedades: totalRemates,
						extraidos_regex: conMatricula.length,
						existentes: existentes.length,
						nuevos_encontrados_bd: nuevos.length,
						sin_matricula_openai: sinMatricula.length,
						insertados: 0,
						actualizados: 0,
						procesados_openai: 0,
						errores: 0
					};

					const procesados: any[] = [];
					let currentCount = 0;

					// ✅ PASO 4: Procesar con OpenAI SOLO los necesarios
					for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
						const batch = batches[batchIndex];
						const batchNumber = batchIndex + 1;

						// console.log(`🤖 Lote OpenAI ${batchNumber}/${batches.length}`);

						sendEvent({
							type: 'batch_start',
							batch: batchNumber,
							total_batches: batches.length,
							batch_size: batch.length,
							info: `Procesando ${batch.length} remates con OpenAI`
						});

						// Procesar cada remate del batch
						for (let i = 0; i < batch.length; i++) {
							const remate = batch[i];
							currentCount++;
							
							sendEvent({ 
								type: 'progress', 
								current: currentCount, 
								total: paraOpenAI.length,
								info: `OpenAI: ${currentCount}/${paraOpenAI.length}`
							});

							try {
								const estructurado = await processWithOpenAI(remate.rawText, bulletinNumber);
								
								if (estructurado && estructurado.matricula) {
									procesados.push(estructurado);
									stats.procesados_openai++;
								} else {
									stats.errores++;
									sendEvent({
										type: 'error_remate',
										remate_numero: currentCount,
										error: 'No se extrajo matrícula'
									});
								}
							} catch (error: any) {
								stats.errores++;
								sendEvent({
									type: 'error_critico',
									remate_numero: currentCount,
									error: error.message,
									detalles: {
										posible_causa: identificarCausa(error.message)
									}
								});
							}
						}
					}

					// ✅ Combinar todos los resultados
					/* const todosProcesados = [
						...existentes.map(e => ({ ...e, _source: 'bd_existente', _tipo: 'existente' })),
						...procesados.map(p => ({ ...p, _source: 'openai', _tipo: 'nuevo' }))
					];
 */
// Solo enviamos a la vista previa lo que OpenAI procesó (los nuevos)
const todosProcesados = procesados.map(p => ({ 
    ...p, 
    _source: 'openai', 
    _tipo: 'nuevo' 
}));
					const csvData = generateCSV(todosProcesados);
					
					sendEvent({
						type: 'complete',
						success: true,
						stats,
						data: todosProcesados,
						csv_data: csvData,
						total_nuevos: procesados.length,
						total_existentes: existentes.length,
						resumen: {
							total: totalRemates,
							extraidos_con_regex: conMatricula.length,
							existentes_no_procesados: existentes.length,
							enviados_openai: paraOpenAI.length,
							procesados_openai: procesados.length,
							errores: stats.errores,
							ahorro_openai: existentes.length
						}
					});

					controller.close();
				}
			});

			return new Response(stream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				}
			});
		}

		return json({ success: false, message: 'Modo no streaming' });

	} catch (error: any) {
		console.error('💥 Error:', error);
		return json({ message: 'Error: ' + error.message }, { status: 500 });
	}
};

async function verificarMatriculasEnBD(remates: any[]): Promise<{ nuevos: any[], existentes: any[] }> {
	try {
		const matriculas = remates.map(r => r.matricula).filter(Boolean);
		
		if (matriculas.length === 0) {
			return { nuevos: remates, existentes: [] };
		}

		const { data: existentesEnBD, error } = await supabase
			.from('propiedades_remates')
			.select('*')
			.in('matricula', matriculas);

		if (error) {
			console.error('⚠️ Error BD:', error);
			return { nuevos: remates, existentes: [] };
		}

		const matriculasEnBD = new Set(existentesEnBD.map(e => e.matricula));
		const nuevos = remates.filter(r => !matriculasEnBD.has(r.matricula));
		
		const existentes = remates
			.filter(r => matriculasEnBD.has(r.matricula))
			.map(r => existentesEnBD.find(e => e.matricula === r.matricula))
			.filter(e => e !== undefined);

		return { nuevos, existentes };
	} catch (err) {
		console.error('⚠️ Error verificación:', err);
		return { nuevos: remates, existentes: [] };
	}
}

function prepareUpdateData(nuevo: any, existente: any) {
	const update: any = {
		raw_text: nuevo.raw_text,
		updated_at: new Date().toISOString()
	};

	if (!existente.second_auction_date && nuevo.second_auction_date) {
		update.second_auction_date = nuevo.second_auction_date;
		update.second_auction_time = nuevo.second_auction_time;
		update.second_auction_base_text = nuevo.second_auction_base_text;
		update.second_auction_base = nuevo.second_auction_base;
	}

	if (!existente.third_auction_date && nuevo.third_auction_date) {
		update.third_auction_date = nuevo.third_auction_date;
		update.third_auction_time = nuevo.third_auction_time;
		update.third_auction_base_text = nuevo.third_auction_base_text;
		update.third_auction_base = nuevo.third_auction_base;
	}

	return update;
}

function generateCSV(data: any[]): string {
	if (data.length === 0) return '';

	const headers = [
		'matricula',
		'finca_id',
		'provincia',
		'canton',
		'distrito',
		'naturaleza',
		'area_text',
		'area_numeric',
		'base_price_text',
		'base_price_numeric',
		'currency',
		'first_auction_date',
		'first_auction_time',
		'second_auction_date',
		'second_auction_base',
		'third_auction_date',
		'third_auction_base',
		'case_type',
		'case_number',
		'plaintiff',
		'defendant',
		'court',
		'judge',
		'raw_text'
	];

	const rows = data.map(item => 
		headers.map(header => {
			const value = item[header] || '';
			return typeof value === 'string' && value.includes(',')
				? `"${value.replace(/"/g, '""')}"`
				: value;
		}).join(',')
	);

	return [headers.join(','), ...rows].join('\n');
}

function identificarCausa(errorMsg: string): string {
	if (errorMsg.includes('429')) {
		return 'OpenAI rate limit excedido - demasiadas solicitudes';
	}
	if (errorMsg.includes('401') || errorMsg.includes('403')) {
		return 'Error de API Key - verifica que la key sea válida';
	}
	if (errorMsg.includes('insufficient_quota')) {
		return '❌ CUOTA DE OPENAI AGOTADA - Revisa tu plan de pago';
	}
	if (errorMsg.includes('timeout')) {
		return 'Timeout de OpenAI - reintentando...';
	}
	if (errorMsg.includes('JSON')) {
		return 'OpenAI devolvió JSON inválido';
	}
	return 'Error desconocido de OpenAI';
}