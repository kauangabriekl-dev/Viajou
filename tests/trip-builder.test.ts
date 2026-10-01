import { describe, expect, it } from "vitest";
import { dayTripsFor } from "@/lib/day-trips";
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

describe("buildTrip (roteiro modular)", () => {
  const rio = getReadyItinerary("rio-de-janeiro-5-dias")!;
  const paraty = getReadyItinerary("paraty-4-dias")!;
  const jeri = getReadyItinerary("jericoacoara-4-dias")!;

  it("encurta o roteiro pronto e manda o resto para as sugestões", () => {
    const trip = buildTrip({ days: 2, profile: readProfile("Amo praia e pôr do sol"), ready: rio });
    expect(trip.days).toHaveLength(2);
    expect(trip.days.map((d) => d.title)).toContain("Zona Sul na praia");
    expect(trip.remaining.days).toBe(0);
    expect(trip.forYou.length + trip.extras.length).toBeGreaterThan(0);
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

  it("8 dias em Paraty: não estica o roteiro, um dia livre no máximo e bate-voltas curados", () => {
    const trip = buildTrip({
      days: 8,
      profile: readProfile(""),
      ready: paraty,
      styles: ["historico", "praia", "cachoeira"],
      destinationName: "Paraty",
      dayTrips: dayTripsFor("paraty-rj"),
      attractions: [
        {
          name: "Paraty Bay, Paraty-Mirim and Saco do Mamanguá Environmental Protection Area",
          kind: "praia",
        },
      ],
    });
    // Só os dias com experiências reais: o roteiro pronto tem 4.
    expect(trip.days).toHaveLength(4);
    expect(trip.remaining.days).toBe(4);
    // Cunha já aparece no roteiro (estrada Paraty–Cunha), então não vira bate-volta.
    expect(trip.remaining.dayTrips.map((t) => t.name)).toEqual(["Saco do Mamanguá"]);
    // Dois dias sem bate-volta: o dia livre aparece uma única vez, como bloco.
    expect(trip.remaining.freeDay).not.toBeNull();
    expect(findRepeats(trip.days)).toEqual([]);
    // O que já é bate-volta não volta nas outras experiências.
    expect([...trip.forYou, ...trip.extras].some((x) => /Mamangu/.test(x.title))).toBe(false);
    expect(trip.reasons[0]).toMatch(/Não completamos os outros 4/);
  });

  it("sem dia sobrando, não há dia livre nem bate-volta", () => {
    const trip = buildTrip({
      days: 4,
      profile: readProfile(""),
      ready: paraty,
      dayTrips: dayTripsFor("paraty-rj"),
    });
    expect(trip.remaining).toEqual({ days: 0, dayTrips: [], freeDay: null });
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
    expect(trip.days.flatMap((d) => d.stops.map((s) => s.title))).toContain("Castelo de São Jorge");
  });

  it("Jericoacoara: o mesmo lugar não volta com outro nome ou idioma", () => {
    const trip = buildTrip({
      days: 8,
      profile: readProfile(""),
      ready: jeri,
      attractions: [
        { name: "Praia de Jericoacoara", kind: "praia" },
        { name: "Jericoacoara Beach", kind: "praia" },
        { name: "Lagoa do Paraíso", kind: "parque" },
      ],
      destinationName: "Jericoacoara",
    });
    expect(findRepeats(trip.days)).toEqual([]);
    const everything = [
      ...trip.days.flatMap((d) => d.stops.map((s) => s.title)),
      ...trip.forYou.map((s) => s.title),
      ...trip.extras.map((s) => s.title),
    ];
    // "Lagoa do Paraíso" já está no dia "Lagoa do Paraíso e Lagoa Azul".
    expect(everything.filter((t) => /Para[ií]so/.test(t))).toHaveLength(1);
    expect(
      everything.filter((t) => /Jericoacoara (Beach|$)|^Praia de Jericoacoara/.test(t)).length,
    ).toBeLessThanOrEqual(1);
  });

  it("sem nenhum dado não inventa nada", () => {
    const trip = buildTrip({ days: 3, profile: readProfile(""), destinationName: "Agra" });
    expect(trip.days).toHaveLength(0);
    expect(trip.remaining.days).toBe(3);
    expect(trip.remaining.freeDay).not.toBeNull();
    expect(trip.reasons[0]).toMatch(/Em vez de inventar um roteiro/);
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

  it("reconhece o mesmo lugar com nome mais longo (Santa Rita x Santa Rita de Cássia)", () => {
    const paratyReady = getReadyItinerary("paraty-4-dias")!;
    const trip = buildTrip({
      days: 6,
      profile: readProfile(""),
      ready: paratyReady,
      attractions: [
        { name: "Igreja de Santa Rita de Cássia", kind: "historia", lat: -23.219, lng: -44.713 },
        { name: "Forte Defensor Perpétuo", kind: "historia", lat: -23.212, lng: -44.71 },
      ],
      destinationName: "Paraty",
    });
    const all = [
      ...trip.days.flatMap((d) => d.stops.map((s) => s.title)),
      ...trip.forYou.map((x) => x.title),
      ...trip.extras.map((x) => x.title),
    ];
    expect(all.filter((t) => /Santa Rita/.test(t))).toHaveLength(1);
  });

  it("atração sozinha não vira um dia inteiro", () => {
    const trip = buildTrip({
      days: 3,
      profile: readProfile(""),
      attractions: [
        { name: "Arco do Cego", kind: "historia", lat: 38.735, lng: -9.142 },
        { name: "Torre de Belém", kind: "historia", lat: 38.6916, lng: -9.216 },
      ],
      destinationName: "Lisboa",
    });
    // Duas atrações do mesmo tipo e longe uma da outra: nenhuma vira dia sozinha.
    expect(trip.days).toHaveLength(0);
    expect(trip.extras.map((x) => x.title)).toEqual(
      expect.arrayContaining(["Arco do Cego", "Torre de Belém"]),
    );
  });

  it("tira o nome da cidade do fim do nome da atração", () => {
    const trip = buildTrip({
      days: 1,
      profile: readProfile(""),
      attractions: [
        { name: "Agra Fort", kind: "historia", lat: 27.1795, lng: 78.0211 },
        { name: "Sadar Bazaar, Agra", kind: "mercado", lat: 27.16, lng: 78.0 },
      ],
      destinationName: "Agra",
    });
    expect(trip.days[0]?.stops.map((s) => s.title)).toContain("Sadar Bazaar");
  });
});
