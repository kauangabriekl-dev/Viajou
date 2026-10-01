"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { PhotoCredit } from "@/components/ui/PhotoCredit";
import type { HeroPhoto } from "@/lib/photos";

const INTERVAL_MS = 7000;

/**
 * Fundo da home que alterna entre as fotos (mar, neve, pôr do sol) com fade.
 * Conteúdo que muda sozinho por mais de 5 s precisa de pausa (WCAG 2.2.2): botão no canto.
 * Com "reduzir movimento" ligado, começa pausado.
 */
export function HeroBackdrop({ photos }: { photos: HeroPhoto[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    const timer = setTimeout(update, 0);
    return () => {
      clearTimeout(timer);
      query.removeEventListener("change", update);
    };
  }, []);

  const playing = !paused && !reducedMotion && photos.length > 1;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, photos.length]);

  const current = photos[index];

  return (
    <>
      {photos.map((photo, i) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={`-z-20 object-cover transition-opacity duration-[1500ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute right-3 bottom-2 flex items-center gap-3 text-white/80 sm:right-6">
        <PhotoCredit credit={current} className="hidden text-right sm:block" />
        <div className="flex items-center gap-1 rounded-full bg-black/30 p-1 backdrop-blur">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Mostrar foto de ${photo.label.toLowerCase()} (${photo.place})`}
              aria-pressed={i === index}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white/80 hover:text-white aria-pressed:bg-white aria-pressed:text-petroleo"
            >
              {photo.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={playing ? "Pausar a troca de fotos" : "Retomar a troca de fotos"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white hover:bg-white/20"
          >
            {playing ? (
              <Pause aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Play aria-hidden="true" className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Foto de fundo: {current.label}, {current.place}.
      </p>
    </>
  );
}
