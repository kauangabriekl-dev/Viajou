"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, one, rows, tx } from "@/lib/db/client";
import { refreshPlaceRating } from "@/lib/db/rules";
import { friendlyError, type ActionResult } from "@/lib/errors";
import type { PlaceType } from "@/types/database";
import { fieldErrors, reviewSchema } from "@/lib/validation";

export async function createReview(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const scores: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (key.startsWith("score_") && typeof value === "string" && value !== "")
      scores[key.slice(6)] = value;
  }
  const parsed = reviewSchema.safeParse({
    placeId: formData.get("placeId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body"),
    visitedOn: formData.get("visitedOn") ?? "",
    scores,
  });
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para avaliar." };
  const input = parsed.data;

  const place = await one<{ slug: string; type: PlaceType }>(
    "SELECT slug, type FROM places WHERE id = $1",
    [input.placeId],
  );
  if (!place) return { ok: false, error: "Lugar não encontrado." };

  // Só aceita critérios válidos para o tipo do lugar.
  const allowed = await rows<{ id: number; key: string }>(
    `SELECT rc.id, rc."key" AS "key" FROM place_categories pc
       JOIN review_categories rc ON rc.id = pc.review_category_id WHERE pc.place_type = $1`,
    [place.type],
  );
  const categoryByKey = new Map(allowed.map((a) => [a.key, a.id]));

  const reviewId = crypto.randomUUID();
  try {
    // Avaliação, notas por critério e média do lugar juntas: ou entra tudo, ou nada.
    await tx(async (client) => {
      await exec(
        "INSERT INTO reviews (id, place_id, user_id, rating, title, body, visited_on) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          reviewId,
          input.placeId,
          session.userId,
          input.rating,
          input.title ?? null,
          input.body,
          input.visitedOn ?? null,
        ],
        client,
      );
      for (const [key, score] of Object.entries(input.scores)) {
        const categoryId = categoryByKey.get(key);
        if (!categoryId) continue;
        await exec(
          "INSERT INTO review_category_scores (review_id, category_id, score) VALUES ($1, $2, $3)",
          [reviewId, categoryId, score],
          client,
        );
      }
      await refreshPlaceRating(input.placeId, client);
    });
  } catch (error) {
    // Uma avaliação por usuário por lugar (UNIQUE no banco).
    if ((error as { code?: string }).code === "23505")
      return { ok: false, error: "Você já avaliou este lugar." };
    return { ok: false, error: friendlyError(error as Error, "createReview") };
  }

  revalidatePath(`/lugares/${place.slug}`);
  return { ok: true, message: "Avaliação publicada. Obrigado por compartilhar!" };
}

export async function deleteReview(reviewId: string, placeSlug: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(reviewId).success) return { ok: false, error: "Avaliação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  try {
    const deleted = await tx(async (client) => {
      const review = await one<{ place_id: string }>(
        "SELECT place_id FROM reviews WHERE id = $1 AND user_id = $2",
        [reviewId, session.userId],
        client,
      );
      if (!review) return 0;
      await exec(
        "DELETE FROM reviews WHERE id = $1 AND user_id = $2",
        [reviewId, session.userId],
        client,
      );
      await refreshPlaceRating(review.place_id, client);
      return 1;
    });
    if (!deleted) return { ok: false, error: "Você só pode excluir suas próprias avaliações." };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "deleteReview") };
  }
  revalidatePath(`/lugares/${placeSlug}`);
  return { ok: true };
}
