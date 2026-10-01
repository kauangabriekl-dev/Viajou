/**
 * Roteiro personalizado do "Vou viajar", sem IA: regras simples e explicáveis.
 *  1. Lê o "Conte sobre você" (e as preferências marcadas) e monta um perfil:
 *     ritmo, com quem viaja, do que gosta e do que não gosta, orçamento, mobilidade.
 *  2. Parte do roteiro pronto do destino (quando existe) e adapta: escolhe os dias que
 *     mais combinam, tira o que a pessoa não gosta e limita as paradas pelo ritmo.
 *  3. Sem roteiro pronto (ou com mais dias do que ele tem), completa com os lugares
 *     cadastrados no destino e com dias temáticos pelo estilo do destino.
 * Cada escolha vira um "porquê" mostrado à pessoa.
 */
import { normalizePlace } from "@/lib/geo-search";
import type { ReadyItinerary, ReadyPeriod } from "@/lib/ready-itineraries";
import type { DestinationStyle } from "@/types/database";

export type Interest =
  | "praia"
  | "historia"
  | "museus"
  | "gastronomia"
  | "natureza"
  | "aventura"
  | "trilha"
  | "noite"
  | "compras"
  | "fotografia";

export type Pace = "leve" | "normal" | "intenso";

export type TravelerProfile = {
  pace: Pace;
  kids: boolean;
  couple: boolean;
  solo: boolean;
  budget: boolean;
  limitedMobility: boolean;
  likes: Interest[];
  dislikes: Interest[];
};

const INTEREST_WORDS: Record<Interest, string[]> = {
  praia: ["praia", "praias", "mar", "mergulho", "snorkel", "piscina natural", "piscinas naturais"],
  historia: [
    "historia",
    "historico",
    "historica",
    "cultura",
    "igreja",
    "castelo",
    "ruina",
    "ruinas",
    "arquitetura",
    "centro historico",
  ],
  museus: ["museu", "museus", "arte", "galeria", "exposicao"],
  gastronomia: [
    "comida",
    "comer",
    "gastronomia",
    "restaurante",
    "restaurantes",
    "cafe",
    "vinho",
    "vinicola",
    "culinaria",
    "doce",
    "chocolate",
    "fondue",
    "frutos do mar",
    "tapas",
    "mercado",
  ],
  natureza: [
    "natureza",
    "parque",
    "cachoeira",
    "cachoeiras",
    "lagoa",
    "lago",
    "montanha",
    "paisagem",
    "floresta",
    "animais",
    "dunas",
    "geleira",
  ],
  aventura: [
    "aventura",
    "radical",
    "adrenalina",
    "tirolesa",
    "rapel",
    "buggy",
    "4x4",
    "jipe",
    "kitesurf",
    "surf",
    "balao",
  ],
  trilha: ["trilha", "trilhas", "caminhada", "caminhar", "hiking", "subida", "escadaria"],
  noite: [
    "balada",
    "baladas",
    "festa",
    "festas",
    "vida noturna",
    "bar",
    "bares",
    "drinks",
    "show",
    "shows",
    "noite",
  ],
  compras: ["compras", "shopping", "lojas", "outlet", "feira", "feirinha", "artesanato"],
  fotografia: ["foto", "fotos", "fotografia", "instagram", "mirante", "mirantes", "por do sol"],
};

/** Preferências do formulário (travelTags) → interesses. */
const TAG_INTEREST: Record<string, Interest> = {
  praia: "praia",
  historia: "historia",
  gastronomia: "gastronomia",
  natureza: "natureza",
  aventura: "aventura",
};

const has = (text: string, words: string[]) => words.some((w) => text.includes(` ${w} `));

function interestsIn(text: string): Interest[] {
  return (Object.keys(INTEREST_WORDS) as Interest[]).filter((i) => has(text, INTEREST_WORDS[i]));
}

/** Lê o texto livre e as preferências marcadas e devolve o perfil da pessoa. */
export function readProfile(
  about: string | null | undefined,
  tags: string[] = [],
): TravelerProfile {
  const text = ` ${normalizePlace(about ?? "")} `;
  // "não gosto de X", "odeio X", "sem X", "evitar X": o trecho logo depois vira "não gosta".
  const dislikeChunks = [
    ...text.matchAll(
      / (?:nao gosto(?: muito)? de|nao curto|nao curtimos|nao gostamos de|odeio|odiamos|evitar|evito|sem) ([a-z ]{1,40})/g,
    ),
  ].map((m) => ` ${m[1]} `);
  const dislikes = new Set(dislikeChunks.flatMap(interestsIn));
  // Tira as negações do texto antes de procurar o que a pessoa gosta.
  let positive = text;
  for (const chunk of dislikeChunks) positive = positive.replace(chunk, " ");
  const likes = new Set([
    ...interestsIn(positive),
    ...tags.map((t) => TAG_INTEREST[t]).filter((i): i is Interest => Boolean(i)),
  ]);
  for (const d of dislikes) likes.delete(d);

  const limitedMobility = has(text, [
    "cadeira de rodas",
    "dificuldade de andar",
    "dificuldade para andar",
    "mobilidade reduzida",
    "nao posso andar muito",
    "joelho",
    "bengala",
  ]);
  const calm = has(text, [
    "tranquilo",
    "tranquila",
    "calma",
    "calmo",
    "devagar",
    "descansar",
    "relaxar",
    "sem pressa",
    "idoso",
    "idosa",
    "idosos",
    "terceira idade",
  ]);
  const intense = has(text, [
    "aproveitar tudo",
    "intenso",
    "intensa",
    "ver tudo",
    "agitado",
    "agitada",
    "muita coisa",
    "o maximo",
  ]);

  return {
    pace: calm || limitedMobility ? "leve" : intense ? "intenso" : "normal",
    kids:
      tags.includes("familia") ||
      has(text, [
        "crianca",
        "criancas",
        "filho",
        "filha",
        "filhos",
        "filhas",
        "bebe",
        "familia",
        "netos",
        "neto",
        "neta",
      ]),
    couple:
      tags.includes("casal") ||
      has(text, [
        "casal",
        "namorado",
        "namorada",
        "esposa",
        "marido",
        "lua de mel",
        "noiva",
        "noivo",
        "minha mulher",
        "meu marido",
      ]),
    solo: has(text, ["sozinho", "sozinha", "solo"]),
    budget:
      tags.includes("economico") ||
      has(text, [
        "economizar",
        "economico",
        "economica",
        "barato",
        "barata",
        "mochilao",
        "mochileiro",
        "gastar pouco",
        "orcamento curto",
      ]),
    limitedMobility,
    likes: [...likes],
    dislikes: [...dislikes],
  };
}

export type BuiltStop = { period: ReadyPeriod; title: string; note: string };

/**
 * "planejado": experiências reais. "opcional": sugestões que a pessoa escolhe (bate-voltas).
 * "livre": dia livre de propósito, quando não há mais experiências novas e relevantes.
 */
export type BuiltDay = {
  title: string;
  stops: BuiltStop[];
  kind?: "planejado" | "opcional" | "livre";
  /** Ideias para o dia livre ou para o dia de sugestões. */
  options?: string[];
};

export type PlacePick = {
  name: string;
  type: "hotel" | "restaurant" | "beach" | "attraction" | "tour" | "other";
  slug?: string;
};

export type BuiltTrip = {
  days: BuiltDay[];
  reasons: string[];
  tips: string[];
  /** "Você ainda pode conhecer": experiências relevantes que ficaram fora do roteiro. */
  moreToSee: { title: string; note: string }[];
  /** Quantos dias têm programação de verdade (o resto é opcional ou livre). */
  plannedDays: number;
  /** De onde veio a base do roteiro. */
  source: "pronto" | "lugares" | "atracoes" | "nenhum";
};

const MAX_STOPS: Record<Pace, number> = { leve: 2, normal: 3, intenso: 4 };

function stopInterests(stop: { title: string; note: string }) {
  return interestsIn(` ${normalizePlace(`${stop.title} ${stop.note}`)} `);
}

function stopScore(stop: { title: string; note: string }, p: TravelerProfile) {
  const tags = stopInterests(stop);
  let score = 0;
  for (const t of tags) {
    if (p.likes.includes(t)) score += 2;
    if (p.dislikes.includes(t)) score -= 4;
  }
  if (p.limitedMobility && (tags.includes("trilha") || tags.includes("aventura"))) score -= 4;
  if (p.kids && tags.includes("noite")) score -= 2;
  return score;
}

// ---------------------------------------------------------------------------
// Identidade de lugares e atividades (para não repetir nem "a mesma coisa com outro nome")
// ---------------------------------------------------------------------------

// Palavras que mudam de idioma ou de jeito de falar, mas não de lugar.
const GENERIC_WORDS = new Set(
  (
    "a o as os de da do das dos e em no na nos nas the of and to at in " +
    "praia beach playa parque park parco nacional national museu museum museo igreja church iglesia " +
    "catedral cathedral palacio palace castelo castle torre tower ponte bridge mercado market " +
    "praca square plaza lago lake lagoa monte mount morro hill passeio visita tour caminhada " +
    "centro historico city cidade old velha"
  ).split(" "),
);

/** Palavras que identificam o lugar ("Praia de Jericoacoara" e "Jericoacoara Beach" → jericoacoara). */
function coreWords(text: string) {
  return normalizePlace(text)
    .split(" ")
    .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w));
}

/** O lugar já aparece em alguma parada usada (ex.: "Lagoa do Paraíso" dentro de "Lagoa do Paraíso e Lagoa Azul"). */
function coveredBy(name: string, usedTitles: string[]) {
  const core = coreWords(name);
  if (!core.length) return usedTitles.some((t) => normalizePlace(t) === normalizePlace(name));
  return usedTitles.some((t) => {
    const words = new Set(coreWords(t));
    return core.every((w) => words.has(w));
  });
}

export type AttractionKind =
  "mirante" | "museu" | "praia" | "parque" | "mercado" | "praca" | "historia";

/** Ponto turístico conhecido do destino (data/attractions.json, via scripts/fetch-attractions.mjs). */
export type AttractionPick = { name: string; kind: AttractionKind; lat?: number; lng?: number };

function placeKey(a: AttractionPick) {
  const core = coreWords(a.name).sort().join(" ");
  return `${a.kind}:${core || normalizePlace(a.name)}`;
}

/** Remove o mesmo lugar escrito em outro idioma (mantém o primeiro, mais popular). */
export function dedupeAttractions(list: AttractionPick[]): AttractionPick[] {
  const seen = new Set<string>();
  return list.filter((a) => {
    const key = placeKey(a);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const KIND_INTEREST: Record<AttractionKind, Interest[]> = {
  mirante: ["fotografia", "natureza"],
  museu: ["museus", "historia"],
  praia: ["praia"],
  parque: ["natureza"],
  mercado: ["gastronomia", "compras"],
  praca: ["historia", "fotografia"],
  historia: ["historia"],
};

// O que fazer em cada tipo de lugar. Notas diferentes para não repetir a mesma frase.
const KIND_NOTES: Record<AttractionKind, string[]> = {
  mirante: [
    "Suba no fim da tarde e fique para o pôr do sol.",
    "Vá cedo, quando o ar está mais limpo e há menos gente.",
  ],
  museu: [
    "Confira o dia de fechamento: muitos museus fecham um dia por semana.",
    "Reserve umas duas horas e escolha as salas que mais interessam.",
  ],
  praia: [
    "Leve água e protetor; bom para passar a tarde sem pressa.",
    "Chegue cedo para pegar mar mais calmo e lugar na areia.",
  ],
  parque: [
    "Caminhe sem pressa ou leve um lanche para um piquenique.",
    "Bom para descansar entre um passeio e outro.",
  ],
  mercado: [
    "Prove algo típico e veja os produtos da região.",
    "Bom lugar para almoçar e comprar lembranças.",
  ],
  praca: [
    "Sente-se num café ou num banco e observe o movimento.",
    "Fotografe no fim do dia, com a luz mais bonita.",
  ],
  historia: [
    "Reserve cerca de uma hora para a visita e confira o horário de abertura.",
    "Mesmo sem entrar, vale ver de perto e sentar em frente para apreciar.",
  ],
};

const KIND_PERIOD: Record<AttractionKind, ReadyPeriod> = {
  historia: "manha",
  museu: "manha",
  praia: "manha",
  parque: "tarde",
  mercado: "tarde",
  praca: "tarde",
  mirante: "tarde",
};
const PERIOD_ORDER: Record<ReadyPeriod, number> = { manha: 0, dia: 1, tarde: 2, noite: 3 };

export const attractionKindLabel: Record<AttractionKind, string> = {
  mirante: "Mirante",
  museu: "Museu",
  praia: "Praia",
  parque: "Parque e natureza",
  mercado: "Mercado",
  praca: "Praça e passeio a pé",
  historia: "Patrimônio histórico",
};

function attractionScore(a: AttractionPick, p: TravelerProfile) {
  let score = 0;
  for (const i of KIND_INTEREST[a.kind]) {
    if (p.likes.includes(i)) score += 2;
    if (p.dislikes.includes(i)) score -= 4;
  }
  if (p.limitedMobility && a.kind === "mirante") score -= 1;
  return score;
}

const km = (a: AttractionPick, b: AttractionPick) =>
  a.lat != null && a.lng != null && b.lat != null && b.lng != null
    ? Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 111 * Math.cos((a.lat * Math.PI) / 180))
    : 3; // sem coordenadas: trata como "perto o suficiente"

/**
 * Dias com pontos turísticos reais. Cada dia parte da atração mais relevante que sobrou
 * e junta as mais próximas dela (até ~4 km), de tipos diferentes; evita repetir no dia
 * seguinte a categoria principal do dia anterior.
 */
function daysFromAttractions(
  pool: AttractionPick[],
  p: TravelerProfile,
  maxDays: number,
): BuiltDay[] {
  const perDay = MAX_STOPS[p.pace];
  const days: BuiltDay[] = [];
  let lastKind: AttractionKind | null = null;
  let noteTurn = 0;
  while (days.length < maxDays && pool.length) {
    // Semente: a de maior nota cuja categoria não seja a do dia anterior, se houver.
    let seedIdx = pool.findIndex((a) => a.kind !== lastKind);
    if (seedIdx < 0) seedIdx = 0;
    const seed = pool.splice(seedIdx, 1)[0];
    const picked = [seed];
    const kinds = new Set([seed.kind]);
    const nearby = pool
      .map((a, i) => ({ a, i, d: km(seed, a) }))
      .filter((x) => x.d <= 4 && !kinds.has(x.a.kind))
      .sort((x, y) => x.d - y.d);
    for (const x of nearby) {
      if (picked.length >= perDay) break;
      if (kinds.has(x.a.kind)) continue;
      picked.push(x.a);
      kinds.add(x.a.kind);
    }
    for (const a of picked.slice(1)) pool.splice(pool.indexOf(a), 1);
    lastKind = seed.kind;
    const stops = picked
      .map((a) => {
        const notes = KIND_NOTES[a.kind];
        return {
          period: KIND_PERIOD[a.kind],
          title: a.name,
          note: notes[noteTurn++ % notes.length],
        };
      })
      .sort((x, y) => PERIOD_ORDER[x.period] - PERIOD_ORDER[y.period]);
    days.push({
      kind: "planejado",
      title: stops.length > 1 ? `${seed.name} e arredores` : seed.name,
      stops,
    });
  }
  return days;
}

/** Dias montados com os lugares cadastrados pela comunidade (visitas e restaurantes). */
function daysFromPlaces(places: PlacePick[], p: TravelerProfile): BuiltDay[] {
  const visits = places.filter(
    (x) => x.type === "attraction" || x.type === "beach" || x.type === "tour",
  );
  const food = places.filter((x) => x.type === "restaurant");
  const days: BuiltDay[] = [];
  const perDay = Math.max(1, MAX_STOPS[p.pace] - 1);
  for (let i = 0; i < visits.length; i += perDay) {
    const chunk = visits.slice(i, i + perDay);
    const stops: BuiltStop[] = chunk.map((v, j) => ({
      period: j === 0 ? "manha" : "tarde",
      title: v.name,
      note: "Recomendado por quem já esteve no destino.",
    }));
    const meal = food[days.length];
    if (meal)
      stops.push({
        period: "noite",
        title: meal.name,
        note: "Restaurante avaliado pela comunidade.",
      });
    days.push({ kind: "planejado", title: chunk[0].name, stops });
  }
  return days;
}

function trimDay(day: BuiltDay, p: TravelerProfile): BuiltDay {
  const kept = day.stops.filter((s) => stopScore(s, p) > -3);
  const limit = MAX_STOPS[p.pace];
  if (kept.length <= limit) return { ...day, stops: kept };
  // Mantém as paradas de maior nota, mas na ordem original do dia (manhã → noite).
  const best = new Set(
    [...kept]
      .map((s, i) => ({ s, i, score: stopScore(s, p) }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, limit)
      .map((x) => x.s),
  );
  return { ...day, stops: kept.filter((s) => best.has(s)) };
}

function freeDay(p: TravelerProfile, styles: DestinationStyle[]): BuiltDay {
  const options = [
    "Descansar e recarregar as energias",
    "Voltar ao lugar favorito da viagem",
    styles.includes("praia") ? "Aproveitar a praia sem pressa" : null,
    "Conhecer restaurantes e cafés que chamaram sua atenção",
    "Explorar a região sem roteiro",
    "Adaptar ao clima: deixe para hoje o que a chuva ou o calor adiaram",
    p.kids ? "Um programa só das crianças, no ritmo delas" : null,
  ].filter((o): o is string => Boolean(o));
  return { kind: "livre", title: "Dia livre", stops: [], options };
}

/**
 * Validação final: nenhuma parada repetida (nem a mesma coisa com outro nome) entre os
 * dias planejados. Paradas repetidas saem; dia planejado que fica vazio vira dia livre.
 */
export function validateTrip(days: BuiltDay[], p: TravelerProfile, styles: DestinationStyle[]) {
  const seen: string[] = [];
  return days.map((day) => {
    if (day.kind !== "planejado") return day;
    const stops = day.stops.filter((s) => {
      if (coveredBy(s.title, seen)) return false;
      seen.push(s.title);
      return true;
    });
    return stops.length ? { ...day, stops } : freeDay(p, styles);
  });
}

/** Paradas repetidas num roteiro (para testes e para conferir antes de mostrar). */
export function findRepeats(days: BuiltDay[]): string[] {
  const seen: string[] = [];
  const repeats: string[] = [];
  for (const s of days.filter((d) => d.kind !== "livre").flatMap((d) => d.stops)) {
    if (coveredBy(s.title, seen)) repeats.push(s.title);
    seen.push(s.title);
  }
  return repeats;
}

export function buildTrip(input: {
  days: number;
  profile: TravelerProfile;
  ready?: ReadyItinerary | null;
  places?: PlacePick[];
  attractions?: AttractionPick[];
  styles?: DestinationStyle[];
  /** Nome do destino (não vira atração dele mesmo). */
  destinationName?: string;
  /** Cidades reais próximas, oferecidas como bate-voltas opcionais. */
  nearby?: { name: string; km: number }[];
}): BuiltTrip {
  const p = input.profile;
  const styles = input.styles ?? [];
  const total = Math.max(1, Math.min(14, input.days));
  const reasons: string[] = [];
  let source: BuiltTrip["source"] = "nenhum";
  let days: BuiltDay[] = [];
  let leftoverReady: BuiltStop[] = [];

  if (input.ready) {
    source = "pronto";
    const base: BuiltDay[] = input.ready.days.map((d) => ({
      kind: "planejado",
      title: d.title,
      stops: [...d.stops],
    }));
    if (base.length > total) {
      // Escolhe os dias que mais combinam com a pessoa, mantendo a ordem original.
      const ranked = base
        .map((d, i) => ({ d, i, score: d.stops.reduce((acc, s) => acc + stopScore(s, p), 0) }))
        .sort((a, b) => b.score - a.score || a.i - b.i);
      days = ranked
        .slice(0, total)
        .sort((a, b) => a.i - b.i)
        .map((r) => r.d);
      leftoverReady = ranked.slice(total).flatMap((r) => r.d.stops);
      reasons.push(
        `Sua viagem tem ${total} ${total === 1 ? "dia" : "dias"}: escolhemos os dias do roteiro "${input.ready.title}" que mais combinam com você.`,
      );
    } else {
      days = base;
      reasons.push(`Partimos do roteiro pronto "${input.ready.title}", feito pela equipe Viajou.`);
    }
  }

  if (days.length < total && input.places?.length) {
    const used = days.flatMap((d) => d.stops.map((s) => s.title));
    const fresh = input.places.filter((x) => !coveredBy(x.name, used));
    const extra = daysFromPlaces(fresh, p);
    if (extra.length) {
      if (source === "nenhum") source = "lugares";
      days.push(...extra.slice(0, total - days.length));
      reasons.push("Incluímos lugares avaliados por viajantes do Viajou neste destino.");
    }
  }

  // Atrações reais que ainda não aparecem no roteiro (nem com outro nome ou idioma).
  const usedTitles = () => days.flatMap((d) => d.stops.map((s) => s.title));
  const pool = dedupeAttractions(input.attractions ?? [])
    .filter((x) => normalizePlace(x.name) !== normalizePlace(input.destinationName ?? ""))
    .filter((x) => attractionScore(x, p) > -3)
    .filter((x) => !coveredBy(x.name, usedTitles()))
    .map((a, i) => ({ a, i, score: attractionScore(a, p) }))
    .sort((x, y) => y.score - x.score || x.i - y.i)
    .map((x) => x.a);
  if (days.length < total && pool.length) {
    const extra = daysFromAttractions(pool, p, total - days.length);
    if (extra.length) {
      if (source === "nenhum") source = "atracoes";
      days.push(...extra);
      reasons.push(
        "Completamos com pontos turísticos conhecidos do destino, agrupados pela proximidade.",
      );
    }
  }

  // Ajusta ritmo e gostos e faz a validação contra repetições.
  days = days.map((d) => (d.kind === "planejado" ? trimDay(d, p) : d));
  days = validateTrip(days, p, styles);
  const plannedDays = days.filter((d) => d.kind === "planejado").length;

  // Faltou conteúdo novo e relevante: um dia de sugestões opcionais e o resto livre.
  const nearby = input.nearby ?? [];
  if (days.length < total && nearby.length) {
    days.push({
      kind: "opcional",
      title: "Dia de sugestões opcionais",
      stops: [],
      options: nearby.slice(0, 4).map((c) => `Bate-volta a ${c.name} (cerca de ${c.km} km)`),
    });
  }
  while (days.length < total) days.push(freeDay(p, styles));
  if (plannedDays < total) {
    reasons.push(
      `Montamos ${plannedDays} ${plannedDays === 1 ? "dia completo" : "dias completos"} com experiências diferentes. Para não repetir programas nem inventar atividades, ${
        total - plannedDays === 1
          ? "o outro dia ficou"
          : `os outros ${total - plannedDays} dias ficaram`
      } com sugestões opcionais ou livre.`,
    );
  }

  if (p.pace === "leve")
    reasons.push("Você prefere um ritmo tranquilo: deixamos no máximo 2 programas por dia.");
  if (p.pace === "intenso")
    reasons.push("Você quer aproveitar ao máximo: mantivemos até 4 programas por dia.");
  if (p.dislikes.length)
    reasons.push(
      `Tiramos o que você disse que não curte (${p.dislikes.map((d) => interestLabel[d]).join(", ")}).`,
    );
  if (p.likes.length)
    reasons.push(
      `Demos prioridade ao que você gosta: ${p.likes.map((d) => interestLabel[d]).join(", ")}.`,
    );
  if (p.limitedMobility)
    reasons.push("Evitamos trilhas e passeios de muito esforço por causa da mobilidade.");

  // "Você ainda pode conhecer": o que é relevante e ficou de fora.
  const finalTitles = days.flatMap((d) => d.stops.map((s) => s.title));
  const moreToSee: BuiltTrip["moreToSee"] = [];
  for (const s of leftoverReady) {
    if (!coveredBy(s.title, [...finalTitles, ...moreToSee.map((m) => m.title)]))
      moreToSee.push({ title: s.title, note: s.note });
  }
  for (const a of pool) {
    if (!coveredBy(a.name, [...finalTitles, ...moreToSee.map((m) => m.title)]))
      moreToSee.push({ title: a.name, note: attractionKindLabel[a.kind] });
  }
  if (!days.some((d) => d.kind === "opcional"))
    for (const c of nearby.slice(0, 2))
      moreToSee.push({ title: `Bate-volta a ${c.name}`, note: `Cidade a cerca de ${c.km} km` });

  const tips: string[] = [];
  if (p.kids)
    tips.push(
      "Com crianças: intercale passeios longos com pausas e confira meia-entrada e gratuidade nos ingressos.",
    );
  if (p.couple) tips.push("Reserve um jantar especial ou um pôr do sol para a última noite.");
  if (p.solo)
    tips.push(
      "Viajando sozinho: passeios em grupo e walking tours são ótimos para conhecer gente.",
    );
  if (p.budget)
    tips.push(
      "Para economizar: almoço executivo, transporte público e atrações gratuitas nos dias certos.",
    );
  if (p.limitedMobility)
    tips.push("Avise a hospedagem sobre acessibilidade e prefira quartos perto do elevador.");
  if (p.likes.includes("noite") && !p.kids)
    tips.push("Deixe o dia seguinte às noites mais animadas com programação leve.");

  return { days, reasons, tips, moreToSee: moreToSee.slice(0, 8), plannedDays, source };
}

export const interestLabel: Record<Interest, string> = {
  praia: "praia",
  historia: "história",
  museus: "museus",
  gastronomia: "gastronomia",
  natureza: "natureza",
  aventura: "aventura",
  trilha: "trilhas",
  noite: "vida noturna",
  compras: "compras",
  fotografia: "fotografia",
};
