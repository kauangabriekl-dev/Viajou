"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createItinerary } from "@/lib/actions/itineraries";
import { getSession } from "@/lib/auth";
import { one } from "@/lib/db/client";
import type { ActionResult } from "@/lib/errors";
import { getSuggestionCandidates } from "@/lib/queries";
import { buildSuggestedItinerary, PERIOD_LABELS, type Period } from "@/lib/suggested-itinerary";

const START_TIME: Record<Period, string> = {
  cafe: "08:00",
  manha: "09:30",
  almoco: "12:30",
  tarde: "15:00",
  noite: "19:00",
};

/**
 * Salva o roteiro sugerido como roteiro privado da pessoa (ela pode editar e publicar depois).
 * O roteiro é recalculado aqui: o cliente só informa destino e número de dias.
 */
export async function saveSuggestedItinerary(
  destinationId: string,
  days: number,
): Promise<ActionResult> {
  if (!z.uuid().safeParse(destinationId).success || ![2, 3, 5].includes(days))
    return { ok: false, error: "Pedido inválido." };
  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para salvar o roteiro." };

  const destination = await one<{ id: string; name: string }>(
    "SELECT id, name FROM destinations WHERE id = $1",
    [destinationId],
  );
  if (!destination) return { ok: false, error: "Destino não encontrado." };
  const plan = buildSuggestedItinerary(await getSuggestionCandidates(destination.id), days);
  if (!plan)
    return { ok: false, error: "Ainda não há avaliações suficientes para sugerir um roteiro." };

  const result = await createItinerary({
    title:
      `Roteiro da comunidade: ${destination.name} em ${plan.length} ${plan.length === 1 ? "dia" : "dias"}`.slice(
        0,
        120,
      ),
    description: "Montado a partir das notas, recomendações e votos dos viajantes no VIAJOU.",
    destinationId: destination.id,
    isPublic: false,
    tags: [],
    days: plan.map((day) => ({
      title: `Dia ${day.day}`,
      stops: day.stops.map((stop) => ({
        placeId: stop.placeSlug ? stop.key.replace(/^place:/, "") : "",
        customName: stop.placeSlug ? "" : stop.name.slice(0, 120),
        startTime: START_TIME[stop.period],
        notes: [PERIOD_LABELS[stop.period], ...stop.reasons].join(" · ").slice(0, 500),
      })),
    })),
  });
  if (!result.ok || !result.data)
    return { ok: false, error: result.ok ? "Não foi possível salvar." : result.error };
  redirect(`/roteiros/${result.data.id}`);
}
