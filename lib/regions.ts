/**
 * Regiões do mundo para filtrar destinos. O Brasil fica separado do resto da América do Sul
 * porque é onde está a maior parte do público. País sem mapeamento só aparece em "Mundo todo".
 */
import { normalizePlace } from "@/lib/geo-search";

export type WorldRegion =
  | "brasil"
  | "america-do-sul"
  | "america-do-norte"
  | "europa"
  | "africa-oriente-medio"
  | "asia"
  | "oceania";

export const worldRegions: { value: WorldRegion; label: string }[] = [
  { value: "brasil", label: "Brasil" },
  { value: "america-do-sul", label: "América do Sul" },
  { value: "america-do-norte", label: "América do Norte, Central e Caribe" },
  { value: "europa", label: "Europa" },
  { value: "africa-oriente-medio", label: "África e Oriente Médio" },
  { value: "asia", label: "Ásia" },
  { value: "oceania", label: "Oceania" },
];

const BY_COUNTRY: Record<string, WorldRegion> = {
  brasil: "brasil",
  argentina: "america-do-sul",
  chile: "america-do-sul",
  peru: "america-do-sul",
  colombia: "america-do-sul",
  uruguai: "america-do-sul",
  paraguai: "america-do-sul",
  bolivia: "america-do-sul",
  equador: "america-do-sul",
  venezuela: "america-do-sul",
  "estados unidos": "america-do-norte",
  canada: "america-do-norte",
  mexico: "america-do-norte",
  cuba: "america-do-norte",
  "republica dominicana": "america-do-norte",
  "costa rica": "america-do-norte",
  panama: "america-do-norte",
  jamaica: "america-do-norte",
  aruba: "america-do-norte",
  portugal: "europa",
  espanha: "europa",
  franca: "europa",
  italia: "europa",
  "reino unido": "europa",
  "paises baixos": "europa",
  alemanha: "europa",
  tchequia: "europa",
  suica: "europa",
  austria: "europa",
  grecia: "europa",
  croacia: "europa",
  islandia: "europa",
  finlandia: "europa",
  noruega: "europa",
  irlanda: "europa",
  turquia: "europa",
  egito: "africa-oriente-medio",
  marrocos: "africa-oriente-medio",
  "africa do sul": "africa-oriente-medio",
  tanzania: "africa-oriente-medio",
  quenia: "africa-oriente-medio",
  "emirados arabes unidos": "africa-oriente-medio",
  jordania: "africa-oriente-medio",
  israel: "africa-oriente-medio",
  japao: "asia",
  tailandia: "asia",
  indonesia: "asia",
  singapura: "asia",
  "coreia do sul": "asia",
  vietna: "asia",
  india: "asia",
  china: "asia",
  maldivas: "asia",
  australia: "oceania",
  "nova zelandia": "oceania",
  "polinesia francesa": "oceania",
  fiji: "oceania",
};

export function regionOf(country: string | null | undefined): WorldRegion | null {
  return country ? (BY_COUNTRY[normalizePlace(country)] ?? null) : null;
}

export function isBrazil(country: string | null | undefined) {
  return regionOf(country) === "brasil";
}
