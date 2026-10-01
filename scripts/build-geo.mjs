// Gera data/geo/places.json a partir dos arquivos do GeoNames (https://www.geonames.org, CC BY 4.0).
// Uso: node scripts/build-geo.mjs <pasta com cities1000.txt, countryInfo.txt e admin1CodesASCII.txt>
// O resultado é versionado; rode de novo só para atualizar a base.
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

const src = process.argv[2];
if (!src) {
  console.error("Informe a pasta com os arquivos do GeoNames.");
  process.exit(1);
}

const regionPt = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const LATIN = /^[\p{Script=Latin}\d\s'’.\-()]+$/u;
const round = (n) => Math.round(n * 10000) / 10000;

// Estados/províncias: "BR.05" → "Bahia"
const admin1 = new Map();
for (const line of readFileSync(join(src, "admin1CodesASCII.txt"), "utf8").split("\n")) {
  const [code, name] = line.split("\t");
  if (code && name) admin1.set(code, name);
}

// Países
const countries = new Map();
for (const line of readFileSync(join(src, "countryInfo.txt"), "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const c = line.split("\t");
  const iso = c[0];
  let pt;
  try {
    pt = regionPt.of(iso);
  } catch {
    pt = c[4];
  }
  countries.set(iso, { iso, pt: pt || c[4], en: c[4], capital: c[5], best: null, cap: null });
}

// Cidades
const cities = [];
const rl = createInterface({ input: createReadStream(join(src, "cities1000.txt"), "utf8") });
for await (const line of rl) {
  const f = line.split("\t");
  if (f.length < 15 || f[6] !== "P") continue;
  const [, name, ascii, alternates, lat, lng, , code, iso, , a1] = f;
  const population = Number(f[14]) || 0;
  const country = countries.get(iso);
  if (!country) continue;
  const city = { name, iso, lat: round(Number(lat)), lng: round(Number(lng)), population };
  // Capital e cidade mais populosa definem o ponto do país no globo.
  if (code === "PPLC") country.cap = city;
  if (!country.best || population > country.best.population) country.best = city;

  // Nomes alternativos em alfabeto latino (ex.: "Roma", "Nova Iorque", "Jericoacoara").
  // Metrópoles guardam todos (Nova York tem centenas); médias, até 30; as menores, até 6.
  const keys = new Set([norm(name), norm(ascii)]);
  const maxKeys = population >= 500000 ? 400 : population >= 50000 ? 30 : 6;
  if (alternates) {
    for (const alt of alternates.split(",")) {
      if (alt.length > 40 || !LATIN.test(alt)) continue;
      const k = norm(alt);
      if (k.length >= 3) keys.add(k);
    }
  }
  keys.delete(norm(name));
  cities.push([
    name,
    admin1.get(`${iso}.${a1}`) ?? "",
    iso,
    city.lat,
    city.lng,
    population,
    [...keys].slice(0, maxKeys).join("|"),
  ]);
}

cities.sort((a, b) => b[5] - a[5]);
const countryRows = [...countries.values()]
  .map((c) => {
    const at = c.cap ?? c.best;
    return at ? [c.iso, c.pt, c.en, at.lat, at.lng] : null;
  })
  .filter(Boolean);

mkdirSync("data/geo", { recursive: true });
const out = {
  source: "GeoNames (https://www.geonames.org), CC BY 4.0",
  generatedAt: new Date().toISOString().slice(0, 10),
  countries: countryRows,
  cities,
};
writeFileSync("data/geo/places.json", JSON.stringify(out));
console.log(`${countryRows.length} países, ${cities.length} cidades`);
