/**
 * Bate-voltas turísticos consagrados a partir de cada destino. Lista curada: só entram
 * passeios que viajantes de fato fazem (nunca "a cidade mais próxima no mapa").
 * Distâncias aproximadas por estrada (ou o meio de transporte indicado).
 */
export type DayTrip = { name: string; distance: string; why: string };

export const DAY_TRIPS: Record<string, DayTrip[]> = {
  "rio-de-janeiro-rj": [
    {
      name: "Petrópolis",
      distance: "cerca de 70 km",
      why: "Cidade imperial na serra, com o Museu Imperial.",
    },
    {
      name: "Búzios",
      distance: "cerca de 170 km",
      why: "Península com dezenas de praias e a Rua das Pedras.",
    },
  ],
  "sao-paulo-sp": [
    {
      name: "Embu das Artes",
      distance: "cerca de 30 km",
      why: "Centro histórico com feira de artesanato nos fins de semana.",
    },
    {
      name: "Santos",
      distance: "cerca de 75 km",
      why: "Orla com jardins, centro histórico e o Museu do Café.",
    },
  ],
  "florianopolis-sc": [
    {
      name: "Guarda do Embaú",
      distance: "cerca de 50 km",
      why: "Praia de surfe atravessando o rio, dentro de uma área de proteção.",
    },
  ],
  "salvador-ba": [
    {
      name: "Praia do Forte",
      distance: "cerca de 80 km",
      why: "Vila de praia com piscinas naturais e o Projeto Tamar.",
    },
    {
      name: "Morro de São Paulo",
      distance: "cerca de 2 h de catamarã",
      why: "Ilha sem carros, com praias numeradas.",
    },
  ],
  "gramado-rs": [
    {
      name: "Vale dos Vinhedos",
      distance: "cerca de 100 km",
      why: "Vinícolas da Serra Gaúcha, perto de Bento Gonçalves.",
    },
  ],
  "paraty-rj": [
    {
      name: "Cunha",
      distance: "cerca de 50 km",
      why: "Cidade serrana conhecida pela cerâmica em forno a lenha.",
    },
    {
      name: "Saco do Mamanguá",
      distance: "de barco",
      why: "Fiorde tropical cercado de mata atlântica.",
    },
  ],
  "porto-seguro-ba": [
    { name: "Caraíva", distance: "cerca de 65 km", why: "Vila sem carros entre o rio e o mar." },
  ],
  "lisboa-pt": [
    {
      name: "Sintra",
      distance: "cerca de 30 km",
      why: "Palácios e quintas na serra, como o Palácio da Pena.",
    },
    {
      name: "Cascais",
      distance: "cerca de 30 km",
      why: "Vila de praia na costa, com a Boca do Inferno.",
    },
    { name: "Óbidos", distance: "cerca de 85 km", why: "Vila medieval murada." },
  ],
  "porto-pt": [
    {
      name: "Vale do Douro",
      distance: "cerca de 100 km",
      why: "Vinhedos em socalcos à beira do rio, Patrimônio Mundial.",
    },
    {
      name: "Guimarães",
      distance: "cerca de 55 km",
      why: "Centro histórico considerado o berço de Portugal.",
    },
  ],
  "roma-it": [
    { name: "Tivoli", distance: "cerca de 30 km", why: "Villa d'Este e Villa Adriana." },
    { name: "Óstia Antiga", distance: "cerca de 30 km", why: "Ruínas do antigo porto de Roma." },
  ],
  "paris-fr": [
    {
      name: "Palácio de Versalhes",
      distance: "cerca de 20 km",
      why: "O palácio e os jardins da corte francesa.",
    },
    { name: "Giverny", distance: "cerca de 75 km", why: "Casa e jardins de Claude Monet." },
  ],
  "barcelona-es": [
    {
      name: "Montserrat",
      distance: "cerca de 60 km",
      why: "Mosteiro numa montanha de formas recortadas.",
    },
    {
      name: "Girona",
      distance: "cerca de 100 km",
      why: "Bairro judeu medieval e casas coloridas à beira do rio.",
    },
  ],
  "madri-es": [
    {
      name: "Toledo",
      distance: "cerca de 70 km",
      why: "Cidade medieval das três culturas, Patrimônio Mundial.",
    },
    { name: "Segóvia", distance: "cerca de 90 km", why: "Aqueduto romano e o Alcázar." },
  ],
  "florenca-it": [
    { name: "Siena", distance: "cerca de 75 km", why: "Piazza del Campo e catedral gótica." },
    { name: "Pisa", distance: "cerca de 85 km", why: "A Torre inclinada e a Piazza dei Miracoli." },
  ],
  "veneza-it": [
    {
      name: "Murano e Burano",
      distance: "de vaporetto",
      why: "Ilhas do vidro soprado e das casas coloridas.",
    },
  ],
  "londres-gb": [
    { name: "Windsor", distance: "cerca de 40 km", why: "Castelo de Windsor, residência real." },
    {
      name: "Oxford",
      distance: "cerca de 90 km",
      why: "Cidade universitária com faculdades históricas.",
    },
  ],
  "amsterda-nl": [
    {
      name: "Haarlem",
      distance: "cerca de 20 km",
      why: "Centro histórico tranquilo e o Museu Frans Hals.",
    },
  ],
  "buenos-aires-ar": [
    { name: "Tigre", distance: "cerca de 30 km", why: "Delta do Paraná com passeios de barco." },
    {
      name: "Colonia del Sacramento",
      distance: "cerca de 1 h de balsa",
      why: "Bairro histórico colonial no Uruguai.",
    },
  ],
  "cusco-pe": [
    {
      name: "Machu Picchu",
      distance: "de trem até Aguas Calientes",
      why: "A cidadela inca; exige ingresso com horário.",
    },
    {
      name: "Vale Sagrado",
      distance: "cerca de 60 km",
      why: "Pisac, Ollantaytambo e mercados andinos.",
    },
  ],
  "cidade-do-mexico-mx": [
    { name: "Teotihuacán", distance: "cerca de 50 km", why: "Pirâmides do Sol e da Lua." },
  ],
  "cairo-eg": [
    { name: "Saqqara", distance: "cerca de 30 km", why: "A pirâmide de degraus de Djoser." },
  ],
  "marrakech-ma": [
    {
      name: "Vale do Ourika",
      distance: "cerca de 60 km",
      why: "Vilas berberes e cachoeiras no Atlas.",
    },
    { name: "Essaouira", distance: "cerca de 190 km", why: "Cidade murada à beira do Atlântico." },
  ],
  "toquio-jp": [
    { name: "Kamakura", distance: "cerca de 50 km", why: "O Grande Buda e templos zen." },
    {
      name: "Nikko",
      distance: "cerca de 150 km",
      why: "Santuários ornamentados em meio à floresta.",
    },
  ],
  "quioto-jp": [
    { name: "Nara", distance: "cerca de 45 km", why: "Templo Todai-ji e o parque dos cervos." },
  ],
  "reykjavik-is": [
    {
      name: "Círculo Dourado",
      distance: "cerca de 300 km no total",
      why: "Thingvellir, o gêiser Strokkur e a cachoeira Gullfoss.",
    },
  ],
  "dubai-ae": [
    {
      name: "Abu Dhabi",
      distance: "cerca de 140 km",
      why: "Grande Mesquita Sheikh Zayed e o Louvre Abu Dhabi.",
    },
  ],
  "istambul-tr": [
    {
      name: "Ilhas dos Príncipes",
      distance: "de barco",
      why: "Ilhas sem carros no Mar de Mármara.",
    },
  ],
  "cidade-do-cabo-za": [
    {
      name: "Cabo da Boa Esperança",
      distance: "cerca de 70 km",
      why: "O extremo da península do Cabo.",
    },
    { name: "Stellenbosch", distance: "cerca de 50 km", why: "Região de vinícolas históricas." },
  ],
  "sydney-au": [
    {
      name: "Blue Mountains",
      distance: "cerca de 100 km",
      why: "Mirantes sobre vales de eucaliptos e as Três Irmãs.",
    },
  ],
};

export function dayTripsFor(destinationSlug: string): DayTrip[] {
  return DAY_TRIPS[destinationSlug] ?? [];
}
