import { describe, expect, it } from "vitest";
import { getReadyItinerary } from "@/lib/ready-itineraries";
import { buildTrip, readProfile } from "@/lib/trip-builder";

describe("readProfile", () => {
  it("entende família, gostos, o que não gosta e ritmo", () => {
    const p = readProfile(
      "Vou com minha esposa e nosso filho de 6 anos. Gostamos de praia e de comer bem, mas não curtimos balada. Preferimos um ritmo tranquilo e queremos economizar.",
    );
    expect(p).toMatchObject({ kids: true, couple: true, budget: true, pace: "leve" });
    expect(p.likes).toEqual(expect.arrayContaining(["praia", "gastronomia"]));
    expect(p.dislikes).toContain("noite");
    expect(p.likes).not.toContain("noite");
  });

  it("usa as preferências marcadas e o ritmo intenso", () => {
    const p = readProfile("Quero aproveitar tudo!", ["historia", "economico"]);
    expect(p).toMatchObject({ pace: "intenso", budget: true });
    expect(p.likes).toContain("historia");
  });

  it("detecta mobilidade reduzida e texto vazio", () => {
    expect(readProfile("Minha mãe usa cadeira de rodas").limitedMobility).toBe(true);
    expect(readProfile(null)).toMatchObject({ pace: "normal", likes: [], dislikes: [] });
  });
});

describe("buildTrip", () => {
  const rio = getReadyItinerary("rio-de-janeiro-5-dias")!;

  it("encurta o roteiro pronto escolhendo os dias que combinam", () => {
    const trip = buildTrip({ days: 2, profile: readProfile("Amo praia e pôr do sol"), ready: rio });
    expect(trip.days).toHaveLength(2);
    expect(trip.source).toBe("pronto");
    expect(trip.days.map((d) => d.title)).toContain("Zona Sul na praia");
  });

  it("limita as paradas pelo ritmo e tira trilhas com mobilidade reduzida", () => {
    const trip = buildTrip({
      days: 5,
      profile: readProfile("Viajo com meu pai, que tem dificuldade de andar"),
      ready: rio,
    });
    expect(trip.days.every((d) => d.stops.length <= 2)).toBe(true);
    const all = trip.days.flatMap((d) => d.stops.map((s) => s.title)).join(" ");
    expect(all).not.toMatch(/Trilha/);
    expect(trip.tips.join(" ")).toMatch(/acessibilidade/);
  });

  it("completa dias a mais com lugares e com o estilo do destino", () => {
    const trip = buildTrip({
      days: 4,
      profile: readProfile(""),
      places: [
        { name: "Praia das Conchas", type: "beach" },
        { name: "Mirante Histórico", type: "attraction" },
        { name: "Casa do Coco", type: "restaurant" },
      ],
      styles: ["praia", "historico"],
    });
    expect(trip.days).toHaveLength(4);
    expect(trip.source).toBe("lugares");
    expect(trip.days.flatMap((d) => d.stops.map((s) => s.title))).toContain("Casa do Coco");
    expect(trip.days.map((d) => d.title)).toContain("Dia de praia sem pressa");
  });

  it("nunca devolve dia vazio", () => {
    const trip = buildTrip({ days: 3, profile: readProfile("não gosto de nada de praia") });
    expect(trip.days).toHaveLength(3);
    expect(trip.days.every((d) => d.stops.length > 0)).toBe(true);
  });
});
