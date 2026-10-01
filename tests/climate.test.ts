import { describe, expect, it } from "vitest";
import {
  bestMonths,
  describeMonth,
  packingTips,
  scoreMonths,
  type MonthClimate,
} from "@/lib/climate";

// Perfis simplificados: litoral nordestino (chuva no meio do ano) e serra com inverno frio.
const tropical: MonthClimate[] = Array.from({ length: 12 }, (_, i) => ({
  tmax: 30,
  tmin: 24,
  rain: i >= 3 && i <= 6 ? 300 : 30,
  rainyDays: i >= 3 && i <= 6 ? 18 : 3,
}));
const serra: MonthClimate[] = Array.from({ length: 12 }, (_, i) => {
  const winter = i >= 5 && i <= 7;
  return { tmax: winter ? 12 : 24, tmin: winter ? 0 : 14, rain: 120, rainyDays: 9 };
});

describe("clima", () => {
  it("na praia, os meses secos e quentes são os melhores", () => {
    const scores = scoreMonths(tropical, ["praia"]);
    const best = bestMonths(scores);
    expect(best.every((m) => m < 4 || m > 7)).toBe(true);
    expect(scores[4].verdict).not.toBe("otima");
  });

  it("em destino de frio, o inverno é valorizado", () => {
    const withCold = bestMonths(scoreMonths(serra, ["frio", "montanha"]));
    expect(withCold).toEqual(expect.arrayContaining([6, 7, 8]));
    const asCity = bestMonths(scoreMonths(serra, ["cidade"]));
    expect(asCity).not.toContain(7);
  });

  it("descreve o mês e sugere o que levar", () => {
    expect(describeMonth({ tmax: 12, tmin: -2, rain: 80, rainyDays: 10 })).toBe(
      "Frio (-2° a 12°C), chuva frequente, com chance de neve",
    );
    const tips = packingTips({ tmax: 31, tmin: 24, rain: 200, rainyDays: 12 }, ["praia"]);
    expect(tips.join(" ")).toMatch(/protetor/);
    expect(tips.join(" ")).toMatch(/Guarda-chuva/);
    expect(packingTips({ tmax: 5, tmin: -5, rain: 10, rainyDays: 2 }).join(" ")).toMatch(/neve/);
  });
});
