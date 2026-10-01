/**
 * Fotos de licença livre usadas como capa de destinos e na home.
 * Todas vêm do Wikimedia Commons, estão em public/images e exigem crédito
 * (autor + licença + link), exibido junto da foto e na página /creditos.
 *
 * Relatos, avaliações e reclamações continuam só com fotos reais dos usuários.
 */
export type PhotoCredit = {
  src: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
};

export type HeroPhoto = PhotoCredit & { label: string; place: string };

/** Fundo da home: troca entre mar, neve e pôr do sol (components/home/HeroBackdrop.tsx). */
export const HERO_PHOTOS: HeroPhoto[] = [
  {
    label: "Mar",
    place: "Ubatuba, SP",
    src: "/images/hero.jpg",
    title: "Vista aérea da Praia do Tapiá em Ubatuba",
    author: "João Paulo Marques D'Andretta",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_da_Praia_do_Tapi%C3%A1_em_Ubatuba.jpg",
  },
  {
    label: "Neve",
    place: "Monte Norikura, Japão",
    src: "/images/hero-neve.jpg",
    title: "Monte Norikura coberto de neve",
    author: "Raita Futo",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Mount_Norikura_Volcano_Panorama_-_Flickr_-_%E9%9B%B7%E5%A4%AA.jpg",
  },
  {
    label: "Pôr do sol",
    place: "Praia do Jacaré, PB",
    src: "/images/hero-por-do-sol.jpg",
    title: "Pôr do sol na Praia do Jacaré",
    author: "Ruy Carvalho",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:P%C3%B4r_do_Sol_Praia_do_Jacar%C3%A9_-_PB.jpg",
  },
];

/** Capas por slug de destino. */
export const DESTINATION_PHOTOS: Record<string, PhotoCredit> = {
  "porto-seguro-ba": {
    src: "/images/destinos/porto-seguro-ba.jpg",
    title: "Porto Seguro",
    author: "Jackeline Gomes",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Porto_Seguro.1.jpg",
  },
  "florianopolis-sc": {
    src: "/images/destinos/florianopolis-sc.jpg",
    title: "Praias e dunas de Florianópolis",
    author: "Maikon Almeida",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Praias_e_Dunas_de_Florian%C3%B3pilis_01.jpg",
  },
  "rio-de-janeiro-rj": {
    src: "/images/destinos/rio-de-janeiro-rj.jpg",
    title: "Pão de Açúcar",
    author: "Boaventuravinicius",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source: "https://commons.wikimedia.org/wiki/File:P%C3%A3o_de_A%C3%A7%C3%BAcar_2020.jpg",
  },
  "gramado-rs": {
    src: "/images/destinos/gramado-rs.jpg",
    title: "Gramado, Rio Grande do Sul",
    author: "Augusto Janiski Junior",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:GRAMADO_-_RIO_GRANDE_DO_SUL_-_BRASIL_BY_AUGUSTO_JANISCKI_JUNIOR_(14281900109).jpg",
  },
  "fortaleza-ce": {
    src: "/images/destinos/fortaleza-ce.jpg",
    title: "Beira Mar, Praia de Iracema",
    author: "Joao Albuquerque",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Beira_Mar_-_Praia_de_Iracema_-_Fortaleza.jpg",
  },
};

export type Cover = { src: string; credit: PhotoCredit | null };

/** Capa do destino: a foto cadastrada no banco tem prioridade; depois, a foto livre local. */
export function destinationCover(slug: string, coverUrl?: string | null): Cover | null {
  if (coverUrl) return { src: coverUrl, credit: null };
  const photo = DESTINATION_PHOTOS[slug];
  return photo ? { src: photo.src, credit: photo } : null;
}

export const ALL_PHOTOS: PhotoCredit[] = [...HERO_PHOTOS, ...Object.values(DESTINATION_PHOTOS)];
