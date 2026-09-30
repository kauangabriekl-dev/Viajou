"use client";

import { useActionState, useState } from "react";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { StarInput } from "@/components/forms/StarInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createPost } from "@/lib/actions/posts";
import { placeTypeLabels, travelTags } from "@/lib/labels";
import type { Destination, Place } from "@/types/database";

type Props = {
  destinations: Pick<Destination, "id" | "name" | "state">[];
  places: Pick<Place, "id" | "name" | "type" | "destination_id">[];
  initialDestinationId?: string;
};

export function PostForm({ destinations, places, initialDestinationId = "" }: Props) {
  const [state, action] = useActionState(createPost, null);
  const [destinationId, setDestinationId] = useState(initialDestinationId);
  const e = (f: string) => errorsFor(state, f);
  const local = places.filter((p) => p.destination_id === destinationId);
  const hotels = local.filter((p) => p.type === "hotel");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-6" noValidate>
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
          {local.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                Lugares visitados <span className="font-normal text-tinta-soft">(opcional)</span>
              </legend>
              <div className="grid max-h-60 gap-1.5 overflow-y-auto rounded-xl border border-linha bg-white p-3 sm:grid-cols-2">
                {local.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="placeIds"
                      value={p.id}
                      className="accent-atlantico"
                    />
                    <span>
                      {p.name} <span className="text-tinta-soft">· {placeTypeLabels[p.type]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </>
      )}

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
              className="cursor-pointer rounded-full border border-linha bg-white px-3 py-1.5 text-sm has-checked:border-atlantico has-checked:bg-atlantico-100 has-checked:text-atlantico has-focus-visible:outline-3 has-focus-visible:outline-maracuja"
            >
              <input type="checkbox" name="tags" value={t.value} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…" className="w-full sm:w-auto">
        Publicar experiência
      </SubmitButton>
    </form>
  );
}
