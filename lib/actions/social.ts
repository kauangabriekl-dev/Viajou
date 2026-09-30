"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { commentSchema, fieldErrors, reportSchema } from "@/lib/validation";

const id = z.uuid();
const LOGIN_REQUIRED = "Entre na sua conta para continuar.";

type Toggle = ActionResult<{ active: boolean }>;
type ToggleTable = "post_likes" | "post_saves" | "itinerary_likes" | "itinerary_saves";

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
  const { supabase, userId } = session;

  const removed = await supabase
    .from(table)
    .delete()
    .eq(column, targetId)
    .eq("user_id", userId)
    .select(column);
  if (removed.error) return { ok: false, error: friendlyError(removed.error, table) };

  let active = false;
  if (!removed.data?.length) {
    const inserted = await supabase.from(table).insert({ [column]: targetId, user_id: userId });
    if (inserted.error && inserted.error.code !== "23505")
      return { ok: false, error: friendlyError(inserted.error, table) };
    active = true;
  }
  revalidatePath(path);
  return { ok: true, data: { active } };
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
  const { supabase, userId } = session;
  if (userId === profileId) return { ok: false, error: "Você não pode seguir a si mesmo." };

  const removed = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", profileId)
    .select("following_id");
  if (removed.error) return { ok: false, error: friendlyError(removed.error, "unfollow") };

  let active = false;
  if (!removed.data?.length) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: userId, following_id: profileId });
    if (error && error.code !== "23505")
      return { ok: false, error: friendlyError(error, "follow") };
    active = true;
  }
  revalidatePath("/perfil/[username]", "page");
  return { ok: true, data: { active } };
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

  const { error } = await session.supabase
    .from("comments")
    .insert({ post_id: parsed.data.postId, user_id: session.userId, body: parsed.data.body });
  if (error) return { ok: false, error: friendlyError(error, "addComment") };

  revalidatePath(`/viagens/${parsed.data.postId}`);
  return { ok: true, message: "Comentário publicado." };
}

export async function deleteComment(commentId: string, postId: string): Promise<ActionResult> {
  if (!id.safeParse(commentId).success || !id.safeParse(postId).success)
    return { ok: false, error: "Comentário inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };

  const { data, error } = await session.supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return { ok: false, error: friendlyError(error, "deleteComment") };
  if (!data?.length) return { ok: false, error: "Você só pode excluir seus próprios comentários." };

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

  const { error } = await session.supabase.from("reports").insert({
    reporter_id: session.userId,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  if (error?.code === "23505")
    return { ok: true, message: "Você já denunciou este conteúdo. Ele está em análise." };
  if (error) return { ok: false, error: friendlyError(error, "report") };
  return {
    ok: true,
    message: "Denúncia enviada. Obrigado por ajudar a manter a comunidade segura.",
  };
}

export async function markNotificationsRead(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await session.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.userId)
    .is("read_at", null);
  revalidatePath("/", "layout");
}
