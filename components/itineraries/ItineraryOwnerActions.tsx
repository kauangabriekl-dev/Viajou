"use client";

import { Copy, Globe, Lock, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmAction } from "@/components/social/ConfirmAction";
import { copyItinerary, deleteItinerary, setItineraryVisibility } from "@/lib/actions/itineraries";

const btn =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-tinta-soft hover:bg-petroleo-100 hover:text-petroleo disabled:opacity-60";

export function CopyItineraryButton({ id, signedIn }: { id: string; signedIn: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!signedIn) {
    return (
      <Link href={`/login?next=/roteiros/${id}`} className={btn}>
        <Copy aria-hidden="true" className="h-5 w-5" /> Copiar para mim
      </Link>
    );
  }
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          startTransition(async () => {
            const r = await copyItinerary(id);
            if (r && !r.ok) setError(r.error);
          })
        }
      >
        <Copy aria-hidden="true" className="h-5 w-5" /> {pending ? "Copiando…" : "Copiar para mim"}
      </button>
      {error && (
        <span role="alert" className="px-3 text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}

export function OwnerActions({ id, isPublic }: { id: string; isPublic: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          startTransition(async () => {
            const r = await setItineraryVisibility(id, !isPublic);
            setMessage(r.ok ? (r.message ?? null) : r.error);
          })
        }
      >
        {isPublic ? (
          <Lock aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Globe aria-hidden="true" className="h-4 w-4" />
        )}
        {isPublic ? "Tornar privado" : "Publicar"}
      </button>
      <ConfirmAction
        action={() => deleteItinerary(id)}
        confirmMessage="Excluir este roteiro? Essa ação não pode ser desfeita."
        className={`${btn} hover:bg-red-50 hover:text-red-700`}
        pendingLabel="Excluindo…"
      >
        <Trash aria-hidden="true" className="h-4 w-4" /> Excluir
      </ConfirmAction>
      {message && (
        <span role="status" className="text-xs text-tinta-soft">
          {message}
        </span>
      )}
    </div>
  );
}
