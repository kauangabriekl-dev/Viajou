import "server-only";
import { checkImage, IMAGE_MAX_FILES, matchesSignature } from "@/lib/images";
import { PHOTOS_BUCKET } from "@/lib/storage";
import type { ServerClient } from "@/lib/supabase/server";

type UploadResult = { ok: true; paths: string[] } | { ok: false; error: string };

/** Extrai arquivos reais (ignora inputs vazios) de um FormData. */
export function filesFrom(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((v): v is File => typeof v === "object" && v !== null && "size" in v && v.size > 0);
}

/**
 * Valida (tipo, extensão, tamanho e assinatura binária) e envia imagens para
 * <userId>/<folder>/<uuid>.<ext>. Se qualquer envio falhar, remove os já enviados.
 * Compressão/redimensionamento: ponto de extensão futuro (ex.: Edge Function).
 */
export async function uploadImages(
  supabase: ServerClient,
  userId: string,
  files: File[],
  folder: "posts" | "avatars" | "complaints",
  maxFiles = IMAGE_MAX_FILES,
): Promise<UploadResult> {
  if (files.length > maxFiles) return { ok: false, error: `Envie no máximo ${maxFiles} imagens.` };

  const prepared: { path: string; file: File }[] = [];
  for (const file of files) {
    const check = checkImage(file);
    if (!check.ok) return { ok: false, error: check.error };
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!matchesSignature(head, file.type)) {
      return { ok: false, error: `"${file.name}" não parece ser uma imagem válida.` };
    }
    prepared.push({ path: `${userId}/${folder}/${crypto.randomUUID()}.${check.extension}`, file });
  }

  const uploaded: string[] = [];
  for (const { path, file } of prepared) {
    const { error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) {
      if (uploaded.length) await supabase.storage.from(PHOTOS_BUCKET).remove(uploaded);
      if (process.env.NODE_ENV !== "production") console.error("[viajou] upload:", error);
      return { ok: false, error: "Não foi possível enviar as imagens. Tente de novo." };
    }
    uploaded.push(path);
  }
  return { ok: true, paths: uploaded };
}

export async function removeImages(supabase: ServerClient, paths: string[]) {
  if (paths.length) await supabase.storage.from(PHOTOS_BUCKET).remove(paths);
}
