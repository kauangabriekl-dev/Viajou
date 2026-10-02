"use client";

import { useKeptActionState } from "@/components/forms/useKeptActionState";
import { useState } from "react";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { StarInput } from "@/components/forms/StarInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { PlacePicker, type PickedPlace } from "@/components/posts/PlacePicker";
import { createPost } from "@/lib/actions/posts";
import { travelTags } from "@/lib/labels";
import type { Destination, Place } from "@/types/database";

type Props = {
  destinations: Pick<Destination, "id" | "name" | "state">[];
  places: Pick<Place, "id" | "name" | "type" | "destination_id">[];
  initialDestinationId?: string;
};

export function PostForm({ destinations, places, initialDestinationId = "" }: Props) {
  const { state: state, formAction: action, onReset } = useKeptActionState(createPost);
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const [beachTrip, setBeachTrip] = useState(false);
  const [visited, setVisited] = useState<PickedPlace[]>([]);
  const showBeachQuestions = beachTrip || visited.some((p) => p.type === "beach");
  const e = (f: string) => errorsFor(state, f);
  const local = places.filter((p) => p.destination_id === destinationId);
  const hotels = local.filter((p) => p.type === "hotel");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} onReset={onReset} className="space-y-6" noValidate>
      <Field
        id="body"
        label="Como foi a viagem?"
        errors={e("body")}
        hint="Ex.: Passei 7 dias em Porto Seguro e esse foi meu roteiro…"
      >
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          className={inputClass}
          aria-describedby={describedBy("body", e("body"), "hint")}
        />
      </Field>

      <ImageUploader name="photos" label="Fotos" max={10} withAlt errors={e("photos")} />

      <Field id="destinationId" label="Destino" optional errors={e("destinationId")}>
        <select
          id="destinationId"
          name="destinationId"
          value={destinationId}
          onChange={(ev) => setDestinationId(ev.target.value)}
          className={inputClass}
        >
          <option value="">Selecione…</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}, {d.state}
            </option>
          ))}
        </select>
      </Field>

      {destinationId && (
        <>
          {hotels.length > 0 && (
            <Field id="hotelPlaceId" label="Onde se hospedou" optional>
              <select id="hotelPlaceId" name="hotelPlaceId" defaultValue="" className={inputClass}>
                <option value="">Não informar</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </>
      )}

      <PlacePicker
        name="placeRefs"
        label="Lugares visitados"
        hint="Escreva ou busque. Se o lugar ainda não existir, ele é cadastrado e fica disponível para as próximas pessoas."
        destinationId={destinationId || undefined}
        onChange={setVisited}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="tripStart" label="Ida" optional errors={e("tripStart")}>
          <input id="tripStart" name="tripStart" type="date" max={today} className={inputClass} />
        </Field>
        <Field id="tripEnd" label="Volta" optional errors={e("tripEnd")}>
          <input
            id="tripEnd"
            name="tripEnd"
            type="date"
            max={today}
            className={inputClass}
            aria-describedby={describedBy("tripEnd", e("tripEnd"))}
          />
        </Field>
      </div>

      <Field
        id="spent"
        label="Quanto gastou no total (R$)"
        optional
        hint="Ajuda outras pessoas a planejar o orçamento."
        errors={e("spent")}
      >
        <input
          id="spent"
          name="spent"
          inputMode="decimal"
          placeholder="3.200,00"
          className={inputClass}
          aria-describedby={describedBy("spent", e("spent"), "hint")}
        />
      </Field>

      <StarInput name="rating" label="Nota da viagem" errors={e("rating")} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          Estilo da viagem <span className="font-normal text-tinta-soft">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {travelTags.map((t) => (
            <label
              key={t.value}
              className="cursor-pointer rounded-full border border-linha bg-white px-3 py-1.5 text-sm has-checked:border-petroleo has-checked:bg-petroleo-100 has-checked:text-petroleo has-focus-visible:outline-3 has-focus-visible:outline-agua"
            >
              <input
                type="checkbox"
                name="tags"
                value={t.value}
                className="sr-only"
                onChange={t.value === "praia" ? (ev) => setBeachTrip(ev.target.checked) : undefined}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {showBeachQuestions && (
        <fieldset className="space-y-5 rounded-[var(--radius-card)] bg-petroleo-100/60 p-5">
          <legend className="sr-only">Sobre as praias</legend>
          <p className="text-lg font-semibold text-petroleo">Sobre as praias</p>
          <PlacePicker
            name="beach_favorita"
            label="Qual praia você mais gostou?"
            destinationId={destinationId || undefined}
            onlyType="beach"
            single
          />
          <PlacePicker
            name="beach_recomenda"
            label="Qual praia você recomenda?"
            destinationId={destinationId || undefined}
            onlyType="beach"
            single
          />
          <PlacePicker
            name="beach_nao_voltaria"
            label="Qual praia você não voltaria?"
            hint="Seja justo: conte no relato o motivo."
            destinationId={destinationId || undefined}
            onlyType="beach"
            single
          />
        </fieldset>
      )}

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…" className="w-full sm:w-auto">
        Publicar experiência
      </SubmitButton>
    </form>
  );
}
