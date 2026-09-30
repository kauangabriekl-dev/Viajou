"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { fieldErrors, itinerarySchema, type ItineraryInput } from "@/lib/validation";

/** Recebe o roteiro montado no editor (JSON) e grava tudo numa transação (RPC create_itinerary). */
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

  const { data, error } = await session.supabase.rpc("create_itinerary", {
    payload: {
      title: d.title,
      description: d.description ?? "",
      destination_id: d.destinationId ?? "",
      is_public: d.isPublic,
      tags: d.tags,
      days: d.days.map((day) => ({
        title: day.title ?? "",
        description: day.description ?? "",
        places: day.stops.map((s) => ({
          place_id: s.placeId ?? "",
          custom_name: s.customName ?? "",
          start_time: s.startTime ?? "",
          notes: s.notes ?? "",
        })),
      })),
    },
  });
  if (error || typeof data !== "string")
    return { ok: false, error: friendlyError(error, "createItinerary") };

  revalidatePath("/roteiros");
  return { ok: true, data: { id: data } };
}

export async function copyItinerary(itineraryId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success) return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para copiar roteiros." };

  const { data, error } = await session.supabase.rpc("copy_itinerary", { source_id: itineraryId });
  if (error || typeof data !== "string")
    return { ok: false, error: friendlyError(error, "copyItinerary") };
  redirect(`/roteiros/${data}`);
}

export async function setItineraryVisibility(
  itineraryId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success) return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { error } = await session.supabase
    .from("itineraries")
    .update({ is_public: isPublic })
    .eq("id", itineraryId)
    .eq("user_id", session.userId);
  if (error) return { ok: false, error: friendlyError(error, "visibility") };
  revalidatePath(`/roteiros/${itineraryId}`);
  return { ok: true, message: isPublic ? "Roteiro publicado." : "Roteiro agora é privado." };
}

export async function deleteItinerary(itineraryId: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(itineraryId).success) return { ok: false, error: "Roteiro inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { data, error } = await session.supabase
    .from("itineraries")
    .delete()
    .eq("id", itineraryId)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return { ok: false, error: friendlyError(error, "deleteItinerary") };
  if (!data?.length) return { ok: false, error: "Você só pode excluir seus próprios roteiros." };
  revalidatePath("/roteiros");
  redirect("/minha-conta?aba=roteiros");
}
