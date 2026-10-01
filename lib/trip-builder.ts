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
export type BuiltDay = { title: string; stops: BuiltStop[] };

export type PlacePick = {
  name: string;
  type: "hotel" | "restaurant" | "beach" | "attraction" | "tour" | "other";
  slug?: string;
};

export type BuiltTrip = {
  days: BuiltDay[];
  reasons: string[];
  tips: string[];
  /** De onde veio a base do roteiro. */
  source: "pronto" | "lugares" | "estilo";
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

const STYLE_DAYS: Partial<Record<DestinationStyle, BuiltDay>> = {
  praia: {
    title: "Dia de praia sem pressa",
    stops: [
      {
        period: "manha",
        title: "Praia mais calma da região",
        note: "Chegue cedo para pegar lugar e mar mais tranquilo.",
      },
      {
        period: "tarde",
        title: "Almoço pé na areia",
        note: "Peixe ou frutos do mar do dia, sem horário para voltar.",
      },
    ],
  },
  gastronomia: {
    title: "Roteiro de sabores",
    stops: [
      {
        period: "manha",
        title: "Mercado ou feira local",
        note: "O melhor jeito de conhecer os ingredientes da região.",
      },
      {
        period: "noite",
        title: "Jantar com prato típico",
        note: "Pergunte aos moradores onde eles comem.",
      },
    ],
  },
  historico: {
    title: "Centro histórico a pé",
    stops: [
      {
        period: "manha",
        title: "Caminhada pelo centro antigo",
        note: "Muitas cidades têm passeios a pé gratuitos com guia local.",
      },
      {
        period: "tarde",
        title: "Museu ou igreja principal",
        note: "Confira o horário: muitos fecham um dia por semana.",
      },
    ],
  },
  montanha: {
    title: "Mirantes e paisagens",
    stops: [
      {
        period: "manha",
        title: "Mirante mais alto da região",
        note: "De manhã a visibilidade costuma ser melhor.",
      },
      { period: "tarde", title: "Café com vista", note: "Tempo para descansar e fotografar." },
    ],
  },
  cidade: {
    title: "A cidade como os moradores",
    stops: [
      {
        period: "manha",
        title: "Bairro fora do circuito turístico",
        note: "Cafés, praças e comércio local.",
      },
      {
        period: "noite",
        title: "Região de bares e restaurantes",
        note: "Bom para sentir o ritmo da cidade à noite.",
      },
    ],
  },
};

const FREE_DAY: BuiltDay = {
  title: "Dia livre",
  stops: [
    {
      period: "dia",
      title: "Voltar ao lugar favorito da viagem",
      note: "Ou descansar: um dia sem programação evita o cansaço acumulado.",
    },
  ],
};

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

/** Dias montados com os lugares cadastrados (atrações, praias e restaurantes). */
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
    days.push({ title: chunk[0].name, stops });
  }
  return days;
}

export function buildTrip(input: {
  days: number;
  profile: TravelerProfile;
  ready?: ReadyItinerary | null;
  places?: PlacePick[];
  styles?: DestinationStyle[];
}): BuiltTrip {
  const p = input.profile;
  const total = Math.max(1, Math.min(14, input.days));
  const reasons: string[] = [];
  let source: BuiltTrip["source"] = "estilo";
  let days: BuiltDay[] = [];

  if (input.ready) {
    source = "pronto";
    const base = input.ready.days.map((d) => ({ ...d, stops: [...d.stops] }));
    if (base.length > total) {
      // Escolhe os dias que mais combinam com a pessoa, mantendo a ordem original.
      const ranked = base
        .map((d, i) => ({ d, i, score: d.stops.reduce((acc, s) => acc + stopScore(s, p), 0) }))
        .sort((a, b) => b.score - a.score || a.i - b.i)
        .slice(0, total)
        .sort((a, b) => a.i - b.i);
      days = ranked.map((r) => r.d);
      reasons.push(
        `Sua viagem tem ${total} ${total === 1 ? "dia" : "dias"}: escolhemos os dias do roteiro de ${input.ready.title.toLowerCase()} que mais combinam com você.`,
      );
    } else {
      days = base;
      reasons.push(`Partimos do roteiro pronto "${input.ready.title}", feito pela equipe Viajou.`);
    }
  }

  if (days.length < total && input.places?.length) {
    const extra = daysFromPlaces(input.places, p);
    if (extra.length) {
      if (source === "estilo") source = "lugares";
      days.push(...extra.slice(0, total - days.length));
      reasons.push("Incluímos lugares avaliados por viajantes do Viajou neste destino.");
    }
  }

  if (days.length < total) {
    const themes = (input.styles ?? [])
      .map((s) => STYLE_DAYS[s])
      .filter((d): d is BuiltDay => Boolean(d));
    let t = 0;
    while (days.length < total) {
      const theme = themes[t];
      days.push(theme ?? FREE_DAY);
      t++;
      if (!theme && t > themes.length + 1) {
        while (days.length < total) days.push(FREE_DAY);
      }
    }
  }

  days = days.map((d) => trimDay(d, p)).map((d) => (d.stops.length ? d : FREE_DAY));

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

  return { days, reasons, tips, source };
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
