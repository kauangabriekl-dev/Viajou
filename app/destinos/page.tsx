import Link from "next/link";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { destinationStyleLabel, destinationStyles } from "@/lib/labels";
import { listDestinations } from "@/lib/queries";
import { regionOf, worldRegions } from "@/lib/regions";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Destinos",
  description:
    "Destinos no Brasil e no mundo: praia, frio e neve, montanha, trilha e mais, avaliados por viajantes.",
  path: "/destinos",
});

type Filters = { regiao?: string; estilo?: string };

function hrefWith(current: Filters, key: keyof Filters, value?: string) {
  const next = { ...current, [key]: value };
  const qs = new URLSearchParams(
    Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();
  return qs ? `/destinos?${qs}` : "/destinos";
}

function chipClass(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap ${
    active
      ? "bg-petroleo text-white"
      : "border border-linha bg-white text-tinta hover:border-petroleo hover:text-petroleo"
  }`;
}

export default async function DestinationsPage({ searchParams }: PageProps<"/destinos">) {
  const query = await searchParams;
  const region = worldRegions.find((r) => r.value === query.regiao)?.value;
  const style = destinationStyles.find((s) => s.value === query.estilo)?.value;
  const current: Filters = { regiao: region, estilo: style };

  const all = await listDestinations(500);
  const inRegion = region ? all.filter((d) => regionOf(d.country) === region) : all;
  const destinations = style ? inRegion.filter((d) => d.styles?.includes(style)) : inRegion;
  // Contagens: região respeita o estilo escolhido e vice-versa, para o número bater com o clique.
  const withStyle = style ? all.filter((d) => d.styles?.includes(style)) : all;
  const regionCount = (r: string) => withStyle.filter((d) => regionOf(d.country) === r).length;
  const styleCount = (s: string) => inRegion.filter((d) => d.styles?.includes(s as never)).length;

  const regionLabel = worldRegions.find((r) => r.value === region)?.label;
  const title = [style && destinationStyleLabel(style), regionLabel].filter(Boolean).join(" · ");

  return (
    <Container>
      <PageHeader
        title={title ? `Destinos: ${title}` : "Destinos no Brasil e no mundo"}
        description="Escolha onde e o estilo da viagem: praia, frio e neve, montanha, trilha, floresta..."
      />

      <div className="mb-8 space-y-3">
        <nav aria-label="Região" className="-mx-4 overflow-x-auto px-4 pb-1">
          <ul className="flex items-center gap-2 sm:flex-wrap">
            <li className="w-16 shrink-0 text-sm font-semibold text-tinta-soft">Onde</li>
            <li>
              <Link
                href={hrefWith(current, "regiao")}
                aria-current={region ? undefined : "page"}
                className={chipClass(!region)}
              >
                Mundo todo{" "}
                <span className="text-xs tabular-nums opacity-70">{withStyle.length}</span>
              </Link>
            </li>
            {worldRegions.map((r) => (
              <li key={r.value}>
                <Link
                  href={hrefWith(current, "regiao", r.value)}
                  aria-current={region === r.value ? "page" : undefined}
                  className={chipClass(region === r.value)}
                >
                  {r.label}
                  <span className="text-xs tabular-nums opacity-70">{regionCount(r.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Estilo de destino" className="-mx-4 overflow-x-auto px-4 pb-1">
          <ul className="flex items-center gap-2 sm:flex-wrap">
            <li className="w-16 shrink-0 text-sm font-semibold text-tinta-soft">Estilo</li>
            <li>
              <Link
                href={hrefWith(current, "estilo")}
                aria-current={style ? undefined : "page"}
                className={chipClass(!style)}
              >
                Todos <span className="text-xs tabular-nums opacity-70">{inRegion.length}</span>
              </Link>
            </li>
            {destinationStyles.map((s) => (
              <li key={s.value}>
                <Link
                  href={hrefWith(current, "estilo", s.value)}
                  aria-current={style === s.value ? "page" : undefined}
                  className={chipClass(style === s.value)}
                >
                  <StyleIcon style={s.value} />
                  {s.label}
                  <span className="text-xs tabular-nums opacity-70">{styleCount(s.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

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
      ) : (
        <EmptyState
          title="Nenhum destino com esses filtros ainda."
          description="Os estilos vêm do catálogo e das avaliações. Conhece um destino assim? Avalie e marque em “Bom para”."
          action={{ href: "/destinos", label: "Ver todos os destinos" }}
        />
      )}
    </Container>
  );
}
