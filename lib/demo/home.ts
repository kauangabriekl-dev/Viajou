/**
 * DADOS DE DEMONSTRAÇÃO — somente quando o Supabase não está configurado
 * e NEXT_PUBLIC_SHOW_DEMO_DATA=true. Mesmo formato dos dados reais.
 * Usuários, relatos e roteiros são fictícios e nunca são exibidos como reais:
 * toda seção que os usa mostra o selo "DADOS DE DEMONSTRAÇÃO".
 */
import type { DestinationWithStats, Itinerary, Post, ProfileSummary } from "@/types/database";

const author = (n: number, full_name: string, username: string): ProfileSummary => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  full_name,
  username,
  avatar_url: null,
});
const a1 = author(1, "Viajante Demo", "viajante_demo");
const a2 = author(2, "Usuária Teste", "usuaria_teste");
const a3 = author(3, "Perfil Exemplo", "perfil_exemplo");

const dest = (
  n: number,
  slug: string,
  name: string,
  state: string,
  latitude: number,
  longitude: number,
  description: string,
): DestinationWithStats => ({
  id: `10000000-0000-4000-8000-00000000000${n}`,
  slug,
  name,
  city: name,
  state,
  country: "Brasil",
  description,
  latitude,
  longitude,
  cover_url: null,
  is_demo: true,
  reviews_count: 0,
  rating_avg: 0,
});

export const demoDestinations: DestinationWithStats[] = [
  dest(
    1,
    "porto-seguro-ba",
    "Porto Seguro",
    "BA",
    -16.45,
    -39.06,
    "Praias, falésias e centro histórico",
  ),
  dest(2, "florianopolis-sc", "Florianópolis", "SC", -27.59, -48.55, "Ilha com mais de 40 praias"),
  dest(
    3,
    "rio-de-janeiro-rj",
    "Rio de Janeiro",
    "RJ",
    -22.91,
    -43.17,
    "Mar, morros e vida urbana na cidade",
  ),
  dest(4, "gramado-rs", "Gramado", "RS", -29.38, -50.87, "Serra gaúcha e clima de montanha"),
  dest(5, "fortaleza-ce", "Fortaleza", "CE", -3.73, -38.52, "Sol o ano inteiro e dunas por perto"),
];

const post = (
  n: number,
  a: ProfileSummary,
  d: DestinationWithStats,
  body: string,
  start: string,
  end: string,
  spent: number | null,
  rating: number | null,
  tags: string[],
): Post => ({
  id: `20000000-0000-4000-8000-00000000000${n}`,
  user_id: a.id,
  body,
  trip_start: start,
  trip_end: end,
  spent_cents: spent,
  rating,
  tags,
  created_at: "2026-09-20T12:00:00Z",
  author: a,
  destination: { slug: d.slug, name: d.name, state: d.state },
  hotel: null,
  photos: [],
  likes: [{ count: 0 }],
  comments: [{ count: 0 }],
});

export const demoPosts: Post[] = [
  post(
    1,
    a1,
    demoDestinations[0],
    "Texto de exemplo: sete dias alternando praia pela manhã e centro histórico no fim da tarde. Aqui entrará o relato real de um usuário.",
    "2026-07-01",
    "2026-07-07",
    320000,
    4,
    ["praia"],
  ),
  post(
    2,
    a2,
    demoDestinations[3],
    "Texto de exemplo: fim de semana na serra em casal. Este card mostra como uma publicação aparecerá no feed.",
    "2026-06-12",
    "2026-06-14",
    180000,
    5,
    ["casal", "natureza"],
  ),
  post(
    3,
    a3,
    demoDestinations[2],
    "Texto de exemplo: roteiro a pé pela orla e bairros centrais da cidade. Conteúdo fictício para validar o layout.",
    "2026-05-02",
    "2026-05-05",
    null,
    null,
    ["historia"],
  ),
];

const itin = (
  n: number,
  a: ProfileSummary,
  d: DestinationWithStats,
  title: string,
  description: string,
  days: number,
): Itinerary => ({
  id: `30000000-0000-4000-8000-00000000000${n}`,
  user_id: a.id,
  title,
  description,
  days_count: days,
  tags: [],
  is_public: true,
  copied_from: null,
  created_at: "2026-09-20T12:00:00Z",
  author: a,
  destination: { slug: d.slug, name: d.name, state: d.state },
  likes: [{ count: 0 }],
});

export const demoItineraries: Itinerary[] = [
  itin(
    1,
    a1,
    demoDestinations[0],
    "Porto Seguro em 7 dias",
    "Roteiro econômico para casal (exemplo).",
    7,
  ),
  itin(
    2,
    a2,
    demoDestinations[1],
    "Florianópolis num fim de semana",
    "Norte da ilha com pouco deslocamento (exemplo).",
    2,
  ),
  itin(
    3,
    a3,
    demoDestinations[4],
    "Fortaleza com crianças",
    "Cinco dias com praias calmas e passeios curtos (exemplo).",
    5,
  ),
];
