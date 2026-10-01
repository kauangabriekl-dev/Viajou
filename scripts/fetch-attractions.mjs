// Lista os pontos turísticos mais conhecidos perto de cada destino, para o roteiro
// personalizado nunca ficar com "dia livre". Fonte: artigos da Wikipédia com coordenadas
// (busca por proximidade), filtrados pelo tipo de lugar e ordenados pela popularidade
// (visualizações do artigo nos últimos 60 dias). Grava data/attractions.json.
//
//   node scripts/fetch-attractions.mjs            # só destinos sem lista
//   node scripts/fetch-attractions.mjs --refazer  # refaz todos
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "attractions.json");
const UA = "Viajou/0.1 (projeto local; atracoes)";
const REDO = process.argv.includes("--refazer");
const PER_DESTINATION = 16;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function api(lang, params) {
  const url = `https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = last + 1100 - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": UA } }).catch(() => null);
    if (res?.ok) return res.json();
    const retry = Number(res?.headers.get("retry-after")) || 5 * (attempt + 1);
    await sleep((retry + 1) * 1000);
  }
  throw new Error(`Wikipédia (${lang}) não respondeu`);
}

const plain = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Tipo do lugar pelo nome do artigo (pt e en). A ordem importa: o primeiro que bater vale.
const KINDS = [
  ["mirante", /\b(miradouro|mirante|belvedere|viewpoint|lookout|morro|monte|colina|cerro|mount|hill|peak|pico)\b/],
  ["museu", /\b(museu|museum|galeria|gallery|pinacoteca)\b/],
  ["praia", /\b(praia|beach|playa|ilha|island|isla|baia|bay)\b/],
  ["parque", /\b(parque|park|jardim|garden|jardin|bosque|lago|lake|lagoa|cachoeira|waterfall|cascata|zoo|zoologico|aquario|aquarium)\b/],
  ["mercado", /\b(mercado|market|feira|bazar|bazaar|souk)\b/],
  ["praca", /\b(praca|square|plaza|piazza|place|largo|rua|street|avenida|avenue|boulevard|bairro|quarter|district|calcadao)\b/],
  ["historia", /\b(castelo|castle|palacio|palace|igreja|church|catedral|cathedral|basilica|mosteiro|monastery|convento|convent|templo|temple|santuario|shrine|forte|fort|fortaleza|fortress|torre|tower|ponte|bridge|monumento|monument|estatua|statue|arco|arch|ruinas|ruins|muralha|wall|farol|lighthouse|teatro|theatre|theater|opera|mesquita|mosque|sinagoga|pagoda|elevador)\b/],
];
const BLOCK = /\b(embaixada|embassy|consulado|hospital|escola|school|universidade|university|faculdade|estacao|station|metro|aeroporto|airport|hotel|edificio|building|empresa|banco|bank|assassinato|massacre|ataque|attack|festival|eleicao|distrito|district of|municipio|freguesia|parish|diocese|patriarcado|maternidade|clube|club|estadio|stadium|cemiterio|cemetery|prisao|prison|tribunal|ministerio|ministry|liceu|colegio)\b|\d+[,-]\d+/;

function kindOf(title) {
  const t = plain(title);
  if (BLOCK.test(t)) return null;
  for (const [kind, re] of KINDS) if (re.test(t)) return kind;
  return null;
}

async function nearby(lang, lat, lng) {
  const data = await api(lang, {
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lng}`,
    gsradius: "10000",
    gslimit: "200",
  });
  return (data.query?.geosearch ?? [])
    .map((g) => ({ name: g.title, lat: g.lat, lng: g.lon, kind: kindOf(g.title) }))
    .filter((g) => g.kind && !/\(desambigua|\(disambiguation/i.test(g.name));
}

async function withViews(lang, items) {
  const views = new Map();
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const data = await api(lang, { action: "query", prop: "pageviews", titles: batch.map((b) => b.name).join("|") });
    for (const p of data.query?.pages ?? []) {
      const total = Object.values(p.pageviews ?? {}).reduce((a, n) => a + (n ?? 0), 0);
      views.set(p.title, total);
    }
  }
  return items.map((it) => ({ ...it, views: views.get(it.name) ?? 0 }));
}

const clean = (name) => name.replace(/\s*\([^)]*\)\s*$/, "").trim();

const store = existsSync(OUT) && !REDO ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const client = new pg.Client({ host: "127.0.0.1", port: 5435, database: "viajou", user: "viajou", password: "viajou" });
await client.connect();
const { rows } = await client.query(
  "SELECT slug, latitude, longitude FROM destinations WHERE latitude IS NOT NULL ORDER BY slug",
);
await client.end();

for (const d of rows) {
  if (store[d.slug]?.length) continue;
  try {
    const lat = Number(d.latitude);
    const lng = Number(d.longitude);
    // Português primeiro (nomes como o público conhece); completa com inglês se vier pouco.
    let found = await withViews("pt", await nearby("pt", lat, lng));
    if (found.length < 8) {
      const en = await withViews("en", await nearby("en", lat, lng));
      const seen = new Set(found.map((f) => plain(clean(f.name))));
      found = found.concat(en.filter((e) => !seen.has(plain(clean(e.name)))));
    }
    const best = found
      .sort((a, b) => b.views - a.views)
      .filter((f, i, all) => all.findIndex((x) => plain(clean(x.name)) === plain(clean(f.name))) === i)
      .slice(0, PER_DESTINATION)
      .map((f) => ({
        name: clean(f.name),
        kind: f.kind,
        lat: Math.round(f.lat * 1e5) / 1e5,
        lng: Math.round(f.lng * 1e5) / 1e5,
      }));
    store[d.slug] = best;
    console.log(`${d.slug}: ${best.length} — ${best.slice(0, 4).map((b) => b.name).join(", ")}`);
    writeFileSync(OUT, JSON.stringify(store) + "\n");
  } catch (err) {
    console.log(`  erro em ${d.slug}: ${err.message} (rode de novo depois)`);
  }
}
writeFileSync(OUT, JSON.stringify(store) + "\n");
console.log(`Destinos com atrações: ${Object.values(store).filter((v) => v.length).length}`);
