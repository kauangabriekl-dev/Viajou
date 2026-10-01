import { MapPin } from "lucide-react";
import { formatCoordinates } from "@/utils/format";

export type MapMarker = { id: string; latitude: number; longitude: number; label: string };

export type MapViewProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  label: string;
};

/**
 * Interface estável para mapas. Sem provedor configurado, mostra um placeholder
 * com as coordenadas e link para abrir em um app de mapas. Para ativar:
 * implemente um renderer (Mapbox GL ou Google Maps) usando as mesmas props,
 * lido de NEXT_PUBLIC_MAPBOX_TOKEN / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export function MapView({ latitude, longitude, zoom = 13, markers = [], label }: MapViewProps) {
  const external = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;
  return (
    <figure className="overflow-hidden rounded-[var(--radius-card)] ring-1 ring-linha">
      <div className="relative flex aspect-[16/9] items-center justify-center bg-[#dcecf2]">
        <svg
          viewBox="0 0 400 225"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M0 150 C 80 120, 160 170, 240 140 S 360 110, 400 130 V225 H0Z"
            fill="var(--color-petroleo)"
            opacity="0.18"
          />
          {Array.from({ length: 9 }, (_, i) => (
            <path
              key={`v${i}`}
              d={`M${i * 50} 0V225`}
              stroke="var(--color-petroleo)"
              strokeOpacity="0.08"
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={`h${i}`}
              d={`M0 ${i * 56}H400`}
              stroke="var(--color-petroleo)"
              strokeOpacity="0.08"
            />
          ))}
        </svg>
        <MapPin aria-hidden="true" className="relative h-10 w-10 fill-agua text-petroleo-900" />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 text-sm">
        <span>
          <span className="font-semibold">{label}</span>{" "}
          <span className="text-tinta-soft tabular-nums">
            {formatCoordinates(latitude, longitude)}
          </span>
          {markers.length > 0 && (
            <span className="text-tinta-soft"> · {markers.length} pontos</span>
          )}
        </span>
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-petroleo underline"
        >
          Abrir no mapa
        </a>
      </figcaption>
    </figure>
  );
}
