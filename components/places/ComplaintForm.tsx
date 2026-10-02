"use client";

import { useKeptActionState } from "@/components/forms/useKeptActionState";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createComplaint } from "@/lib/actions/complaints";
import { complaintCategoryLabels } from "@/lib/labels";

export function ComplaintForm({ placeId }: { placeId: string }) {
  const { state: state, formAction: action, onReset } = useKeptActionState(createComplaint);
  const e = (f: string) => errorsFor(state, f);
  return (
    <form action={action} onReset={onReset} className="space-y-5" noValidate>
      <input type="hidden" name="placeId" value={placeId} />
      <Field id="category" label="Categoria" errors={e("category")}>
        <select
          id="category"
          name="category"
          required
          defaultValue=""
          className={inputClass}
          aria-describedby={describedBy("category", e("category"))}
        >
          <option value="" disabled>
            Escolha…
          </option>
          {Object.entries(complaintCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field id="title" label="Título" errors={e("title")}>
        <input
          id="title"
          name="title"
          required
          minLength={5}
          maxLength={120}
          className={inputClass}
          placeholder="Ex.: Cobrança em dobro na diária"
          aria-describedby={describedBy("title", e("title"))}
        />
      </Field>
      <Field
        id="description"
        label="O que aconteceu?"
        hint="Datas, valores e o que você já tentou resolver ajudam o estabelecimento a responder."
        errors={e("description")}
      >
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={4000}
          rows={7}
          className={inputClass}
          aria-describedby={describedBy("description", e("description"), "hint")}
        />
      </Field>
      <ImageUploader name="photos" label="Fotos" max={5} errors={e("photos")} />
      <p className="text-xs text-tinta-soft">
        Sua reclamação será pública, com seu username. Não inclua documentos, dados de cartão ou
        informações pessoais de terceiros.
      </p>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Enviando…">Publicar reclamação</SubmitButton>
    </form>
  );
}
