import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Heart, MapPin, MessageCircle, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { Scene, sceneFor } from "@/components/ui/Scene";
import { photoUrl } from "@/lib/storage";
import type { Post } from "@/types/database";
import { formatCents, formatRelativeDate, pluralize, tripDays } from "@/utils/format";

/** Card do feed. Recebe dados já carregados; interações ficam na página da publicação. */
export function PostCard({ post, demo = false }: { post: Post; demo?: boolean }) {
  const cover = post.photos[0];
  const days = tripDays(post.trip_start, post.trip_end);
  const spent = formatCents(post.spent_cents);
  const href = demo ? "#" : `/viagens/${post.id}`;

  return (
    <article className="relative flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-white ring-1 ring-linha">
      <header className="flex items-center gap-3 p-4">
        <Avatar name={post.author.full_name} src={post.author.avatar_url} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-tinta">{post.author.full_name}</p>
          <p className="truncate text-xs text-tinta-soft">
            @{post.author.username} ·{" "}
            <time dateTime={post.created_at}>{formatRelativeDate(post.created_at)}</time>
          </p>
        </div>
      </header>
      {cover ? (
        <Image
          src={photoUrl(cover.storage_path)}
          alt={cover.alt ?? `Foto da viagem de ${post.author.full_name}`}
          width={640}
          height={480}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <Scene
          kind={sceneFor(post.tags.join(" "), post.destination?.name, post.body)}
          className="aspect-[4/3] w-full"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {post.destination && (
          <p className="flex items-center gap-1.5 text-sm font-bold text-atlantico">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {post.destination.name}
          </p>
        )}
        <p className="line-clamp-4 text-sm leading-relaxed text-tinta">
          <Link
            href={href}
            className="after:absolute after:inset-0 focus:outline-none"
            aria-disabled={demo || undefined}
          >
            {post.body}
          </Link>
        </p>
        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-tinta-soft">
          {days && (
            <div className="flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              <dt className="sr-only">Duração</dt>
              <dd>{pluralize(days, "dia", "dias")}</dd>
            </div>
          )}
          {spent && (
            <div className="flex items-center gap-1">
              <Wallet aria-hidden="true" className="h-4 w-4" />
              <dt className="sr-only">Valor gasto</dt>
              <dd>{spent}</dd>
            </div>
          )}
          {post.rating !== null && (
            <div className="flex items-center">
              <dt className="sr-only">Avaliação da viagem</dt>
              <dd>
                <RatingStars value={post.rating} size={14} />
              </dd>
            </div>
          )}
        </dl>
      </div>
      <footer className="flex items-center gap-4 border-t border-linha px-4 py-3 text-sm text-tinta-soft">
        <span className="flex items-center gap-1">
          <Heart aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Curtidas:</span>
          {post.likes[0]?.count ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Comentários:</span>
          {post.comments[0]?.count ?? 0}
        </span>
      </footer>
    </article>
  );
}
