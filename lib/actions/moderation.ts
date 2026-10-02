"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { exec, rows, tx } from "@/lib/db/client";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { isAdmin, type ModerationTarget } from "@/lib/moderation";
import { removeImages } from "@/lib/storage.server";

const target = z.object({ type: z.enum(["place", "achado"]), id: z.uuid() });

async function requireAdmin(): Promise<ActionResult | null> {
  const session = await getSession();
  if (!session || !(await isAdmin(session.userId)))
    return { ok: false, error: "Só administradores podem moderar conteúdo." };
  return null;
}

/** Conteúdo revisado e aprovado: volta ao ar e as denúncias abertas são encerradas. */
export async function restoreContent(type: ModerationTarget, id: string): Promise<ActionResult> {
  const parsed = target.safeParse({ type, id });
  if (!parsed.success) return { ok: false, error: "Conteúdo inválido." };
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await tx(async (client) => {
      await exec(
        `UPDATE ${type === "place" ? "places" : "achados"} SET hidden_at = NULL WHERE id = $1`,
        [id],
        client,
      );
      await exec(
        "UPDATE community_reports SET status = 'closed' WHERE target_type = $1 AND target_id = $2",
        [type, id],
        client,
      );
    });
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "restoreContent") };
  }
  revalidatePath("/moderacao");
  return { ok: true, message: "Conteúdo de volta ao ar." };
}

/** Conteúdo que viola as regras: sai de vez (fotos de achadinho incluídas). */
export async function removeContent(type: ModerationTarget, id: string): Promise<ActionResult> {
  const parsed = target.safeParse({ type, id });
  if (!parsed.success) return { ok: false, error: "Conteúdo inválido." };
  const denied = await requireAdmin();
  if (denied) return denied;
  let paths: string[] = [];
  try {
    await tx(async (client) => {
      if (type === "achado") {
        paths = (
          await rows<{ storage_path: string }>(
            "SELECT storage_path FROM achado_photos WHERE achado_id = $1",
            [id],
            client,
          )
        ).map((p) => p.storage_path);
        await exec("DELETE FROM achados WHERE id = $1", [id], client);
      } else {
        // As paradas de roteiro guardam o nome do lugar, então não quebram.
        await exec("DELETE FROM places WHERE id = $1", [id], client);
      }
      await exec(
        "UPDATE community_reports SET status = 'closed' WHERE target_type = $1 AND target_id = $2",
        [type, id],
        client,
      );
    });
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "removeContent") };
  }
  await removeImages(paths);
  revalidatePath("/moderacao");
  return { ok: true, message: "Conteúdo removido." };
}
