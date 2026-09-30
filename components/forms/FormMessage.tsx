import type { ActionResult } from "@/lib/errors";

/** Mensagem geral do formulário (sucesso ou erro), anunciada para leitores de tela. */
export function FormMessage({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok && !state.message) return null;
  const text = state.ok ? state.message : state.error;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        state.ok ? "bg-restinga/10 text-restinga" : "bg-red-50 text-red-800"
      }`}
    >
      {text}
    </p>
  );
}

export function errorsFor(state: ActionResult | null, field: string): string[] | undefined {
  return state && !state.ok ? state.fieldErrors?.[field] : undefined;
}
