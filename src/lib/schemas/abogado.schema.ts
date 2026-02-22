import { z } from 'zod';

export const abogadoSchema = z.object({
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
	
	mensaje: z
		.string({ required_error: 'El mensaje es requerido' })
		.min(20, 'Describa su situación legal con al menos 20 caracteres')
		.max(2000, 'El mensaje no puede exceder 2000 caracteres')
		.trim(),
	
	id_propiedad: z.number().int().positive(),
	
	tipo_consulta: z.enum(['compra', 'venta', 'remate', 'tramites', 'otro']).optional()
});

export type AbogadoFormData = z.infer<typeof abogadoSchema>;