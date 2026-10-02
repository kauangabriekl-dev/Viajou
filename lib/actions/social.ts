"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, tx } from "@/lib/db/client";
import { notify, ownerOf, visibleItinerary } from "@/lib/db/rules";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { commentSchema, fieldErrors, reportSchema } from "@/lib/validation";
import { hideIfReported } from "@/lib/moderation";
import { hitLimit, LIMITS } from "@/lib/rate-limit";

const id = z.uuid();
const LOGIN_REQUIRED = "Entre na sua conta para continuar.";
const NOT_FOUND = "Este item não existe mais.";

type Toggle = ActionResult<{ active: boolean }>;
type ToggleTable = "post_likes" | "post_saves" | "itinerary_likes" | "itinerary_saves";
const isDuplicate = (error: unknown) => (error as { code?: string }).code === "23505";

/** Liga/desliga um vínculo usuário↔item. A PK composta no banco impede duplicações. */
async function toggle(
  table: ToggleTable,
  column: "post_id" | "itinerary_id",
  targetId: string,
  path: string,
): Promise<Toggle> {
  if (!id.safeParse(targetId).success) return { ok: false, error: "Item inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const { userId } = session;

  try {
    const active = await tx(async (client) => {
      const removed = await exec(
        `DELETE FROM ${table} WHERE ${column} = $1 AND user_id = $2`,
        [targetId, userId],
        client,
      );
      if (removed) return false;

      // Roteiro privado de outra pessoa não pode ser curtido nem salvo (antes: RLS).
      let owner: string | null;
      if (column === "itinerary_id") {
        owner = (await visibleItinerary(targetId, userId, client))?.user_id ?? null;
      } else {
        owner = await ownerOf("posts", targetId, client);
      }
      if (!owner) throw Object.assign(new Error(NOT_FOUND), { code: "P0002" });

      await exec(
        `INSERT INTO ${table} (${column}, user_id) VALUES ($1, $2)`,
        [targetId, userId],
        client,
      );
      if (table === "post_likes")
        await notify(client, owner, userId, "post_like", { postId: targetId });
      if (table === "itinerary_saves")
        await notify(client, owner, userId, "itinerary_saved", { itineraryId: targetId });
      return true;
    });
    revalidatePath(path);
    return { ok: true, data: { active } };
  } catch (error) {
    if (isDuplicate(error)) return { ok: true, data: { active: true } };
    return { ok: false, error: friendlyError(error as Error, table) };
  }
}

export async function togglePostLike(postId: string) {
  return toggle("post_likes", "post_id", postId, `/viagens/${postId}`);
}
export async function togglePostSave(postId: string) {
  return toggle("post_saves", "post_id", postId, "/minha-conta");
}
export async function toggleItineraryLike(itineraryId: string) {
  return toggle("itinerary_likes", "itinerary_id", itineraryId, `/roteiros/${itineraryId}`);
}
export async function toggleItinerarySave(itineraryId: string) {
  return toggle("itinerary_saves", "itinerary_id", itineraryId, "/minha-conta");
}

export async function toggleFollow(profileId: string): Promise<Toggle> {
  if (!id.safeParse(profileId).success) return { ok: false, error: "Perfil inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const { userId } = session;
  if (userId === profileId) return { ok: false, error: "Você não pode seguir a si mesmo." };

  try {
    const active = await tx(async (client) => {
      const removed = await exec(
        "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
        [userId, profileId],
        client,
      );
      if (removed) return false;
      await exec(
        "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
        [userId, profileId],
        client,
      );
      await notify(client, profileId, userId, "follow");
      return true;
    });
    revalidatePath("/perfil/[username]", "page");
    return { ok: true, data: { active } };
  } catch (error) {
    if (isDuplicate(error)) return { ok: true, data: { active: true } };
    return { ok: false, error: friendlyError(error as Error, "follow") };
  }
}

export async function addComment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: "Revise o comentário.", fieldErrors: fieldErrors(parsed.error) };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const { postId, body } = parsed.data;

  try {
    await tx(async (client) => {
      const owner = await ownerOf("posts", postId, client);
      if (!owner) throw Object.assign(new Error(NOT_FOUND), { code: "P0002" });
      const commentId = crypto.randomUUID();
      await exec(
        "INSERT INTO comments (id, post_id, user_id, body) VALUES ($1, $2, $3, $4)",
        [commentId, postId, session.userId, body],
        client,
      );
      await notify(client, owner, session.userId, "comment", { postId, commentId });
    });
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "addComment") };
  }

  revalidatePath(`/viagens/${postId}`);
  return { ok: true, message: "Comentário publicado." };
}

export async function deleteComment(commentId: string, postId: string): Promise<ActionResult> {
  if (!id.safeParse(commentId).success || !id.safeParse(postId).success)
    return { ok: false, error: "Comentário inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };

  try {
    const deleted = await exec("DELETE FROM comments WHERE id = $1 AND user_id = $2", [
      commentId,
      session.userId,
    ]);
    if (!deleted) return { ok: false, error: "Você só pode excluir seus próprios comentários." };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "deleteComment") };
  }

  revalidatePath(`/viagens/${postId}`);
  return { ok: true };
}

export async function submitReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: "Escolha um motivo.", fieldErrors: fieldErrors(parsed.error) };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  const limit = await hitLimit(`report:${session.userId}`, LIMITS.report);
  if (!limit.allowed)
    return { ok: false, error: "Você enviou muitas denúncias seguidas. Tente de novo mais tarde." };

  // Lugares e achadinhos da comunidade têm fila própria e saem do ar com 3 denúncias.
  const community = parsed.data.targetType === "place" || parsed.data.targetType === "achado";
  try {
    await exec(
      community
        ? "INSERT INTO community_reports (id, reporter_id, target_type, target_id, reason, details) VALUES ($1, $2, $3, $4, $5, $6)"
        : "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, details) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        crypto.randomUUID(),
        session.userId,
        parsed.data.targetType,
        parsed.data.targetId,
        parsed.data.reason,
        parsed.data.details ?? null,
      ],
    );
  } catch (error) {
    if (isDuplicate(error))
      return { ok: true, message: "Você já denunciou este conteúdo. Ele está em análise." };
    return { ok: false, error: friendlyError(error as Error, "report") };
  }
  if (community) {
    await hideIfReported(parsed.data.targetType as "place" | "achado", parsed.data.targetId);
  }
  return {
    ok: true,
    message: "Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.",
  };
}

export async function markNotificationsRead(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await exec(
    "UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND read_at IS NULL",
    [session.userId],
  );
  revalidatePath("/", "layout");
}
