import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarDays, Lightbulb, MapPin, Wallet } from "lucide-react";
import { StyleIcon } from "@/components/destinations/StyleIcon";
import { Container } from "@/components/ui/Container";
import { PhotoCredit } from "@/components/ui/PhotoCredit";
import { destinationStyleLabel, monthLong } from "@/lib/labels";
import { destinationCover } from "@/lib/photos";
import {
  READY_ITINERARIES,
  budgetLabel,
  getReadyItinerary,
  readyPeriodLabel,
} from "@/lib/ready-itineraries";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return READY_ITINERARIES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/roteiros/prontos/[slug]">) {
  const r = getReadyItinerary((await params).slug);
  if (!r) return {};
  return buildMetadata({
    title: r.title,
    description: r.summary,
    path: `/roteiros/prontos/${r.slug}`,
  });
}

export default async function ReadyItineraryPage({
  params,
}: PageProps<"/roteiros/prontos/[slug]">) {
  const r = getReadyItinerary((await params).slug);
  if (!r) notFound();
  const cover = r.destinationSlug ? destinationCover(r.destinationSlug) : null;
  const months = [...r.bestMonths].sort((a, b) => a - b);

  return (
    <Container>
      <div className="pt-8">
        <Link
          href="/roteiros/prontos"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-petroleo hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Roteiros prontos
        </Link>
      </div>

      <header className="grid gap-8 pt-4 pb-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-4">
          <p className="flex items-center gap-1 text-sm font-semibold tracking-wide text-agua-700 uppercase">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            {r.place}, {r.country}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-petroleo sm:text-4xl">
            {r.title}
          </h1>
          <p className="max-w-prose text-lg font-light text-tinta-soft">{r.summary}</p>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-tinta-soft">Duração</dt>
              <dd className="font-semibold">{r.days.length} dias</dd>
            </div>
            <div>
              <dt className="text-tinta-soft">Orçamento</dt>
              <dd className="font-semibold">{budgetLabel[r.budget]}</dd>
            </div>
            <div>
              <dt className="text-tinta-soft">Melhor época</dt>
              <dd className="font-semibold">{months.map((m) => monthLong[m - 1]).join(", ")}</dd>
            </div>
          </dl>
          <ul className="flex flex-wrap gap-2" aria-label="Estilos">
            {r.styles.map((s) => (
              <li key={s}>
                <Link
                  href={`/roteiros/prontos?estilo=${s}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-petroleo-100 px-3 text-sm font-medium text-petroleo hover:bg-petroleo hover:text-white"
                >
                  <StyleIcon style={s} />
                  {destinationStyleLabel(s)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {cover && (
          <figure className="space-y-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
              <Image
                src={cover.src}
                alt={`Paisagem de ${r.place}`}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            {cover.credit && (
              <figcaption>
                <PhotoCredit credit={cover.credit} className="text-tinta-soft" />
              </figcaption>
            )}
          </figure>
        )}
      </header>

      <div className="grid gap-10 pb-16 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="dia-a-dia">
          <h2
            id="dia-a-dia"
            className="mb-6 flex items-center gap-2 text-2xl font-bold text-petroleo"
          >
            <CalendarDays aria-hidden="true" className="h-6 w-6" />
            Dia a dia
          </h2>
          <ol className="space-y-8">
            {r.days.map((day, i) => (
              <li key={day.title} className="relative border-l-2 border-agua pl-6">
                <span
                  aria-hidden="true"
                  className="absolute top-0 -left-[13px] grid h-6 w-6 place-items-center rounded-full bg-petroleo text-xs font-bold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">
                  <span className="sr-only">Dia {i + 1}: </span>
                  {day.title}
                </h3>
                <ul className="mt-3 space-y-3">
                  {day.stops.map((stop) => (
                    <li key={stop.title} className="rounded-xl bg-espuma p-4">
                      <p className="text-xs font-semibold tracking-wide text-agua-700 uppercase">
                        {readyPeriodLabel[stop.period]}
                      </p>
                      <p className="font-semibold text-tinta">{stop.title}</p>
                      <p className="text-sm text-tinta-soft">{stop.note}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="onde-ficar" className="rounded-2xl border border-linha p-5">
            <h2 id="onde-ficar" className="mb-3 flex items-center gap-2 font-bold text-petroleo">
              <BedDouble aria-hidden="true" className="h-5 w-5" />
              Onde ficar
            </h2>
            <ul className="space-y-3 text-sm">
              {r.base.map((b) => (
                <li key={b.area}>
                  <p className="font-semibold">{b.area}</p>
                  <p className="text-tinta-soft">{b.why}</p>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="custos" className="rounded-2xl border border-linha p-5">
            <h2 id="custos" className="mb-3 flex items-center gap-2 font-bold text-petroleo">
              <Wallet aria-hidden="true" className="h-5 w-5" />
              Custos à parte
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-soft">
              {r.extraCosts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-tinta-soft">
              Valores mudam com frequência; confira nos sites oficiais antes de ir.
            </p>
          </section>
          <section aria-labelledby="dicas" className="rounded-2xl bg-petroleo p-5 text-white">
            <h2 id="dicas" className="mb-3 flex items-center gap-2 font-bold">
              <Lightbulb aria-hidden="true" className="h-5 w-5 text-sol" />
              Dicas
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-white/85">
              {r.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          {r.destinationSlug && (
            <Link
              href={`/destinos/${r.destinationSlug}`}
              className="flex min-h-11 items-center justify-center rounded-full bg-agua px-5 text-sm font-bold text-tinta hover:bg-agua-600"
            >
              Ver avaliações e dicas de {r.place}
            </Link>
          )}
          <Link
            href="/criar/roteiro"
            className="flex min-h-11 items-center justify-center rounded-full border border-petroleo px-5 text-sm font-bold text-petroleo hover:bg-petroleo hover:text-white"
          >
            Montar meu roteiro a partir deste
          </Link>
        </aside>
      </div>
    </Container>
  );
}
