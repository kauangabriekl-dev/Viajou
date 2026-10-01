"use client";

import { useActionState } from "react";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { StarInput } from "@/components/forms/StarInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createDestinationReview, createTip } from "@/lib/actions/destinations";
import { destinationStyles, monthLong, monthShort, tipTopics } from "@/lib/labels";

type Props = { destinationId: string; destinationName: string };

/** Avaliar o destino como um todo: nota, melhores meses, gasto por dia e relato. */
export function DestinationReviewForm({ destinationId, destinationName }: Props) {
  const [state, action] = useActionState(createDestinationReview, null);
  if (state?.ok) return <FormMessage state={state} />;
  const e = (f: string) => errorsFor(state, f);
  const thisYear = new Date().getFullYear();

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="destinationId" value={destinationId} />
      <StarInput
        name="rating"
        label={`Nota para ${destinationName}`}
        required
        errors={e("rating")}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">
          Em que meses você recomenda ir?{" "}
          <span className="font-normal text-tinta-soft">(opcional)</span>
        </legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {monthShort.map((m, i) => (
            <label
              key={m}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-linha text-sm font-medium has-checked:border-petroleo has-checked:bg-petroleo has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-agua"
            >
              <input type="checkbox" name="bestMonths" value={i + 1} className="sr-only" />
              <span aria-hidden="true">{m}</span>
              <span className="sr-only">{monthLong[i]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">
          {destinationName} é bom para…{" "}
          <span className="font-normal text-tinta-soft">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {destinationStyles.map((s) => (
            <label
              key={s.value}
              className="flex min-h-11 cursor-pointer items-center rounded-full border border-linha px-4 text-sm font-medium has-checked:border-petroleo has-checked:bg-petroleo has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-agua"
            >
              <input type="checkbox" name="styles" value={s.value} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="visitedMonth" label="Mês em que foi" optional errors={e("visitedMonth")}>
          <select id="visitedMonth" name="visitedMonth" defaultValue="" className={inputClass}>
            <option value="">—</option>
            {monthLong.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field id="visitedYear" label="Ano" optional errors={e("visitedYear")}>
          <input
            id="visitedYear"
            name="visitedYear"
            type="number"
            inputMode="numeric"
            min={1950}
            max={thisYear}
            placeholder={String(thisYear)}
            className={inputClass}
          />
        </Field>
        <Field
          id="dailyCost"
          label="Gasto por dia, por pessoa (R$)"
          optional
          errors={e("dailyCost")}
        >
          <input
            id="dailyCost"
            name="dailyCost"
            inputMode="decimal"
            placeholder="250"
            className={inputClass}
            aria-describedby={describedBy("dailyCost", e("dailyCost"))}
          />
        </Field>
      </div>

      <Field id="destination-review-body" label="Como foi?" errors={e("body")}>
        <textarea
          id="destination-review-body"
          name="body"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          placeholder="O que vale a pena, o que evitar, para quem você recomenda."
          aria-invalid={e("body") ? true : undefined}
          aria-describedby={describedBy("destination-review-body", e("body"))}
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…">Publicar avaliação</SubmitButton>
    </form>
  );
}

/** Dica por assunto: melhor época, café da manhã, onde comer, onde ficar, passeios, custo, transporte. */
export function TipForm({ destinationId, defaultTopic }: Props & { defaultTopic?: string }) {
  const [state, action] = useActionState(createTip, null);
  const e = (f: string) => errorsFor(state, f);

  return (
    <form action={action} className="space-y-5" noValidate key={state?.ok ? "enviado" : "novo"}>
      <input type="hidden" name="destinationId" value={destinationId} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">Sobre o quê?</legend>
        <div className="flex flex-wrap gap-2">
          {tipTopics.map((t) => (
            <label
              key={t.value}
              title={t.hint}
              className="flex min-h-11 cursor-pointer items-center rounded-full border border-linha px-4 text-sm font-medium has-checked:border-petroleo has-checked:bg-petroleo has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-agua"
            >
              <input
                type="radio"
                name="topic"
                value={t.value}
                defaultChecked={t.value === (defaultTopic ?? "cafe_da_manha")}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        {e("topic") && <p className="text-sm text-red-700">{e("topic")?.[0]}</p>}
      </fieldset>
      <Field id="tip-title" label="Título da dica" errors={e("title")}>
        <input
          id="tip-title"
          name="title"
          required
          maxLength={120}
          placeholder="Ex.: Padaria Colonial, o melhor café da manhã da cidade"
          aria-describedby={describedBy("tip-title", e("title"))}
          className={inputClass}
        />
      </Field>
      <Field id="tip-body" label="Detalhes" errors={e("body")}>
        <textarea
          id="tip-body"
          name="body"
          required
          minLength={10}
          maxLength={1500}
          rows={3}
          placeholder="Onde fica, quanto custa, melhor horário, o que pedir."
          aria-describedby={describedBy("tip-body", e("body"))}
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…">Publicar dica</SubmitButton>
    </form>
  );
}
