import { publicEnv } from "@/lib/env";

export const PHOTOS_BUCKET = "photos";

/** URL pública de um arquivo do bucket de fotos. */
export function photoUrl(path: string): string {
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${PHOTOS_BUCKET}/${path}`;
}
