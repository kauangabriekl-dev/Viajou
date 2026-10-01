import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { StayResults, type StayItem } from "@/components/stays/StayResults";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { normalizePlace, searchPlaces } from "@/lib/geo-search";
import { getPlacesIndex } from "@/lib/geo.server";
import { listDestinations, listStaysNear } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { nightsBetween, parseStaySearch, stayLinks } from "@/lib/stays";

export const metadata = buildMetadata({
  title: "Hospedagem",
  description:
    "Encontre onde ficar em qualquer cidade do mundo: mapa, hospedagens recomendadas e comparação de preços.",
  path: "/hospedagem",
});

const POPULAR = [
  "Rio de Janeiro",
  "Gramado",
  "Lisboa",
  "Paris",
  "Nova York",
  "Buenos Aires",
  "Cancún",
  "Tóquio",
];

type Resolved = {
  label: string;
  query: string;
  center: [number, number];
  destinationSlug?: string;
};

/** Destino do Viajou primeiro (nome ou cidade); senão, qualquer cidade ou país da base GeoNames. */
async function resolveWhere(where: string): Promise<Resolved | null> {
  if (!where) return null;
  const key = normalizePlace(where);
  const destinations = await listDestinations(500);
  const d = destinations.find(
    (x) =>
      x.slug === where ||
      normalizePlace(x.name) === key ||
      normalizePlace(x.city) === key ||
      normalizePlace(`${x.name}, ${x.country}`) === key,
  );
  if (d && d.latitude !== null && d.longitude !== null) {
    return {
      label: d.name,
      query: `${d.city}, ${d.country}`,
      center: [Number(d.latitude), Number(d.longitude)],
      destinationSlug: d.slug,
    };
  }
  const [found] = searchPlaces(await getPlacesIndex(), where, 1);
  if (!found) return null;
  return {
    label: found.name,
    query: found.kind === "city" ? `${found.name}, ${found.country}` : found.name,
    center: [found.latitude, found.longitude],
  };
}

const field =
  "min-h-11 w-full rounded-xl border border-linha bg-white px-3 text-sm text-tinta focus:border-petroleo focus:ring-2 focus:ring-agua focus:outline-none";

export default async function StaysPage({ searchParams }: PageProps<"/hospedagem">) {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const search = parseStaySearch(await searchParams, today);
  const [place, destinations] = await Promise.all([
    resolveWhere(search.where),
    listDestinations(500),
  ]);
  const stays = place ? await listStaysNear(place.center[0], place.center[1]) : [];
  const areaLinks = place ? stayLinks(place.query, search) : [];
  const nights =
    search.checkin && search.checkout ? nightsBetween(search.checkin, search.checkout) : null;

  const items: StayItem[] = stays.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city,
    latitude: s.latitude,
    longitude: s.longitude,
    distanceKm: s.distance_km,
    ratingAvg: s.rating_avg,
    reviewsCount: s.reviews_count,
    isDemo: s.is_demo,
    links: stayLinks(`${s.name}, ${s.city ?? place?.query ?? ""}`, search).filter(
      (l) => l.provider === "booking" || l.provider === "google",
    ),
  }));

  return (
    <Container>
      <PageHeader
        title={place ? `Onde ficar em ${place.label}` : "Hospedagem"}
        description="Busque qualquer cidade do mundo, veja no mapa as hospedagens recomendadas por viajantes e compare preços nos maiores sites."
      />

      <form
        action="/hospedagem"
        method="get"
        role="search"
        className="mb-8 grid gap-3 rounded-[var(--radius-card)] bg-espuma p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_0.7fr_0.7fr_auto] lg:items-end"
      >
        <label className="space-y-1 text-sm font-semibold sm:col-span-2 lg:col-span-1">
          Para onde?
          <input
            name="onde"
            defaultValue={search.where}
            list="hospedagem-destinos"
            required
            autoComplete="off"
            placeholder="Cidade, destino ou país"
            className={field}
          />
          <datalist id="hospedagem-destinos">
            {destinations.map((d) => (
              <option key={d.id} value={d.name}>
                {d.country}
              </option>
            ))}
          </datalist>
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Entrada
          <input
            type="date"
            name="entrada"
            min={today}
            defaultValue={search.checkin ?? ""}
            className={field}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Saída
          <input
            type="date"
            name="saida"
            min={today}
            defaultValue={search.checkout ?? ""}
            className={field}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Adultos
          <input
            type="number"
            name="adultos"
            min={1}
            max={16}
            defaultValue={search.adults}
            className={field}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Quartos
          <input
            type="number"
            name="quartos"
            min={1}
            max={8}
            defaultValue={search.rooms}
            className={field}
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-petroleo px-6 text-sm font-bold text-white hover:bg-petroleo-900 sm:col-span-2 lg:col-span-1"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Buscar
        </button>
      </form>

      {search.notice && (
        <p role="status" className="mb-6 rounded-xl bg-sol/20 px-4 py-3 text-sm text-tinta">
          {search.notice}
        </p>
      )}

      {!search.where && (
        <section aria-labelledby="populares" className="pb-16">
          <h2 id="populares" className="mb-3 font-semibold text-tinta-soft">
            Buscas populares
          </h2>
          <ul className="flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <li key={p}>
                <Link
                  href={`/hospedagem?onde=${encodeURIComponent(p)}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-linha bg-white px-4 text-sm font-medium hover:border-petroleo hover:text-petroleo"
                >
                  {p}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {search.where && !place && (
        <p className="mb-16 rounded-2xl border border-dashed border-linha bg-white p-6 text-center">
          Não encontramos “{search.where}”. Tente o nome da cidade, sem abreviações.
        </p>
      )}

      {place && (
        <div className="space-y-8 pb-16">
          <section
            aria-labelledby="comparar"
            className="rounded-[var(--radius-card)] border border-linha bg-white p-5"
          >
            <h2 id="comparar" className="font-bold text-petroleo">
              Comparar preços em {place.label}
            </h2>
            <p className="mt-1 text-sm text-tinta-soft">
              {nights
                ? `${nights} ${nights === 1 ? "noite" : "noites"}, ${search.adults} ${search.adults === 1 ? "adulto" : "adultos"}, ${search.rooms} ${search.rooms === 1 ? "quarto" : "quartos"}. `
                : "Escolha as datas para ver preços exatos. "}
              Cada botão abre a busca do site já preenchida, em nova aba.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {areaLinks.map((l) => (
                <li key={l.provider}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-petroleo px-5 text-sm font-bold text-white hover:bg-petroleo-900"
                  >
                    {l.label}
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
            {place.destinationSlug && (
              <p className="mt-4 text-sm">
                <Link
                  href={`/destinos/${place.destinationSlug}`}
                  className="font-semibold text-petroleo hover:underline"
                >
                  Ver avaliações, dicas e roteiros de {place.label}
                </Link>
              </p>
            )}
          </section>

          <StayResults center={place.center} label={place.label} stays={items} />
        </div>
      )}
    </Container>
  );
}
