import { describe, expect, it } from "vitest";
import { getReadyItinerary } from "@/lib/ready-itineraries";
import {
  buildTrip,
  dedupeAttractions,
  findRepeats,
  readProfile,
  type AttractionPick,
} from "@/lib/trip-builder";

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
  const jeri = getReadyItinerary("jericoacoara-4-dias")!;

  it("encurta o roteiro pronto escolhendo os dias que combinam", () => {
    const trip = buildTrip({ days: 2, profile: readProfile("Amo praia e pôr do sol"), ready: rio });
    expect(trip.days).toHaveLength(2);
    expect(trip.source).toBe("pronto");
    expect(trip.days.map((d) => d.title)).toContain("Zona Sul na praia");
    // O que ficou de fora do roteiro aparece em "Você ainda pode conhecer".
    expect(trip.moreToSee.length).toBeGreaterThan(0);
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

  it("usa lugares da comunidade e não inventa dias para completar", () => {
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
    expect(trip.plannedDays).toBe(1);
    expect(trip.days.slice(1).every((d) => d.kind === "livre")).toBe(true);
    expect(trip.reasons.join(" ")).toMatch(/Para não repetir programas nem inventar atividades/);
  });

  it("monta dias variados com atrações próximas, sem repetir", () => {
    const attractions: AttractionPick[] = [
      { name: "Castelo de São Jorge", kind: "historia", lat: 38.7139, lng: -9.1335 },
      { name: "Miradouro da Senhora do Monte", kind: "mirante", lat: 38.7193, lng: -9.1327 },
      { name: "Museu Nacional do Azulejo", kind: "museu", lat: 38.7247, lng: -9.1136 },
      { name: "Praça do Comércio", kind: "praca", lat: 38.7076, lng: -9.1365 },
      { name: "Mosteiro dos Jerónimos", kind: "historia", lat: 38.6979, lng: -9.2068 },
      { name: "Jardim da Estrela", kind: "parque", lat: 38.7139, lng: -9.1597 },
    ];
    const trip = buildTrip({
      days: 3,
      profile: readProfile("Gosto de história e de tirar fotos"),
      attractions,
      destinationName: "Lisboa",
    });
    expect(trip.source).toBe("atracoes");
    expect(findRepeats(trip.days)).toEqual([]);
    const titles = trip.days.flatMap((d) => d.stops.map((s) => s.title));
    expect(titles).toContain("Castelo de São Jorge");
    // Cada dia mistura tipos diferentes de lugar.
    for (const day of trip.days.filter((d) => d.kind === "planejado")) {
      expect(new Set(day.stops.map((s) => s.title)).size).toBe(day.stops.length);
    }
  });

  it("8 dias em Jericoacoara: nada repetido, opcional e dias livres conscientes", () => {
    const trip = buildTrip({
      days: 8,
      profile: readProfile(""),
      ready: jeri,
      attractions: [
        { name: "Praia de Jericoacoara", kind: "praia" },
        { name: "Jericoacoara Beach", kind: "praia" },
        { name: "Lagoa do Paraíso", kind: "parque" },
        { name: "Parque Nacional de Jericoacoara", kind: "parque" },
      ],
      styles: ["praia", "aventura"],
      destinationName: "Jericoacoara",
      nearby: [
        { name: "Camocim", km: 60 },
        { name: "Sobral", km: 150 },
      ],
    });
    expect(trip.days).toHaveLength(8);
    expect(findRepeats(trip.days)).toEqual([]);
    const titles = trip.days.flatMap((d) => d.stops.map((s) => s.title));
    // "Lagoa do Paraíso" já está no dia "Lagoa do Paraíso e Lagoa Azul": não volta sozinha.
    expect(titles.filter((t) => /Para[ií]so/.test(t))).toHaveLength(1);
    const optional = trip.days.find((d) => d.kind === "opcional");
    expect(optional?.options?.join(" ")).toMatch(/Bate-volta a Camocim/);
    const free = trip.days.filter((d) => d.kind === "livre");
    expect(free.length).toBeGreaterThan(0);
    expect(free.every((d) => (d.options?.length ?? 0) >= 4)).toBe(true);
    expect(trip.days.map((d) => d.title).join(" ")).not.toMatch(/Passeio a pé por|Bairros de/);
  });

  it("sem nenhum dado não inventa nada: só dias livres explicados", () => {
    const trip = buildTrip({ days: 2, profile: readProfile(""), destinationName: "Agra" });
    expect(trip.days.every((d) => d.kind === "livre" && d.stops.length === 0)).toBe(true);
    expect(trip.plannedDays).toBe(0);
  });

  it("não repete o mesmo lugar escrito em dois idiomas", () => {
    const list = dedupeAttractions([
      { name: "Praia de Jericoacoara", kind: "praia" },
      { name: "Jericoacoara Beach", kind: "praia" },
      { name: "Parque Nacional de Jericoacoara", kind: "parque" },
      { name: "Jericoacoara National Park", kind: "parque" },
    ]);
    expect(list.map((x) => x.name)).toEqual([
      "Praia de Jericoacoara",
      "Parque Nacional de Jericoacoara",
    ]);
  });
});
