import { describe, expect, it } from "vitest";
import {
  buildSuggestedItinerary,
  isRejected,
  score,
  weightedRating,
  type Candidate,
} from "@/lib/suggested-itinerary";

const place = (
  key: string,
  kind: Candidate["kind"],
  extra: Partial<Candidate> = {},
): Candidate => ({
  key,
  name: key,
  source: "place",
  kind,
  placeSlug: key,
  ...extra,
});

describe("roteiro sugerido pela comunidade", () => {
  it("uma nota 5 sozinha não vence muitas notas 4,6", () => {
    expect(weightedRating(5, 1)).toBeLessThan(weightedRating(4.6, 20));
    expect(score(place("a", "beach", { ratingAvg: 5, reviewsCount: 1 }))).toBeLessThan(
      score(place("b", "beach", { ratingAvg: 4.6, reviewsCount: 20 })),
    );
  });

  it("praia que mais gente não voltaria do que recomenda fica de fora", () => {
    expect(isRejected(place("ruim", "beach", { avoidVotes: 3, recommendVotes: 1 }))).toBe(true);
    expect(isRejected(place("ok", "beach", { avoidVotes: 1, recommendVotes: 0 }))).toBe(false);
  });

  it("sem dados suficientes não sugere nada (nada é inventado)", () => {
    expect(buildSuggestedItinerary([place("a", "beach", { recommendVotes: 1 })], 3)).toBeNull();
    expect(
      buildSuggestedItinerary(
        [place("a", "beach"), place("b", "restaurant"), place("c", "tour")],
        2,
      ),
    ).toBeNull();
  });

  it("monta dias com períodos: café, manhã, almoço, tarde, jantar, sem repetir lugares", () => {
    const candidates: Candidate[] = [
      { key: "t1", name: "Padaria Central", source: "tip", kind: "breakfast", tipVotes: 4 },
      place("praia-1", "beach", { ratingAvg: 4.8, reviewsCount: 10 }),
      place("praia-2", "beach", { recommendVotes: 3 }),
      place("mirante", "attraction", { ratingAvg: 4.5, reviewsCount: 6 }),
      place("rest-1", "restaurant", { ratingAvg: 4.7, reviewsCount: 8 }),
      place("rest-2", "restaurant", { ratingAvg: 4.2, reviewsCount: 3 }),
      place("rest-3", "restaurant", { ratingAvg: 4.0, reviewsCount: 2 }),
    ];
    const plan = buildSuggestedItinerary(candidates, 2)!;
    expect(plan).toHaveLength(2);
    const [day1] = plan;
    expect(day1.stops.map((s) => s.period)).toEqual(["cafe", "manha", "almoco", "tarde", "noite"]);
    expect(day1.stops[0].name).toBe("Padaria Central");
    expect(day1.stops[1].key).toBe("praia-1"); // a mais bem avaliada vem primeiro
    expect(day1.stops[2].key).toBe("rest-1");
    const keys = plan.flatMap((d) => d.stops.map((s) => s.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("cada parada explica por que está no roteiro", () => {
    const plan = buildSuggestedItinerary(
      [
        place("praia", "beach", { ratingAvg: 4.6, reviewsCount: 12, recommendVotes: 5 }),
        place("rest", "restaurant", { ratingAvg: 4.4, reviewsCount: 3 }),
        place("passeio", "tour", { itineraryUses: 2 }),
      ],
      1,
    )!;
    const praia = plan[0].stops.find((s) => s.key === "praia")!;
    expect(praia.reasons).toEqual(["4,6 ★ em 12 avaliações", "5 viajantes recomendam"]);
  });
});
