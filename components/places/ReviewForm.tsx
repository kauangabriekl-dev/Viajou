"use client";

import { useActionState } from "react";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { StarInput } from "@/components/forms/StarInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { createReview } from "@/lib/actions/reviews";
import type { ReviewCategory } from "@/types/database";

/** Critérios variam por tipo de lugar (hotel: limpeza...; restaurante: comida...). */
export function ReviewForm({
  placeId,
  categories,
}: {
  placeId: string;
  categories: ReviewCategory[];
}) {
  const [state, action] = useActionState(createReview, null);
  if (state?.ok) return <FormMessage state={state} />;
  const body = errorsFor(state, "body");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={action}
      className="space-y-5 rounded-[var(--radius-card)] bg-white p-5 ring-1 ring-linha sm:p-6"
      noValidate
    >
      <h2 className="text-xl font-extrabold">Avaliar este lugar</h2>
      <input type="hidden" name="placeId" value={placeId} />
      <StarInput name="rating" label="Nota geral" required errors={errorsFor(state, "rating")} />
      {categories.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((c) => (
            <StarInput key={c.key} name={`score_${c.key}`} label={c.label} compact />
          ))}
        </div>
      )}
      <Field id="review-title" label="Título" optional>
        <input
          id="review-title"
          name="title"
          maxLength={120}
          className={inputClass}
          placeholder="Resuma sua experiência"
        />
      </Field>
      <Field id="review-body" label="Como foi?" errors={body}>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          aria-invalid={body ? true : undefined}
          aria-describedby={describedBy("review-body", body)}
          className={inputClass}
          placeholder="O que foi bom, o que poderia melhorar, dicas para quem vai."
        />
      </Field>
      <Field
        id="review-visited"
        label="Quando você foi?"
        optional
        errors={errorsFor(state, "visitedOn")}
      >
        <input
          id="review-visited"
          name="visitedOn"
          type="date"
          max={today}
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Publicando…">Publicar avaliação</SubmitButton>
    </form>
  );
}
