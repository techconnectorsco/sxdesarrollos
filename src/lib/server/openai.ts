import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { parseSpanishDate } from '$lib/utils/rematesParser';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: 180000, // 180 segundos
    maxRetries: 3
});

export interface RemateEstructurado {
    finca_id?: string;
    matricula: string;
    base_price_text?: string;
    base_price_numeric?: number;
    currency?: string;
    naturaleza?: string;
    distrito?: string;
    canton?: string;
    provincia?: string;
    colindancias?: string;
    area_text?: string;
    area_numeric?: number;
    first_auction_date?: string;
    first_auction_time?: string;
    second_auction_date?: string;
    second_auction_time?: string;
    second_auction_base_text?: string;
    second_auction_base?: number;
    third_auction_date?: string;
    third_auction_time?: string;
    third_auction_base_text?: string;
    third_auction_base?: number;
    case_type?: string;
    plaintiff?: string;
    defendant?: string;
    case_number?: string;
    court?: string;
    judge?: string;
    raw_text: string;
}

/**
 * Procesa un texto de remate con OpenAI para extraer datos estructurados
 */
export async function processWithOpenAI(
    rawText: string,
    bulletinNumber?: string
): Promise<RemateEstructurado | null> {
    try {
        // AQUI ESTA LA MEJORA: Prompt reforzado solo en la sección de Precios
        const prompt = `Eres un asistente experto en extraer información estructurada de remates judiciales de propiedades en Costa Rica.

Del siguiente texto de remate judicial, extrae TODA la información disponible en formato JSON. 

REGLAS CRÍTICAS DE NORMALIZACIÓN:

**MATRÍCULA (IMPORTANTE):**
- Buscar el número de matrícula en el texto
- Formato típico: "123456-000", "627947-000"
- Si NO encuentras matrícula, devolver null (algunos remates no la tienen)
- SOLO si hay matrícula explícita en el texto

**PROVINCIA:**
- SIEMPRE capitalizar correctamente: "San José", "Heredia", "Alajuela", "Cartago", "Guanacaste", "Puntarenas", "Limón"
- NUNCA en mayúsculas completas: ❌ "SAN JOSÉ" → ✅ "San José"

**CANTÓN:**
- Quitar TODOS los números del inicio: ❌ "3-Desamparados" → ✅ "Desamparados"
- Quitar TODOS los números del inicio: ❌ "13-Tibás" → ✅ "Tibás"
- Capitalizar correctamente: "Desamparados", "Tibás", "Alajuela", etc
- Solo el nombre del cantón, sin números ni guiones

**DISTRITO:**
- Quitar TODOS los números del inicio: ❌ "12-Gravilias" → ✅ "Gravilias"
- Quitar TODOS los números del inicio: ❌ "10-Tres Equis" → ✅ "Tres Equis"
- Capitalizar correctamente
- Solo el nombre del distrito, sin números ni guiones

**NATURALEZA:**
- Capitalizar solo la primera letra de cada palabra importante
- Quitar información de lotes/bloques: ❌ "TERRENO PARA CONSTRUIR LOTE-15 BLOQUE A" → ✅ "Terreno para construir"
- Simplificar: ❌ "terreno DE SOLAR CON UNA CASA" → ✅ "Terreno de solar con una casa"
- Formato limpio y legible

**COLINDANCIAS:**
- Formato: "NORTE: [descripción], SUR: [descripción], ESTE: [descripción], OESTE: [descripción]"
- Extraer todos los puntos cardinales mencionados

**FECHAS:**
- Convertir a formato ISO: YYYY-MM-DD
- Ejemplo: "dos de febrero de dos mil veintiséis" → "2026-02-02"

**HORAS:**
- Formato: HH:MM (24 horas)
- Ejemplo: "trece horas cincuenta minutos" → "13:50"

**PRECIOS Y MONEDA (ATENCIÓN MÁXIMA AQUÍ):**
- base_price_numeric: Solo el número tipo FLOAT.
- **CÉNTIMOS:** Son decimales. NUNCA los unas al entero.
  - ❌ MAL: "Cuatro millones con cincuenta céntimos" -> 4000050
  - ✅ BIEN: "Cuatro millones con cincuenta céntimos" -> 4000000.50
- **MAGNITUD:** Si lees "MILLONES", el número debe tener 7 cifras o más. Si lees "MIL", 4 a 6 cifras.
- **MONEDA:** "USD" si menciona dólares o Estados Unidos. "CRC" si es colones.

TEXTO DEL REMATE:
${rawText}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "finca_id": null,
  "matricula": "string o null (si no hay matrícula explícita, poner null)",
  "base_price_text": "string o null (EL TEXTO EXACTO DEL PRECIO)",
  "base_price_numeric": number o null,
  "currency": "USD" | "CRC" | null,
  "naturaleza": "string capitalizado correctamente",
  "distrito": "string SIN números al inicio",
  "canton": "string SIN números al inicio",
  "provincia": "string capitalizado (San José, Heredia, etc)",
  "colindancias": "string formato: NORTE: X, SUR: Y, ESTE: Z, OESTE: W",
  "area_text": "string o null",
  "area_numeric": number o null,
  "first_auction_date": "YYYY-MM-DD o null",
  "first_auction_time": "HH:MM o null",
  "second_auction_date": "YYYY-MM-DD o null",
  "second_auction_time": "HH:MM o null",
  "second_auction_base_text": "string o null",
  "second_auction_base": number o null,
  "third_auction_date": "YYYY-MM-DD o null",
  "third_auction_time": "HH:MM o null",
  "third_auction_base_text": "string o null",
  "third_auction_base": number o null,
  "case_type": "string o null",
  "plaintiff": "string o null",
  "defendant": "string o null",
  "case_number": "string o null",
  "court": "string o null",
  "judge": "string o null"
}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente especializado en extraer datos estructurados de documentos legales. Respondes ÚNICAMENTE con JSON válido, sin explicaciones adicionales.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.0,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content;
        
        if (!responseText) {
            console.error('❌ OpenAI no devolvió respuesta');
            throw new Error('OpenAI no devolvió contenido');
        }

        // Parsear JSON
        const extracted = JSON.parse(responseText);

        // Si no tiene matrícula, generar ID temporal
        if (!extracted.matricula || extracted.matricula === null) {
            console.warn('⚠️ Remate sin matrícula, se asignará ID temporal');
            extracted.matricula = `SIN-MAT-${Date.now()}`;
        }

        extracted.raw_text = rawText;
        return normalizeData(extracted);

    } catch (error: any) {
        // ❌ NO FALLBACK A REGEX - Lanzar error explícito
        console.error('💥 ERROR OPENAI CRÍTICO:', {
            mensaje: error.message,
            tipo: error.constructor.name,
            code: error.code,
            status: error.status
        });

        // ✅ Lanzar error para que el frontend lo vea
        throw new Error(`OpenAI falló: ${error.message}`);
    }
}

/**
 * Normaliza y limpia los datos extraídos
 */
function normalizeData(data: any): RemateEstructurado {
    // Limpiar strings (EXCEPTO raw_text que debe quedar original)
    Object.keys(data).forEach(key => {
        if (key === 'raw_text') return; // NO normalizar raw_text
        
        if (typeof data[key] === 'string') {
            data[key] = data[key].trim();
            if (data[key] === '' || data[key].toLowerCase() === 'null') {
                data[key] = null;
            }
        }
    });

    // Calcular finca_id desde matrícula (quitar -000, -00, -0)
    if (data.matricula) {
        // Quitar -000, -00, -0 del final
        data.finca_id = data.matricula.replace(/-0+$/, '');
        // Si quedó solo el guion, quitarlo también
        data.finca_id = data.finca_id.replace(/-$/, '');
    }

    // Normalizar provincia (capitalizar)
    if (data.provincia) {
        data.provincia = capitalizeWords(data.provincia);
    }

    // Limpiar números del inicio de cantón
    if (data.canton) {
        data.canton = data.canton.replace(/^\d+-?\s*/i, '').trim();
        data.canton = capitalizeWords(data.canton);
    }

    // Limpiar números del inicio de distrito
    if (data.distrito) {
        data.distrito = data.distrito.replace(/^\d+-?\s*/i, '').trim();
        data.distrito = capitalizeWords(data.distrito);
    }

    // Normalizar naturaleza (capitalizar correctamente)
    if (data.naturaleza) {
        // Remover información de lotes/bloques/fincas filiales
        data.naturaleza = data.naturaleza
            .replace(/LOTE-?\s*\d+\s*/gi, '')
            .replace(/LOTE\s+[A-Z0-9-]+/gi, '')
            .replace(/BLOQUE\s+[A-Z0-9]/gi, '')
            .replace(/FINCA FILIAL[^,]*/gi, '')
            .replace(/UBICADA EN[^,]*/gi, '')
            .replace(/DESTINADA A[^,]*/gi, '')
            .replace(/EN PROCESO DE[^,]*/gi, '')
            .trim();
        
        // Limpiar múltiples espacios
        data.naturaleza = data.naturaleza.replace(/\s+/g, ' ');
        
        // Capitalizar
        data.naturaleza = capitalizeWords(data.naturaleza);
    }

    // Normalizar case_type (capitalizar)
    if (data.case_type) {
        data.case_type = capitalizeWords(data.case_type);
    }

    // Normalizar plaintiff (capitalizar)
    if (data.plaintiff) {
        data.plaintiff = capitalizeWords(data.plaintiff);
    }

    // Normalizar defendant (capitalizar)
    if (data.defendant) {
        data.defendant = capitalizeWords(data.defendant);
    }

    // Normalizar court (capitalizar)
    if (data.court) {
        data.court = capitalizeWords(data.court);
    }

    // Normalizar judge (capitalizar)
    if (data.judge) {
        data.judge = capitalizeWords(data.judge);
    }

    // Validar formato de hora (HH:MM)
    if (data.first_auction_time) {
        data.first_auction_time = normalizeTime(data.first_auction_time);
    }
    if (data.second_auction_time) {
        data.second_auction_time = normalizeTime(data.second_auction_time);
    }
    if (data.third_auction_time) {
        data.third_auction_time = normalizeTime(data.third_auction_time);
    }

    return data as RemateEstructurado;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
function capitalizeWords(text: string): string {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Normaliza formato de hora
 */
function normalizeTime(time: string): string {
    // Convertir "ocho horas treinta minutos" a "08:30"
    const hourWords: { [key: string]: string } = {
        'una': '01', 'dos': '02', 'tres': '03', 'cuatro': '04', 'cinco': '05',
        'seis': '06', 'siete': '07', 'ocho': '08', 'nueve': '09', 'diez': '10',
        'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
        'dieciséis': '16', 'diecisiete': '17', 'dieciocho': '18'
    };

    const minuteWords: { [key: string]: string } = {
        'cero': '00', 'cinco': '05', 'diez': '10', 'quince': '15',
        'veinte': '20', 'veinticinco': '25', 'treinta': '30',
        'treinta y cinco': '35', 'cuarenta': '40', 'cuarenta y cinco': '45',
        'cincuenta': '50', 'cincuenta y cinco': '55'
    };

    // Si ya está en formato HH:MM, devolverlo
    if (/^\d{1,2}:\d{2}$/.test(time)) {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
    }

    // Intentar convertir de palabras
    const hourMatch = time.match(/([a-záéíóúñ]+)\s+hora/i);
    const minuteMatch = time.match(/(\d+|[a-záéíóúñ\s]+)\s+minuto/i);

    if (hourMatch && minuteMatch) {
        const hour = hourWords[hourMatch[1].toLowerCase()] || hourMatch[1].padStart(2, '0');
        const minute = /^\d+$/.test(minuteMatch[1])
            ? minuteMatch[1].padStart(2, '0')
            : minuteWords[minuteMatch[1].toLowerCase()] || '00';

        return `${hour}:${minute}`;
    }

    return time;
}

/**
 * Calcula el costo estimado de tokens para OpenAI
 */
export function estimateTokenCost(text: string): number {
    // Estimación aproximada: 1 token ≈ 4 caracteres en español
    const tokens = Math.ceil(text.length / 4);
    return tokens;
}