import "server-only";
import { exec, one, type Queryable } from "@/lib/db/client";
import type { NotificationType } from "@/types/database";

/**
 * Regras de negócio do banco (antes eram triggers e RLS), chamadas pelas Server Actions
 * dentro da mesma transação da escrita.
 */

/** Recalcula nota média e total de avaliações do lugar (antes: trigger refresh_place_rating). */
export async function refreshPlaceRating(placeId: string, on: Queryable) {
  await exec(
    `UPDATE places SET
        rating_avg = COALESCE((SELECT ROUND(AVG(CAST(rating AS NUMERIC(5, 2))), 2) FROM reviews WHERE place_id = $1), 0),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE place_id = $1)
      WHERE id = $1`,
    [placeId],
    on,
  );
}

/** Cria uma notificação. Nunca notifica alguém sobre as próprias ações (antes: função notify). */
export async function notify(
  on: Queryable,
  recipient: string | null | undefined,
  actor: string,
  type: NotificationType,
  refs: { postId?: string; commentId?: string; itineraryId?: string; complaintId?: string } = {},
) {
  if (!recipient || recipient === actor) return;
  await exec(
    `INSERT INTO notifications (id, user_id, actor_id, type, post_id, comment_id, itinerary_id, complaint_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      crypto.randomUUID(),
      recipient,
      actor,
      type,
      refs.postId ?? null,
      refs.commentId ?? null,
      refs.itineraryId ?? null,
      refs.complaintId ?? null,
    ],
    on,
  );
}

/** Dono de um item (para notificar), ou null se não existir. */
export async function ownerOf(
  table: "posts" | "itineraries" | "comments",
  id: string,
  on: Queryable,
) {
  const row = await one<{ user_id: string }>(
    `SELECT user_id FROM ${table} WHERE id = $1`,
    [id],
    on,
  );
  return row?.user_id ?? null;
}

/** Roteiro que o usuário pode ver: público ou dele (antes: política RLS de itineraries). */
export async function visibleItinerary(id: string, viewerId: string, on: Queryable) {
  return one<{ id: string; user_id: string; is_public: boolean }>(
    "SELECT id, user_id, is_public FROM itineraries WHERE id = $1 AND (is_public = TRUE OR user_id = $2)",
    [id, viewerId],
    on,
  );
}
