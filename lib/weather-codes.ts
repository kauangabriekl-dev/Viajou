/** Códigos de tempo da OMM (usados pelo Open-Meteo) em português. */
export function weatherLabel(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code <= 2) return "Poucas nuvens";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code >= 51 && code <= 57) return "Garoa";
  if (code >= 61 && code <= 67) return "Chuva";
  if (code >= 71 && code <= 77) return "Neve";
  if (code >= 80 && code <= 82) return "Pancadas de chuva";
  if (code === 85 || code === 86) return "Pancadas de neve";
  if (code >= 95) return "Tempestade";
  return "Variável";
}

export type WeatherKind = "sol" | "nuvem" | "chuva" | "neve" | "tempestade" | "neblina";

export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return "sol";
  if (code <= 3) return "nuvem";
  if (code === 45 || code === 48) return "neblina";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "neve";
  if (code >= 95) return "tempestade";
  return "chuva";
}
