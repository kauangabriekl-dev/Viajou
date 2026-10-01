"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveSuggestedItinerary } from "@/lib/actions/suggested";

export function SaveSuggestedButton({
  destinationId,
  days,
  signedIn,
  loginHref,
}: {
  destinationId: string;
  days: number;
  signedIn: boolean;
  loginHref: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const className =
    "inline-flex min-h-12 items-center gap-2 rounded-full bg-agua px-6 font-semibold text-tinta hover:bg-agua-600 disabled:opacity-60";

  if (!signedIn) {
    return (
      <Link href={loginHref} className={className}>
        <Bookmark aria-hidden="true" className="h-5 w-5" />
        Entre para salvar nos seus roteiros
      </Link>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await saveSuggestedItinerary(destinationId, days);
            if (result && !result.ok) setError(result.error);
          })
        }
        className={className}
      >
        <Bookmark aria-hidden="true" className="h-5 w-5" />
        {pending ? "Salvando…" : "Salvar nos meus roteiros"}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
