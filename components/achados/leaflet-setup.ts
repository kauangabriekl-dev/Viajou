import type * as Leaflet from "leaflet";

/**
 * Carrega o Leaflet só no navegador (ele usa window) e cria um mapa com o OpenStreetMap.
 * Os azulejos (tiles) do OSM precisam de internet; sem ela, o mapa fica cinza e os campos
 * de latitude/longitude continuam funcionando.
 */
export async function createMap(
  container: HTMLElement,
  center: [number, number],
  zoom: number,
): Promise<{ L: typeof Leaflet; map: Leaflet.Map }> {
  const L = await import("leaflet");
  const map = L.map(container, { center, zoom, scrollWheelZoom: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return { L, map };
}

/** Marcador verde-água desenhado em HTML (evita as imagens padrão do Leaflet, que quebram no bundler). */
export function pinIcon(L: typeof Leaflet, label?: string) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:block;width:28px;height:28px;border-radius:9999px;background:#5ed3c4;border:3px solid #fff;box-shadow:0 0 0 2px #1e5b74,0 6px 14px rgba(10,42,55,.45)"${
      label ? ` title="${label.replace(/"/g, "&quot;")}"` : ""
    }></span>`,
  });
}
