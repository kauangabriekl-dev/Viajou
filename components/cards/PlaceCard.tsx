import Image from "next/image";
import Link from "next/link";
import { BedDouble, Landmark, MapPin, Sailboat, Umbrella, Utensils } from "lucide-react";
import { RatingStars } from "@/components/ui/RatingStars";
import { placeTypeLabels } from "@/lib/labels";
import type { PlaceSummary, PlaceType } from "@/types/database";
import { pluralize } from "@/utils/format";

const icons: Record<PlaceType, typeof MapPin> = {
  hotel: BedDouble,
  restaurant: Utensils,
  beach: Umbrella,
  attraction: Landmark,
  tour: Sailboat,
  other: MapPin,
};

export function PlaceCard({ place }: { place: PlaceSummary }) {
  const Icon = icons[place.type];
  return (
    <Link
      href={`/lugares/${place.slug}`}
      className="group relative flex min-w-0 gap-4 rounded-[var(--radius-card)] bg-white p-3 ring-1 ring-linha hover:ring-atlantico"
    >
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-atlantico-100 text-atlantico">
        {place.image_url ? (
          <Image src={place.image_url} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <Icon aria-hidden="true" className="h-8 w-8" />
        )}
      </div>
      <div className="min-w-0 space-y-1 py-1">
        <p className="text-xs font-semibold text-restinga">{placeTypeLabels[place.type]}</p>
        <h3 className="truncate font-extrabold text-tinta group-hover:text-atlantico">
          {place.name}
        </h3>
        {place.reviews_count > 0 ? (
          <p className="flex items-center gap-2 text-xs text-tinta-soft">
            <RatingStars value={Number(place.rating_avg)} size={13} />
            <span>
              {Number(place.rating_avg).toFixed(1).replace(".", ",")} ·{" "}
              {pluralize(place.reviews_count, "avaliação", "avaliações")}
            </span>
          </p>
        ) : (
          <p className="text-xs text-tinta-soft">Ainda sem avaliações</p>
        )}
        {place.is_demo && (
          <p className="text-[11px] font-bold text-maracuja-600">Lugar de demonstração</p>
        )}
      </div>
    </Link>
  );
}
