"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { exec, searchKey } from "@/lib/db/client";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { photoUrl } from "@/lib/storage";
import { filesFrom, removeImages, uploadImages } from "@/lib/storage.server";
import { fieldErrors, profileSchema } from "@/lib/validation";

/** Caminho da foto local a partir da URL "/fotos/<caminho>" (para apagar o avatar antigo). */
const localPath = (url: string | null) =>
  url?.startsWith("/fotos/") ? url.slice("/fotos/".length) : null;

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

  const { userId, profile } = session;
  let avatarUrl = profile.avatar_url;
  let newAvatarPath: string | null = null;

  const avatar = filesFrom(formData, "avatar");
  if (avatar.length) {
    const upload = await uploadImages(userId, avatar, "avatars", 1);
    if (!upload.ok)
      return { ok: false, error: upload.error, fieldErrors: { avatar: [upload.error] } };
    newAvatarPath = upload.paths[0];
    avatarUrl = photoUrl(newAvatarPath);
  }

  try {
    await exec(
      "UPDATE profiles SET full_name = $1, username = $2, bio = $3, avatar_url = $4, search_key = $5 WHERE id = $6",
      [
        parsed.data.fullName,
        parsed.data.username,
        parsed.data.bio ?? null,
        avatarUrl,
        searchKey(parsed.data.username, parsed.data.fullName),
        userId,
      ],
    );
  } catch (error) {
    if (newAvatarPath) await removeImages([newAvatarPath]);
    if ((error as { code?: string }).code === "23505") {
      return {
        ok: false,
        error: "Revise os campos destacados.",
        fieldErrors: { username: ["Este username já está em uso."] },
      };
    }
    return { ok: false, error: friendlyError(error as Error, "updateProfile") };
  }

  // Avatar trocado: o antigo deixa de existir também no disco (antes ficava público para sempre).
  const oldPath = newAvatarPath ? localPath(profile.avatar_url) : null;
  if (oldPath) await removeImages([oldPath]);

  revalidatePath(`/perfil/${profile.username}`);
  revalidatePath(`/perfil/${parsed.data.username}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil atualizado." };
}
