import type {
  ComplaintCategory,
  ComplaintStatus,
  NotificationType,
  PlaceType,
  ReportReason,
  ReportTarget,
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
