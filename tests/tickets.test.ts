import { describe, expect, it } from "vitest";
import { ATTRACTIONS, findAttractions, ticketSearchLinks } from "@/lib/tickets";

describe("ingressos", () => {
  it("reconhece o Coliseu escrito de vários jeitos", () => {
    for (const text of ["Coliseu", "Visita ao COLISEU de manhã", "Colosseum tour"]) {
      expect(findAttractions([text]).map((a) => a.id)).toContain("coliseu");
    }
  });

  it("não confunde palavras parecidas", () => {
    expect(findAttractions(["Petrópolis e a serra"]).map((a) => a.id)).not.toContain("petra");
    expect(findAttractions(["Praia do Farol"])).toHaveLength(0);
  });

  it("inclui as atrações famosas do destino", () => {
    const ids = findAttractions([], "paris-fr").map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(["louvre", "torre-eiffel"]));
  });

  it("usa só sites oficiais em https", () => {
    expect(ATTRACTIONS.every((a) => a.officialUrl.startsWith("https://"))).toBe(true);
    expect(new Set(ATTRACTIONS.map((a) => a.id)).size).toBe(ATTRACTIONS.length);
  });

  it("monta buscas alternativas", () => {
    const [gyg, google] = ticketSearchLinks("Coliseu", "Roma");
    expect(new URL(gyg.url).searchParams.get("q")).toBe("Coliseu Roma");
    expect(new URL(google.url).searchParams.get("q")).toBe("Coliseu Roma ingresso site oficial");
  });
});
