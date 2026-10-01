import "server-only";
import { exec, one, searchKey, type Queryable } from "@/lib/db/client";
import { slugify, type PlaceRef } from "@/lib/place-ref";
import type { PlaceType } from "@/types/database";

type DestinationInfo = { id: string; city: string; state: string; country: string } | null;

/**
 * Transforma a referência do formulário em id de lugar.
 * - Existente: confere que o lugar existe.
 * - Novo: reaproveita um lugar com o mesmo nome (sem acento) no mesmo destino; senão,
 *   cria um "lugar da comunidade" com slug único. Assim, a próxima pessoa que digitar
 *   o mesmo nome encontra o lugar já cadastrado.
 */
export async function resolvePlace(
  on: Queryable,
  ref: PlaceRef,
  ctx: { destination: DestinationInfo; userId: string; forceType?: PlaceType },
): Promise<string> {
  if (ref.kind === "existing") {
    const found = await one<{ id: string }>("SELECT id FROM places WHERE id = $1", [ref.id], on);
    if (!found) throw Object.assign(new Error("Lugar não encontrado"), { code: "P0002" });
    return found.id;
  }

  const type = ctx.forceType ?? ref.type;
  const key = searchKey(ref.name, ctx.destination?.city);
  const existing = await one<{ id: string }>(
    ctx.destination
      ? "SELECT id FROM places WHERE search_key = $1 AND destination_id = $2"
      : "SELECT id FROM places WHERE search_key = $1 AND destination_id IS NULL",
    ctx.destination ? [key, ctx.destination.id] : [key],
    on,
  );
  if (existing) return existing.id;

  const base = slugify(`${ref.name} ${ctx.destination?.city ?? ""}`) || "lugar";
  let slug = base;
  for (let n = 2; await one("SELECT id FROM places WHERE slug = $1", [slug], on); n++) {
    slug = `${base}-${n}`;
  }
  const id = crypto.randomUUID();
  await exec(
    `INSERT INTO places (id, destination_id, slug, name, type, city, state, country, search_key, created_by, is_community)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
    [
      id,
      ctx.destination?.id ?? null,
      slug,
      ref.name,
      type,
      ctx.destination?.city ?? null,
      ctx.destination?.state ?? null,
      ctx.destination?.country ?? "Brasil",
      key,
      ctx.userId,
    ],
    on,
  );
  return id;
}
