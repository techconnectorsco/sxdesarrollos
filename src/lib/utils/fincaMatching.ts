// src/lib/utils/fincaMatching.ts

export function cleanString(val: any): string {
    if (!val) return '';
    return String(val).trim();
}

/**
 * Extrae el "núcleo" numérico imitando tu lógica de Python.
 * Ej: "2-534622-000" -> "534622"
 * Ej: "12345" -> "12345"
 */
export function getCoreFincaId(fincaId: string | null | undefined): string {
    const raw = cleanString(fincaId);
    if (!raw) return '';

    // 1. Si tiene guion, asumimos formato Registro (Prov-Finca-Der o Prov-Finca)
    // El script de Python partía por guion. Hacemos lo mismo.
    if (raw.includes('-')) {
        const partes = raw.split('-');
        
        // Si la primera parte es un dígito simple (1-7), es la provincia.
        // Nos interesa la segunda parte (el número de finca).
        if (partes.length >= 2 && /^[1-7]$/.test(partes[0])) {
            // Caso: 2-534622... -> Retornamos 534622
            return partes[1].replace(/\D/g, ''); 
        }
        
        // Si no parece provincia (ej: 534622-000), retornamos la primera parte
        return partes[0].replace(/\D/g, '');
    }

    // 2. Si no tiene guion, limpiamos todo lo que no sea número
    const soloNumeros = raw.replace(/\D/g, '');
    
    // Quitamos ceros a la izquierda para tener el "número puro"
    return soloNumeros.replace(/^0+/, '');
}