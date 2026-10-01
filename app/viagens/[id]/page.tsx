import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CalendarDays, MapPin, Trash, Wallet } from "lucide-react";
import { CommentSection } from "@/components/social/CommentSection";
import { LikeButton, SaveButton } from "@/components/social/Buttons";
import { ConfirmAction } from "@/components/social/ConfirmAction";
import { ReportButton } from "@/components/social/ReportButton";
import { ShareButton } from "@/components/social/ShareButton";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { RatingStars } from "@/components/ui/RatingStars";
import { getSession } from "@/lib/auth";
import { deletePost } from "@/lib/actions/posts";
import { placeTypeLabels, tagLabel } from "@/lib/labels";
import { countOf, getPost, listComments, viewerPostState } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/storage";
import {
  formatCents,
  formatDateRange,
  formatRelativeDate,
  pluralize,
  tripDays,
} from "@/utils/format";

const BEACH_LABELS = {
  favorita: "Mais gostou",
  recomenda: "Recomenda",
  nao_voltaria: "Não voltaria",
} as const;

async function load(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  return { post: await getPost(id) };
}

export async function generateMetadata({ params }: PageProps<"/viagens/[id]">) {
  const { id } = await params;
  const post = (await load(id))?.post;
  if (!post) return buildMetadata({ title: "Viagem", path: `/viagens/${id}` });
  const where = post.destination ? ` em ${post.destination.name}` : "";
  const meta = buildMetadata({
    title: `Viagem de ${post.author.full_name}${where}`,
    description: post.body.slice(0, 160),
    path: `/viagens/${id}`,
  });
  const cover = post.photos[0];
  return cover
    ? { ...meta, openGraph: { ...meta.openGraph, images: [{ url: photoUrl(cover.storage_path) }] } }
    : meta;
}

export default async function PostPage({ params }: PageProps<"/viagens/[id]">) {
  const { id } = await params;
  const loaded = await load(id);
  if (!loaded?.post) notFound();
  const { post } = loaded;

  const session = await getSession();
  const viewerId = session?.userId ?? null;
  const [comments, state] = await Promise.all([
    listComments(post.id),
    viewerPostState(viewerId ?? undefined, [post.id]),
  ]);
  const days = tripDays(post.trip_start, post.trip_end);
  const dates = formatDateRange(post.trip_start, post.trip_end);
  const spent = formatCents(post.spent_cents);
  const isOwner = viewerId === post.user_id;

  return (
    <Container className="max-w-3xl space-y-8 py-8 sm:py-12">
      <article className="space-y-6">
        <header className="flex items-center gap-3">
          <Avatar name={post.author.full_name} src={post.author.avatar_url} />
          <div className="min-w-0 flex-1">
            <Link href={`/perfil/${post.author.username}`} className="font-bold hover:underline">
              {post.author.full_name}
            </Link>
            <p className="text-sm text-tinta-soft">
              @{post.author.username} ·{" "}
              <time dateTime={post.created_at}>{formatRelativeDate(post.created_at)}</time>
            </p>
          </div>
        </header>

        {post.destination && (
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <MapPin aria-hidden="true" className="h-6 w-6 text-petroleo" />
            <Link href={`/destinos/${post.destination.slug}`} className="hover:underline">
              {post.destination.name}, {post.destination.state}
            </Link>
          </h1>
        )}

        {post.photos.length > 0 && (
          <ul className={`grid gap-2 ${post.photos.length > 1 ? "grid-cols-2" : ""}`}>
            {post.photos.map((photo, i) => (
              <li
                key={photo.id}
                className={
                  i === 0 && post.photos.length % 2 === 1 && post.photos.length > 1
                    ? "col-span-2"
                    : ""
                }
              >
                <Image
                  src={photoUrl(photo.storage_path)}
                  alt={photo.alt ?? `Foto ${i + 1} da viagem de ${post.author.full_name}`}
                  width={1200}
                  height={900}
                  sizes="(min-width: 768px) 768px, 100vw"
                  priority={i === 0}
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                />
              </li>
            ))}
          </ul>
        )}

        <p className="text-lg leading-relaxed whitespace-pre-line">{post.body}</p>

        <dl className="flex flex-wrap gap-x-6 gap-y-3 rounded-[var(--radius-card)] bg-white p-5 text-sm ring-1 ring-linha">
          {dates && (
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-petroleo" />
              <dt className="sr-only">Datas</dt>
              <dd>
                {dates}
                {days && ` (${pluralize(days, "dia", "dias")})`}
              </dd>
            </div>
          )}
          {spent && (
            <div className="flex items-center gap-2">
              <Wallet aria-hidden="true" className="h-4 w-4 text-petroleo" />
              <dt>Gasto total:</dt>
              <dd className="font-bold">{spent}</dd>
            </div>
          )}
          {post.rating !== null && (
            <div className="flex items-center gap-2">
              <dt>Nota da viagem:</dt>
              <dd>
                <RatingStars value={post.rating} />
              </dd>
            </div>
          )}
          {post.hotel && (
            <div className="flex items-center gap-2">
              <dt>Hospedagem:</dt>
              <dd>
                <Link
                  href={`/lugares/${post.hotel.slug}`}
                  className="font-semibold text-petroleo underline"
                >
                  {post.hotel.name}
                </Link>
              </dd>
            </div>
          )}
          {!dates && !spent && post.rating === null && !post.hotel && (
            <dd className="text-tinta-soft">Sem detalhes adicionais.</dd>
          )}
        </dl>

        {post.places.length > 0 && (
          <section aria-labelledby="visitados-title" className="space-y-3">
            <h2 id="visitados-title" className="font-extrabold">
              Lugares visitados
            </h2>
            <ul className="flex flex-wrap gap-2">
              {post.places.map(({ place }) => (
                <li key={place.slug}>
                  <Link
                    href={`/lugares/${place.slug}`}
                    className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-linha hover:ring-petroleo"
                  >
                    {place.name}{" "}
                    <span className="ml-1 text-tinta-soft">· {placeTypeLabels[place.type]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {post.beachPicks.length > 0 && (
          <section aria-labelledby="praias-title" className="space-y-3">
            <h2 id="praias-title" className="font-semibold text-petroleo">
              Sobre as praias
            </h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {post.beachPicks.map((b) => (
                <div key={b.kind} className="rounded-2xl bg-white p-4 ring-1 ring-linha">
                  <dt className="text-xs font-semibold tracking-wider text-agua-700 uppercase">
                    {BEACH_LABELS[b.kind]}
                  </dt>
                  <dd className="mt-1">
                    <Link
                      href={`/lugares/${b.place.slug}`}
                      className="font-semibold text-tinta hover:underline"
                    >
                      {b.place.name}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Estilo da viagem">
            {post.tags.map((t) => (
              <li
                key={t}
                className="rounded-full bg-petroleo-100 px-3 py-1 text-xs font-semibold text-petroleo"
              >
                {tagLabel(t)}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-1 border-y border-linha py-2">
          <LikeButton
            kind="post"
            targetId={post.id}
            count={countOf(post.likes)}
            initialActive={state.liked.has(post.id)}
            signedIn={Boolean(session)}
          />
          <SaveButton
            kind="post"
            targetId={post.id}
            initialActive={state.saved.has(post.id)}
            signedIn={Boolean(session)}
          />
          <ShareButton title={`Viagem de ${post.author.full_name}`} path={`/viagens/${post.id}`} />
          <span className="ml-auto">
            {isOwner ? (
              <ConfirmAction
                action={deletePost.bind(null, post.id)}
                confirmMessage="Excluir esta publicação? Fotos e comentários também serão removidos."
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-tinta-soft hover:bg-red-50 hover:text-red-700"
                pendingLabel="Excluindo…"
              >
                <Trash aria-hidden="true" className="h-4 w-4" />
                Excluir
              </ConfirmAction>
            ) : (
              <ReportButton targetType="post" targetId={post.id} signedIn={Boolean(session)} />
            )}
          </span>
        </div>
      </article>

      <CommentSection postId={post.id} comments={comments} viewerId={viewerId} />
    </Container>
  );
}
