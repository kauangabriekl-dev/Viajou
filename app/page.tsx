import { DestinationCard } from "@/components/cards/DestinationCard";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ShareCta } from "@/components/home/ShareCta";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { demoDestinations, demoItineraries, demoPosts } from "@/lib/demo/home";
import { publicEnv } from "@/lib/env";
import { listDestinations, listItineraries, listPlaces, listPosts } from "@/lib/queries";
import { createClientIfConfigured } from "@/lib/supabase/server";

/** Com Supabase: dados reais. Sem Supabase: demo (se habilitada) ou estados vazios. */
async function loadHome() {
  const supabase = await createClientIfConfigured();
  if (supabase) {
    const [destinations, posts, itineraries, topPlaces] = await Promise.all([
      listDestinations(supabase, 12),
      listPosts(supabase, { limit: 6 }),
      listItineraries(supabase, { limit: 6, publicOnly: true }),
      listPlaces(supabase, { minReviews: 1, limit: 6 }),
    ]);
    return {
      destinations: destinations.slice(0, 6),
      posts,
      itineraries,
      topPlaces,
      demo: false,
      demoDestinations: destinations.some((d) => d.is_demo),
    };
  }
  const demo = publicEnv.NEXT_PUBLIC_SHOW_DEMO_DATA;
  return {
    destinations: demo ? demoDestinations : [],
    posts: demo ? demoPosts : [],
    itineraries: demo ? demoItineraries : [],
    topPlaces: [],
    demo,
    demoDestinations: demo,
  };
}

export default async function HomePage() {
  const {
    destinations,
    posts,
    itineraries,
    topPlaces,
    demo,
    demoDestinations: destinationsAreDemo,
  } = await loadHome();
  const badge = demo ? <DemoBadge /> : undefined;

  return (
    <>
      <Hero />

      <div className="space-y-20 pt-16 sm:space-y-24">
        <Container>
          <section aria-labelledby="destinos-title">
            <SectionHeading
              id="destinos-title"
              title="Destinos que estão bombando"
              href="/destinos"
              linkLabel="Ver todos os destinos"
              badge={destinationsAreDemo ? <DemoBadge /> : undefined}
            />
            {destinations.length > 0 ? (
              <ul className="relative -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {destinations.map((destination) => (
                  <li key={destination.slug} className="w-[78%] shrink-0 snap-start sm:w-auto">
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
          <section aria-labelledby="experiencias-title">
            <SectionHeading
              id="experiencias-title"
              title="Experiências reais"
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
              title="Roteiros da comunidade"
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
                title="Lugares mais bem avaliados"
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

        <ShareCta />
      </div>
    </>
  );
}
