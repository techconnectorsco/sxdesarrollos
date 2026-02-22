import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const POST: RequestHandler = async ({ request }) => {
	try {
				
		const body = await request.json();
		
		// console.log('🔍 DEBUG API - Paso 2: Body parseado');
		// console.log('   Body completo:', JSON.stringify(body, null, 2));
		// console.log('   Keys del body:', Object.keys(body));
		
		const { remates, bulletin_number, user_id } = body;
	

		if (!remates || remates.length === 0) {
			return json({ 
				success: false,
				message: 'No se proporcionaron remates para guardar' 
			}, { status: 400 });
		}

		// console.log(`💾 Guardando ${remates.length} remates en base de datos...`);
		// console.log(`👤 Procesado por usuario: ${user_id || 'desconocido'}`);

		const stats = {
			totalEntradas: remates.length,
			rematesPropiedades: remates.length,
			insertados: 0,
			actualizados: 0,
			errores: 0
		};

		const log: string[] = [];

		// Guardar cada remate
		for (const estructurado of remates) {
    try {
        // Extraemos los campos técnicos y el resto lo guardamos en 'datosAGuardar'
        const { _source, _tipo, ...datosAGuardar } = estructurado;

        const { data: existente } = await supabase
            .from('propiedades_remates')
            .select('id')
            .eq('matricula', datosAGuardar.matricula)
            .single();

				if (existente) {
            // Para el update también usamos los datos limpios
            const updateData = prepareUpdateData(datosAGuardar, existente);
            const { error: updateError } = await supabase
                .from('propiedades_remates')
                .update(updateData)
                .eq('id', existente.id);

					if (updateError) {
						console.error(`❌ Error actualizando ${estructurado.matricula}:`, updateError.message);
						log.push(`❌ Error actualizando matrícula ${estructurado.matricula}: ${updateError.message}`);
						stats.errores++;
					} else {
						// console.log(`✅ Actualizado: ${estructurado.matricula}`);
						log.push(`✅ Actualizado: Matrícula ${estructurado.matricula}`);
						stats.actualizados++;
					}
				} else {
            const { error: insertError } = await supabase
                .from('propiedades_remates')
                .insert({
                    ...datosAGuardar, // <--- Insertamos solo las columnas reales de la BD
                    bulletin_number: bulletin_number,
                    extraction_date: new Date().toISOString(),
                    status: 'active',
                    is_active: true
                });

					if (insertError) {
						console.error(`❌ Error insertando ${estructurado.matricula}:`, insertError.message);
						log.push(`❌ Error insertando matrícula ${estructurado.matricula}: ${insertError.message}`);
						stats.errores++;
					} else {
						// console.log(`✅ Insertado: ${estructurado.matricula}`);
						log.push(`✅ Insertado: Matrícula ${estructurado.matricula}`);
						stats.insertados++;
					}
				}
			} catch (error: any) {
				console.error(`❌ Error guardando ${estructurado.matricula}:`, error.message);
				log.push(`❌ Error guardando: ${error.message}`);
				stats.errores++;
			}
		}

		// console.log('✅ Guardado completado');
		// console.log(`📊 Insertados: ${stats.insertados}, Actualizados: ${stats.actualizados}, Errores: ${stats.errores}`);

		// ========================================
		// GUARDAR EN HISTORIAL DE PROCESAMIENTO
		// ========================================
		try {
			// console.log('🔍 DEBUG API - Paso 4: Guardando historial');
			// console.log('   user_id para historial:', user_id);
			
			let estado = 'exitoso';
			if (stats.errores > 0 && stats.insertados === 0 && stats.actualizados === 0) {
				estado = 'fallido';
			} else if (stats.errores > 0) {
				estado = 'parcial';
			}

			const historialData = {
				numero_boletin: bulletin_number || 'desconocido',
				nombre_archivo: `Boletín_${bulletin_number || 'sin_numero'}.txt`,
				total_entradas: stats.totalEntradas,
				total_propiedades: stats.rematesPropiedades,
				cantidad_insertados: stats.insertados,
				cantidad_actualizados: stats.actualizados,
				cantidad_errores: stats.errores,
				estado: estado,
				procesado_por: user_id,
				notas: stats.errores > 0 
					? `Procesado con ${stats.errores} errores` 
					: 'Procesado exitosamente'
			};

			// console.log('🔍 DEBUG API - Paso 5: Datos a insertar en historial');
			// console.log(JSON.stringify(historialData, null, 2));

			const { data: historialInserted, error: historyError } = await supabase
				.from('historial_procesamiento_boletines')
				.insert(historialData)
				.select();

			// console.log('🔍 DEBUG API - Paso 6: Resultado inserción historial');
			// console.log('   Error:', historyError);
			// console.log('   Data insertada:', historialInserted);

			if (historyError) {
				console.error('⚠️ Error guardando historial:', historyError);
				console.error('⚠️ Detalles completos:', JSON.stringify(historyError, null, 2));
				log.push(`⚠️ Error guardando historial: ${historyError.message}`);
			} else {
				// console.log('✅ Historial guardado exitosamente');
				// console.log('✅ Usuario registrado:', user_id || 'null');
				log.push('✅ Historial guardado exitosamente');
			}
		} catch (historyErr: any) {
			console.error('⚠️ Error en guardado de historial:', historyErr);
			console.error('⚠️ Stack:', historyErr.stack);
			log.push(`⚠️ Error en historial: ${historyErr.message}`);
		}

		return json({
			success: true,
			stats,
			log,
			message: `Guardado: ${stats.insertados} insertados, ${stats.actualizados} actualizados`
		});

	} catch (error: any) {
		console.error('💥 Error fatal guardando:', error);
		console.error('💥 Stack:', error.stack);
		return json(
			{ 
				success: false,
				message: 'Error guardando en base de datos: ' + error.message 
			},
			{ status: 500 }
		);
	}
};

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