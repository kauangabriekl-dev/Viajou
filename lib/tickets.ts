/**
 * Ajuda a comprar ingressos: quando o roteiro (ou o destino) cita uma atração famosa,
 * o assistente mostra onde comprar no site oficial e dicas práticas. Os links só levam
 * à página de venda; o Viajou não vende nem intermedeia ingressos.
 * Mantenha aqui apenas sites oficiais conferidos.
 */
import { normalizePlace } from "@/lib/geo-search";

export type Attraction = {
  id: string;
  name: string;
  /** Formas de escrever o nome (comparadas sem acento e em minúsculas). */
  aliases: string[];
  destinationSlug: string;
  officialUrl: string;
  officialLabel: string;
  tips: string[];
};

export const ATTRACTIONS: Attraction[] = [
  {
    id: "coliseu",
    name: "Coliseu, Fórum Romano e Palatino",
    aliases: ["coliseu", "colosseum", "colosseo", "coliseo", "forum romano", "palatino"],
    destinationSlug: "roma-it",
    officialUrl: "https://ticketing.colosseo.it",
    officialLabel: "ticketing.colosseo.it (oficial)",
    tips: [
      "O ingresso tem dia e hora de entrada e costuma incluir o Fórum Romano e o Palatino.",
      "Na alta temporada esgota com semanas de antecedência: compre assim que fechar as datas.",
      "O ingresso é nominal: leve o documento usado na compra.",
    ],
  },
  {
    id: "vaticano",
    name: "Museus Vaticanos e Capela Sistina",
    aliases: ["museus vaticanos", "museu do vaticano", "capela sistina", "vaticano"],
    destinationSlug: "roma-it",
    officialUrl: "https://www.museivaticani.va",
    officialLabel: "museivaticani.va (oficial)",
    tips: [
      "Reserve o horário: sem reserva a fila pode passar de duas horas.",
      "Os museus fecham na maioria dos domingos; confira o calendário no site.",
      "Ombros e joelhos cobertos para entrar na Capela Sistina e na Basílica.",
    ],
  },
  {
    id: "sagrada-familia",
    name: "Sagrada Família",
    aliases: ["sagrada familia"],
    destinationSlug: "barcelona-es",
    officialUrl: "https://sagradafamilia.org",
    officialLabel: "sagradafamilia.org (oficial)",
    tips: [
      "Só entra com horário marcado; não há venda garantida na porta.",
      "A subida às torres é um ingresso à parte e tem poucas vagas.",
    ],
  },
  {
    id: "park-guell",
    name: "Park Güell",
    aliases: ["park guell", "parque guell"],
    destinationSlug: "barcelona-es",
    officialUrl: "https://parkguell.barcelona",
    officialLabel: "parkguell.barcelona (oficial)",
    tips: ["A área monumental exige ingresso com horário; o resto do parque é livre."],
  },
  {
    id: "casa-batllo",
    name: "Casa Batlló",
    aliases: ["casa batllo"],
    destinationSlug: "barcelona-es",
    officialUrl: "https://www.casabatllo.es",
    officialLabel: "casabatllo.es (oficial)",
    tips: ["Comprar on-line costuma sair mais barato que na bilheteria."],
  },
  {
    id: "louvre",
    name: "Museu do Louvre",
    aliases: ["louvre"],
    destinationSlug: "paris-fr",
    officialUrl: "https://www.louvre.fr",
    officialLabel: "louvre.fr (oficial)",
    tips: [
      "A entrada é com horário reservado, inclusive para quem tem direito a gratuidade.",
      "Fecha às terças-feiras.",
    ],
  },
  {
    id: "torre-eiffel",
    name: "Torre Eiffel",
    aliases: ["torre eiffel", "eiffel"],
    destinationSlug: "paris-fr",
    officialUrl: "https://www.toureiffel.paris",
    officialLabel: "toureiffel.paris (oficial)",
    tips: [
      "Os ingressos do elevador até o topo esgotam primeiro; as escadas até o 2º andar são mais baratas.",
      "Com vento forte o topo pode fechar: deixe um dia livre de reserva.",
    ],
  },
  {
    id: "cristo-redentor",
    name: "Cristo Redentor (Trem do Corcovado)",
    aliases: ["cristo redentor", "corcovado"],
    destinationSlug: "rio-de-janeiro-rj",
    officialUrl: "https://www.tremdocorcovado.rio",
    officialLabel: "tremdocorcovado.rio (oficial)",
    tips: [
      "O trem tem horário marcado; os primeiros saem antes das nuvens e das filas.",
      "Em dia nublado a vista some: olhe a previsão antes de comprar.",
    ],
  },
  {
    id: "pao-de-acucar",
    name: "Bondinho Pão de Açúcar",
    aliases: ["pao de acucar", "bondinho"],
    destinationSlug: "rio-de-janeiro-rj",
    officialUrl: "https://bondinho.com.br",
    officialLabel: "bondinho.com.br (oficial)",
    tips: ["Suba no fim da tarde para pegar o pôr do sol e a cidade acendendo."],
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    aliases: ["machu picchu"],
    destinationSlug: "cusco-pe",
    officialUrl: "https://tuboleto.cultura.pe",
    officialLabel: "tuboleto.cultura.pe (oficial)",
    tips: [
      "Há limite diário de visitantes e circuitos com horário: compre com bastante antecedência.",
      "O trem até Aguas Calientes é comprado à parte.",
    ],
  },
  {
    id: "acropole",
    name: "Acrópole",
    aliases: ["acropole", "partenon", "parthenon"],
    destinationSlug: "atenas-gr",
    officialUrl: "https://hhticket.gr",
    officialLabel: "hhticket.gr (oficial)",
    tips: ["Vá na abertura: no verão o calor no alto da colina é forte e há pouca sombra."],
  },
  {
    id: "uffizi",
    name: "Galeria Uffizi",
    aliases: ["uffizi"],
    destinationSlug: "florenca-it",
    officialUrl: "https://www.uffizi.it",
    officialLabel: "uffizi.it (oficial)",
    tips: ["Reserve o horário de entrada para fugir da fila."],
  },
  {
    id: "petra",
    name: "Petra (Jordan Pass)",
    aliases: ["petra", "jordan pass", "siq", "mosteiro ad deir"],
    destinationSlug: "petra-jo",
    officialUrl: "https://www.jordanpass.jo",
    officialLabel: "jordanpass.jo (oficial)",
    tips: [
      "O Jordan Pass inclui a entrada em Petra e dispensa a taxa de visto para quem fica 3 noites ou mais.",
      "Compre antes de embarcar: o passe precisa ser apresentado na chegada.",
    ],
  },
  {
    id: "burj-khalifa",
    name: "Burj Khalifa",
    aliases: ["burj khalifa"],
    destinationSlug: "dubai-ae",
    officialUrl: "https://www.burjkhalifa.ae",
    officialLabel: "burjkhalifa.ae (oficial)",
    tips: ["O horário do pôr do sol é o mais caro e o primeiro a esgotar."],
  },
  {
    id: "cataratas-iguacu",
    name: "Parque Nacional do Iguaçu",
    aliases: ["cataratas do iguacu", "cataratas", "parque nacional do iguacu"],
    destinationSlug: "foz-do-iguacu-pr",
    officialUrl: "https://cataratasdoiguacu.com.br",
    officialLabel: "cataratasdoiguacu.com.br (oficial)",
    tips: ["Leve capa de chuva: as passarelas perto das quedas molham bastante."],
  },
  {
    id: "noronha",
    name: "Parque Nacional Marinho de Fernando de Noronha",
    aliases: ["parque nacional marinho", "atalaia", "baia do sancho"],
    destinationSlug: "fernando-de-noronha-pe",
    officialUrl: "https://www.parnanoronha.com.br",
    officialLabel: "parnanoronha.com.br (oficial)",
    tips: [
      "O ingresso do parque é separado da Taxa de Preservação Ambiental da ilha.",
      "Algumas praias e trilhas exigem agendamento com vagas limitadas por dia.",
    ],
  },
  {
    id: "grande-palacio",
    name: "Grande Palácio de Bangkok",
    aliases: ["grande palacio", "wat phra kaew", "grand palace"],
    destinationSlug: "bangkok-th",
    officialUrl: "https://www.royalgrandpalace.th",
    officialLabel: "royalgrandpalace.th (oficial)",
    tips: [
      "Roupas que cubram ombros e joelhos são obrigatórias.",
      "Desconfie de quem diz na rua que o palácio está fechado: é um golpe conhecido.",
    ],
  },
  {
    id: "disney",
    name: "Walt Disney World",
    aliases: ["disney", "magic kingdom", "epcot"],
    destinationSlug: "orlando-us",
    officialUrl: "https://disneyworld.disney.go.com",
    officialLabel: "disneyworld.disney.go.com (oficial)",
    tips: ["Além do ingresso, alguns parques pedem reserva do dia; confira ao comprar."],
  },
  {
    id: "anne-frank",
    name: "Casa de Anne Frank",
    aliases: ["anne frank"],
    destinationSlug: "amsterda-nl",
    officialUrl: "https://www.annefrank.org",
    officialLabel: "annefrank.org (oficial)",
    tips: ["Só vende on-line, com horário marcado; os ingressos esgotam semanas antes."],
  },
  {
    id: "van-gogh",
    name: "Museu Van Gogh",
    aliases: ["museu van gogh", "van gogh museum"],
    destinationSlug: "amsterda-nl",
    officialUrl: "https://www.vangoghmuseum.nl",
    officialLabel: "vangoghmuseum.nl (oficial)",
    tips: ["Ingresso com horário, vendido apenas on-line."],
  },
  {
    id: "rijksmuseum",
    name: "Rijksmuseum",
    aliases: ["rijksmuseum"],
    destinationSlug: "amsterda-nl",
    officialUrl: "https://www.rijksmuseum.nl",
    officialLabel: "rijksmuseum.nl (oficial)",
    tips: ["Comprar on-line evita a fila da bilheteria."],
  },
  {
    id: "iguazu-argentina",
    name: "Parque Nacional Iguazú (lado argentino)",
    aliases: ["parque nacional iguazu", "garganta do diabo"],
    destinationSlug: "foz-do-iguacu-pr",
    officialUrl: "https://iguazuargentina.com",
    officialLabel: "iguazuargentina.com (oficial)",
    tips: ["Leve documento para cruzar a fronteira e reserve o dia inteiro para o parque."],
  },
  {
    id: "empire-state",
    name: "Empire State Building",
    aliases: ["empire state"],
    destinationSlug: "nova-york-us",
    officialUrl: "https://www.esbnyc.com",
    officialLabel: "esbnyc.com (oficial)",
    tips: ["Comprar on-line com horário evita a fila da bilheteria."],
  },
];

const padded = (s: string) => ` ${normalizePlace(s)} `;

/**
 * Atrações citadas nos textos (nomes de paradas, lugares do roteiro).
 * Com `destinationSlug`, também inclui as atrações famosas do destino.
 */
export function findAttractions(texts: string[], destinationSlug?: string | null): Attraction[] {
  const haystack = texts.map(padded).join(" | ");
  return ATTRACTIONS.filter(
    (a) =>
      (destinationSlug && a.destinationSlug === destinationSlug) ||
      a.aliases.some((alias) => haystack.includes(padded(alias))),
  );
}

/** Busca alternativa para qualquer atração (passeios e ingressos de revendas). */
export function ticketSearchLinks(name: string, city?: string | null) {
  const q = [name, city].filter(Boolean).join(" ");
  return [
    {
      label: "Passeios e ingressos no GetYourGuide",
      url: `https://www.getyourguide.com.br/s/?${new URLSearchParams({ q })}`,
    },
    {
      label: "Passeios no Civitatis",
      url: `https://www.google.com/search?${new URLSearchParams({ q: `site:civitatis.com ${q}` })}`,
    },
    {
      label: "Procurar o site oficial",
      url: `https://www.google.com/search?${new URLSearchParams({ q: `${q} ingresso site oficial` })}`,
    },
  ];
}
