import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { stripLocation } from "@/lib/image-privacy";
import { checkImage, IMAGE_MAX_FILES, matchesSignature } from "@/lib/images";
import { PHOTO_PATH, type PhotoFolder } from "@/lib/storage";

/** Pasta das fotos enviadas (fora do git). Configurável com UPLOAD_DIR. */
// turbopackIgnore: sem ele, o build inclui o projeto inteiro (e public/) em cada função do servidor.
export const UPLOAD_DIR = resolve(
  /*turbopackIgnore: true*/ process.env.UPLOAD_DIR || join(process.cwd(), ".data", "uploads"),
);

/** Caminho absoluto de uma foto, só para caminhos no formato gerado pelo servidor. */
export function uploadFilePath(path: string): string | null {
  if (!PHOTO_PATH.test(path)) return null;
  const full = resolve(UPLOAD_DIR, path);
  return full.startsWith(UPLOAD_DIR) ? full : null;
}

type UploadResult = { ok: true; paths: string[] } | { ok: false; error: string };

/** Extrai arquivos reais (ignora inputs vazios) de um FormData. */
export function filesFrom(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((v): v is File => typeof v === "object" && v !== null && "size" in v && v.size > 0);
}

/**
 * Valida (tipo, extensão, tamanho e assinatura binária) e grava as imagens em
 * <UPLOAD_DIR>/<userId>/<folder>/<uuid>.<ext>. Se qualquer gravação falhar, apaga as já gravadas.
 * Antes de gravar, remove a localização (GPS) dos metadados: veja lib/image-privacy.ts.
 */
export async function uploadImages(
  userId: string,
  files: File[],
  folder: PhotoFolder,
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

  const written: string[] = [];
  try {
    for (const { path, file } of prepared) {
      const target = uploadFilePath(path);
      if (!target) throw new Error("Caminho de foto inválido");
      await mkdir(dirname(target), { recursive: true });
      const clean = stripLocation(new Uint8Array(await file.arrayBuffer()), file.type);
      await writeFile(target, clean, { flag: "wx" });
      written.push(path);
    }
  } catch (error) {
    await removeImages(written);
    if (process.env.NODE_ENV !== "production") console.error("[viajou] upload:", error);
    return { ok: false, error: "Não foi possível enviar as imagens. Tente de novo." };
  }
  return { ok: true, paths: written };
}

export async function removeImages(paths: string[]) {
  await Promise.all(
    paths.map(async (path) => {
      const target = uploadFilePath(path);
      if (target) await rm(target, { force: true });
    }),
  );
}
