import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildPlacesIndex, type PlacesData, type PlacesIndex } from "@/lib/geo-search";

/** Caminho do arquivo gerado por scripts/build-geo.mjs (incluído no deploy via next.config.ts). */
export const PLACES_FILE = join(process.cwd(), "data", "geo", "places.json");

let indexPromise: Promise<PlacesIndex> | null = null;

/** Carrega e indexa os ~170 mil lugares uma única vez por processo do servidor. */
export function getPlacesIndex(): Promise<PlacesIndex> {
  indexPromise ??= readFile(PLACES_FILE, "utf8")
    .then((text) => buildPlacesIndex(JSON.parse(text) as PlacesData))
    .catch((error) => {
      indexPromise = null; // permite tentar de novo na próxima requisição
      throw error;
    });
  return indexPromise;
}
