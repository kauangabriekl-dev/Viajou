"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, one, tx } from "@/lib/db/client";
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
  const { userId } = session;

  const place = await one<{ slug: string }>("SELECT slug FROM places WHERE id = $1", [
    parsed.data.placeId,
  ]);
  if (!place) return { ok: false, error: "Lugar não encontrado." };

  const upload = await uploadImages(userId, filesFrom(formData, "photos"), "complaints", 5);
  if (!upload.ok)
    return { ok: false, error: upload.error, fieldErrors: { photos: [upload.error] } };

  const complaintId = crypto.randomUUID();
  try {
    // Reclamação e fotos juntas: se as fotos falharem, nada fica pela metade.
    await tx(async (client) => {
      await exec(
        "INSERT INTO complaints (id, place_id, user_id, category, title, description) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          complaintId,
          parsed.data.placeId,
          userId,
          parsed.data.category,
          parsed.data.title,
          parsed.data.description,
        ],
        client,
      );
      for (const storagePath of upload.paths) {
        await exec(
          "INSERT INTO complaint_photos (id, complaint_id, user_id, storage_path) VALUES ($1, $2, $3, $4)",
          [crypto.randomUUID(), complaintId, userId, storagePath],
          client,
        );
      }
    });
  } catch (error) {
    await removeImages(upload.paths);
    return { ok: false, error: friendlyError(error as Error, "createComplaint") };
  }

  revalidatePath(`/lugares/${place.slug}`);
  redirect(`/lugares/${place.slug}?aba=reclamacoes`);
}

/**
 * O autor marca a reclamação como resolvida ou encerrada (nunca "respondida": isso só
 * acontece quando um estabelecimento verificado responde). Antes: trigger guard_complaint_status.
 */
export async function updateComplaintStatus(
  complaintId: string,
  status: "resolved" | "closed",
): Promise<ActionResult> {
  if (!z.uuid().safeParse(complaintId).success) return { ok: false, error: "Reclamação inválida." };
  if (status !== "resolved" && status !== "closed") return { ok: false, error: "Status inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para continuar." };
  try {
    const changed = await exec(
      "UPDATE complaints SET status = $1 WHERE id = $2 AND user_id = $3 AND status IN ('pending', 'answered')",
      [status, complaintId, session.userId],
    );
    if (!changed)
      return {
        ok: false,
        error: "Só quem registrou pode alterar esta reclamação, e ela já foi finalizada.",
      };
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "complaintStatus") };
  }
  revalidatePath("/minha-conta");
  revalidatePath("/lugares/[slug]", "page");
  return {
    ok: true,
    message: status === "resolved" ? "Marcada como resolvida." : "Reclamação encerrada.",
  };
}
