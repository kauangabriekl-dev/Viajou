import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AchadoCard } from "@/components/achados/AchadoCard";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import { DestinationInsights } from "@/components/destinations/DestinationInsights";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { SectionHeading } from "@/components/home/SectionHeading";
import { MapView } from "@/components/map/MapView";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhotoCredit } from "@/components/ui/PhotoCredit";
import { RatingStars } from "@/components/ui/RatingStars";
import { Scene, sceneFor } from "@/components/ui/Scene";
import { getSession } from "@/lib/auth";
import { destinationStyleLabel, placeTypePlural, tipTopicValues } from "@/lib/labels";
import { destinationCover } from "@/lib/photos";
import {
  getDestination,
  getDestinationInsights,
  listAchados,
  listDestinationReviewPhotos,
  listItineraries,
  listPlaces,
  listPosts,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { photoUrl } from "@/lib/storage";
import type { PlaceType, TipTopic } from "@/types/database";
import { pluralize } from "@/utils/format";

export async function generateMetadata({ params }: PageProps<"/destinos/[slug]">) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return buildMetadata({ title: "Destino", path: `/destinos/${slug}` });
  return buildMetadata({
    title: `${destination.name}, ${destination.state}: avaliações, lugares e roteiros`,
    description: destination.description ?? `O que viajantes acharam de ${destination.name}.`,
    path: `/destinos/${slug}`,
  });
}

const sections: PlaceType[] = ["hotel", "restaurant", "beach", "attraction", "tour"];

export default async function DestinationPage({
  params,
  searchParams,
}: PageProps<"/destinos/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const activeTopic: TipTopic | "todas" = tipTopicValues.includes(query.aba as TipTopic)
    ? (query.aba as TipTopic)
    : "todas";

  const destination = await getDestination(slug);
  if (!destination) notFound();

  const session = await getSession();
  const [places, itineraries, posts, photos, insights, achados] = await Promise.all([
    listPlaces({ destinationId: destination.id, limit: 60 }),
    listItineraries({ destinationId: destination.id, limit: 6, publicOnly: true }),
    listPosts({ destinationId: destination.id, limit: 6 }),
    listDestinationReviewPhotos(destination.id),
    getDestinationInsights(destination.id, session?.userId),
    listAchados({ destinationId: destination.id, limit: 6 }),
  ]);
  const popular = places.filter((p) => p.reviews_count > 0).slice(0, 4);
  const cover = destinationCover(destination.slug, destination.cover_url);

  return (
    <>
      <div className="relative h-64 overflow-hidden sm:h-96">
        {cover ? (
          <Image
            src={cover.src}
            alt={`Paisagem de ${destination.name}`}
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
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,42,55,0)_40%,rgba(10,42,55,0.55)_100%)]"
        />
        {cover?.credit && (
          <PhotoCredit
            credit={cover.credit}
            className="absolute top-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-white"
          />
        )}
      </div>

      <Container className="space-y-14 pb-8">
        <header className="relative -mt-12 space-y-3 rounded-[2rem] bg-white p-6 ring-1 ring-linha sm:p-8">
          {destination.is_demo && <DemoBadge />}
          <h1 className="text-4xl font-bold tracking-tight text-petroleo sm:text-5xl">
            {destination.name}
          </h1>
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
          {destination.styles && destination.styles.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Estilos do destino">
              {destination.styles.map((style) => (
                <li key={style}>
                  <Link
                    href={`/destinos?estilo=${style}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-petroleo-100 px-3 text-sm font-medium text-petroleo hover:bg-petroleo hover:text-white"
                  >
                    <StyleIcon style={style} />
                    {destinationStyleLabel(style)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {destination.description && (
            <p className="max-w-prose text-lg">{destination.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={`/criar?destino=${destination.id}`}
              className="rounded-full bg-petroleo px-5 py-2.5 text-sm font-bold text-white hover:bg-petroleo-900"
            >
              Contar minha viagem
            </Link>
            <Link
              href={`/vou-viajar?destino=${destination.id}`}
              className="rounded-full bg-agua px-5 py-2.5 text-sm font-bold text-tinta hover:bg-agua-600"
            >
              Vou viajar para cá
            </Link>
          </div>
        </header>

        <DestinationInsights
          insights={insights}
          destination={{ id: destination.id, name: destination.name, slug: destination.slug }}
          viewerId={session?.userId ?? null}
          activeTopic={activeTopic}
        />

        <section aria-labelledby="achados-title">
          <SectionHeading
            id="achados-title"
            lead="Achadinhos perto de"
            title={destination.name}
            description="Lugares especiais marcados no mapa por quem já foi."
            href="/achados"
            linkLabel="Ver todos"
          />
          {achados.length ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {achados.map((a) => (
                <li key={a.id}>
                  <AchadoCard achado={a} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={`Nenhum achadinho perto de ${destination.name} ainda.`}
              description="Conhece uma prainha, um mirante ou um café escondido por aqui? Marque no mapa."
              action={{ href: "/achados/novo", label: "Postar um achadinho" }}
            />
          )}
        </section>

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
