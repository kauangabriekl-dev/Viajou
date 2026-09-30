/**
 * Regras de upload de imagens, compartilhadas entre cliente (feedback imediato)
 * e servidor (validação obrigatória). O bucket também aplica limite e MIME.
 */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MAX_FILES = 10;

const allowed: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export const IMAGE_ACCEPT = Object.keys(allowed).join(",");

export type ImageCheck = { ok: true; extension: string } | { ok: false; error: string };

type FileLike = { name: string; type: string; size: number };

export function checkImage(file: FileLike): ImageCheck {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extensions = allowed[file.type];
  if (!extensions) return { ok: false, error: `"${file.name}" não é JPG, PNG ou WebP.` };
  if (!extensions.includes(extension)) {
    return { ok: false, error: `A extensão de "${file.name}" não corresponde ao tipo do arquivo.` };
  }
  if (file.size === 0) return { ok: false, error: `"${file.name}" está vazio.` };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, error: `"${file.name}" passa de 5 MB.` };
  return { ok: true, extension: extension === "jpeg" ? "jpg" : extension };
}

/** Confere a assinatura binária (magic bytes) para não confiar só no MIME informado. */
export function matchesSignature(bytes: Uint8Array, mime: string): boolean {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  switch (mime) {
    case "image/jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "image/png":
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8);
    default:
      return false;
  }
}
