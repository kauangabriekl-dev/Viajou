import { AchadoCard } from "@/components/achados/AchadoCard";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import type { GlobeDestination } from "@/components/home/DestinationGlobe";
import { Benefits } from "@/components/home/Benefits";
import { Faq } from "@/components/home/Faq";
import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ShareCta } from "@/components/home/ShareCta";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DESTINATION_PHOTOS } from "@/lib/photos";
import type { DestinationWithStats } from "@/types/database";
import {
  listAchados,
  listDestinations,
  listItineraries,
  listPlaces,
  listPosts,
} from "@/lib/queries";

/** Destinos com coordenadas viram pontos no planeta da home. */
function toGlobe(destinations: DestinationWithStats[]): GlobeDestination[] {
  return destinations
    .filter((d) => d.latitude !== null && d.longitude !== null)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      state: d.state,
      country: d.country,
      description: d.description,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      reviewsCount: d.reviews_count,
      ratingAvg: Number(d.rating_avg),
    }));
}

/**
 * Tudo vem do banco. Destinos e lugares de demonstração (seed local) já chegam com is_demo
 * e ganham o selo; relatos e roteiros só aparecem quando alguém publica de verdade.
 */
async function loadHome() {
  const [destinations, posts, itineraries, topPlaces, achados] = await Promise.all([
    listDestinations(500),
    listPosts({ limit: 6 }),
    listItineraries({ limit: 6, publicOnly: true }),
    listPlaces({ minReviews: 1, limit: 6 }),
    listAchados({ limit: 6 }),
  ]);
  return {
    globe: toGlobe(destinations),
    // Na vitrine, primeiro os que têm avaliações ou foto própria; o globo mostra todos.
    destinations: [...destinations]
      .sort(
        (a, b) =>
          b.reviews_count - a.reviews_count ||
          Number(Boolean(DESTINATION_PHOTOS[b.slug])) - Number(Boolean(DESTINATION_PHOTOS[a.slug])),
      )
      .slice(0, 6),
    posts,
    itineraries,
    topPlaces,
    achados,
    demo: false,
    demoDestinations: destinations.some((d) => d.is_demo),
  };
}

export default async function HomePage() {
  const {
    globe,
    destinations,
    posts,
    itineraries,
    topPlaces,
    achados,
    demo,
    demoDestinations: destinationsAreDemo,
  } = await loadHome();
  const badge = demo ? <DemoBadge /> : undefined;

  return (
    <>
      <Hero destinations={globe} demo={destinationsAreDemo && globe.length > 0} />

      <div className="space-y-20 pt-16 sm:space-y-28">
        <Benefits />

        <Container>
          <section aria-labelledby="destinos-title">
            <SectionHeading
              id="destinos-title"
              eyebrow="Escolha pelo planeta ou pela foto"
              lead="Destinos que"
              title="estão bombando"
              href="/destinos"
              linkLabel="Ver todos os destinos"
              badge={destinationsAreDemo ? <DemoBadge /> : undefined}
            />
            {destinations.length > 0 ? (
              <ul className="relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {destinations.map((destination) => (
                  <li key={destination.slug} className="w-[80%] shrink-0 snap-start sm:w-auto">
                    <DestinationCard destination={destination} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum destino cadastrado ainda."
                description="Os destinos aparecem aqui assim que forem adicionados."
              />
            )}
          </section>
        </Container>

        <Container>
          <section aria-labelledby="achados-home-title">
            <SectionHeading
              id="achados-home-title"
              eyebrow="Com foto e localização"
              lead="Achadinhos"
              title="dos viajantes"
              description="Prainhas escondidas, mirantes e cafés marcados no mapa por quem já foi."
              href="/achados"
              linkLabel="Ver no mapa"
            />
            {achados.length > 0 ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {achados.map((a) => (
                  <li key={a.id}>
                    <AchadoCard achado={a} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum achadinho ainda."
                description="Encontrou um lugar especial numa viagem? Marque no mapa para os próximos viajantes."
                action={{ href: "/achados/novo", label: "Postar um achadinho" }}
              />
            )}
          </section>
        </Container>

        <Container>
          <section aria-labelledby="experiencias-title">
            <SectionHeading
              id="experiencias-title"
              lead="Experiências"
              title="reais"
              description="Relatos de viajantes com duração, gastos e o que acharam."
              badge={badge}
            />
            {posts.length > 0 ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <li key={post.id} className="flex">
                    <PostCard post={post} demo={demo} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Ainda não há relatos publicados."
                description="Seja a primeira pessoa a contar como foi a sua viagem."
                action={{ href: "/criar", label: "Publicar uma viagem" }}
              />
            )}
          </section>
        </Container>

        <Container>
          <section aria-labelledby="roteiros-title">
            <SectionHeading
              id="roteiros-title"
              lead="Roteiros da"
              title="comunidade"
              description="Dia a dia, parada por parada. Copie um roteiro e adapte ao seu jeito."
              href="/roteiros"
              linkLabel="Ver todos os roteiros"
              badge={badge}
            />
            {itineraries.length > 0 ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {itineraries.map((itinerary) => (
                  <li key={itinerary.id}>
                    <ItineraryCard itinerary={itinerary} demo={demo} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum roteiro ainda."
                description="Comece criando o primeiro."
                action={{ href: "/criar/roteiro", label: "Montar um roteiro" }}
              />
            )}
          </section>
        </Container>

        {topPlaces.length > 0 && (
          <Container>
            <section aria-labelledby="lugares-title">
              <SectionHeading
                id="lugares-title"
                lead="Lugares mais"
                title="bem avaliados"
                href="/explorar"
                linkLabel="Explorar lugares"
              />
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topPlaces.map((place) => (
                  <li key={place.id}>
                    <PlaceCard place={place} />
                  </li>
                ))}
              </ul>
            </section>
          </Container>
        )}

        <Faq />

        <ShareCta />
      </div>
    </>
  );
}
