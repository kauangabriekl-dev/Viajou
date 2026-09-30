"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { filesFrom, removeImages, uploadImages } from "@/lib/storage.server";
import { fieldErrors, postSchema } from "@/lib/validation";

export async function createPost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = postSchema.safeParse({
    body: formData.get("body"),
    destinationId: formData.get("destinationId") ?? "",
    hotelPlaceId: formData.get("hotelPlaceId") ?? "",
    placeIds: formData.getAll("placeIds"),
    tripStart: formData.get("tripStart") ?? "",
    tripEnd: formData.get("tripEnd") ?? "",
    spent: formData.get("spent") ?? "",
    rating: formData.get("rating") ?? "",
    tags: formData.getAll("tags"),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para publicar." };
  const { supabase, userId } = session;
  const input = parsed.data;

  const photos = filesFrom(formData, "photos");
  const upload = await uploadImages(supabase, userId, photos, "posts");
  if (!upload.ok)
    return { ok: false, error: upload.error, fieldErrors: { photos: [upload.error] } };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      body: input.body,
      destination_id: input.destinationId ?? null,
      hotel_place_id: input.hotelPlaceId ?? null,
      trip_start: input.tripStart ?? null,
      trip_end: input.tripEnd ?? null,
      spent_cents: input.spent ?? null,
      rating: input.rating ?? null,
      tags: input.tags,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !post) {
    await removeImages(supabase, upload.paths);
    return { ok: false, error: friendlyError(error, "createPost") };
  }

  const alts = formData.getAll("photoAlt").map(String);
  const [placesResult, photosResult] = await Promise.all([
    input.placeIds.length
      ? supabase
          .from("post_places")
          .insert([...new Set(input.placeIds)].map((place_id) => ({ post_id: post.id, place_id })))
      : Promise.resolve({ error: null }),
    upload.paths.length
      ? supabase.from("post_photos").insert(
          upload.paths.map((storage_path, position) => ({
            post_id: post.id,
            user_id: userId,
            storage_path,
            position,
            alt: alts[position]?.trim().slice(0, 200) || null,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);

  if (placesResult.error || photosResult.error) {
    await supabase.from("posts").delete().eq("id", post.id);
    await removeImages(supabase, upload.paths);
    return {
      ok: false,
      error: friendlyError(placesResult.error ?? photosResult.error, "createPost details"),
    };
  }

  revalidatePath("/");
  redirect(`/viagens/${post.id}`);
}

export async function deletePost(postId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(postId).success) return { ok: false, error: "Publicação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { supabase, userId, profile } = session;

  const { data: photos } = await supabase
    .from("post_photos")
    .select("storage_path")
    .eq("post_id", postId)
    .eq("user_id", userId);
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId)
    .select("id");
  if (error) return { ok: false, error: friendlyError(error, "deletePost") };
  if (!data?.length) return { ok: false, error: "Você só pode excluir suas próprias publicações." };
  await removeImages(
    supabase,
    (photos ?? []).map((p: { storage_path: string }) => p.storage_path),
  );

  revalidatePath("/");
  redirect(`/perfil/${profile.username}`);
}
