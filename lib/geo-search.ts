/**
 * Busca de países e cidades para o globo da home. Funções puras (sem disco),
 * testadas em tests/geo-search.test.ts. Os dados vêm de data/geo/places.json
 * (GeoNames, CC BY 4.0), carregados por lib/geo.server.ts.
 */

/** [iso2, nome em português, nome em inglês, latitude, longitude] */
export type CountryRow = [string, string, string, number, number];
/** [nome, estado/província, iso2 do país, latitude, longitude, população, nomes alternativos "a|b|c"] */
export type CityRow = [string, string, string, number, number, number, string];

export type PlacesData = { countries: CountryRow[]; cities: CityRow[] };

export type PlaceResult = {
  kind: "country" | "city";
  name: string;
  /** "Bahia, Brasil" para cidades; "País" para países. */
  detail: string;
  country: string;
  latitude: number;
  longitude: number;
};

type Entry = { result: PlaceResult; primary: string; alternates: string[]; population: number };
export type PlacesIndex = { entries: Entry[] };

/** Minúsculas, sem acentos e sem pontuação: "São Paulo" → "sao paulo". */
export function normalizePlace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildPlacesIndex(data: PlacesData): PlacesIndex {
  const countryName = new Map(data.countries.map(([iso, pt]) => [iso, pt]));
  const entries: Entry[] = [];

  for (const [iso, pt, en, latitude, longitude] of data.countries) {
    entries.push({
      result: { kind: "country", name: pt, detail: "País", country: pt, latitude, longitude },
      primary: normalizePlace(pt),
      alternates: [normalizePlace(en), iso.toLowerCase()],
      // Países aparecem antes de cidades com o mesmo nome.
      population: Number.MAX_SAFE_INTEGER,
    });
  }

  for (const [name, state, iso, latitude, longitude, population, alternates] of data.cities) {
    const country = countryName.get(iso) ?? iso;
    entries.push({
      result: {
        kind: "city",
        name,
        detail: state ? `${state}, ${country}` : country,
        country,
        latitude,
        longitude,
      },
      primary: normalizePlace(name),
      alternates: alternates ? alternates.split("|") : [],
      population,
    });
  }
  return { entries };
}

/**
 * Quanto menor, melhor: nome exato (principal ou alternativo) > começa com > palavra começa com > contém.
 * Dentro do mesmo nível, vence a mais populosa: "Roma" traz Roma, Itália, antes de Roma, Lesoto.
 */
function matchRank(entry: Entry, q: string): number | null {
  if (entry.primary === q || entry.alternates.includes(q)) return 1;
  if (entry.primary.startsWith(q)) return 2;
  if (entry.alternates.some((a) => a.startsWith(q))) return 3;
  if (entry.primary.includes(` ${q}`)) return 4;
  if (q.length >= 4 && entry.alternates.some((a) => a.includes(q))) return 5;
  return null;
}

export function searchPlaces(index: PlacesIndex, query: string, limit = 8): PlaceResult[] {
  const q = normalizePlace(query);
  if (q.length < 2) return [];
  const hits: { entry: Entry; rank: number }[] = [];
  for (const entry of index.entries) {
    const rank = matchRank(entry, q);
    if (rank !== null) hits.push({ entry, rank });
  }
  hits.sort((a, b) => a.rank - b.rank || b.entry.population - a.entry.population);

  // Evita repetir o mesmo nome no mesmo estado (bairros e distritos homônimos).
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const { entry } of hits) {
    const key = `${entry.result.kind}|${entry.result.name}|${entry.result.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry.result);
    if (out.length === limit) break;
  }
  return out;
}

/** Distância em km entre duas coordenadas (fórmula de haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Cidade mais próxima de uma coordenada (para dar nome ao local de um achadinho). */
export function nearestCity(
  index: PlacesIndex,
  latitude: number,
  longitude: number,
): PlaceResult | null {
  let best: PlaceResult | null = null;
  let bestKm = Infinity;
  for (const { result } of index.entries) {
    if (result.kind !== "city") continue;
    // Corte barato antes da conta completa: 1° de latitude ≈ 111 km.
    if (Math.abs(result.latitude - latitude) > 1.5) continue;
    const km = distanceKm(latitude, longitude, result.latitude, result.longitude);
    if (km < bestKm) {
      bestKm = km;
      best = result;
    }
  }
  return bestKm <= 60 ? best : null;
}
