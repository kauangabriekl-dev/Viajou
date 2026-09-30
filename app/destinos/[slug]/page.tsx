import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { MapView } from "@/components/map/MapView";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RatingStars } from "@/components/ui/RatingStars";
import { Scene, sceneFor } from "@/components/ui/Scene";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { placeTypePlural } from "@/lib/labels";
import {
  getDestination,
  listDestinationReviewPhotos,
  listItineraries,
  listPlaces,
  listPosts,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/storage";
import { createClientIfConfigured } from "@/lib/supabase/server";
import type { PlaceType } from "@/types/database";
import { pluralize } from "@/utils/format";

export async function generateMetadata({ params }: PageProps<"/destinos/[slug]">) {
  const { slug } = await params;
  const supabase = await createClientIfConfigured();
  const destination = supabase ? await getDestination(supabase, slug) : null;
  if (!destination) return buildMetadata({ title: "Destino", path: `/destinos/${slug}` });
  return buildMetadata({
    title: `${destination.name}, ${destination.state}: avaliações, lugares e roteiros`,
    description: destination.description ?? `O que viajantes acharam de ${destination.name}.`,
    path: `/destinos/${slug}`,
  });
}

const sections: PlaceType[] = ["hotel", "restaurant", "beach", "attraction", "tour"];

export default async function DestinationPage({ params }: PageProps<"/destinos/[slug]">) {
  const { slug } = await params;
  const supabase = await createClientIfConfigured();
  if (!supabase) return <SetupNotice what="este destino" />;

  const destination = await getDestination(supabase, slug);
  if (!destination) notFound();

  const [places, itineraries, posts, photos] = await Promise.all([
    listPlaces(supabase, { destinationId: destination.id, limit: 60 }),
    listItineraries(supabase, { destinationId: destination.id, limit: 6, publicOnly: true }),
    listPosts(supabase, { destinationId: destination.id, limit: 6 }),
    listDestinationReviewPhotos(supabase, destination.id),
  ]);
  const popular = places.filter((p) => p.reviews_count > 0).slice(0, 4);

  return (
    <>
      <div className="relative h-56 overflow-hidden sm:h-72">
        {destination.cover_url ? (
          <Image
            src={destination.cover_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <Scene
            kind={sceneFor(destination.name, destination.description)}
            className="h-full w-full"
          />
        )}
      </div>

      <Container className="space-y-14 pb-8">
        <header className="relative -mt-12 space-y-3 rounded-[2rem] bg-white p-6 ring-1 ring-linha sm:p-8">
          {destination.is_demo && <DemoBadge />}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{destination.name}</h1>
          <p className="text-tinta-soft">
            {destination.city !== destination.name && `${destination.city}, `}
            {destination.state}, {destination.country}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {destination.reviews_count > 0 ? (
              <>
                <RatingStars value={destination.rating_avg} size={20} />
                <span className="text-lg font-bold">
                  {destination.rating_avg.toFixed(1).replace(".", ",")}
                </span>
                <span className="text-tinta-soft">
                  {pluralize(destination.reviews_count, "avaliação", "avaliações")} dos lugares
                </span>
              </>
            ) : (
              <span className="text-tinta-soft">Ainda sem avaliações.</span>
            )}
          </div>
          {destination.description && (
            <p className="max-w-prose text-lg">{destination.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={`/criar?destino=${destination.id}`}
              className="rounded-full bg-atlantico px-5 py-2.5 text-sm font-bold text-white hover:bg-atlantico-900"
            >
              Contar minha viagem
            </Link>
            <Link
              href={`/vou-viajar?destino=${destination.id}`}
              className="rounded-full bg-maracuja px-5 py-2.5 text-sm font-bold text-tinta hover:bg-maracuja-600"
            >
              Vou viajar para cá
            </Link>
          </div>
        </header>

        {photos.length > 0 && (
          <section aria-labelledby="fotos-title">
            <SectionHeading id="fotos-title" title="Fotos de viajantes" />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((p) => (
                <li key={p.id}>
                  <Link href={`/viagens/${p.post.id}`}>
                    <Image
                      src={photoUrl(p.storage_path)}
                      alt={p.alt ?? `Foto de viagem em ${destination.name}`}
                      width={400}
                      height={400}
                      className="aspect-square w-full rounded-2xl object-cover"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {popular.length > 0 && (
          <section aria-labelledby="populares-title">
            <SectionHeading id="populares-title" title="Lugares populares" />
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {popular.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections.map((type) => {
          const list = places.filter((p) => p.type === type);
          if (!list.length) return null;
          return (
            <section key={type} aria-labelledby={`tipo-${type}`}>
              <SectionHeading
                id={`tipo-${type}`}
                title={placeTypePlural[type]}
                href={`/explorar?destino=${destination.slug}&tipo=${type}`}
                linkLabel="Ver todos"
              />
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <PlaceCard place={p} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {destination.latitude !== null && destination.longitude !== null && (
          <section aria-labelledby="mapa-title">
            <SectionHeading id="mapa-title" title="Localização" />
            <MapView
              latitude={Number(destination.latitude)}
              longitude={Number(destination.longitude)}
              zoom={11}
              label={destination.name}
            />
          </section>
        )}

        <section aria-labelledby="roteiros-title">
          <SectionHeading
            id="roteiros-title"
            title={`Roteiros para ${destination.name}`}
            href={`/roteiros?destino=${destination.slug}`}
            linkLabel="Ver todos"
          />
          {itineraries.length ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {itineraries.map((i) => (
                <li key={i.id}>
                  <ItineraryCard itinerary={i} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhum roteiro para este destino ainda."
              action={{ href: "/criar/roteiro", label: "Criar o primeiro" }}
            />
          )}
        </section>

        <section aria-labelledby="relatos-title">
          <SectionHeading id="relatos-title" title="Publicações recentes" />
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
              title="Ninguém contou como foi aqui ainda."
              action={{ href: `/criar?destino=${destination.id}`, label: "Contar minha viagem" }}
            />
          )}
        </section>
      </Container>
    </>
  );
}
