// Coordenadas aproximadas de cidades/vilas portuguesas, para colocar eventos
// no mapa quando não têm latitude/longitude próprias.
// Chaves em minúsculas e sem acentos. Inclui variantes EN (ex: "lisbon").

type LatLon = [number, number];

export const CITY_COORDS: Record<string, LatLon> = {
  lisboa: [38.7223, -9.1393],
  lisbon: [38.7223, -9.1393],
  porto: [41.1579, -8.6291],
  oporto: [41.1579, -8.6291],
  braga: [41.5454, -8.4265],
  coimbra: [40.2033, -8.4103],
  faro: [37.0194, -7.9304],
  aveiro: [40.6405, -8.6538],
  setubal: [38.5244, -8.8882],
  funchal: [32.6669, -16.9241],
  cascais: [38.6979, -9.4215],
  guimaraes: [41.4425, -8.2918],
  evora: [38.5713, -7.9135],
  leiria: [39.7436, -8.8071],
  viseu: [40.6566, -7.9122],
  'viana do castelo': [41.6918, -8.8345],
  'torres vedras': [39.0911, -9.2588],
  arganil: [40.2167, -8.05],
  lagos: [37.1028, -8.6742],
  albufeira: [37.0891, -8.2503],
  portimao: [37.1366, -8.5378],
  sintra: [38.8029, -9.3817],
  loule: [37.1378, -8.0204],
  almada: [38.679, -9.1569],
  'ponta delgada': [37.7394, -25.6687],
  'caldas da rainha': [39.4035, -9.1359],
  santarem: [39.2362, -8.6859],
  tomar: [39.6043, -8.4148],
  'figueira da foz': [40.1506, -8.8617],
  'vila nova de gaia': [41.1239, -8.6118],
  gaia: [41.1239, -8.6118],
  matosinhos: [41.1844, -8.6918],
  beja: [38.015, -7.8632],
  'castelo branco': [39.8222, -7.491],
  braganca: [41.8058, -6.7567],
  'vila real': [41.3006, -7.7441],
  chaves: [41.7404, -7.4711],
  barreiro: [38.6634, -9.0726],
  oeiras: [38.6969, -9.3107],
  amadora: [38.7597, -9.2399],
  loures: [38.8309, -9.1685],
  odivelas: [38.7929, -9.1836],
  seixal: [38.6404, -9.1015],
  montijo: [38.7064, -8.9738],
  palmela: [38.5681, -8.9009],
  ericeira: [38.9634, -9.4158],
  nazare: [39.6019, -9.0703],
  peniche: [39.3558, -9.3811],
  tavira: [37.1273, -7.6486],
  lagoa: [37.1357, -8.4534],
  silves: [37.1894, -8.4385],
  espinho: [41.0072, -8.6411],
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Devolve coordenadas para uma cidade. Tenta correspondência exata e, se não,
 * vê se alguma cidade conhecida aparece dentro do texto (ex:
 * "Zona de Lazer ..., Arganil" → Arganil).
 */
export function coordsForCity(city?: string | null): LatLon | null {
  if (!city) return null;
  const n = normalize(city);
  if (CITY_COORDS[n]) return CITY_COORDS[n];
  // procura por inclusão, das chaves mais longas para as mais curtas
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (n.includes(k)) return CITY_COORDS[k];
  }
  return null;
}
