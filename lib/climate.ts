/**
 * Clima típico por mês (data/climate.json, médias 2016–2025 do Open-Meteo) transformado
 * em algo útil para decidir a viagem: nota de cada mês, melhores épocas e o que levar.
 * A nota depende do estilo do destino: praia pede calor e pouca chuva; frio e neve
 * valoriza o inverno; cidade e trilha preferem temperaturas amenas.
 */
import type { DestinationStyle } from "@/types/database";

export type MonthClimate = { tmax: number; tmin: number; rain: number; rainyDays: number };

export type MonthVerdict = "otima" | "boa" | "regular" | "evite";

export type MonthScore = {
  month: number; // 1–12
  score: number; // 0–100
  verdict: MonthVerdict;
  summary: string;
};

export const verdictLabel: Record<MonthVerdict, string> = {
  otima: "Ótima",
  boa: "Boa",
  regular: "Regular",
  evite: "Evite",
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** Pontos de 0 a 100 conforme a máxima fica dentro (ou longe) da faixa ideal. */
function tempPoints(tmax: number, low: number, high: number) {
  if (tmax >= low && tmax <= high) return 100;
  const gap = tmax < low ? low - tmax : tmax - high;
  return clamp(100 - gap * 9);
}

function rainPoints(rainyDays: number) {
  if (rainyDays <= 5) return 100;
  return clamp(100 - (rainyDays - 5) * 7);
}

export function describeMonth(c: MonthClimate) {
  const feel =
    c.tmax >= 30
      ? "muito quente"
      : c.tmax >= 25
        ? "quente"
        : c.tmax >= 18
          ? "agradável"
          : c.tmax >= 10
            ? "frio"
            : "muito frio";
  const rain =
    c.rainyDays >= 14
      ? "chove na maior parte dos dias"
      : c.rainyDays >= 9
        ? "chuva frequente"
        : c.rainyDays >= 5
          ? "alguns dias de chuva"
          : "pouca chuva";
  const snow = c.tmin <= 0 ? ", com chance de neve" : "";
  return `${feel[0].toUpperCase()}${feel.slice(1)} (${Math.round(c.tmin)}° a ${Math.round(c.tmax)}°C), ${rain}${snow}`;
}

export function scoreMonths(months: MonthClimate[], styles: DestinationStyle[] = []): MonthScore[] {
  const beach = styles.includes("praia");
  const cold = styles.includes("frio");
  const coldest = Math.min(...months.map((m) => m.tmax));

  return months.map((c, i) => {
    let temp: number;
    if (beach) temp = tempPoints(c.tmax, 26, 32);
    else temp = tempPoints(c.tmax, 17, 27);
    const coldSeason = cold && c.tmax <= coldest + 4;
    if (coldSeason) temp = 100;
    // Destino de frio: os meses mais frios são o atrativo (neve, inverno), então ganham bônus.
    const score = Math.round(
      clamp(temp * 0.6 + rainPoints(c.rainyDays) * 0.4 + (coldSeason ? 12 : 0)),
    );
    const verdict: MonthVerdict =
      score >= 80 ? "otima" : score >= 62 ? "boa" : score >= 45 ? "regular" : "evite";
    return { month: i + 1, score, verdict, summary: describeMonth(c) };
  });
}

/** Os melhores meses: todos a até 6 pontos do melhor, no máximo 5, em ordem do ano. */
export function bestMonths(scores: MonthScore[]) {
  const top = Math.max(...scores.map((s) => s.score));
  return scores
    .filter((s) => s.score >= top - 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.month)
    .sort((a, b) => a - b);
}

/** Lista do que levar, a partir do clima do mês e do estilo do destino. */
export function packingTips(c: MonthClimate, styles: DestinationStyle[] = []) {
  const tips: string[] = [];
  if (c.tmin <= 0) tips.push("Roupa de neve: casaco impermeável, luvas, gorro e meias térmicas.");
  else if (c.tmin < 10) tips.push("Casaco quente e roupas em camadas: as noites são frias.");
  else if (c.tmin < 16) tips.push("Um casaco leve para a noite.");
  if (c.tmax >= 28) tips.push("Roupas leves, chapéu e protetor solar; beba bastante água.");
  if (c.rainyDays >= 9) tips.push("Guarda-chuva ou capa de chuva e um calçado que aguente água.");
  if (styles.includes("praia") && c.tmax >= 22)
    tips.push("Roupa de banho e protetor solar resistente à água.");
  if (styles.includes("trilha") || styles.includes("montanha"))
    tips.push("Tênis ou bota de trilha já amaciados e uma mochila pequena.");
  if (styles.includes("historico") || styles.includes("cidade"))
    tips.push("Calçado confortável: os centros históricos se conhecem a pé.");
  return tips;
}
