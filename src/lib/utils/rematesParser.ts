export interface RematePropiedad {
	rawText: string;
	referencia: string | null;
}

/**
 * Extrae solo los remates de propiedades del texto completo del boletín
 * usando palabras clave específicas
 */
export function extractRematesPropiedades(boletinText: string): RematePropiedad[] {
	const remates: RematePropiedad[] = [];

	// Dividir el boletín por "Referencia N°:" para obtener cada entrada individual
	const entradas = boletinText.split(/Referencia N°:/);

	for (const entrada of entradas) {
		if (!entrada.trim()) continue;

		// Palabras clave que indican que es un remate de PROPIEDAD (no vehículo)
		const keywordsPropiedades = [
			/sáquese a remate la finca/i,
			/finca del partido de/i,
			/matrícula número/i,
			/EJECUCIÓN HIPOTECARIA/i,
			/COLINDA:/i,
			/MIDE:.*METROS CUADRADOS/i
		];

		// Palabras clave que indican que NO es una propiedad (vehículos, etc)
		const keywordsExcluir = [
    /sáquese a remate el vehículo/i,
    /placa [A-Z]{3}\d{3,4}/i,
    /Marca: [A-Z]/i,
    /# de Chasis:/i,
    /Cilindrada:/i,
    /INFORMACIÓN POSESORIA/i,
    /Juzgado Notarial/i,        
    /proceso disciplinario/i,   
    /denuncia por el mal actuar/i, 
    /Dirección Nacional de Notariado/i, 
    /Sucesorio/i,              
    /CAUSAHABIENTES/i        
];

		// Verificar si contiene palabras clave de propiedades
		const esPropiedad = keywordsPropiedades.some(regex => regex.test(entrada));
		
		// Verificar que NO contiene palabras clave de exclusión
		const noEsVehiculo = !keywordsExcluir.some(regex => regex.test(entrada));

		if (esPropiedad && noEsVehiculo) {
			// Extraer número de referencia
			const referenciaMatch = entrada.match(/(\d{10,})/);
			const referencia = referenciaMatch ? referenciaMatch[1] : null;

			remates.push({
				rawText: entrada.trim(),
				referencia
			});
		}
	}

	return remates;
}

/**
 * Extrae información básica del remate usando regex (backup si OpenAI falla)
 */
export function extractBasicInfo(rawText: string) {
	const info: any = {};

	// Extraer matrícula
	const matriculaMatch = rawText.match(/matrícula número (\d+-\d+)/i);
	if (matriculaMatch) info.matricula = matriculaMatch[1];

	// Extraer provincia
	const provinciaMatch = rawText.match(/finca del partido de ([A-ZÁÉÍÓÚÑ\s]+),/i);
	if (provinciaMatch) info.provincia = provinciaMatch[1].trim();

	// Extraer distrito
	const distritoMatch = rawText.match(/DISTRITO\s+\d+-([A-ZÁÉÍÓÚÑ\s]+)/i);
	if (distritoMatch) info.distrito = distritoMatch[1].trim();

	// Extraer cantón
	const cantonMatch = rawText.match(/CANTÓN\s+\d+-([A-ZÁÉÍÓÚÑ\s]+)/i);
	if (cantonMatch) info.canton = cantonMatch[1].trim();

	// Extraer naturaleza
	const naturalezaMatch = rawText.match(/es terreno ([A-ZÁÉÍÓÚÑ\s]+)\./i);
	if (naturalezaMatch) info.naturaleza = naturalezaMatch[1].trim();

	// Extraer área
	const areaMatch = rawText.match(/MIDE:\s*([\d.,]+)\s*METROS CUADRADOS/i);
	if (areaMatch) {
		info.area_text = areaMatch[1];
		info.area_numeric = parseFloat(areaMatch[1].replace(/,/g, ''));
	}

	// Extraer base (precio)
	const baseMatch = rawText.match(/Con una base de ([A-ZÁÉÍÓÚÑ\s\d.,]+),/i);
	if (baseMatch) {
		info.base_price_text = baseMatch[1].trim();
		
		// Determinar moneda
		if (/DÓLAR/i.test(baseMatch[1])) {
			info.currency = 'USD';
		} else if (/COLÓN/i.test(baseMatch[1])) {
			info.currency = 'CRC';
		}

		// Extraer valor numérico
		const numeroMatch = baseMatch[1].match(/[\d.,]+/);
		if (numeroMatch) {
			info.base_price_numeric = parseFloat(numeroMatch[0].replace(/,/g, ''));
		}
	}

	// Extraer fecha primera subasta
	const primeraFechaMatch = rawText.match(/se señalan las ([\d\s:]+) del ([a-záéíóúñ\s]+de [a-záéíóúñ\s]+de dos mil veintiséis)/i);
	if (primeraFechaMatch) {
		info.first_auction_time = primeraFechaMatch[1].trim();
		info.first_auction_date_text = primeraFechaMatch[2].trim();
	}

	// Extraer expediente
	const expMatch = rawText.match(/EXP:(\d+-\d+-\d+-[A-Z]{2})/i);
	if (expMatch) info.case_number = expMatch[1];

	// Extraer tipo de proceso
	const procesoMatch = rawText.match(/PROCESO\s+([A-ZÁÉÍÓÚÑ\s]+)\s+de/i);
	if (procesoMatch) info.case_type = procesoMatch[1].trim();

	// Extraer demandante y demandado
	const partesMatch = rawText.match(/de\s+(.+?)\s+contra\s+(.+?)\s+EXP:/i);
	if (partesMatch) {
		info.plaintiff = partesMatch[1].trim();
		info.defendant = partesMatch[2].trim();
	}

	// Extraer juzgado
	const juzgadoMatch = rawText.match(/JUZGADO\s+([A-ZÁÉÍÓÚÑ\s\d]+)\./i);
	if (juzgadoMatch) info.court = juzgadoMatch[1].trim();

	// Extraer juez
	const juezMatch = rawText.match(/\.\s*([A-ZÁÉÍÓÚÑ\s.]+),\s*Jue[zx]/i);
	if (juezMatch) info.judge = juezMatch[1].trim();

	return info;
}

/**
 * Convierte fecha en texto español a formato ISO (YYYY-MM-DD)
 */
export function parseSpanishDate(dateText: string): string | null {
	if (!dateText) return null;

	const meses: { [key: string]: string } = {
		'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
		'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
		'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
	};

	// Buscar patrón: "doce de enero de dos mil veintiséis"
	const match = dateText.match(/([a-záéíóúñ]+)\s+de\s+([a-záéíóúñ]+)\s+de\s+dos mil (veinti[a-záéíóúñ]+)/i);
	
	if (match) {
		const dia = convertirNumeroEspanol(match[1]);
		const mes = meses[match[2].toLowerCase()];
		const anio = convertirAnioEspanol(match[3]);
		
		if (dia && mes && anio) {
			return `${anio}-${mes}-${dia.padStart(2, '0')}`;
		}
	}

	return null;
}

/**
 * Convierte número en palabras españolas a dígitos
 */
function convertirNumeroEspanol(palabra: string): string | null {
	const numeros: { [key: string]: number } = {
		'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
		'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
		'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
		'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
		'veinte': 20, 'veintiuno': 21, 'veintidós': 22, 'veintitrés': 23,
		'veinticuatro': 24, 'veinticinco': 25, 'veintiséis': 26, 'veintisiete': 27,
		'veintiocho': 28, 'veintinueve': 29, 'treinta': 30, 'treinta y uno': 31
	};

	return numeros[palabra.toLowerCase()]?.toString() || null;
}

/**
 * Convierte año en palabras a dígitos (dos mil veintiséis -> 2026)
 */
function convertirAnioEspanol(palabra: string): string | null {
	const anios: { [key: string]: string } = {
		'veinticinco': '2025',
		'veintiséis': '2026',
		'veintisiete': '2027',
		'veintiocho': '2028',
		'veintinueve': '2029',
		'treinta': '2030'
	};

	return anios[palabra.toLowerCase()] || null;
}

/*
 * Extrae matrícula del texto usando regex SIMPLE
 * Solo para formatos numéricos/simples (cubre 90% de casos)
 * 
 * Patrones que detecta:
 * - 123456-000 (con guion)
 * - 123456000 (sin separadores)
 * - 123456 (solo número)
 * - 123456-F (con letra F)
 * - 123456 F (con espacio)
 */
export function extractMatriculaConRegex(rawText: string): string | null {
	// Patrón 1: "matrícula número XXXXXX-YYY" o "matrícula número XXXXXX YYY"
	let match = rawText.match(/matrícula\s+número\s+(\d{6,}-?\d{2,})/i);
	if (match) return match[1].trim();

	// Patrón 2: "matrícula número XXXXXX-F" o "matrícula número XXXXXX F"
	match = rawText.match(/matrícula\s+número\s+(\d{6,}(?:\s*-?\s*F)?)/i);
	if (match) return match[1].trim();

	// Patrón 3: "matrícula XXXXXX-YYY" (sin "número")
	match = rawText.match(/matrícula\s+(\d{6,}-\d{2,})/i);
	if (match) return match[1].trim();

	// Patrón 4: Cualquier XXXXXX-000 / XXXXXX000
	match = rawText.match(/(\d{6,}(?:\s*-?\s*\d{2,})?)/);
	if (match) return match[1].trim();

	return null; // No extrajo con regex → irá a OpenAI
}