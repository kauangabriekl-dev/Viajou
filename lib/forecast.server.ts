import "server-only";

/**
 * Previsão do tempo dos próximos dias (Open-Meteo, gratuito, sem chave, CC BY 4.0).
 * Guardada em cache por 3 horas; se o serviço falhar, devolve null e a página segue sem ela.
 */
export type ForecastDay = {
  date: string;
  tmax: number;
  tmin: number;
  rainChance: number | null;
  code: number;
};

export async function getForecast(
  latitude: number,
  longitude: number,
  days = 7,
): Promise<ForecastDay[] | null> {
  const url = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: "auto",
    forecast_days: String(Math.min(16, Math.max(1, days))),
  })}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 10_800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      daily?: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: (number | null)[];
        weather_code: number[];
      };
    };
    const d = data.daily;
    if (!d?.time?.length) return null;
    return d.time.map((date, i) => ({
      date,
      tmax: Math.round(d.temperature_2m_max[i]),
      tmin: Math.round(d.temperature_2m_min[i]),
      rainChance: d.precipitation_probability_max?.[i] ?? null,
      code: d.weather_code[i],
    }));
  } catch {
    return null;
  }
}
