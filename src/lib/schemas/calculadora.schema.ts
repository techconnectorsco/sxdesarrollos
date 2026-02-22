import { z } from 'zod';

export const calculadoraPrestamoSchema = z.object({
	monto_credito: z
		.number({ required_error: 'El monto es requerido' })
		.positive('El monto debe ser positivo')
		.min(1000, 'Monto mínimo: 1,000')
		.max(500000000, 'Monto máximo: 500,000,000'),
	
	moneda: z.enum(['CRC', 'USD'], {
		required_error: 'Seleccione una moneda'
	}),
	
	tasa_interes: z
		.number({ required_error: 'La tasa es requerida' })
		.min(0.1, 'Tasa mínima: 0.1%')
		.max(30, 'Tasa máxima: 30%'),
	
	plazo_anios: z
		.number({ required_error: 'El plazo es requerido' })
		.int('El plazo debe ser un número entero')
		.min(1, 'Plazo mínimo: 1 año')
		.max(40, 'Plazo máximo: 40 años'),
	
	id_banco: z.number().int().positive().optional()
});

export type CalculadoraFormData = z.infer<typeof calculadoraPrestamoSchema>;

// Tipo para banco
export type Banco = {
	id: number;
	nombre: string;
	logo_url: string | null;
	tasa_minima_colones: number;
	tasa_maxima_colones: number;
	tasa_minima_dolares: number;
	tasa_maxima_dolares: number;
	plazo_minimo_anios: number;
	plazo_maximo_anios: number;
	activo: boolean;
	orden: number;
	enlace_solicitud: string | null;
};