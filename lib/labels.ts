import type {
  AchadoCategory,
  DestinationStyle,
  ComplaintCategory,
  ComplaintStatus,
  NotificationType,
  PlaceType,
  ReportReason,
  ReportTarget,
  TipTopic,
} from "@/types/database";

export const placeTypeLabels: Record<PlaceType, string> = {
  hotel: "Hospedagem",
  restaurant: "Restaurante",
  beach: "Praia",
  attraction: "Atração",
  tour: "Passeio",
  other: "Outro",
};

export const placeTypePlural: Record<PlaceType, string> = {
  hotel: "Hospedagens",
  restaurant: "Restaurantes",
  beach: "Praias",
  attraction: "Atrações",
  tour: "Passeios",
  other: "Outros lugares",
};

export const complaintCategoryLabels: Record<ComplaintCategory, string> = {
  billing: "Cobrança",
  customer_service: "Atendimento",
  reservation: "Reserva",
  service: "Serviço",
  cleanliness: "Limpeza",
  advertising: "Propaganda",
  other: "Outro",
};

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  pending: "Aguardando resposta",
  answered: "Respondida",
  resolved: "Resolvida",
  closed: "Encerrada",
};

export const reportReasonLabels: Record<ReportReason, string> = {
  spam: "Spam",
  offensive: "Conteúdo ofensivo",
  false_information: "Informação falsa",
  fraud: "Fraude",
  inappropriate: "Conteúdo inadequado",
  other: "Outro",
};

export const reportTargetLabels: Record<ReportTarget, string> = {
  post: "publicação",
  comment: "comentário",
  review: "avaliação",
  profile: "usuário",
  photo: "foto",
  place: "lugar",
  achado: "achadinho",
};

export const notificationLabels: Record<NotificationType, string> = {
  follow: "começou a seguir você",
  post_like: "curtiu sua publicação",
  comment: "comentou na sua publicação",
  comment_reply: "respondeu seu comentário",
  itinerary_saved: "salvou seu roteiro",
  business_response: "respondeu sua reclamação",
};

/** Preferências de viagem, usadas em roteiros, publicações e no "Vou viajar". */
export const travelTags = [
  { value: "praia", label: "Praia" },
  { value: "historia", label: "História" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "natureza", label: "Natureza" },
  { value: "aventura", label: "Aventura" },
  { value: "economico", label: "Econômico" },
  { value: "familia", label: "Família" },
  { value: "casal", label: "Casal" },
] as const;

export type TravelTag = (typeof travelTags)[number]["value"];
export const travelTagValues = travelTags.map((t) => t.value) as [TravelTag, ...TravelTag[]];
export const tagLabel = (value: string) =>
  travelTags.find((t) => t.value === value)?.label ?? value;

export const tipTopics: { value: TipTopic; label: string; hint: string }[] = [
  {
    value: "melhor_epoca",
    label: "Melhor época",
    hint: "Quando ir, clima, alta e baixa temporada",
  },
  { value: "cafe_da_manha", label: "Café da manhã", hint: "Onde tomar um bom café da manhã" },
  { value: "onde_comer", label: "Onde comer", hint: "Restaurantes, comida local, bom e barato" },
  { value: "onde_ficar", label: "Onde ficar", hint: "Bairros e regiões para se hospedar" },
  { value: "passeios", label: "Passeios", hint: "O que não dá para perder" },
  { value: "custo", label: "Custo", hint: "Quanto se gasta e como economizar" },
  { value: "transporte", label: "Transporte", hint: "Como chegar e como se locomover" },
];
export const tipTopicValues = tipTopics.map((t) => t.value) as [TipTopic, ...TipTopic[]];
export const tipTopicLabel = (value: string) =>
  tipTopics.find((t) => t.value === value)?.label ?? value;

export const monthShort = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
export const monthLong = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const achadoCategories: { value: AchadoCategory; label: string }[] = [
  { value: "praia", label: "Praia escondida" },
  { value: "mirante", label: "Mirante" },
  { value: "trilha", label: "Trilha" },
  { value: "cachoeira", label: "Cachoeira" },
  { value: "comida", label: "Comida" },
  { value: "cafe", label: "Café" },
  { value: "compras", label: "Compras" },
  { value: "cultura", label: "Cultura" },
  { value: "outro", label: "Outro" },
];
export const achadoCategoryValues = achadoCategories.map((c) => c.value) as [
  AchadoCategory,
  ...AchadoCategory[],
];
export const achadoCategoryLabel = (value: string) =>
  achadoCategories.find((c) => c.value === value)?.label ?? value;

/** Estilos de destino (filtro em /destinos). A ordem aqui é a ordem dos chips. */
export const destinationStyles: { value: DestinationStyle; label: string }[] = [
  { value: "praia", label: "Praia" },
  { value: "frio", label: "Frio e neve" },
  { value: "montanha", label: "Montanha" },
  { value: "trilha", label: "Trilha" },
  { value: "floresta", label: "Floresta" },
  { value: "cachoeira", label: "Cachoeira" },
  { value: "cidade", label: "Cidade" },
  { value: "historico", label: "Histórico" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "aventura", label: "Aventura" },
];
export const destinationStyleValues = destinationStyles.map((s) => s.value) as [
  DestinationStyle,
  ...DestinationStyle[],
];
export const destinationStyleLabel = (value: string) =>
  destinationStyles.find((s) => s.value === value)?.label ?? value;
