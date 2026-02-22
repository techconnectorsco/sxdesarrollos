// src/lib/stores/publicar.store.ts
import { writable, get } from 'svelte/store';
import type { Paso1Data } from '$lib/schemas/publicar.schema';

// ==========================================
// STORE para datos temporales del Paso 1
// ==========================================


export const datosPaso1Store = writable<Partial<Paso1Data> | null>(null);

// ==========================================
// FUNCIONES HELPER
// ==========================================

/**
 * Guarda datos del Paso 1 temporalmente en memoria
 */
export function guardarDatosPaso1Temporal(datos: Partial<Paso1Data>) {
	// console.log('💾 Datos Paso 1 guardados en memoria:', datos);
	datosPaso1Store.set(datos);
}

/**
 * Obtiene datos del Paso 1 desde el store
  */
export function obtenerDatosPaso1(): Partial<Paso1Data> | null {
	return get(datosPaso1Store);
}

/**
 * Limpia el store (después de guardar en BD)
 */
export function limpiarDatosPaso1() {
	// console.log('🧹 Store limpiado');
	datosPaso1Store.set(null);
}
