"use client";

import { useKeptActionState } from "@/components/forms/useKeptActionState";
import { LocationPicker } from "@/components/achados/LocationPicker";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createAchado } from "@/lib/actions/achados";
import { achadoCategories } from "@/lib/labels";

/** Postar um achadinho: foto, o que tem de especial e a localização exata. */
export function AchadoForm() {
  const { state: state, formAction: action, onReset } = useKeptActionState(createAchado);
  const e = (f: string) => errorsFor(state, f);

  return (
    <form action={action} onReset={onReset} className="space-y-6" noValidate>
      <Field id="title" label="Nome do achadinho" errors={e("title")}>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="Ex.: Prainha escondida depois das pedras"
          aria-describedby={describedBy("title", e("title"))}
          className={inputClass}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">Categoria</legend>
        {e("category") && (
          <p className="text-sm font-medium text-red-700" role="alert">
            {e("category")?.[0]}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {achadoCategories.map((c) => (
            <label
              key={c.value}
              className="flex min-h-11 cursor-pointer items-center rounded-full border border-linha px-4 text-sm font-medium has-checked:border-petroleo has-checked:bg-petroleo has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-agua"
            >
              <input type="radio" name="category" value={c.value} className="sr-only" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <ImageUploader name="photos" label="Fotos" max={5} withAlt errors={e("photos")} />
      <p className="-mt-3 text-xs text-tinta-soft">
        A localização gravada dentro das fotos (GPS) é apagada automaticamente antes de publicar.
      </p>

      <Field id="body" label="O que tem de especial?" errors={e("body")}>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Por que vale a pena ir, o que você encontrou lá."
          aria-describedby={describedBy("body", e("body"))}
          className={inputClass}
        />
      </Field>

      <Field
        id="tip"
        label="Dica para chegar"
        optional
        hint="Horário bom, se precisa de carro, onde estacionar, se paga entrada."
        errors={e("tip")}
      >
        <textarea
          id="tip"
          name="tip"
          maxLength={500}
          rows={2}
          className={inputClass}
          aria-describedby={describedBy("tip", e("tip"), "hint")}
        />
      </Field>

      <LocationPicker errors={e("latitude") ?? e("longitude")} />

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…" className="w-full sm:w-auto">
        Publicar achadinho
      </SubmitButton>
    </form>
  );
}
