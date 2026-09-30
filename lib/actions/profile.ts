"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { photoUrl } from "@/lib/storage";
import { filesFrom, uploadImages } from "@/lib/storage.server";
import { fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const { supabase, userId, profile } = session;
  const updates: { full_name: string; username: string; bio: string | null; avatar_url?: string } =
    {
      full_name: parsed.data.fullName,
      username: parsed.data.username,
      bio: parsed.data.bio ?? null,
    };

  const avatar = filesFrom(formData, "avatar");
  if (avatar.length) {
    const upload = await uploadImages(supabase, userId, avatar, "avatars", 1);
    if (!upload.ok)
      return { ok: false, error: upload.error, fieldErrors: { avatar: [upload.error] } };
    updates.avatar_url = photoUrl(upload.paths[0]);
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Revise os campos destacados.",
        fieldErrors: { username: ["Este username já está em uso."] },
      };
    }
    return { ok: false, error: friendlyError(error, "updateProfile") };
  }

  revalidatePath(`/perfil/${profile.username}`);
  revalidatePath(`/perfil/${updates.username}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil atualizado." };
}
