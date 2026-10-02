"use client";

import { useState, useTransition } from "react";
import { removeContent, restoreContent } from "@/lib/actions/moderation";
import type { ModerationTarget } from "@/lib/moderation";

/** Restaurar ou remover um item da fila. Remover pede uma segunda confirmação no próprio botão. */
export function ModerationActions({
  type,
  id,
  name,
}: {
  type: ModerationTarget;
  id: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: typeof restoreContent) =>
    start(async () => {
      const result = await fn(type, id);
      setMessage(result.ok ? (result.message ?? "Feito.") : result.error);
      setConfirming(false);
    });

  if (message)
    return (
      <p role="status" className="text-sm text-tinta-soft">
        {message}
      </p>
    );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(restoreContent)}
        className="min-h-11 rounded-full bg-petroleo px-4 text-sm font-bold text-white hover:bg-petroleo-900 disabled:opacity-60"
      >
        Manter no ar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => (confirming ? run(removeContent) : setConfirming(true))}
        className="min-h-11 rounded-full border border-red-300 px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
        aria-label={confirming ? `Confirmar remoção de ${name}` : `Remover ${name}`}
      >
        {confirming ? "Confirmar remoção" : "Remover"}
      </button>
    </div>
  );
}
