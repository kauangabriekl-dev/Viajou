import Link from "next/link";
import { z } from "zod";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { TripPlanForm } from "@/components/trips/TripPlanForm";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";
import { tagLabel } from "@/lib/labels";
import {
  getTripPlan,
  listDestinationOptions,
  listItineraries,
  listPlaces,
  listPosts,
} from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { formatCents, formatDateRange, pluralize, tripDays } from "@/utils/format";

export const metadata = buildMetadata({
  title: "Vou viajar",
  description: "Diga para onde vai e veja roteiros, lugares e relatos de quem já foi.",
  path: "/vou-viajar",
});

/** Ordena pelo número de preferências em comum (sem IA: regra simples e explicável). */
function rankByTags<T extends { tags: string[] }>(items: T[], prefs: string[]): T[] {
  if (!prefs.length) return items;
  const score = (i: T) => i.tags.filter((t) => prefs.includes(t)).length;
  return [...items].sort((a, b) => score(b) - score(a));
}

export default async function TripPlannerPage({ searchParams }: PageProps<"/vou-viajar">) {
  const params = await searchParams;
  const session = await getSession();

  const planId =
    typeof params.plano === "string" && z.uuid().safeParse(params.plano).success
      ? params.plano
      : null;
  const plan = planId && session ? await getTripPlan(planId, session.userId) : null;

  if (!plan) {
    const destinations = await listDestinationOptions();
    const initial =
      typeof params.destino === "string" && destinations.some((d) => d.id === params.destino)
        ? params.destino
        : "";
    return (
      <Container className="max-w-2xl pb-8">
        <PageHeader
          title="Vou viajar"
          description="Conte para onde, quando e do que você gosta. Mostramos roteiros, lugares e relatos da comunidade."
        />
        <TripPlanForm
          destinations={destinations}
          initialDestinationId={initial}
          signedIn={Boolean(session)}
        />
      </Container>
    );
  }

  const [itineraries, posts, hotels, restaurants, attractions] = await Promise.all([
    listItineraries({ destinationId: plan.destination.id, limit: 30, publicOnly: true }),
    listPosts({ destinationId: plan.destination.id, limit: 30 }),
    listPlaces({ destinationId: plan.destination.id, type: "hotel", limit: 3 }),
    listPlaces({ destinationId: plan.destination.id, type: "restaurant", limit: 3 }),
    listPlaces({ destinationId: plan.destination.id, type: "attraction", limit: 3 }),
  ]);
  const days = tripDays(plan.start_date, plan.end_date) ?? 1;
  // Roteiros com duração próxima da viagem vêm primeiro; depois, por preferências.
  const rankedItineraries = rankByTags(
    [...itineraries].sort((a, b) => Math.abs(a.days_count - days) - Math.abs(b.days_count - days)),
    plan.preferences,
  ).slice(0, 6);
  const rankedPosts = rankByTags(posts, plan.preferences).slice(0, 6);
  const places = [...hotels, ...restaurants, ...attractions];

  return (
    <Container className="space-y-14 pb-8">
      <div>
        <PageHeader
          title={`Sua viagem para ${plan.destination.name}`}
          description={`${formatDateRange(plan.start_date, plan.end_date)} · ${pluralize(days, "dia", "dias")} · ${pluralize(plan.travelers, "pessoa", "pessoas")}${
            plan.budget_cents !== null ? ` · orçamento de ${formatCents(plan.budget_cents)}` : ""
          }`}
          actions={
            <Link
              href="/vou-viajar"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold ring-1 ring-linha"
            >
              Novo plano
            </Link>
          }
        />
        {plan.preferences.length > 0 && (
          <p className="-mt-4 text-sm text-petroleo">
            Preferências: {plan.preferences.map(tagLabel).join(", ")}
          </p>
        )}
        <p className="mt-2 text-xs text-tinta-soft">
          Sugestões baseadas em conteúdo publicado pela comunidade para este destino.
        </p>
      </div>

      <section aria-labelledby="vv-roteiros">
        <SectionHeading id="vv-roteiros" title="Roteiros parecidos com a sua viagem" />
        {rankedItineraries.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rankedItineraries.map((i) => (
              <li key={i.id}>
                <ItineraryCard itinerary={i} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Ainda não há roteiros para este destino."
            action={{ href: "/criar/roteiro", label: "Criar o seu" }}
          />
        )}
      </section>

      <section aria-labelledby="vv-lugares">
        <SectionHeading
          id="vv-lugares"
          title="Onde ficar, comer e o que visitar"
          href={`/destinos/${plan.destination.slug}`}
          linkLabel="Ver destino"
        />
        {places.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum lugar cadastrado neste destino ainda." />
        )}
      </section>

      <section aria-labelledby="vv-relatos">
        <SectionHeading id="vv-relatos" title="Experiências de quem já foi" />
        {rankedPosts.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rankedPosts.map((p) => (
              <li key={p.id} className="flex">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Ninguém publicou sobre este destino ainda." />
        )}
      </section>
    </Container>
  );
}
