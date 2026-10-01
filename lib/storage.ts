/** Pastas de fotos enviadas pelos usuários (primeiro nível depois do id do usuário). */
export const PHOTO_FOLDERS = ["posts", "avatars", "complaints", "achados"] as const;
export type PhotoFolder = (typeof PHOTO_FOLDERS)[number];

/**
 * Caminho válido de foto: <uuid do usuário>/<pasta>/<uuid>.<jpg|png|webp>.
 * Sempre gerado no servidor; a rota /fotos só serve caminhos neste formato.
 */
export const PHOTO_PATH = new RegExp(
  `^[0-9a-f-]{36}/(${PHOTO_FOLDERS.join("|")})/[0-9a-f-]{36}\\.(jpg|png|webp)$`,
);

/** URL de uma foto enviada (servida por app/fotos/[...path]/route.ts). */
export function photoUrl(path: string): string {
  return `/fotos/${path}`;
}
