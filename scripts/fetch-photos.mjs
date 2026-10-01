// Busca fotos de licença livre no Wikimedia Commons para os destinos e para cada dia
// dos roteiros prontos, baixa em public/images e grava os créditos em data/photos.json.
//
//   node scripts/fetch-photos.mjs            # só o que ainda não tem foto
//   node scripts/fetch-photos.mjs --refazer  # busca tudo de novo
//
// Regras (para não publicar foto errada nem sem direito):
//  - só CC0, CC BY, CC BY-SA ou domínio público; nada de NC/ND ou com restrições extras;
//  - só JPEG de pelo menos 800 px, sem mapas, bandeiras, brasões ou logotipos;
//  - a foto vem do artigo da Wikipédia cujo ponto fica perto do destino (coordenadas).
// Precisa do banco rodando (npm run db:start) para ler os destinos.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "photos.json");
const UA = "Viajou/0.1 (projeto local; fotos com credito)";
const REDO = process.argv.includes("--refazer");

const BAD_NAME = /(map|mapa|locator|location|localiza|flag|bandeira|bras[aã]o|coat.of.arms|escudo|logo|seal|selo|diagram|plan[ot]a|panorama.*\d{4,})/i;
const OK_LICENSE = /^(cc0|cc[ -]by(-sa)?[ -]\d|cc[ -]by(-sa)?$|public domain|pd\b|domínio público)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A Wikimedia limita a frequência (HTTP 429): no máximo ~1 pedido por segundo e,
// quando ela pede para esperar (Retry-After), espera.
let last = 0;
async function politeFetch(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = last + 1100 - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        const retry = Number(res.headers.get("retry-after")) || 5 * (attempt + 1);
        await sleep((retry + 1) * 1000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 5) throw err;
      await sleep(3000);
    }
  }
  throw new Error(`Falha em ${url}`);
}

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  return (await politeFetch(url)).json();
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const stripHtml = (s = "") =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** Artigos da Wikipédia que batem com a busca e ficam perto do ponto, com a imagem principal. */
async function articleImages(lang, query, lat, lng, maxKm) {
  const data = await api(`${lang}.wikipedia.org`, {
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "pageimages|coordinates",
    piprop: "name",
    pilicense: "free",
    redirects: "1",
  });
  const pages = (data.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages
    .filter((p) => p.pageimage && p.coordinates?.[0])
    .filter((p) => distanceKm(lat, lng, p.coordinates[0].lat, p.coordinates[0].lon) <= maxKm)
    .map((p) => ({ article: p.title, file: p.pageimage }));
}

/** Confere licença, formato e tamanho no Commons e devolve os dados do crédito. */
async function checkFile(file) {
  if (BAD_NAME.test(file) || !/\.jpe?g$/i.test(file)) return null;
  const data = await api("commons.wikimedia.org", {
    action: "query",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: "1280",
  });
  const info = data.query?.pages?.[0]?.imageinfo?.[0];
  if (!info || info.mime !== "image/jpeg" || info.width < 800) return null;
  if (info.width < info.height) return null; // capas e cartões são horizontais
  const m = info.extmetadata ?? {};
  const license = stripHtml(m.LicenseShortName?.value);
  if (!OK_LICENSE.test(license) || /\b(nc|nd)\b/i.test(license)) return null;
  if (stripHtml(m.Restrictions?.value)) return null;
  const isPd = /public domain|pd\b|cc0/i.test(license);
  const author = stripHtml(m.Artist?.value).slice(0, 80) || (isPd ? "Domínio público" : "");
  if (!author) return null;
  return {
    thumb: info.thumburl,
    credit: {
      title: stripHtml(m.ObjectName?.value).slice(0, 100) || file.replace(/\.[a-z]+$/i, "").replace(/_/g, " "),
      author,
      license,
      licenseUrl: m.LicenseUrl?.value || info.descriptionurl,
      source: info.descriptionurl,
    },
  };
}

async function findPhoto(queries, lat, lng, maxKm, used) {
  for (const lang of ["pt", "en"]) {
    for (const q of queries) {
      const found = await articleImages(lang, q, lat, lng, maxKm);
      for (const f of found) {
        if (used.has(f.file)) continue;
        const ok = await checkFile(f.file);
        if (ok) {
          used.add(f.file);
          return { ...ok, article: f.article };
        }
      }
      await sleep(250);
    }
  }
  return null;
}

async function download(url, path) {
  const res = await politeFetch(url);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

/** Um item que falha (rede, limite) não derruba o resto: fica para a próxima rodada. */
async function safely(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.log(`  erro em ${label}: ${err.message} (rode de novo depois)`);
    return undefined;
  }
}

const store = existsSync(OUT) && !REDO ? JSON.parse(readFileSync(OUT, "utf8")) : { destinations: {}, days: {} };
const used = new Set();

const client = new pg.Client({
  host: "127.0.0.1",
  port: 5435,
  database: "viajou",
  user: "viajou",
  password: "viajou",
});
await client.connect();
const { rows: destinations } = await client.query(
  "SELECT slug, name, city, country, latitude, longitude FROM destinations ORDER BY slug",
);
await client.end();

// Fotos escolhidas à mão (lib/photos.ts) continuam valendo; o script não mexe nelas.
const MANUAL = new Set(["porto-seguro-ba", "florianopolis-sc", "rio-de-janeiro-rj", "gramado-rs", "fortaleza-ce"]);
// Quando a imagem principal do artigo da cidade não serve (vertical, montagem), um marco conhecido.
const LANDMARKS = {
  "amsterda-nl": ["Canais de Amsterdã", "Herengracht", "Prinsengracht"],
  "petra-jo": ["Al-Khazneh", "Ad Deir", "Petra Jordan"],
  "santos-sp": ["Praia do Gonzaga", "Orla de Santos", "Monte Serrat Santos"],
  "seul-kr": ["Gyeongbokgung", "Bukchon Hanok Village", "Namsan Seoul Tower"],
  "toquio-jp": ["Sensō-ji", "Shibuya Crossing", "Tokyo Tower"],
};
const coords = new Map(destinations.map((d) => [d.slug, [Number(d.latitude), Number(d.longitude)]]));

let ok = 0;
let missing = [];
for (const d of destinations) {
  if (MANUAL.has(d.slug) || store.destinations[d.slug]) continue;
  const [lat, lng] = coords.get(d.slug);
  const queries = [
    d.name,
    `${d.name} ${d.country}`,
    d.city !== d.name ? `${d.city} ${d.country}` : null,
    ...(LANDMARKS[d.slug] ?? []),
  ].filter(Boolean);
  const photo = await safely(d.slug, () => findPhoto(queries, lat, lng, 120, used));
  if (photo === undefined) continue;
  if (!photo) {
    missing.push(d.slug);
    console.log(`  sem foto: ${d.slug}`);
    continue;
  }
  const rel = `/images/destinos/${d.slug}.jpg`;
  if ((await safely(d.slug, () => download(photo.thumb, join(ROOT, "public", rel)).then(() => true))) !== true) continue;
  store.destinations[d.slug] = { src: rel, ...photo.credit };
  ok++;
  console.log(`destino ${d.slug} <- ${photo.article}`);
  writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n");
}

const { READY_ITINERARIES } = await import(pathToFileURL(join(ROOT, "lib", "ready-itineraries.ts")).href);
for (const r of READY_ITINERARIES) {
  const c = coords.get(r.destinationSlug);
  if (!c) continue;
  store.days[r.slug] ??= [];
  for (let i = 0; i < r.days.length; i++) {
    if (store.days[r.slug][i]) continue;
    const day = r.days[i];
    // Tenta as paradas do dia em ordem: a primeira com artigo perto do destino vira a foto.
    const queries = day.stops.flatMap((s) => [`${s.title} ${r.place}`, s.title]);
    const photo = await safely(`${r.slug} #${i + 1}`, () =>
      findPhoto(queries.slice(0, 6), c[0], c[1], 90, used),
    );
    if (photo === undefined) continue;
    if (!photo) {
      store.days[r.slug][i] = null;
      console.log(`  dia sem foto: ${r.slug} #${i + 1}`);
      continue;
    }
    const rel = `/images/roteiros/${r.slug}-dia-${i + 1}.jpg`;
    const saved = await safely(rel, () =>
      download(photo.thumb, join(ROOT, "public", rel)).then(() => true),
    );
    if (saved !== true) continue;
    store.days[r.slug][i] = { src: rel, ...photo.credit };
    ok++;
    console.log(`roteiro ${r.slug} dia ${i + 1} <- ${photo.article}`);
    writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n");
  }
}

writeFileSync(OUT, JSON.stringify(store, null, 2) + "\n");
console.log(`\n${ok} fotos novas. Destinos sem foto: ${missing.length ? missing.join(", ") : "nenhum"}`);
