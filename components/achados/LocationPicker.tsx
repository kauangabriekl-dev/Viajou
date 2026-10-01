"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { Crosshair, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createMap, pinIcon } from "@/components/achados/leaflet-setup";
import type { PlaceResult } from "@/lib/geo-search";

type Point = { lat: number; lng: number };
const BRAZIL: [number, number] = [-14.5, -48];
const fix = (n: number) => Number(n.toFixed(6));

/**
 * Marca a localização do achadinho: clique ou arraste o alfinete no mapa, use o GPS do
 * celular, busque uma cidade para centralizar, ou digite latitude e longitude.
 * Os campos `latitude` e `longitude` vão no formulário (o servidor valida de novo).
 */
export function LocationPicker({ errors }: { errors?: string[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leaflet = useRef<{
    L: typeof Leaflet;
    map: Leaflet.Map;
    marker: Leaflet.Marker | null;
  } | null>(null);
  const [point, setPoint] = useState<Point | null>(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  function place(next: Point, zoom?: number) {
    const p = { lat: fix(next.lat), lng: fix(next.lng) };
    setPoint(p);
    const l = leaflet.current;
    if (!l) return;
    if (l.marker) l.marker.setLatLng([p.lat, p.lng]);
    else {
      l.marker = l.L.marker([p.lat, p.lng], {
        draggable: true,
        icon: pinIcon(l.L),
        keyboard: false,
      }).addTo(l.map);
      l.marker.on("dragend", () => {
        const ll = l.marker!.getLatLng();
        setPoint({ lat: fix(ll.lat), lng: fix(ll.lng) });
      });
    }
    if (zoom) l.map.setView([p.lat, p.lng], zoom);
  }

  useEffect(() => {
    let cancelled = false;
    const el = mapRef.current;
    if (!el) return;
    createMap(el, BRAZIL, 4)
      .then(({ L, map }) => {
        if (cancelled) return map.remove();
        leaflet.current = { L, map, marker: null };
        map.on("click", (e: Leaflet.LeafletMouseEvent) =>
          place({ lat: e.latlng.lat, lng: e.latlng.lng }),
        );
      })
      .catch(() => setStatus("Não foi possível carregar o mapa. Digite as coordenadas abaixo."));
    return () => {
      cancelled = true;
      leaflet.current?.map.remove();
      leaflet.current = null;
    };
  }, []);

  function useGps() {
    if (!navigator.geolocation) return setStatus("Seu navegador não informa a localização.");
    setStatus("Procurando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        place({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 16);
        setStatus("Localização marcada. Ajuste o alfinete se precisar.");
      },
      () => setStatus("Não deu para pegar sua localização. Marque no mapa."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function centerOn() {
    const term = query.trim();
    if (term.length < 2) return;
    try {
      const res = await fetch(`/api/lugares?q=${encodeURIComponent(term)}`);
      const { results = [] }: { results?: PlaceResult[] } = await res.json();
      const first = results[0];
      if (!first) return setStatus("Não encontramos esse lugar.");
      leaflet.current?.map.setView(
        [first.latitude, first.longitude],
        first.kind === "city" ? 13 : 6,
      );
      setStatus(`Mapa em ${first.name}. Agora toque no ponto exato.`);
    } catch {
      setStatus("Não foi possível buscar agora.");
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold text-tinta">Onde fica?</legend>
      <p className="text-sm text-tinta-soft">
        Toque no mapa ou arraste o alfinete até o ponto exato. A localização será pública: não
        marque casas nem endereços residenciais.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useGps}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-agua px-4 text-sm font-semibold text-tinta hover:bg-agua-600"
        >
          <Crosshair aria-hidden="true" className="h-4 w-4" />
          Usar minha localização
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-linha bg-white pr-1 pl-4">
          <label htmlFor="mapa-busca" className="sr-only">
            Centralizar o mapa numa cidade
          </label>
          <input
            id="mapa-busca"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                centerOn();
              }
            }}
            placeholder="Ir para uma cidade…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={centerOn}
            aria-label="Centralizar o mapa"
            className="flex h-9 w-9 items-center justify-center rounded-full text-petroleo hover:bg-petroleo-100"
          >
            <Search aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={mapRef}
        className="relative z-0 h-80 w-full overflow-hidden rounded-2xl bg-petroleo-100 ring-1 ring-linha"
        role="application"
        aria-label="Mapa para marcar o local do achadinho"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="latitude" className="text-xs font-semibold text-tinta-soft">
            Latitude
          </label>
          <input
            id="latitude"
            name="latitude"
            inputMode="decimal"
            value={point?.lat ?? ""}
            onChange={(e) => {
              const lat = Number(e.target.value);
              if (Number.isFinite(lat)) place({ lat, lng: point?.lng ?? 0 }, 15);
            }}
            aria-invalid={errors ? true : undefined}
            aria-describedby={errors ? "local-erro" : undefined}
            className="w-full rounded-xl border border-linha bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="longitude" className="text-xs font-semibold text-tinta-soft">
            Longitude
          </label>
          <input
            id="longitude"
            name="longitude"
            inputMode="decimal"
            value={point?.lng ?? ""}
            onChange={(e) => {
              const lng = Number(e.target.value);
              if (Number.isFinite(lng)) place({ lat: point?.lat ?? 0, lng }, 15);
            }}
            className="w-full rounded-xl border border-linha bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
      {errors?.length ? (
        <p id="local-erro" className="text-sm font-medium text-red-700" role="alert">
          {errors[0]}
        </p>
      ) : null}
      <p role="status" className="text-sm text-tinta-soft">
        {status}
      </p>
    </fieldset>
  );
}
