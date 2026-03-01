/**
 * @module ApiService
 * @description Servicio cliente para hacer fetch a los endpoints API
 * Reemplaza el uso directo de Supabase en componentes
 */

import type {
	Automatizacion,
	Ejecucion,
	ProyectoSoftware,
	EstadoEjecucion
} from '$lib/types/database';

export class ApiService {
	private baseUrl = '';

	constructor() {
		// En el navegador, usar URL relativa
		if (typeof window !== 'undefined') {
			this.baseUrl = '';
		}
	}

	private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options?.headers
			}
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
			throw new Error(error.message || `Error ${response.status}`);
		}

		return response.json();
	}

	// ==================== AUTOMATIZACIONES ====================

	async getAutomatizaciones(clienteId?: string): Promise<Automatizacion[]> {
		const params = clienteId ? `?cliente_id=${clienteId}` : '';
		const data = await this.fetchApi<{ automatizaciones: Automatizacion[] }>(
			`/api/automatizaciones${params}`
		);
		return data.automatizaciones;
	}

	// ==================== EJECUCIONES ====================

	async getEjecuciones(options?: {
		automatizacionId?: string;
		limit?: number;
	}): Promise<Ejecucion[]> {
		const params = new URLSearchParams();
		if (options?.automatizacionId) {
			params.append('automatizacion_id', options.automatizacionId);
		}
		if (options?.limit) {
			params.append('limit', options.limit.toString());
		}

		const queryString = params.toString();
		const data = await this.fetchApi<{ ejecuciones: Ejecucion[] }>(
			`/api/ejecuciones${queryString ? `?${queryString}` : ''}`
		);
		return data.ejecuciones;
	}

	async crearEjecucion(ejecucion: {
		automatizacion_id: string;
		fecha_inicio?: string;
		estado: EstadoEjecucion;
		metricas?: Record<string, any>;
		log_salida?: string;
		observaciones?: string;
	}): Promise<Ejecucion> {
		const data = await this.fetchApi<{ ejecucion: Ejecucion }>('/api/ejecuciones', {
			method: 'POST',
			body: JSON.stringify(ejecucion)
		});
		return data.ejecucion;
	}

	// ==================== PROYECTOS ====================

	async getProyectos(clienteId?: string): Promise<ProyectoSoftware[]> {
		const params = clienteId ? `?cliente_id=${clienteId}` : '';
		const data = await this.fetchApi<{ proyectos: ProyectoSoftware[] }>(
			`/api/proyectos${params}`
		);
		return data.proyectos;
	}

	// ==================== ESTADÍSTICAS ====================

	async getEstadisticas(clienteId?: string): Promise<any> {
		const params = clienteId ? `?cliente_id=${clienteId}` : '';
		const data = await this.fetchApi<{ estadisticas: any }>(`/api/estadisticas${params}`);
		return data.estadisticas;
	}
}

// Instancia singleton
export const apiService = new ApiService();
