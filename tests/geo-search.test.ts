import { describe, expect, it } from "vitest";
import { buildPlacesIndex, normalizePlace, searchPlaces, type PlacesData } from "@/lib/geo-search";

const data: PlacesData = {
  countries: [
    ["BR", "Brasil", "Brazil", -15.78, -47.93],
    ["IT", "Itália", "Italy", 41.89, 12.51],
    ["JP", "Japão", "Japan", 35.69, 139.69],
  ],
  cities: [
    ["Rome", "Lazio", "IT", 41.89, 12.51, 2318895, "roma|rom|rzym"],
    ["Rome", "Georgia", "US", 34.26, -85.16, 36323, "roma"],
    ["Roma", "Maseru", "LS", -29.45, 27.72, 12000, ""],
    ["São Paulo", "São Paulo", "BR", -23.55, -46.64, 10021295, "sampa"],
    ["Porto Seguro", "Bahia", "BR", -16.45, -39.06, 182630, "portu segurou"],
    ["Jijoca de Jericoacoara", "Ceará", "BR", -2.79, -40.51, 20087, "jericoacoara"],
    ["Brasília", "Federal District", "BR", -15.78, -47.93, 2207718, "brasilia"],
  ],
};
const index = buildPlacesIndex(data);

describe("busca de lugares do globo", () => {
  it("normaliza acentos, maiúsculas e pontuação", () => {
    expect(normalizePlace("  São-Paulo! ")).toBe("sao paulo");
  });

  it("ignora buscas com menos de 2 letras", () => {
    expect(searchPlaces(index, "a")).toEqual([]);
  });

  it("encontra país pelo nome em português, sem acento", () => {
    const [first] = searchPlaces(index, "japao");
    expect(first).toMatchObject({ kind: "country", name: "Japão", detail: "País" });
  });

  it("encontra país pelo nome em inglês", () => {
    expect(searchPlaces(index, "italy")[0]).toMatchObject({ kind: "country", name: "Itália" });
  });

  it("encontra cidade pelo nome em português (alternativo) e prefere a mais populosa", () => {
    const results = searchPlaces(index, "Roma");
    expect(results[0]).toMatchObject({ kind: "city", name: "Rome", detail: "Lazio, Itália" });
    expect(results[1]).toMatchObject({ name: "Rome", detail: "Georgia, US" });
  });

  it("nome alternativo exato de cidade grande vence nome principal de cidade pequena", () => {
    const results = searchPlaces(index, "roma");
    expect(results[0]).toMatchObject({ name: "Rome", detail: "Lazio, Itália" });
    expect(results.map((r) => r.detail)).toContain("Maseru, LS");
  });

  it("encontra vila turística pelo nome conhecido", () => {
    expect(searchPlaces(index, "jericoacoara")[0]).toMatchObject({
      name: "Jijoca de Jericoacoara",
      detail: "Ceará, Brasil",
    });
  });

  it("começo do nome funciona e país vem antes de cidade", () => {
    const results = searchPlaces(index, "bras");
    expect(results[0]).toMatchObject({ kind: "country", name: "Brasil" });
    expect(results[1]).toMatchObject({ kind: "city", name: "Brasília" });
  });

  it("encontra palavra no meio do nome", () => {
    expect(searchPlaces(index, "seguro")[0]).toMatchObject({ name: "Porto Seguro" });
  });

  it("respeita o limite de resultados", () => {
    expect(searchPlaces(index, "ro", 1)).toHaveLength(1);
  });
});

describe("cidade mais próxima e distância", () => {
  it("distância conhecida: Rio → São Paulo ≈ 360 km", async () => {
    const { distanceKm } = await import("@/lib/geo-search");
    expect(distanceKm(-22.91, -43.17, -23.55, -46.64)).toBeGreaterThan(340);
    expect(distanceKm(-22.91, -43.17, -23.55, -46.64)).toBeLessThan(370);
  });

  it("acha a cidade mais próxima e ignora as longe demais", async () => {
    const { nearestCity } = await import("@/lib/geo-search");
    expect(nearestCity(index, -16.5, -39.1)).toMatchObject({ name: "Porto Seguro" });
    expect(nearestCity(index, 0, -30)).toBeNull(); // meio do oceano
  });
});
