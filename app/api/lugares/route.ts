import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchPlaces } from "@/lib/geo-search";
import { getPlacesIndex } from "@/lib/geo.server";

const querySchema = z.string().trim().min(2).max(60);

/** Busca de países e cidades para o globo da home: GET /api/lugares?q=lisboa */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) return NextResponse.json({ results: [] });

  try {
    const index = await getPlacesIndex();
    return NextResponse.json(
      { results: searchPlaces(index, parsed.data, 8) },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[viajou] lugares:", error);
    return NextResponse.json(
      { results: [], error: "A busca de lugares está indisponível agora." },
      { status: 503 },
    );
  }
}
