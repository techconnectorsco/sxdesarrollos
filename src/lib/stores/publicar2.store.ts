import { writable, get } from 'svelte/store';
import type { PublicarPropiedadData } from '$lib/schemas/publicar.schema';

const initialState: Partial<PublicarPropiedadData> = {};

export const publicarStore = writable<Partial<PublicarPropiedadData>>(initialState);

export function setPasoData(data: Partial<PublicarPropiedadData>) {
  publicarStore.update((prev) => ({ ...prev, ...data }));
}

export function getPublicarData(): Partial<PublicarPropiedadData> {
  return get(publicarStore);
}

export function limpiarPublicarStore() {
  publicarStore.set(initialState);
}
