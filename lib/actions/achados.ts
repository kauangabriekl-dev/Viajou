"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, rows, searchKey, tx } from "@/lib/db/client";
import { distanceKm, nearestCity } from "@/lib/geo-search";
import { getPlacesIndex } from "@/lib/geo.server";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { filesFrom, removeImages, uploadImages } from "@/lib/storage.server";
import { achadoSchema, fieldErrors } from "@/lib/validation";

const LOGIN_REQUIRED = "Entre na sua conta para continuar.";
const DESTINATION_RADIUS_KM = 80;

/** Destino do VIAJOU mais próximo (até 80 km), para o achadinho aparecer na página dele. */
async function nearestDestination(latitude: number, longitude: number) {
  const destinations = await rows<{
    id: string;
    latitude: number | null;
    longitude: number | null;
  }>(
    "SELECT id, latitude, longitude FROM destinations WHERE latitude IS NOT NULL AND longitude IS NOT NULL",
  );
  let best: string | null = null;
  let bestKm = DESTINATION_RADIUS_KM;
  for (const d of destinations) {
    const km = distanceKm(latitude, longitude, Number(d.latitude), Number(d.longitude));
    if (km <= bestKm) {
      bestKm = km;
      best = d.id;
    }
  }
  return best;
}

export async function createAchado(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = achadoSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    locationName: formData.get("locationName") ?? "",
    tip: formData.get("tip") ?? "",
    destinationId: formData.get("destinationId") ?? "",
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

  const photos = filesFrom(formData, "photos");
  if (!photos.length)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: { photos: ["Envie pelo menos uma foto do achadinho."] },
    };
  const upload = await uploadImages(session.userId, photos, "achados", 5);
  if (!upload.ok)
    return { ok: false, error: upload.error, fieldErrors: { photos: [upload.error] } };

  // Nome do local e destino do VIAJOU calculados no servidor a partir das coordenadas.
  let locationName = d.locationName ?? null;
  if (!locationName) {
    const city = nearestCity(await getPlacesIndex(), d.latitude, d.longitude);
    locationName = city ? `Perto de ${city.name} · ${city.detail}` : null;
  }
  const destinationId = d.destinationId ?? (await nearestDestination(d.latitude, d.longitude));

  const achadoId = crypto.randomUUID();
  const alts = formData.getAll("photoAlt").map(String);
  try {
    await tx(async (client) => {
      await exec(
        `INSERT INTO achados (id, user_id, destination_id, title, body, category, latitude, longitude, location_name, tip, search_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          achadoId,
          session.userId,
          destinationId,
          d.title,
          d.body,
          d.category,
          d.latitude.toFixed(6),
          d.longitude.toFixed(6),
          locationName,
          d.tip ?? null,
          searchKey(d.title, locationName),
        ],
        client,
      );
      for (const [position, storagePath] of upload.paths.entries()) {
        await exec(
          "INSERT INTO achado_photos (id, achado_id, user_id, storage_path, alt, position) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            crypto.randomUUID(),
            achadoId,
            session.userId,
            storagePath,
            alts[position]?.trim().slice(0, 200) || null,
            position,
          ],
          client,
        );
      }
    });
  } catch (error) {
    await removeImages(upload.paths);
    return { ok: false, error: friendlyError(error as Error, "createAchado") };
  }

  revalidatePath("/achados");
  redirect(`/achados/${achadoId}`);
}

export async function deleteAchado(achadoId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(achadoId).success) return { ok: false, error: "Achadinho inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };

  let paths: string[] = [];
  const deleted = await tx(async (client) => {
    paths = (
      await rows<{ storage_path: string }>(
        "SELECT storage_path FROM achado_photos WHERE achado_id = $1 AND user_id = $2",
        [achadoId, session.userId],
        client,
      )
    ).map((p) => p.storage_path);
    return exec(
      "DELETE FROM achados WHERE id = $1 AND user_id = $2",
      [achadoId, session.userId],
      client,
    );
  });
  if (!deleted) return { ok: false, error: "Você só pode excluir seus próprios achadinhos." };
  await removeImages(paths);
  revalidatePath("/achados");
  redirect("/achados");
}

/** Salvar um achadinho para ir depois. */
export async function toggleAchadoSave(
  achadoId: string,
): Promise<ActionResult<{ active: boolean }>> {
  if (!z.uuid().safeParse(achadoId).success) return { ok: false, error: "Achadinho inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: LOGIN_REQUIRED };
  try {
    const active = await tx(async (client) => {
      const removed = await exec(
        "DELETE FROM achado_saves WHERE achado_id = $1 AND user_id = $2",
        [achadoId, session.userId],
        client,
      );
      if (removed) return false;
      await exec(
        "INSERT INTO achado_saves (achado_id, user_id) VALUES ($1, $2)",
        [achadoId, session.userId],
        client,
      );
      return true;
    });
    revalidatePath(`/achados/${achadoId}`);
    return { ok: true, data: { active } };
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: true, data: { active: true } };
    return { ok: false, error: friendlyError(error as Error, "achadoSave") };
  }
}
