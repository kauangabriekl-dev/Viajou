import Link from "next/link";
import { Heart, Lock } from "lucide-react";
import type { Itinerary } from "@/types/database";
import { pluralize } from "@/utils/format";

/** Roteiro representado como uma linha de trajeto: cada ponto é um dia. */
export function ItineraryCard({
  itinerary,
  demo = false,
}: {
  itinerary: Itinerary;
  demo?: boolean;
}) {
  const dots = Math.min(itinerary.days_count, 7);
  return (
    <Link
      href={demo ? "#" : `/roteiros/${itinerary.id}`}
      aria-disabled={demo || undefined}
      className="group flex h-full flex-col gap-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha hover:ring-atlantico"
    >
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className="flex flex-1 items-center last:flex-none">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${i === 0 || i === dots - 1 ? "bg-maracuja" : "bg-atlantico"}`}
            />
            {i < dots - 1 && (
              <span className="h-0.5 flex-1 border-t-2 border-dashed border-atlantico/40" />
            )}
          </span>
        ))}
      </div>
      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-tinta group-hover:text-atlantico">
          {!itinerary.is_public && (
            <Lock aria-label="Roteiro privado" className="h-4 w-4 shrink-0 text-tinta-soft" />
          )}
          {itinerary.title}
        </h3>
        {itinerary.description && (
          <p className="line-clamp-2 text-sm text-tinta-soft">{itinerary.description}</p>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 text-xs text-tinta-soft">
        <p>
          {pluralize(itinerary.days_count, "dia", "dias")}
          {itinerary.destination && <> em {itinerary.destination.name}</>}. Por @
          {itinerary.author.username}
        </p>
        <span className="flex shrink-0 items-center gap-1">
          <Heart aria-hidden="true" className="h-3.5 w-3.5" />
          <span className="sr-only">Curtidas:</span>
          {itinerary.likes[0]?.count ?? 0}
        </span>
      </div>
    </Link>
  );
}
