"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { createMap, pinIcon } from "@/components/achados/leaflet-setup";

export type MapPoint = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  href?: string;
};

/**
 * Mapa só de leitura com um ou vários achadinhos. Com vários, enquadra todos;
 * cada alfinete abre o nome com link. A lista em texto da página é a alternativa sem mapa.
 */
export function AchadosMap({
  points,
  zoom = 14,
  className = "h-80",
}: {
  points: MapPoint[];
  zoom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !points.length) return;
    let cancelled = false;
    let remove: (() => void) | null = null;
    createMap(el, [points[0].latitude, points[0].longitude], zoom).then(({ L, map }) => {
      if (cancelled) return map.remove();
      remove = () => map.remove();
      for (const p of points) {
        const marker = L.marker([p.latitude, p.longitude], { icon: pinIcon(L, p.title) }).addTo(
          map,
        );
        const safe = p.title.replace(
          /[<>&"]/g,
          (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!,
        );
        marker.bindPopup(p.href ? `<a href="${p.href}">${safe}</a>` : safe);
      }
      if (points.length > 1) {
        map.fitBounds(
          L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])),
          {
            padding: [32, 32],
            maxZoom: 13,
          },
        );
      }
    });
    return () => {
      cancelled = true;
      remove?.();
    };
  }, [points, zoom]);

  if (!points.length) return null;
  return (
    <div
      ref={ref}
      className={`relative z-0 w-full overflow-hidden rounded-2xl bg-petroleo-100 ring-1 ring-linha ${className}`}
      role="region"
      aria-label={points.length === 1 ? `Mapa: ${points[0].title}` : "Mapa dos achadinhos"}
    />
  );
}
