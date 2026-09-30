import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";
import { ReportButton } from "@/components/social/ReportButton";
import type { Review } from "@/types/database";
import { formatDate, formatRelativeDate } from "@/utils/format";

type ReviewCardProps = { review: Review; viewerId: string | null; showPlace?: boolean };

export function ReviewCard({ review, viewerId, showPlace }: ReviewCardProps) {
  return (
    <article className="space-y-3 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha">
      <header className="flex items-start gap-3">
        <Avatar name={review.author.full_name} src={review.author.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <Link href={`/perfil/${review.author.username}`} className="font-bold hover:underline">
            {review.author.full_name}
          </Link>
          <p className="text-xs text-tinta-soft">
            @{review.author.username} ·{" "}
            <time dateTime={review.created_at}>{formatRelativeDate(review.created_at)}</time>
            {review.visited_on && <> · visitou em {formatDate(review.visited_on)}</>}
          </p>
        </div>
        <RatingStars value={review.rating} />
      </header>
      {showPlace && review.place && (
        <Link
          href={`/lugares/${review.place.slug}`}
          className="text-sm font-bold text-atlantico hover:underline"
        >
          {review.place.name}
        </Link>
      )}
      {review.title && <h3 className="font-extrabold">{review.title}</h3>}
      <p className="whitespace-pre-line text-tinta">{review.body}</p>
      {review.scores.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
          {review.scores.map((s) => (
            <div key={s.category.key}>
              <dt className="text-xs text-tinta-soft">{s.category.label}</dt>
              <dd>
                <RatingStars value={s.score} size={12} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {viewerId !== review.user_id && (
        <div className="-ml-3">
          <ReportButton targetType="review" targetId={review.id} signedIn={Boolean(viewerId)} />
        </div>
      )}
    </article>
  );
}
