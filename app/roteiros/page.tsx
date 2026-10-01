import Link from "next/link";
import { ItineraryCard } from "@/components/cards/ItineraryCard";
import { ReadyItineraryCard } from "@/components/cards/ReadyItineraryCard";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDestination, listDestinationOptions, listItineraries } from "@/lib/queries";
import { READY_ITINERARIES, readyForDestination } from "@/lib/ready-itineraries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roteiros",
  description: "Roteiros de viagem dia a dia criados pela comunidade. Copie e adapte.",
  path: "/roteiros",
});

export default async function ItinerariesPage({ searchParams }: PageProps<"/roteiros">) {
  const params = await searchParams;
  const slug = typeof params.destino === "string" ? params.destino : undefined;
  const destination = slug ? await getDestination(slug) : null;
  const [itineraries, destinations] = await Promise.all([
    listItineraries({ destinationId: destination?.id, limit: 48, publicOnly: true }),
    listDestinationOptions(),
  ]);

  const ready = destination ? readyForDestination(destination.slug) : READY_ITINERARIES.slice(0, 3);

  return (
    <Container>
      <PageHeader
        title={destination ? `Roteiros para ${destination.name}` : "Roteiros"}
        description="Planos dia a dia de quem já foi. Copie um e adapte ao seu jeito."
        actions={
          <Link
            href="/criar/roteiro"
            className="rounded-full bg-petroleo px-5 py-2.5 text-sm font-bold text-white hover:bg-petroleo-900"
          >
            Criar roteiro
          </Link>
        }
      />
      {ready.length > 0 && (
        <section
          aria-labelledby="prontos-title"
          className="mb-12 rounded-[var(--radius-card)] bg-espuma p-5 sm:p-8"
        >
          <SectionHeading
            id="prontos-title"
            lead="Não sabe por onde começar?"
            title="Roteiros prontos"
            href="/roteiros/prontos"
            linkLabel={`Ver todos os ${READY_ITINERARIES.length}`}
          />
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ready.map((r) => (
              <li key={r.slug}>
                <ReadyItineraryCard itinerary={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="mb-4 text-xl font-bold text-petroleo">Roteiros da comunidade</h2>
      <nav aria-label="Filtrar por destino" className="relative -mx-4 mb-8 overflow-x-auto px-4">
        <ul className="flex gap-2">
          <li>
            <Link
              href="/roteiros"
              aria-current={!destination ? "page" : undefined}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ring-1 ring-linha aria-[current=page]:bg-petroleo aria-[current=page]:text-white"
            >
              Todos
            </Link>
          </li>
          {destinations.map((d) => (
            <li key={d.id}>
              <Link
                href={`/roteiros?destino=${d.slug}`}
                aria-current={destination?.id === d.id ? "page" : undefined}
                className="inline-flex rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ring-1 ring-linha aria-[current=page]:bg-petroleo aria-[current=page]:text-white"
              >
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
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
          title="Nenhum roteiro ainda."
          description="Comece criando o primeiro."
          action={{ href: "/criar/roteiro", label: "Criar roteiro" }}
        />
      )}
    </Container>
  );
}
