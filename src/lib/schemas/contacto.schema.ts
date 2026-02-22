import { z } from 'zod';

// Schema para formulario de contacto
export const contactoSchema = z.object({
	nombre: z
		.string({ required_error: 'El nombre es requerido' })
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(100, 'El nombre no puede exceder 100 caracteres')
		.trim(),
	
	email: z
		.string({ required_error: 'El email es requerido' })
		.email('Ingrese un email válido')
		.max(255, 'El email es demasiado largo')
		.toLowerCase()
		.trim(),
	
	telefono: z
		.string()
		.optional()
		.refine(
			(val) => !val || /^(\+506)?[\s-]?\d{4}[\s-]?\d{4}$/.test(val),
			'Formato: +506 1234-5678 o 12345678'
		),
	
	mensaje: z
		.string({ required_error: 'El mensaje es requerido' })
		.min(10, 'El mensaje debe tener al menos 10 caracteres')
		.max(1000, 'El mensaje no puede exceder 1000 caracteres')
		.trim(),
	
	id_propiedad: z.number().int().positive()
});

// Tipo TypeScript inferido del schema
export type ContactoFormData = z.infer<typeof contactoSchema>;

// Schema para respuesta de la API
export const contactoResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	id: z.number().optional()
});