"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BedDouble, ExternalLink, LocateFixed, Star } from "lucide-react";
import { createMap, pinIcon } from "@/components/achados/leaflet-setup";
import type { StayLink } from "@/lib/stays";

export type StayItem = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  ratingAvg: number;
  reviewsCount: number;
  isDemo: boolean;
  links: StayLink[];
};

type Bounds = { south: number; west: number; north: number; east: number };

const inside = (b: Bounds, s: StayItem) =>
  s.latitude >= b.south && s.latitude <= b.north && s.longitude >= b.west && s.longitude <= b.east;

/**
 * Mapa + lista de hospedagens. Mover o mapa mostra "Buscar nesta área", que filtra a lista
 * pelo que está visível (como nos buscadores de hotel). A lista funciona sem o mapa.
 */
export function StayResults({
  center,
  label,
  stays,
}: {
  center: [number, number];
  label: string;
  stays: StayItem[];
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const [area, setArea] = useState<Bounds | null>(null);
  const [moved, setMoved] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    const el = mapEl.current;
    if (!el) return;
    createMap(el, center, 13).then(({ L, map: m }) => {
      if (cancelled) {
        m.remove();
        return;
      }
      map = m;
      mapRef.current = m;
      for (const s of stays) {
        const marker = L.marker([s.latitude, s.longitude], {
          icon: pinIcon(L, s.name),
          title: s.name,
          keyboard: false,
        })
          .addTo(m)
          .on("click", () => {
            setActive(s.id);
            document
              .getElementById(`stay-${s.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          });
        markers.current.set(s.id, marker);
      }
      if (stays.length > 1) {
        m.fitBounds(L.latLngBounds(stays.map((s) => [s.latitude, s.longitude])), {
          padding: [40, 40],
          maxZoom: 14,
        });
      }
      // Só depois do enquadramento inicial: movimentos da pessoa mostram o botão.
      setTimeout(() => m.on("moveend", () => setMoved(true)), 0);
    });
    const registry = markers.current;
    return () => {
      cancelled = true;
      registry.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, [center, stays]);

  const visible = useMemo(
    () => (area ? stays.filter((s) => inside(area, s)) : stays),
    [area, stays],
  );

  function searchHere() {
    const b = mapRef.current?.getBounds();
    if (!b) return;
    setArea({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
    setMoved(false);
  }

  function focus(s: StayItem) {
    setActive(s.id);
    mapRef.current?.setView([s.latitude, s.longitude], Math.max(15, mapRef.current.getZoom()));
    markers.current.get(s.id)?.openPopup();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="order-2 space-y-3 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-tinta-soft" aria-live="polite">
            {visible.length} {visible.length === 1 ? "hospedagem" : "hospedagens"}{" "}
            {area ? "nesta área do mapa" : `perto de ${label}`}
          </p>
          {area && (
            <button
              type="button"
              onClick={() => setArea(null)}
              className="min-h-11 rounded-full px-3 text-sm font-semibold text-petroleo hover:underline"
            >
              Ver todas
            </button>
          )}
        </div>
        {visible.length ? (
          <ul className="space-y-3">
            {visible.map((s) => (
              <li
                key={s.id}
                id={`stay-${s.id}`}
                className={`rounded-2xl border bg-white p-4 transition-colors ${
                  active === s.id ? "border-petroleo ring-2 ring-agua" : "border-linha"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-tinta">
                      <Link
                        href={`/lugares/${s.slug}`}
                        className="hover:text-petroleo hover:underline"
                      >
                        {s.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-tinta-soft">
                      {s.city ? `${s.city} · ` : ""}
                      {s.distanceKm < 1
                        ? `${Math.round(s.distanceKm * 1000)} m do centro`
                        : `${s.distanceKm.toFixed(1).replace(".", ",")} km do centro`}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm">
                      {s.reviewsCount > 0 ? (
                        <>
                          <Star aria-hidden="true" className="h-4 w-4 fill-sol text-sol" />
                          <span className="font-semibold">
                            {s.ratingAvg.toFixed(1).replace(".", ",")}
                          </span>
                          <span className="text-tinta-soft">
                            ({s.reviewsCount} {s.reviewsCount === 1 ? "avaliação" : "avaliações"} no
                            Viajou)
                          </span>
                        </>
                      ) : (
                        <span className="text-tinta-soft">Ainda sem avaliações no Viajou</span>
                      )}
                    </p>
                    {s.isDemo && (
                      <p className="mt-1 text-xs font-semibold text-tinta-soft">
                        Exemplo de demonstração
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => focus(s)}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-petroleo hover:bg-petroleo-100"
                    aria-label={`Mostrar ${s.name} no mapa`}
                  >
                    <LocateFixed aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.links.map((l) => (
                    <a
                      key={l.provider}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-linha px-3 text-xs font-semibold text-petroleo hover:border-petroleo"
                    >
                      Preço no {l.label}
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-linha bg-white p-6 text-center">
            <BedDouble aria-hidden="true" className="mx-auto h-8 w-8 text-agua-700" />
            <p className="mt-2 font-semibold">
              {area
                ? "Nenhuma hospedagem do Viajou nesta área do mapa."
                : `Ainda não há hospedagens recomendadas pela comunidade perto de ${label}.`}
            </p>
            <p className="mt-1 text-sm text-tinta-soft">
              Compare os preços nos sites acima. Ficou em algum lugar por lá? Conte como foi num
              relato.
            </p>
          </div>
        )}
      </div>

      <div className="relative order-1 lg:order-2">
        <div className="lg:sticky lg:top-24">
          <div
            ref={mapEl}
            className="h-80 overflow-hidden rounded-[var(--radius-card)] border border-linha lg:h-[70vh]"
            role="region"
            aria-label={`Mapa das hospedagens perto de ${label}`}
          />
          {moved && (
            <button
              type="button"
              onClick={searchHere}
              className="absolute top-3 left-1/2 z-[500] min-h-11 -translate-x-1/2 rounded-full bg-petroleo px-5 text-sm font-bold text-white shadow-lg hover:bg-petroleo-900"
            >
              Buscar nesta área
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
