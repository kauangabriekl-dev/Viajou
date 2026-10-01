import Link from "next/link";
import {
  BedDouble,
  CloudRain,
  CloudSun,
  Compass,
  ExternalLink,
  FileText,
  Snowflake,
  Sun,
  Ticket,
  Cloud,
  CloudFog,
  Smartphone,
  CloudLightning,
} from "lucide-react";
import { ClimateMonths } from "@/components/assistant/ClimateMonths";
import { bestMonths, scoreMonths, type MonthClimate } from "@/lib/climate";
import { getForecast } from "@/lib/forecast.server";
import { findAttractions, ticketSearchLinks } from "@/lib/tickets";
import { isBrazil as isBrazilCountry } from "@/lib/regions";
import { travelDocs } from "@/lib/travel-docs";
import { weatherKind, weatherLabel, type WeatherKind } from "@/lib/weather-codes";
import type { DestinationStyle } from "@/types/database";
import climateData from "@/data/climate.json";

const CLIMATE = climateData as Record<string, MonthClimate[]>;

const weatherIcon: Record<WeatherKind, typeof Sun> = {
  sol: Sun,
  nuvem: CloudSun,
  chuva: CloudRain,
  neve: Snowflake,
  tempestade: CloudLightning,
  neblina: CloudFog,
};

export type AssistantDestination = {
  slug: string;
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  styles: DestinationStyle[];
};

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sun;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-linha pt-4 first:border-0 first:pt-0 [.assistente-largo_&]:rounded-xl [.assistente-largo_&]:border [.assistente-largo_&]:p-4 [.assistente-largo_&]:first:border">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-petroleo">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Assistente de viagem (sem IA, gratuito): junta clima e melhor época, previsão,
 * ingressos das atrações citadas, documentos e hospedagem num painel ao lado do roteiro.
 * `mentions` são os nomes das paradas ou lugares do roteiro, usados para achar ingressos.
 */
export async function TripAssistant({
  destination: d,
  mentions = [],
  wide = false,
}: {
  destination: AssistantDestination;
  mentions?: string[];
  /** Versão larga (página do destino): seções lado a lado. */
  wide?: boolean;
}) {
  const months = CLIMATE[d.slug];
  const scores = months ? scoreMonths(months, d.styles) : null;
  const best = scores ? bestMonths(scores) : [];
  const currentMonth = Number(
    new Date().toLocaleDateString("en-US", { month: "numeric", timeZone: "America/Sao_Paulo" }),
  );
  const forecast =
    d.latitude !== null && d.longitude !== null
      ? await getForecast(d.latitude, d.longitude, 7)
      : null;
  const attractions = findAttractions(mentions, d.slug);
  const docs = travelDocs(d.country);

  return (
    <aside
      aria-labelledby="assistente-title"
      className="space-y-4 rounded-[var(--radius-card)] border border-linha bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,59,77,0.6)]"
    >
      <header>
        <h2
          id="assistente-title"
          className="flex items-center gap-2 text-lg font-bold text-petroleo"
        >
          <Compass aria-hidden="true" className="h-5 w-5 text-agua-700" />
          Assistente de viagem
        </h2>
        <p className="text-sm text-tinta-soft">
          O que ajuda a planejar {d.name}: época, tempo, ingressos e documentos.
        </p>
      </header>
      <div
        className={wide ? "assistente-largo grid items-start gap-4 lg:grid-cols-2" : "space-y-4"}
      >
        {scores && months && (
          <Section icon={Cloud} title="Quando ir">
            <ClimateMonths
              months={months}
              scores={scores}
              styles={d.styles}
              best={best}
              initialMonth={currentMonth}
            />
            <p className="mt-2 text-[11px] text-tinta-soft">
              Médias de 2016 a 2025. Dados:{" "}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Open-Meteo
              </a>{" "}
              (CC BY 4.0).
            </p>
          </Section>
        )}

        {forecast && (
          <Section icon={CloudSun} title="Previsão para os próximos dias">
            <ul className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {forecast.map((f) => {
                const Icon = weatherIcon[weatherKind(f.code)];
                return (
                  <li key={f.date} className="rounded-lg bg-espuma px-0.5 py-1.5">
                    <p className="font-semibold capitalize">
                      {weekday.format(new Date(`${f.date}T12:00:00Z`)).replace(".", "")}
                    </p>
                    <Icon aria-hidden="true" className="mx-auto my-1 h-4 w-4 text-petroleo" />
                    <p className="sr-only">{weatherLabel(f.code)}</p>
                    <p className="font-semibold tabular-nums">{f.tmax}°</p>
                    <p className="text-tinta-soft tabular-nums">{f.tmin}°</p>
                    {f.rainChance !== null && f.rainChance >= 30 && (
                      <p className="text-agua-700 tabular-nums">
                        <span className="sr-only">Chance de chuva </span>
                        {f.rainChance}%
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {forecast.some((f) => (f.rainChance ?? 0) >= 60) && (
              <p className="mt-2 text-xs text-tinta-soft">
                Dias com chuva provável: deixe para eles os museus e atrações cobertas.
              </p>
            )}
          </Section>
        )}

        <Section icon={Ticket} title="Ingressos">
          {attractions.length > 0 ? (
            <ul className="space-y-3">
              {attractions.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-semibold">{a.name}</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-tinta-soft">
                    {a.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <a
                    href={a.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full bg-petroleo px-4 text-xs font-bold text-white hover:bg-petroleo-900"
                  >
                    Comprar no site oficial
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only">: {a.officialLabel}, abre em nova aba</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tinta-soft">
              Nenhuma atração com venda antecipada conhecida neste roteiro.
            </p>
          )}
          <ul className="mt-3 flex flex-wrap gap-2">
            {ticketSearchLinks(`ingressos ${d.name}`).map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex min-h-10 items-center gap-1 rounded-full border border-linha px-3 text-xs font-semibold text-petroleo hover:border-petroleo"
                >
                  {l.label}
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-tinta-soft">
            O Viajou não vende ingressos: os links levam aos sites de venda.
          </p>
        </Section>

        {docs.length > 0 && (
          <Section icon={FileText} title="Documentos">
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-tinta-soft">
              {docs.map((doc) => (
                <li key={doc}>{doc}</li>
              ))}
            </ul>
          </Section>
        )}

        {!isBrazilCountry(d.country) && (
          <Section icon={Smartphone} title="Internet no celular">
            <p className="text-sm text-tinta-soft">
              Compre um chip virtual (eSIM) antes de embarcar: você chega com internet, sem depender
              de Wi-Fi nem pagar roaming. Confira se o seu celular aceita eSIM.
            </p>
            <a
              href="https://esim.holafly.com/pt/"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-full border border-linha px-3 text-xs font-semibold text-petroleo hover:border-petroleo"
            >
              Ver planos de eSIM (Holafly)
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </Section>
        )}

        <Section icon={BedDouble} title="Onde ficar">
          <Link
            href={`/hospedagem?onde=${encodeURIComponent(d.name)}`}
            className="inline-flex min-h-10 items-center rounded-full bg-agua px-4 text-xs font-bold text-tinta hover:bg-agua-600"
          >
            Ver hospedagens e comparar preços
          </Link>
        </Section>
      </div>
    </aside>
  );
}
