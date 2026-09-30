import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";

const suggestions = [
  { label: "Porto Seguro", slug: "porto-seguro-ba" },
  { label: "Florianópolis", slug: "florianopolis-sc" },
  { label: "Rio de Janeiro", slug: "rio-de-janeiro-rj" },
  { label: "Gramado", slug: "gramado-rs" },
  { label: "Fortaleza", slug: "fortaleza-ce" },
];

/**
 * Céu em cima, mar embaixo. A busca atravessa a linha do horizonte:
 * é o único elemento "ousado" da página; o resto fica contido.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate">
      {/* Céu */}
      <div className="relative isolate overflow-hidden bg-[#cfe6ee]">
        <svg
          viewBox="0 0 1440 360"
          preserveAspectRatio="xMaxYMax meet"
          className="absolute inset-0 -z-10 h-full w-full"
          aria-hidden="true"
        >
          <circle cx="1130" cy="330" r="190" fill="var(--color-maracuja)" opacity="0.2" />
          <circle cx="1130" cy="330" r="120" fill="var(--color-maracuja)" />
          <path
            d="M0 360 C 180 310, 380 322, 560 344 S 860 316, 1000 338 L 1000 360 Z"
            fill="var(--color-restinga)"
            opacity="0.55"
          />
        </svg>
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
          <h1
            id="hero-title"
            className="max-w-3xl text-[2.75rem] leading-[0.95] font-extrabold tracking-[-0.04em] text-atlantico-900 sm:text-7xl"
          >
            Viaje sabendo onde ir.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-tinta">
            Experiências reais de pessoas que já estiveram lá.
          </p>
        </div>
      </div>

      {/* Mar */}
      <div className="relative bg-atlantico">
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-16 w-full"
          aria-hidden="true"
        >
          <path
            d="M0 30 C 260 10, 520 50, 820 26 S 1260 12, 1440 32 L1440 80 L0 80 Z"
            fill="var(--color-atlantico-900)"
          />
        </svg>
        <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="-translate-y-1/2">
            <SearchBar size="lg" />
          </div>
          <p className="-mt-2 text-sm text-white/80">Para onde você quer viajar?</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/destinos/${item.slug}`}
                  className="inline-flex rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-atlantico"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
