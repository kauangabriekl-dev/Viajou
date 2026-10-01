import Link from "next/link";
import { Search } from "lucide-react";
import { DestinationCard } from "@/components/cards/DestinationCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { Avatar } from "@/components/ui/Avatar";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";
import { placeTypePlural } from "@/lib/labels";
import { getDestination, listDestinations, listPlaces, searchAll } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import type { PlaceType } from "@/types/database";
import { pluralize } from "@/utils/format";

export async function generateMetadata({ searchParams }: PageProps<"/explorar">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  const meta = buildMetadata({
    title: term ? `Resultados para "${term}"` : "Explorar",
    description: "Busque destinos, hotéis, restaurantes, praias, atrações, usuários e roteiros.",
    path: "/explorar",
  });
  return term ? { ...meta, robots: { index: false } } : meta;
}

const types: PlaceType[] = ["hotel", "restaurant", "beach", "attraction", "tour"];

export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const type = types.includes(params.tipo as PlaceType) ? (params.tipo as PlaceType) : undefined;
  const destSlug = typeof params.destino === "string" ? params.destino : undefined;

  const searchForm = (
    <form
      action="/explorar"
      role="search"
      className="flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 ring-1 ring-linha focus-within:ring-2 focus-within:ring-petroleo"
    >
      <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-tinta-soft" />
      <label htmlFor="explorar-q" className="sr-only">
        Buscar
      </label>
      <input
        id="explorar-q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Destino, hotel, restaurante, praia, usuário…"
        className="min-w-0 flex-1 bg-transparent py-2 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-petroleo px-5 py-2.5 text-sm font-bold text-white hover:bg-petroleo-900"
      >
        Buscar
      </button>
    </form>
  );

  if (q) {
    const results = await searchAll(q, (await getSession())?.userId);
    const total =
      results.destinations.length +
      results.places.length +
      results.profiles.length +
      results.itineraries.length;
    return (
      <Container className="space-y-10 pb-8">
        <PageHeader
          title={`Resultados para “${q}”`}
          description={total ? undefined : "Nada encontrado. Tente outro termo."}
        />
        {searchForm}
        {total === 0 && (
          <EmptyState
            title="Nenhum resultado."
            description="Verifique a grafia ou busque pelo nome da cidade."
          />
        )}
        {results.destinations.length > 0 && (
          <section aria-labelledby="r-destinos" className="space-y-3">
            <h2 id="r-destinos" className="text-xl font-extrabold">
              Destinos
            </h2>
            <ul className="flex flex-wrap gap-2">
              {results.destinations.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/destinos/${d.slug}`}
                    className="inline-flex rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-linha hover:ring-petroleo"
                  >
                    {d.name}, {d.state}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {results.places.length > 0 && (
          <section aria-labelledby="r-lugares" className="space-y-3">
            <h2 id="r-lugares" className="text-xl font-extrabold">
              Lugares
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.places.map((p) => (
                <li key={p.id}>
                  <PlaceCard place={{ ...p, image_url: null }} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {results.profiles.length > 0 && (
          <section aria-labelledby="r-usuarios" className="space-y-3">
            <h2 id="r-usuarios" className="text-xl font-extrabold">
              Usuários
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.profiles.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/perfil/${u.username}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-linha hover:ring-petroleo"
                  >
                    <Avatar name={u.full_name} src={u.avatar_url} />
                    <span>
                      <span className="block font-bold">{u.full_name}</span>
                      <span className="text-sm text-tinta-soft">@{u.username}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {results.itineraries.length > 0 && (
          <section aria-labelledby="r-roteiros" className="space-y-3">
            <h2 id="r-roteiros" className="text-xl font-extrabold">
              Roteiros
            </h2>
            <ul className="space-y-2">
              {results.itineraries.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/roteiros/${i.id}`}
                    className="font-semibold text-petroleo underline"
                  >
                    {i.title}
                  </Link>{" "}
                  <span className="text-sm text-tinta-soft">
                    · {pluralize(i.days_count, "dia", "dias")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    );
  }

  const destination = destSlug ? await getDestination(destSlug) : null;
  const [places, destinations] = await Promise.all([
    listPlaces({ type, destinationId: destination?.id, limit: 48 }),
    type || destination ? Promise.resolve([]) : listDestinations(6),
  ]);
  const chipHref = (t?: PlaceType) => {
    const sp = new URLSearchParams();
    if (destination) sp.set("destino", destination.slug);
    if (t) sp.set("tipo", t);
    const s = sp.toString();
    return s ? `/explorar?${s}` : "/explorar";
  };

  return (
    <Container className="space-y-8 pb-8">
      <PageHeader
        title={destination ? `Explorar ${destination.name}` : "Explorar"}
        description="Encontre onde ficar, comer e o que fazer, com a opinião de quem já foi."
      />
      {searchForm}
      <nav aria-label="Filtrar por tipo" className="relative -mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {[undefined, ...types].map((t) => (
            <li key={t ?? "todos"}>
              <Link
                href={chipHref(t)}
                aria-current={t === type ? "page" : undefined}
                className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap ring-1 ring-linha aria-[current=page]:bg-petroleo aria-[current=page]:text-white"
              >
                {t ? placeTypePlural[t] : "Todos"}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {destinations.length > 0 && (
        <section aria-labelledby="exp-destinos" className="space-y-4">
          <h2 id="exp-destinos" className="text-xl font-extrabold">
            Destinos
          </h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <li key={d.id}>
                <DestinationCard destination={d} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="exp-lugares" className="space-y-4">
        <h2 id="exp-lugares" className="text-xl font-extrabold">
          {type ? placeTypePlural[type] : "Lugares"}
        </h2>
        {places.length ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((p) => (
              <li key={p.id}>
                <PlaceCard place={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum lugar encontrado com esses filtros." />
        )}
      </section>
    </Container>
  );
}
