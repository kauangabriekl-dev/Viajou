import { z } from "zod";
import { travelTagValues } from "@/lib/labels";

/** Campos opcionais de formulário chegam como "" — normaliza para undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.iso.date("Data inválida.").optional())
  .optional();

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.uuid().optional())
  .optional();

const rating = z.coerce
  .number({ error: "Escolha uma nota." })
  .int()
  .min(1, "Escolha uma nota de 1 a 5.")
  .max(5, "Escolha uma nota de 1 a 5.");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "Use de 3 a 30 caracteres: letras minúsculas, números ou _.");

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(72, "A senha pode ter no máximo 72 caracteres."),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  password: z.string().min(1, "Informe sua senha."),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Informe seu nome.").max(80),
  username: usernameSchema,
  bio: optionalText(300),
});

export const reviewSchema = z.object({
  placeId: z.uuid(),
  rating,
  title: optionalText(120),
  body: z
    .string()
    .trim()
    .min(10, "Conte um pouco mais (mínimo de 10 caracteres).")
    .max(3000, "Use no máximo 3000 caracteres."),
  visitedOn: optionalDate,
  scores: z.record(z.string(), rating).default({}),
});

const moneyToCents = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return undefined;
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) {
      ctx.addIssue({ code: "custom", message: "Valor inválido." });
      return z.NEVER;
    }
    return Math.round(n * 100);
  })
  .optional();

export const postSchema = z
  .object({
    body: z
      .string()
      .trim()
      .min(10, "Conte um pouco mais sobre a viagem (mínimo de 10 caracteres).")
      .max(5000, "Use no máximo 5000 caracteres."),
    destinationId: optionalUuid,
    hotelPlaceId: optionalUuid,
    placeIds: z.array(z.uuid()).max(20, "Selecione até 20 lugares.").default([]),
    tripStart: optionalDate,
    tripEnd: optionalDate,
    spent: moneyToCents,
    rating: z.preprocess((v) => (v === "" || v === null ? undefined : v), rating.optional()),
    tags: z.array(z.enum(travelTagValues)).default([]),
  })
  .refine((d) => !d.tripStart || !d.tripEnd || d.tripEnd >= d.tripStart, {
    message: "A data final precisa ser igual ou posterior à inicial.",
    path: ["tripEnd"],
  });

export const commentSchema = z.object({
  postId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Escreva um comentário.")
    .max(1000, "Use no máximo 1000 caracteres."),
});

const stopSchema = z
  .object({
    placeId: optionalUuid,
    customName: optionalText(120),
    startTime: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : v))
      .pipe(
        z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")
          .optional(),
      )
      .optional(),
    notes: optionalText(500),
  })
  .refine((s) => s.placeId || s.customName, {
    message: "Cada parada precisa de um lugar ou nome.",
  });

export const itinerarySchema = z.object({
  title: z.string().trim().min(3, "Dê um título ao roteiro.").max(120),
  description: optionalText(2000),
  destinationId: optionalUuid,
  isPublic: z.boolean().default(true),
  tags: z.array(z.enum(travelTagValues)).default([]),
  days: z
    .array(
      z.object({
        title: optionalText(120),
        description: optionalText(1000),
        stops: z.array(stopSchema).max(20, "Até 20 paradas por dia."),
      }),
    )
    .min(1, "Adicione pelo menos um dia.")
    .max(30, "Roteiros podem ter até 30 dias."),
});
export type ItineraryInput = z.input<typeof itinerarySchema>;

export const complaintSchema = z.object({
  placeId: z.uuid(),
  category: z.enum(
    [
      "billing",
      "customer_service",
      "reservation",
      "service",
      "cleanliness",
      "advertising",
      "other",
    ],
    { error: "Escolha uma categoria." },
  ),
  title: z
    .string()
    .trim()
    .min(5, "Resuma o problema em um título (mínimo de 5 caracteres).")
    .max(120),
  description: z
    .string()
    .trim()
    .min(20, "Descreva o que aconteceu (mínimo de 20 caracteres).")
    .max(4000),
});

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "review", "profile", "photo"]),
  targetId: z.uuid(),
  reason: z.enum(["spam", "offensive", "false_information", "fraud", "inappropriate", "other"], {
    error: "Escolha um motivo.",
  }),
  details: optionalText(1000),
});

export const tripPlanSchema = z
  .object({
    destinationId: z.uuid({ error: "Escolha um destino." }),
    startDate: z.iso.date("Informe a data de ida."),
    endDate: z.iso.date("Informe a data de volta."),
    travelers: z.coerce
      .number()
      .int()
      .min(1, "Mínimo de 1 pessoa.")
      .max(50, "Máximo de 50 pessoas."),
    budget: moneyToCents,
    preferences: z.array(z.enum(travelTagValues)).default([]),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "A volta precisa ser no mesmo dia ou depois da ida.",
    path: ["endDate"],
  });

/** Extrai mensagens por campo de um ZodError para exibir nos formulários. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
