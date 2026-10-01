import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { Scene, type SceneKind } from "@/components/ui/Scene";
import { destinationStyleLabel } from "@/lib/labels";
import { destinationCover } from "@/lib/photos";
import { budgetLabel, type ReadyItinerary } from "@/lib/ready-itineraries";

function sceneOf(r: ReadyItinerary): SceneKind {
  if (r.styles.includes("praia")) return "beach";
  if (r.styles.some((s) => s === "montanha" || s === "frio" || s === "trilha")) return "mountain";
  return "city";
}

/** Cartão de roteiro pronto: foto do destino quando o Viajou tem uma, senão ilustração. */
export function ReadyItineraryCard({ itinerary: r }: { itinerary: ReadyItinerary }) {
  const cover = r.destinationSlug ? destinationCover(r.destinationSlug) : null;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-linha bg-white">
      <div className="relative aspect-[16/9] overflow-hidden">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Scene kind={sceneOf(r)} className="h-full w-full" />
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-petroleo">
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
          {r.days.length} dias
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg leading-snug font-semibold tracking-tight text-tinta">
          <Link
            href={`/roteiros/prontos/${r.slug}`}
            className="group-hover:text-petroleo after:absolute after:inset-0 after:content-['']"
          >
            {r.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-sm text-tinta-soft">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          {r.place}, {r.country} · {budgetLabel[r.budget]}
        </p>
        <p className="line-clamp-2 text-sm font-light text-tinta-soft">{r.summary}</p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Estilos">
          {r.styles.slice(0, 3).map((s) => (
            <li
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-petroleo-100 px-2.5 py-1 text-xs text-petroleo"
            >
              <StyleIcon style={s} className="h-3.5 w-3.5" />
              {destinationStyleLabel(s)}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
