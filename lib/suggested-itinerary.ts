/**
 * Roteiro sugerido pela comunidade: monta um roteiro dia a dia só com o que os viajantes
 * avaliaram, recomendaram, salvaram e votaram. Função pura (sem banco), testada em
 * tests/suggested-itinerary.test.ts. Nada é inventado: sem dados suficientes, devolve null.
 */
import type { PlaceType } from "@/types/database";

export type Candidate = {
  key: string;
  name: string;
  source: "place" | "achado" | "tip";
  /** Tipo do lugar (place) ou da dica/achadinho, para decidir em que período do dia entra. */
  kind: PlaceType | "food" | "cafe" | "breakfast" | "sight";
  placeSlug?: string;
  achadoId?: string;
  ratingAvg?: number;
  reviewsCount?: number;
  recommendVotes?: number;
  favoriteVotes?: number;
  avoidVotes?: number;
  tipVotes?: number;
  saves?: number;
  itineraryUses?: number;
};

export type SuggestedStop = {
  key: string;
  period: Period;
  name: string;
  source: Candidate["source"];
  placeSlug?: string;
  achadoId?: string;
  reasons: string[];
};
export type SuggestedDay = { day: number; stops: SuggestedStop[] };
export type Period = "cafe" | "manha" | "almoco" | "tarde" | "noite";

export const PERIOD_LABELS: Record<Period, string> = {
  cafe: "Café da manhã",
  manha: "Manhã",
  almoco: "Almoço",
  tarde: "Tarde",
  noite: "Fim de tarde e jantar",
};

const MEAL = new Set<Candidate["kind"]>(["restaurant", "food"]);
const DAYTIME = new Set<Candidate["kind"]>(["beach", "attraction", "tour", "sight", "other"]);

/** Média com "prior": poucas avaliações puxam para 3,5 (uma nota 5 sozinha não vence 20 notas 4,6). */
export function weightedRating(avg: number, count: number, prior = 3.5, weight = 3) {
  return count ? (avg * count + prior * weight) / (count + weight) : 0;
}

export function score(c: Candidate): number {
  const rating = c.reviewsCount
    ? weightedRating(c.ratingAvg ?? 0, c.reviewsCount) * Math.log2(1 + c.reviewsCount)
    : 0;
  return (
    rating +
    1.2 * (c.recommendVotes ?? 0) +
    0.8 * (c.favoriteVotes ?? 0) -
    1.5 * (c.avoidVotes ?? 0) +
    0.6 * (c.tipVotes ?? 0) +
    0.5 * (c.saves ?? 0) +
    0.5 * (c.itineraryUses ?? 0)
  );
}

/** Lugar que mais gente "não voltaria" do que recomenda fica de fora. */
export function isRejected(c: Candidate) {
  const avoid = c.avoidVotes ?? 0;
  return avoid >= 2 && avoid > (c.recommendVotes ?? 0) + (c.favoriteVotes ?? 0);
}

export function reasonsFor(c: Candidate): string[] {
  const out: string[] = [];
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (c.reviewsCount)
    out.push(
      `${(c.ratingAvg ?? 0).toFixed(1).replace(".", ",")} ★ em ${plural(c.reviewsCount, "avaliação", "avaliações")}`,
    );
  // Frases neutras: servem para praia, mirante, restaurante ou achadinho.
  if (c.recommendVotes)
    out.push(
      c.recommendVotes === 1 ? "1 viajante recomenda" : `${c.recommendVotes} viajantes recomendam`,
    );
  if (c.favoriteVotes)
    out.push(
      c.favoriteVotes === 1
        ? "a preferida de 1 viajante"
        : `a preferida de ${c.favoriteVotes} viajantes`,
    );
  if (c.tipVotes) out.push(`dica útil para ${plural(c.tipVotes, "pessoa", "pessoas")}`);
  if (c.saves) out.push(`salvo por ${plural(c.saves, "pessoa", "pessoas")}`);
  if (c.itineraryUses)
    out.push(`está em ${plural(c.itineraryUses, "roteiro", "roteiros")} da comunidade`);
  return out;
}

/** Mínimo de paradas com algum sinal da comunidade para valer a pena sugerir. */
export const MIN_STOPS = 3;

export function buildSuggestedItinerary(
  candidates: Candidate[],
  days: number,
): SuggestedDay[] | null {
  const ranked = candidates
    .filter((c) => !isRejected(c) && score(c) > 0)
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  if (ranked.length < MIN_STOPS) return null;

  const used = new Set<string>();
  const take = (accept: (c: Candidate) => boolean) => {
    const found = ranked.find((c) => !used.has(c.key) && accept(c));
    if (found) used.add(found.key);
    return found;
  };
  const toStop = (c: Candidate, period: Period): SuggestedStop => ({
    key: c.key,
    period,
    name: c.name,
    source: c.source,
    placeSlug: c.placeSlug,
    achadoId: c.achadoId,
    reasons: reasonsFor(c),
  });

  const plan: SuggestedDay[] = [];
  for (let day = 1; day <= days; day++) {
    const stops: SuggestedStop[] = [];
    const add = (period: Period, accept: (c: Candidate) => boolean) => {
      const c = take(accept);
      if (c) stops.push(toStop(c, period));
    };
    add("cafe", (c) => c.kind === "breakfast" || c.kind === "cafe");
    add("manha", (c) => DAYTIME.has(c.kind));
    add("almoco", (c) => MEAL.has(c.kind));
    add("tarde", (c) => DAYTIME.has(c.kind));
    add("noite", (c) => MEAL.has(c.kind) || c.kind === "cafe");
    if (stops.length) plan.push({ day: plan.length + 1, stops });
  }
  const total = plan.reduce((n, d) => n + d.stops.length, 0);
  return total >= MIN_STOPS ? plan : null;
}
