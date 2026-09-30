import Image from "next/image";
import Link from "next/link";
import { RatingStars } from "@/components/ui/RatingStars";
import { Scene, sceneFor } from "@/components/ui/Scene";
import type { DestinationWithStats } from "@/types/database";
import { formatCoordinates, pluralize } from "@/utils/format";

/** Cartão-postal de destino: imagem (ou ilustração), carimbo com a UF e coordenadas. */
export function DestinationCard({ destination }: { destination: DestinationWithStats }) {
  return (
    <Link
      href={`/destinos/${destination.slug}`}
      className="group relative block overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-linha hover:ring-atlantico"
    >
      <div className="relative aspect-[16/10]">
        {destination.cover_url ? (
          <Image
            src={destination.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 80vw"
            className="object-cover"
          />
        ) : (
          <Scene
            kind={sceneFor(destination.name, destination.description)}
            className="h-full w-full"
          />
        )}
        <span
          className="absolute top-3 right-3 flex h-12 w-12 rotate-6 items-center justify-center rounded-md border-2 border-dashed border-white/90 bg-atlantico/85 text-sm font-extrabold text-white"
          aria-hidden="true"
        >
          {destination.state}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-extrabold tracking-tight text-tinta group-hover:text-atlantico">
          {destination.name}
          <span className="sr-only">, {destination.state}</span>
        </h3>
        {destination.reviews_count > 0 ? (
          <p className="flex items-center gap-2 text-sm text-tinta-soft">
            <RatingStars value={destination.rating_avg} size={14} />
            {pluralize(destination.reviews_count, "avaliação", "avaliações")}
          </p>
        ) : (
          <p className="line-clamp-1 text-sm text-tinta-soft">
            {destination.description ?? "Ainda sem avaliações"}
          </p>
        )}
        {destination.latitude !== null && destination.longitude !== null && (
          <p className="pt-2 text-xs text-tinta-soft/80 tabular-nums">
            {formatCoordinates(Number(destination.latitude), Number(destination.longitude))}
          </p>
        )}
      </div>
    </Link>
  );
}
