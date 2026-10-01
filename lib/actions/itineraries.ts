"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, one, rows, searchKey, sqlArray, tx } from "@/lib/db/client";
import { visibleItinerary } from "@/lib/db/rules";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { fieldErrors, itinerarySchema, type ItineraryInput } from "@/lib/validation";

/** Recebe o roteiro montado no editor e grava roteiro, dias e paradas numa transação. */
export async function createItinerary(
  input: ItineraryInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = itinerarySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para criar roteiros." };
  const d = parsed.data;
  const itineraryId = crypto.randomUUID();

  try {
    await tx(async (client) => {
      await exec(
        `INSERT INTO itineraries (id, user_id, destination_id, title, description, days_count, tags, is_public, search_key)
         VALUES ($1, $2, $3, $4, $5, $6, ${sqlArray(d.tags)}, $7, $8)`,
        [
          itineraryId,
          session.userId,
          d.destinationId ?? null,
          d.title,
          d.description ?? null,
          d.days.length,
          d.isPublic,
          searchKey(d.title, d.description),
        ],
        client,
      );
      for (const [dayIndex, day] of d.days.entries()) {
        const dayId = crypto.randomUUID();
        await exec(
          "INSERT INTO itinerary_days (id, itinerary_id, day_number, title, description) VALUES ($1, $2, $3, $4, $5)",
          [dayId, itineraryId, dayIndex + 1, day.title ?? null, day.description ?? null],
          client,
        );
        for (const [position, stop] of day.stops.entries()) {
          await exec(
            `INSERT INTO itinerary_places (id, day_id, place_id, custom_name, start_time, notes, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              crypto.randomUUID(),
              dayId,
              stop.placeId ?? null,
              stop.customName ?? null,
              stop.startTime ?? null,
              stop.notes ?? null,
              position,
            ],
            client,
          );
        }
      }
    });
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "createItinerary") };
  }

  revalidatePath("/roteiros");
  return { ok: true, data: { id: itineraryId } };
}

/** Copia um roteiro visível (público ou próprio) como cópia privada de quem copiou. */
export async function copyItinerary(itineraryId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success) return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para copiar roteiros." };
  const copyId = crypto.randomUUID();

  try {
    await tx(async (client) => {
      if (!(await visibleItinerary(itineraryId, session.userId, client)))
        throw Object.assign(new Error("Roteiro não encontrado"), { code: "P0002" });
      const src = await one<{
        destination_id: string | null;
        title: string;
        description: string | null;
        days_count: number;
        tags: string[] | null;
      }>(
        "SELECT destination_id, title, description, days_count, tags FROM itineraries WHERE id = $1",
        [itineraryId],
        client,
      );
      if (!src) throw Object.assign(new Error("Roteiro não encontrado"), { code: "P0002" });
      const title = `Cópia de ${src.title}`.slice(0, 120);
      await exec(
        `INSERT INTO itineraries (id, user_id, destination_id, title, description, days_count, tags, is_public, copied_from, search_key)
         VALUES ($1, $2, $3, $4, $5, $6, ${sqlArray(src.tags ?? [])}, FALSE, $7, $8)`,
        [
          copyId,
          session.userId,
          src.destination_id,
          title,
          src.description,
          src.days_count,
          itineraryId,
          searchKey(title, src.description),
        ],
        client,
      );
      const days = await rows<{
        id: string;
        day_number: number;
        title: string | null;
        description: string | null;
      }>(
        "SELECT id, day_number, title, description FROM itinerary_days WHERE itinerary_id = $1 ORDER BY day_number",
        [itineraryId],
        client,
      );
      for (const day of days) {
        const newDay = crypto.randomUUID();
        await exec(
          "INSERT INTO itinerary_days (id, itinerary_id, day_number, title, description) VALUES ($1, $2, $3, $4, $5)",
          [newDay, copyId, day.day_number, day.title, day.description],
          client,
        );
        const stops = await rows<{
          place_id: string | null;
          custom_name: string | null;
          start_time: string | null;
          notes: string | null;
          position: number;
        }>(
          "SELECT place_id, custom_name, start_time, notes, position FROM itinerary_places WHERE day_id = $1",
          [day.id],
          client,
        );
        for (const s of stops) {
          await exec(
            `INSERT INTO itinerary_places (id, day_id, place_id, custom_name, start_time, notes, position)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              crypto.randomUUID(),
              newDay,
              s.place_id,
              s.custom_name,
              s.start_time,
              s.notes,
              s.position,
            ],
            client,
          );
        }
      }
    });
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "copyItinerary") };
  }
  redirect(`/roteiros/${copyId}`);
}

export async function setItineraryVisibility(
  itineraryId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success || typeof isPublic !== "boolean")
    return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  try {
    const changed = await exec(
      "UPDATE itineraries SET is_public = $1 WHERE id = $2 AND user_id = $3",
      [isPublic, itineraryId, session.userId],
    );
    if (!changed) return { ok: false, error: "Você só pode alterar seus próprios roteiros." };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "visibility") };
  }
  revalidatePath(`/roteiros/${itineraryId}`);
  return { ok: true, message: isPublic ? "Roteiro publicado." : "Roteiro agora é privado." };
}

export async function deleteItinerary(itineraryId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success) return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  try {
    const deleted = await exec("DELETE FROM itineraries WHERE id = $1 AND user_id = $2", [
      itineraryId,
      session.userId,
    ]);
    if (!deleted) return { ok: false, error: "Você só pode excluir seus próprios roteiros." };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "deleteItinerary") };
  }
  revalidatePath("/roteiros");
  redirect("/minha-conta?aba=roteiros");
}
