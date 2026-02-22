import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'ID requerido' }, { status: 400 });
		}

		// console.log('🔍 Cargando anuncio admin:', id);

		// 1. Obtener anuncio (SIN join, lo haremos después)
		const { data: anuncio, error } = await supabase
			.from('anuncios')
			.select('*')
			.eq('id', id)
			.single();

		if (error || !anuncio) {
			console.error('❌ Anuncio no encontrado:', error);
			return json({ error: 'Anuncio no encontrado' }, { status: 404 });
		}

		// console.log('✅ Anuncio encontrado:', anuncio.id);
		// console.log('📍 Finca ID:', anuncio.finca_id);

		// 2. ✅ Obtener datos de propiedades_datos por finca_id (IGUAL que en propiedades públicas)
		const { data: propiedadData, error: errorProp } = await supabase
			.from('propiedades_datos')
			.select('*')
			.eq('finca_id', anuncio.finca_id)
			.single();

		if (errorProp) {
			console.warn('⚠️ No se encontró propiedades_datos:', errorProp);
		}

		// console.log('✅ Propiedad data:', propiedadData ? 'Encontrada' : 'No encontrada');

		// 3. Obtener multimedia por finca_id
		const { data: multimedia, error: errorMedia } = await supabase
			.from('propiedades_multimedia')
			.select('*')
			.eq('finca_id', anuncio.finca_id)
			.order('orden', { ascending: true });

		if (errorMedia) {
			console.warn('⚠️ Error cargando multimedia:', errorMedia);
		}

		// console.log('📸 Multimedia encontrada:', multimedia?.length || 0, 'imágenes');

		// 4. Procesar imágenes
		const imagenesLimpias: string[] = [];
		
		if (multimedia && multimedia.length > 0) {
			// console.log('🔄 Procesando URLs de imágenes...');
			
			for (const m of multimedia) {
				try {
					const urlOriginal = m.url;
					// console.log(`  📁 URL original:`, urlOriginal);
					
					// Detectar si es URL completa o ruta relativa
					let rutaFinal = urlOriginal;
					let bucketName = 'propiedades';
					
					if (urlOriginal.includes('supabase.co/storage')) {
						// Es URL completa, extraer bucket y ruta
						const urlObj = new URL(urlOriginal);
						const pathParts = urlObj.pathname.split('/');
						
						// Formato: /storage/v1/object/public/BUCKET/PATH
						const bucketIndex = pathParts.indexOf('public') + 1;
						if (bucketIndex > 0 && bucketIndex < pathParts.length) {
							bucketName = pathParts[bucketIndex];
							rutaFinal = pathParts.slice(bucketIndex + 1).join('/');
						}
						
						// console.log(`  🪣 Bucket: ${bucketName}, Ruta: ${rutaFinal}`);
					}
					
					// Si la URL es pública, usarla directamente
					if (urlOriginal.includes('/public/')) {
						// console.log(`  ✅ URL pública válida`);
						imagenesLimpias.push(urlOriginal);
						continue;
					}
					
					// Si no es pública, intentar crear signed URL
					const { data: signed, error: signedError } = await supabase.storage
						.from(bucketName)
						.createSignedUrl(rutaFinal, 60 * 60);

					if (signedError) {
						console.error(`  ❌ Error signed URL:`, signedError.message);
						imagenesLimpias.push(urlOriginal); // Fallback
						continue;
					}

					if (signed?.signedUrl) {
						imagenesLimpias.push(signed.signedUrl);
						// console.log(`  ✅ Signed URL creada`);
					} else {
						imagenesLimpias.push(urlOriginal); // Fallback
					}
				} catch (err) {
					console.error(`  💥 Error procesando imagen:`, err);
					imagenesLimpias.push(m.url); // Fallback
				}
			}
		}

		// console.log('✅ URLs procesadas:', imagenesLimpias.length);

		// 5. Obtener usuario
		const { data: userData } = await supabase
			.from('users_view')
			.select('email, nombre_completo')
			.eq('id', anuncio.user_id)
			.single();

		// 6. ✅ Normalizar datos (IGUAL que en propiedades públicas)
		const anuncioNormalizado = {
			// Del anuncio
			id: anuncio.id,
			titulo: anuncio.titulo,
			descripcion: anuncio.descripcion,
			precio: parseFloat(anuncio.precio),
			moneda: anuncio.moneda,
			tipo_transaccion: anuncio.tipo_transaccion,
			
			// ✅ Ubicación de propiedades_datos (NO de anuncios)
			provincia: propiedadData?.provincia || '',
			canton: propiedadData?.canton || '',
			distrito: propiedadData?.distrito || '',
			
			// Características de propiedades_datos
			habitaciones: propiedadData?.dormitorios || 0,
			banos: propiedadData?.banos || 0,
			area: propiedadData?.area_construccion_m2 || propiedadData?.area_total_terreno_m2 || 0,
			area_construccion_m2: propiedadData?.area_construccion_m2 || 0,
			area_total_terreno_m2: propiedadData?.area_total_terreno_m2 || 0,
			
			// Imágenes procesadas
			imagenes: imagenesLimpias,
			imagen: imagenesLimpias[0] || null,
			
			// Características adicionales
			caracteristicas: [
				...(propiedadData?.jardin ? ['Jardín'] : []),
				...(propiedadData?.piscina ? ['Piscina'] : []),
				...(propiedadData?.garajes ? [`${propiedadData.garajes} garajes`] : []),
				...(propiedadData?.seguridad_privada ? ['Seguridad 24/7'] : []),
				...(propiedadData?.agua ? ['Agua'] : []),
				...(propiedadData?.electricidad ? ['Electricidad'] : []),
				...(propiedadData?.internet ? ['Internet'] : [])
			],
			
			// Contacto
			contacto_nombre: anuncio.contacto_nombre,
			contacto_telefono: anuncio.contacto_telefono,
			contacto_email: anuncio.contacto_email,
			
			// Datos registro
			finca_id: anuncio.finca_id,
			
			// Estados (para el admin)
			estado: anuncio.estado,
			publico: anuncio.publico,
			fecha_publicacion: anuncio.fecha_publicacion,
			created_at: anuncio.created_at,
			
			// Datos de revisión
			razon_rechazo: anuncio.razon_rechazo,
			notas_admin: anuncio.notas_admin,
			fecha_revision: anuncio.fecha_revision,
			
			// Usuario
			usuario_email: userData?.email || anuncio.contacto_email,
			usuario_nombre: userData?.nombre_completo || anuncio.contacto_nombre
		};

		// console.log('✅ Anuncio normalizado completo');
		// console.log('📸 Total imágenes:', anuncioNormalizado.imagenes.length);
		// console.log('📍 Ubicación:', anuncioNormalizado.provincia, anuncioNormalizado.canton, anuncioNormalizado.distrito);

		return json({
			success: true,
			anuncio: anuncioNormalizado
		});

	} catch (error: any) {
		console.error('💥 Error en GET anuncio por ID:', error);
		return json({ error: error.message }, { status: 500 });
	}
};