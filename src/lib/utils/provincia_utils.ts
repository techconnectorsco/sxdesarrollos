import { UBICACIONES } from '$lib/data/costa_rica_ubicaciones';

// Mapeo de nombres de provincia a códigos numéricos
export const PROVINCIA_NOMBRE_A_CODIGO: Record<string, string> = {
    'san josé': '1', 'san jose': '1',
    'alajuela': '2',
    'cartago': '3',
    'heredia': '4',
    'guanacaste': '5',
    'puntarenas': '6',
    'limón': '7', 'limon': '7'
};

export const PROVINCIA_CODIGO_A_NOMBRE: Record<string, string> = {
    '1': 'San José', '2': 'Alajuela', '3': 'Cartago', '4': 'Heredia',
    '5': 'Guanacaste', '6': 'Puntarenas', '7': 'Limón'
};

// Mapeo de Cantones (Nombre -> Código 2 dígitos)
const CANTONES_POR_PROVINCIA: Record<string, Record<string, string>> = {
    '1': { // San José
        'san jose': '01', 'escazu': '02', 'desamparados': '03', 'puriscal': '04',
        'tarrazu': '05', 'aserri': '06', 'mora': '07', 'goicoechea': '08',
        'santa ana': '09', 'alajuelita': '10', 'vazquez de coronado': '11', 'coronado': '11',
        'acosta': '12', 'tibas': '13', 'moravia': '14', 'montes de oca': '15',
        'turrubares': '16', 'dota': '17', 'curridabat': '18', 'perez zeledon': '19',
        'leon cortes castro': '20', 'leon cortes': '20'
    },
    '2': { // Alajuela
        'alajuela': '01', 'san ramon': '02', 'grecia': '03', 'san mateo': '04',
        'atenas': '05', 'naranjo': '06', 'palmares': '07', 'poas': '08',
        'orotina': '09', 'san carlos': '10', 'zarcero': '11', 'alfaro ruiz': '11',
        'sarchi': '12', 'valverde vega': '12', 'upala': '13', 'los chiles': '14',
        'guatuso': '15', 'rio cuarto': '16'
    },
    '3': { // Cartago
        'cartago': '01', 'paraiso': '02', 'la union': '03', 'jimenez': '04',
        'turrialba': '05', 'alvarado': '06', 'oreamuno': '07', 'el guarco': '08'
    },
    '4': { // Heredia
        'heredia': '01', 'barva': '02', 'santo domingo': '03', 'santa barbara': '04',
        'san rafael': '05', 'san isidro': '06', 'belen': '07', 'flores': '08',
        'san pablo': '09', 'sarapiqui': '10'
    },
    '5': { // Guanacaste
        'liberia': '01', 'nicoya': '02', 'santa cruz': '03', 'bagaces': '04',
        'carrillo': '05', 'canas': '06', 'cañas': '06', 'abangares': '07',
        'tilaran': '08', 'nandayure': '09', 'la cruz': '10', 'hojancha': '11'
    },
    '6': { // Puntarenas
        'puntarenas': '01', 'esparza': '02', 'buenos aires': '03', 'montes de oro': '04',
        'osa': '05', 'quepos': '06', 'aguirre': '06', 'golfito': '07',
        'coto brus': '08', 'parrita': '09', 'corredores': '10', 'garabito': '11',
        'monteverde': '12', 'puerto jimenez': '13'
    },
    '7': { // Limón
        'limon': '01', 'pococi': '02', 'siquirres': '03', 'talamanca': '04',
        'matina': '05', 'guacimo': '06'
    }
};

export function getCantonCode(provinciaCode: string | null, nombreCanton: string | null | undefined): string | null {
    if (!provinciaCode || !nombreCanton) return null;
    const provKey = String(provinciaCode);
    const cantonNorm = nombreCanton.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

    if (CANTONES_POR_PROVINCIA[provKey]) {
        if (CANTONES_POR_PROVINCIA[provKey][cantonNorm]) {
            return CANTONES_POR_PROVINCIA[provKey][cantonNorm];
        }
        const found = Object.keys(CANTONES_POR_PROVINCIA[provKey]).find(k => k.includes(cantonNorm) || cantonNorm.includes(k));
        return found ? CANTONES_POR_PROVINCIA[provKey][found] : null;
    }
    return null;
}

export function getProvinciaCode(nombreProvincia: string | null | undefined): string | null {
    if (!nombreProvincia) return null;
    const normalizado = nombreProvincia.toLowerCase().trim();
    return PROVINCIA_NOMBRE_A_CODIGO[normalizado] || null;
}

export function getProvinciaNombre(codigo: string | number | null | undefined): string | null {
    if (codigo === null || codigo === undefined) return null;
    return PROVINCIA_CODIGO_A_NOMBRE[String(codigo)] || null;
}

/**
 * 1. Convierte a string
 * 2. Elimina TODO lo que no sea número (letras F, M, guiones, espacios)
 * 3. Elimina ceros a la izquierda
 * @example '00123456' -> '123456'
 * @example '123456-M' -> '123456'
 * @example '1-123456' -> '1123456'
 */
export function normalizarFincaId(fincaId: string | number | null | undefined): string {
    if (fincaId === null || fincaId === undefined) return '';
    let str = String(fincaId).trim();
    // Reemplaza todo lo que NO es dígito (\D) por vacío
    str = str.replace(/\D/g, ''); 
    // Reemplaza ceros al inicio
    return str.replace(/^0+/, '') || '0';
}

/**
 * Compara dos IDs de finca con máxima flexibilidad (Contains)
 * Confía en que la Provincia y Cantón ya filtraron los falsos positivos.
 */
export function fincaIdCoincide(fincaRemate: string | number | null | undefined, fincaMapa: string | number | null | undefined): boolean {
    const busqueda = normalizarFincaId(fincaRemate); // Lo que busco (ej: 123456)
    const objetivo = normalizarFincaId(fincaMapa);   // Lo que hay en el mapa (ej: 12345600)
    
    if (!busqueda || !objetivo) return false;

    // 1. Coincidencia Exacta
    if (busqueda === objetivo) return true;

    // 2. Lógica "Contains" (El mapa contiene al remate?)
    // Esto cubre:
    // Remate: 123456 -> Mapa: 12345600 (Match!)
    // Remate: 123456 -> Mapa: 00123456 (Match! por normalización)
    // Remate: 123456 -> Mapa: 123456-M (Match! por limpieza de letras)
    if (objetivo.includes(busqueda)) return true;

    // 3. Lógica Inversa (El remate contiene al mapa?) - Caso raro pero posible
    if (busqueda.includes(objetivo)) return true;

    return false;
}

export function buscarPropiedadFlexible<T extends { finca_id?: string | number | null; provincia?: string | null; canton?: string | null }>(
    propiedades: T[],
    fincaIdTileset: string | number | null | undefined,
    provinciaTileset: string | number | null | undefined,
    cantonTileset: string | number | null | undefined
): T | null {
    if (!fincaIdTileset) return null;
    
    const provinciaCodeMap = String(provinciaTileset || '').trim();
    const cantonCodeMap = String(cantonTileset || '').trim().padStart(2, '0');

    return propiedades.find(p => {
        // 1. FINCA: Debe coincidir según tu lógica de normalización
        if (!p.finca_id || !fincaIdCoincide(p.finca_id, fincaIdTileset)) return false; 
        
        // 2. PROVINCIA: ELIMINAR EL PARCHE DE "SI ES 0 ES SAN JOSE"
        const propProvCode = getProvinciaCode(p.provincia);
        if (!propProvCode || propProvCode !== provinciaCodeMap) {
            // Solo permitimos el match si la provincia del mapa coincide EXACTAMENTE 
            // con la de la base de datos.
            return false;
        }

        // 3. CANTÓN: Si el mapa da cantón, debe coincidir.
        if (cantonCodeMap !== '00' && cantonCodeMap !== 'null' && cantonCodeMap !== '') {
            const propCantonCode = getCantonCode(propProvCode, p.canton);
            if (propCantonCode && propCantonCode !== cantonCodeMap) return false;
        }

        return true;
    }) || null;
}

let CACHE_DISTRITOS: Record<string, Record<string, Record<string, string>>> | null = null;

function generarCacheDistritos() {
    if (CACHE_DISTRITOS) return;

    CACHE_DISTRITOS = {};

    UBICACIONES.forEach(prov => {
        const provCode = prov.codigo; // Ej: "1"
        if (!CACHE_DISTRITOS![provCode]) CACHE_DISTRITOS![provCode] = {};

        prov.cantones.forEach(canton => {
            // El código del cantón en tu archivo es "101", "102".
            // Necesitamos extraer los últimos dígitos o normalizarlo. 
            // Asumiremos que el código de cantón que recibes de la UI ya viene limpio (ej: "01" o "1").
            // Para mapear, usaremos el código del archivo recortado: "101" -> "01"
            
            // Lógica: Si length es 3, tomamos los últimos 2.
            let cantonCodeSimple = canton.codigo.slice(-2); 
            
            if (!CACHE_DISTRITOS![provCode][cantonCodeSimple]) {
                CACHE_DISTRITOS![provCode][cantonCodeSimple] = {};
            }

            canton.distritos.forEach(dist => {
                const nombreNorm = dist.distrito.toLowerCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                // El código de distrito en tu archivo es "10101". 
                // Los últimos 2 dígitos son el distrito: "01"
                const distCodeSimple = dist.codigo.slice(-2);

                CACHE_DISTRITOS![provCode][cantonCodeSimple][nombreNorm] = distCodeSimple;
            });
        });
    });
}

export function getDistritoCode(
    provinciaCode: string | null, 
    cantonCode: string | null, 
    nombreDistrito: string | null | undefined
): string | null {
    if (!provinciaCode || !cantonCode || !nombreDistrito) return null;

    // Aseguramos que el cache exista
    generarCacheDistritos();

    const provKey = String(provinciaCode);
    
    // Normalizar cantón a 2 dígitos (ej: "1" -> "01") para coincidir con el mapa generado
    let cantonKey = String(cantonCode).padStart(2, '0');

    const distNorm = nombreDistrito.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Buscar en el árbol
    const provinciaData = CACHE_DISTRITOS?.[provKey];
    if (!provinciaData) return null;

    const cantonData = provinciaData[cantonKey];
    if (!cantonData) return null;

    // Retorna el código (Ej: "01", "13") o null si no existe
    return cantonData[distNorm] || null;
}