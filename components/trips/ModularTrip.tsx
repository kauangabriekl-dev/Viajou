import { CalendarPlus, Compass, Coffee, Sparkles, Star } from "lucide-react";
import { readyPeriodLabel } from "@/lib/ready-itineraries";
import type { BuiltTrip } from "@/lib/trip-builder";

/**
 * Roteiro modular: os dias com experiências reais, depois "como aproveitar os dias
 * restantes" (bate-voltas curados e, no máximo, um dia livre) e o que ficou de fora,
 * separado entre o que combina com o perfil e outras experiências.
 */
export function ModularTrip({ trip, headingLevel = 3 }: { trip: BuiltTrip; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-agua/50 bg-white p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold text-petroleo">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-agua-700" />
          Por que montamos assim
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-tinta-soft">
          {trip.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {trip.days.length > 0 && (
        <ol className="space-y-6">
          {trip.days.map((day, i) => (
            <li key={`${i}-${day.title}`} className="relative border-l-2 border-agua pl-6">
              <span
                aria-hidden="true"
                className="absolute top-0 -left-[13px] grid h-6 w-6 place-items-center rounded-full bg-petroleo text-xs font-bold text-white"
              >
                {i + 1}
              </span>
              <H className="text-lg font-semibold">
                <span className="sr-only">Dia {i + 1}: </span>
                {day.title}
              </H>
              <ul className="mt-3 space-y-3">
                {day.stops.map((stop) => (
                  <li key={`${stop.period}-${stop.title}`} className="rounded-xl bg-espuma p-4">
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
      )}

      {trip.remaining.days > 0 && (
        <section className="rounded-2xl bg-espuma p-5">
          <H className="mb-1 flex items-center gap-2 text-lg font-bold text-petroleo">
            <CalendarPlus aria-hidden="true" className="h-5 w-5" />
            Como aproveitar{" "}
            {trip.remaining.days === 1
              ? "o dia restante"
              : `os ${trip.remaining.days} dias restantes`}
          </H>
          <p className="mb-4 text-sm text-tinta-soft">
            Preferimos não repetir programas nem inventar atividades. Escolha o que fizer mais
            sentido para você.
          </p>
          {trip.remaining.dayTrips.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Compass aria-hidden="true" className="h-4 w-4 text-agua-700" />
                Bate-voltas que valem a pena
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {trip.remaining.dayTrips.map((t) => (
                  <li key={t.name} className="rounded-xl bg-white p-3 text-sm">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-tinta-soft"> · {t.distance}</span>
                    <span className="block text-tinta-soft">{t.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {trip.remaining.freeDay && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Coffee aria-hidden="true" className="h-4 w-4 text-agua-700" />
                Um dia livre, de propósito
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-tinta">
                {trip.remaining.freeDay.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {trip.forYou.length > 0 && (
        <section className="rounded-2xl border border-sol/60 bg-white p-5">
          <H className="mb-3 flex items-center gap-2 text-lg font-bold text-petroleo">
            <Star aria-hidden="true" className="h-5 w-5 fill-sol text-sol" />
            Combina com você
          </H>
          <SuggestionList items={trip.forYou} />
        </section>
      )}

      {trip.extras.length > 0 && (
        <section className="rounded-2xl border border-linha bg-white p-5">
          <H className="mb-3 text-lg font-bold text-petroleo">
            Outras experiências que você pode adicionar
          </H>
          <SuggestionList items={trip.extras} />
        </section>
      )}
    </div>
  );
}

function SuggestionList({ items }: { items: { title: string; note: string }[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((m) => (
        <li key={m.title} className="rounded-xl bg-espuma px-3 py-2 text-sm">
          <span className="font-semibold">{m.title}</span>
          <span className="block text-xs text-tinta-soft">{m.note}</span>
        </li>
      ))}
    </ul>
  );
}
