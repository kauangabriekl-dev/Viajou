import { z } from "zod";
import type { PlaceType } from "@/types/database";

/**
 * Referência a um lugar vinda do formulário de publicação:
 *   "id:<uuid>"           → lugar que já existe no banco
 *   "new:<tipo>:<nome>"   → lugar novo, digitado pela pessoa (será criado ou reaproveitado)
 */
export type PlaceRef =
  { kind: "existing"; id: string } | { kind: "new"; type: PlaceType; name: string };

const PLACE_TYPES = ["hotel", "restaurant", "beach", "attraction", "tour", "other"] as const;

export const placeRefSchema = z.string().transform((value, ctx): PlaceRef => {
  const fail = () => {
    ctx.addIssue({ code: "custom", message: "Lugar inválido." });
    return z.NEVER;
  };
  if (value.startsWith("id:")) {
    const id = value.slice(3);
    return z.uuid().safeParse(id).success ? { kind: "existing", id } : fail();
  }
  const m = value.match(/^new:([a-z]+):([\s\S]+)$/);
  if (!m) return fail();
  const type = m[1] as PlaceType;
  const name = m[2].replace(/\s+/g, " ").trim();
  if (!PLACE_TYPES.includes(type) || name.length < 2 || name.length > 120) return fail();
  return { kind: "new", type, name };
});

export const encodeExisting = (id: string) => `id:${id}`;
export const encodeNew = (type: PlaceType, name: string) => `new:${type}:${name}`;

/** "Praia do Espelho (Trancoso)" → "praia-do-espelho-trancoso" (formato aceito pelo banco). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");
}
