import ubicacionesData from '$lib/data/costa_rica_ubicaciones.json';

/**
 * Obtiene el código catastral completo a partir de nombres de provincia, cantón y distrito
 */
export interface Distrito {
	distrito: string;
	codigo: string;
}

export interface Canton {
	canton: string;
	codigo: string;
	distritos: Distrito[];
}

export interface Provincia {
	provincia: string;
	codigo: string;
	cantones: Canton[];
}

export function obtenerCodigoCatastral(provincia: string, canton: string, distrito: string): string | null {
	const prov = (ubicacionesData as unknown as Provincia[]).find(p => p.provincia === provincia);
	if (!prov) return null;
	
	const cant = prov.cantones.find(c => c.canton === canton);
	if (!cant) return null;
	
	const dist = cant.distritos.find(d => d.distrito === distrito);
	if (!dist) return null;
	
	return dist.codigo;
}

/**
 * Obtiene información completa de ubicación incluyendo códigos
 */
export interface DatosUbicacion {
	provincia: string;
	codigoProvincia: string;
	canton: string;
	codigoCanton: string;
	distrito: string;
	codigoDistrito: string;
	codigoCatastral: string;
}

export function obtenerDatosUbicacion(provincia: string, canton: string, distrito: string): DatosUbicacion | null {
	const prov = (ubicacionesData as unknown as Provincia[]).find(p => p.provincia === provincia);
	if (!prov) return null;
	
	const cant = prov.cantones.find(c => c.canton === canton);
	if (!cant) return null;
	
	const dist = cant.distritos.find(d => d.distrito === distrito);
	if (!dist) return null;
	
	return {
		provincia: prov.provincia,
		codigoProvincia: prov.codigo,
		canton: cant.canton,
		codigoCanton: cant.codigo,
		distrito: dist.distrito,
		codigoDistrito: dist.codigo,
		codigoCatastral: dist.codigo
	};
}

/**
 * Coordenadas de CENTROS DE DISTRITO para todo Costa Rica.
 * Basado en la estructura de costa_rica_ubicaciones.ts
 */
const CENTROS_DISTRITOS: Record<string, { lat: number; lng: number; zoom: number }> = {
    // --- SAN JOSÉ (1) ---
    // 101 San José
    '10101': { lat: 9.9326, lng: -84.0787, zoom: 15 }, // Carmen
    '10102': { lat: 9.9340, lng: -84.0831, zoom: 15 }, // Merced
    '10103': { lat: 9.9365, lng: -84.0803, zoom: 15 }, // Hospital
    '10104': { lat: 9.9326, lng: -84.0747, zoom: 15 }, // Catedral
    '10105': { lat: 9.9144, lng: -84.0591, zoom: 15 }, // Zapote
    '10106': { lat: 9.9215, lng: -84.0843, zoom: 15 }, // San Francisco de Dos Ríos
    '10107': { lat: 9.9653, lng: -84.1273, zoom: 14 }, // Uruca
    '10108': { lat: 9.9562, lng: -84.0565, zoom: 15 }, // Mata Redonda
    '10109': { lat: 9.9443, lng: -84.1186, zoom: 14 }, // Pavas
    '10110': { lat: 9.8891, lng: -84.0758, zoom: 14 }, // Hatillo
    '10111': { lat: 9.9241, lng: -84.0521, zoom: 15 }, // San Sebastián

    // 102 Escazú
    '10201': { lat: 9.9189, lng: -84.1396, zoom: 14 }, // Escazú
    '10202': { lat: 9.8934, lng: -84.1544, zoom: 14 }, // San Antonio
    '10203': { lat: 9.9379, lng: -84.1607, zoom: 14 }, // San Rafael

    // 103 Desamparados
    '10301': { lat: 9.8892, lng: -84.0428, zoom: 14 }, // Desamparados
    '10302': { lat: 9.8782, lng: -84.0298, zoom: 14 }, // San Miguel
    '10303': { lat: 9.8743, lng: -84.0583, zoom: 14 }, // San Juan de Dios
    '10304': { lat: 9.8631, lng: -84.0621, zoom: 14 }, // San Rafael Arriba
    '10305': { lat: 9.9045, lng: -84.0583, zoom: 14 }, // San Antonio
    '10306': { lat: 9.7712, lng: -84.0412, zoom: 13 }, // Frailes
    '10307': { lat: 9.8943, lng: -84.0123, zoom: 14 }, // Patarrá
    '10308': { lat: 9.7723, lng: -84.0045, zoom: 13 }, // San Cristóbal
    '10309': { lat: 9.7891, lng: -84.0678, zoom: 13 }, // Rosario
    '10310': { lat: 9.9012, lng: -84.0345, zoom: 14 }, // Damas
    '10311': { lat: 9.8512, lng: -84.0691, zoom: 14 }, // San Rafael Abajo
    '10312': { lat: 9.8956, lng: -84.0512, zoom: 14 }, // Gravilias
    '10313': { lat: 9.8712, lng: -84.0456, zoom: 14 }, // Los Guido

    // 104 Puriscal
    '10401': { lat: 9.8456, lng: -84.3123, zoom: 14 }, // Santiago
    '10402': { lat: 9.7891, lng: -84.3567, zoom: 13 }, // Mercedes Sur
    '10403': { lat: 9.8678, lng: -84.3234, zoom: 13 }, // Barbacoas
    '10404': { lat: 9.8234, lng: -84.3456, zoom: 13 }, // Grifo Alto
    '10405': { lat: 9.8567, lng: -84.3345, zoom: 13 }, // San Rafael
    '10406': { lat: 9.8123, lng: -84.3678, zoom: 13 }, // Candelarita
    '10407': { lat: 9.8789, lng: -84.3456, zoom: 13 }, // Desamparaditos
    '10408': { lat: 9.8345, lng: -84.3789, zoom: 13 }, // San Antonio
    '10409': { lat: 9.7123, lng: -84.4123, zoom: 12 }, // Chires

    // 105 Tarrazú
    '10501': { lat: 9.6654, lng: -84.0234, zoom: 14 }, // San Marcos
    '10502': { lat: 9.6234, lng: -84.0567, zoom: 13 }, // San Lorenzo
    '10503': { lat: 9.6456, lng: -84.0891, zoom: 13 }, // San Carlos

    // 106 Aserrí
    '10601': { lat: 9.8567, lng: -84.0891, zoom: 14 }, // Aserrí
    '10602': { lat: 9.8123, lng: -84.1123, zoom: 13 }, // Tarbaca
    '10603': { lat: 9.7891, lng: -84.1345, zoom: 13 }, // Vuelta de Jorco
    '10604': { lat: 9.7654, lng: -84.1567, zoom: 13 }, // San Gabriel
    '10605': { lat: 9.7234, lng: -84.1789, zoom: 12 }, // Legua
    '10606': { lat: 9.6891, lng: -84.1912, zoom: 13 }, // Monterrey
    '10607': { lat: 9.8345, lng: -84.0912, zoom: 14 }, // Salitrillos

    // 107 Mora
    '10701': { lat: 9.9123, lng: -84.2456, zoom: 14 }, // Colón
    '10702': { lat: 9.8789, lng: -84.2678, zoom: 13 }, // Guayabo
    '10703': { lat: 9.8456, lng: -84.2891, zoom: 13 }, // Tabarcia
    '10704': { lat: 9.9234, lng: -84.3123, zoom: 13 }, // Piedras Negras
    '10705': { lat: 9.8891, lng: -84.3345, zoom: 13 }, // Picagres
    '10706': { lat: 9.8567, lng: -84.3567, zoom: 13 }, // Jaris
    '10707': { lat: 9.8234, lng: -84.2789, zoom: 13 }, // Quitirrisí

    // 108 Goicoechea
    '10801': { lat: 9.9515, lng: -84.0589, zoom: 14 }, // Guadalupe
    '10802': { lat: 9.9394, lng: -84.0485, zoom: 15 }, // San Francisco
    '10803': { lat: 9.9481, lng: -84.0366, zoom: 15 }, // Calle Blancos
    '10804': { lat: 9.9653, lng: -84.0428, zoom: 14 }, // Mata de Plátano
    '10805': { lat: 9.9561, lng: -84.0231, zoom: 14 }, // Ipís
    '10806': { lat: 9.9783, lng: -84.0623, zoom: 14 }, // Rancho Redondo
    '10807': { lat: 9.9689, lng: -84.0489, zoom: 14 }, // Purral

    // 109 Santa Ana
    '10901': { lat: 9.9326, lng: -84.1825, zoom: 14 }, // Santa Ana
    '10902': { lat: 9.9123, lng: -84.1945, zoom: 13 }, // Salitral
    '10903': { lat: 9.9456, lng: -84.1989, zoom: 14 }, // Pozos
    '10904': { lat: 9.9512, lng: -84.1756, zoom: 14 }, // Uruca
    '10905': { lat: 9.9234, lng: -84.2123, zoom: 14 }, // Piedades
    '10906': { lat: 9.9189, lng: -84.2345, zoom: 14 }, // Brasil

    // 110 Alajuelita
    '11001': { lat: 9.9012, lng: -84.1023, zoom: 14 }, // Alajuelita
    '11002': { lat: 9.8891, lng: -84.1145, zoom: 14 }, // San Josecito
    '11003': { lat: 9.8789, lng: -84.1056, zoom: 14 }, // San Antonio
    '11004': { lat: 9.8945, lng: -84.1234, zoom: 14 }, // Concepción
    '11005': { lat: 9.9123, lng: -84.1167, zoom: 14 }, // San Felipe

    // 111 Vázquez de Coronado
    '11101': { lat: 9.9756, lng: -84.0123, zoom: 14 }, // San Isidro
    '11102': { lat: 9.9891, lng: -84.0234, zoom: 14 }, // San Rafael
    '11103': { lat: 9.9912, lng: -83.9989, zoom: 14 }, // Dulce Nombre de Jesús
    '11104': { lat: 9.9678, lng: -84.0045, zoom: 14 }, // Patalillo
    '11105': { lat: 10.0123, lng: -83.9876, zoom: 13 }, // Cascajal

    // 112 Acosta
    '11201': { lat: 9.8123, lng: -84.2234, zoom: 14 }, // San Ignacio
    '11202': { lat: 9.7891, lng: -84.2456, zoom: 13 }, // Guaitil
    '11203': { lat: 9.8345, lng: -84.2012, zoom: 13 }, // Palmichal
    '11204': { lat: 9.7567, lng: -84.2678, zoom: 13 }, // Cangrejal
    '11205': { lat: 9.7234, lng: -84.2891, zoom: 12 }, // Sabanillas

    // 113 Tibás
    '11301': { lat: 9.9591, lng: -84.0871, zoom: 14 }, // San Juan
    '11302': { lat: 9.9535, lng: -84.0965, zoom: 15 }, // Cinco Esquinas
    '11303': { lat: 9.9651, lng: -84.1018, zoom: 15 }, // Anselmo Llorente
    '11304': { lat: 9.9471, lng: -84.1142, zoom: 14 }, // León XIII
    '11305': { lat: 9.9512, lng: -84.0789, zoom: 14 }, // Colima

    // 114 Moravia
    '11401': { lat: 9.9623, lng: -84.0456, zoom: 14 }, // San Vicente
    '11402': { lat: 9.9891, lng: -84.0345, zoom: 14 }, // San Jerónimo
    '11403': { lat: 9.9756, lng: -84.0234, zoom: 14 }, // Trinidad

    // 115 Montes de Oca
    '11501': { lat: 9.9367, lng: -84.0504, zoom: 14 }, // San Pedro
    '11502': { lat: 9.9282, lng: -84.0398, zoom: 15 }, // Sabanilla
    '11503': { lat: 9.9421, lng: -84.0612, zoom: 15 }, // Mercedes
    '11504': { lat: 9.9518, lng: -84.0672, zoom: 15 }, // San Rafael

    // 116 Turrubares
    '11601': { lat: 9.8234, lng: -84.4345, zoom: 14 }, // San Pablo
    '11602': { lat: 9.8567, lng: -84.4567, zoom: 13 }, // San Pedro
    '11603': { lat: 9.7891, lng: -84.4789, zoom: 13 }, // San Juan de Mata
    '11604': { lat: 9.7567, lng: -84.5012, zoom: 13 }, // San Luis
    '11605': { lat: 9.7912, lng: -84.5678, zoom: 12 }, // Carara

    // 117 Dota
    '11701': { lat: 9.6543, lng: -83.9789, zoom: 14 }, // Santa María
    '11702': { lat: 9.6123, lng: -83.9891, zoom: 13 }, // Jardín
    '11703': { lat: 9.6345, lng: -83.9456, zoom: 13 }, // Copey

    // 118 Curridabat
    '11801': { lat: 9.9124, lng: -84.0294, zoom: 14 }, // Curridabat
    '11802': { lat: 9.9183, lng: -84.0198, zoom: 14 }, // Granadilla
    '11803': { lat: 9.9052, lng: -84.0187, zoom: 14 }, // Sánchez
    '11804': { lat: 9.8976, lng: -84.0345, zoom: 14 }, // Tirrases

    // 119 Pérez Zeledón
    '11901': { lat: 9.3734, lng: -83.7023, zoom: 14 }, // San Isidro de El General
    '11902': { lat: 9.3345, lng: -83.6789, zoom: 13 }, // General
    '11903': { lat: 9.3567, lng: -83.6891, zoom: 13 }, // Daniel Flores
    '11904': { lat: 9.4123, lng: -83.6678, zoom: 13 }, // Rivas
    '11905': { lat: 9.2891, lng: -83.6456, zoom: 13 }, // San Pedro
    '11906': { lat: 9.2567, lng: -83.6234, zoom: 13 }, // Platanares
    '11907': { lat: 9.2234, lng: -83.6012, zoom: 13 }, // Pejibaye
    '11908': { lat: 9.1891, lng: -83.5789, zoom: 13 }, // Cajón
    '11909': { lat: 9.2789, lng: -83.8678, zoom: 13 }, // Barú
    '11910': { lat: 9.4567, lng: -83.7891, zoom: 13 }, // Río Nuevo
    '11911': { lat: 9.4891, lng: -83.7567, zoom: 13 }, // Páramo
    '11912': { lat: 9.1567, lng: -83.5567, zoom: 13 }, // La Amistad

    // 120 León Cortés Castro
    '12001': { lat: 9.7123, lng: -84.0678, zoom: 14 }, // San Pablo
    '12002': { lat: 9.6891, lng: -84.0891, zoom: 13 }, // San Andrés
    '12003': { lat: 9.6567, lng: -84.1123, zoom: 13 }, // Llano Bonito
    '12004': { lat: 9.7345, lng: -84.0456, zoom: 13 }, // San Isidro
    '12005': { lat: 9.6345, lng: -84.0234, zoom: 13 }, // Santa Cruz
    '12006': { lat: 9.6789, lng: -84.0012, zoom: 13 }, // San Antonio

    // --- ALAJUELA (2) ---
    // 201 Alajuela
    '20101': { lat: 10.0167, lng: -84.2117, zoom: 14 }, // Alajuela
    '20102': { lat: 10.0012, lng: -84.2345, zoom: 14 }, // San José
    '20103': { lat: 10.0678, lng: -84.1891, zoom: 13 }, // Carrizal
    '20104': { lat: 9.9945, lng: -84.1834, zoom: 14 }, // San Antonio
    '20105': { lat: 9.9623, lng: -84.2345, zoom: 14 }, // Guácima
    '20106': { lat: 10.0345, lng: -84.1789, zoom: 14 }, // San Isidro
    '20107': { lat: 10.0789, lng: -84.2123, zoom: 13 }, // Sabanilla
    '20108': { lat: 9.9756, lng: -84.2123, zoom: 14 }, // San Rafael
    '20109': { lat: 9.9891, lng: -84.1945, zoom: 14 }, // Río Segundo
    '20110': { lat: 9.9567, lng: -84.1789, zoom: 14 }, // Desamparados
    '20111': { lat: 9.9456, lng: -84.3123, zoom: 14 }, // Turrúcares
    '20112': { lat: 10.0456, lng: -84.2456, zoom: 13 }, // Tambor
    '20113': { lat: 9.9789, lng: -84.2891, zoom: 13 }, // Garita
    '20114': { lat: 10.2789, lng: -84.1678, zoom: 12 }, // Sarapiquí

    // 202 San Ramón
    '20201': { lat: 10.0867, lng: -84.4704, zoom: 14 }, // San Ramón
    '20202': { lat: 10.0678, lng: -84.4912, zoom: 13 }, // Santiago
    '20203': { lat: 10.0989, lng: -84.4567, zoom: 14 }, // San Juan
    '20204': { lat: 10.1234, lng: -84.4678, zoom: 13 }, // Piedades Norte
    '20205': { lat: 10.0567, lng: -84.5123, zoom: 13 }, // Piedades Sur
    '20206': { lat: 10.0789, lng: -84.4456, zoom: 14 }, // San Rafael
    '20207': { lat: 10.0456, lng: -84.4678, zoom: 14 }, // San Isidro
    '20208': { lat: 10.1567, lng: -84.4891, zoom: 13 }, // Ángeles
    '20209': { lat: 10.0891, lng: -84.4234, zoom: 14 }, // Alfaro
    '20210': { lat: 10.1345, lng: -84.4456, zoom: 13 }, // Volio
    '20211': { lat: 10.1123, lng: -84.4891, zoom: 13 }, // Concepción
    '20212': { lat: 10.0234, lng: -84.5345, zoom: 13 }, // Zapotal
    '20213': { lat: 10.3789, lng: -84.6789, zoom: 12 }, // Peñas Blancas
    '20214': { lat: 10.2567, lng: -84.5678, zoom: 12 }, // San Lorenzo

    // 203 Grecia
    '20301': { lat: 10.0725, lng: -84.3092, zoom: 14 }, // Grecia
    '20302': { lat: 10.0945, lng: -84.2876, zoom: 14 }, // San Isidro
    '20303': { lat: 10.0891, lng: -84.3234, zoom: 14 }, // San José
    '20304': { lat: 10.0567, lng: -84.3123, zoom: 14 }, // San Roque
    '20305': { lat: 10.0345, lng: -84.2891, zoom: 14 }, // Tacares
    '20307': { lat: 10.0234, lng: -84.3345, zoom: 14 }, // Puente de Piedra
    '20308': { lat: 10.0456, lng: -84.3567, zoom: 14 }, // Bolívar

    // 204 San Mateo
    '20401': { lat: 9.9456, lng: -84.5321, zoom: 14 }, // San Mateo
    '20402': { lat: 9.9234, lng: -84.5123, zoom: 13 }, // Desmonte
    '20403': { lat: 9.9123, lng: -84.5567, zoom: 13 }, // Jesús María
    '20404': { lat: 9.9678, lng: -84.5345, zoom: 13 }, // Labrador

    // 205 Atenas
    '20501': { lat: 9.9789, lng: -84.3789, zoom: 14 }, // Atenas
    '20502': { lat: 9.9891, lng: -84.4012, zoom: 13 }, // Jesús
    '20503': { lat: 10.0012, lng: -84.3678, zoom: 14 }, // Mercedes
    '20504': { lat: 9.9678, lng: -84.3567, zoom: 14 }, // San Isidro
    '20505': { lat: 9.9567, lng: -84.3891, zoom: 14 }, // Concepción
    '20506': { lat: 9.9456, lng: -84.3678, zoom: 14 }, // San José
    '20507': { lat: 9.9345, lng: -84.3891, zoom: 14 }, // Santa Eulalia
    '20508': { lat: 9.9234, lng: -84.4123, zoom: 13 }, // Escobal

    // 206 Naranjo
    '20601': { lat: 10.0987, lng: -84.3789, zoom: 14 }, // Naranjo
    '20602': { lat: 10.1123, lng: -84.3567, zoom: 13 }, // San Miguel
    '20603': { lat: 10.1234, lng: -84.3891, zoom: 13 }, // San José
    '20604': { lat: 10.1345, lng: -84.3678, zoom: 13 }, // Cirrí Sur
    '20605': { lat: 10.1456, lng: -84.3456, zoom: 13 }, // San Jerónimo
    '20606': { lat: 10.0789, lng: -84.3912, zoom: 13 }, // San Juan
    '20607': { lat: 10.0678, lng: -84.3678, zoom: 13 }, // Rosario
    '20608': { lat: 10.0891, lng: -84.4123, zoom: 13 }, // Palmitos

    // 207 Palmares
    '20701': { lat: 10.0567, lng: -84.4345, zoom: 14 }, // Palmares
    '20702': { lat: 10.0456, lng: -84.4123, zoom: 14 }, // Zaragoza
    '20703': { lat: 10.0678, lng: -84.4234, zoom: 14 }, // Buenos Aires
    '20704': { lat: 10.0345, lng: -84.4456, zoom: 14 }, // Santiago
    '20705': { lat: 10.0789, lng: -84.4456, zoom: 14 }, // Candelaria
    '20706': { lat: 10.0567, lng: -84.4567, zoom: 14 }, // Esquipulas
    '20707': { lat: 10.0678, lng: -84.4012, zoom: 14 }, // La Granja

    // 208 Poás
    '20801': { lat: 10.0789, lng: -84.2345, zoom: 14 }, // San Pedro
    '20802': { lat: 10.0912, lng: -84.2234, zoom: 14 }, // San Juan
    '20803': { lat: 10.0678, lng: -84.2123, zoom: 14 }, // San Rafael
    '20804': { lat: 10.0567, lng: -84.2456, zoom: 14 }, // Carrillos
    '20805': { lat: 10.1123, lng: -84.2123, zoom: 13 }, // Sabana Redonda

    // 209 Orotina
    '20901': { lat: 9.9123, lng: -84.5234, zoom: 14 }, // Orotina
    '20902': { lat: 9.8891, lng: -84.5012, zoom: 13 }, // Mastate
    '20903': { lat: 9.9345, lng: -84.5123, zoom: 13 }, // Hacienda Vieja
    '20904': { lat: 9.8789, lng: -84.5456, zoom: 13 }, // Coyolar
    '20905': { lat: 9.9567, lng: -84.5678, zoom: 13 }, // La Ceiba

    // 210 San Carlos
    '21001': { lat: 10.3234, lng: -84.4345, zoom: 14 }, // Quesada
    '21002': { lat: 10.3678, lng: -84.4567, zoom: 13 }, // Florencia
    '21003': { lat: 10.3456, lng: -84.4123, zoom: 13 }, // Buenavista
    '21004': { lat: 10.3891, lng: -84.3456, zoom: 13 }, // Aguas Zarcas
    '21005': { lat: 10.3912, lng: -84.2891, zoom: 13 }, // Venecia
    '21006': { lat: 10.4567, lng: -84.2678, zoom: 13 }, // Pital
    '21007': { lat: 10.4678, lng: -84.6456, zoom: 13 }, // Fortuna
    '21008': { lat: 10.3567, lng: -84.5678, zoom: 13 }, // Tigra
    '21009': { lat: 10.4234, lng: -84.3891, zoom: 13 }, // Palmera
    '21010': { lat: 10.5456, lng: -84.7891, zoom: 12 }, // Venado
    '21011': { lat: 10.6789, lng: -84.4567, zoom: 11 }, // Cutris
    '21012': { lat: 10.5891, lng: -84.6234, zoom: 12 }, // Monterrey
    '21013': { lat: 10.6123, lng: -84.5345, zoom: 12 }, // Pocosol

    // 211 Zarcero
    '21101': { lat: 10.1891, lng: -84.3891, zoom: 14 }, // Zarcero
    '21102': { lat: 10.2123, lng: -84.3678, zoom: 13 }, // Laguna
    '21103': { lat: 10.2012, lng: -84.4012, zoom: 13 }, // Tapezco
    '21104': { lat: 10.1789, lng: -84.4123, zoom: 13 }, // Guadalupe
    '21105': { lat: 10.2234, lng: -84.3456, zoom: 13 }, // Palmira
    '21106': { lat: 10.2345, lng: -84.4234, zoom: 13 }, // Zapote
    '21107': { lat: 10.1678, lng: -84.3789, zoom: 13 }, // Brisas

    // 212 Sarchí
    '21201': { lat: 10.0891, lng: -84.3456, zoom: 14 }, // Sarchí Norte
    '21202': { lat: 10.0789, lng: -84.3567, zoom: 14 }, // Sarchí Sur
    '21203': { lat: 10.1234, lng: -84.3234, zoom: 13 }, // Toro Amarillo
    '21204': { lat: 10.0678, lng: -84.3345, zoom: 14 }, // San Pedro
    '21205': { lat: 10.0567, lng: -84.3567, zoom: 14 }, // Rodríguez

    // 213 Upala
    '21301': { lat: 10.8987, lng: -85.0123, zoom: 13 }, // Upala
    '21302': { lat: 10.8567, lng: -85.1234, zoom: 12 }, // Aguas Claras
    '21303': { lat: 10.9234, lng: -85.0678, zoom: 12 }, // San José (Pizote)
    '21304': { lat: 10.7345, lng: -85.0456, zoom: 12 }, // Bijagua
    '21305': { lat: 10.8123, lng: -85.0891, zoom: 13 }, // Delicias
    '21306': { lat: 10.9456, lng: -85.1567, zoom: 12 }, // Dos Ríos
    '21307': { lat: 10.8789, lng: -84.9891, zoom: 13 }, // Yolillal
    '21308': { lat: 10.8345, lng: -85.0234, zoom: 13 }, // Canalete

    // 214 Los Chiles
    '21401': { lat: 11.0345, lng: -84.7123, zoom: 13 }, // Los Chiles
    '21402': { lat: 10.9123, lng: -84.7891, zoom: 12 }, // Caño Negro
    '21403': { lat: 10.9891, lng: -84.7456, zoom: 12 }, // El Amparo
    '21404': { lat: 10.8567, lng: -84.6789, zoom: 12 }, // San Jorge

    // 215 Guatuso
    '21501': { lat: 10.6789, lng: -84.8234, zoom: 13 }, // San Rafael
    '21502': { lat: 10.7123, lng: -84.7891, zoom: 13 }, // Buenavista
    '21503': { lat: 10.5891, lng: -84.8567, zoom: 13 }, // Cote
    '21504': { lat: 10.7567, lng: -84.8891, zoom: 13 }, // Katira

    // 216 Río Cuarto
    '21601': { lat: 10.3456, lng: -84.2123, zoom: 13 }, // Río Cuarto
    '21602': { lat: 10.3789, lng: -84.1891, zoom: 13 }, // Santa Rita
    '21603': { lat: 10.4123, lng: -84.2345, zoom: 13 }, // Santa Isabel

    // --- CARTAGO (3) ---
    // 301 Cartago
    '30101': { lat: 9.8645, lng: -83.9195, zoom: 15 }, // Oriental
    '30102': { lat: 9.8623, lng: -83.9256, zoom: 15 }, // Occidental
    '30103': { lat: 9.8712, lng: -83.9189, zoom: 15 }, // Carmen
    '30104': { lat: 9.8789, lng: -83.9345, zoom: 14 }, // San Nicolás
    '30105': { lat: 9.8456, lng: -83.9012, zoom: 14 }, // Agua Caliente
    '30106': { lat: 9.8234, lng: -83.9567, zoom: 14 }, // Guadalupe (Corralillo)
    '30107': { lat: 9.7891, lng: -83.9891, zoom: 13 }, // Corralillo
    '30108': { lat: 9.9123, lng: -83.8891, zoom: 13 }, // Tierra Blanca
    '30109': { lat: 9.8567, lng: -83.8789, zoom: 14 }, // Dulce Nombre
    '30110': { lat: 9.9456, lng: -83.8912, zoom: 13 }, // Llano Grande
    '30111': { lat: 9.8345, lng: -83.9345, zoom: 14 }, // Quebradilla

    // 302 Paraíso
    '30201': { lat: 9.8389, lng: -83.8656, zoom: 14 }, // Paraíso
    '30202': { lat: 9.8123, lng: -83.8456, zoom: 14 }, // Santiago
    '30203': { lat: 9.7912, lng: -83.8567, zoom: 13 }, // Orosi
    '30204': { lat: 9.8234, lng: -83.8012, zoom: 13 }, // Cachí
    '30205': { lat: 9.8456, lng: -83.8891, zoom: 14 }, // Llanos de Santa Lucía
    '30206': { lat: 9.8678, lng: -83.8345, zoom: 14 }, // Birrisito

    // 303 La Unión
    '30301': { lat: 9.9134, lng: -83.9915, zoom: 14 }, // Tres Ríos
    '30302': { lat: 9.9267, lng: -84.0089, zoom: 15 }, // San Diego
    '30303': { lat: 9.8983, lng: -83.9867, zoom: 15 }, // San Juan
    '30304': { lat: 9.9326, lng: -84.0142, zoom: 15 }, // San Rafael
    '30305': { lat: 9.9453, lng: -84.0276, zoom: 15 }, // Concepción
    '30306': { lat: 9.9187, lng: -83.9734, zoom: 14 }, // Dulce Nombre
    '30307': { lat: 9.8872, lng: -83.9624, zoom: 14 }, // San Ramón
    '30308': { lat: 9.9518, lng: -84.0089, zoom: 14 }, // Río Azul

    // 304 Jiménez
    '30401': { lat: 9.9012, lng: -83.7456, zoom: 14 }, // Juan Viñas
    '30402': { lat: 9.8567, lng: -83.7234, zoom: 14 }, // Tucurrique
    '30403': { lat: 9.8234, lng: -83.7012, zoom: 14 }, // Pejibaye

    // 305 Turrialba
    '30501': { lat: 9.9056, lng: -83.6789, zoom: 14 }, // Turrialba
    '30502': { lat: 9.8678, lng: -83.6012, zoom: 13 }, // La Suiza
    '30503': { lat: 9.9456, lng: -83.6234, zoom: 13 }, // Peralta
    '30504': { lat: 9.9789, lng: -83.7123, zoom: 13 }, // Santa Cruz
    '30505': { lat: 9.9567, lng: -83.7456, zoom: 13 }, // Santa Teresita
    '30506': { lat: 9.8891, lng: -83.5678, zoom: 13 }, // Pavones
    '30507': { lat: 9.8456, lng: -83.5891, zoom: 13 }, // Tuis
    '30508': { lat: 9.8234, lng: -83.5456, zoom: 13 }, // Tayutic
    '30509': { lat: 9.9234, lng: -83.6567, zoom: 14 }, // Santa Rosa
    '30510': { lat: 9.9891, lng: -83.5234, zoom: 13 }, // Tres Equis
    '30511': { lat: 9.9123, lng: -83.6345, zoom: 14 }, // La Isabel
    '30512': { lat: 9.7567, lng: -83.4891, zoom: 11 }, // Chirripó

    // 306 Alvarado
    '30601': { lat: 9.9678, lng: -83.8012, zoom: 14 }, // Pacayas
    '30602': { lat: 9.8891, lng: -83.8234, zoom: 14 }, // Cervantes
    '30603': { lat: 9.9456, lng: -83.7789, zoom: 14 }, // Capellades

    // 307 Oreamuno
    '30701': { lat: 9.8789, lng: -83.9012, zoom: 14 }, // San Rafael
    '30702': { lat: 9.8912, lng: -83.8789, zoom: 14 }, // Cot
    '30703': { lat: 9.9234, lng: -83.8678, zoom: 14 }, // Potrero Cerrado
    '30704': { lat: 9.9012, lng: -83.8456, zoom: 14 }, // Cipreses
    '30705': { lat: 9.9567, lng: -83.8234, zoom: 13 }, // Santa Rosa

    // 308 El Guarco
    '30801': { lat: 9.8615, lng: -83.9195, zoom: 14 }, // El Tejar
    '30802': { lat: 9.8345, lng: -83.9234, zoom: 13 }, // San Isidro
    '30803': { lat: 9.8326, lng: -83.8945, zoom: 14 }, // Tobosi
    '30804': { lat: 9.8123, lng: -83.9456, zoom: 14 }, // Patio de Agua

    // --- HEREDIA (4) ---
    // 401 Heredia
    '40101': { lat: 10.0023, lng: -84.1167, zoom: 14 }, // Heredia
    '40102': { lat: 10.0123, lng: -84.1234, zoom: 14 }, // Mercedes
    '40103': { lat: 10.0056, lng: -84.1345, zoom: 14 }, // San Francisco
    '40104': { lat: 9.9891, lng: -84.1456, zoom: 14 }, // Ulloa
    '40105': { lat: 10.1678, lng: -84.1567, zoom: 13 }, // Varablanca

    // 402 Barva
    '40201': { lat: 10.0234, lng: -84.1234, zoom: 14 }, // Barva
    '40202': { lat: 10.0456, lng: -84.1345, zoom: 14 }, // San Pedro
    '40203': { lat: 10.0345, lng: -84.1123, zoom: 14 }, // San Pablo
    '40204': { lat: 10.0567, lng: -84.1234, zoom: 14 }, // San Roque
    '40205': { lat: 10.0189, lng: -84.1012, zoom: 14 }, // Santa Lucía
    '40206': { lat: 10.0678, lng: -84.1012, zoom: 13 }, // San José de la Montaña

    // 403 Santo Domingo
    '40301': { lat: 9.9823, lng: -84.0912, zoom: 14 }, // Santo Domingo
    '40302': { lat: 9.9756, lng: -84.0789, zoom: 14 }, // San Vicente
    '40303': { lat: 9.9912, lng: -84.0678, zoom: 14 }, // San Miguel
    '40304': { lat: 10.0045, lng: -84.0456, zoom: 14 }, // Paracito
    '40305': { lat: 9.9891, lng: -84.0891, zoom: 14 }, // Santo Tomás
    '40306': { lat: 9.9678, lng: -84.0945, zoom: 14 }, // Santa Rosa
    '40307': { lat: 10.0123, lng: -84.0567, zoom: 14 }, // Tures
    '40308': { lat: 10.0234, lng: -84.0345, zoom: 14 }, // Pará

    // 404 Santa Bárbara
    '40401': { lat: 10.0345, lng: -84.1567, zoom: 14 }, // Santa Bárbara
    '40402': { lat: 10.0567, lng: -84.1678, zoom: 14 }, // San Pedro
    '40403': { lat: 10.0234, lng: -84.1789, zoom: 14 }, // San Juan
    '40404': { lat: 10.0456, lng: -84.1456, zoom: 14 }, // Jesús
    '40405': { lat: 10.0678, lng: -84.1345, zoom: 13 }, // Santo Domingo
    '40406': { lat: 10.0891, lng: -84.1567, zoom: 13 }, // Purabá

    // 405 San Rafael
    '40501': { lat: 10.0123, lng: -84.1012, zoom: 14 }, // San Rafael
    '40502': { lat: 10.0012, lng: -84.0891, zoom: 14 }, // San Josecito
    '40503': { lat: 10.0234, lng: -84.0789, zoom: 14 }, // Santiago
    '40504': { lat: 10.0456, lng: -84.0678, zoom: 13 }, // Ángeles
    '40505': { lat: 10.0678, lng: -84.0567, zoom: 13 }, // Concepción

    // 406 San Isidro
    '40601': { lat: 10.0178, lng: -84.0567, zoom: 14 }, // San Isidro
    '40602': { lat: 10.0345, lng: -84.0345, zoom: 13 }, // San José
    '40603': { lat: 10.0567, lng: -84.0234, zoom: 13 }, // Concepción
    '40604': { lat: 10.0012, lng: -84.0456, zoom: 14 }, // San Francisco

    // 407 Belén
    '40701': { lat: 9.9789, lng: -84.1823, zoom: 14 }, // San Antonio
    '40702': { lat: 9.9891, lng: -84.1945, zoom: 14 }, // La Ribera
    '40703': { lat: 9.9678, lng: -84.1712, zoom: 14 }, // La Asunción

    // 408 Flores
    '40801': { lat: 10.0054, lng: -84.1581, zoom: 14 }, // San Joaquín
    '40802': { lat: 10.0098, lng: -84.1553, zoom: 14 }, // Barrantes
    '40803': { lat: 9.9945, lng: -84.1456, zoom: 14 }, // Llorente

    // 409 San Pablo
    '40901': { lat: 9.9967, lng: -84.0945, zoom: 14 }, // San Pablo
    '40902': { lat: 9.9856, lng: -84.1056, zoom: 14 }, // Rincón de Sabanilla

    // 410 Sarapiquí
    '41001': { lat: 10.4567, lng: -84.0045, zoom: 13 }, // Puerto Viejo
    '41002': { lat: 10.4123, lng: -84.1345, zoom: 13 }, // La Virgen
    '41003': { lat: 10.3456, lng: -83.9678, zoom: 13 }, // Horquetas
    '41004': { lat: 10.6789, lng: -83.7891, zoom: 12 }, // Llanuras del Gaspar
    '41005': { lat: 10.7123, lng: -84.1567, zoom: 12 }, // Cureña

    // --- GUANACASTE (5) ---
    // 501 Liberia
    '50101': { lat: 10.6345, lng: -85.4409, zoom: 14 }, // Liberia
    '50102': { lat: 10.7123, lng: -85.4123, zoom: 13 }, // Cañas Dulces
    '50103': { lat: 10.7567, lng: -85.4678, zoom: 13 }, // Mayorga
    '50104': { lat: 10.5891, lng: -85.5345, zoom: 13 }, // Nacascolo
    '50105': { lat: 10.7234, lng: -85.3567, zoom: 13 }, // Curubandé

    // 502 Nicoya
    '50201': { lat: 10.1456, lng: -85.4545, zoom: 14 }, // Nicoya
    '50202': { lat: 10.1123, lng: -85.3456, zoom: 13 }, // Mansión
    '50203': { lat: 10.1567, lng: -85.3891, zoom: 13 }, // San Antonio
    '50204': { lat: 10.1789, lng: -85.3123, zoom: 13 }, // Quebrada Honda
    '50205': { lat: 9.8789, lng: -85.5234, zoom: 13 }, // Sámara
    '50206': { lat: 9.9789, lng: -85.6456, zoom: 13 }, // Nosara
    '50207': { lat: 10.0567, lng: -85.4891, zoom: 13 }, // Belén de Nosarita

    // 503 Santa Cruz
    '50301': { lat: 10.2678, lng: -85.5891, zoom: 14 }, // Santa Cruz
    '50302': { lat: 10.2345, lng: -85.5123, zoom: 13 }, // Bolsón
    '50303': { lat: 10.2123, lng: -85.6789, zoom: 13 }, // Veintisiete de Abril
    '50304': { lat: 10.3789, lng: -85.6891, zoom: 13 }, // Tempate
    '50305': { lat: 10.3891, lng: -85.6123, zoom: 13 }, // Cartagena
    '50306': { lat: 10.1891, lng: -85.7345, zoom: 13 }, // Cuajiniquil
    '50307': { lat: 10.2891, lng: -85.5567, zoom: 13 }, // Diriá
    '50308': { lat: 10.3567, lng: -85.8234, zoom: 13 }, // Cabo Velas
    '50309': { lat: 10.2987, lng: -85.8409, zoom: 13 }, // Tamarindo

    // 504 Bagaces
    '50401': { lat: 10.5234, lng: -85.2567, zoom: 14 }, // Bagaces
    '50402': { lat: 10.6789, lng: -85.2123, zoom: 13 }, // Fortuna
    '50403': { lat: 10.7234, lng: -85.1567, zoom: 13 }, // Mogote
    '50404': { lat: 10.6123, lng: -85.2891, zoom: 13 }, // Río Naranjo

    // 505 Carrillo
    '50501': { lat: 10.4345, lng: -85.5456, zoom: 14 }, // Filadelfia
    '50502': { lat: 10.4678, lng: -85.5789, zoom: 13 }, // Palmira
    '50503': { lat: 10.5123, lng: -85.6456, zoom: 13 }, // Sardinal
    '50504': { lat: 10.4012, lng: -85.5891, zoom: 13 }, // Belén

    // 506 Cañas
    '50601': { lat: 10.4234, lng: -85.0891, zoom: 14 }, // Cañas
    '50602': { lat: 10.4567, lng: -85.0567, zoom: 13 }, // Palmira
    '50603': { lat: 10.4789, lng: -85.0234, zoom: 13 }, // San Miguel
    '50604': { lat: 10.3567, lng: -85.1234, zoom: 13 }, // Bebedero
    '50605': { lat: 10.3234, lng: -85.0891, zoom: 13 }, // Porozal

    // 507 Abangares
    '50701': { lat: 10.2789, lng: -84.9567, zoom: 14 }, // Juntas
    '50702': { lat: 10.2345, lng: -84.9234, zoom: 13 }, // Sierra
    '50703': { lat: 10.3123, lng: -84.9891, zoom: 13 }, // San Juan
    '50704': { lat: 10.1891, lng: -85.1123, zoom: 13 }, // Colorado

    // 508 Tilarán
    '50801': { lat: 10.5567, lng: -84.9678, zoom: 14 }, // Tilarán
    '50802': { lat: 10.5234, lng: -84.9891, zoom: 13 }, // Quebrada Grande
    '50803': { lat: 10.5123, lng: -84.9234, zoom: 13 }, // Tronadora
    '50804': { lat: 10.4891, lng: -84.9567, zoom: 13 }, // Santa Rosa
    '50805': { lat: 10.4567, lng: -84.9234, zoom: 13 }, // Líbano
    '50806': { lat: 10.5891, lng: -85.0234, zoom: 13 }, // Tierras Morenas
    '50807': { lat: 10.4789, lng: -84.8567, zoom: 13 }, // Arenal
    '50808': { lat: 10.6123, lng: -84.9891, zoom: 13 }, // Cabeceras

    // 509 Nandayure
    '50901': { lat: 10.0012, lng: -85.2456, zoom: 14 }, // Carmona
    '50902': { lat: 9.9789, lng: -85.2789, zoom: 13 }, // Santa Rita
    '50903': { lat: 9.9456, lng: -85.3123, zoom: 13 }, // Zapotal
    '50904': { lat: 10.0345, lng: -85.2123, zoom: 13 }, // San Pablo
    '50905': { lat: 10.0678, lng: -85.1891, zoom: 13 }, // Porvenir
    '50906': { lat: 9.8567, lng: -85.3456, zoom: 13 }, // Bejuco

    // 510 La Cruz
    '51001': { lat: 11.0734, lng: -85.6325, zoom: 14 }, // La Cruz
    '51002': { lat: 10.9891, lng: -85.4567, zoom: 13 }, // Santa Cecilia
    '51003': { lat: 10.9234, lng: -85.5234, zoom: 13 }, // Garita
    '51004': { lat: 10.9123, lng: -85.6123, zoom: 13 }, // Santa Elena

    // 511 Hojancha
    '51101': { lat: 10.0456, lng: -85.4234, zoom: 14 }, // Hojancha
    '51102': { lat: 10.0234, lng: -85.4567, zoom: 13 }, // Monte Romo
    '51103': { lat: 9.9891, lng: -85.4891, zoom: 13 }, // Puerto Carrillo
    '51104': { lat: 10.0789, lng: -85.3891, zoom: 13 }, // Huacas
    '51105': { lat: 10.0567, lng: -85.3567, zoom: 13 }, // Matambú

    // --- PUNTARENAS (6) ---
    // 601 Puntarenas
    '60101': { lat: 9.9767, lng: -84.8384, zoom: 14 }, // Puntarenas
    '60102': { lat: 10.0234, lng: -84.8891, zoom: 13 }, // Pitahaya
    '60103': { lat: 10.0678, lng: -84.9234, zoom: 13 }, // Chomes
    '60104': { lat: 9.9567, lng: -85.0345, zoom: 13 }, // Lepanto
    '60105': { lat: 9.8234, lng: -84.9345, zoom: 13 }, // Paquera
    '60106': { lat: 10.1123, lng: -84.9567, zoom: 13 }, // Manzanillo
    '60107': { lat: 10.1567, lng: -84.8891, zoom: 13 }, // Guacimal
    '60108': { lat: 9.9789, lng: -84.7234, zoom: 14 }, // Barranca
    '60110': { lat: 5.5417, lng: -87.0583, zoom: 12 }, // Isla del Coco
    '60111': { lat: 9.6891, lng: -85.0891, zoom: 13 }, // Cóbano
    '60112': { lat: 9.9891, lng: -84.7678, zoom: 14 }, // Chacarita
    '60113': { lat: 10.0891, lng: -85.1234, zoom: 13 }, // Chira
    '60114': { lat: 10.1789, lng: -84.9234, zoom: 13 }, // Acapulco
    '60115': { lat: 9.9845, lng: -84.7456, zoom: 14 }, // El Roble
    '60116': { lat: 10.2123, lng: -84.8567, zoom: 13 }, // Arancibia

    // 602 Esparza
    '60201': { lat: 9.9945, lng: -84.6678, zoom: 14 }, // Espíritu Santo
    '60202': { lat: 9.9789, lng: -84.6456, zoom: 14 }, // San Juan Grande
    '60203': { lat: 10.0123, lng: -84.6234, zoom: 14 }, // Macacona
    '60204': { lat: 10.0345, lng: -84.6012, zoom: 14 }, // San Rafael
    '60205': { lat: 10.0567, lng: -84.5789, zoom: 13 }, // San Jerónimo
    '60206': { lat: 9.9345, lng: -84.7123, zoom: 14 }, // Caldera

    // 603 Buenos Aires
    '60301': { lat: 9.1789, lng: -83.3345, zoom: 14 }, // Buenos Aires
    '60302': { lat: 9.1456, lng: -83.4567, zoom: 13 }, // Volcán
    '60303': { lat: 9.0123, lng: -83.1891, zoom: 12 }, // Potrero Grande
    '60304': { lat: 9.0456, lng: -83.3123, zoom: 13 }, // Boruca
    '60305': { lat: 9.1123, lng: -83.1567, zoom: 13 }, // Pilas
    '60306': { lat: 9.0789, lng: -83.2345, zoom: 13 }, // Colinas
    '60307': { lat: 8.9456, lng: -83.2012, zoom: 13 }, // Chánguena
    '60308': { lat: 9.0891, lng: -83.0567, zoom: 12 }, // Biolley
    '60309': { lat: 9.1234, lng: -83.2678, zoom: 13 }, // Brunka

    // 604 Montes de Oro
    '60401': { lat: 10.0987, lng: -84.7234, zoom: 14 }, // Miramar
    '60402': { lat: 10.1345, lng: -84.7567, zoom: 13 }, // Unión
    '60403': { lat: 10.1123, lng: -84.6891, zoom: 13 }, // San Isidro

    // 605 Osa
    '60501': { lat: 8.9567, lng: -83.5234, zoom: 14 }, // Puerto Cortés
    '60502': { lat: 8.9567, lng: -83.4678, zoom: 13 }, // Palmar
    '60503': { lat: 8.8678, lng: -83.4678, zoom: 12 }, // Sierpe
    '60504': { lat: 9.1678, lng: -83.7456, zoom: 13 }, // Bahía Ballena
    '60505': { lat: 8.7891, lng: -83.2456, zoom: 12 }, // Piedras Blancas
    '60506': { lat: 8.7123, lng: -83.6789, zoom: 12 }, // Bahía Drake

    // 606 Quepos
    '60601': { lat: 9.4234, lng: -84.1678, zoom: 14 }, // Quepos
    '60602': { lat: 9.5456, lng: -84.0234, zoom: 13 }, // Savegre
    '60603': { lat: 9.4789, lng: -84.0891, zoom: 13 }, // Naranjito

    // 607 Golfito
    '60701': { lat: 8.6345, lng: -83.1678, zoom: 14 }, // Golfito
    '60702': { lat: 8.5345, lng: -83.3012, zoom: 13 }, // Puerto Jiménez
    '60703': { lat: 8.6567, lng: -83.0891, zoom: 13 }, // Guaycará
    '60704': { lat: 8.5123, lng: -83.0678, zoom: 13 }, // Pavón

    // 608 Coto Brus
    '60801': { lat: 8.8234, lng: -82.9678, zoom: 14 }, // San Vito
    '60802': { lat: 8.8567, lng: -82.9234, zoom: 13 }, // Sabalito
    '60803': { lat: 8.7891, lng: -82.9456, zoom: 13 }, // Aguabuena
    '60804': { lat: 8.8789, lng: -83.0234, zoom: 13 }, // Limoncito
    '60805': { lat: 8.9456, lng: -82.9123, zoom: 12 }, // Pittier
    '60806': { lat: 8.9123, lng: -82.8567, zoom: 12 }, // Gutiérrez Braun

    // 609 Parrita
    '60901': { lat: 9.5234, lng: -84.3234, zoom: 13 }, // Parrita

    // 610 Corredores
    '61001': { lat: 8.6123, lng: -82.9456, zoom: 13 }, // Corredor
    '61002': { lat: 8.5678, lng: -82.8891, zoom: 13 }, // La Cuesta
    '61003': { lat: 8.5345, lng: -82.8456, zoom: 14 }, // Canoas
    '61004': { lat: 8.4891, lng: -82.8678, zoom: 13 }, // Laurel

    // 611 Garabito
    '61101': { lat: 9.6138, lng: -84.6297, zoom: 14 }, // Jacó
    '61102': { lat: 9.7789, lng: -84.6345, zoom: 13 }, // Tárcoles
    '61103': { lat: 9.5678, lng: -84.5891, zoom: 13 }, // Lagunillas

    // 612 Monteverde
    '61201': { lat: 10.3012, lng: -84.8234, zoom: 14 }, // Monteverde

    // --- LIMÓN (7) ---
    // 701 Limón
    '70101': { lat: 9.9912, lng: -83.0345, zoom: 14 }, // Limón
    '70102': { lat: 9.7891, lng: -83.0891, zoom: 12 }, // Valle La Estrella
    '70103': { lat: 9.9567, lng: -83.1234, zoom: 13 }, // Río Blanco
    '70104': { lat: 9.9123, lng: -83.1567, zoom: 13 }, // Matama

    // 702 Pococí
    '70201': { lat: 10.2123, lng: -83.7891, zoom: 14 }, // Guápiles
    '70202': { lat: 10.2345, lng: -83.7456, zoom: 13 }, // Jiménez
    '70203': { lat: 10.2678, lng: -83.7891, zoom: 13 }, // Rita
    '70204': { lat: 10.2891, lng: -83.7234, zoom: 13 }, // Roxana
    '70205': { lat: 10.3678, lng: -83.7123, zoom: 13 }, // Cariari
    '70206': { lat: 10.5891, lng: -83.6234, zoom: 12 }, // Colorado
    '70207': { lat: 10.2987, lng: -83.8234, zoom: 13 }, // La Colonia

    // 703 Siquirres
    '70301': { lat: 10.0987, lng: -83.5012, zoom: 14 }, // Siquirres
    '70302': { lat: 10.1234, lng: -83.4567, zoom: 13 }, // Pacuarito
    '70303': { lat: 10.0678, lng: -83.5678, zoom: 13 }, // Florida
    '70304': { lat: 10.1567, lng: -83.5345, zoom: 13 }, // Germania
    '70305': { lat: 10.1789, lng: -83.5123, zoom: 13 }, // Cairo
    '70306': { lat: 10.0456, lng: -83.5891, zoom: 13 }, // Alegría
    '70307': { lat: 10.0789, lng: -83.4789, zoom: 13 }, // Reventazón

    // 704 Talamanca
    '70401': { lat: 9.6123, lng: -82.8456, zoom: 14 }, // Bratsi (Bribri)
    '70402': { lat: 9.5678, lng: -82.6345, zoom: 14 }, // Sixaola
    '70403': { lat: 9.7345, lng: -82.8456, zoom: 14 }, // Cahuita
    '70404': { lat: 9.4567, lng: -83.0567, zoom: 11 }, // Telire

    // 705 Matina
    '70501': { lat: 10.0789, lng: -83.2891, zoom: 14 }, // Matina
    '70502': { lat: 10.0891, lng: -83.3345, zoom: 14 }, // Batán
    '70503': { lat: 10.1123, lng: -83.2567, zoom: 13 }, // Carrandí

    // 706 Guácimo
    '70601': { lat: 10.2123, lng: -83.6891, zoom: 14 }, // Guácimo
    '70602': { lat: 10.1789, lng: -83.6234, zoom: 13 }, // Mercedes
    '70603': { lat: 10.2345, lng: -83.6012, zoom: 13 }, // Pocora
    '70604': { lat: 10.2678, lng: -83.5678, zoom: 13 }, // Río Jiménez
    '70605': { lat: 10.3123, lng: -83.5891, zoom: 13 }  // Duacarí
};

/**
 * Obtiene coordenadas del centro de un distrito por código catastral
 */
interface Centro {
	lat: number;
	lng: number;
	zoom: number;
}

export function obtenerCentroDistrito(codigoCatastral: string): Centro {
	return CENTROS_DISTRITOS[codigoCatastral] || {
		lat: 9.9281, // Centro de Costa Rica (fallback)
		lng: -84.0907,
		zoom: 10
	};
}