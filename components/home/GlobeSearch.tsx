"use client";

import { Globe2, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { PlaceResult } from "@/lib/geo-search";

type GlobeSearchProps = { onPick: (place: PlaceResult) => void };

/**
 * Busca de países e cidades do mundo inteiro (padrão ARIA combobox + listbox).
 * Setas navegam, Enter escolhe, Esc fecha. Resultados vêm de /api/lugares.
 */
export function GlobeSearch({ onPick }: GlobeSearchProps) {
  const id = useId();
  const listId = `${id}-lista`;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  /** Ao escolher um lugar, o campo recebe o nome dele: essa mudança não deve buscar de novo. */
  const skipNextSearch = useRef(false);

  useEffect(() => {
    const term = query.trim();
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lugares?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data: { results?: PlaceResult[]; error?: string } = await res.json();
        const found = data.results ?? [];
        setResults(found);
        setActive(found.length ? 0 : -1);
        setOpen(true);
        setStatus(
          data.error ??
            (found.length
              ? `${found.length} ${found.length === 1 ? "lugar encontrado" : "lugares encontrados"}.`
              : "Nenhum lugar encontrado."),
        );
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("Não foi possível buscar agora.");
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function pick(place: PlaceResult) {
    onPick(place);
    skipNextSearch.current = true;
    setQuery(place.name);
    setOpen(false);
    setStatus(`${place.name} selecionado no globo.`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = results[active] ?? results[0];
      if (open && chosen) pick(chosen);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && query.trim().length >= 2;

  return (
    <div className="relative mx-auto w-full max-w-md text-left">
      <label htmlFor={`${id}-input`} className="sr-only">
        Buscar país ou cidade no mapa
      </label>
      <div className="flex items-center gap-2 rounded-full bg-white/95 py-1.5 pr-1.5 pl-4 shadow-[0_12px_40px_-12px_rgba(10,42,55,0.7)] ring-1 ring-white/60 focus-within:ring-2 focus-within:ring-agua">
        <Globe2 aria-hidden="true" className="h-5 w-5 shrink-0 text-petroleo" />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${id}-opcao-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          maxLength={60}
          value={query}
          placeholder="Buscar país ou cidade no mapa…"
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) {
              setResults([]);
              setOpen(false);
            }
          }}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-tinta placeholder:text-tinta-soft/80 focus:outline-none"
        />
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-agua text-tinta"
        >
          <Search className="h-5 w-5" />
        </span>
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Lugares encontrados"
        hidden={!showList || results.length === 0}
        className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(10,42,55,0.7)] ring-1 ring-linha"
      >
        {results.map((place, i) => (
          <li
            key={`${place.kind}-${place.name}-${place.detail}-${i}`}
            id={`${id}-opcao-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(place)}
            onMouseEnter={() => setActive(i)}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 aria-selected:bg-petroleo-100"
          >
            {place.kind === "country" ? (
              <Globe2 aria-hidden="true" className="h-4 w-4 shrink-0 text-agua-700" />
            ) : (
              <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-agua-700" />
            )}
            <span className="min-w-0">
              <span className="block truncate font-medium text-tinta">{place.name}</span>
              <span className="block truncate text-xs text-tinta-soft">{place.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <p role="status" className="sr-only">
        {status}
      </p>
    </div>
  );
}
