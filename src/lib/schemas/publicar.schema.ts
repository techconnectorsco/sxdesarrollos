import { z } from 'zod';

// ==========================================
// PASO 1: Información Básica + Legal (40%)
// ==========================================

// Base object sin superRefine (para poder hacer merge)
const paso1BaseSchema = z.object({
	// Tipo de operación y propiedad
	tipo_transaccion: z.enum(['venta', 'alquiler', 'proyecto'], {
		required_error: 'Seleccione el tipo de operación'
	}), // ✅ CORREGIDO: tipo_transaccion (antes era tipo_operacion)
	tipo_propiedad: z.enum([
		'casa',
		'apartamento',
		'condominio',
		'lote',
		'comercial',
		'finca',
		'bodega',
		'oficina'
	], {
		required_error: 'Seleccione el tipo de propiedad'
	}),
	uso: z.enum(['residencial', 'comercial', 'industrial', 'mixto']).optional(),
	
	// Precio
	precio: z.number().positive('El precio debe ser positivo').min(1),
	moneda: z.enum(['USD', 'CRC'], { required_error: 'Seleccione la moneda' }),
	
	// Descripción
	titulo: z.string().min(10, 'El título debe tener al menos 10 caracteres').max(100),
	descripcion: z.string().min(50, 'La descripción debe tener al menos 50 caracteres').max(2000),
	
	// Multimedia (antes "fotos", ahora incluye videos)
	// ✅ CORREGIDO: Opcional por defecto, el componente maneja la validación visual
	multimedia: z.array(z.object({
		url: z.string().url(),
		tipo: z.enum(['imagen', 'video']),
		orden: z.number()
	})).max(30, 'Máximo 30 archivos').default([]),
	multimedia_principal_index: z.number().int().min(0).default(0),
	
	// Documentos legales (opcional)
	documentos: z.array(z.object({
		url: z.string().url(),
		nombre: z.string(),
		tipo: z.string(),
		tamano: z.number()
	})).max(10, 'Máximo 10 documentos').default([]),
	
	// DATOS LEGALES
	finca_id: z.string().min(1).max(50).optional(),
	notas_adicionales: z.string().max(1000).optional(),
	contacto_nombre: z.string().max(200).optional(),
	contacto_telefono: z.string().max(50).optional(),
	contacto_email: z.string().email().optional(),
	
	// ==========================================
	// CAMPOS DE PROYECTO (opcionales inicialmente)
	// ==========================================
	proyecto_nombre: z.string().max(100).optional(),
	proyecto_constructora: z.string().max(100).optional(),
	proyecto_estado: z.enum(['en_planos', 'en_construccion', 'entrega_inmediata', '']).optional(),
	proyecto_fecha_entrega: z.string().optional(),
	proyecto_unidades_totales: z.number().int().optional(),
	proyecto_unidades_disponibles: z.number().int().optional(),
	proyecto_tipos_unidades: z.string().max(200).optional(),
	proyecto_rango_precios: z.string().max(100).optional(),
	proyecto_financiamiento: z.boolean().optional(),
	proyecto_avance_porcentaje: z.number().int().min(0).max(100).optional(),
});

// Schema con validación condicional
export const paso1Schema = paso1BaseSchema.superRefine((data, ctx) => {
	// ==========================================
	// VALIDACIÓN CONDICIONAL PARA PROYECTOS
	// ==========================================
	if (data.tipo_transaccion === 'proyecto') {
		// Nombre del proyecto (requerido)
		if (!data.proyecto_nombre || data.proyecto_nombre.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El nombre del proyecto es requerido',
				path: ['proyecto_nombre']
			});
		}
		
		// Constructora (requerido)
		if (!data.proyecto_constructora || data.proyecto_constructora.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'La constructora/desarrollador es requerido',
				path: ['proyecto_constructora']
			});
		}
		
		// Estado (requerido)
		if (!data.proyecto_estado || data.proyecto_estado === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El estado del proyecto es requerido',
				path: ['proyecto_estado']
			});
		}
		
		// Unidades totales (requerido y > 0)
		if (!data.proyecto_unidades_totales || data.proyecto_unidades_totales <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Las unidades totales son requeridas y deben ser mayor a 0',
				path: ['proyecto_unidades_totales']
			});
		}
		
		// Unidades disponibles (requerido y >= 0)
		if (data.proyecto_unidades_disponibles === undefined || data.proyecto_unidades_disponibles < 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Las unidades disponibles son requeridas',
				path: ['proyecto_unidades_disponibles']
			});
		}
		
		// Validar que disponibles <= totales
		if (data.proyecto_unidades_totales && data.proyecto_unidades_disponibles !== undefined) {
			if (data.proyecto_unidades_disponibles > data.proyecto_unidades_totales) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Las unidades disponibles no pueden ser mayores a las totales',
					path: ['proyecto_unidades_disponibles']
				});
			}
		}
		
		// Tipos de unidades (requerido)
		if (!data.proyecto_tipos_unidades || data.proyecto_tipos_unidades.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Los tipos de unidades son requeridos',
				path: ['proyecto_tipos_unidades']
			});
		}
		
		// Rango de precios (requerido)
		if (!data.proyecto_rango_precios || data.proyecto_rango_precios.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El rango de precios es requerido',
				path: ['proyecto_rango_precios']
			});
		}
	}
	
	// ==========================================
	// VALIDACIÓN CONDICIONAL PARA VENTA/ALQUILER
	// ==========================================
	if (data.tipo_transaccion !== 'proyecto') {
		// Finca obligatoria para venta/alquiler (opcional para proyectos)
		if (!data.finca_id || data.finca_id.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El número de finca es requerido',
				path: ['finca_id']
			});
		}
	}
});

// ==========================================
// PASO 2: Ubicación (30%)
// ==========================================
export const paso2Schema = z.object({
	provincia: z.string().min(1, 'Seleccione la provincia'),
	canton: z.string().min(1, 'Seleccione el cantón'),
	distrito: z.string().min(1, 'Seleccione el distrito'),
	direccion_exacta: z.string().min(10, 'Ingrese la dirección completa').max(500),
	latitud: z.number().min(-90).max(90),
	longitud: z.number().min(-180).max(180)
});

// ==========================================
// PASO 3: Detalles de la Propiedad (20%)
// ==========================================
export const paso3Schema = z.object({
	// Áreas
	area_total_terreno_m2: z.number().positive('El área debe ser mayor a 0').min(1),
	area_construccion_m2: z.number().positive().optional(),
	area_util_m2: z.number().positive().optional(),
	
	// Espacios
	dormitorios: z.number().int().min(0).max(50),
	banos: z.number().int().min(0).max(50),
	medios_banos: z.number().int().min(0).max(20).optional(),
	salas: z.number().int().min(0).max(10).optional(),
	comedores: z.number().int().min(0).max(10).optional(),
	cocinas: z.number().int().min(0).max(10).optional(),
	garajes: z.number().int().min(0).max(20).optional(),
	bodegas: z.number().int().min(0).max(10).optional(),
	
	// Pisos
	pisos_total: z.number().int().min(1).max(100).optional(),
	piso_ubicacion: z.number().int().min(0).max(100).optional(),
	
	// Años
	ano_construccion: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
	ano_remodelacion: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
	
	// Estado
	estado_construccion: z.enum([
		'obra_gris',
		'obra_negra',
		'terminado',
		'excelente',
		'bueno',
		'regular',
		'para_remodelar'
	]).optional()
});

// ==========================================
// PASO 4: Servicios y Amenidades (10%)
// ==========================================
export const paso4Schema = z.object({
	// Servicios básicos
	agua: z.boolean().default(false),
	electricidad: z.boolean().default(false),
	internet: z.boolean().default(false),
	gas: z.boolean().default(false),
	alcantarillado: z.boolean().default(false),
	telefono: z.boolean().default(false),
	cable: z.boolean().default(false),
	
	// Seguridad
	seguridad_privada: z.boolean().default(false),
	portero_electronico: z.boolean().default(false),
	camaras_seguridad: z.boolean().default(false),
	alarma: z.boolean().default(false),
	
	// Comodidades
	piscina: z.boolean().default(false),
	jardin: z.boolean().default(false),
	terraza: z.boolean().default(false),
	balcon: z.boolean().default(false),
	sala_estar: z.boolean().default(false),
	cuarto_servicio: z.boolean().default(false),
	walk_in_closet: z.boolean().default(false),
	
	// Espacios adicionales
	estudio: z.boolean().default(false),
	oficina: z.boolean().default(false),
	gimnasio: z.boolean().default(false),
	area_lavanderia: z.boolean().default(false),
	barbacoa: z.boolean().default(false),
	
	// Características
	aire_acondicionado: z.boolean().default(false),
	calefaccion: z.boolean().default(false),
	agua_caliente: z.boolean().default(false),
	
	// Inclusiones
	electrodomesticos_incluidos: z.boolean().default(false),
	muebles_incluidos: z.boolean().default(false),
	amueblado: z.boolean().default(false),
	
	// Accesibilidad
	pet_friendly: z.boolean().default(false),
	discapacitados: z.boolean().default(false),
	
	// Vistas/Ubicación
	vista_panoramica: z.boolean().default(false),
	esquinera: z.boolean().default(false),
	cerca_transporte_publico: z.boolean().default(false),
	cerca_centros_comerciales: z.boolean().default(false),
	cerca_escuelas: z.boolean().default(false),
	cerca_hospitales: z.boolean().default(false),
	cerca_parques: z.boolean().default(false)
});

// ==========================================
// Schema completo (todos los pasos combinados)
// ==========================================

// Primero merge todos los schemas base
const publicarPropiedadBaseSchema = paso1BaseSchema
	.merge(paso2Schema)
	.merge(paso3Schema)
	.merge(paso4Schema);

// Luego aplicar las validaciones condicionales
export const publicarPropiedadSchema = publicarPropiedadBaseSchema.superRefine((data, ctx) => {
	// ==========================================
	// VALIDACIÓN CONDICIONAL PARA PROYECTOS
	// ==========================================
	if (data.tipo_transaccion === 'proyecto') {
		// Nombre del proyecto (requerido)
		if (!data.proyecto_nombre || data.proyecto_nombre.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El nombre del proyecto es requerido',
				path: ['proyecto_nombre']
			});
		}
		
		// Constructora (requerido)
		if (!data.proyecto_constructora || data.proyecto_constructora.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'La constructora/desarrollador es requerido',
				path: ['proyecto_constructora']
			});
		}
		
		// Estado (requerido)
		if (!data.proyecto_estado || data.proyecto_estado === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El estado del proyecto es requerido',
				path: ['proyecto_estado']
			});
		}
		
		// Unidades totales (requerido y > 0)
		if (!data.proyecto_unidades_totales || data.proyecto_unidades_totales <= 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Las unidades totales son requeridas y deben ser mayor a 0',
				path: ['proyecto_unidades_totales']
			});
		}
		
		// Unidades disponibles (requerido y >= 0)
		if (data.proyecto_unidades_disponibles === undefined || data.proyecto_unidades_disponibles < 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Las unidades disponibles son requeridas',
				path: ['proyecto_unidades_disponibles']
			});
		}
		
		// Validar que disponibles <= totales
		if (data.proyecto_unidades_totales && data.proyecto_unidades_disponibles !== undefined) {
			if (data.proyecto_unidades_disponibles > data.proyecto_unidades_totales) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Las unidades disponibles no pueden ser mayores a las totales',
					path: ['proyecto_unidades_disponibles']
				});
			}
		}
		
		// Tipos de unidades (requerido)
		if (!data.proyecto_tipos_unidades || data.proyecto_tipos_unidades.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Los tipos de unidades son requeridos',
				path: ['proyecto_tipos_unidades']
			});
		}
		
		// Rango de precios (requerido)
		if (!data.proyecto_rango_precios || data.proyecto_rango_precios.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El rango de precios es requerido',
				path: ['proyecto_rango_precios']
			});
		}
	}
	
	// ==========================================
	// VALIDACIÓN CONDICIONAL PARA VENTA/ALQUILER
	// ==========================================
	if (data.tipo_transaccion !== 'proyecto') {
		// Finca obligatoria para venta/alquiler (opcional para proyectos)
		if (!data.finca_id || data.finca_id.trim() === '') {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'El número de finca es requerido',
				path: ['finca_id']
			});
		}
	}
});

// ==========================================
// Tipos TypeScript
// ==========================================
export type Paso1Data = z.infer<typeof paso1BaseSchema>;
export type Paso2Data = z.infer<typeof paso2Schema>;
export type Paso3Data = z.infer<typeof paso3Schema>;
export type Paso4Data = z.infer<typeof paso4Schema>;
export type PublicarPropiedadData = z.infer<typeof publicarPropiedadBaseSchema>;