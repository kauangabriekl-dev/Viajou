"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { filesFrom, removeImages, uploadImages } from "@/lib/storage.server";
import { complaintSchema, fieldErrors } from "@/lib/validation";

export async function createComplaint(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = complaintSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para registrar uma reclamação." };
  const { supabase, userId } = session;

  const { data: place } = await supabase
    .from("places")
    .select("slug")
    .eq("id", parsed.data.placeId)
    .maybeSingle<{ slug: string }>();
  if (!place) return { ok: false, error: "Lugar não encontrado." };

  const upload = await uploadImages(
    supabase,
    userId,
    filesFrom(formData, "photos"),
    "complaints",
    5,
  );
  if (!upload.ok)
    return { ok: false, error: upload.error, fieldErrors: { photos: [upload.error] } };

  const { data: complaint, error } = await supabase
    .from("complaints")
    .insert({
      place_id: parsed.data.placeId,
      user_id: userId,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !complaint) {
    await removeImages(supabase, upload.paths);
    return { ok: false, error: friendlyError(error, "createComplaint") };
  }

  if (upload.paths.length) {
    const { error: photoError } = await supabase.from("complaint_photos").insert(
      upload.paths.map((storage_path) => ({
        complaint_id: complaint.id,
        user_id: userId,
        storage_path,
      })),
    );
    if (photoError) friendlyError(photoError, "complaint photos");
  }

  revalidatePath(`/lugares/${place.slug}`);
  redirect(`/lugares/${place.slug}?aba=reclamacoes`);
}

export async function updateComplaintStatus(
  complaintId: string,
  status: "resolved" | "closed",
): Promise<ActionResult> {
  if (!z.uuid().safeParse(complaintId).success) return { ok: false, error: "Reclamação inválida." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  const { error } = await session.supabase
    .from("complaints")
    .update({ status })
    .eq("id", complaintId)
    .eq("user_id", session.userId);
  if (error) return { ok: false, error: friendlyError(error, "complaintStatus") };
  revalidatePath("/minha-conta");
  revalidatePath("/lugares/[slug]", "page");
  return {
    ok: true,
    message: status === "resolved" ? "Marcada como resolvida." : "Reclamação encerrada.",
  };
}
