import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { PhotoCredit } from "@/components/ui/PhotoCredit";
import { RatingStars } from "@/components/ui/RatingStars";
import { Scene, sceneFor } from "@/components/ui/Scene";
import { destinationStyleLabel } from "@/lib/labels";
import { destinationCover } from "@/lib/photos";
import { isBrazil } from "@/lib/regions";
import type { DestinationWithStats } from "@/types/database";
import { formatCoordinates, pluralize } from "@/utils/format";

/**
 * Destino em cartão com foto: a imagem ocupa o topo e um painel petróleo embaixo
 * traz nome, nota (só quando há avaliações), coordenadas e o crédito da foto.
 */
export function DestinationCard({ destination }: { destination: DestinationWithStats }) {
  const cover = destinationCover(destination.slug, destination.cover_url);
  // No Brasil a sigla do estado basta; fora, o país diz mais que a região.
  const badge = isBrazil(destination.country) ? destination.state : destination.country;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-petroleo text-white shadow-[0_18px_40px_-24px_rgba(15,59,77,0.8)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        {cover ? (
          <Image
            src={cover.src}
            alt={`Paisagem de ${destination.name}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 80vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Scene
            kind={sceneFor(destination.name, destination.description)}
            className="h-full w-full"
          />
        )}
        <span
          className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-petroleo"
          aria-hidden="true"
        >
          {badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="flex items-start justify-between gap-3 text-xl tracking-tight">
          <Link
            href={`/destinos/${destination.slug}`}
            className="font-semibold after:absolute after:inset-0 after:content-['']"
          >
            {destination.name}
            <span className="sr-only">, {badge}</span>
          </Link>
          <ArrowUpRight
            aria-hidden="true"
            className="h-7 w-7 shrink-0 rounded-full bg-agua p-1 text-tinta transition-transform group-hover:rotate-45"
          />
        </h3>
        {destination.reviews_count > 0 ? (
          <p className="flex items-center gap-2 text-sm text-white/85">
            <RatingStars value={destination.rating_avg} size={14} />
            {pluralize(destination.reviews_count, "avaliação", "avaliações")}
          </p>
        ) : (
          <p className="line-clamp-2 text-sm font-light text-white/85">
            {destination.description ?? "Ainda sem avaliações."}
          </p>
        )}
        {destination.styles && destination.styles.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Estilos">
            {destination.styles.slice(0, 3).map((style) => (
              <li
                key={style}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white"
              >
                <StyleIcon style={style} className="h-3.5 w-3.5" />
                {destinationStyleLabel(style)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-2 text-white/65">
          {destination.latitude !== null && destination.longitude !== null && (
            <p className="text-xs tabular-nums">
              {formatCoordinates(Number(destination.latitude), Number(destination.longitude))}
            </p>
          )}
          {cover?.credit && (
            <PhotoCredit credit={cover.credit} className="relative z-10 text-right" />
          )}
        </div>
      </div>
    </article>
  );
}
