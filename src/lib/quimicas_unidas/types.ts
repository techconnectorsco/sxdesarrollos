// Tipos del módulo Químicas Unidas (CXC)
// Portable: no depende de nada del proyecto host.

export type EstadoCuenta = 'padre' | 'hijo' | 'individual';

export interface ClienteSAP {
    cardCode: string;
    cardName: string;
    /** CardCode del padre si esta cuenta es hija; null en cualquier otro caso. */
    fatherCard: string | null;
    tipo: EstadoCuenta;
}

export interface CuentaPadre {
    cardCode: string;
    cardName: string;
    hijos: ClienteSAP[];
}

export interface ListaClientesResponse {
    total: number;
    /** Lista plana de todas las cuentas (para búsqueda por código/nombre). */
    clientes: ClienteSAP[];
    /** Solo cuentas que tienen hijos, agrupadas (para mostrar consolidación). */
    padres: CuentaPadre[];
}

// ── Orden de ejecución ──
// metodo:  'cliente'  -> el estado de cuenta se envía al cliente real
//          'revision' -> el estado de cuenta llega solo a crédito
export type MetodoEnvio = 'cliente' | 'revision';
export type AlcanceEjecucion = 'completo' | 'cliente';

export interface OrdenEjecucion {
    metodo: MetodoEnvio;
    alcance: AlcanceEjecucion;
    /** Vacío cuando alcance === 'completo'. */
    cardCodes: string[];
    /** Solo cuando metodo === 'revision'. Fallback a credito@qu.cr si vacío. */
    correoRevision?: string;
    /** Correo donde la API Python enviará los logs del procesamiento. */
    correoLogs?: string;
}

// ── Auditoría / consulta de cliente (Unificada como el PDF) ──

export interface DocUnificado {
    consecutivo: string;
    ordenCompra: string;
    fecha: string;
    fechaVence: string;
    tipoDoc: string;
    descripcion: string;
    saldo: number;
    moneda: 'CRC' | 'USD';
    diasVencido: number;
    estatus: string;
}

export interface RangosVencimiento {
    '0_30': number;
    '31_60': number;
    '61_90': number;
    '91_120': number;
    'mas_120': number;
    totalVencido: number;
}

export interface AuditoriaCliente {
    existe: boolean;
    cliente: {
        cardCode: string;
        cardName: string;
        saldoActual: number;
        envioAutomatico: string;
        correoPrincipal: string;
        correoCxc: string;
    };
    documentos: {
        usd: DocUnificado[];
        crc: DocUnificado[];
    };
    totales: {
        usd: number;
        crc: number;
    };
    rangos: {
        usd: RangosVencimiento;
        crc: RangosVencimiento;
    };
}


// ── Agentes / Giras ──

export interface AgenteSAP {
	codigo: number;
	nombre: string;
	correo: string;
}

export interface ListaAgentesResponse {
	total: number;
	agentes: AgenteSAP[];
}

export type MetodoEnvioGira = 'agente' | 'revision';

export interface OrdenEjecucionGira {
	agenteCodigo: string;
	metodo: MetodoEnvioGira;
	/** Solo cuando metodo === 'revision'. Fallback a credito@qu.cr si vacío. */
	correoRevision?: string;
}

// ── Giras por Zona ──

export interface ZonaSAP {
	/** Code de U_GIRAS, ya normalizado (sin ceros a la izquierda). */
	codigo: string;
	nombre: string;
}

/** Por qué un cliente no aporta nada al PDF de este agente. */
export type MotivoNoElegible = 'sin_documentos' | 'otro_vendedor';

export interface ClienteZona {
	cardCode: string;
	cardName: string;
	telefono: string;
	zonaCode: string;
	zonaNombre: string;
	vendedorCode: number;
	/** CardCode del padre si es sucursal. Necesario para distinguir homónimos. */
	fatherCard: string | null;

	/**
	 * Si el cliente aportaría algo al PDF de este agente.
	 *
	 * Lo decide el VPS con el MISMO criterio del PDF: el ruteo por U_CODV de la
	 * dirección del documento. Antes este árbol se armaba por SalesPersonCode de
	 * la ficha, que es otro universo, y por eso dejaba marcar clientes que nunca
	 * salían en el reporte.
	 */
	elegible: boolean;
	/** Documentos abiertos ruteados a este agente. Exacto. */
	docs: number;
	/** Saldo en colones. APROXIMADO: ver `montosAproximados` del árbol. */
	crc: number;
	/** Saldo en dólares. APROXIMADO. */
	usd: number;
	/** Solo en los no elegibles. */
	motivo?: MotivoNoElegible;
	/** Con motivo 'otro_vendedor': quién se lleva los documentos. */
	vendedorNombre?: string | null;
}

export interface ZonaConClientes {
	zona: ZonaSAP;
	clientes: ClienteZona[];
	totalElegibles: number;
	totalNoElegibles: number;
}

export interface ArbolAgenteZona {
	agente: AgenteSAP;
	/** Vienen ordenadas por cantidad de elegibles, de mayor a menor. */
	zonas: ZonaConClientes[];
	/** En la práctica siempre vacío: se midió y los agentes activos tienen zona. */
	sinZona: ClienteZona[];
	totalElegibles: number;
	totalNoElegibles: number;
	/**
	 * Siempre true: los montos salen de /SQLQueries, cuya precisión depende de la
	 * sesión y redondea a 6 cifras significativas. El error es de céntimos sobre
	 * millones y el PDF sigue siendo el documento autoritativo, así que la
	 * pantalla los muestra marcados como aproximados. La ELEGIBILIDAD no se
	 * decide por monto sino por ruteo y conteo de documentos, que son exactos.
	 */
	montosAproximados?: boolean;
}

export interface OrdenGiraZona {
	agenteCodigo: string;
	cardCodes: string[];
	metodo: MetodoEnvioGira;
	/** Solo cuando metodo === 'revision'. */
	correoRevision?: string;
	/** Nombre de zona para el encabezado del PDF. Se omite si la selección es mixta. */
	zonaNombre?: string;
}

/** Lo que devuelve `ejecutar_gira_selectiva` del lado Python. */
export interface ResultadoGiraZona {
	ok: boolean;
	/** Cuántos clientes pidió el usuario. */
	solicitados: number;
	/** Cuántos llegaron al PDF. */
	procesados: number;
	/** Sin documentos abiertos, inexistentes, o ruteados a otro vendedor. */
	omitidos: string[];
	/**
	 * Los mismos omitidos, separados por motivo. Opcional: una API del VPS
	 * anterior al 28/09/2026 no lo manda, y ahí se cae al listado plano.
	 */
	omitidos_detalle?: {
		/** Sin ningún documento abierto en SAP: nada que cobrar. */
		sin_documentos: string[];
		/** Tienen documentos, pero rutean a otro vendedor (BPAddresses.U_CODV). */
		otro_vendedor: string[];
		/** El código no existe en SAP. */
		inexistentes: string[];
		/**
		 * SAP falló mientras se los consultaba: NO se sabe qué deben.
		 *
		 * Es distinto de `sin_documentos` y la diferencia importa. El
		 * 01/10/2026 estos clientes se reportaban como "no hay nada que
		 * cobrar", y entre los cinco tenían 68 documentos abiertos: el
		 * Service Layer estaba caído y el error salía disfrazado de hecho del
		 * negocio. Un VPS anterior al 01/10/2026 no manda esta clave.
		 */
		no_evaluables?: string[];
	};
	pdf: string | null;
	mensaje: string;
}

export type EstadoJobGiraZona =
	| 'en_cola'
	| 'procesando'
	| 'terminado'
	| 'con_avisos'
	| 'error'
	/** El job_id no existe: la API se reinició y el estado vive en memoria. */
	| 'desconocido';

export interface EstadoGiraZonaResponse {
	estado: EstadoJobGiraZona;
	resultado: ResultadoGiraZona | null;
	/** Solo cuando estado === 'desconocido'. */
	mensaje?: string;
}
