/**
 * Roteiros prontos da equipe Viajou: textos próprios, montados com informação pública
 * (atrações, ordem lógica de deslocamento, taxas conhecidas). Servem para quem ainda
 * não sabe que roteiro fazer; a comunidade complementa com o roteiro sugerido por votos.
 * Preços mudam: aqui só há a faixa de orçamento e o que costuma ser cobrado à parte.
 */
import type { DestinationStyle } from "@/types/database";

export type ReadyPeriod = "manha" | "tarde" | "noite" | "dia";

export type ReadyStop = { period: ReadyPeriod; title: string; note: string };

export type ReadyDay = { title: string; stops: ReadyStop[] };

export type ReadyItinerary = {
  slug: string;
  title: string;
  place: string;
  country: string;
  region: "brasil" | "internacional";
  /** Slug do destino no Viajou, quando existe, para ligar as páginas. */
  destinationSlug?: string;
  days: ReadyDay[];
  styles: DestinationStyle[];
  /** Meses de 1 a 12. */
  bestMonths: number[];
  budget: 1 | 2 | 3;
  summary: string;
  base: { area: string; why: string }[];
  extraCosts: string[];
  tips: string[];
};

export const readyPeriodLabel: Record<ReadyPeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  dia: "Dia todo",
};

export const budgetLabel: Record<ReadyItinerary["budget"], string> = {
  1: "Econômico",
  2: "Moderado",
  3: "Mais caro",
};

export const READY_ITINERARIES: ReadyItinerary[] = [
  {
    slug: "fernando-de-noronha-5-dias",
    destinationSlug: "fernando-de-noronha-pe",
    title: "Fernando de Noronha em 5 dias",
    place: "Fernando de Noronha",
    country: "Brasil",
    region: "brasil",
    styles: ["praia", "trilha", "aventura"],
    bestMonths: [8, 9, 10, 11, 12],
    budget: 3,
    summary:
      "Cinco dias bastam para ver os dois mares da ilha: o Mar de Dentro, calmo e voltado para o continente, e o Mar de Fora, com ondas e piscinas naturais. Comece pelo panorama e deixe as praias mais disputadas para os dias com agendamento.",
    days: [
      {
        title: "Chegada e Vila dos Remédios",
        stops: [
          {
            period: "tarde",
            title: "Vila dos Remédios",
            note: "Centro histórico da ilha, com a igreja e as ruínas do forte. Bom para se situar no primeiro dia.",
          },
          {
            period: "noite",
            title: "Pôr do sol no Forte do Boldró",
            note: "Mirante clássico de fim de tarde, de frente para o Morro Dois Irmãos.",
          },
        ],
      },
      {
        title: "Panorama da ilha",
        stops: [
          {
            period: "manha",
            title: "Passeio de ilha guiado",
            note: "Volta de carro pelos principais mirantes e praias, ideal para decidir onde voltar com calma.",
          },
          {
            period: "tarde",
            title: "Baía do Sancho",
            note: "Acesso por escadas dentro de fendas na rocha. Leve snorkel.",
          },
          {
            period: "tarde",
            title: "Mirante da Baía dos Porcos",
            note: "Vista do Dois Irmãos; a praia só é boa com maré baixa.",
          },
        ],
      },
      {
        title: "Mar de Fora",
        stops: [
          {
            period: "manha",
            title: "Praia do Atalaia",
            note: "Piscina natural com número limitado de visitantes por dia: agende no centro de visitantes do parque.",
          },
          {
            period: "tarde",
            title: "Praia do Sueste",
            note: "Boa para nadar com tartarugas, com área de snorkel orientada.",
          },
          {
            period: "tarde",
            title: "Praia do Leão",
            note: "Mar mais forte, ótima para caminhar e ver a desova de tartarugas na temporada.",
          },
        ],
      },
      {
        title: "Mar de Dentro pelo barco",
        stops: [
          {
            period: "manha",
            title: "Passeio de barco pela costa",
            note: "Costuma passar pela área dos golfinhos-rotadores, que aparecem cedo.",
          },
          {
            period: "tarde",
            title: "Mirante dos Golfinhos",
            note: "Ponto alto sobre a Baía dos Golfinhos, onde o banho é proibido para proteger os animais.",
          },
          {
            period: "noite",
            title: "Praia da Conceição",
            note: "Pôr do sol aos pés do Morro do Pico.",
          },
        ],
      },
      {
        title: "Cacimba do Padre e despedida",
        stops: [
          {
            period: "manha",
            title: "Praia da Cacimba do Padre",
            note: "Faixa larga de areia; no inverno recebe surfistas.",
          },
          {
            period: "tarde",
            title: "Praia do Cachorro e Meio",
            note: "Perto da vila, boa para o último mergulho antes do voo.",
          },
        ],
      },
    ],
    base: [
      { area: "Vila dos Remédios", why: "Perto de restaurantes e da vida noturna." },
      {
        area: "Floresta Nova / Vila do Trinta",
        why: "Pousadas mais em conta e central para os deslocamentos.",
      },
    ],
    extraCosts: [
      "Taxa de Preservação Ambiental, cobrada por dia de permanência.",
      "Ingresso do Parque Nacional Marinho, exigido para as praias e trilhas do parque.",
      "Passeios de barco, mergulho e transporte (buggy alugado ou ônibus da ilha).",
    ],
    tips: [
      "Reserve com antecedência: hospedagem e voos são limitados.",
      "Atalaia e algumas trilhas têm vagas por dia; agende logo ao chegar.",
      "O ônibus que corta a ilha pela BR-363 resolve boa parte dos deslocamentos.",
    ],
  },
  {
    slug: "arraial-do-cabo-3-dias",
    destinationSlug: "arraial-do-cabo-rj",
    title: "Arraial do Cabo em 3 dias",
    place: "Arraial do Cabo",
    country: "Brasil",
    region: "brasil",
    styles: ["praia", "trilha", "aventura"],
    bestMonths: [1, 2, 3, 4, 10, 11, 12],
    budget: 1,
    summary:
      "Água muito clara e fria por causa da ressurgência, praias de areia branca e um dos melhores pontos de mergulho do Sudeste. Em três dias dá para fazer o barco, uma trilha e uma praia mais tranquila.",
    days: [
      {
        title: "Passeio de barco",
        stops: [
          {
            period: "manha",
            title: "Passeio de barco pelas praias",
            note: "Normalmente para nas Prainhas do Pontal do Atalaia e na Praia do Farol, que só recebe barcos autorizados.",
          },
          {
            period: "tarde",
            title: "Gruta Azul",
            note: "Vista do barco; a cor da água muda com a luz da tarde.",
          },
          {
            period: "noite",
            title: "Praia dos Anjos",
            note: "Cais dos barcos e restaurantes de frutos do mar.",
          },
        ],
      },
      {
        title: "Mirantes e Prainhas",
        stops: [
          {
            period: "manha",
            title: "Mirante do Pontal do Atalaia",
            note: "Vá cedo para pegar a escadaria das Prainhas antes de lotar.",
          },
          {
            period: "tarde",
            title: "Praia Grande",
            note: "Faixa extensa e mar aberto; bom pôr do sol.",
          },
        ],
      },
      {
        title: "Trilha e mergulho",
        stops: [
          {
            period: "manha",
            title: "Trilha da Praia do Forno",
            note: "Caminhada curta saindo da Praia dos Anjos, com mirante no meio.",
          },
          {
            period: "tarde",
            title: "Mergulho de batismo ou snorkel",
            note: "Operadoras locais saem da Praia dos Anjos; visibilidade costuma ser alta.",
          },
        ],
      },
    ],
    base: [
      { area: "Praia dos Anjos", why: "Perto do cais de onde saem os barcos." },
      { area: "Centro / Praia Grande", why: "Mais opções de pousada e restaurantes." },
    ],
    extraCosts: [
      "Passeio de barco e mergulho.",
      "Taxa de embarque cobrada no cais em alguns passeios.",
    ],
    tips: [
      "Feriados lotam a cidade e os barcos; prefira dias de semana.",
      "A água é fria o ano inteiro: um short de neoprene ajuda no mergulho.",
    ],
  },
  {
    slug: "paraty-4-dias",
    destinationSlug: "paraty-rj",
    title: "Paraty em 4 dias",
    place: "Paraty",
    country: "Brasil",
    region: "brasil",
    styles: ["historico", "praia", "cachoeira", "gastronomia"],
    bestMonths: [4, 5, 6, 7, 8, 9],
    budget: 2,
    summary:
      "Centro histórico colonial, ilhas na baía, cachoeiras na serra e as praias de Trindade. Quatro dias permitem um dia para cada um desses lados da cidade.",
    days: [
      {
        title: "Centro histórico",
        stops: [
          {
            period: "manha",
            title: "Ruas de pedra do centro",
            note: "Caminhe sem pressa; o calçamento irregular pede tênis.",
          },
          {
            period: "tarde",
            title: "Igreja de Santa Rita",
            note: "Cartão-postal da cidade, à beira d'água.",
          },
          {
            period: "noite",
            title: "Restaurantes do centro",
            note: "A cidade é forte em cozinha autoral e frutos do mar.",
          },
        ],
      },
      {
        title: "Ilhas da baía",
        stops: [
          {
            period: "dia",
            title: "Passeio de escuna ou lancha",
            note: "Paradas para banho em ilhas e praias só acessíveis pelo mar.",
          },
        ],
      },
      {
        title: "Serra e cachoeiras",
        stops: [
          {
            period: "manha",
            title: "Caminho do Ouro",
            note: "Trecho preservado da antiga estrada colonial, visitado com guia.",
          },
          {
            period: "tarde",
            title: "Cachoeira do Tobogã",
            note: "Pedra lisa onde se escorrega até o poço. Cuidado com a água após chuva.",
          },
          {
            period: "tarde",
            title: "Alambiques da estrada Paraty–Cunha",
            note: "Paraty tem tradição em cachaça artesanal.",
          },
        ],
      },
      {
        title: "Trindade",
        stops: [
          {
            period: "manha",
            title: "Praia do Meio e Cachadaço",
            note: "Trilha curta até a Piscina Natural do Cachadaço; vá na maré baixa.",
          },
          {
            period: "tarde",
            title: "Praia do Cepilho",
            note: "Pedras grandes e ondas para surfe.",
          },
        ],
      },
    ],
    base: [
      { area: "Centro histórico", why: "Tudo a pé à noite, mas é mais caro e pode ter barulho." },
      { area: "Jabaquara / Pontal", why: "Pousadas mais tranquilas a poucos minutos do centro." },
    ],
    extraCosts: [
      "Passeio de barco.",
      "Guia para o Caminho do Ouro.",
      "Estacionamento perto do centro.",
    ],
    tips: [
      "Na maré alta de lua cheia a água entra em algumas ruas do centro.",
      "Para Trindade, saia cedo: a estrada e o estacionamento lotam.",
    ],
  },
  {
    slug: "porto-de-galinhas-4-dias",
    destinationSlug: "porto-de-galinhas-pe",
    title: "Porto de Galinhas em 4 dias",
    place: "Porto de Galinhas",
    country: "Brasil",
    region: "brasil",
    styles: ["praia"],
    bestMonths: [9, 10, 11, 12, 1, 2],
    budget: 2,
    summary:
      "Piscinas naturais formadas pelos recifes, praias de água morna e bate-voltas para Carneiros e Maracaípe. Planeje os dias pela tábua de marés.",
    days: [
      {
        title: "Piscinas naturais",
        stops: [
          {
            period: "manha",
            title: "Jangada até as piscinas naturais",
            note: "Só funciona com maré baixa; confira a tábua antes.",
          },
          {
            period: "tarde",
            title: "Vila de Porto de Galinhas",
            note: "Ruas de lojinhas e as esculturas de galinha espalhadas pela vila.",
          },
        ],
      },
      {
        title: "Muro Alto e Cupe",
        stops: [
          {
            period: "dia",
            title: "Praia de Muro Alto",
            note: "Um recife longo forma uma grande piscina de água calma, boa para crianças.",
          },
        ],
      },
      {
        title: "Maracaípe",
        stops: [
          {
            period: "manha",
            title: "Pontal de Maracaípe",
            note: "Passeio de jangada no mangue para ver cavalos-marinhos.",
          },
          {
            period: "tarde",
            title: "Praia de Maracaípe",
            note: "Ondas fortes, ponto de surfe; pôr do sol no pontal.",
          },
        ],
      },
      {
        title: "Praia dos Carneiros",
        stops: [
          {
            period: "dia",
            title: "Bate-volta a Carneiros",
            note: "Coqueiral, água calma e a pequena Igreja de São Benedito na areia.",
          },
        ],
      },
    ],
    base: [
      { area: "Vila", why: "Tudo a pé, com restaurantes e saída das jangadas." },
      { area: "Muro Alto", why: "Resorts e mar calmo, mas depende de carro ou transfer." },
    ],
    extraCosts: ["Jangadas e passeios.", "Day use ou transfer para Carneiros."],
    tips: [
      "Não pise nos corais nem alimente os peixes nas piscinas.",
      "Combine os passeios com os dias de maré mais baixa da sua viagem.",
    ],
  },
  {
    slug: "lencois-maranhenses-4-dias",
    destinationSlug: "lencois-maranhenses-ma",
    title: "Lençóis Maranhenses em 4 dias",
    place: "Barreirinhas e Atins",
    country: "Brasil",
    region: "brasil",
    styles: ["aventura", "trilha"],
    bestMonths: [6, 7, 8, 9],
    budget: 2,
    summary:
      "Dunas brancas com lagoas de água da chuva entre elas. A melhor época é logo depois do período de chuvas, quando as lagoas estão cheias. Barreirinhas é a base mais comum e Atins é a opção mais isolada.",
    days: [
      {
        title: "Circuito da Lagoa Azul",
        stops: [
          {
            period: "tarde",
            title: "Lagoa Azul e lagoas vizinhas",
            note: "Travessia de 4x4 e caminhada pelas dunas; fique para o pôr do sol.",
          },
        ],
      },
      {
        title: "Circuito da Lagoa Bonita",
        stops: [
          {
            period: "tarde",
            title: "Lagoa Bonita",
            note: "A subida da duna é íngreme; a vista do alto mostra a imensidão do parque.",
          },
        ],
      },
      {
        title: "Rio Preguiças",
        stops: [
          {
            period: "dia",
            title: "Passeio de barco pelo Preguiças",
            note: "Paradas em Vassouras (pequenos Lençóis e macacos-prego), no farol de Mandacaru e em Caburé.",
          },
        ],
      },
      {
        title: "Atins",
        stops: [
          {
            period: "dia",
            title: "Atins e os Lençóis pelo outro lado",
            note: "Vila de areia, kitesurf e acesso a lagoas menos movimentadas.",
          },
        ],
      },
    ],
    base: [
      { area: "Barreirinhas", why: "Mais estrutura e saída da maioria dos passeios." },
      { area: "Atins", why: "Vila pequena e tranquila, perto do mar e do kitesurf." },
    ],
    extraCosts: [
      "Passeios de 4x4 e barco com agências credenciadas.",
      "Transfer de São Luís até Barreirinhas.",
    ],
    tips: [
      "As lagoas ficam cheias de junho a setembro; fora disso podem estar secas.",
      "Areia quente: vá descalço só no fim da tarde.",
    ],
  },
  {
    slug: "chapada-das-mesas-4-dias",
    destinationSlug: "chapada-das-mesas-ma",
    title: "Chapada das Mesas em 4 dias",
    place: "Carolina",
    country: "Brasil",
    region: "brasil",
    styles: ["cachoeira", "trilha", "aventura"],
    bestMonths: [5, 6, 7, 8, 9],
    budget: 1,
    summary:
      "Cerrado maranhense com chapadões em forma de mesa, cachoeiras grandes e poços de água azul. Carolina é a base, e quase todas as atrações ficam em propriedades particulares com taxa de visita.",
    days: [
      {
        title: "Pedra Caída",
        stops: [
          {
            period: "dia",
            title: "Complexo da Pedra Caída",
            note: "Cânion com a cachoeira do Santuário; há tirolesa e trilhas guiadas.",
          },
        ],
      },
      {
        title: "Poços azuis",
        stops: [
          {
            period: "manha",
            title: "Poço Azul",
            note: "Água transparente; chegue cedo para pegar a luz entrando.",
          },
          { period: "tarde", title: "Encanto Azul", note: "Outro poço próximo, com flutuação." },
        ],
      },
      {
        title: "Santa Bárbara",
        stops: [
          {
            period: "dia",
            title: "Cachoeira de Santa Bárbara",
            note: "Fica em Riachão; a água azul cai num poço cercado de mata.",
          },
        ],
      },
      {
        title: "Cachoeiras do Itapecuru",
        stops: [
          {
            period: "manha",
            title: "Cachoeiras de Itapecuru",
            note: "Perto de Carolina, com quedas largas e poços para banho.",
          },
          {
            period: "tarde",
            title: "Portal da Chapada",
            note: "Formação rochosa em arco, ótima no fim da tarde.",
          },
        ],
      },
    ],
    base: [{ area: "Carolina", why: "Base mais completa e próxima das principais atrações." }],
    extraCosts: [
      "Taxas de entrada nas propriedades.",
      "Passeios em 4x4: estradas de terra pedem veículo alto.",
    ],
    tips: [
      "Na seca (maio a setembro) as águas ficam mais claras e as estradas melhores.",
      "Leve dinheiro: alguns atrativos não aceitam cartão.",
    ],
  },
  {
    slug: "gramado-e-canela-3-dias",
    title: "Gramado e Canela em 3 dias",
    place: "Gramado",
    country: "Brasil",
    region: "brasil",
    destinationSlug: "gramado-rs",
    styles: ["frio", "montanha", "gastronomia"],
    bestMonths: [5, 6, 7, 8, 12],
    budget: 3,
    summary:
      "Serra gaúcha com arquitetura de inspiração europeia, inverno frio e muita comida boa. Três dias cobrem Gramado, Canela e um café colonial sem pressa.",
    days: [
      {
        title: "Centro de Gramado",
        stops: [
          {
            period: "manha",
            title: "Lago Negro",
            note: "Passeio a pé ou de pedalinho em volta do lago cercado de pinheiros.",
          },
          {
            period: "tarde",
            title: "Rua Coberta e Avenida Borges de Medeiros",
            note: "Coração da cidade, com lojas de chocolate.",
          },
          { period: "noite", title: "Fondue", note: "Prato típico das noites frias da serra." },
        ],
      },
      {
        title: "Canela",
        stops: [
          {
            period: "manha",
            title: "Parque do Caracol",
            note: "Mirante e escadaria até a base da Cascata do Caracol.",
          },
          {
            period: "tarde",
            title: "Catedral de Pedra",
            note: "Igreja em estilo gótico no centro de Canela.",
          },
          {
            period: "tarde",
            title: "Café colonial",
            note: "Mesa farta de pães, cucas, geleias e frios típicos.",
          },
        ],
      },
      {
        title: "Parques temáticos e lago",
        stops: [
          {
            period: "manha",
            title: "Mini Mundo",
            note: "Miniaturas de construções famosas; bom com crianças.",
          },
          { period: "tarde", title: "Lago Joaquina Rita Bier", note: "Vista calma no fim do dia." },
        ],
      },
    ],
    base: [
      { area: "Centro de Gramado", why: "Tudo a pé, inclusive à noite." },
      { area: "Canela", why: "Costuma ser mais barato e fica a poucos minutos." },
    ],
    extraCosts: [
      "Ingressos de parques e atrações.",
      "Café colonial e fondue têm preço fixo por pessoa.",
    ],
    tips: [
      "Em julho e no Natal Luz a cidade lota: reserve cedo.",
      "Neve é rara; o frio forte é garantido no inverno.",
    ],
  },
  {
    slug: "rio-de-janeiro-5-dias",
    title: "Rio de Janeiro em 5 dias",
    place: "Rio de Janeiro",
    country: "Brasil",
    region: "brasil",
    destinationSlug: "rio-de-janeiro-rj",
    styles: ["praia", "cidade", "montanha", "trilha"],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 2,
    summary:
      "Praias urbanas, mirantes famosos, trilhas na mata e um centro histórico cheio de museus. O roteiro agrupa as atrações por região para cortar o tempo no trânsito.",
    days: [
      {
        title: "Cristo e Santa Teresa",
        stops: [
          {
            period: "manha",
            title: "Cristo Redentor",
            note: "Vá no primeiro horário do trem do Corcovado, antes das nuvens e das filas.",
          },
          {
            period: "tarde",
            title: "Santa Teresa",
            note: "Bairro de ladeiras, ateliês e o bondinho.",
          },
          {
            period: "noite",
            title: "Escadaria Selarón e Lapa",
            note: "Os Arcos da Lapa e música ao vivo à noite.",
          },
        ],
      },
      {
        title: "Pão de Açúcar e Urca",
        stops: [
          {
            period: "tarde",
            title: "Pão de Açúcar",
            note: "Suba no fim da tarde para ver o pôr do sol do alto.",
          },
          {
            period: "noite",
            title: "Mureta da Urca",
            note: "Programa carioca de fim de dia, de frente para a baía.",
          },
        ],
      },
      {
        title: "Zona Sul na praia",
        stops: [
          {
            period: "manha",
            title: "Copacabana",
            note: "Calçadão e praia; caminhe até o Forte de Copacabana.",
          },
          {
            period: "tarde",
            title: "Ipanema e Leblon",
            note: "Praia, com mais estrutura de quiosques.",
          },
          {
            period: "noite",
            title: "Pôr do sol no Arpoador",
            note: "O lugar mais concorrido do fim de tarde no Rio.",
          },
        ],
      },
      {
        title: "Centro e Porto",
        stops: [
          {
            period: "manha",
            title: "Museu do Amanhã e Boulevard Olímpico",
            note: "Região do porto revitalizada, com murais.",
          },
          {
            period: "tarde",
            title: "Centro histórico",
            note: "Confeitaria Colombo, Theatro Municipal e Real Gabinete Português de Leitura.",
          },
        ],
      },
      {
        title: "Natureza na cidade",
        stops: [
          {
            period: "manha",
            title: "Trilha do Morro Dois Irmãos",
            note: "Sobe pelo Vidigal; vista de Ipanema e Lagoa. Vá com guia local.",
          },
          {
            period: "tarde",
            title: "Jardim Botânico",
            note: "Aleia das palmeiras-imperiais e estufas.",
          },
          {
            period: "tarde",
            title: "Lagoa Rodrigo de Freitas",
            note: "Volta de bicicleta ao redor da lagoa.",
          },
        ],
      },
    ],
    base: [
      { area: "Copacabana", why: "Muita oferta de hotel e metrô." },
      { area: "Ipanema / Leblon", why: "Mais caro, mais tranquilo e perto da praia." },
      { area: "Botafogo", why: "Bom custo e fácil para o centro e a Zona Sul." },
    ],
    extraCosts: ["Trem do Corcovado e bondinho do Pão de Açúcar.", "Guia para trilhas."],
    tips: [
      "Compre os ingressos do Cristo e do Pão de Açúcar com horário marcado.",
      "Leve só o necessário para a praia e use o metrô entre os bairros.",
    ],
  },
  {
    slug: "florianopolis-5-dias",
    title: "Florianópolis em 5 dias",
    place: "Florianópolis",
    country: "Brasil",
    region: "brasil",
    destinationSlug: "florianopolis-sc",
    styles: ["praia", "trilha", "gastronomia"],
    bestMonths: [12, 1, 2, 3],
    budget: 2,
    summary:
      "A ilha tem praias para todos os gostos: calmas ao norte, com ondas no leste e preservadas no sul. Dividir os dias por região evita o trânsito das pontes e da SC-401.",
    days: [
      {
        title: "Centro e Santo Antônio de Lisboa",
        stops: [
          {
            period: "manha",
            title: "Mercado Público",
            note: "Prédio histórico com boxes de frutos do mar.",
          },
          {
            period: "manha",
            title: "Ponte Hercílio Luz",
            note: "Cartão-postal da cidade, aberta para pedestres.",
          },
          {
            period: "noite",
            title: "Santo Antônio de Lisboa",
            note: "Vila açoriana com pôr do sol e ostras.",
          },
        ],
      },
      {
        title: "Lagoa e leste",
        stops: [
          {
            period: "manha",
            title: "Dunas da Joaquina",
            note: "Sandboard nas dunas ao lado da praia.",
          },
          {
            period: "tarde",
            title: "Praia Mole",
            note: "Areia grossa e mar forte, ponto de surfe.",
          },
          {
            period: "noite",
            title: "Lagoa da Conceição",
            note: "Bares e restaurantes à beira da lagoa.",
          },
        ],
      },
      {
        title: "Sul da ilha",
        stops: [
          {
            period: "manha",
            title: "Ilha do Campeche",
            note: "Barco da Praia do Campeche ou da Armação; visitas são limitadas por dia.",
          },
          {
            period: "tarde",
            title: "Ribeirão da Ilha",
            note: "Casario açoriano e as ostras cultivadas na baía.",
          },
        ],
      },
      {
        title: "Trilha da Lagoinha do Leste",
        stops: [
          {
            period: "dia",
            title: "Lagoinha do Leste",
            note: "Praia selvagem acessível só por trilha, saindo do Pântano do Sul ou da Armação.",
          },
        ],
      },
      {
        title: "Norte da ilha",
        stops: [
          {
            period: "manha",
            title: "Praia de Jurerê",
            note: "Mar calmo e estrutura de praia completa.",
          },
          {
            period: "tarde",
            title: "Fortaleza de São José da Ponta Grossa",
            note: "Fortificação do século XVIII com vista para o mar.",
          },
        ],
      },
    ],
    base: [
      { area: "Lagoa da Conceição", why: "Central para leste, sul e vida noturna." },
      { area: "Norte da ilha", why: "Mar calmo, bom para famílias." },
    ],
    extraCosts: ["Barco para a Ilha do Campeche.", "Aluguel de prancha de sandboard."],
    tips: [
      "Carro ajuda muito, mas evite os horários de pico nas pontes.",
      "Na alta temporada, a Ilha do Campeche esgota: reserve o barco cedo.",
    ],
  },
  {
    slug: "porto-seguro-5-dias",
    title: "Porto Seguro, Arraial d'Ajuda e Trancoso em 5 dias",
    place: "Porto Seguro",
    country: "Brasil",
    region: "brasil",
    destinationSlug: "porto-seguro-ba",
    styles: ["praia", "historico"],
    bestMonths: [9, 10, 11, 12, 1, 2, 3],
    budget: 2,
    summary:
      "Porto Seguro tem a história e as barracas animadas; Arraial d'Ajuda e Trancoso, do outro lado do rio, têm vilas charmosas e praias com falésias. A balsa liga os dois lados.",
    days: [
      {
        title: "Cidade Histórica",
        stops: [
          {
            period: "manha",
            title: "Cidade Histórica",
            note: "No alto da cidade, com casario colonial e o Marco do Descobrimento.",
          },
          {
            period: "noite",
            title: "Passarela do Descobrimento",
            note: "Rua de restaurantes, artesanato e barracas de drinques.",
          },
        ],
      },
      {
        title: "Recife de Fora",
        stops: [
          {
            period: "manha",
            title: "Passeio ao Recife de Fora",
            note: "Piscinas naturais em alto-mar, só com maré baixa.",
          },
          {
            period: "tarde",
            title: "Praias de Taperapuã",
            note: "Orla norte, com as grandes barracas de praia.",
          },
        ],
      },
      {
        title: "Arraial d'Ajuda",
        stops: [
          {
            period: "manha",
            title: "Praia do Pitinga",
            note: "Falésias coloridas e mar calmo na maré baixa.",
          },
          {
            period: "noite",
            title: "Rua do Mucugê",
            note: "Ruela com restaurantes e lojas, animada à noite.",
          },
        ],
      },
      {
        title: "Trancoso",
        stops: [
          {
            period: "manha",
            title: "Quadrado",
            note: "Gramado com casinhas coloridas e a igreja de São João Batista.",
          },
          {
            period: "tarde",
            title: "Praia dos Coqueiros",
            note: "Desça pela escadaria do Quadrado.",
          },
        ],
      },
      {
        title: "Praia do Espelho",
        stops: [
          {
            period: "dia",
            title: "Praia do Espelho",
            note: "Piscinas formadas pelos recifes na maré baixa, entre falésias.",
          },
        ],
      },
    ],
    base: [
      { area: "Porto Seguro (orla norte)", why: "Mais barato e com muitas opções." },
      { area: "Arraial d'Ajuda", why: "No meio do caminho entre Porto Seguro e Trancoso." },
    ],
    extraCosts: ["Balsa para Arraial d'Ajuda.", "Passeio de barco ao Recife de Fora."],
    tips: [
      "Confira a tábua de marés antes do Recife de Fora e da Praia do Espelho.",
      "Para o Espelho, vá cedo: a estrada de terra é longa.",
    ],
  },
  {
    slug: "fortaleza-5-dias",
    title: "Fortaleza e litoral cearense em 5 dias",
    place: "Fortaleza",
    country: "Brasil",
    region: "brasil",
    destinationSlug: "fortaleza-ce",
    styles: ["praia", "cidade", "aventura"],
    bestMonths: [7, 8, 9, 10, 11, 12],
    budget: 1,
    summary:
      "Sol quase o ano todo, orla animada na capital e bate-voltas para praias com dunas e falésias. Use Fortaleza como base e faça um litoral por dia.",
    days: [
      {
        title: "Orla e centro",
        stops: [
          { period: "manha", title: "Mercado Central", note: "Artesanato, castanhas e rendas." },
          {
            period: "tarde",
            title: "Centro Dragão do Mar",
            note: "Centro cultural com museus e planetário.",
          },
          {
            period: "noite",
            title: "Beira-Mar e feirinha",
            note: "Calçadão com a feira de artesanato à noite.",
          },
        ],
      },
      {
        title: "Praia do Futuro",
        stops: [
          {
            period: "dia",
            title: "Barracas da Praia do Futuro",
            note: "Estrutura completa e caranguejo, tradição às quintas.",
          },
        ],
      },
      {
        title: "Cumbuco",
        stops: [
          {
            period: "dia",
            title: "Cumbuco de buggy",
            note: "Dunas, lagoas e kitesurf. Combine o roteiro com o bugueiro.",
          },
        ],
      },
      {
        title: "Canoa Quebrada",
        stops: [
          {
            period: "dia",
            title: "Canoa Quebrada",
            note: "Falésias vermelhas, a rua Broadway e passeio de buggy pelas dunas.",
          },
        ],
      },
      {
        title: "Parque aquático ou Lagoinha",
        stops: [
          {
            period: "dia",
            title: "Beach Park ou Praia da Lagoinha",
            note: "Parque aquático em Aquiraz, ou praia de coqueiros e dunas mais ao oeste.",
          },
        ],
      },
    ],
    base: [
      { area: "Meireles / Beira-Mar", why: "Perto da orla, da feirinha e dos restaurantes." },
      { area: "Iracema", why: "Mais barato e perto do Dragão do Mar." },
    ],
    extraCosts: [
      "Passeios de buggy.",
      "Ingresso do parque aquático.",
      "Transfer para os bate-voltas.",
    ],
    tips: ["Use protetor o dia todo: o sol é forte.", "Prefira bugueiros credenciados."],
  },
  {
    slug: "santiago-5-dias",
    destinationSlug: "santiago-cl",
    title: "Santiago do Chile em 5 dias",
    place: "Santiago",
    country: "Chile",
    region: "internacional",
    styles: ["cidade", "frio", "montanha", "gastronomia"],
    bestMonths: [3, 4, 6, 7, 8, 10, 11],
    budget: 2,
    summary:
      "Capital ao pé da Cordilheira dos Andes, com vinícolas a menos de uma hora, neve no inverno e o litoral de Valparaíso perto. Funciona bem em qualquer estação, com programas diferentes.",
    days: [
      {
        title: "Centro histórico",
        stops: [
          {
            period: "manha",
            title: "Plaza de Armas e La Moneda",
            note: "Catedral, prédios coloniais e o palácio do governo.",
          },
          {
            period: "tarde",
            title: "Cerro Santa Lucía",
            note: "Morro no centro, com escadarias e mirante.",
          },
          { period: "noite", title: "Lastarria", note: "Bairro de cafés e restaurantes." },
        ],
      },
      {
        title: "Mirantes e Bellavista",
        stops: [
          {
            period: "manha",
            title: "Cerro San Cristóbal",
            note: "Funicular ou teleférico até a imagem da Virgem, com vista da cidade e da cordilheira.",
          },
          {
            period: "tarde",
            title: "La Chascona",
            note: "Casa-museu de Pablo Neruda em Bellavista.",
          },
          {
            period: "noite",
            title: "Sky Costanera",
            note: "Mirante no alto do maior prédio da América do Sul.",
          },
        ],
      },
      {
        title: "Vinícola",
        stops: [
          {
            period: "dia",
            title: "Vinícolas do Vale do Maipo",
            note: "Várias têm visitas guiadas com degustação; algumas dá para chegar de metrô.",
          },
        ],
      },
      {
        title: "Cordilheira",
        stops: [
          {
            period: "dia",
            title: "Valle Nevado / Farellones (inverno) ou Cajón del Maipo",
            note: "De junho a setembro, neve e esqui. No resto do ano, Embalse El Yeso no Cajón del Maipo.",
          },
        ],
      },
      {
        title: "Valparaíso e Viña del Mar",
        stops: [
          {
            period: "dia",
            title: "Bate-volta ao litoral",
            note: "Ladeiras coloridas e elevadores de Valparaíso, com a orla de Viña ao lado.",
          },
        ],
      },
    ],
    base: [
      { area: "Providencia", why: "Seguro, com metrô e muitos restaurantes." },
      { area: "Lastarria / Bellavista", why: "Perto do centro e da vida noturna." },
    ],
    extraCosts: [
      "Passeios para a neve com transporte e roupas alugadas.",
      "Degustações nas vinícolas.",
    ],
    tips: [
      "No inverno, alugue roupa de neve em Santiago, junto com o passeio.",
      "O cartão Bip! serve para metrô e ônibus.",
    ],
  },
  {
    slug: "barcelona-4-dias",
    destinationSlug: "barcelona-es",
    title: "Barcelona em 4 dias",
    place: "Barcelona",
    country: "Espanha",
    region: "internacional",
    styles: ["cidade", "historico", "praia", "gastronomia"],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 3,
    summary:
      "As obras de Gaudí, o bairro medieval, praia urbana e muita comida. Compre antes os ingressos com horário marcado das atrações mais disputadas.",
    days: [
      {
        title: "Gaudí essencial",
        stops: [
          {
            period: "manha",
            title: "Sagrada Família",
            note: "Ingresso com horário marcado; a luz dos vitrais é mais bonita de manhã ou no fim da tarde.",
          },
          {
            period: "tarde",
            title: "Casa Batlló e La Pedrera",
            note: "As duas casas ficam no Passeig de Gràcia.",
          },
        ],
      },
      {
        title: "Cidade medieval",
        stops: [
          { period: "manha", title: "Bairro Gótico", note: "Catedral e ruelas medievais." },
          {
            period: "tarde",
            title: "El Born e Museu Picasso",
            note: "Bairro de lojinhas e a igreja de Santa Maria del Mar.",
          },
          {
            period: "noite",
            title: "La Rambla e Mercado da Boqueria",
            note: "Vá ao mercado de dia; à noite, tapas no Born.",
          },
        ],
      },
      {
        title: "Park Güell e Gràcia",
        stops: [
          {
            period: "manha",
            title: "Park Güell",
            note: "A área monumental exige ingresso com horário.",
          },
          {
            period: "tarde",
            title: "Bairro de Gràcia",
            note: "Praças com bares e clima de bairro.",
          },
          {
            period: "noite",
            title: "Bunkers del Carmel",
            note: "Mirante com vista de 360° para o pôr do sol.",
          },
        ],
      },
      {
        title: "Montjuïc e praia",
        stops: [
          { period: "manha", title: "Montjuïc", note: "Teleférico, castelo e os jardins." },
          { period: "tarde", title: "Barceloneta", note: "Praia urbana e restaurantes de paella." },
          {
            period: "noite",
            title: "Font Màgica",
            note: "Show de luz e água em dias específicos; confira a agenda.",
          },
        ],
      },
    ],
    base: [
      { area: "Eixample", why: "Central, bem servido de metrô e perto das obras de Gaudí." },
      { area: "Gràcia", why: "Clima de bairro, mais tranquilo." },
    ],
    extraCosts: [
      "Ingressos das obras de Gaudí.",
      "Taxa turística cobrada por noite na hospedagem.",
    ],
    tips: [
      "Cuidado com batedores de carteira na Rambla e no metrô.",
      "O cartão de 10 viagens do transporte compensa para mais de 3 dias.",
    ],
  },
  {
    slug: "cancun-playa-del-carmen-7-dias",
    destinationSlug: "cancun-mx",
    title: "Cancún e Playa del Carmen em 7 dias",
    place: "Cancún",
    country: "México",
    region: "internacional",
    styles: ["praia", "historico", "aventura"],
    bestMonths: [12, 1, 2, 3, 4],
    budget: 3,
    summary:
      "O Caribe mexicano junta mar azul-turquesa, ruínas maias e cenotes, os poços de água doce da península de Yucatán. Divida a semana entre Cancún e Playa del Carmen.",
    days: [
      {
        title: "Zona Hotelera",
        stops: [
          {
            period: "dia",
            title: "Praias da Zona Hotelera",
            note: "Playa Delfines tem o mirante com o letreiro de Cancún.",
          },
        ],
      },
      {
        title: "Isla Mujeres",
        stops: [
          {
            period: "dia",
            title: "Isla Mujeres",
            note: "Ferry ou catamarã; Playa Norte e volta de carrinho de golfe pela ilha.",
          },
        ],
      },
      {
        title: "Chichén Itzá",
        stops: [
          {
            period: "dia",
            title: "Chichén Itzá e cenote",
            note: "Uma das sete maravilhas do mundo moderno; o passeio costuma incluir um cenote e Valladolid.",
          },
        ],
      },
      {
        title: "Playa del Carmen",
        stops: [
          {
            period: "tarde",
            title: "Quinta Avenida",
            note: "Rua de pedestres com lojas e restaurantes.",
          },
        ],
      },
      {
        title: "Cozumel",
        stops: [
          {
            period: "dia",
            title: "Cozumel",
            note: "Ferry de Playa; um dos melhores lugares para mergulho e snorkel em recifes.",
          },
        ],
      },
      {
        title: "Tulum e cenotes",
        stops: [
          {
            period: "manha",
            title: "Ruínas de Tulum",
            note: "Ruínas maias sobre o mar; chegue na abertura.",
          },
          {
            period: "tarde",
            title: "Cenotes da região",
            note: "Dos Ojos e outros, para nadar ou mergulhar.",
          },
        ],
      },
      {
        title: "Parque",
        stops: [
          {
            period: "dia",
            title: "Parque Xcaret",
            note: "Rios subterrâneos, cultura mexicana e show à noite.",
          },
        ],
      },
    ],
    base: [
      { area: "Zona Hotelera (Cancún)", why: "Resorts de frente para o mar." },
      { area: "Playa del Carmen", why: "Central para Tulum, Cozumel e os cenotes." },
    ],
    extraCosts: [
      "Ingressos de ruínas e parques.",
      "Ferries.",
      "Taxa ambiental cobrada na saída do estado.",
    ],
    tips: [
      "Use protetor solar biodegradável nos cenotes e no mar.",
      "Entre junho e novembro é temporada de furacões; acompanhe a previsão.",
    ],
  },
  {
    slug: "bangkok-4-dias",
    destinationSlug: "bangkok-th",
    title: "Bangkok em 4 dias",
    place: "Bangkok",
    country: "Tailândia",
    region: "internacional",
    styles: ["cidade", "historico", "gastronomia"],
    bestMonths: [11, 12, 1, 2],
    budget: 1,
    summary:
      "Templos dourados, mercados, rio e comida de rua barata e excelente. Quatro dias dão conta da cidade e de um bate-volta a Ayutthaya.",
    days: [
      {
        title: "Templos do centro antigo",
        stops: [
          {
            period: "manha",
            title: "Grande Palácio e Wat Phra Kaew",
            note: "Abre cedo e lota rápido; ombros e joelhos cobertos.",
          },
          { period: "tarde", title: "Wat Pho", note: "O Buda reclinado gigante." },
          {
            period: "noite",
            title: "Wat Arun ao entardecer",
            note: "Atravesse o rio Chao Phraya de barco.",
          },
        ],
      },
      {
        title: "Mercados",
        stops: [
          {
            period: "manha",
            title: "Mercado flutuante",
            note: "Damnoen Saduak fica fora da cidade; saia bem cedo.",
          },
          { period: "noite", title: "Chinatown (Yaowarat)", note: "Comida de rua à noite." },
        ],
      },
      {
        title: "Ayutthaya",
        stops: [
          {
            period: "dia",
            title: "Bate-volta a Ayutthaya",
            note: "Antiga capital do reino, com ruínas de templos; de trem ou excursão.",
          },
        ],
      },
      {
        title: "Bangkok moderna",
        stops: [
          {
            period: "manha",
            title: "Chatuchak",
            note: "Mercado gigante, aberto nos fins de semana.",
          },
          {
            period: "noite",
            title: "Rooftop e Khao San Road",
            note: "Vista da cidade e a rua dos mochileiros.",
          },
        ],
      },
    ],
    base: [
      { area: "Sukhumvit", why: "Bem servido de BTS/metrô." },
      { area: "Rattanakosin / beira-rio", why: "Perto dos templos." },
    ],
    extraCosts: ["Ingressos dos templos.", "Passeio aos mercados fora da cidade."],
    tips: [
      "Use os barcos do rio e o BTS para fugir do trânsito.",
      "Desconfie de quem diz que o templo está fechado e oferece outro passeio.",
    ],
  },
  {
    slug: "montanhas-rochosas-canada-7-dias",
    destinationSlug: "banff-ca",
    title: "Montanhas Rochosas canadenses em 7 dias",
    place: "Banff e Jasper",
    country: "Canadá",
    region: "internacional",
    styles: ["montanha", "trilha", "floresta", "frio"],
    bestMonths: [6, 7, 8, 9],
    budget: 3,
    summary:
      "Lagos de água turquesa, geleiras e florestas de pinheiro nos parques nacionais de Banff, Yoho e Jasper. Faça de carro a partir de Calgary e reserve um dia inteiro para a Icefields Parkway.",
    days: [
      {
        title: "Calgary a Banff",
        stops: [
          { period: "tarde", title: "Banff Avenue", note: "Vila no meio do parque nacional." },
          {
            period: "noite",
            title: "Banff Gondola",
            note: "Teleférico até o topo da Sulphur Mountain.",
          },
        ],
      },
      {
        title: "Lake Louise e Moraine Lake",
        stops: [
          {
            period: "manha",
            title: "Moraine Lake",
            note: "Carros particulares não sobem: use o ônibus do Parks Canada ou os ônibus de empresas autorizadas.",
          },
          { period: "tarde", title: "Lake Louise", note: "Trilha até a Lake Agnes Tea House." },
        ],
      },
      {
        title: "Yoho",
        stops: [
          { period: "manha", title: "Emerald Lake", note: "Volta pelo lago ou canoa." },
          {
            period: "tarde",
            title: "Natural Bridge e Takakkaw Falls",
            note: "Ponte de pedra e uma das quedas mais altas do Canadá.",
          },
        ],
      },
      {
        title: "Icefields Parkway",
        stops: [
          {
            period: "dia",
            title: "Peyto Lake e Columbia Icefield",
            note: "Mirante do lago em forma de lobo e a geleira Athabasca.",
          },
        ],
      },
      {
        title: "Jasper",
        stops: [
          { period: "manha", title: "Maligne Canyon", note: "Cânion estreito com pontes." },
          { period: "tarde", title: "Maligne Lake", note: "Barco até a Spirit Island." },
        ],
      },
      {
        title: "Jasper com calma",
        stops: [
          {
            period: "dia",
            title: "Trilhas e observação de animais",
            note: "Alces e ursos aparecem ao amanhecer e ao entardecer; mantenha distância.",
          },
        ],
      },
      {
        title: "Volta a Calgary",
        stops: [
          {
            period: "dia",
            title: "Retorno pela Icefields Parkway",
            note: "Pare nos mirantes que ficaram de fora na ida.",
          },
        ],
      },
    ],
    base: [
      {
        area: "Banff / Canmore",
        why: "Base para Banff, Lake Louise e Yoho; Canmore costuma ser mais barato.",
      },
      { area: "Jasper", why: "Para os dias no norte." },
    ],
    extraCosts: [
      "Passe dos parques nacionais, cobrado por dia ou anual.",
      "Gôndolas e passeios de barco.",
      "Ônibus do Parks Canada para Moraine Lake.",
    ],
    tips: [
      "Reserve hospedagem com muitos meses de antecedência no verão.",
      "Leve spray contra urso nas trilhas e aprenda a usar.",
    ],
  },
  {
    slug: "jordania-petra-5-dias",
    destinationSlug: "petra-jo",
    title: "Jordânia: Petra, Wadi Rum e Mar Morto em 5 dias",
    place: "Petra",
    country: "Jordânia",
    region: "internacional",
    styles: ["historico", "aventura", "trilha"],
    bestMonths: [3, 4, 5, 10, 11],
    budget: 2,
    summary:
      "A cidade de pedra dos nabateus, um deserto vermelho e o ponto mais baixo da Terra. A Jordânia é compacta: dá para fazer tudo de carro ou com motorista a partir de Amã.",
    days: [
      {
        title: "Amã e Jerash",
        stops: [
          {
            period: "manha",
            title: "Jerash",
            note: "Ruínas romanas muito preservadas ao norte de Amã.",
          },
          {
            period: "tarde",
            title: "Cidadela de Amã",
            note: "Templo de Hércules e vista da cidade.",
          },
        ],
      },
      {
        title: "Petra",
        stops: [
          {
            period: "manha",
            title: "Siq e o Tesouro",
            note: "Entre cedo para ver o Tesouro sem multidão.",
          },
          { period: "tarde", title: "Tumbas Reais e Teatro", note: "Siga pela rua das colunas." },
          {
            period: "noite",
            title: "Petra by Night",
            note: "O Siq iluminado por velas, só em alguns dias da semana.",
          },
        ],
      },
      {
        title: "Petra a fundo",
        stops: [
          {
            period: "dia",
            title: "Mosteiro (Ad Deir)",
            note: "Subida de cerca de 800 degraus. Vale cada um.",
          },
        ],
      },
      {
        title: "Wadi Rum",
        stops: [
          {
            period: "tarde",
            title: "Passeio de jipe pelo deserto",
            note: "Formações de arenito e dunas vermelhas.",
          },
          { period: "noite", title: "Acampamento beduíno", note: "Céu muito estrelado." },
        ],
      },
      {
        title: "Mar Morto",
        stops: [
          {
            period: "dia",
            title: "Flutuar no Mar Morto",
            note: "Resorts com acesso à praia; não molhe os olhos.",
          },
        ],
      },
    ],
    base: [
      { area: "Wadi Musa", why: "Cidade na entrada de Petra." },
      { area: "Acampamento em Wadi Rum", why: "Para a noite no deserto." },
    ],
    extraCosts: [
      "Jordan Pass: inclui o visto e a entrada de Petra para quem fica 3 noites ou mais.",
      "Jipe e acampamento em Wadi Rum.",
    ],
    tips: [
      "Use sapato confortável: em Petra se anda de 15 a 20 km por dia.",
      "Roupas que cubram ombros e joelhos são bem-vindas fora dos resorts.",
    ],
  },
  {
    slug: "roma-4-dias",
    title: "Roma em 4 dias",
    place: "Roma",
    country: "Itália",
    region: "internacional",
    destinationSlug: "roma-it",
    styles: ["historico", "cidade", "gastronomia"],
    bestMonths: [4, 5, 9, 10],
    budget: 2,
    summary:
      "Dois mil anos de história a pé: o centro antigo, o Vaticano, as praças barrocas e as trattorias de bairro. O roteiro junta atrações vizinhas no mesmo dia e deixa o fim da tarde para caminhar.",
    days: [
      {
        title: "Roma antiga",
        stops: [
          {
            period: "manha",
            title: "Coliseu",
            note: "Entre no primeiro horário. O ingresso com hora marcada costuma incluir o Fórum Romano e o Palatino.",
          },
          {
            period: "tarde",
            title: "Fórum Romano e Monte Palatino",
            note: "Ruínas do centro político da Roma antiga; pouca sombra, leve água.",
          },
          {
            period: "noite",
            title: "Monti",
            note: "Bairro vizinho ao Coliseu, com bares e restaurantes pequenos.",
          },
        ],
      },
      {
        title: "Vaticano",
        stops: [
          {
            period: "manha",
            title: "Museus Vaticanos e Capela Sistina",
            note: "As filas são longas: reserve o horário antes. Ombros e joelhos cobertos.",
          },
          {
            period: "tarde",
            title: "Basílica de São Pedro",
            note: "Entrada gratuita, com fila de segurança; dá para subir na cúpula.",
          },
          {
            period: "noite",
            title: "Castelo Sant'Angelo e a ponte",
            note: "Bonito iluminado, à beira do Tibre.",
          },
        ],
      },
      {
        title: "Praças e fontes",
        stops: [
          {
            period: "manha",
            title: "Panteão",
            note: "Templo romano com a cúpula de concreto mais famosa do mundo.",
          },
          {
            period: "tarde",
            title: "Fontana di Trevi e Piazza Navona",
            note: "Trevi lota o dia todo; cedo ou tarde da noite é mais calmo.",
          },
          {
            period: "noite",
            title: "Escadaria da Praça de Espanha",
            note: "Proibido sentar nos degraus; caminhe até a Via del Corso.",
          },
        ],
      },
      {
        title: "Trastevere e mirantes",
        stops: [
          {
            period: "manha",
            title: "Villa Borghese",
            note: "Parque grande; a Galeria Borghese exige reserva com horário.",
          },
          {
            period: "tarde",
            title: "Trastevere",
            note: "Ruas de pedra e igrejas antigas do outro lado do rio.",
          },
          {
            period: "noite",
            title: "Mirante do Gianicolo",
            note: "Vista da cidade inteira no pôr do sol.",
          },
        ],
      },
    ],
    base: [
      { area: "Centro Storico", why: "Tudo a pé, perto do Panteão e da Navona." },
      { area: "Monti", why: "Perto do Coliseu e do metrô, com bom custo." },
      { area: "Prati", why: "Tranquilo e ao lado do Vaticano." },
    ],
    extraCosts: [
      "Ingressos do Coliseu, dos Museus Vaticanos e da Galeria Borghese.",
      "Taxa turística municipal cobrada por noite na hospedagem.",
    ],
    tips: [
      "Compre os ingressos com hora marcada assim que fechar as datas: esgotam na alta temporada.",
      "Beba água das fontes públicas (nasoni): é potável.",
      "Cuidado com batedores de carteira no metrô e em Trevi.",
    ],
  },
  {
    slug: "paris-4-dias",
    title: "Paris em 4 dias",
    place: "Paris",
    country: "França",
    region: "internacional",
    destinationSlug: "paris-fr",
    styles: ["cidade", "historico", "gastronomia"],
    bestMonths: [4, 5, 6, 9, 10],
    budget: 3,
    summary:
      "Museus, monumentos, bairros com cara de vila e cafés em cada esquina. Quatro dias permitem ver os clássicos e ainda passear sem pressa às margens do Sena.",
    days: [
      {
        title: "Torre Eiffel e o Sena",
        stops: [
          {
            period: "manha",
            title: "Torre Eiffel",
            note: "Reserve a subida com horário; o topo fecha com vento forte.",
          },
          {
            period: "tarde",
            title: "Trocadéro e Champ de Mars",
            note: "Os dois melhores pontos para fotografar a torre.",
          },
          {
            period: "noite",
            title: "Passeio de barco pelo Sena",
            note: "Ao anoitecer, com os monumentos iluminados.",
          },
        ],
      },
      {
        title: "Louvre e centro",
        stops: [
          {
            period: "manha",
            title: "Museu do Louvre",
            note: "Entrada com horário marcado; escolha poucas alas para não cansar.",
          },
          {
            period: "tarde",
            title: "Jardim das Tulherias",
            note: "Caminhe até a Place de la Concorde.",
          },
          {
            period: "noite",
            title: "Champs-Élysées e Arco do Triunfo",
            note: "Suba no arco para ver as avenidas em estrela.",
          },
        ],
      },
      {
        title: "Île de la Cité e Marais",
        stops: [
          {
            period: "manha",
            title: "Catedral de Notre-Dame",
            note: "Reaberta depois do incêndio de 2019; a entrada é gratuita.",
          },
          {
            period: "manha",
            title: "Sainte-Chapelle",
            note: "Capela com vitrais do século XIII; melhor em dia de sol.",
          },
          {
            period: "tarde",
            title: "Le Marais",
            note: "Ruas medievais, lojas e a Place des Vosges.",
          },
        ],
      },
      {
        title: "Montmartre",
        stops: [
          {
            period: "manha",
            title: "Basílica de Sacré-Cœur",
            note: "No alto de Montmartre, com vista da cidade.",
          },
          {
            period: "tarde",
            title: "Place du Tertre",
            note: "Pintores ao ar livre e ruas de ladeira.",
          },
          {
            period: "noite",
            title: "Museu d'Orsay (alternativa)",
            note: "Se chover, troque a tarde pelo museu dos impressionistas.",
          },
        ],
      },
    ],
    base: [
      { area: "Le Marais", why: "Central, animado e a pé de muita coisa." },
      { area: "Saint-Germain-des-Prés", why: "Clássico, perto do Louvre e do Sena." },
      {
        area: "Perto de uma estação de metrô",
        why: "Fora do centro, o metrô resolve tudo e a diária cai.",
      },
    ],
    extraCosts: [
      "Ingressos da Torre Eiffel, do Louvre e dos museus.",
      "Taxa de estadia cobrada por noite na hospedagem.",
    ],
    tips: [
      "Reserve Torre Eiffel e Louvre com antecedência: os horários esgotam.",
      "Muitos museus são gratuitos no primeiro domingo de alguns meses; confira no site de cada um.",
      "Use o metrô: chega a quase todas as atrações.",
    ],
  },
];

export function getReadyItinerary(slug: string) {
  return READY_ITINERARIES.find((r) => r.slug === slug) ?? null;
}

export function readyForDestination(destinationSlug: string) {
  return READY_ITINERARIES.filter((r) => r.destinationSlug === destinationSlug);
}

export type DurationBand = "curto" | "medio" | "longo";

export const durationBands: {
  value: DurationBand;
  label: string;
  test: (days: number) => boolean;
}[] = [
  { value: "curto", label: "Até 3 dias", test: (d) => d <= 3 },
  { value: "medio", label: "4 a 5 dias", test: (d) => d >= 4 && d <= 5 },
  { value: "longo", label: "6 dias ou mais", test: (d) => d >= 6 },
];

export function filterReady({
  region,
  duration,
  style,
}: {
  region?: ReadyItinerary["region"];
  duration?: DurationBand;
  style?: DestinationStyle;
}) {
  const band = durationBands.find((b) => b.value === duration);
  return READY_ITINERARIES.filter(
    (r) =>
      (!region || r.region === region) &&
      (!band || band.test(r.days.length)) &&
      (!style || r.styles.includes(style)),
  );
}
