/**
 * Destinos famosos no mundo, marcados no globo da home ao lado dos destinos do VIAJOU.
 * Só fatos conhecidos (nome, país, coordenadas e o que tem lá): sem notas nem rankings.
 * Clicar abre o cartão de "lugar ainda sem avaliações", com busca de relatos.
 */
export type WorldHighlight = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  note: string;
};

export const WORLD_HIGHLIGHTS: WorldHighlight[] = [
  {
    id: "orlando",
    name: "Orlando (Disney)",
    country: "Estados Unidos",
    latitude: 28.3852,
    longitude: -81.5639,
    note: "Parques da Walt Disney World e da Universal.",
  },
  {
    id: "nova-york",
    name: "Nova York",
    country: "Estados Unidos",
    latitude: 40.7128,
    longitude: -74.006,
    note: "Times Square, Central Park e Estátua da Liberdade.",
  },
  {
    id: "cancun",
    name: "Cancún",
    country: "México",
    latitude: 21.1619,
    longitude: -86.8515,
    note: "Praias do Caribe mexicano e ruínas maias por perto.",
  },
  {
    id: "machu-picchu",
    name: "Machu Picchu",
    country: "Peru",
    latitude: -13.1631,
    longitude: -72.545,
    note: "Cidade inca nos Andes, perto de Cusco.",
  },
  {
    id: "buenos-aires",
    name: "Buenos Aires",
    country: "Argentina",
    latitude: -34.6037,
    longitude: -58.3816,
    note: "Tango, parrillas e bairros como San Telmo e La Boca.",
  },
  {
    id: "santiago",
    name: "Santiago",
    country: "Chile",
    latitude: -33.4489,
    longitude: -70.6693,
    note: "Capital aos pés dos Andes, perto de vinícolas e estações de esqui.",
  },
  {
    id: "lisboa",
    name: "Lisboa",
    country: "Portugal",
    latitude: 38.7223,
    longitude: -9.1393,
    note: "Bairros históricos, elétricos e o rio Tejo.",
  },
  {
    id: "paris",
    name: "Paris",
    country: "França",
    latitude: 48.8566,
    longitude: 2.3522,
    note: "Torre Eiffel, Louvre e o rio Sena.",
  },
  {
    id: "londres",
    name: "Londres",
    country: "Reino Unido",
    latitude: 51.5074,
    longitude: -0.1278,
    note: "Big Ben, museus gratuitos e o Tâmisa.",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Espanha",
    latitude: 41.3874,
    longitude: 2.1686,
    note: "Obras de Gaudí e praias no Mediterrâneo.",
  },
  {
    id: "roma",
    name: "Roma",
    country: "Itália",
    latitude: 41.9028,
    longitude: 12.4964,
    note: "Coliseu, Vaticano e Fontana di Trevi.",
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egito",
    latitude: 29.9792,
    longitude: 31.1342,
    note: "Pirâmides de Gizé e a Esfinge.",
  },
  {
    id: "cidade-do-cabo",
    name: "Cidade do Cabo",
    country: "África do Sul",
    latitude: -33.9249,
    longitude: 18.4241,
    note: "Montanha da Mesa e o Cabo da Boa Esperança.",
  },
  {
    id: "dubai",
    name: "Dubai",
    country: "Emirados Árabes Unidos",
    latitude: 25.2048,
    longitude: 55.2708,
    note: "Burj Khalifa, deserto e praias no Golfo Pérsico.",
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Tailândia",
    latitude: 13.7563,
    longitude: 100.5018,
    note: "Templos budistas, mercados e comida de rua.",
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonésia",
    latitude: -8.4095,
    longitude: 115.1889,
    note: "Templos, terraços de arroz e praias de surfe.",
  },
  {
    id: "toquio",
    name: "Tóquio",
    country: "Japão",
    latitude: 35.6762,
    longitude: 139.6503,
    note: "Shibuya, templos de Asakusa e o monte Fuji ao longe.",
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Austrália",
    latitude: -33.8688,
    longitude: 151.2093,
    note: "Opera House, Harbour Bridge e praia de Bondi.",
  },
];
