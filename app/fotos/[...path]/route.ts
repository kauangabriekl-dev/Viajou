import { readFile } from "node:fs/promises";
import { type NextRequest } from "next/server";
import { uploadFilePath } from "@/lib/storage.server";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/**
 * Serve as fotos enviadas pelos usuários (.data/uploads). Só aceita caminhos no formato
 * gerado pelo servidor (<uuid>/<pasta>/<uuid>.<ext>): nada de "../" nem outros arquivos.
 */
export async function GET(_request: NextRequest, { params }: RouteContext<"/fotos/[...path]">) {
  const { path } = await params;
  const file = uploadFilePath(path.join("/"));
  if (!file) return new Response("Não encontrado", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": TYPES[file.split(".").pop() ?? ""] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
