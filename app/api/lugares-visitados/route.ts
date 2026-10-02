import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rows, searchKey } from "@/lib/db/client";

const schema = z.object({
  q: z.string().trim().min(2).max(80),
  destino: z.uuid().optional(),
  tipo: z.enum(["hotel", "restaurant", "beach", "attraction", "tour", "other"]).optional(),
});

/**
 * Sugestões para "Lugares visitados": lugares já cadastrados (pela equipe ou por outros
 * viajantes) cujo nome contém o texto digitado. Os do destino escolhido vêm primeiro.
 * GET /api/lugares-visitados?q=espelho&destino=<uuid>&tipo=beach
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parsed = schema.safeParse({
    q: sp.get("q") ?? "",
    destino: sp.get("destino") || undefined,
    tipo: sp.get("tipo") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ results: [] });
  const { q, destino, tipo } = parsed.data;

  const params: unknown[] = [`%${searchKey(q).replace(/[%_]/g, "")}%`, destino ?? null];
  const typeFilter = tipo ? `AND type = $${params.push(tipo)}` : "";
  const results = await rows<{
    id: string;
    name: string;
    type: string;
    city: string | null;
    state: string | null;
    is_community: boolean;
  }>(
    `SELECT id, name, type, city, state, is_community FROM places
      WHERE search_key LIKE $1 AND hidden_at IS NULL ${typeFilter}
      ORDER BY CASE WHEN destination_id = $2 THEN 0 ELSE 1 END, reviews_count DESC, name
      LIMIT 8`,
    params,
  );
  return NextResponse.json({ results });
}
