import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, MessageSquareWarning, Phone } from "lucide-react";
import { ComplaintCard } from "@/components/cards/ComplaintCard";
import { PostCard } from "@/components/cards/PostCard";
import { ReviewCard } from "@/components/cards/ReviewCard";
import { MapView } from "@/components/map/MapView";
import { ReviewForm } from "@/components/places/ReviewForm";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingStars } from "@/components/ui/RatingStars";
import { Tabs } from "@/components/ui/Tabs";
import { getSession } from "@/lib/auth";
import { placeTypeLabels } from "@/lib/labels";
import {
  getPlace,
  getReviewCategories,
  listComplaints,
  listPostsByPlace,
  listReviews,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { pluralize } from "@/utils/format";

export async function generateMetadata({ params }: PageProps<"/lugares/[slug]">) {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) return buildMetadata({ title: "Lugar", path: `/lugares/${slug}` });
  return buildMetadata({
    title: `${place.name}${place.city ? ` em ${place.city}` : ""}: avaliações de viajantes`,
    description:
      place.description ?? `${placeTypeLabels[place.type]} avaliado por quem já esteve lá.`,
    path: `/lugares/${slug}`,
  });
}

export default async function PlacePage({ params, searchParams }: PageProps<"/lugares/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const place = await getPlace(slug);
  if (!place) notFound();

  const session = await getSession();
  const tab = query.aba === "reclamacoes" || query.aba === "publicacoes" ? query.aba : "avaliacoes";

  const [reviews, complaints, posts, categories] = await Promise.all([
    listReviews({ placeId: place.id }),
    listComplaints({ placeId: place.id }),
    tab === "publicacoes" ? listPostsByPlace(place.id, 12) : Promise.resolve([]),
    getReviewCategories(place.type),
  ]);
  const viewerId = session?.userId ?? null;
  const alreadyReviewed = reviews.some((r) => r.user_id === viewerId);

  // Média por critério, calculada das avaliações carregadas.
  const byCategory = new Map<string, { label: string; total: number; n: number }>();
  for (const r of reviews) {
    for (const s of r.scores) {
      const cur = byCategory.get(s.category.key) ?? { label: s.category.label, total: 0, n: 0 };
      byCategory.set(s.category.key, { ...cur, total: cur.total + s.score, n: cur.n + 1 });
    }
  }

  return (
    <Container className="space-y-8 pt-8 pb-8 sm:pt-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <header className="space-y-3">
          {place.is_demo && <DemoBadge />}
          <p className="text-sm font-semibold text-restinga">
            {placeTypeLabels[place.type]}
            {place.destination && (
              <>
                {" em "}
                <Link href={`/destinos/${place.destination.slug}`} className="underline">
                  {place.destination.name}
                </Link>
              </>
            )}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{place.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {place.reviews_count > 0 ? (
              <>
                <RatingStars value={Number(place.rating_avg)} size={20} />
                <span className="text-lg font-bold">
                  {Number(place.rating_avg).toFixed(1).replace(".", ",")}
                </span>
                <span className="text-tinta-soft">
                  {pluralize(place.reviews_count, "avaliação", "avaliações")}
                </span>
              </>
            ) : (
              <span className="text-tinta-soft">Ainda sem avaliações.</span>
            )}
          </div>
          {place.description && <p className="max-w-prose text-lg">{place.description}</p>}
          {byCategory.size > 0 && (
            <dl className="grid max-w-xl grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
              {[...byCategory.values()].map((c) => (
                <div key={c.label} className="rounded-2xl bg-white p-3 ring-1 ring-linha">
                  <dt className="text-xs text-tinta-soft">{c.label}</dt>
                  <dd className="text-lg font-extrabold">
                    {(c.total / c.n).toFixed(1).replace(".", ",")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {place.image_url && (
            <Image
              src={place.image_url}
              alt={`Foto de ${place.name}`}
              width={960}
              height={540}
              className="mt-4 aspect-video w-full rounded-[var(--radius-card)] object-cover"
            />
          )}
        </header>

        <aside aria-label="Informações" className="space-y-4">
          <div className="space-y-3 rounded-[var(--radius-card)] bg-white p-5 text-sm ring-1 ring-linha">
            <h2 className="font-extrabold">Informações</h2>
            {(place.address || place.city) && (
              <p className="flex gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-petroleo" />
                {[place.address, place.city, place.state].filter(Boolean).join(", ")}
              </p>
            )}
            {place.phone && (
              <p className="flex gap-2">
                <Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-petroleo" />
                <a href={`tel:${place.phone}`} className="underline">
                  {place.phone}
                </a>
              </p>
            )}
            {place.website && (
              <p className="flex gap-2">
                <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0 text-petroleo" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="break-all underline"
                >
                  Site oficial
                </a>
              </p>
            )}
            {!place.address && !place.phone && !place.website && (
              <p className="text-tinta-soft">Sem informações de contato ainda.</p>
            )}
          </div>
          {place.latitude !== null && place.longitude !== null && (
            <MapView
              latitude={Number(place.latitude)}
              longitude={Number(place.longitude)}
              zoom={15}
              label={place.name}
            />
          )}
          <Link
            href={`/lugares/${place.slug}/reclamar`}
            className="flex items-center justify-center gap-2 rounded-full border border-linha bg-white px-5 py-3 text-sm font-bold hover:border-red-300 hover:text-red-700"
          >
            <MessageSquareWarning aria-hidden="true" className="h-4 w-4" />
            Registrar reclamação
          </Link>
        </aside>
      </div>

      <Tabs
        label="Seções do lugar"
        basePath={`/lugares/${place.slug}`}
        active={tab}
        tabs={[
          { key: "avaliacoes", label: "Avaliações", count: reviews.length },
          { key: "reclamacoes", label: "Reclamações", count: complaints.length },
          { key: "publicacoes", label: "Publicações" },
        ]}
      />

      {tab === "avaliacoes" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-label="Avaliações" className="space-y-4">
            {reviews.length ? (
              reviews.map((r) => <ReviewCard key={r.id} review={r} viewerId={viewerId} />)
            ) : (
              <EmptyState
                title="Ninguém avaliou este lugar ainda."
                description="Se você já esteve aqui, sua avaliação ajuda muita gente."
              />
            )}
          </section>
          <div className="lg:sticky lg:top-24 lg:self-start">
            {!session ? (
              <EmptyState
                title="Já esteve aqui?"
                description="Entre na sua conta para avaliar."
                action={{
                  href: `/login?next=/lugares/${place.slug}`,
                  label: "Entrar para avaliar",
                }}
              />
            ) : alreadyReviewed ? (
              <p className="rounded-[var(--radius-card)] bg-restinga/10 p-5 text-sm font-medium text-restinga">
                Você já avaliou este lugar. Obrigado!
              </p>
            ) : (
              <ReviewForm placeId={place.id} categories={categories} />
            )}
          </div>
        </div>
      )}

      {tab === "reclamacoes" && (
        <section aria-label="Reclamações" className="max-w-3xl space-y-4">
          <p className="text-sm text-tinta-soft">
            Reclamações são públicas. Estabelecimentos verificados podem responder diretamente aqui.
          </p>
          {complaints.length ? (
            complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)
          ) : (
            <EmptyState title="Nenhuma reclamação registrada." />
          )}
        </section>
      )}

      {tab === "publicacoes" && (
        <section aria-label="Publicações relacionadas">
          {posts.length ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id} className="flex">
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhuma publicação menciona este lugar ainda."
              action={{ href: "/criar", label: "Publicar uma viagem" }}
            />
          )}
        </section>
      )}
    </Container>
  );
}
