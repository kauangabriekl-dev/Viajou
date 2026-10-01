import Link from "next/link";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { destinationStyleLabel, destinationStyles, destinationStyleValues } from "@/lib/labels";
import { listDestinations } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import type { DestinationStyle } from "@/types/database";

export const metadata = buildMetadata({
  title: "Destinos",
  description: "Destinos de praia, frio, montanha, trilha e mais, avaliados por viajantes.",
  path: "/destinos",
});

function chipClass(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap ${
    active
      ? "bg-petroleo text-white"
      : "border border-linha bg-white text-tinta hover:border-petroleo hover:text-petroleo"
  }`;
}

export default async function DestinationsPage({ searchParams }: PageProps<"/destinos">) {
  const { estilo } = await searchParams;
  const style = destinationStyleValues.find((s) => s === estilo);
  // Os estilos vêm junto de cada destino; a contagem por chip usa a lista inteira.
  const all = await listDestinations(200);
  const destinations = style ? all.filter((d) => d.styles?.includes(style)) : all;
  const count = (s: DestinationStyle) => all.filter((d) => d.styles?.includes(s)).length;

  return (
    <Container>
      <PageHeader
        title={style ? `Destinos: ${destinationStyleLabel(style)}` : "Destinos"}
        description="Escolha o estilo da viagem: praia, frio, montanha, trilha, floresta..."
      />

      <nav aria-label="Estilo de destino" className="-mx-4 mb-8 overflow-x-auto px-4 pb-2">
        <ul className="flex gap-2 sm:flex-wrap">
          <li>
            <Link
              href="/destinos"
              aria-current={style ? undefined : "page"}
              className={chipClass(!style)}
            >
              Todos <span className="text-xs tabular-nums opacity-70">{all.length}</span>
            </Link>
          </li>
          {destinationStyles.map((s) => (
            <li key={s.value}>
              <Link
                href={`/destinos?estilo=${s.value}`}
                aria-current={style === s.value ? "page" : undefined}
                className={chipClass(style === s.value)}
              >
                <StyleIcon style={s.value} />
                {s.label}
                <span className="text-xs tabular-nums opacity-70">{count(s.value)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {destinations.some((d) => d.is_demo) && (
        <div className="mb-6">
          <DemoBadge />
        </div>
      )}
      {destinations.length ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <li key={d.id}>
              <DestinationCard destination={d} />
            </li>
          ))}
        </ul>
      ) : style ? (
        <EmptyState
          title={`Nenhum destino com o estilo “${destinationStyleLabel(style)}” ainda.`}
          description="Os estilos vêm do catálogo e das avaliações. Conhece um destino assim? Avalie e marque em “Bom para”."
          action={{ href: "/destinos", label: "Ver todos os destinos" }}
        />
      ) : (
        <EmptyState title="Nenhum destino cadastrado ainda." />
      )}
    </Container>
  );
}
