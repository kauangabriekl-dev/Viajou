"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { friendlyError, type ActionResult } from "@/lib/errors";
import { fieldErrors, tripPlanSchema } from "@/lib/validation";

/**
 * "Vou viajar": salva o plano e leva aos resultados.
 * O MVP só cruza destino + preferências com roteiros e relatos. O plano salvo
 * (datas, pessoas, orçamento) é a entrada que uma IA de roteiros usará no futuro.
 */
export async function createTripPlan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = tripPlanSchema.safeParse({
    destinationId: formData.get("destinationId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    travelers: formData.get("travelers"),
    budget: formData.get("budget") ?? "",
    preferences: formData.getAll("preferences"),
  });
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: fieldErrors(parsed.error),
    };

  const session = await getSession();
  if (!session) return { ok: false, error: "Entre na sua conta para salvar seu plano." };
  const d = parsed.data;

  const { data, error } = await session.supabase
    .from("trip_plans")
    .insert({
      user_id: session.userId,
      destination_id: d.destinationId,
      start_date: d.startDate,
      end_date: d.endDate,
      travelers: d.travelers,
      budget_cents: d.budget ?? null,
      preferences: d.preferences,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: friendlyError(error, "createTripPlan") };

  redirect(`/vou-viajar?plano=${data.id}`);
}
