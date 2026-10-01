"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, one, tx } from "@/lib/db/client";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { destinationReviewSchema, fieldErrors, tipSchema } from "@/lib/validation";

const LOGIN_REQUIRED = "Entre na sua conta para continuar.";
const id = z.uuid();

async function destinationSlug(destinationId: string) {
  return (
    (await one<{ slug: string }>("SELECT slug FROM destinations WHERE id = $1", [destinationId]))
      ?.slug ?? null
  );
}

/** Nota do destino como um todo, com melhores meses e gasto por dia. Uma por pessoa. */
export async function createDestinationReview(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = destinationReviewSchema.safeParse({
    destinationId: formData.get("destinationId"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    visitedMonth: formData.get("visitedMonth") ?? "",
    visitedYear: formData.get("visitedYear") ?? "",
    bestMonths: formData.getAll("bestMonths"),
    dailyCost: formData.get("dailyCost") ?? "",
    styles: formData.getAll("styles"),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const d = parsed.data;

  const slug = await destinationSlug(d.destinationId);
  if (!slug) return { ok: false, error: "Destino não encontrado." };

  try {
    await exec(
      `INSERT INTO destination_reviews (id, destination_id, user_id, rating, body, visited_month, visited_year, best_months, daily_cost_cents, styles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        crypto.randomUUID(),
        d.destinationId,
        session.userId,
        d.rating,
        d.body,
        d.visitedMonth ?? null,
        d.visitedYear ?? null,
        d.bestMonths.length ? d.bestMonths.join(",") : null,
        d.dailyCost ?? null,
        d.styles.length ? d.styles.join(",") : null,
      ],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      return { ok: false, error: "Você já avaliou este destino." };
    return { ok: false, error: friendlyError(error as Error, "destinationReview") };
  }
  revalidatePath(`/destinos/${slug}`);
  return { ok: true, message: "Avaliação publicada. Obrigado por ajudar quem vai depois!" };
}

export async function deleteDestinationReview(reviewId: string): Promise<ActionResult> {
  if (!id.safeParse(reviewId).success) return { ok: false, error: "Avaliação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const row = await one<{ slug: string }>(
    `SELECT d.slug FROM destination_reviews r JOIN destinations d ON d.id = r.destination_id
      WHERE r.id = $1 AND r.user_id = $2`,
    [reviewId, session.userId],
  );
  if (!row) return { ok: false, error: "Você só pode excluir suas próprias avaliações." };
  await exec("DELETE FROM destination_reviews WHERE id = $1 AND user_id = $2", [
    reviewId,
    session.userId,
  ]);
  revalidatePath(`/destinos/${row.slug}`);
  return { ok: true };
}

/** Dica por assunto (melhor época, café da manhã, onde comer...). */
export async function createTip(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = tipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const d = parsed.data;

  const slug = await destinationSlug(d.destinationId);
  if (!slug) return { ok: false, error: "Destino não encontrado." };

  try {
    await exec(
      "INSERT INTO destination_tips (id, destination_id, user_id, topic, title, body) VALUES ($1, $2, $3, $4, $5, $6)",
      [crypto.randomUUID(), d.destinationId, session.userId, d.topic, d.title, d.body],
    );
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "createTip") };
  }
  revalidatePath(`/destinos/${slug}`);
  return { ok: true, message: "Dica publicada. Valeu!" };
}

export async function deleteTip(tipId: string): Promise<ActionResult> {
  if (!id.safeParse(tipId).success) return { ok: false, error: "Dica inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const row = await one<{ slug: string }>(
    `SELECT d.slug FROM destination_tips t JOIN destinations d ON d.id = t.destination_id
      WHERE t.id = $1 AND t.user_id = $2`,
    [tipId, session.userId],
  );
  if (!row) return { ok: false, error: "Você só pode excluir suas próprias dicas." };
  await exec("DELETE FROM destination_tips WHERE id = $1 AND user_id = $2", [
    tipId,
    session.userId,
  ]);
  revalidatePath(`/destinos/${row.slug}`);
  return { ok: true };
}

/** "Foi útil": liga/desliga o voto. Ninguém vota na própria dica. */
export async function toggleTipVote(tipId: string): Promise<ActionResult<{ active: boolean }>> {
  if (!id.safeParse(tipId).success) return { ok: false, error: "Dica inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const { userId } = session;

  try {
    const result = await tx(async (client) => {
      const tip = await one<{ user_id: string; slug: string }>(
        `SELECT t.user_id, d.slug FROM destination_tips t JOIN destinations d ON d.id = t.destination_id WHERE t.id = $1`,
        [tipId],
        client,
      );
      if (!tip) throw Object.assign(new Error("Dica não encontrada"), { code: "P0002" });
      if (tip.user_id === userId) return { error: "Você não pode votar na própria dica." };
      const removed = await exec(
        "DELETE FROM destination_tip_votes WHERE tip_id = $1 AND user_id = $2",
        [tipId, userId],
        client,
      );
      if (!removed)
        await exec(
          "INSERT INTO destination_tip_votes (tip_id, user_id) VALUES ($1, $2)",
          [tipId, userId],
          client,
        );
      return { active: !removed, slug: tip.slug };
    });
    if ("error" in result) return { ok: false, error: result.error as string };
    revalidatePath(`/destinos/${result.slug}`);
    return { ok: true, data: { active: result.active } };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: true, data: { active: true } };
    return { ok: false, error: friendlyError(error as Error, "tipVote") };
  }
}
