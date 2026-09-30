"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
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
  const { supabase, userId } = session;
  const input = parsed.data;

  const { data: place } = await supabase
    .from("places")
    .select("slug, type")
    .eq("id", input.placeId)
    .maybeSingle<{ slug: string; type: PlaceType }>();
  if (!place) return { ok: false, error: "Lugar não encontrado." };

  // Só aceita critérios válidos para o tipo do lugar.
  const { data: allowed } = await supabase
    .from("place_categories")
    .select("category:review_categories(id, key)")
    .eq("place_type", place.type)
    .overrideTypes<{ category: { id: number; key: string } }[], { merge: false }>();
  const categoryByKey = new Map((allowed ?? []).map((a) => [a.category.key, a.category.id]));

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      place_id: input.placeId,
      user_id: userId,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      visited_on: input.visitedOn ?? null,
    })
    .select("id")
    .single<{ id: string }>();
  if (error?.code === "23505") return { ok: false, error: "Você já avaliou este lugar." };
  if (error || !review) return { ok: false, error: friendlyError(error, "createReview") };

  const scoreRows = Object.entries(input.scores)
    .filter(([key]) => categoryByKey.has(key))
    .map(([key, score]) => ({ review_id: review.id, category_id: categoryByKey.get(key), score }));
  if (scoreRows.length) {
    const { error: scoreError } = await supabase.from("review_category_scores").insert(scoreRows);
    if (scoreError) friendlyError(scoreError, "review scores"); // avaliação principal já foi salva
  }

  revalidatePath(`/lugares/${place.slug}`);
  return { ok: true, message: "Avaliação publicada. Obrigado por compartilhar!" };
}

export async function deleteReview(reviewId: string, placeSlug: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(reviewId).success) return { ok: false, error: "Avaliação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { error } = await session.supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", session.userId);
  if (error) return { ok: false, error: friendlyError(error, "deleteReview") };
  revalidatePath(`/lugares/${placeSlug}`);
  return { ok: true };
}
