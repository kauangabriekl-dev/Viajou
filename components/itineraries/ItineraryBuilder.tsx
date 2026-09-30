"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { inputClass } from "@/components/forms/Field";
import { createItinerary } from "@/lib/actions/itineraries";
import { placeTypeLabels, travelTags, type TravelTag } from "@/lib/labels";
import type { Destination, Place } from "@/types/database";

type Stop = { key: string; placeId: string; customName: string; startTime: string; notes: string };
type Day = { key: string; title: string; description: string; stops: Stop[] };

const newStop = (): Stop => ({
  key: crypto.randomUUID(),
  placeId: "",
  customName: "",
  startTime: "",
  notes: "",
});
const newDay = (): Day => ({
  key: crypto.randomUUID(),
  title: "",
  description: "",
  stops: [newStop()],
});

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Props = {
  destinations: Pick<Destination, "id" | "name" | "state">[];
  places: Pick<Place, "id" | "name" | "type" | "destination_id">[];
};

/** Editor de roteiro: dias e paradas com reordenação por botões (acessível por teclado). */
export function ItineraryBuilder({ destinations, places }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<TravelTag[]>([]);
  const [days, setDays] = useState<Day[]>([newDay()]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const localPlaces = useMemo(
    () => places.filter((p) => !destinationId || p.destination_id === destinationId),
    [places, destinationId],
  );

  const updateDay = (i: number, patch: Partial<Day>) =>
    setDays(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const updateStop = (di: number, si: number, patch: Partial<Stop>) =>
    updateDay(di, { stops: days[di].stops.map((s, idx) => (idx === si ? { ...s, ...patch } : s)) });

  function submit() {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await createItinerary({
        title,
        description,
        destinationId,
        isPublic,
        tags,
        days: days.map((d) => ({
          title: d.title,
          description: d.description,
          stops: d.stops
            .filter((s) => s.placeId || s.customName.trim())
            .map((s) => ({
              placeId: s.placeId,
              customName: s.customName,
              startTime: s.startTime,
              notes: s.notes,
            })),
        })),
      });
      if (result.ok && result.data) {
        router.push(`/roteiros/${result.data.id}`);
      } else if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const errorFor = (key: string) => fieldErrors[key]?.[0];
  const iconButton =
    "rounded-full p-2 text-tinta-soft hover:bg-espuma hover:text-tinta disabled:opacity-30";

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="space-y-5 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha sm:p-6">
        <div className="space-y-1.5">
          <label htmlFor="it-title" className="text-sm font-semibold">
            Título
          </label>
          <input
            id="it-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            className={inputClass}
            placeholder="Ex.: Porto Seguro em 7 dias"
            aria-invalid={errorFor("title") ? true : undefined}
          />
          {errorFor("title") && (
            <p role="alert" className="text-sm text-red-700">
              {errorFor("title")}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="it-desc" className="text-sm font-semibold">
            Descrição <span className="font-normal text-tinta-soft">(opcional)</span>
          </label>
          <textarea
            id="it-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="it-dest" className="text-sm font-semibold">
              Destino <span className="font-normal text-tinta-soft">(opcional)</span>
            </label>
            <select
              id="it-dest"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione…</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}, {d.state}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-semibold">Visibilidade</legend>
            <div className="flex gap-2">
              {[
                { v: true, l: "Público" },
                { v: false, l: "Privado" },
              ].map((o) => (
                <label
                  key={o.l}
                  className="flex-1 cursor-pointer rounded-xl border border-linha px-3 py-2.5 text-center text-sm font-semibold has-checked:border-atlantico has-checked:bg-atlantico-100 has-checked:text-atlantico"
                >
                  <input
                    type="radio"
                    name="visibility"
                    className="sr-only"
                    checked={isPublic === o.v}
                    onChange={() => setIsPublic(o.v)}
                  />
                  {o.l}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">
            Estilo{" "}
            <span className="font-normal text-tinta-soft">
              (ajuda quem usa o &ldquo;Vou viajar&rdquo;)
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {travelTags.map((t) => (
              <label
                key={t.value}
                className="cursor-pointer rounded-full border border-linha px-3 py-1.5 text-sm has-checked:border-atlantico has-checked:bg-atlantico-100 has-checked:text-atlantico"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={tags.includes(t.value)}
                  onChange={(e) =>
                    setTags(
                      e.target.checked ? [...tags, t.value] : tags.filter((x) => x !== t.value),
                    )
                  }
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <ol className="space-y-6">
        {days.map((day, di) => (
          <li
            key={day.key}
            className="space-y-4 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha sm:p-6"
          >
            <div className="flex items-center gap-2">
              <h2 className="flex-1 text-xl font-extrabold">Dia {di + 1}</h2>
              <button
                type="button"
                className={iconButton}
                onClick={() => setDays(move(days, di, di - 1))}
                disabled={di === 0}
                aria-label={`Mover dia ${di + 1} para cima`}
              >
                <ArrowUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => setDays(move(days, di, di + 1))}
                disabled={di === days.length - 1}
                aria-label={`Mover dia ${di + 1} para baixo`}
              >
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => setDays(days.filter((_, i) => i !== di))}
                disabled={days.length === 1}
                aria-label={`Remover dia ${di + 1}`}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <input
              value={day.title}
              onChange={(e) => updateDay(di, { title: e.target.value })}
              maxLength={120}
              placeholder="Título do dia (ex.: Chegada e centro histórico)"
              aria-label={`Título do dia ${di + 1}`}
              className={inputClass}
            />

            <ol className="space-y-3">
              {day.stops.map((stop, si) => {
                const errKey = `days.${di}.stops.${si}`;
                return (
                  <li key={stop.key} className="space-y-2 rounded-2xl border border-linha p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-atlantico text-xs font-bold text-white">
                        {si + 1}
                      </span>
                      <input
                        type="time"
                        value={stop.startTime}
                        onChange={(e) => updateStop(di, si, { startTime: e.target.value })}
                        aria-label={`Horário da parada ${si + 1} do dia ${di + 1}`}
                        className="w-28 rounded-lg border border-linha px-2 py-1.5 text-sm"
                      />
                      <span className="flex-1" />
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => updateDay(di, { stops: move(day.stops, si, si - 1) })}
                        disabled={si === 0}
                        aria-label={`Mover parada ${si + 1} para cima`}
                      >
                        <ArrowUp aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() => updateDay(di, { stops: move(day.stops, si, si + 1) })}
                        disabled={si === day.stops.length - 1}
                        aria-label={`Mover parada ${si + 1} para baixo`}
                      >
                        <ArrowDown aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        onClick={() =>
                          updateDay(di, { stops: day.stops.filter((_, i) => i !== si) })
                        }
                        aria-label={`Remover parada ${si + 1}`}
                      >
                        <X aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={stop.placeId}
                        onChange={(e) => updateStop(di, si, { placeId: e.target.value })}
                        aria-label={`Lugar cadastrado da parada ${si + 1}`}
                        className={inputClass}
                      >
                        <option value="">Lugar cadastrado…</option>
                        {localPlaces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({placeTypeLabels[p.type]})
                          </option>
                        ))}
                      </select>
                      <input
                        value={stop.customName}
                        onChange={(e) => updateStop(di, si, { customName: e.target.value })}
                        maxLength={120}
                        placeholder="…ou escreva (ex.: Almoço na orla)"
                        aria-label={`Nome livre da parada ${si + 1}`}
                        className={inputClass}
                      />
                    </div>
                    <input
                      value={stop.notes}
                      onChange={(e) => updateStop(di, si, { notes: e.target.value })}
                      maxLength={500}
                      placeholder="Dica ou observação (opcional)"
                      aria-label={`Observação da parada ${si + 1}`}
                      className={inputClass}
                    />
                    {errorFor(errKey) && (
                      <p role="alert" className="text-sm text-red-700">
                        {errorFor(errKey)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={() => updateDay(di, { stops: [...day.stops, newStop()] })}
              disabled={day.stops.length >= 20}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-atlantico"
            >
              <Plus aria-hidden="true" className="h-4 w-4" /> Adicionar parada
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setDays([...days, newDay()])}
        disabled={days.length >= 30}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-linha py-4 font-bold text-atlantico hover:border-atlantico"
      >
        <Plus aria-hidden="true" className="h-5 w-5" /> Adicionar dia {days.length + 1}
      </button>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-atlantico px-6 py-3.5 font-bold text-white hover:bg-atlantico-900 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Salvando…" : "Salvar roteiro"}
      </button>
    </form>
  );
}
