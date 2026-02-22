// src/lib/utils/locationMatching.ts

export const CODIGOS_PROVINCIA: Record<string, string> = {
    'san josé': '1', 'san jose': '1',
    'alajuela': '2',
    'cartago': '3',
    'heredia': '4',
    'guanacaste': '5',
    'puntarenas': '6',
    'limón': '7', 'limon': '7'
};

export function obtenerCodigoProvincia(nombre: string | null): string | null {
    if (!nombre) return null;
    return CODIGOS_PROVINCIA[nombre.toLowerCase().trim()] || null;
}