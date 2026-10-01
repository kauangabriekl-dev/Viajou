import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { achadoCategoryLabel } from "@/lib/labels";
import { photoUrl } from "@/lib/storage";
import type { Achado } from "@/types/database";

/** Achadinho em cartão: foto, categoria, nome e onde fica. */
export function AchadoCard({ achado }: { achado: Achado }) {
  const cover = achado.photos[0];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-linha hover:ring-petroleo">
      <div className="relative aspect-[4/3] bg-petroleo-100">
        {cover && (
          <Image
            src={photoUrl(cover.storage_path)}
            alt={cover.alt ?? achado.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-petroleo">
          {achadoCategoryLabel(achado.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-lg leading-snug font-semibold text-tinta">
          <Link
            href={`/achados/${achado.id}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {achado.title}
          </Link>
        </h3>
        {achado.location_name && (
          <p className="flex items-start gap-1.5 text-sm text-tinta-soft">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-agua-700" />
            {achado.location_name}
          </p>
        )}
        <p className="mt-auto pt-2 text-xs text-tinta-soft">por {achado.author.full_name}</p>
      </div>
    </article>
  );
}
