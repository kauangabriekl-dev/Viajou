import Link from "next/link";
import { notFound } from "next/navigation";
import { Lightbulb, MapPin, Sparkles, Utensils } from "lucide-react";
import { SaveSuggestedButton } from "@/components/destinations/SaveSuggestedButton";
import { ModularTrip } from "@/components/trips/ModularTrip";
import attractionsData from "@/data/attractions.json";
import { dayTripsFor } from "@/lib/day-trips";
import { readyForDestination } from "@/lib/ready-itineraries";
import { buildTrip, readProfile, type AttractionPick } from "@/lib/trip-builder";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/auth";
import { getDestination, getSuggestionCandidates } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { buildSuggestedItinerary, PERIOD_LABELS } from "@/lib/suggested-itinerary";

const DAY_OPTIONS = [2, 3, 5] as const;

export async function generateMetadata({ params }: PageProps<"/destinos/[slug]/roteiro">) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  return buildMetadata({
    title: destination
      ? `Roteiro em ${destination.name}, montado pelos viajantes`
      : "Roteiro sugerido",
    description: destination
      ? `Roteiro dia a dia para ${destination.name} com os lugares mais bem avaliados e recomendados pela comunidade.`
      : undefined,
    path: `/destinos/${slug}/roteiro`,
  });
}

export default async function SuggestedItineraryPage({
  params,
  searchParams,
}: PageProps<"/destinos/[slug]/roteiro">) {
  const { slug } = await params;
  const query = await searchParams;
  const days = DAY_OPTIONS.includes(Number(query.dias) as 2) ? Number(query.dias) : 3;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const [session, candidates] = await Promise.all([
    getSession(),
    getSuggestionCandidates(destination.id),
  ]);
  const plan = buildSuggestedItinerary(candidates, days);
  // Enquanto a comunidade não avaliou o suficiente, mostramos o roteiro da equipe Viajou,
  // montado com o mesmo motor do "Vou viajar" (sem repetir nem inventar programas).
  const teamTrip = plan
    ? null
    : buildTrip({
        days,
        profile: readProfile(""),
        ready:
          readyForDestination(destination.slug).sort(
            (a, b) => Math.abs(a.days.length - days) - Math.abs(b.days.length - days),
          )[0] ?? null,
        attractions: (attractionsData as Record<string, AttractionPick[]>)[destination.slug] ?? [],
        styles: destination.styles ?? [],
        destinationName: destination.name,
        dayTrips: dayTripsFor(destination.slug),
      });
  const base = `/destinos/${destination.slug}/roteiro`;

  return (
    <Container className="max-w-4xl space-y-8 py-10 sm:py-14">
      <Link
        href={`/destinos/${destination.slug}`}
        className="text-sm font-semibold text-petroleo underline"
      >
        Voltar para {destination.name}
      </Link>
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-agua-700 uppercase">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Roteiro sugerido pela comunidade
        </p>
        <h1 className="text-3xl tracking-tight text-petroleo sm:text-5xl">
          <span className="font-light">{destination.name} em </span>
          <span className="font-bold">{days} dias</span>
        </h1>
        <p className="max-w-prose font-light text-tinta-soft">
          Montado automaticamente com o que os viajantes mais bem avaliam, recomendam, salvam e
          votam como útil. Ele muda sozinho conforme chegam novas avaliações.
        </p>
        <nav aria-label="Duração do roteiro" className="flex flex-wrap gap-2 pt-1">
          {DAY_OPTIONS.map((n) => (
            <Link
              key={n}
              href={`${base}?dias=${n}`}
              aria-current={n === days ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold ${
                n === days
                  ? "bg-petroleo text-white"
                  : "border border-petroleo/30 text-petroleo hover:bg-petroleo-100"
              }`}
            >
              {n} dias
            </Link>
          ))}
        </nav>
      </header>

      {plan ? (
        <>
          <ol className="space-y-6">
            {plan.map((day) => (
              <li
                key={day.day}
                className="rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-linha"
              >
                <h2 className="text-xl font-bold text-petroleo">Dia {day.day}</h2>
                <ol className="mt-4 space-y-4 border-l-2 border-dashed border-agua pl-5">
                  {day.stops.map((stop) => (
                    <li key={stop.key} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute top-1.5 -left-[1.6rem] h-3 w-3 rounded-full bg-agua ring-2 ring-white"
                      />
                      <p className="text-xs font-semibold tracking-wider text-agua-700 uppercase">
                        {PERIOD_LABELS[stop.period]}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 font-semibold text-tinta">
                        {stop.source === "tip" ? (
                          <Lightbulb aria-hidden="true" className="h-4 w-4 text-petroleo" />
                        ) : stop.period === "almoco" || stop.period === "noite" ? (
                          <Utensils aria-hidden="true" className="h-4 w-4 text-petroleo" />
                        ) : (
                          <MapPin aria-hidden="true" className="h-4 w-4 text-petroleo" />
                        )}
                        {stop.placeSlug ? (
                          <Link href={`/lugares/${stop.placeSlug}`} className="hover:underline">
                            {stop.name}
                          </Link>
                        ) : stop.achadoId ? (
                          <Link href={`/achados/${stop.achadoId}`} className="hover:underline">
                            {stop.name}
                          </Link>
                        ) : (
                          stop.name
                        )}
                      </p>
                      {stop.reasons.length > 0 && (
                        <p className="mt-0.5 text-sm text-tinta-soft">
                          Por quê: {stop.reasons.join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
          <SaveSuggestedButton
            destinationId={destination.id}
            days={days}
            signedIn={Boolean(session)}
            loginHref={`/login?next=${encodeURIComponent(`${base}?dias=${days}`)}`}
          />
          <p className="text-xs text-tinta-soft">
            Salvar cria uma cópia privada nos seus roteiros, que você pode editar e publicar.
          </p>
        </>
      ) : teamTrip && (teamTrip.days.length > 0 || teamTrip.remaining.dayTrips.length > 0) ? (
        <>
          <p className="rounded-xl bg-espuma px-4 py-3 text-sm text-tinta-soft">
            Ainda não há avaliações suficientes da comunidade, então este é o roteiro da equipe
            Viajou. Ele dá lugar ao roteiro dos viajantes assim que houver avaliações.
          </p>
          <ModularTrip trip={teamTrip} headingLevel={2} />
          <EmptyState
            title={`Já foi para ${destination.name}?`}
            description="Avalie lugares e deixe dicas: é com elas que o roteiro dos viajantes é montado."
            action={{ href: `/destinos/${destination.slug}#dicas`, label: "Avaliar e dar dicas" }}
          />
        </>
      ) : (
        <EmptyState
          title={`Ainda não há avaliações suficientes de ${destination.name} para montar um roteiro.`}
          description="Quanto mais gente avalia lugares, dá dicas e posta achadinhos, melhor fica o roteiro sugerido. Que tal começar?"
          action={{ href: `/destinos/${destination.slug}#dicas`, label: "Avaliar e dar dicas" }}
        />
      )}
    </Container>
  );
}
