import "server-only";
import { exec, one, rows } from "@/lib/db/client";

/** Denúncias (de pessoas diferentes) que tiram um lugar ou achadinho do ar até a revisão. */
export const HIDE_AFTER_REPORTS = 3;

export type ModerationTarget = "place" | "achado";

/**
 * Depois de uma denúncia: com HIDE_AFTER_REPORTS denúncias abertas, o conteúdo sai do ar.
 * Lugar do catálogo (não criado pela comunidade) nunca sai sozinho: só vai para a fila.
 */
export async function hideIfReported(type: ModerationTarget, id: string) {
  const open = await one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM community_reports WHERE target_type = $1 AND target_id = $2 AND status = 'open'",
    [type, id],
  );
  if (Number(open?.n ?? 0) < HIDE_AFTER_REPORTS) return;
  if (type === "place") {
    await exec(
      "UPDATE places SET hidden_at = CURRENT_TIMESTAMP WHERE id = $1 AND hidden_at IS NULL AND is_community = TRUE",
      [id],
    );
  } else {
    await exec(
      "UPDATE achados SET hidden_at = CURRENT_TIMESTAMP WHERE id = $1 AND hidden_at IS NULL",
      [id],
    );
  }
}

export async function isAdmin(userId: string | null | undefined) {
  if (!userId) return false;
  const row = await one<{ is_admin: boolean }>("SELECT is_admin FROM profiles WHERE id = $1", [
    userId,
  ]);
  return Boolean(row?.is_admin);
}

export type ModerationItem = {
  type: ModerationTarget;
  id: string;
  name: string;
  href: string;
  hidden: boolean;
  reports: number;
  reasons: string[];
  details: string[];
};

/** Fila: tudo com denúncia aberta ou que está fora do ar, os mais denunciados primeiro. */
export async function listModerationQueue(): Promise<ModerationItem[]> {
  const reported = await rows<{
    target_type: ModerationTarget;
    target_id: string;
    reason: string;
    details: string | null;
  }>("SELECT target_type, target_id, reason, details FROM community_reports WHERE status = 'open'");
  const [places, achados] = await Promise.all([
    rows<{ id: string; name: string; slug: string; hidden_at: string | null }>(
      `SELECT id, name, slug, hidden_at FROM places
        WHERE hidden_at IS NOT NULL OR id IN (SELECT target_id FROM community_reports WHERE target_type = 'place' AND status = 'open')`,
    ),
    rows<{ id: string; title: string; hidden_at: string | null }>(
      `SELECT id, title, hidden_at FROM achados
        WHERE hidden_at IS NOT NULL OR id IN (SELECT target_id FROM community_reports WHERE target_type = 'achado' AND status = 'open')`,
    ),
  ]);
  const forTarget = (type: ModerationTarget, id: string) =>
    reported.filter((r) => r.target_type === type && r.target_id === id);
  const items: ModerationItem[] = [
    ...places.map((p) => ({
      type: "place" as const,
      id: p.id,
      name: p.name,
      href: `/lugares/${p.slug}`,
      hidden: Boolean(p.hidden_at),
    })),
    ...achados.map((a) => ({
      type: "achado" as const,
      id: a.id,
      name: a.title,
      href: `/achados/${a.id}`,
      hidden: Boolean(a.hidden_at),
    })),
  ].map((it) => {
    const reps = forTarget(it.type, it.id);
    return {
      ...it,
      reports: reps.length,
      reasons: [...new Set(reps.map((r) => r.reason))],
      details: reps.map((r) => r.details).filter((d): d is string => Boolean(d)),
    };
  });
  return items.sort((a, b) => Number(b.hidden) - Number(a.hidden) || b.reports - a.reports);
}
