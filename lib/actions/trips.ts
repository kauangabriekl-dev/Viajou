"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { exec, sqlArray } from "@/lib/db/client";
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
  const planId = crypto.randomUUID();

  try {
    await exec(
      `INSERT INTO trip_plans (id, user_id, destination_id, start_date, end_date, travelers, budget_cents, preferences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${sqlArray(d.preferences)})`,
      [
        planId,
        session.userId,
        d.destinationId,
        d.startDate,
        d.endDate,
        d.travelers,
        d.budget ?? null,
      ],
    );
  } catch (error) {
    return { ok: false, error: friendlyError(error as Error, "createTripPlan") };
  }

  redirect(`/vou-viajar?plano=${planId}`);
}
