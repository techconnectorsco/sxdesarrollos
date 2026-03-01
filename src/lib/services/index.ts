/**
 * @module ServicesIndex
 * @description Exporta todos los servicios de manera centralizada
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ClientesService } from './clientes.service';
import { AutomatizacionesService } from './automatizaciones.service';
import { ProyectosService } from './proyectos.service';

/**
 * Factory para crear servicios con el cliente de Supabase
 */
export function createServices(supabase: SupabaseClient) {
	return {
		clientes: new ClientesService(supabase),
		automatizaciones: new AutomatizacionesService(supabase),
		proyectos: new ProyectosService(supabase)
	};
}

export type Services = ReturnType<typeof createServices>;
