import Link from "next/link";
import { DestinationGlobe, type GlobeDestination } from "@/components/home/DestinationGlobe";
import { SearchBar } from "@/components/search/SearchBar";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { HERO_PHOTOS } from "@/lib/photos";
import { distanceKm } from "@/lib/geo-search";
import { WORLD_HIGHLIGHTS } from "@/lib/world-highlights";

/**
 * Destinos sugeridos quando o banco ainda não tem destinos com coordenadas.
 * Cidades reais com coordenadas públicas; sem notas nem números inventados.
 */
const FEATURED: GlobeDestination[] = [
  {
    slug: "porto-seguro-ba",
    name: "Porto Seguro",
    state: "BA",
    latitude: -16.45,
    longitude: -39.06,
  },
  {
    slug: "florianopolis-sc",
    name: "Florianópolis",
    state: "SC",
    latitude: -27.59,
    longitude: -48.55,
  },
  {
    slug: "rio-de-janeiro-rj",
    name: "Rio de Janeiro",
    state: "RJ",
    latitude: -22.91,
    longitude: -43.17,
  },
  { slug: "gramado-rs", name: "Gramado", state: "RS", latitude: -29.38, longitude: -50.87 },
  { slug: "fortaleza-ce", name: "Fortaleza", state: "CE", latitude: -3.73, longitude: -38.53 },
].map((d) => ({ ...d, country: "Brasil", description: null, reviewsCount: 0, ratingAvg: 0 }));

/** Centro aproximado do Brasil: é para onde o planeta olha ao abrir. */
const BRAZIL: [number, number] = [-14, -48];

type HeroProps = { destinations: GlobeDestination[]; demo?: boolean };

/**
 * Fotos em tela cheia (mar, neve, pôr do sol) com véu petróleo e o planeta no centro.
 * Logo abaixo, o painel petróleo com a proposta, a busca e os destinos em destaque.
 */
export function Hero({ destinations, demo }: HeroProps) {
  const points = destinations.length > 0 ? destinations : FEATURED;

  return (
    <section aria-labelledby="hero-title" className="relative isolate text-white">
      <div className="relative overflow-hidden">
        <HeroBackdrop photos={HERO_PHOTOS} />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,42,55,0.72)_0%,rgba(10,42,55,0.45)_30%,rgba(15,59,77,0.3)_60%,rgba(30,91,116,0.9)_100%)]"
        />

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-agua" />
            Experiências reais de quem já esteve lá
          </p>
          <h1
            id="hero-title"
            className="mt-5 text-[2.75rem] leading-[1] tracking-[-0.03em] sm:text-7xl"
          >
            <span className="font-light">Para onde </span>
            <span className="font-bold text-agua">vamos?</span>
          </h1>
          <p className="mt-4 max-w-md text-base font-light text-white/90 sm:text-lg">
            Busque qualquer país ou cidade do mundo, ou gire o planeta e toque num ponto verde-água.
          </p>
          {demo && (
            <div className="mt-4 rounded-full bg-white">
              <DemoBadge />
            </div>
          )}

          <div className="mt-6 w-full sm:mt-8">
            <DestinationGlobe
              destinations={points}
              highlights={WORLD_HIGHLIGHTS.filter(
                // Destaque que já virou destino do Viajou some, para não duplicar o pino.
                (h) =>
                  !destinations.some(
                    (d) => distanceKm(h.latitude, h.longitude, d.latitude, d.longitude) < 60,
                  ),
              )}
              initialFocus={BRAZIL}
            />
          </div>
        </div>
      </div>

      <div className="bg-petroleo">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.2fr)] md:items-center md:gap-12 md:py-16">
          <p className="text-4xl leading-tight tracking-tight sm:text-5xl">
            <span className="font-bold text-agua">Viaje</span>{" "}
            <span className="font-bold">sabendo,</span>
            <br />
            <span className="font-light">não adivinhando.</span>
          </p>
          <span aria-hidden="true" className="hidden h-full bg-white/30 md:block" />
          <div className="space-y-5">
            <p className="text-lg font-light text-white/90">
              Notas por critério, relatos com gastos de verdade e roteiros dia a dia.{" "}
              <strong className="font-semibold text-white">
                Tudo escrito por viajantes, não por anunciantes.
              </strong>
            </p>
            <SearchBar size="lg" />
            <nav aria-label="Destinos em destaque">
              <ul className="flex flex-wrap gap-2">
                {points.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/destinos/${d.slug}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-white/35 px-4 text-sm font-medium text-white hover:border-agua hover:bg-agua hover:text-tinta"
                    >
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
