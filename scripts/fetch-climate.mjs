// Calcula o clima médio de cada mês para todos os destinos (2016–2025) com dados do
// Open-Meteo (reanálise ERA5, gratuito, sem chave) e grava em data/climate.json.
//
//   node scripts/fetch-climate.mjs            # só destinos ainda sem clima
//   node scripts/fetch-climate.mjs --refazer  # recalcula todos
//
// Dados: Open-Meteo.com (CC BY 4.0). Precisa do banco rodando (npm run db:start).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "climate.json");
const REDO = process.argv.includes("--refazer");
const START = "2016-01-01";
const END = "2025-12-31";
const YEARS = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round1 = (n) => Math.round(n * 10) / 10;

async function archive(lat, lng) {
  const url = `https://archive-api.open-meteo.com/v1/archive?${new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: START,
    end_date: END,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url).catch(() => null);
    if (res?.ok) return res.json();
    await sleep(5000 * (attempt + 1));
  }
  throw new Error("Open-Meteo não respondeu");
}

/** Média por mês: máxima, mínima, chuva total no mês (mm) e dias com chuva (≥ 1 mm). */
function monthly(daily) {
  const acc = Array.from({ length: 12 }, () => ({ tmax: 0, tmin: 0, n: 0, rain: 0, rainyDays: 0 }));
  daily.time.forEach((day, i) => {
    const m = Number(day.slice(5, 7)) - 1;
    const tmax = daily.temperature_2m_max[i];
    const tmin = daily.temperature_2m_min[i];
    const rain = daily.precipitation_sum[i];
    if (tmax == null || tmin == null || rain == null) return;
    acc[m].tmax += tmax;
    acc[m].tmin += tmin;
    acc[m].n += 1;
    acc[m].rain += rain;
    if (rain >= 1) acc[m].rainyDays += 1;
  });
  return acc.map((a) => ({
    tmax: round1(a.tmax / a.n),
    tmin: round1(a.tmin / a.n),
    rain: Math.round(a.rain / YEARS),
    rainyDays: round1(a.rainyDays / YEARS),
  }));
}

const store = existsSync(OUT) && !REDO ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const client = new pg.Client({
  host: "127.0.0.1",
  port: 5435,
  database: "viajou",
  user: "viajou",
  password: "viajou",
});
await client.connect();
const { rows } = await client.query(
  "SELECT slug, latitude, longitude FROM destinations WHERE latitude IS NOT NULL ORDER BY slug",
);
await client.end();

let done = 0;
for (const d of rows) {
  if (store[d.slug]) continue;
  try {
    const data = await archive(Number(d.latitude), Number(d.longitude));
    store[d.slug] = monthly(data.daily);
    done++;
    console.log(`clima ${d.slug}`);
    writeFileSync(OUT, JSON.stringify(store) + "\n");
  } catch (err) {
    console.log(`  erro em ${d.slug}: ${err.message} (rode de novo depois)`);
  }
  await sleep(1200);
}
writeFileSync(OUT, JSON.stringify(store) + "\n");
console.log(`${done} destinos calculados; total ${Object.keys(store).length}.`);
