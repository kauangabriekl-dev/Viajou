import Link from "next/link";
import { z } from "zod";
import { BedDouble, Lightbulb, MapPinned, Quote, Sparkles, UtensilsCrossed } from "lucide-react";
import { TripAssistant } from "@/components/assistant/TripAssistant";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/cards/PostCard";
import { ReadyItineraryCard } from "@/components/cards/ReadyItineraryCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { TripPlanForm } from "@/components/trips/TripPlanForm";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";
import { tagLabel } from "@/lib/labels";
import {
  getDestination,
  getDestinationInsights,
  getTripPlan,
  listDestinationOptions,
  listItineraries,
  listPlaces,
  listPosts,
} from "@/lib/queries";
import {
  READY_ITINERARIES,
  readyForDestination,
  readyPeriodLabel,
  type ReadyItinerary,
} from "@/lib/ready-itineraries";
import { buildMetadata } from "@/lib/seo";
import attractionsData from "@/data/attractions.json";
import {
  buildTrip,
  interestLabel,
  readProfile,
  type AttractionPick,
  type PlacePick,
} from "@/lib/trip-builder";
import { formatCents, formatDateRange, pluralize, tripDays } from "@/utils/format";

export const metadata = buildMetadata({
  title: "Vou viajar",
  description:
    "Diga para onde vai e conte sobre você: montamos um roteiro sob medida, com onde ficar, comer e o que visitar.",
  path: "/vou-viajar",
});

/** Ordena pelo número de preferências em comum (sem IA: regra simples e explicável). */
function rankByTags<T extends { tags: string[] }>(items: T[], prefs: string[]): T[] {
  if (!prefs.length) return items;
  const score = (i: T) => i.tags.filter((t) => prefs.includes(t)).length;
  return [...items].sort((a, b) => score(b) - score(a));
}

const attractionKindLabel: Record<AttractionPick["kind"], string> = {
  mirante: "Mirante",
  museu: "Museu",
  praia: "Praia",
  parque: "Parque e natureza",
  mercado: "Mercado",
  praca: "Praça e passeio a pé",
  historia: "Patrimônio histórico",
};

const FOOD =
  /restaurante|almo[cç]o|jantar|caf[eé]|mercado|comida|fondue|tapas|frutos do mar|parrilla|feira|comida de rua/i;

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
          description="Conte para onde, quando e um pouco sobre você. Montamos um roteiro sob medida, com onde ficar, comer e o que visitar."
        />
        <TripPlanForm
          destinations={destinations}
          initialDestinationId={initial}
          signedIn={Boolean(session)}
        />
      </Container>
    );
  }

  const days = tripDays(plan.start_date, plan.end_date) ?? 1;
  const [destination, itineraries, posts, places, insights] = await Promise.all([
    getDestination(plan.destination.slug),
    listItineraries({ destinationId: plan.destination.id, limit: 30, publicOnly: true }),
    listPosts({ destinationId: plan.destination.id, limit: 30 }),
    listPlaces({ destinationId: plan.destination.id, limit: 30 }),
    getDestinationInsights(plan.destination.id, session?.userId),
  ]);
  const styles = destination?.styles ?? [];

  // Roteiro pronto do destino com duração mais próxima da viagem.
  const readyHere = readyForDestination(plan.destination.slug).sort(
    (a, b) => Math.abs(a.days.length - days) - Math.abs(b.days.length - days),
  );
  const ready: ReadyItinerary | null = readyHere[0] ?? null;
  // Outros roteiros prontos com o mesmo estilo e duração parecida, para inspirar.
  const similarReady = READY_ITINERARIES.filter(
    (r) =>
      r.destinationSlug !== plan.destination.slug &&
      r.styles.some((s) => styles.includes(s)) &&
      Math.abs(r.days.length - days) <= 2,
  ).slice(0, 3);

  const profile = readProfile(plan.about, plan.preferences);
  const picks: PlacePick[] = places.map((p) => ({ name: p.name, type: p.type, slug: p.slug }));
  const attractions =
    (attractionsData as Record<string, AttractionPick[]>)[plan.destination.slug] ?? [];
  const trip = buildTrip({
    days,
    profile,
    ready,
    places: picks,
    attractions,
    styles,
    destinationName: plan.destination.name,
  });

  const rankedItineraries = rankByTags(
    [...itineraries].sort((a, b) => Math.abs(a.days_count - days) - Math.abs(b.days_count - days)),
    plan.preferences,
  ).slice(0, 6);
  const rankedPosts = rankByTags(posts, plan.preferences).slice(0, 6);
  const communityPlaces = places
    .filter((p) => p.type === "hotel" || p.type === "restaurant" || p.type === "attraction")
    .slice(0, 9);

  const readyStops = ready?.days.flatMap((d) => d.stops) ?? [];
  const toVisit = (
    readyStops.length
      ? readyStops.filter((s) => !FOOD.test(`${s.title} ${s.note}`))
      : attractions.map((a) => ({ title: a.name, note: attractionKindLabel[a.kind] }))
  ).slice(0, 6);
  const toEat = readyStops.filter((s) => FOOD.test(`${s.title} ${s.note}`)).slice(0, 4);
  const stayHref = `/hospedagem?${new URLSearchParams({
    onde: plan.destination.name,
    entrada: plan.start_date,
    saida: plan.end_date,
    adultos: String(Math.min(16, plan.travelers)),
  })}`;

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
        {plan.about && (
          <figure className="mt-4 max-w-3xl rounded-2xl bg-espuma p-4">
            <figcaption className="mb-1 flex items-center gap-1 text-xs font-semibold text-tinta-soft">
              <Quote aria-hidden="true" className="h-3.5 w-3.5" />
              Sobre você
            </figcaption>
            <blockquote className="text-sm whitespace-pre-line text-tinta">{plan.about}</blockquote>
          </figure>
        )}
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section aria-labelledby="vv-seu-roteiro">
          <SectionHeading
            id="vv-seu-roteiro"
            lead="Montamos para você"
            title={`${pluralize(days, "dia", "dias")} em ${plan.destination.name}`}
          />
          <div className="mb-6 rounded-2xl border border-agua/50 bg-white p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-petroleo">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-agua-700" />
              Por que montamos assim
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-soft">
              {trip.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
              {!plan.about && (
                <li>
                  Quer um roteiro mais a sua cara? Crie um{" "}
                  <Link href="/vou-viajar" className="font-semibold text-petroleo underline">
                    novo plano
                  </Link>{" "}
                  e preencha “Conte sobre você”.
                </li>
              )}
            </ul>
            {(profile.likes.length > 0 || profile.dislikes.length > 0) && (
              <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {profile.likes.map((l) => (
                  <span key={l} className="rounded-full bg-petroleo-100 px-2.5 py-1 text-petroleo">
                    Gosta de {interestLabel[l]}
                  </span>
                ))}
                {profile.dislikes.map((l) => (
                  <span key={l} className="rounded-full bg-linha px-2.5 py-1 text-tinta-soft">
                    Sem {interestLabel[l]}
                  </span>
                ))}
              </p>
            )}
          </div>
          <ol className="space-y-6">
            {trip.days.map((day, i) => (
              <li key={`${i}-${day.title}`} className="relative border-l-2 border-agua pl-6">
                <span
                  aria-hidden="true"
                  className="absolute top-0 -left-[13px] grid h-6 w-6 place-items-center rounded-full bg-petroleo text-xs font-bold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">
                  <span className="sr-only">Dia {i + 1}: </span>
                  {day.title}
                </h3>
                <ul className="mt-3 space-y-3">
                  {day.stops.map((stop) => (
                    <li key={`${stop.period}-${stop.title}`} className="rounded-xl bg-espuma p-4">
                      <p className="text-xs font-semibold tracking-wide text-agua-700 uppercase">
                        {readyPeriodLabel[stop.period]}
                      </p>
                      <p className="font-semibold text-tinta">{stop.title}</p>
                      <p className="text-sm text-tinta-soft">{stop.note}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {trip.tips.length > 0 && (
            <div className="mt-6 rounded-2xl bg-petroleo p-5 text-white">
              <p className="mb-2 flex items-center gap-2 font-bold">
                <Lightbulb aria-hidden="true" className="h-5 w-5 text-sol" />
                Dicas para o seu jeito de viajar
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-white/85">
                {trip.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-xs text-tinta-soft">
            Roteiro montado automaticamente a partir do seu texto, dos roteiros prontos da equipe
            Viajou e dos lugares avaliados no destino. Ajuste à vontade.
          </p>
        </section>

        {destination && (
          <div className="lg:sticky lg:top-24">
            <TripAssistant
              destination={{
                slug: destination.slug,
                name: destination.name,
                city: destination.city,
                country: destination.country,
                latitude: destination.latitude === null ? null : Number(destination.latitude),
                longitude: destination.longitude === null ? null : Number(destination.longitude),
                styles,
              }}
              mentions={trip.days.flatMap((d) => d.stops.map((s) => s.title))}
            />
          </div>
        )}
      </div>

      <section aria-labelledby="vv-roteiros">
        <SectionHeading id="vv-roteiros" title="Roteiros parecidos com a sua viagem" />
        {rankedItineraries.length > 0 && (
          <>
            <h3 className="mb-3 text-sm font-semibold text-tinta-soft">Da comunidade</h3>
            <ul className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rankedItineraries.map((i) => (
                <li key={i.id}>
                  <ItineraryCard itinerary={i} />
                </li>
              ))}
            </ul>
          </>
        )}
        {readyHere.length + similarReady.length > 0 ? (
          <>
            <h3 className="mb-3 text-sm font-semibold text-tinta-soft">
              Roteiros prontos da equipe Viajou
            </h3>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...readyHere, ...similarReady].slice(0, 6).map((r) => (
                <li key={r.slug}>
                  <ReadyItineraryCard itinerary={r} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          rankedItineraries.length === 0 && (
            <EmptyState
              title="Ainda não há roteiros publicados para este destino."
              description="Use o roteiro montado acima como ponto de partida."
              action={{ href: "/criar/roteiro", label: "Criar e publicar o seu" }}
            />
          )
        )}
      </section>

      <section aria-labelledby="vv-lugares">
        <SectionHeading
          id="vv-lugares"
          title="Onde ficar, comer e o que visitar"
          href={`/destinos/${plan.destination.slug}`}
          linkLabel="Ver destino"
        />
        {communityPlaces.length > 0 && (
          <ul className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communityPlaces.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-linha bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-petroleo">
              <BedDouble aria-hidden="true" className="h-5 w-5" />
              Onde ficar
            </h3>
            {ready?.base.length ? (
              <ul className="space-y-2 text-sm">
                {ready.base.map((b) => (
                  <li key={b.area}>
                    <span className="font-semibold">{b.area}</span>
                    <span className="text-tinta-soft"> · {b.why}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-tinta-soft">
                Veja no mapa as hospedagens e compare preços para as suas datas.
              </p>
            )}
            <Link
              href={stayHref}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-agua px-4 text-sm font-bold text-tinta hover:bg-agua-600"
            >
              Comparar preços nas suas datas
            </Link>
          </div>
          <div className="rounded-2xl border border-linha bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-petroleo">
              <UtensilsCrossed aria-hidden="true" className="h-5 w-5" />
              Onde comer
            </h3>
            {toEat.length ? (
              <ul className="space-y-2 text-sm">
                {toEat.map((s) => (
                  <li key={s.title}>
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-tinta-soft"> · {s.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-tinta-soft">
                Ainda sem indicações de restaurantes aqui. Veja as dicas de “Onde comer” na página
                do destino ou deixe a sua depois da viagem.
              </p>
            )}
            <Link
              href={`/destinos/${plan.destination.slug}?aba=onde_comer`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-petroleo hover:underline"
            >
              Dicas de onde comer
            </Link>
          </div>
          <div className="rounded-2xl border border-linha bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-bold text-petroleo">
              <MapPinned aria-hidden="true" className="h-5 w-5" />O que visitar
            </h3>
            {toVisit.length ? (
              <ul className="space-y-2 text-sm">
                {toVisit.map((s) => (
                  <li key={s.title}>
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-tinta-soft"> · {s.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-tinta-soft">
                Veja os achadinhos e lugares avaliados na página do destino.
              </p>
            )}
            <Link
              href={`/destinos/${plan.destination.slug}`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-petroleo hover:underline"
            >
              Mais lugares em {plan.destination.name}
            </Link>
          </div>
        </div>
        {ready && (
          <p className="mt-3 text-xs text-tinta-soft">
            Sugestões da equipe Viajou a partir do roteiro “{ready.title}”.
          </p>
        )}
      </section>

      <section aria-labelledby="vv-relatos">
        <SectionHeading id="vv-relatos" title="Experiências de quem já foi" />
        {rankedPosts.length > 0 && (
          <ul className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rankedPosts.map((p) => (
              <li key={p.id} className="flex">
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        )}
        {insights.tips.length > 0 && (
          <ul className="mb-8 grid gap-4 md:grid-cols-2">
            {insights.tips.slice(0, 4).map((t) => (
              <li key={t.id} className="rounded-2xl border border-linha bg-white p-4">
                <p className="font-semibold">{t.title}</p>
                <p className="mt-1 text-sm text-tinta-soft">{t.body}</p>
                <p className="mt-2 text-xs text-tinta-soft">Dica de @{t.author.username}</p>
              </li>
            ))}
          </ul>
        )}
        {rankedPosts.length === 0 && insights.tips.length === 0 && (
          <div className="space-y-5">
            {ready && (
              <div className="rounded-2xl bg-espuma p-5">
                <p className="mb-2 flex items-center gap-2 font-bold text-petroleo">
                  <Lightbulb aria-hidden="true" className="h-5 w-5" />
                  Dicas da equipe Viajou
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-soft">
                  {ready.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-tinta-soft">
                  Estas dicas são da equipe, não relatos de viajantes. Os relatos aparecem aqui
                  assim que alguém da comunidade publicar.
                </p>
              </div>
            )}
            <EmptyState
              title={`Seja a primeira pessoa a contar como foi ${plan.destination.name}.`}
              description="Depois da viagem, publique um relato: ele ajuda quem vai depois de você."
              action={{ href: "/criar", label: "Publicar relato" }}
            />
          </div>
        )}
      </section>
    </Container>
  );
}
