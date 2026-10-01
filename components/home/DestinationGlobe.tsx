"use client";

import createGlobe, { type Marker } from "cobe";
import { ArrowRight, MapPin, PenLine, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlobeSearch } from "@/components/home/GlobeSearch";
import type { PlaceResult } from "@/lib/geo-search";
import { normalizePlace } from "@/lib/geo-search";
import {
  clampTheta,
  type GlobeView,
  project,
  shortestDelta,
  viewFacing,
  wrapAngle,
} from "@/lib/globe";
import type { WorldHighlight } from "@/lib/world-highlights";
import { pluralize } from "@/utils/format";

export type GlobeDestination = {
  slug: string;
  name: string;
  state: string;
  country: string;
  description: string | null;
  latitude: number;
  longitude: number;
  reviewsCount: number;
  ratingAvg: number;
};

type DestinationGlobeProps = {
  destinations: GlobeDestination[];
  /** Destinos famosos no mundo, marcados com o mesmo ponto verde-água. */
  highlights?: WorldHighlight[];
  /** Ponto que o globo mostra ao abrir (lat, lng). */
  initialFocus: [number, number];
};

/** Um ponto clicável no globo: destino do VIAJOU ou destino famoso. */
type Pin = {
  key: string;
  name: string;
  detail: string;
  latitude: number;
  longitude: number;
  destination?: GlobeDestination;
  highlight?: WorldHighlight;
};

/** O que está selecionado: um destino do VIAJOU ou um lugar achado na busca. */
type Selection =
  | { kind: "destination"; destination: GlobeDestination }
  | {
      kind: "place";
      place: PlaceResult;
      destination: GlobeDestination | null;
      note?: string;
      pinKey?: string;
    };

const DRAG_SPEED = 0.006;
const KEY_STEP = 0.18;
const AUTO_SPEED = 0.0018;
const FRICTION = 0.92;
const MARKER_ELEVATION = 0.02;
const ZOOM = { world: 1, country: 1.5, city: 2.4 };

/** Cores em RGB 0–1, derivadas dos tokens de app/globals.css. */
type Rgb = [number, number, number];
const COLORS = {
  base: [0.14, 0.4, 0.5] as Rgb,
  marker: [0.369, 0.827, 0.769] as Rgb,
  glow: [0.37, 0.83, 0.77] as Rgb,
  searched: [1, 1, 1] as Rgb,
};

function webglAvailable() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Destino do VIAJOU com o mesmo nome e país do lugar encontrado. */
function matchDestination(place: PlaceResult, destinations: GlobeDestination[]) {
  if (place.kind !== "city") return null;
  const name = normalizePlace(place.name);
  return (
    destinations.find(
      (d) =>
        normalizePlace(d.name) === name &&
        normalizePlace(d.country) === normalizePlace(place.country),
    ) ?? null
  );
}

/**
 * Planeta 3D girável (cobe/WebGL) com busca de países e cidades do mundo inteiro.
 * Os destinos são botões HTML reais posicionados sobre o globo a cada quadro:
 * clicáveis, focáveis pelo teclado e lidos por leitores de tela.
 * A lista de destinos logo abaixo (no Hero) é a alternativa sem JavaScript/WebGL.
 */
export function DestinationGlobe({
  destinations,
  highlights = [],
  initialFocus,
}: DestinationGlobeProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const searchedPinRef = useRef<HTMLSpanElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const view = useRef<GlobeView>(viewFacing(...initialFocus));
  const target = useRef<GlobeView | null>(null);
  const zoom = useRef(ZOOM.world);
  const targetZoom = useRef(ZOOM.world);
  const searched = useRef<PlaceResult | null>(null);
  const velocity = useRef(0);
  const drag = useRef<{ x: number; y: number; phi: number; theta: number } | null>(null);
  const interacted = useRef(false);

  const [selection, setSelection] = useState<Selection | null>(null);

  const pins = useMemo<Pin[]>(
    () => [
      ...destinations.map((d) => ({
        key: `d-${d.slug}`,
        name: d.name,
        detail: d.state,
        latitude: d.latitude,
        longitude: d.longitude,
        destination: d,
      })),
      ...highlights.map((h) => ({
        key: `h-${h.id}`,
        name: h.name,
        detail: h.country,
        latitude: h.latitude,
        longitude: h.longitude,
        highlight: h,
      })),
    ],
    [destinations, highlights],
  );

  useEffect(() => {
    const stage = stageRef.current;
    const host = canvasHostRef.current;
    if (!stage || !host) return;
    if (!webglAvailable()) {
      // Sem WebGL o globo some; a busca e a lista de destinos do Hero continuam disponíveis.
      stage.dataset.state = "unsupported";
      return;
    }

    // O canvas é criado aqui, fora do JSX: a cobe o envolve numa div própria,
    // e o React não deve disputar esse pedaço do DOM.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    host.append(canvas);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = Math.max(stage.clientWidth, 1);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size,
      height: size,
      phi: view.current.phi,
      theta: view.current.theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 5,
      mapBaseBrightness: 0.05,
      baseColor: COLORS.base,
      markerColor: COLORS.marker,
      glowColor: COLORS.glow,
      markerElevation: MARKER_ELEVATION,
      markers: pins.map((p) => ({ location: [p.latitude, p.longitude], size: 0.045 })),
    });
    globeRef.current = globe;

    const resize = new ResizeObserver(() => {
      size = Math.max(stage.clientWidth, 1);
      globe.update({ width: size, height: size });
    });
    resize.observe(stage);

    let frame = 0;
    let visibleOnScreen = true;
    const onScreen = new IntersectionObserver(([entry]) => {
      visibleOnScreen = entry.isIntersecting;
      if (visibleOnScreen && !frame) frame = requestAnimationFrame(tick);
    });
    onScreen.observe(stage);

    /** Posiciona um elemento HTML sobre a coordenada; esconde se estiver atrás ou fora da lente. */
    function place(el: HTMLElement, latitude: number, longitude: number) {
      const p = project(latitude, longitude, view.current, MARKER_ELEVATION, zoom.current);
      const inside = Math.hypot(p.x - 0.5, p.y - 0.5) < 0.49;
      const visible = p.visible && inside;
      el.style.transform = `translate(${p.x * size}px, ${p.y * size}px)`;
      if (el.dataset.visible !== String(visible)) el.dataset.visible = String(visible);
      return visible;
    }

    function tick() {
      frame = 0;
      if (!visibleOnScreen) return;
      const v = view.current;

      if (target.current) {
        // Viagem suave até o lugar escolhido.
        const dPhi = shortestDelta(v.phi, target.current.phi);
        const dTheta = target.current.theta - v.theta;
        v.phi += dPhi * 0.09;
        v.theta += dTheta * 0.09;
        if (Math.abs(dPhi) < 0.001 && Math.abs(dTheta) < 0.001) target.current = null;
      } else if (!drag.current) {
        v.phi += velocity.current;
        velocity.current *= FRICTION;
        if (Math.abs(velocity.current) < 0.0001) velocity.current = 0;
        if (!interacted.current && !reducedMotion) v.phi += AUTO_SPEED;
      }
      v.phi = wrapAngle(v.phi);
      v.theta = clampTheta(v.theta);
      zoom.current += (targetZoom.current - zoom.current) * 0.08;

      globe.update({ phi: v.phi, theta: v.theta, scale: zoom.current });

      pins.forEach((p, i) => {
        const pin = pinRefs.current[i];
        if (!pin) return;
        const visible = place(pin, p.latitude, p.longitude);
        if (pin.tabIndex !== (visible ? 0 : -1)) {
          pin.tabIndex = visible ? 0 : -1;
          pin.setAttribute("aria-hidden", String(!visible));
        }
      });

      const searchedPin = searchedPinRef.current;
      if (searchedPin && searched.current) {
        place(searchedPin, searched.current.latitude, searched.current.longitude);
      }

      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    stage.dataset.state = "ready";

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      onScreen.disconnect();
      globe.destroy();
      globeRef.current = null;
      host.replaceChildren();
    };
  }, [pins]);

  /** Marcador do lugar buscado: branco, maior que os destinos. */
  function showSearchedMarker(found: PlaceResult | null) {
    searched.current = found;
    const markers: Marker[] = pins.map((p) => ({
      location: [p.latitude, p.longitude],
      size: 0.045,
    }));
    if (found) {
      markers.push({
        location: [found.latitude, found.longitude],
        size: 0.07,
        color: COLORS.searched,
      });
    }
    globeRef.current?.update({ markers });
  }

  function stopAuto() {
    interacted.current = true;
    target.current = null;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a")) return;
    stopAuto();
    velocity.current = 0;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      phi: view.current.phi,
      theta: view.current.theta,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    // Aproximado, o mesmo arrasto gira menos: o movimento acompanha o dedo.
    const speed = DRAG_SPEED / zoom.current;
    const previousPhi = view.current.phi;
    view.current.phi = start.phi + (event.clientX - start.x) * speed;
    view.current.theta = clampTheta(start.theta + (event.clientY - start.y) * speed);
    velocity.current = shortestDelta(previousPhi, view.current.phi);
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const move = moves[event.key];
    if (!move || event.target !== event.currentTarget) return;
    event.preventDefault();
    stopAuto();
    const base = target.current ?? view.current;
    const step = 1 / zoom.current;
    target.current = {
      phi: base.phi + move[0] * step,
      theta: clampTheta(base.theta + move[1] * step),
    };
  }

  function flyTo(latitude: number, longitude: number, level: number) {
    interacted.current = true;
    velocity.current = 0;
    target.current = viewFacing(latitude, longitude);
    targetZoom.current = level;
  }

  function chooseDestination(destination: GlobeDestination) {
    showSearchedMarker(null);
    flyTo(destination.latitude, destination.longitude, ZOOM.world);
    setSelection({ kind: "destination", destination });
  }

  function chooseHighlight(h: WorldHighlight, pinKey: string) {
    showSearchedMarker(null);
    flyTo(h.latitude, h.longitude, ZOOM.world);
    setSelection({
      kind: "place",
      place: {
        kind: "city",
        name: h.name,
        detail: h.country,
        country: h.country,
        latitude: h.latitude,
        longitude: h.longitude,
      },
      destination: null,
      note: h.note,
      pinKey,
    });
  }

  function choosePin(p: Pin) {
    if (p.destination) chooseDestination(p.destination);
    else if (p.highlight) chooseHighlight(p.highlight, p.key);
  }

  function choosePlace(found: PlaceResult) {
    showSearchedMarker(found);
    flyTo(found.latitude, found.longitude, found.kind === "city" ? ZOOM.city : ZOOM.country);
    setSelection({
      kind: "place",
      place: found,
      destination: matchDestination(found, destinations),
    });
  }

  function clearSelection() {
    showSearchedMarker(null);
    targetZoom.current = ZOOM.world;
    setSelection(null);
  }

  const selectedSlug =
    selection?.kind === "destination" ? selection.destination.slug : selection?.destination?.slug;
  const searchedName =
    selection?.kind === "place" && !selection.pinKey ? selection.place.name : null;
  const selectedPinKey =
    selection?.kind === "place" && selection.pinKey
      ? selection.pinKey
      : selectedSlug
        ? `d-${selectedSlug}`
        : null;
  const cardDestination =
    selection?.kind === "destination" ? selection.destination : (selection?.destination ?? null);

  return (
    <div className="relative mx-auto w-full max-w-[min(34rem,88vw)]">
      <GlobeSearch onPick={choosePlace} />

      <div
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-roledescription="globo interativo"
        aria-label="Planeta com os destinos. Arraste ou use as setas do teclado para girar. Use Tab para passar pelos destinos visíveis."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative mt-5 aspect-square w-full cursor-grab touch-pan-y rounded-full opacity-0 transition-opacity duration-700 select-none active:cursor-grabbing data-[state=ready]:opacity-100 data-[state=unsupported]:hidden"
      >
        <div ref={canvasHostRef} className="absolute inset-0 overflow-hidden rounded-full" />

        <ul className="absolute inset-0" aria-label="Destinos no globo">
          {pins.map((p, i) => (
            <li key={p.key}>
              <button
                ref={(el) => {
                  pinRefs.current[i] = el;
                }}
                type="button"
                data-visible="false"
                tabIndex={-1}
                aria-hidden="true"
                aria-pressed={selectedPinKey === p.key}
                onClick={() => choosePin(p)}
                className="group absolute top-0 left-0 flex -translate-x-[1.375rem] -translate-y-1/2 items-center gap-1.5 transition-opacity duration-300 will-change-transform data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0"
                style={{ transform: "translate(-9999px, -9999px)" }}
              >
                <span className="relative flex h-11 w-11 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute h-4 w-4 animate-ping rounded-full bg-agua/60 motion-reduce:animate-none"
                  />
                  <span
                    aria-hidden="true"
                    className="relative h-3.5 w-3.5 rounded-full bg-agua ring-2 ring-white group-aria-pressed:scale-125"
                  />
                </span>
                <span className="-ml-2 scale-90 rounded-full bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap text-tinta opacity-0 shadow-md transition group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-aria-pressed:scale-100 group-aria-pressed:bg-agua group-aria-pressed:opacity-100">
                  {p.name}
                  <span className="sr-only">, {p.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <span
          ref={searchedPinRef}
          aria-hidden="true"
          data-visible="false"
          hidden={!searchedName}
          className="pointer-events-none absolute top-0 left-0 flex -translate-x-2 -translate-y-1/2 items-center gap-1.5 transition-opacity duration-300 data-[visible=false]:opacity-0"
          style={{ transform: "translate(-9999px, -9999px)" }}
        >
          <span className="h-4 w-4 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.3)]" />
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap text-petroleo shadow-md">
            {searchedName}
          </span>
        </span>
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 -bottom-4 flex justify-center px-2"
      >
        {selection && (
          <div className="pointer-events-auto relative w-full max-w-sm rounded-[var(--radius-card)] bg-white p-4 pr-11 text-left text-tinta shadow-[0_18px_50px_-18px_rgba(7,52,71,0.6)] ring-1 ring-linha">
            {cardDestination ? (
              <DestinationCardBody destination={cardDestination} />
            ) : (
              selection.kind === "place" && (
                <PlaceCardBody place={selection.place} note={selection.note} />
              )
            )}
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Fechar"
              className="absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-tinta-soft hover:bg-espuma"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DestinationCardBody({ destination }: { destination: GlobeDestination }) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-agua-700 uppercase">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        {destination.state} · {destination.country}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight">{destination.name}</p>
      {destination.description && (
        <p className="mt-1 line-clamp-2 text-sm font-light text-tinta-soft">
          {destination.description}
        </p>
      )}
      {destination.reviewsCount > 0 && (
        <p className="mt-1 text-sm">
          <span className="font-bold">
            {destination.ratingAvg.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>{" "}
          · {pluralize(destination.reviewsCount, "avaliação", "avaliações")}
        </p>
      )}
      <Link
        href={`/destinos/${destination.slug}`}
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-petroleo px-4 text-sm font-semibold text-white hover:bg-petroleo-900"
      >
        Explorar {destination.name}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </>
  );
}

/** Lugar ainda sem página no VIAJOU: estado vazio honesto, sem nota nem números. */
function PlaceCardBody({ place, note }: { place: PlaceResult; note?: string }) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-agua-700 uppercase">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        {place.detail}
      </p>
      <p className="mt-1 text-xl font-bold tracking-tight">{place.name}</p>
      {note && <p className="mt-1 text-sm text-tinta">{note}</p>}
      <p className="mt-1 text-sm font-light text-tinta-soft">
        Ainda não há avaliações de {place.name} no VIAJOU. Já esteve lá? Seu relato pode ser o
        primeiro.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/explorar?q=${encodeURIComponent(place.name)}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-petroleo px-4 text-sm font-semibold text-white hover:bg-petroleo-900"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          Buscar relatos
        </Link>
        <Link
          href="/criar"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-agua px-4 text-sm font-semibold text-tinta hover:bg-agua-600"
        >
          <PenLine aria-hidden="true" className="h-4 w-4" />
          Contar minha viagem
        </Link>
      </div>
    </>
  );
}
