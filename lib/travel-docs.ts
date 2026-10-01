/**
 * Lembretes de documentos para quem viaja com passaporte brasileiro. São orientações
 * gerais e mudam com o tempo: o assistente sempre manda conferir no consulado do país.
 */
import { normalizePlace } from "@/lib/geo-search";

// Mercosul e associados: brasileiros entram com RG (emitido há menos de 10 anos) ou passaporte.
const RG_OK = new Set([
  "argentina",
  "uruguai",
  "paraguai",
  "chile",
  "bolivia",
  "peru",
  "colombia",
  "equador",
  "venezuela",
]);

const SCHENGEN = new Set([
  "portugal",
  "espanha",
  "franca",
  "italia",
  "paises baixos",
  "alemanha",
  "tchequia",
  "suica",
  "austria",
  "grecia",
  "croacia",
  "islandia",
  "finlandia",
  "noruega",
  "belgica",
  "dinamarca",
  "suecia",
  "polonia",
  "hungria",
]);

export function travelDocs(country: string | null | undefined): string[] {
  if (!country) return [];
  const c = normalizePlace(country);
  if (c === "brasil") return [];
  const docs: string[] = [];
  if (RG_OK.has(c)) {
    docs.push("Brasileiros entram com RG emitido há menos de 10 anos ou com passaporte válido.");
  } else {
    docs.push("Passaporte com validade de pelo menos 6 meses depois da volta.");
  }
  if (SCHENGEN.has(c)) {
    docs.push(
      "Espaço Schengen: seguro-viagem com cobertura mínima de 30 mil euros é exigido na entrada.",
    );
  }
  if (c === "estados unidos") docs.push("Os Estados Unidos exigem visto de brasileiros.");
  docs.push(
    "Regras mudam: confira no consulado do país e no portal do Itamaraty antes de comprar.",
  );
  return docs;
}
