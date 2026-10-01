"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, one, rows, sqlArray, tx } from "@/lib/db/client";
import { placeRefSchema } from "@/lib/place-ref";
import { resolvePlace } from "@/lib/places.server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { filesFrom, removeImages, uploadImages } from "@/lib/storage.server";
import { fieldErrors, postSchema } from "@/lib/validation";

/** "Qual praia você mais gostou?", "Qual praia você recomenda?", "Qual praia você não voltaria?" */
const BEACH_KINDS = ["favorita", "recomenda", "nao_voltaria"] as const;

export async function createPost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = postSchema.safeParse({
    body: formData.get("body"),
    destinationId: formData.get("destinationId") ?? "",
    hotelPlaceId: formData.get("hotelPlaceId") ?? "",
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

  // Lugares visitados (existentes ou digitados) e as três perguntas de praia.
  const refs = z
    .array(placeRefSchema)
    .max(20, "Selecione até 20 lugares.")
    .safeParse(formData.getAll("placeRefs"));
  const beachInput = Object.fromEntries(
    BEACH_KINDS.map((k) => [k, formData.get(`beach_${k}`) || undefined]),
  );
  const beaches = z
    .object(Object.fromEntries(BEACH_KINDS.map((k) => [k, placeRefSchema.optional()])))
    .safeParse(beachInput);
  if (!refs.success || !beaches.success)
    return {
      ok: false,
      error: "Revise os lugares informados.",
      fieldErrors: { placeRefs: ["Algum lugar informado é inválido."] },
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para publicar." };
  const { userId } = session;
  const input = parsed.data;

  const upload = await uploadImages(userId, filesFrom(formData, "photos"), "posts");
  if (!upload.ok)
    return { ok: false, error: upload.error, fieldErrors: { photos: [upload.error] } };

  const postId = crypto.randomUUID();
  const alts = formData.getAll("photoAlt").map(String);
  try {
    // Publicação, lugares e fotos numa transação: ou entra tudo, ou nada.
    await tx(async (client) => {
      await exec(
        `INSERT INTO posts (id, user_id, body, destination_id, hotel_place_id, trip_start, trip_end, spent_cents, rating, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${sqlArray(input.tags)})`,
        [
          postId,
          userId,
          input.body,
          input.destinationId ?? null,
          input.hotelPlaceId ?? null,
          input.tripStart ?? null,
          input.tripEnd ?? null,
          input.spent ?? null,
          input.rating ?? null,
        ],
        client,
      );
      const destination = input.destinationId
        ? await one<{ id: string; city: string; state: string; country: string }>(
            "SELECT id, city, state, country FROM destinations WHERE id = $1",
            [input.destinationId],
            client,
          )
        : null;
      const ctx = { destination, userId };
      const placeIds = new Set<string>();
      for (const ref of refs.data) placeIds.add(await resolvePlace(client, ref, ctx));
      const picks: [string, string][] = [];
      for (const kind of BEACH_KINDS) {
        const ref = beaches.data[kind];
        if (!ref) continue;
        const id = await resolvePlace(client, ref, { ...ctx, forceType: "beach" });
        picks.push([kind, id]);
        placeIds.add(id); // a praia respondida também conta como lugar visitado
      }
      for (const placeId of placeIds) {
        await exec(
          "INSERT INTO post_places (post_id, place_id) VALUES ($1, $2)",
          [postId, placeId],
          client,
        );
      }
      for (const [kind, placeId] of picks) {
        await exec(
          "INSERT INTO post_beach_picks (post_id, kind, place_id) VALUES ($1, $2, $3)",
          [postId, kind, placeId],
          client,
        );
      }
      for (const [position, storagePath] of upload.paths.entries()) {
        await exec(
          "INSERT INTO post_photos (id, post_id, user_id, storage_path, position, alt) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            crypto.randomUUID(),
            postId,
            userId,
            storagePath,
            position,
            alts[position]?.trim().slice(0, 200) || null,
          ],
          client,
        );
      }
    });
  } catch (error) {
    await removeImages(upload.paths);
    return { ok: false, error: friendlyError(error as Error, "createPost") };
  }

  revalidatePath("/");
  redirect(`/viagens/${postId}`);
}

export async function deletePost(postId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(postId).success) return { ok: false, error: "Publicação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { userId, profile } = session;

  let photoPaths: string[] = [];
  try {
    const deleted = await tx(async (client) => {
      photoPaths = (
        await rows<{ storage_path: string }>(
          "SELECT storage_path FROM post_photos WHERE post_id = $1 AND user_id = $2",
          [postId, userId],
          client,
        )
      ).map((p) => p.storage_path);
      // Só o autor exclui; fotos, comentários e curtidas vão junto (ON DELETE CASCADE).
      return exec("DELETE FROM posts WHERE id = $1 AND user_id = $2", [postId, userId], client);
    });
    if (!deleted) return { ok: false, error: "Você só pode excluir suas próprias publicações." };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "deletePost") };
  }
  await removeImages(photoPaths);

  revalidatePath("/");
  redirect(`/perfil/${profile.username}`);
}
