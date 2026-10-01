"use client";

import { MapPin, Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { placeTypeLabels } from "@/lib/labels";
import { encodeExisting, encodeNew } from "@/lib/place-ref";
import type { PlaceType } from "@/types/database";

export type PickedPlace = { value: string; name: string; type: PlaceType; detail?: string };
type Suggestion = {
  id: string;
  name: string;
  type: PlaceType;
  city: string | null;
  state: string | null;
  is_community: boolean;
};

type PlacePickerProps = {
  /** Nome do campo enviado no formulário (um input escondido por lugar escolhido). */
  name: string;
  label: string;
  hint?: string;
  destinationId?: string;
  /** Só um lugar (perguntas de praia) ou vários (lugares visitados). */
  single?: boolean;
  /** Restringe sugestões e lugares novos a um tipo (ex.: praia). */
  onlyType?: PlaceType;
  max?: number;
  onChange?: (picked: PickedPlace[]) => void;
};

const NEW_TYPES: PlaceType[] = ["beach", "restaurant", "attraction", "tour", "hotel", "other"];

/**
 * Escreva ou busque: sugere lugares já cadastrados (pela equipe ou por outros viajantes)
 * e, se não existir, oferece "Adicionar como novo lugar". O lugar novo é criado ao publicar
 * e passa a aparecer nas buscas das próximas pessoas.
 */
export function PlacePicker({
  name,
  label,
  hint,
  destinationId,
  single,
  onlyType,
  max = 20,
  onChange,
}: PlacePickerProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<PickedPlace[]>([]);
  const [newType, setNewType] = useState<PlaceType>(onlyType ?? "beach");

  /** Atualiza a lista e avisa o formulário (sem efeito: quem muda é sempre um evento). */
  function update(next: PickedPlace[]) {
    setPicked(next);
    onChange?.(next);
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ q: term });
      if (destinationId) params.set("destino", destinationId);
      if (onlyType) params.set("tipo", onlyType);
      try {
        const res = await fetch(`/api/lugares-visitados?${params}`, { signal: controller.signal });
        const data: { results?: Suggestion[] } = await res.json();
        setSuggestions(data.results ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        /* busca cancelada ou sem rede: o "adicionar novo" continua disponível */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, destinationId, onlyType]);

  const term = query.trim();
  const exact = suggestions.some((s) => s.name.toLowerCase() === term.toLowerCase());
  const options = [
    ...suggestions.map((s) => ({
      key: s.id,
      label: s.name,
      detail: [placeTypeLabels[s.type], s.city].filter(Boolean).join(" · "),
      pick: (): PickedPlace => ({
        value: encodeExisting(s.id),
        name: s.name,
        type: s.type,
        detail: s.city ?? undefined,
      }),
    })),
    ...(term.length >= 2 && !exact
      ? [
          {
            key: "novo",
            label: `Adicionar “${term}” como novo lugar`,
            detail: placeTypeLabels[onlyType ?? newType],
            pick: (): PickedPlace => ({
              value: encodeNew(onlyType ?? newType, term),
              name: term,
              type: onlyType ?? newType,
              detail: "novo",
            }),
          },
        ]
      : []),
  ];

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    const place = option.pick();
    update(
      single
        ? [place]
        : picked.some((p) => p.value === place.value) || picked.length >= max
          ? picked
          : [...picked, place],
    );
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  const listId = `${id}-lista`;
  const showList = open && term.length >= 2 && options.length > 0;
  const full = !single && picked.length >= max;

  return (
    <div className="space-y-2">
      <label htmlFor={`${id}-input`} className="block text-sm font-semibold text-tinta">
        {label} <span className="font-normal text-tinta-soft">(opcional)</span>
      </label>
      {hint && <p className="text-xs text-tinta-soft">{hint}</p>}

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Lugares escolhidos">
          {picked.map((p) => (
            <li
              key={p.value}
              className="inline-flex items-center gap-1.5 rounded-full bg-petroleo-100 py-1 pr-1 pl-3 text-sm text-petroleo"
            >
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {p.name}
              {p.detail === "novo" && <span className="text-xs text-tinta-soft">(novo)</span>}
              <input type="hidden" name={name} value={p.value} />
              <button
                type="button"
                onClick={() => update(picked.filter((x) => x.value !== p.value))}
                aria-label={`Remover ${p.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && !(single && picked.length) && (
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`${id}-input`}
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showList ? `${id}-op-${active}` : undefined}
              autoComplete="off"
              maxLength={120}
              value={query}
              placeholder={
                onlyType === "beach" ? "Digite o nome da praia…" : "Digite ou busque um lugar…"
              }
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length < 2) setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && options.length) {
                  e.preventDefault();
                  setOpen(true);
                  setActive((i) => (i + 1) % options.length);
                } else if (e.key === "ArrowUp" && options.length) {
                  e.preventDefault();
                  setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault(); // Enter escolhe o lugar, não envia o formulário
                  if (showList) choose(active);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              className="min-w-0 flex-1 rounded-xl border border-linha bg-white px-3.5 py-2.5 text-base focus:border-petroleo focus:outline-none"
            />
            {!onlyType && (
              <label className="flex items-center gap-1 text-xs text-tinta-soft">
                <span>Se for novo, é</span>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PlaceType)}
                  className="rounded-lg border border-linha bg-white px-2 py-2 text-xs text-tinta"
                >
                  {NEW_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {placeTypeLabels[t]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label="Sugestões de lugares"
            hidden={!showList}
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(10,42,55,0.5)] ring-1 ring-linha"
          >
            {options.map((o, i) => (
              <li
                key={o.key}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 aria-selected:bg-petroleo-100"
              >
                {o.key === "novo" ? (
                  <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-agua-700" />
                ) : (
                  <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-agua-700" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-tinta">{o.label}</span>
                  <span className="block truncate text-xs text-tinta-soft">{o.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
