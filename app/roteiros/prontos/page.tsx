import Link from "next/link";
import { ReadyItineraryCard } from "@/components/cards/ReadyItineraryCard";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { destinationStyles } from "@/lib/labels";
import { READY_ITINERARIES, durationBands, filterReady } from "@/lib/ready-itineraries";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Roteiros prontos",
  description:
    "Roteiros de viagem dia a dia para quem ainda não sabe o que fazer: Brasil e exterior, de 3 a 7 dias.",
  path: "/roteiros/prontos",
});

const regions = [
  { value: "brasil", label: "Brasil" },
  { value: "internacional", label: "Internacional" },
] as const;

type Filters = { regiao?: string; dias?: string; estilo?: string };

function hrefWith(current: Filters, key: keyof Filters, value?: string) {
  const next = { ...current, [key]: value };
  const qs = new URLSearchParams(
    Object.entries(next).filter((e): e is [string, string] => Boolean(e[1])),
  ).toString();
  return qs ? `/roteiros/prontos?${qs}` : "/roteiros/prontos";
}

function chipClass(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap ${
    active
      ? "bg-petroleo text-white"
      : "border border-linha bg-white text-tinta hover:border-petroleo hover:text-petroleo"
  }`;
}

export default async function ReadyItinerariesPage({
  searchParams,
}: PageProps<"/roteiros/prontos">) {
  const query = await searchParams;
  const region = regions.find((r) => r.value === query.regiao)?.value;
  const duration = durationBands.find((b) => b.value === query.dias)?.value;
  const style = destinationStyles.find((s) => s.value === query.estilo)?.value;
  const current: Filters = { regiao: region, dias: duration, estilo: style };
  const list = filterReady({ region, duration, style });
  // Só mostra estilos que existem em algum roteiro, para não oferecer filtro vazio.
  const usedStyles = destinationStyles.filter((s) =>
    READY_ITINERARIES.some((r) => r.styles.includes(s.value)),
  );

  const groups: {
    label: string;
    key: keyof Filters;
    options: { value: string; label: string }[];
  }[] = [
    { label: "Onde", key: "regiao", options: [...regions] },
    { label: "Duração", key: "dias", options: durationBands },
  ];

  return (
    <Container>
      <PageHeader
        title="Roteiros prontos"
        description="Não sabe por onde começar? Escolha um roteiro dia a dia, com onde ficar e o que costuma ser cobrado à parte."
        actions={
          <Link
            href="/roteiros"
            className="rounded-full border border-petroleo px-5 py-2.5 text-sm font-bold text-petroleo hover:bg-petroleo hover:text-white"
          >
            Roteiros da comunidade
          </Link>
        }
      />

      <div className="mb-8 space-y-4">
        {groups.map((g) => (
          <nav key={g.key} aria-label={g.label} className="-mx-4 overflow-x-auto px-4 pb-1">
            <ul className="flex items-center gap-2 sm:flex-wrap">
              <li className="w-20 shrink-0 text-sm font-semibold text-tinta-soft">{g.label}</li>
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
        <nav aria-label="Estilo" className="-mx-4 overflow-x-auto px-4 pb-1">
          <ul className="flex items-center gap-2 sm:flex-wrap">
            <li className="w-20 shrink-0 text-sm font-semibold text-tinta-soft">Estilo</li>
            <li>
              <Link
                href={hrefWith(current, "estilo")}
                aria-current={style ? undefined : "page"}
                className={chipClass(!style)}
              >
                Todos
              </Link>
            </li>
            {usedStyles.map((s) => (
              <li key={s.value}>
                <Link
                  href={hrefWith(current, "estilo", s.value)}
                  aria-current={style === s.value ? "page" : undefined}
                  className={chipClass(style === s.value)}
                >
                  <StyleIcon style={s.value} />
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="mb-4 text-sm text-tinta-soft" aria-live="polite">
        {list.length} {list.length === 1 ? "roteiro" : "roteiros"}
      </p>
      {list.length ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <li key={r.slug}>
              <ReadyItineraryCard itinerary={r} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhum roteiro pronto com esses filtros."
          description="Tente tirar um dos filtros."
          action={{ href: "/roteiros/prontos", label: "Ver todos" }}
        />
      )}
    </Container>
  );
}
