import Link from "next/link";
import { Plane } from "lucide-react";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { ReadyItineraryCard } from "@/components/cards/ReadyItineraryCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDestination, listDestinationOptions, listItineraries } from "@/lib/queries";
import { READY_ITINERARIES, durationBands } from "@/lib/ready-itineraries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roteiros",
  description:
    "Roteiros de viagem dia a dia da equipe Viajou e da comunidade, no Brasil e no mundo. Escolha um ou monte o seu.",
  path: "/roteiros",
});

const origins = [
  { value: "equipe", label: "Equipe Viajou" },
  { value: "comunidade", label: "Comunidade" },
] as const;

type Filters = { origem?: string; dias?: string; destino?: string };

function hrefWith(current: Filters, key: keyof Filters, value?: string) {
  const next = { ...current, [key]: value };
  const qs = new URLSearchParams(
    Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();
  return qs ? `/roteiros?${qs}` : "/roteiros";
}

function chipClass(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap ${
    active
      ? "bg-petroleo text-white"
      : "border border-linha bg-white text-tinta hover:border-petroleo hover:text-petroleo"
  }`;
}

/**
 * Vitrine única de roteiros: os prontos da equipe e os publicados pela comunidade,
 * com os mesmos filtros. Para um roteiro sob medida, o caminho é o Vou viajar.
 */
export default async function ItinerariesPage({ searchParams }: PageProps<"/roteiros">) {
  const params = await searchParams;
  const origin = origins.find((o) => o.value === params.origem)?.value;
  const band = durationBands.find((b) => b.value === params.dias);
  const slug = typeof params.destino === "string" ? params.destino : undefined;
  const [destination, destinations] = await Promise.all([
    slug ? getDestination(slug) : null,
    listDestinationOptions(),
  ]);
  const current: Filters = { origem: origin, dias: band?.value, destino: destination?.slug };

  const ready =
    origin === "comunidade"
      ? []
      : READY_ITINERARIES.filter(
          (r) =>
            (!destination || r.destinationSlug === destination.slug) &&
            (!band || band.test(r.days.length)),
        );
  const community =
    origin === "equipe"
      ? []
      : (
          await listItineraries({ destinationId: destination?.id, limit: 48, publicOnly: true })
        ).filter((i) => !band || band.test(i.days_count));
  const total = ready.length + community.length;

  return (
    <Container className="pb-16">
      <PageHeader
        title={destination ? `Roteiros para ${destination.name}` : "Roteiros"}
        description="Roteiros dia a dia da equipe Viajou e de quem já foi. Escolha um, copie e adapte."
        actions={
          <Link
            href="/criar/roteiro"
            className="rounded-full border border-petroleo px-5 py-2.5 text-sm font-bold text-petroleo hover:bg-petroleo hover:text-white"
          >
            Criar roteiro
          </Link>
        }
      />

      <Link
        href={destination ? `/vou-viajar?destino=${destination.id}` : "/vou-viajar"}
        className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-petroleo px-6 py-5 text-white hover:bg-petroleo-900"
      >
        <span className="flex items-center gap-3">
          <Plane aria-hidden="true" className="h-6 w-6 text-agua" />
          <span>
            <span className="block text-lg font-semibold">Quer um roteiro sob medida?</span>
            <span className="block text-sm font-light text-white/85">
              Conte para onde vai e um pouco sobre você: montamos o roteiro no seu ritmo.
            </span>
          </span>
        </span>
        <span className="rounded-full bg-agua px-5 py-2.5 text-sm font-semibold text-tinta">
          Vou viajar
        </span>
      </Link>

      <div className="mb-8 space-y-3">
        {(
          [
            { label: "Feitos por", key: "origem", options: [...origins] },
            { label: "Duração", key: "dias", options: durationBands },
          ] as const
        ).map((g) => (
          <nav key={g.key} aria-label={g.label} className="-mx-4 overflow-x-auto px-4 pb-1">
            <ul className="flex items-center gap-2 sm:flex-wrap">
              <li className="w-24 shrink-0 text-sm font-semibold text-tinta-soft">{g.label}</li>
              <li>
                <Link
                  href={hrefWith(current, g.key)}
                  aria-current={current[g.key] ? undefined : "page"}
                  className={chipClass(!current[g.key])}
                >
                  Todos
                </Link>
              </li>
              {g.options.map((o) => (
                <li key={o.value}>
                  <Link
                    href={hrefWith(current, g.key, o.value)}
                    aria-current={current[g.key] === o.value ? "page" : undefined}
                    className={chipClass(current[g.key] === o.value)}
                  >
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <form action="/roteiros" method="get" className="flex flex-wrap items-center gap-2">
          {origin && <input type="hidden" name="origem" value={origin} />}
          {band && <input type="hidden" name="dias" value={band.value} />}
          <label
            htmlFor="roteiros-destino"
            className="w-24 shrink-0 text-sm font-semibold text-tinta-soft"
          >
            Destino
          </label>
          <select
            id="roteiros-destino"
            name="destino"
            defaultValue={destination?.slug ?? ""}
            className="min-h-11 rounded-xl border border-linha bg-white px-3 text-sm"
          >
            <option value="">Todos os destinos</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-petroleo px-5 text-sm font-bold text-white hover:bg-petroleo-900"
          >
            Filtrar
          </button>
        </form>
      </div>

      <p className="mb-4 text-sm text-tinta-soft" aria-live="polite">
        {total} {total === 1 ? "roteiro" : "roteiros"}
      </p>
      {total ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((r) => (
            <li key={r.slug}>
              <ReadyItineraryCard itinerary={r} />
            </li>
          ))}
          {community.map((i) => (
            <li key={i.id}>
              <ItineraryCard itinerary={i} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhum roteiro com esses filtros ainda."
          description="Monte um sob medida no Vou viajar ou crie o seu para ajudar quem vai depois."
          action={{ href: "/vou-viajar", label: "Ir para o Vou viajar" }}
        />
      )}
    </Container>
  );
}
